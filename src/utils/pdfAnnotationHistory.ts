import { useCallback, useRef, useState } from 'react';
import {
  exportCanvasAnnotation,
  StoredAnnotationPage,
} from './pdfIndexedDBStorage';
import { VectorAction } from './pdfVectorAnnotationStorage';

type HistoryEntry = {
  pageNumber: number;
  imageData: ImageData;
  vectorActionsBefore: VectorAction[];
  vectorActionsAfter: VectorAction[];
};

export function usePdfAnnotationHistory() {
  const pastRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const cachedPagesRef = useRef<Record<number, StoredAnnotationPage>>({});
  const vectorActionsRef = useRef<Record<number, VectorAction[]>>({});
  const dirtyPagesRef = useRef<Set<number>>(new Set());
  const drawingPagesRef = useRef<Set<number>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const syncAvailability = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const isDrawingActive = useCallback(() => {
    return drawingPagesRef.current.size > 0;
  }, []);

  const setPageDrawingActive = useCallback((pageNumber: number, active: boolean) => {
    if (active) {
      drawingPagesRef.current.add(pageNumber);
    } else {
      drawingPagesRef.current.delete(pageNumber);
    }
  }, []);

  const buildStoredPage = useCallback((
    pageNumber: number,
    width: number,
    height: number
  ): StoredAnnotationPage | null => {
    const base = cachedPagesRef.current[pageNumber];
    const actions = vectorActionsRef.current[pageNumber] ?? [];
    if (actions.length === 0 && !base?.rasterFallback) return null;

    return {
      width: base?.width ?? width,
      height: base?.height ?? height,
      actions,
      ...(base?.rasterFallback ? { rasterFallback: base.rasterFallback } : {}),
    };
  }, []);

  const registerCanvas = useCallback((pageNumber: number, canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasMapRef.current.set(pageNumber, canvas);
      return;
    }

    if (drawingPagesRef.current.has(pageNumber)) {
      return;
    }

    const existing = canvasMapRef.current.get(pageNumber);
    if (existing) {
      if (dirtyPagesRef.current.has(pageNumber)) {
        const exported = buildStoredPage(pageNumber, existing.width, existing.height);
        if (exported) cachedPagesRef.current[pageNumber] = exported;
        else delete cachedPagesRef.current[pageNumber];
      } else if (!cachedPagesRef.current[pageNumber]) {
        const exported = exportCanvasAnnotation(existing);
        if (exported) cachedPagesRef.current[pageNumber] = exported;
      }
    }
    canvasMapRef.current.delete(pageNumber);
  }, [buildStoredPage]);

  const getCachedPage = useCallback((pageNumber: number) => {
    const base = cachedPagesRef.current[pageNumber];
    if (!dirtyPagesRef.current.has(pageNumber)) return base ?? null;
    return buildStoredPage(pageNumber, base?.width ?? 0, base?.height ?? 0);
  }, [buildStoredPage]);

  const resetCache = useCallback((pages: Record<number, StoredAnnotationPage> = {}) => {
    cachedPagesRef.current = { ...pages };
    vectorActionsRef.current = Object.fromEntries(
      Object.entries(pages).map(([page, data]) => [page, data.actions])
    );
    dirtyPagesRef.current.clear();
    drawingPagesRef.current.clear();
  }, []);

  const markSaved = useCallback((pages?: Record<number, StoredAnnotationPage>) => {
    if (pages) {
      cachedPagesRef.current = { ...pages };
      vectorActionsRef.current = Object.fromEntries(
        Object.entries(pages).map(([page, data]) => [page, data.actions])
      );
    }
    dirtyPagesRef.current.clear();
    setIsDirty(false);
  }, []);

  const pushAction = useCallback((
    pageNumber: number,
    beforeSnapshot: ImageData,
    vectorAction?: VectorAction
  ) => {
    const actionsBefore = vectorActionsRef.current[pageNumber] ?? [];
    let actionsAfter = actionsBefore;
    if (vectorAction) {
      const canvas = canvasMapRef.current.get(pageNumber);
      let base = cachedPagesRef.current[pageNumber];
      if (!base && canvas) {
        base = { width: canvas.width, height: canvas.height, actions: [] };
        cachedPagesRef.current[pageNumber] = base;
      }
      const scaleX = canvas && base?.width ? base.width / canvas.width : 1;
      const scaleY = canvas && base?.height ? base.height / canvas.height : 1;
      const scaledAction: VectorAction = vectorAction.type === 'freehand'
        ? {
            ...vectorAction,
            points: vectorAction.points.map((point) => ({
              x: point.x * scaleX,
              y: point.y * scaleY,
            })),
          }
        : {
            ...vectorAction,
            start: { x: vectorAction.start.x * scaleX, y: vectorAction.start.y * scaleY },
            end: { x: vectorAction.end.x * scaleX, y: vectorAction.end.y * scaleY },
          };
      actionsAfter = [...actionsBefore, scaledAction];
      vectorActionsRef.current[pageNumber] = actionsAfter;
    }
    pastRef.current.push({
      pageNumber,
      imageData: beforeSnapshot,
      vectorActionsBefore: actionsBefore,
      vectorActionsAfter: actionsAfter,
    });
    futureRef.current = [];
    dirtyPagesRef.current.add(pageNumber);
    setIsDirty(true);
    syncAvailability();
  }, [syncAvailability]);

  const restoreSnapshot = useCallback((pageNumber: number, snapshot: ImageData) => {
    const canvas = canvasMapRef.current.get(pageNumber);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (
      snapshot.width !== canvas.width ||
      snapshot.height !== canvas.height
    ) {
      return null;
    }
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const applySnapshot = useCallback((pageNumber: number, snapshot: ImageData) => {
    const canvas = canvasMapRef.current.get(pageNumber);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (
      snapshot.width !== canvas.width ||
      snapshot.height !== canvas.height
    ) {
      return;
    }
    ctx.putImageData(snapshot, 0, 0);
    dirtyPagesRef.current.add(pageNumber);
  }, []);

  const undo = useCallback(() => {
    const entry = pastRef.current.pop();
    if (!entry) return;

    const current = restoreSnapshot(entry.pageNumber, entry.imageData);
    if (current) {
      futureRef.current.push({ ...entry, imageData: current });
    }
    applySnapshot(entry.pageNumber, entry.imageData);
    if (entry.vectorActionsBefore.length > 0) {
      vectorActionsRef.current[entry.pageNumber] = entry.vectorActionsBefore;
    } else {
      delete vectorActionsRef.current[entry.pageNumber];
    }
    syncAvailability();
  }, [applySnapshot, restoreSnapshot, syncAvailability]);

  const redo = useCallback(() => {
    const entry = futureRef.current.pop();
    if (!entry) return;

    const current = restoreSnapshot(entry.pageNumber, entry.imageData);
    if (current) {
      pastRef.current.push({ ...entry, imageData: current });
    }
    applySnapshot(entry.pageNumber, entry.imageData);
    if (entry.vectorActionsAfter.length > 0) {
      vectorActionsRef.current[entry.pageNumber] = entry.vectorActionsAfter;
    } else {
      delete vectorActionsRef.current[entry.pageNumber];
    }
    syncAvailability();
  }, [applySnapshot, restoreSnapshot, syncAvailability]);

  const clearAll = useCallback(() => {
    canvasMapRef.current.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    });
    cachedPagesRef.current = {};
    vectorActionsRef.current = {};
    dirtyPagesRef.current.clear();
    pastRef.current = [];
    futureRef.current = [];
    setIsDirty(true);
    syncAvailability();
  }, [syncAvailability]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    syncAvailability();
  }, [syncAvailability]);

  const exportAll = useCallback(() => {
    const pages: Record<number, StoredAnnotationPage> = { ...cachedPagesRef.current };

    canvasMapRef.current.forEach((canvas, pageNumber) => {
      const isDirtyPage = dirtyPagesRef.current.has(pageNumber);

      if (!isDirtyPage && pages[pageNumber]) {
        return;
      }

      if (isDirtyPage) {
        const vectorPage = buildStoredPage(pageNumber, canvas.width, canvas.height);
        if (vectorPage) pages[pageNumber] = vectorPage;
        else delete pages[pageNumber];
      } else if (!pages[pageNumber]) {
        const exported = exportCanvasAnnotation(canvas);
        if (exported) pages[pageNumber] = exported;
      }
    });

    return pages;
  }, [buildStoredPage]);

  return {
    registerCanvas,
    pushAction,
    undo,
    redo,
    clearAll,
    reset,
    resetCache,
    exportAll,
    getCachedPage,
    markSaved,
    isDrawingActive,
    setPageDrawingActive,
    canUndo,
    canRedo,
    isDirty,
  };
}

import { BoardKey } from './curriculumData';
import { topicalConfigs } from '../pages/topicalpagesdata';
import { withBase } from './routeBase';

export interface FavoriteSubject {
  subject: string;
  level: string;
  board: BoardKey;
}

export const FAVORITE_SUBJECTS_KEY = 'favoriteSubjects';

export function loadFavoriteSubjects(): FavoriteSubject[] {
  try {
    const stored = localStorage.getItem(FAVORITE_SUBJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteSubjects(subjects: FavoriteSubject[]): void {
  localStorage.setItem(FAVORITE_SUBJECTS_KEY, JSON.stringify(subjects));
  window.dispatchEvent(new CustomEvent('favoriteSubjectsUpdated'));
}

export const getLevelKey = (level: string) => (level.toLowerCase() === 'a-level' ? 'a-level' : 'igcse');

export function getSubjectPaths(subject: FavoriteSubject, base = '') {
  const levelKey = getLevelKey(subject.level);
  const pathBase = `${levelKey}/${subject.board}/${subject.subject}`;
  return {
    resources: withBase(base, `/curriculum/${pathBase}`),
    topicals: withBase(base, `/topicals/${pathBase}`),
    pastpapers: withBase(base, `/pastpapers/${pathBase}`),

  };
}

export function hasTopicalsForSubject(subject: FavoriteSubject): boolean {
  const levelKey = getLevelKey(subject.level);
  return topicalConfigs.some(
    (c) => c.level === levelKey && c.board === subject.board && c.subject === subject.subject
  );
}

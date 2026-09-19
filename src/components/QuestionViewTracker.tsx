import React, { useEffect, useRef } from 'react';
import { useQuestionXP } from '../hooks/useQuestionXP';

interface QuestionViewTrackerProps {
  questionId: string;
  isMCQ?: boolean;
  mcqAnswerSelected?: string | null;
  children: React.ReactNode;
}

export function QuestionViewTracker({
  questionId,
  isMCQ = false,
  mcqAnswerSelected = null,
  children
}: QuestionViewTrackerProps) {
  const { markQuestionSeen, markMSSeen } = useQuestionXP(questionId, isMCQ, mcqAnswerSelected);
  const containerRef = useRef<HTMLDivElement>(null);
  const observedElements = useRef<Set<Element>>(new Set());

  useEffect(() => {
    // Automatically mark question and MS as seen when component is rendered
    markQuestionSeen();
    markMSSeen();

    if (!containerRef.current) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.dataset.type === 'question') {
              markQuestionSeen();
            } else if (target.dataset.type === 'marking_scheme') {
              markMSSeen();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const observeNewElements = () => {
      if (!containerRef.current) return;
      const elements = containerRef.current.querySelectorAll('[data-type="question"], [data-type="marking_scheme"]');
      elements.forEach(el => {
        if (!observedElements.current.has(el)) {
          intersectionObserver.observe(el);
          observedElements.current.add(el);
        }
      });
    };

    observeNewElements();

    const mutationObserver = new MutationObserver(() => {
      observeNewElements();
    });

    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true
    });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
      observedElements.current.clear();
    };
  }, [markQuestionSeen, markMSSeen, questionId]);

  return (
    <div ref={containerRef} className="question-tracker-container w-full h-full flex flex-col">
      {children}
    </div>
  );
}

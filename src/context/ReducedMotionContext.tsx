import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

interface ReducedMotionContextType {
  isReducedMotion: boolean;
  setIsReducedMotion: (value: boolean) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType | undefined>(undefined);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage or system preference
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    const savedPreference = localStorage.getItem('prefers-reduced-motion');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    // Default to system preference if not set manually
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Apply changes to DOM and localStorage
  useEffect(() => {
    localStorage.setItem('prefers-reduced-motion', String(isReducedMotion));
    
    if (isReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [isReducedMotion]);

  // Listen for system preference changes if no manual preference is set?
  // Usually, if a user overrides it, we keep their override.

  return (
    <ReducedMotionContext.Provider value={{ isReducedMotion, setIsReducedMotion }}>
      <MotionConfig reducedMotion={isReducedMotion ? "always" : "never"}>
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  const context = useContext(ReducedMotionContext);
  if (context === undefined) {
    throw new Error('useReducedMotion must be used within a ReducedMotionProvider');
  }
  return context;
}

import { useEffect, useState } from 'react';
import {
  DEFAULT_SHORTCUT_PREFERENCES,
  getShortcutPreferences,
  getShortcutPreferencesEvent,
  type ShortcutPreferences,
} from '../utils/shortcutPreferences';

export const useShortcutPreferences = (): ShortcutPreferences => {
  const [preferences, setPreferences] = useState(getShortcutPreferences);

  useEffect(() => {
    const refreshPreferences = () => setPreferences(getShortcutPreferences());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'learnmates_shortcut_preferences') refreshPreferences();
    };

    window.addEventListener(getShortcutPreferencesEvent(), refreshPreferences);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(getShortcutPreferencesEvent(), refreshPreferences);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return { ...DEFAULT_SHORTCUT_PREFERENCES, ...preferences };
};

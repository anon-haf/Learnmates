export type ShortcutModifier = 'none' | 'ctrl' | 'shift' | 'ctrlShift';

export interface ShortcutBinding {
  key: string;
  modifier: ShortcutModifier;
}

export interface ShortcutPreferences {
  markComplete: ShortcutBinding;
  toggleMarkScheme: ShortcutBinding;
  toggleAnnotation: ShortcutBinding;
  toggleNonMcqSidebar: ShortcutBinding;
}

export const DEFAULT_SHORTCUT_PREFERENCES: ShortcutPreferences = {
  markComplete: { key: 'C', modifier: 'none' },
  toggleMarkScheme: { key: 'Q', modifier: 'none' },
  toggleAnnotation: { key: 'A', modifier: 'none' },
  toggleNonMcqSidebar: { key: 'P', modifier: 'none' },
};

const STORAGE_KEY = 'learnmates_shortcut_preferences';
const SHORTCUT_PREFERENCES_EVENT = 'learnmates-shortcut-preferences-change';

const isValidKey = (key: unknown): key is string =>
  typeof key === 'string' && /^[A-Z]$/.test(key);

const isValidModifier = (modifier: unknown): modifier is ShortcutModifier =>
  modifier === 'none' || modifier === 'ctrl' || modifier === 'shift' || modifier === 'ctrlShift';

const isValidBinding = (binding: unknown): binding is ShortcutBinding =>
  typeof binding === 'object' &&
  binding !== null &&
  'key' in binding &&
  'modifier' in binding &&
  isValidKey(binding.key) &&
  isValidModifier(binding.modifier);

const parseBinding = (binding: unknown): ShortcutBinding | null => {
  if (isValidBinding(binding)) return binding;
  if (isValidKey(binding)) return { key: binding, modifier: 'none' };
  return null;
};

const isValidPreferences = (preferences: unknown): preferences is ShortcutPreferences =>
  typeof preferences === 'object' &&
  preferences !== null &&
  'markComplete' in preferences &&
  'toggleMarkScheme' in preferences &&
  'toggleAnnotation' in preferences &&
  'toggleNonMcqSidebar' in preferences &&
  isValidBinding(preferences.markComplete) &&
  isValidBinding(preferences.toggleMarkScheme) &&
  isValidBinding(preferences.toggleAnnotation) &&
  isValidBinding(preferences.toggleNonMcqSidebar) &&
  !sameShortcut(preferences.markComplete, preferences.toggleMarkScheme) &&
  !sameShortcut(preferences.markComplete, preferences.toggleAnnotation) &&
  !sameShortcut(preferences.markComplete, preferences.toggleNonMcqSidebar) &&
  !sameShortcut(preferences.toggleMarkScheme, preferences.toggleAnnotation) &&
  !sameShortcut(preferences.toggleMarkScheme, preferences.toggleNonMcqSidebar) &&
  !sameShortcut(preferences.toggleAnnotation, preferences.toggleNonMcqSidebar);

export const sameShortcut = (first: ShortcutBinding, second: ShortcutBinding) =>
  first.key === second.key && first.modifier === second.modifier;

export const formatShortcut = ({ key, modifier }: ShortcutBinding) =>
  `${modifier === 'none' ? '' : `${modifier === 'ctrlShift' ? 'Ctrl + Shift' : modifier === 'ctrl' ? 'Ctrl' : 'Shift'} + `}${key}`;

export const getAriaShortcut = ({ key, modifier }: ShortcutBinding) =>
  `${modifier === 'none' ? '' : `${modifier === 'ctrlShift' ? 'Control+Shift' : modifier === 'ctrl' ? 'Control' : 'Shift'}+`}${key}`;

export const matchesShortcut = (event: KeyboardEvent, { key, modifier }: ShortcutBinding) => {
  const expectsCtrl = modifier === 'ctrl' || modifier === 'ctrlShift';
  const expectsShift = modifier === 'shift' || modifier === 'ctrlShift';
  return event.key.toUpperCase() === key &&
    event.ctrlKey === expectsCtrl &&
    event.shiftKey === expectsShift &&
    !event.altKey &&
    !event.metaKey;
};

export const getShortcutPreferences = (): ShortcutPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SHORTCUT_PREFERENCES;

    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'markComplete' in parsed &&
      'toggleMarkScheme' in parsed
    ) {
      const markComplete = parseBinding(parsed.markComplete);
      const toggleMarkScheme = parseBinding(parsed.toggleMarkScheme);
      const toggleAnnotation =
        'toggleAnnotation' in parsed
          ? parseBinding(parsed.toggleAnnotation)
          : getAvailableShortcut(
              DEFAULT_SHORTCUT_PREFERENCES.toggleAnnotation,
              [markComplete, toggleMarkScheme],
            );
      const preferences = {
        markComplete,
        toggleMarkScheme,
        toggleAnnotation,
        toggleNonMcqSidebar:
          'toggleNonMcqSidebar' in parsed
            ? parseBinding(parsed.toggleNonMcqSidebar)
            : getAvailableShortcut(DEFAULT_SHORTCUT_PREFERENCES.toggleNonMcqSidebar, [
                markComplete,
                toggleMarkScheme,
                toggleAnnotation,
              ]),
      };
      if (preferences.markComplete && preferences.toggleMarkScheme && isValidPreferences(preferences)) {
        return preferences;
      }
    }

    console.error('Saved shortcut preferences are invalid; using defaults.');
  } catch (error) {
    console.error('Failed to load shortcut preferences:', error);
  }

  return DEFAULT_SHORTCUT_PREFERENCES;
};

export const saveShortcutPreferences = (preferences: ShortcutPreferences) => {
  if (!isValidPreferences(preferences)) {
    throw new Error('Choose a different key and modifier combination for each shortcut.');
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(SHORTCUT_PREFERENCES_EVENT));
};

export const getShortcutPreferencesEvent = () => SHORTCUT_PREFERENCES_EVENT;

const getAvailableShortcut = (
  defaultBinding: ShortcutBinding,
  bindings: (ShortcutBinding | null)[],
): ShortcutBinding => {
  const existingBindings = bindings.filter(
    (binding): binding is ShortcutBinding => binding !== null,
  );
  if (!existingBindings.some(binding => sameShortcut(binding, defaultBinding))) {
    return defaultBinding;
  }

  const alternativeModifiers: ShortcutModifier[] = ['ctrl', 'shift', 'ctrlShift'];
  return {
    key: defaultBinding.key,
    modifier: alternativeModifiers.find(
      modifier =>
        !existingBindings.some(binding =>
          sameShortcut(binding, { key: defaultBinding.key, modifier }),
        ),
    ) ?? 'ctrl',
  };
};

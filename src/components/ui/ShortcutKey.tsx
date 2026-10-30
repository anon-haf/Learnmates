import type { HTMLAttributes } from 'react';

interface ShortcutKeyProps extends HTMLAttributes<HTMLElement> {
  children: string;
}

export const ShortcutKey = ({ children, className = '', ...props }: ShortcutKeyProps) => (
  <kbd
    aria-hidden="true"
    className={`hidden min-w-[1.5rem] items-center justify-center rounded-md border border-current/20 bg-black/5 px-1.5 py-0.5 text-xs font-semibold leading-none align-middle sm:inline-flex dark:bg-white/5 ${className}`}
    {...props}
  >
    {children}
  </kbd>
);

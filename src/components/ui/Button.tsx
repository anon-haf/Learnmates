import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      asChild = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-slate-100 text-black dark:text-white shadow-sm hover:bg-primary-400 active:bg-primary-800 dark:bg-slate-600 dark:hover:bg-primary-500 dark:active:bg-primary-400 hover:shadow-md',
      secondary:
        'bg-white text-slate-800 border border-slate-300 shadow-sm hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 dark:active:bg-slate-600 hover:shadow-sm',
      outline:
        'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/30 dark:active:bg-primary-900/50 hover:shadow-sm',
      ghost:
        'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-700 hover:shadow-sm',
      danger:
        'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 hover:shadow-md',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2',
      icon: 'h-10 w-10 rounded-lg',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    const isDisabled = disabled || loading;

    const Comp = asChild ? Slot : 'button';

    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], widthStyle, className))}
          disabled={isDisabled}
          aria-busy={loading}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], widthStyle, className))}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
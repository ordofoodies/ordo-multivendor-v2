'use client';

// Small, fully Tailwind-styled form kit for admin review/settings screens.
// Native elements on purpose: the global PrimeReact overrides in global.css
// strip borders and button styles from raw PrimeReact inputs.

import React from 'react';

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

// same look as CustomTextField (input-field)
const control =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 placeholder:text-gray-400 ' +
  'focus:border-gray-500 focus:shadow-none focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ' +
  'dark:border-dark-600 dark:bg-dark-900 dark:text-white dark:focus:ring-orange-900/40';

export const Field = ({
  label,
  hint,
  required,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cx('flex flex-col gap-1.5', className)}>
    <label htmlFor={htmlFor} className="text-sm font-[500] dark:text-white">
      {label}
      {required ? <span className="ms-0.5 text-red-500">*</span> : null}
    </label>
    {children}
    {hint ? <span className="text-xs leading-snug text-gray-500 dark:text-gray-400">{hint}</span> : null}
  </div>
);

export const TextInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input type="text" {...props} className={cx(control, className)} />
);

// number with optional prefix ("RD$") / suffix ("%", "km"); empty input becomes 0
export const NumberInput = ({
  value,
  onValueChange,
  prefix,
  suffix,
  min,
  max,
  step = 'any',
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'prefix'> & {
  value: number;
  onValueChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
}) => (
  <div className={cx('relative flex items-center', className)}>
    {prefix ? (
      <span className="pointer-events-none absolute start-2 text-sm text-gray-500">{prefix}</span>
    ) : null}
    <input
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const next = e.target.value === '' ? 0 : Number(e.target.value);
        if (Number.isFinite(next)) onValueChange(next);
      }}
      {...props}
      className={cx(control, prefix && 'ps-12', suffix && 'pe-10')}
    />
    {suffix ? (
      <span className="pointer-events-none absolute end-3 text-sm text-gray-500">{suffix}</span>
    ) : null}
  </div>
);

export const TextArea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={cx(control, 'h-auto min-h-24 py-2 leading-relaxed', className)} />
);

export const Select = ({
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) => (
  <select {...props} className={cx(control, 'pe-8', className)}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const Switch = ({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50',
      checked ? 'bg-primary-color' : 'bg-gray-300 dark:bg-dark-600'
    )}
  >
    <span
      className={cx(
        'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[22px] rtl:-translate-x-[22px]' : 'translate-x-0.5 rtl:-translate-x-0.5'
      )}
    />
  </button>
);

// a switch with a title, an explanation, and an on/off status line
export const SwitchRow = ({
  title,
  description,
  status,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description?: React.ReactNode;
  status?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div
    className={cx(
      'flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors',
      checked ? 'border-orange-200 bg-orange-50/60 dark:border-orange-900 dark:bg-orange-950/20' : 'border-gray-200 dark:border-dark-600'
    )}
  >
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
      {description ? <span className="text-xs leading-snug text-gray-500 dark:text-gray-400">{description}</span> : null}
      {status ? <span className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-200">{status}</span> : null}
    </div>
    <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
  </div>
);

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'danger-outline' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  // black, like the admin's other primary buttons (coupons, vendors...)
  primary: 'border border-gray-300 bg-black text-white hover:bg-gray-800 dark:border-dark-600',
  secondary:
    'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-900 dark:text-gray-100',
  success: 'bg-green-600 text-white hover:bg-green-700 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
  'danger-outline': 'border border-red-300 bg-white text-red-600 hover:bg-red-50 dark:bg-dark-900',
  ghost: 'border border-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-800',
};

export const ActionButton = ({
  variant = 'primary',
  loading,
  icon,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: string; // primeicons class, e.g. "pi pi-check"
}) => (
  <button
    type="button"
    {...props}
    disabled={disabled || loading}
    className={cx(
      'inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition',
      'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      className
    )}
  >
    {loading ? <i className="pi pi-spin pi-spinner text-sm" /> : icon ? <i className={cx(icon, 'text-sm')} /> : null}
    {children}
  </button>
);

type Tone = 'info' | 'success' | 'warning' | 'danger';
const TONES: Record<Tone, { box: string; icon: string }> = {
  info: { box: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100', icon: 'pi pi-info-circle' },
  success: { box: 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-100', icon: 'pi pi-check-circle' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100', icon: 'pi pi-exclamation-triangle' },
  danger: { box: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100', icon: 'pi pi-exclamation-circle' },
};

export const Callout = ({ tone = 'info', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) => (
  <div className={cx('flex items-start gap-3 rounded-lg border p-3 text-sm leading-snug', TONES[tone].box, className)}>
    <i className={cx(TONES[tone].icon, 'mt-0.5')} />
    <div className="flex-1">{children}</div>
  </div>
);

// numbered/titled group of fields with a one-line explanation
export const FormSection = ({
  step,
  title,
  description,
  children,
}: {
  step?: number;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-4">
    <div className="flex items-start gap-3">
      {step ? (
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-primary-color">
          {step}
        </span>
      ) : null}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description ? <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p> : null}
      </div>
    </div>
    <div className={cx('flex flex-col gap-4', step ? 'md:ps-9' : '')}>{children}</div>
  </section>
);

// footer row for dialogs: secondary on the left of primary, right-aligned
export const DialogActions = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4 dark:border-dark-600">{children}</div>
);

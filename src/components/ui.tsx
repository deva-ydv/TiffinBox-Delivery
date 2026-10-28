import {
  useEffect, useId, useRef,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';

/* ── Buttons ─────────────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-paper',
  ghost: 'text-ink hover:bg-brand-soft',
  danger: 'bg-chilli text-white hover:opacity-90',
};

/** Shared button styling, also used for router <Link>s that should look like buttons. */
export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-5 text-sm'
  } ${VARIANT_CLASS[variant]} ${extra}`;

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, type, ...rest }: ButtonProps) {
  return (
    <button type={type ?? 'button'} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...rest}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

/* ── Form fields ─────────────────────────────────────────────────────────── */

const fieldClass = (error?: string) =>
  `w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/70 ${
    error ? 'border-chilli' : 'border-line hover:border-muted/50'
  }`;

interface FieldMeta { label: string; error?: string; hint?: string }

function FieldShell({ id, label, error, hint, children }: FieldMeta & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-chilli">{error}</p>}
    </div>
  );
}

export function TextField({ label, error, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & FieldMeta) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest} className={`${fieldClass(error)} h-11`} />
    </FieldShell>
  );
}

export function TextArea({ label, error, hint, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMeta) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest} className={`${fieldClass(error)} min-h-24 py-2.5`} />
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & FieldMeta) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select id={id} aria-invalid={!!error} {...rest} className={`${fieldClass(error)} h-11`}>{children}</select>
    </FieldShell>
  );
}

/* ── Surfaces ────────────────────────────────────────────────────────────── */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-chilli/30 bg-chilli-soft px-6 py-8 text-center">
      <p className="font-medium text-chilli">Couldn't load this</p>
      <p className="mt-1 text-sm text-ink/80">{message}</p>
      {onRetry && <div className="mt-4 flex justify-center"><Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button></div>}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <Spinner /> <span className="text-sm">{label}</span>
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error'; children: ReactNode }) {
  const tones = {
    info: 'border-brand/20 bg-brand-soft text-ink',
    warn: 'border-turmeric/40 bg-turmeric-soft text-turmeric-ink',
    error: 'border-chilli/30 bg-chilli-soft text-chilli',
  };
  return <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

/* ── Status badges ───────────────────────────────────────────────────────── */

const BADGE_TONE: Record<string, string> = {
  PENDING: 'bg-turmeric-soft text-turmeric-ink',
  PREPARING: 'bg-brand-soft text-brand',
  OUT_FOR_DELIVERY: 'bg-brand text-white',
  DELIVERED: 'bg-line text-ink',
  CANCELLED: 'bg-chilli-soft text-chilli',
  ACTIVE: 'bg-brand-soft text-brand',
  PAUSED: 'bg-turmeric-soft text-turmeric-ink',
};

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONE[tone] ?? 'bg-line text-ink'}`}>
      {children}
    </span>
  );
}

/* ── Toggle chips & filter tabs ──────────────────────────────────────────── */

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`h-10 min-w-12 rounded-lg border px-3 text-sm font-medium transition-colors ${
        selected ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:bg-paper'
      }`}>
      {children}
    </button>
  );
}

export function FilterTabs<T extends string>({
  options, value, onChange, label,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-ink text-white' : 'text-muted hover:bg-line/60 hover:text-ink'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the effect (which would steal input focus).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-6 shadow-xl outline-none">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

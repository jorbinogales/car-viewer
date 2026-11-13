import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Check, LoaderCircle, type LucideIcon } from 'lucide-react';

export const ICON = { size: 20, strokeWidth: 1.5, 'aria-hidden': true } as const;

export function Button({
  variant = 'secondary', icon: Icon, children, busy, className = '', ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; icon?: LucideIcon; busy?: boolean }) {
  const ShownIcon = busy ? LoaderCircle : Icon;
  return (
    <button type="button" className={`btn btn-${variant} ${className}`} aria-busy={busy || undefined} {...rest}>
      {ShownIcon && <ShownIcon {...ICON} size={18} className={busy ? 'spin' : undefined} />}
      {children}
    </button>
  );
}

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return <h3 className="section-label" id={id}>{children}</h3>;
}

export function SwitchRow({
  label, description, checked, onChange, disabled, busy, help, icon: Icon,
}: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
  disabled?: boolean; busy?: boolean; help?: string; icon?: LucideIcon;
}) {
  const id = useId();
  const desc = help ?? description;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-l`}
      aria-describedby={desc ? `${id}-d` : undefined}
      aria-disabled={disabled || busy || undefined}
      aria-busy={busy || undefined}
      className={`switch-row${disabled ? ' is-disabled' : ''}`}
      onClick={() => !disabled && !busy && onChange(!checked)}
    >
      {Icon && <Icon {...ICON} className="switch-row-icon" />}
      <span className="switch-row-text">
        <span className="switch-row-label" id={`${id}-l`}>{label}</span>
        {desc && <span className="switch-row-desc" id={`${id}-d`}>{desc}</span>}
      </span>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb">{checked && <Check size={12} strokeWidth={2} />}</span>
      </span>
    </button>
  );
}

/** Radiogroup con navegación por flechas (roving tabindex). */
export function RadioGroup<T extends string>({
  label, options, value, onChange, disabled, className = 'option-list', itemClassName = 'option-row', render,
}: {
  label: string; options: { id: T; name: string }[]; value: T | null; onChange: (v: T) => void;
  disabled?: boolean; className?: string; itemClassName?: string;
  /** Contenido propio del ítem (sin la casilla de Check por defecto). */
  render?: (o: { id: T; name: string }, selected: boolean) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key) || disabled) return;
    e.preventDefault();
    const i = Math.max(0, options.findIndex((o) => o.id === value));
    const n = options.length;
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    onChange(options[j].id);
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[j]?.focus();
  };
  const focusIndex = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div role="radiogroup" aria-label={label} className={className} ref={ref} onKeyDown={onKey}>
      {options.map((o, i) => {
        const sel = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-disabled={disabled || undefined}
            tabIndex={i === focusIndex ? 0 : -1}
            aria-label={render ? o.name : undefined}
            className={`${itemClassName}${sel ? ' is-selected' : ''}`}
            onClick={() => !disabled && onChange(o.id)}
          >
            {render ? render(o, sel) : (
              <>
                <span className="option-label">{o.name}</span>
                <span className="check-slot" aria-hidden="true">{sel && <Check size={18} strokeWidth={2} />}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

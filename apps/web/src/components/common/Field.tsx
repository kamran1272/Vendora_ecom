import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

type FieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> & {
  label: string
  error?: string
  hint?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  (
    {
      label,
      error,
      hint,
      leadingIcon,
      trailingIcon,
      id,
      className = '',
      required,
      disabled,
      ...inputProps
    },
    ref,
  ) => {
    const inputId =
      id ||
      inputProps.name ||
      `field-${label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`

    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    const describedBy = [
      hint ? hintId : '',
      error ? errorId : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700"
        >
          <span>{label}</span>

          {required && (
            <span
              className="text-red-500"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>

        <div className="relative">
          {leadingIcon && (
            <span
              aria-hidden="true"
              className="
                pointer-events-none absolute left-3.5 top-1/2
                flex -translate-y-1/2 items-center
                text-slate-400
              "
            >
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`
              w-full rounded-xl border
              bg-white px-4 py-3
              text-sm text-slate-900
              placeholder:text-slate-400
              shadow-sm
              outline-none
              transition-all duration-200

              ${
                leadingIcon
                  ? 'pl-11'
                  : ''
              }

              ${
                trailingIcon
                  ? 'pr-11'
                  : ''
              }

              ${
                error
                  ? `
                    border-red-300
                    bg-red-50/30
                    focus:border-red-500
                    focus:ring-4
                    focus:ring-red-500/10
                  `
                  : `
                    border-slate-200
                    focus:border-[#1f2d4d]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[#1f2d4d]/10
                  `
              }

              ${
                disabled
                  ? `
                    cursor-not-allowed
                    bg-slate-100
                    text-slate-400
                    opacity-70
                  `
                  : ''
              }

              ${className}
            `}
            {...inputProps}
          />

          {trailingIcon && (
            <span
              className="
                absolute right-3.5 top-1/2
                flex -translate-y-1/2 items-center
                text-slate-400
              "
            >
              {trailingIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p
            id={hintId}
            className="mt-1.5 text-xs text-slate-500"
          >
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Field.displayName = 'Field'
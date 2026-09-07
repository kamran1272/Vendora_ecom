import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

type FormFieldProps = {
  label: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  children: ReactNode
}

export function FormField({ label, description, error, required = false, disabled = false, children }: FormFieldProps) {
  const fieldId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const descriptionId = `${fieldId}-description`
  const errorId = `${fieldId}-error`
  const describedBy = error ? errorId : description ? descriptionId : undefined
  const controlElement = isValidElement(children)
    ? (children as ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>)
    : null
  const control = controlElement
    ? cloneElement(controlElement, {
        id: controlElement.props.id || fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children

  return (
    <div className={`w-full ${disabled ? 'opacity-60' : ''}`}>
      <label htmlFor={fieldId} className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
        <span>{label}</span>{required ? <span className="text-rose-500" aria-hidden="true">*</span> : null}
      </label>
      {description && !error ? <p id={descriptionId} className="mb-2 text-xs text-slate-500">{description}</p> : null}
      {control}
      {error ? <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  )
}

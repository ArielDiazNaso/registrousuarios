import { forwardRef, useId, useMemo } from 'react';

const SELECT_SIZES = {
  sm: 'input-sm',
  md: '',
  lg: 'input-lg',
};

export const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    options = [],
    value,
    placeholder = 'Seleccione una opción',
    error,
    helperText,
    size = 'md',
    disabled = false,
    required = false,
    className = '',
    onChange,
    onBlur,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `${autoId}_${name || 'select'}`;

  const sizeCls = SELECT_SIZES[size] || '';
  const stateCls = error ? 'input-error' : '';
  const wrapperClasses = ['input-wrapper', sizeCls, stateCls, className]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <div className={wrapperClasses}>
        <select
          ref={ref}
          id={inputId}
          name={name}
          value={value ?? ''}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          onChange={onChange}
          onBlur={onBlur}
          className="input-control select-control"
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="select-caret" aria-hidden="true">
          ▾
        </span>
      </div>
      {error && (
        <p className="form-message form-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="form-message form-helper">{helperText}</p>
      )}
    </div>
  );
});

export default Select;

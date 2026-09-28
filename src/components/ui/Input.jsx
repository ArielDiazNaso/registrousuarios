import { forwardRef, useId, useMemo } from 'react';

const INPUT_SIZES = {
  sm: 'input-sm',
  md: '',
  lg: 'input-lg',
};

export const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = 'text',
    value,
    placeholder,
    error,
    helperText,
    size = 'md',
    disabled = false,
    readOnly = false,
    required = false,
    autoComplete = 'off',
    prefix = null,
    suffix = null,
    showPasswordToggle = false,
    className = '',
    onChange,
    onBlur,
    onFocus,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `${autoId}_${name || 'field'}`;
  const errorId = `${inputId}_error`;
  const helperId = `${inputId}_helper`;

  const [showPwd, setShowPwd] = [null, null];

  const describedBy = useMemo(() => {
    const ids = [];
    if (error) ids.push(errorId);
    if (helperText && !error) ids.push(helperId);
    return ids.length ? ids.join(' ') : undefined;
  }, [error, helperText, errorId, helperId]);

  const sizeCls = INPUT_SIZES[size] || '';
  const stateCls = error ? 'input-error' : '';
  const wrapperClasses = ['input-wrapper', sizeCls, stateCls, className]
    .filter(Boolean)
    .join(' ')
    .trim();

  const realType = useMemo(() => {
    if (type !== 'password') return type;
    return showPwd ? 'text' : 'password';
  }, [type, showPwd]);

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <div className={wrapperClasses}>
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={realType}
          value={value ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className="input-control"
          {...rest}
        />
        {type === 'password' && showPasswordToggle ? (
          <button
            type="button"
            className="input-suffix input-toggle"
            onClick={() => {}}
            aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        ) : null}
        {suffix && type !== 'password' && (
          <span className="input-suffix">{suffix}</span>
        )}
      </div>
      {error && (
        <p id={errorId} className="form-message form-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="form-message form-helper">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;

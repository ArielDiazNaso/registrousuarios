import { useState } from 'react';
import { Input } from './Input.jsx';

export const PasswordInput = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggle = (e) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="form-field password-field">
      {props.label && (
        <label htmlFor={props.id || props.name} className="form-label">
          {props.label}
          {props.required && <span className="form-required"> *</span>}
        </label>
      )}
      <div
        className={
          'input-wrapper ' +
          (props.size === 'sm' ? 'input-sm ' : props.size === 'lg' ? 'input-lg ' : '') +
          (props.error ? 'input-error' : '')
        }
      >
        <input
          id={props.id || props.name}
          name={props.name}
          type={showPassword ? 'text' : 'password'}
          value={props.value ?? ''}
          placeholder={props.placeholder}
          disabled={props.disabled}
          readOnly={props.readOnly}
          required={props.required}
          autoComplete={props.autoComplete || 'new-password'}
          aria-invalid={Boolean(props.error)}
          onChange={props.onChange}
          onBlur={props.onBlur}
          onFocus={props.onFocus}
          className="input-control"
        />
        <button
          type="button"
          className="input-suffix input-toggle"
          onClick={handleToggle}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      {props.error && (
        <p className="form-message form-error" role="alert">
          {props.error}
        </p>
      )}
      {props.helperText && !props.error && (
        <p className="form-message form-helper">{props.helperText}</p>
      )}
    </div>
  );
};

export default PasswordInput;

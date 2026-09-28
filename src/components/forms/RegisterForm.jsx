import { useMemo } from 'react';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { Input } from '../ui/Input.jsx';
import { PasswordInput } from '../ui/PasswordInput.jsx';
import { Button } from '../ui/Button.jsx';

const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const usernamePattern = /^[a-zA-Z0-9_.-]{3,50}$/;

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'none' };
  let score = 0;
  const tests = [
    { t: pwd.length >= 8 },
    { t: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
    { t: /\d/.test(pwd) },
    { t: /[^A-Za-z0-9]/.test(pwd) },
    { t: pwd.length >= 12 },
  ];
  score = tests.filter((x) => x.t).length;
  const map = [
    { score: 0, label: '', color: 'none' },
    { score: 1, label: 'Muy débil', color: 'danger' },
    { score: 2, label: 'Débil', color: 'warning' },
    { score: 3, label: 'Aceptable', color: 'primary' },
    { score: 4, label: 'Fuerte', color: 'success' },
    { score: 5, label: 'Excelente', color: 'success' },
  ];
  return map[score] || map[5];
};

const makeValidationSchema = (passwordConfirmRef) => ({
  first_name: {
    required: true,
    requiredMessage: 'El nombre es obligatorio.',
    minLength: 2,
    minLengthMessage: 'El nombre debe tener al menos 2 caracteres.',
    maxLength: 100,
    maxLengthMessage: 'El nombre no puede exceder 100 caracteres.',
  },
  last_name: {
    required: true,
    requiredMessage: 'El apellido es obligatorio.',
    minLength: 2,
    minLengthMessage: 'El apellido debe tener al menos 2 caracteres.',
    maxLength: 100,
    maxLengthMessage: 'El apellido no puede exceder 100 caracteres.',
  },
  username: {
    required: true,
    requiredMessage: 'El nombre de usuario es obligatorio.',
    pattern: usernamePattern,
    patternMessage: 'Solo letras, números, . _ - (3 a 50 caracteres).',
  },
  email: {
    required: true,
    requiredMessage: 'El correo electrónico es obligatorio.',
    pattern: emailPattern,
    patternMessage: 'Ingrese un correo electrónico válido.',
  },
  password: {
    required: true,
    requiredMessage: 'La contraseña es obligatoria.',
    minLength: 8,
    minLengthMessage: 'La contraseña debe tener al menos 8 caracteres.',
    maxLength: 128,
  },
  password_confirm: {
    required: true,
    requiredMessage: 'Confirma tu contraseña.',
    custom: (value, allValues) =>
      value === (passwordConfirmRef?.current || allValues.password) ||
      value === allValues.password
        ? true
        : 'Las contraseñas no coinciden.',
  },
  terms: {
    required: true,
    custom: (value) => (value === true ? true : 'Debes aceptar los términos y condiciones.'),
  },
});

const initialValues = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  terms: false,
};

export const RegisterForm = ({ onSuccess, onNavigateLogin }) => {
  const { register, loading: authLoading, clearError } = useAuth();
  const toast = useToast();
  const passwordConfirmRef = { current: '' };

  const validationSchema = useMemo(
    () => makeValidationSchema(passwordConfirmRef),
    []
  );

  const handleSubmit = async (values) => {
    clearError();
    const result = await register({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
    });

    if (result.success) {
      toast.success('Cuenta creada exitosamente.', {
        title: '¡Bienvenido!',
      });
      if (onSuccess) onSuccess(result.data);
      return result;
    }

    if (result.code === 'DUPLICATE_USER' || result.code === 'HTTP_409') {
      setFieldError('email', 'El email o usuario ya está en uso.');
      setFieldError('username', 'El email o usuario ya está en uso.');
    } else if (result.details) {
      Object.entries(result.details).forEach(([field, msg]) => {
        if (validationSchema[field]) {
          setFieldError(field, Array.isArray(msg) ? msg[0] : msg);
        }
      });
    } else {
      toast.error(result.message || 'No se pudo completar el registro.', {
        title: 'Error',
      });
    }
    return result;
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit: submitForm,
    setFieldError,
  } = useFormValidation(initialValues, validationSchema, handleSubmit);

  passwordConfirmRef.current = values.password;

  const loading = isSubmitting || authLoading;
  const strength = getPasswordStrength(values.password);

  return (
    <form
      className="form auth-form register-form"
      onSubmit={submitForm}
      noValidate
      aria-label="Formulario de registro"
    >
      <div className="form-grid form-grid-2">
        <Input
          name="first_name"
          label="Nombre"
          placeholder="Ej: María"
          value={values.first_name}
          error={touched.first_name ? errors.first_name : null}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="given-name"
          disabled={loading}
        />
        <Input
          name="last_name"
          label="Apellido"
          placeholder="Ej: González"
          value={values.last_name}
          error={touched.last_name ? errors.last_name : null}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="family-name"
          disabled={loading}
        />
      </div>

      <Input
        name="username"
        label="Nombre de Usuario"
        placeholder="ej: maria_gz"
        value={values.username}
        error={touched.username ? errors.username : null}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        autoComplete="username"
        disabled={loading}
      />

      <Input
        name="email"
        type="email"
        label="Correo Electrónico"
        placeholder="usuario@ejemplo.com"
        value={values.email}
        error={touched.email ? errors.email : null}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        autoComplete="email"
        disabled={loading}
      />

      <div className="form-grid form-grid-2">
        <div>
          <PasswordInput
            name="password"
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={values.password}
            error={touched.password ? errors.password : null}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="new-password"
            disabled={loading}
          />
          {values.password && (
            <div className="password-strength" aria-live="polite">
              <div className="password-strength-bar">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`password-strength-segment strength-${
                      i <= strength.score ? strength.color : 'empty'
                    }`}
                  />
                ))}
              </div>
              <span className={`password-strength-label strength-${strength.color}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>
        <PasswordInput
          name="password_confirm"
          label="Confirmar Contraseña"
          placeholder="Repite la contraseña"
          value={values.password_confirm}
          error={touched.password_confirm ? errors.password_confirm : null}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="new-password"
          disabled={loading}
        />
      </div>

      <div className="form-row form-options">
        <label className="checkbox-wrap">
          <input
            type="checkbox"
            name="terms"
            checked={values.terms}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            required
          />
          <span className="checkbox-label">
            Acepto los{' '}
            <a href="#/terms" className="link link-primary" target="_blank" rel="noreferrer">
              términos y condiciones
            </a>{' '}
            y la política de privacidad.
          </span>
        </label>
        {touched.terms && errors.terms && (
          <p className="form-message form-error" role="alert">
            {errors.terms}
          </p>
        )}
      </div>

      {submitError && (
        <div className="form-alert form-alert-error" role="alert">
          {submitError}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </Button>

      <p className="auth-footer">
        ¿Ya tienes una cuenta?{' '}
        {onNavigateLogin ? (
          <button
            type="button"
            className="link link-primary link-nowrap"
            onClick={onNavigateLogin}
            disabled={loading}
          >
            Inicia sesión aquí
          </button>
        ) : (
          <a href="#/login" className="link link-primary link-nowrap">
            Inicia sesión aquí
          </a>
        )}
      </p>
    </form>
  );
};

export default RegisterForm;

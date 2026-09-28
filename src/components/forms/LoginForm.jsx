import { useEffect } from 'react';
import { useFormValidation } from '../../hooks/useFormValidation.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { Input } from '../ui/Input.jsx';
import { PasswordInput } from '../ui/PasswordInput.jsx';
import { Button } from '../ui/Button.jsx';

const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const validationSchema = {
  email: {
    required: true,
    requiredMessage: 'El correo electrónico es obligatorio.',
    pattern: emailPattern,
    patternMessage: 'Ingrese un correo electrónico válido.',
  },
  password: {
    required: true,
    requiredMessage: 'La contraseña es obligatoria.',
    minLength: 6,
    minLengthMessage: 'La contraseña debe tener al menos 6 caracteres.',
  },
};

const initialValues = {
  email: '',
  password: '',
  remember: false,
};

export const LoginForm = ({ onSuccess, onNavigateRegister }) => {
  const { login, loading: authLoading, clearError } = useAuth();
  const toast = useToast();

  const handleSubmit = async (values) => {
    clearError();
    const result = await login({
      email: values.email.trim(),
      password: values.password,
    });

    if (result.success) {
      toast.success('¡Bienvenido de nuevo!', {
        title: 'Sesión iniciada',
      });
      if (onSuccess) onSuccess(result.data);
      return result;
    }

    if (result.code === 'INVALID_CREDENTIALS' || result.code === 'HTTP_422') {
      setFieldError('password', result.message || 'Credenciales inválidas.');
    } else if (result.code === 'MISSING_FIELDS' || result.code === 'HTTP_400') {
      setFieldError('email', result.message);
    } else {
      toast.error(result.message || 'No se pudo iniciar sesión.', {
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

  const loading = isSubmitting || authLoading;

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  return (
    <form
      className="form auth-form login-form"
      onSubmit={submitForm}
      noValidate
      aria-label="Formulario de inicio de sesión"
    >
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
        autoComplete="username"
        disabled={loading}
        helperText="Nunca compartiremos tu email."
      />

      <PasswordInput
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        value={values.password}
        error={touched.password ? errors.password : null}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        autoComplete="current-password"
        disabled={loading}
      />

      <div className="form-row form-options">
        <label className="checkbox-wrap">
          <input
            type="checkbox"
            name="remember"
            checked={values.remember}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="checkbox-label">Recordarme</span>
        </label>
        <a href="#/forgot-password" className="link link-muted link-sm">
          ¿Olvidaste tu contraseña?
        </a>
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
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>

      <p className="auth-footer">
        ¿No tienes una cuenta?{' '}
        {onNavigateRegister ? (
          <button
            type="button"
            className="link link-primary link-nowrap"
            onClick={onNavigateRegister}
            disabled={loading}
          >
            Regístrate aquí
          </button>
        ) : (
          <a href="#/register" className="link link-primary link-nowrap">
            Regístrate aquí
          </a>
        )}
      </p>
    </form>
  );
};

export default LoginForm;

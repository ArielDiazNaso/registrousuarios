import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useFormValidation } from '../hooks/useFormValidation.js';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { PasswordInput } from '../components/ui/PasswordInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { authService } from '../services/authService.js';

const timezoneOptions = [
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Ciudad de México' },
  { value: 'America/Bogota', label: '(UTC-05:00) Bogotá, Lima, Quito' },
  { value: 'America/Caracas', label: '(UTC-04:00) Caracas' },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
  { value: 'Europe/Madrid', label: '(UTC+01:00) Madrid' },
  { value: 'Europe/London', label: '(UTC+00:00) Londres' },
];

const localeOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

const profileSchema = {
  first_name: {
    required: true,
    requiredMessage: 'El nombre es obligatorio.',
    minLength: 2,
  },
  last_name: {
    required: true,
    requiredMessage: 'El apellido es obligatorio.',
    minLength: 2,
  },
  phone_number: {
    pattern: /^[+0-9\s\-()]{0,20}$/,
    patternMessage: 'Formato de teléfono inválido.',
  },
  biography: {
    maxLength: 500,
    maxLengthMessage: 'Máximo 500 caracteres.',
  },
};

const passwordSchema = {
  currentPassword: {
    required: true,
    requiredMessage: 'Ingresa tu contraseña actual.',
    minLength: 6,
  },
  newPassword: {
    required: true,
    requiredMessage: 'Ingresa la nueva contraseña.',
    minLength: 8,
    minLengthMessage: 'Mínimo 8 caracteres.',
  },
  confirmPassword: {
    required: true,
    requiredMessage: 'Confirma la nueva contraseña.',
    custom: (val, all) =>
      val === all.newPassword ? true : 'No coincide con la nueva contraseña.',
  },
};

const emptyProfile = {
  first_name: '',
  last_name: '',
  phone_number: '',
  timezone: 'UTC',
  locale: 'es',
  biography: '',
};

const emptyPasswords = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const profile = useFormValidation(emptyProfile, profileSchema, async (values) => {
    try {
      const res = await authService.updateProfile(user?.user_id, values);
      if (res.success) {
        updateUser(res.data);
        toast.success('Perfil actualizado correctamente.', { title: '¡Guardado!' });
      } else {
        toast.error(res.message || 'No se pudo actualizar el perfil.', { title: 'Error' });
      }
      return res;
    } catch (err) {
      toast.error('Error inesperado.', { title: 'Error' });
      return { success: false, error: err };
    }
  });

  const password = useFormValidation(emptyPasswords, passwordSchema, async (values) => {
    try {
      const res = await authService.changePassword(user?.user_id, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (res.success) {
        toast.success('Contraseña actualizada correctamente.', { title: 'Seguridad' });
        password.resetForm();
      } else {
        toast.error(res.message || 'No se pudo actualizar la contraseña.', { title: 'Error' });
      }
      return res;
    } catch (err) {
      toast.error('Error inesperado.', { title: 'Error' });
      return { success: false, error: err };
    }
  });

  useEffect(() => {
    if (!user) return;
    const next = {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      timezone: user.timezone || 'UTC',
      locale: user.locale || 'es',
      biography: user.biography || '',
    };
    profile.setValues(next);
  }, [user?.user_id]);

  return (
    <div className="profile-view view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Mi Perfil</h1>
          <p className="view-subtitle">Gestiona tus datos personales y seguridad.</p>
        </div>
      </header>

      <div className="profile-grid">
        <Card title="Información Personal" subtitle="Datos básicos de tu cuenta">
          <form className="form" onSubmit={profile.handleSubmit} noValidate>
            <div className="form-grid form-grid-2">
              <Input
                name="first_name"
                label="Nombre"
                value={profile.values.first_name}
                error={profile.touched.first_name ? profile.errors.first_name : null}
                onChange={profile.handleChange}
                onBlur={profile.handleBlur}
                required
                disabled={profile.isSubmitting}
              />
              <Input
                name="last_name"
                label="Apellido"
                value={profile.values.last_name}
                error={profile.touched.last_name ? profile.errors.last_name : null}
                onChange={profile.handleChange}
                onBlur={profile.handleBlur}
                required
                disabled={profile.isSubmitting}
              />
            </div>

            <div className="form-grid form-grid-2">
              <Input
                name="phone_number"
                label="Teléfono"
                placeholder="+34 600 000 000"
                value={profile.values.phone_number}
                error={profile.touched.phone_number ? profile.errors.phone_number : null}
                onChange={profile.handleChange}
                onBlur={profile.handleBlur}
                disabled={profile.isSubmitting}
              />
              <Select
                name="timezone"
                label="Zona Horaria"
                options={timezoneOptions}
                value={profile.values.timezone}
                onChange={profile.handleChange}
                onBlur={profile.handleBlur}
                disabled={profile.isSubmitting}
              />
            </div>

            <Select
              name="locale"
              label="Idioma"
              options={localeOptions}
              value={profile.values.locale}
              onChange={profile.handleChange}
              onBlur={profile.handleBlur}
              disabled={profile.isSubmitting}
            />

            <div className="form-field">
              <label className="form-label">Biografía</label>
              <textarea
                name="biography"
                className="input-control textarea-control"
                rows={4}
                placeholder="Cuéntanos sobre ti..."
                value={profile.values.biography}
                onChange={profile.handleChange}
                onBlur={profile.handleBlur}
                disabled={profile.isSubmitting}
              />
              <div className="form-field-foot">
                {profile.touched.biography && profile.errors.biography ? (
                  <p className="form-message form-error">{profile.errors.biography}</p>
                ) : (
                  <p className="form-message form-helper">
                    {profile.values.biography.length}/500 caracteres
                  </p>
                )}
              </div>
            </div>

            <div className="form-actions form-actions-right">
              <Button
                type="button"
                variant="ghost"
                onClick={profile.resetForm}
                disabled={profile.isSubmitting}
              >
                Deshacer cambios
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={profile.isSubmitting}
                disabled={profile.isSubmitting}
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>

        <Card
          title="Seguridad"
          subtitle="Cambia tu contraseña periódicamente para proteger tu cuenta."
        >
          <form className="form" onSubmit={password.handleSubmit} noValidate>
            <PasswordInput
              name="currentPassword"
              label="Contraseña Actual"
              value={password.values.currentPassword}
              error={password.touched.currentPassword ? password.errors.currentPassword : null}
              onChange={password.handleChange}
              onBlur={password.handleBlur}
              required
              autoComplete="current-password"
              disabled={password.isSubmitting}
            />
            <PasswordInput
              name="newPassword"
              label="Nueva Contraseña"
              value={password.values.newPassword}
              error={password.touched.newPassword ? password.errors.newPassword : null}
              onChange={password.handleChange}
              onBlur={password.handleBlur}
              required
              autoComplete="new-password"
              disabled={password.isSubmitting}
              helperText="Mínimo 8 caracteres. Incluye mayúsculas, números y símbolos."
            />
            <PasswordInput
              name="confirmPassword"
              label="Confirmar Nueva Contraseña"
              value={password.values.confirmPassword}
              error={password.touched.confirmPassword ? password.errors.confirmPassword : null}
              onChange={password.handleChange}
              onBlur={password.handleBlur}
              required
              autoComplete="new-password"
              disabled={password.isSubmitting}
            />

            <div className="form-actions form-actions-right">
              <Button type="submit" variant="primary" loading={password.isSubmitting}>
                Actualizar contraseña
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

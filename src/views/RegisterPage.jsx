import { Card } from '../components/ui/Card.jsx';
import { RegisterForm } from '../components/forms/RegisterForm.jsx';

export const RegisterPage = ({ onNavigateLogin, onSuccess }) => {
  return (
    <div className="auth-page">
      <div className="auth-page-left" aria-hidden="true">
        <div className="auth-hero">
          <div className="auth-hero-logo">🚀</div>
          <h1 className="auth-hero-title">Crea tu cuenta</h1>
          <p className="auth-hero-subtitle">
            Únete a UserHub en segundos <br />
            y empieza a gestionar tu equipo.
          </p>
          <ul className="auth-features">
            <li>🛡️ Contraseñas con hashing Bcrypt</li>
            <li>📧 Verificación de correo electrónico</li>
            <li>👥 Gestión multi-rol de equipos</li>
            <li>📈 Dashboard analítico incluido</li>
            <li>🔒 Cumplimiento con normativas de privacidad</li>
          </ul>
        </div>
      </div>
      <div className="auth-page-right auth-page-right-lg">
        <Card className="auth-card auth-card-wide">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Crear cuenta nueva</h2>
            <p className="auth-card-subtitle">
              Completa el formulario para registrarte.
            </p>
          </div>
          <RegisterForm onSuccess={onSuccess} onNavigateLogin={onNavigateLogin} />
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

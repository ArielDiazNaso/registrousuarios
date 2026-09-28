import { Card } from '../components/ui/Card.jsx';
import { LoginForm } from '../components/forms/LoginForm.jsx';

export const LoginPage = ({ onNavigateRegister, onSuccess }) => {
  return (
    <div className="auth-page">
      <div className="auth-page-left" aria-hidden="true">
        <div className="auth-hero">
          <div className="auth-hero-logo">🔐</div>
          <h1 className="auth-hero-title">UserHub</h1>
          <p className="auth-hero-subtitle">
            Sistema de Gestión de Usuarios <br />
            Seguro, escalable y moderno.
          </p>
          <ul className="auth-features">
            <li>✅ Autenticación robusta con tokens JWT</li>
            <li>✅ Roles y permisos granular (RBAC)</li>
            <li>✅ Auditoría y logs completos</li>
            <li>✅ Modo claro / oscuro</li>
            <li>✅ Diseño 100% responsive</li>
          </ul>
        </div>
      </div>
      <div className="auth-page-right">
        <Card className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Iniciar Sesión</h2>
            <p className="auth-card-subtitle">
              Accede a tu cuenta para continuar.
            </p>
            <div className="auth-demo-hint" role="note">
              💡 Demo: usa <strong>demo@example.com</strong> y cualquier contraseña ≥6 caracteres.
            </div>
          </div>
          <LoginForm onSuccess={onSuccess} onNavigateRegister={onNavigateRegister} />
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

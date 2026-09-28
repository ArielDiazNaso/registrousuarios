import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';

export const HomePage = ({ onChooseRouter, onChooseState }) => {
  return (
    <div className="home-view view">
      <section className="home-hero">
        <div className="home-hero-badge">Full-Stack React + SQL</div>
        <h1 className="home-hero-title">
          Sistema de Gestión de Usuarios
        </h1>
        <p className="home-hero-subtitle">
          Dos arquitecturas de navegación, una misma lógica central robusta.
        </p>
      </section>

      <section className="home-cards-grid">
        <Card
          title="Sistema A"
          subtitle="Navegación con React Router v6"
          className="system-card"
          headerRight={<span className="badge badge-info">Production-Ready</span>}
        >
          <ul className="feature-list">
            <li>📁 Rutas públicas, privadas y protegidas</li>
            <li>🧭 History API y URL amigables</li>
            <li>🛡️ HOC <code>ProtectedRoute</code></li>
            <li>🔗 Enlaces declarativos <code>&lt;Link&gt;</code></li>
            <li>🔀 Soporta nested routes y layouts</li>
            <li>🎯 Compatible con SSR / SEO</li>
          </ul>
          <div className="card-actions">
            <Button size="lg" block variant="primary" onClick={onChooseRouter}>
              Entrar con React Router →
            </Button>
          </div>
        </Card>

        <Card
          title="Sistema B"
          subtitle="Navegación por useState (renderizado condicional)"
          className="system-card"
          headerRight={<span className="badge badge-warning">State-Driven</span>}
        >
          <ul className="feature-list">
            <li>🎛️ Control 100% explícito del árbol de componentes</li>
            <li>📦 Sin dependencias externas de routing</li>
            <li>🔀 Transiciones personalizables entre vistas</li>
            <li>📱 Ideal para modos kiosco / SPAs cerradas</li>
            <li>🧪 Fácil de mockear y testear</li>
            <li>⚡ Menor overhead en bundle size</li>
          </ul>
          <div className="card-actions">
            <Button size="lg" block variant="secondary" onClick={onChooseState}>
              Entrar con useState →
            </Button>
          </div>
        </Card>
      </section>

      <Card title="¿Qué incluye el sistema?" className="features-summary">
        <div className="features-grid">
          <div className="feature-block">
            <span className="feature-block-icon">🗄️</span>
            <h4>Base de Datos SQL 3NF</h4>
            <p>11 tablas normalizadas: usuarios, perfiles, roles, permisos, sesiones, auditoría, históricos con constraints e índices.</p>
          </div>
          <div className="feature-block">
            <span className="feature-block-icon">🔐</span>
            <h4>Autenticación Segura</h4>
            <p>Context API + localStorage + token simulado con expiración, refresh token, interceptors Axios y manejo de 401.</p>
          </div>
          <div className="feature-block">
            <span className="feature-block-icon">✅</span>
            <h4>Validaciones Sólidas</h4>
            <p>Custom hook <code>useFormValidation</code> con reglas por campo, validación en tiempo real, errores de API en campos.</p>
          </div>
          <div className="feature-block">
            <span className="feature-block-icon">🌓</span>
            <h4>Dark Mode</h4>
            <p>Cambio de tema nativo con detección de preferencia del sistema y persistencia localStorage.</p>
          </div>
          <div className="feature-block">
            <span className="feature-block-icon">📱</span>
            <h4>Diseño Responsive</h4>
            <p>Mobile-first con sidebar colapsable, grid flexible y breakpoints optimizados móvil / tablet / desktop.</p>
          </div>
          <div className="feature-block">
            <span className="feature-block-icon">🧩</span>
            <h4>Atomic Design</h4>
            <p>Componentes UI reutilizables (Button, Input, Card, Modal, Toast, Spinner, Skeleton) y formularios composables.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;

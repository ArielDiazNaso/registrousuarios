import { useState } from 'react';
import { BrowserRouter as RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { HomePage } from './views/HomePage.jsx';
import { AppRouter } from './router/AppRouter.jsx';
import { StateSystem } from './components/StateSystem.jsx';
import { useToast } from './hooks/useToast.js';

const SYSTEM_KEY = 'selected_system';
const SYSTEMS = {
  ROUTER: 'router',
  STATE: 'state',
  HOME: 'home',
};

const getInitialSystem = () => {
  try {
    const stored = localStorage.getItem(SYSTEM_KEY);
    if (stored && Object.values(SYSTEMS).includes(stored)) return stored;
  } catch (_) {
    /* ignore */
  }
  return SYSTEMS.HOME;
};

const SystemChoiceLayer = ({ onChooseRouter, onChooseState, onHome }) => {
  const toast = useToast();
  return (
    <Layout activeView="home" onNavigate={onHome}>
      <HomePage
        onChooseRouter={() => {
          onChooseRouter();
          toast.success('Navegación React Router activada.', {
            title: 'Sistema A listo',
          });
        }}
        onChooseState={() => {
          onChooseState();
          toast.success('Navegación por useState activada.', {
            title: 'Sistema B listo',
          });
        }}
      />
    </Layout>
  );
};

const RouterEntry = () => {
  return (
    <RouterProvider>
      <AppRouter />
    </RouterProvider>
  );
};

const AppProviders = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
);

const App = () => {
  const [system, setSystem] = useState(getInitialSystem);

  const persist = (s) => {
    setSystem(s);
    try {
      localStorage.setItem(SYSTEM_KEY, s);
    } catch (_) {
      /* ignore */
    }
  };

  const chooseRouter = () => persist(SYSTEMS.ROUTER);
  const chooseState = () => persist(SYSTEMS.STATE);
  const goHome = () => persist(SYSTEMS.HOME);

  return (
    <AppProviders>
      <div className="app-root" data-selected-system={system}>
        {system === SYSTEMS.HOME && (
          <SystemChoiceLayer
            onChooseRouter={chooseRouter}
            onChooseState={chooseState}
            onHome={goHome}
          />
        )}
        {system === SYSTEMS.ROUTER && <RouterEntry />}
        {system === SYSTEMS.STATE && <StateSystem />}

        <footer className="app-system-switch">
          <span className="system-switch-label">Arquitectura activa:</span>
          <button
            type="button"
            className={`system-switch-chip ${system === SYSTEMS.ROUTER ? 'chip-active' : ''}`}
            onClick={chooseRouter}
            aria-pressed={system === SYSTEMS.ROUTER}
          >
            Sistema A · Router
          </button>
          <button
            type="button"
            className={`system-switch-chip ${system === SYSTEMS.STATE ? 'chip-active' : ''}`}
            onClick={chooseState}
            aria-pressed={system === SYSTEMS.STATE}
          >
            Sistema B · useState
          </button>
          <button
            type="button"
            className={`system-switch-chip chip-secondary ${
              system === SYSTEMS.HOME ? 'chip-active' : ''
            }`}
            onClick={goHome}
            aria-pressed={system === SYSTEMS.HOME}
          >
            Home
          </button>
        </footer>
      </div>
    </AppProviders>
  );
};

export default App;

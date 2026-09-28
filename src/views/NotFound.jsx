import { Button } from '../components/ui/Button.jsx';

export const NotFound = ({ onGoHome }) => {
  return (
    <div className="not-found view">
      <div className="not-found-inner">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Página no encontrada</h1>
        <p className="not-found-subtitle">
          La ruta que buscas no existe o fue movida.
        </p>
        {onGoHome && (
          <Button variant="primary" size="lg" onClick={onGoHome}>
            Volver al inicio
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFound;

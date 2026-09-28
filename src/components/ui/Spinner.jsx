import { useId } from 'react';

export const Spinner = ({ size = 'md', label = 'Cargando...', className = '' }) => {
  const id = useId();
  const sizeCls = `spinner-${size}`;
  return (
    <div
      className={`spinner ${sizeCls} ${className}`.trim()}
      role="status"
      aria-labelledby={id}
    >
      <span className="spinner-ring" />
      {label && (
        <span id={id} className="spinner-label">
          {label}
        </span>
      )}
    </div>
  );
};

export const Skeleton = ({ width = '100%', height = '1.25rem', className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`.trim()}
          style={{ width, height }}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`.trim()} aria-hidden="true">
      <div className="skeleton-card-top">
        <Skeleton width="80px" height="80px" className="skeleton-circle" />
        <div className="skeleton-card-text">
          <Skeleton width="70%" height="1.5rem" />
          <Skeleton width="50%" height="1rem" />
        </div>
      </div>
      <Skeleton width="100%" height="1rem" count={3} />
    </div>
  );
};

export default Spinner;

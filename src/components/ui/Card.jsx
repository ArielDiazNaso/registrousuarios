import { forwardRef } from 'react';

export const Card = forwardRef(function Card(
  { title = null, subtitle = null, footer = null, children, className = '', headerRight = null, ...rest },
  ref
) {
  return (
    <div ref={ref} className={`card ${className}`.trim()} {...rest}>
      {(title || headerRight) && (
        <header className="card-header">
          <div className="card-header-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerRight && <div className="card-header-right">{headerRight}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
      {footer && <footer className="card-footer">{footer}</footer>}
    </div>
  );
});

export const StatCard = ({ label, value, icon = null, trend = null, accent = 'primary', className = '' }) => {
  return (
    <div className={`card stat-card stat-${accent} ${className}`.trim()}>
      <div className="stat-card-inner">
        <div className="stat-info">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
          {trend && <span className={`stat-trend stat-trend-${trend.direction}`}>{trend.label}</span>}
        </div>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
    </div>
  );
};

export default Card;

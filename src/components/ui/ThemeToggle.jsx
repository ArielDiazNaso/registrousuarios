import { useTheme } from '../../hooks/useTheme.js';
import { Button } from './Button.jsx';

export const ThemeToggle = ({ showLabel = false, size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      leftIcon={<span className="theme-toggle-icon">{isDark ? '🌙' : '☀️'}</span>}
    >
      {showLabel && (isDark ? 'Oscuro' : 'Claro')}
    </Button>
  );
};

export default ThemeToggle;

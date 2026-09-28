import { forwardRef, useMemo } from 'react';

const VARIANTS = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  success: 'btn btn-success',
  danger: 'btn btn-danger',
  warning: 'btn btn-warning',
  ghost: 'btn btn-ghost',
  outline: 'btn btn-outline',
  link: 'btn btn-link',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  block: 'btn-block',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    block = false,
    leftIcon = null,
    rightIcon = null,
    className = '',
    children,
    type = 'button',
    onClick,
    ...rest
  },
  ref
) {
  const classes = useMemo(() => {
    const base = VARIANTS[variant] || VARIANTS.primary;
    const sizeCls = SIZES[size] || '';
    const blockCls = block ? 'btn-block' : '';
    const loadingCls = loading ? 'btn-loading' : '';
    return [base, sizeCls, blockCls, loadingCls, className]
      .filter(Boolean)
      .join(' ')
      .trim();
  }, [variant, size, block, loading, className]);

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <span className="spinner-inner" />
        </span>
      )}
      {!loading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      <span className="btn-content">{children}</span>
      {!loading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
});

export default Button;

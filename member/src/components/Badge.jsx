function Badge({ tone = 'info', className = '', children }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export default Badge;

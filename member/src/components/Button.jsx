function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} type="button" {...props} />
  );
}

export default Button;

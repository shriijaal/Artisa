const ProtectedImage = ({ src, alt = '', className = '', draggable = false, ...rest }) => {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={`select-none [ -webkit-user-drag:none ] ${className}`}
      draggable={draggable}
      loading={rest.loading || 'lazy'}
      onContextMenu={(e) => e.preventDefault()}
      onDoubleClick={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      {...rest}
    />
  );
};

export default ProtectedImage;

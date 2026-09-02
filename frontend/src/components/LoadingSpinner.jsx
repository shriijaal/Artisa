/**
 * LoadingSpinner - Replaces plain "Loading..." text across all pages.
 * Usage: <LoadingSpinner /> for full-page or <LoadingSpinner size="sm" /> for inline.
 */
const LoadingSpinner = ({ size = 'md', fullPage = true, label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-14 w-14 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full border-stone-200 border-t-stone-900 animate-spin`}
        role="status"
        aria-label={label}
      />
      {size !== 'sm' && (
        <p className="text-sm text-stone-500 font-medium">{label}</p>
      )}
    </div>
  );

  if (!fullPage) return spinner;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;

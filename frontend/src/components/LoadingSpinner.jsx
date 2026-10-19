import { Arc } from 'loading-dev';

/**
 * LoadingSpinner - Replaces plain "Loading..." text across all pages.
 * Usage: <LoadingSpinner /> for full-page or <LoadingSpinner size="sm" /> for inline.
 * Spinner: loading.dev Arc in brand terracotta; reduced-motion handled by the library.
 */
const LoadingSpinner = ({ size = 'md', fullPage = true, label = 'Loading...' }) => {
  const sizePx = { sm: 18, md: 40, lg: 56 }[size] ?? 40;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <span role="status" aria-label={label} className="inline-flex">
        <Arc size={sizePx} color="#9c4327" />
      </span>
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

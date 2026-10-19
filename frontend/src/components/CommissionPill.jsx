import { formatPrice } from '../utils/formatPrice';

const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-[#fc8d6b]" aria-hidden="true">
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r="0.75" fill="currentColor" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-[#fc8d6b]" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-[#fc8d6b]" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CommissionPill = ({ price, estimatedDays, className = '' }) => {
  const hasPrice = Boolean(price);
  const hasDays = Boolean(estimatedDays);
  const showFallback = !hasPrice && !hasDays;

  return (
    <span className={`group/commission relative inline-flex ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-white/85 via-white/65 to-white/45 backdrop-blur-md border border-white/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-700 shadow-sm cursor-default transition-all duration-200 hover:border-[#9c4327]/50 hover:shadow-md hover:text-stone-900">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9c4327]" />
        Open for commissions
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 translate-y-1 scale-[0.97] opacity-0 transition-all duration-200 ease-out group-hover/commission:delay-150 group-hover/commission:translate-y-0 group-hover/commission:scale-100 group-hover/commission:opacity-100"
      >
        <span className="relative flex items-center gap-2 whitespace-nowrap rounded-lg bg-stone-900 px-3 py-2 text-[11px] leading-none text-white shadow-2xl ring-1 ring-white/10">
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-stone-900" />
          {hasPrice && (
            <span className="flex items-center gap-1.5">
              <IconTag />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">From</span>
              <span className="font-bold text-white">NPR {formatPrice(price)}</span>
            </span>
          )}
          {hasPrice && hasDays && <span className="h-3 w-px bg-white/15" />}
          {hasDays && (
            <span className="flex items-center gap-1.5 text-stone-300">
              <IconClock />
              <span>{estimatedDays} day{estimatedDays === 1 ? '' : 's'} delivery</span>
            </span>
          )}
          {showFallback && (
            <span className="flex items-center gap-1.5 text-stone-300">
              <IconCheck />
              Accepting custom requests
            </span>
          )}
        </span>
      </span>
    </span>
  );
};

export default CommissionPill;

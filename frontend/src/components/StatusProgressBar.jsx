const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const SHIPMENT_STEPS = ['pending', 'shipped', 'delivered'];
const TERMINAL = new Set(['cancelled', 'failed', 'refunded', 'returned']);

const tones = {
  pending: { fill: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-100', ring: 'border-amber-200' },
  processing: { fill: 'bg-blue-500', text: 'text-blue-700', soft: 'bg-blue-100', ring: 'border-blue-200' },
  shipped: { fill: 'bg-violet-500', text: 'text-violet-700', soft: 'bg-violet-100', ring: 'border-violet-200' },
  delivered: { fill: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-100', ring: 'border-emerald-200' },
  paid: { fill: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-100', ring: 'border-emerald-200' },
  failed: { fill: 'bg-red-500', text: 'text-red-700', soft: 'bg-red-100', ring: 'border-red-200' },
  refunded: { fill: 'bg-stone-400', text: 'text-stone-500', soft: 'bg-stone-100', ring: 'border-stone-200' },
  cancelled: { fill: 'bg-stone-400', text: 'text-stone-500', soft: 'bg-stone-100', ring: 'border-stone-200' },
  returned: { fill: 'bg-stone-400', text: 'text-stone-500', soft: 'bg-stone-100', ring: 'border-stone-200' },
};

const stepsFor = (kind) => {
  if (kind === 'shipment') return SHIPMENT_STEPS;
  if (kind === 'payment') return ['pending', 'paid'];
  return ORDER_STEPS;
};

const labelFor = (value) => String(value).replace(/_/g, ' ');

const statusPaths = {
  pending: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  processing: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
    </>
  ),
  shipped: (
    <>
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </>
  ),
  delivered: <path d="M5 12l5 5L20 7" />,
  paid: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 12h.01M17 12h.01" />
    </>
  ),
  failed: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  refunded: (
    <>
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h9a5 5 0 010 10h-3" />
    </>
  ),
  cancelled: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </>
  ),
  returned: (
    <>
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h9a5 5 0 010 10h-3" />
    </>
  ),
};

export const StatusIcon = ({ value, className = 'w-2.5 h-2.5' }) => {
  const path = statusPaths[value] || statusPaths.pending;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
};

const StatusCircle = ({ value, size = 'sm', complete = false }) => {
  const tone = tones[value] || tones.pending;
  const dims = size === 'md' ? 'w-5 h-5' : 'w-[18px] h-[18px]';
  const icon = size === 'md' ? 'w-2.5 h-2.5' : 'w-2.5 h-2.5';

  if (complete) {
    return (
      <span
        className={`${dims} rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0`}
      >
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`${dims} rounded-full ${tone.soft} ${tone.text} border ${tone.ring} flex items-center justify-center shrink-0`}
    >
      <StatusIcon value={value} className={icon} />
    </span>
  );
};

const BarTrack = ({ pct, fillClass }) => (
  <span className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden block">
    <span
      className={`block h-full rounded-full transition-all duration-500 ${fillClass}`}
      style={{ width: `${pct}%` }}
    />
  </span>
);

const TerminalCompact = ({ value, steps }) => {
  const tone = tones[value] || tones.pending;
  const inSteps = steps.includes(value);
  return (
    <span className="inline-flex items-center gap-2 shrink-0 w-[9rem]">
      <StatusCircle value={value} />
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <BarTrack pct={100} fillClass={tone.fill} />
        <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${tone.text}`}>
          {labelFor(value)}
          {inSteps && (
            <span className="text-stone-400 font-medium ml-1 tabular-nums">
              {steps.length}/{steps.length}
            </span>
          )}
        </span>
      </span>
    </span>
  );
};

const CompactStatusBar = ({ value, kind = 'order' }) => {
  if (!value) return null;
  const steps = stepsFor(kind);
  const tone = tones[value] || tones.pending;
  const isTerminal = TERMINAL.has(value) || !steps.includes(value);

  if (isTerminal) {
    return <TerminalCompact value={value} steps={steps} />;
  }

  const idx = steps.indexOf(value);
  const pct = steps.length <= 1 ? 100 : (idx / (steps.length - 1)) * 100;
  const isComplete = idx === steps.length - 1;

  return (
    <span className="inline-flex items-center gap-2 shrink-0 w-[9rem]">
      <StatusCircle value={value} complete={isComplete && kind !== 'payment'} />
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <BarTrack pct={pct} fillClass={tone.fill} />
        <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${tone.text}`}>
          {labelFor(value)}
          <span className="text-stone-400 font-medium ml-1 tabular-nums">
            {idx + 1}/{steps.length}
          </span>
        </span>
      </span>
    </span>
  );
};

const FullStatusSteps = ({ value, kind = 'order' }) => {
  if (!value) return null;
  const steps = stepsFor(kind);
  const tone = tones[value] || tones.pending;
  const isTerminal = TERMINAL.has(value) || !steps.includes(value);

  if (isTerminal) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <StatusCircle value={value} size="md" />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <BarTrack pct={100} fillClass={tone.fill} />
            <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${tone.text}`}>
              {labelFor(value)}
              {steps.includes(value) && (
                <span className="text-stone-400 font-medium ml-1 tabular-nums">
                  {steps.length}/{steps.length}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = steps.indexOf(value);

  return (
    <div className="w-full">
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const stepTone = tones[step] || tones.pending;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] ${
                    isCurrent
                      ? `${stepTone.fill} text-white border-transparent shadow-sm`
                      : isComplete
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : `bg-white ${stepTone.text} opacity-45 ${stepTone.ring}`
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : (
                    <StatusIcon value={step} className="w-3 h-3" />
                  )}
                </div>
                <span
                  className={`text-[8px] mt-1 capitalize whitespace-nowrap ${
                    isCurrent
                      ? `${stepTone.text} font-semibold`
                      : isComplete
                        ? 'text-emerald-600'
                        : 'text-stone-300'
                  }`}
                >
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 rounded-full mb-3.5 ${
                    idx < currentIdx
                      ? isCurrent
                        ? stepTone.fill
                        : 'bg-emerald-400'
                      : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${tone.text}`}>
        {labelFor(value)}
        <span className="text-stone-400 font-medium ml-1.5 tabular-nums">
          {currentIdx + 1}/{steps.length}
        </span>
      </p>
    </div>
  );
};

const StatusProgressBar = ({ value, kind = 'order', variant = 'compact' }) => {
  if (!value) return null;
  return variant === 'full' ? (
    <FullStatusSteps value={value} kind={kind} />
  ) : (
    <CompactStatusBar value={value} kind={kind} />
  );
};

export default StatusProgressBar;

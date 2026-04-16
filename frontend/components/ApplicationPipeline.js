import { buildApplicationPipeline } from '@/utils/applicationStatus';

const toneClassMap = {
  done: 'border-emerald-400/70 bg-emerald-400 text-slate-950',
  active: 'border-sky-300/70 bg-sky-300 text-slate-950',
  warning: 'border-orange-300/70 bg-orange-300 text-slate-950',
  success: 'border-emerald-300/70 bg-emerald-300 text-slate-950',
  danger: 'border-rose-300/70 bg-rose-300 text-slate-950',
  support: 'border-violet-300/70 bg-violet-300 text-slate-950',
  muted: 'border-slate-400/60 bg-slate-400 text-slate-950',
  pending: 'border-[rgba(148,163,184,0.22)] bg-[rgba(15,23,42,0.9)] text-[var(--text-muted)]',
};

const lineToneClassMap = {
  done: 'bg-emerald-300/70',
  active: 'bg-sky-300/70',
  warning: 'bg-orange-300/70',
  success: 'bg-emerald-300/70',
  danger: 'bg-rose-300/70',
  support: 'bg-violet-300/70',
  muted: 'bg-slate-400/60',
  pending: 'bg-[rgba(148,163,184,0.18)]',
};

export default function ApplicationPipeline({ status, className = '' }) {
  const steps = buildApplicationPipeline(status);

  return (
    <div className={`overflow-x-auto pb-1 ${className}`.trim()}>
      <div className="flex min-w-max items-start gap-0">
        {steps.map((step, index) => {
          const tone = toneClassMap[step.tone || step.state] || toneClassMap.pending;
          const lineTone = lineToneClassMap[step.state === 'pending' ? 'pending' : (step.tone || step.state)] || lineToneClassMap.pending;

          return (
            <div key={step.id} className="flex items-start">
              <div className="flex min-w-[72px] flex-col items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${tone}`.trim()}>
                  {step.state === 'done' ? '✓' : step.state === 'active' ? '•' : ''}
                </div>
                <p className={`max-w-[72px] text-center text-[0.68rem] font-medium leading-5 ${step.state === 'pending' ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}`.trim()}>
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 ? (
                <div className={`mt-4 h-[2px] w-7 rounded-full ${lineTone}`.trim()} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

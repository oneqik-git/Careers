export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

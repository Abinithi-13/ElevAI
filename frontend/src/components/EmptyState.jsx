export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon size={22} />
        </div>
      )}
      <p className="font-semibold text-navy-900">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-navy-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default function EmptyState({ icon, title, description, children }) {
  return (
    <div className="civic-empty-state border border-dashed border-[var(--civic-border)] rounded-lg bg-[#f7fafc]">
      {icon && <div className="civic-empty-state-icon">{icon}</div>}
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

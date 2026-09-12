export default function EmptyState({ icon, title, description, children }) {
  return (
    <div className="civic-empty-state" style={{ border: "1px dashed #d9e4ef", borderRadius: 8, background: "#f7fafc" }}>
      {icon && <div className="civic-empty-state-icon">{icon}</div>}
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

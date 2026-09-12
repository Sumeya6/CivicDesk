function Unauthorized() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--civic-page)", padding: 16 }}>
      <div style={{ maxWidth: 400, width: "100%", borderRadius: 12, border: "1px solid var(--civic-border)", background: "#fff", padding: 32, textAlign: "center", boxShadow: "0 1px 3px rgb(15 23 42 / 4%), 0 6px 24px rgb(15 23 42 / 3%)" }}>
        <h1 style={{ margin: 0, color: "var(--civic-blue-950)", fontSize: 24, fontWeight: 600 }}>Unauthorized</h1>
        <p style={{ marginTop: 8, color: "var(--civic-muted)", fontSize: 14 }}>
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}

export default Unauthorized;

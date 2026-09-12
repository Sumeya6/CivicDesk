import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="civic-pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="civic-pagination-btn"
        style={{ gap: 4 }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Previous
      </button>
      <div className="civic-pagination-pages">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className="civic-pagination-btn"
            aria-current={p === page ? "page" : undefined}
            style={p === page ? { borderColor: "var(--civic-blue-800)", background: "var(--civic-blue-800)", color: "#fff" } : undefined}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="civic-pagination-btn"
        style={{ gap: 4 }}
      >
        Next
        <ChevronRight style={{ width: 16, height: 16 }} />
      </button>
    </nav>
  );
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;
  return (
    <div
      className="civic-modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="civic-modal-dialog"
        style={maxWidth === "max-w-xl" ? { maxWidth: "36rem" } : { maxWidth: "32rem" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="civic-modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="civic-modal-close"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="civic-modal-body" style={{ maxHeight: "80vh", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

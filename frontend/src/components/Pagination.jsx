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
        className="civic-pagination-btn gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="max-[480px]:hidden">Previous</span>
      </button>
      <div className="civic-pagination-pages">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className="civic-pagination-btn"
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="civic-pagination-btn gap-1"
      >
        <span className="max-[480px]:hidden">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export { Modal } from "./Modal";

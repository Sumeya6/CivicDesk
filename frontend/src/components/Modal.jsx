import { useFocusTrap } from "../hooks/useFocusTrap";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;
  const modalRef = useFocusTrap(true);

  return (
    <div
      ref={modalRef}
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
            data-modal-close
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

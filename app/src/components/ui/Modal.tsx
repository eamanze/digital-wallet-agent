"use client";

export function Modal({ title, children, open, onClose }: { title: string; children: React.ReactNode; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "grid", placeItems: "center", padding: 20, zIndex: 80 }}>
      <div className="card" style={{ maxWidth: 560, width: "100%" }}>
        <div className="topbar">
          <h2 className="card-title">{title}</h2>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

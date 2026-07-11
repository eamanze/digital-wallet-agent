export function Card({ title, meta, children, soft = false }: { title?: string; meta?: string; children: React.ReactNode; soft?: boolean }) {
  return (
    <section className={`card${soft ? " card-soft" : ""}`}>
      {title ? <h2 className="card-title">{title}</h2> : null}
      {meta ? <p className="card-meta">{meta}</p> : null}
      {children}
    </section>
  );
}

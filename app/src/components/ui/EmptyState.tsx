export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      <p className="card-meta">{message}</p>
    </div>
  );
}

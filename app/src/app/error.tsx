"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="main" id="main-content">
      <div className="card">
        <h1>Something went wrong</h1>
        <p className="page-subtitle">{error.message}</p>
        <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}

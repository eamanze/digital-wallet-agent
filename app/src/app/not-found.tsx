import Link from "next/link";

export default function NotFound() {
  return (
    <main className="main" id="main-content">
      <div className="card">
        <h1>Page not found</h1>
        <p className="page-subtitle">The page you are looking for does not exist or you do not have access.</p>
        <Link className="btn btn-primary" href="/dashboard">Go to dashboard</Link>
      </div>
    </main>
  );
}

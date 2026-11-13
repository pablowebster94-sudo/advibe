import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center bg-navy px-6 text-white sm:px-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Error 404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Esta página no existe.</h1>
      <Link href="/" className="btn-light on-dark mt-10">Volver al inicio</Link>
    </main>
  );
}

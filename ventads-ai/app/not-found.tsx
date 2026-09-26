import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-6 py-10">
      <span className="text-sm font-semibold tracking-tight text-foreground">
        ventADS<span className="text-accent-strong">.ai</span>
      </span>
      <h1 className="text-2xl font-semibold text-foreground">No encontramos lo que buscas</h1>
      <p className="text-sm text-muted">El producto o la campaña no existe o fue eliminado.</p>
      <div className="flex gap-3">
        <Link href="/products">
          <Button>Ver productos</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Ir al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

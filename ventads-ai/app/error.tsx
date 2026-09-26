"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-6 py-10">
      <span className="text-sm font-semibold tracking-tight text-foreground">
        ventADS<span className="text-accent-strong">.ai</span>
      </span>
      <h1 className="text-2xl font-semibold text-foreground">No se pudo cargar esta pantalla</h1>
      <p className="text-sm text-muted">
        Ocurrió un error en el servidor (por ejemplo, la base de datos no respondió). Vuelve a
        intentarlo; si persiste, revisa los logs del deployment
        {error.digest ? (
          <>
            {" "}con el código <code className="font-mono text-foreground">{error.digest}</code>
          </>
        ) : null}
        .
      </p>
      <div className="flex gap-3">
        <Button onClick={() => unstable_retry()}>Reintentar</Button>
        <Link href="/">
          <Button variant="secondary">Ir al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 560, margin: "0 auto" }}>
        <title>ventADS.ai — Error</title>
        <h1 style={{ fontSize: 22 }}>ventADS.ai no pudo cargar</h1>
        <p style={{ color: "#555", fontSize: 14 }}>
          Ocurrió un error inesperado.{error.digest ? ` Código: ${error.digest}.` : ""}
        </p>
        <button onClick={() => unstable_retry()} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}

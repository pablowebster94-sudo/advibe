type AdapterCause = { kind?: string; code?: string; originalCode?: string; message?: string };

/**
 * Short, non-sensitive classification of an error (never its message).
 * For generic PostgreSQL errors it appends the SQLSTATE and, when present,
 * the pooler's own code token, e.g. "postgres:XX000:EMAXCONNSESSION".
 */
export function errorCode(error: unknown): string {
  const e = error as {
    code?: string;
    name?: string;
    meta?: { driverAdapterError?: { cause?: AdapterCause } };
    cause?: AdapterCause;
  };
  const cause = e.meta?.driverAdapterError?.cause ?? e.cause;
  if (cause?.kind === "postgres") {
    const sqlState = cause.code ?? cause.originalCode ?? "unknown";
    const poolerCode = /\((E[A-Z_]{3,})\)/.exec(cause.message ?? "")?.[1];
    return ["postgres", sqlState, poolerCode].filter(Boolean).join(":");
  }
  return cause?.kind ?? e.code ?? cause?.code ?? e.name ?? "UnknownError";
}

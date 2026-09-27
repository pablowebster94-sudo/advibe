/** Short, non-sensitive classification of an error (never its message). */
export function errorCode(error: unknown): string {
  const e = error as {
    code?: string;
    name?: string;
    meta?: { driverAdapterError?: { cause?: { kind?: string } } };
    cause?: { kind?: string; code?: string };
  };
  return (
    e.meta?.driverAdapterError?.cause?.kind ??
    e.cause?.kind ??
    e.code ??
    e.cause?.code ??
    e.name ??
    "UnknownError"
  );
}

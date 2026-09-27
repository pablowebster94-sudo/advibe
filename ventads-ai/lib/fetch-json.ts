/**
 * Client-side JSON reader for our /api routes. Our handlers always answer
 * JSON, but the hosting platform can still answer with an HTML error page
 * before our code runs (e.g. Vercel's 504 on a function timeout, 413 on an
 * oversized body). Calling `res.json()` on that surfaces as the cryptic
 * `Unexpected token '<', "<!DOCTYPE "...`; this turns it into a readable
 * error that names the HTTP status instead.
 */
export async function readJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  throw new Error(describeNonJson(res.status));
}

function describeNonJson(status: number) {
  switch (status) {
    case 401:
      return "Sesión no autorizada (HTTP 401). Recarga la página e inicia sesión de nuevo.";
    case 413:
      return "El archivo es demasiado grande para subirlo (HTTP 413).";
    case 504:
      return "El servidor tardó demasiado en responder (HTTP 504). Inténtalo de nuevo.";
    default:
      return `El servidor respondió HTTP ${status} sin datos válidos. Inténtalo de nuevo.`;
  }
}

import { NextResponse } from "next/server";
import { errorCode } from "@/lib/error-code";

/**
 * Wraps a route handler so any uncaught error still answers JSON
 * (`{ error, code }`, HTTP 500) instead of Next's empty 500 body — the
 * frontend always reads `data.error`. Only the error *code* is returned;
 * the full error goes to the server log.
 */
export function jsonRoute<Args extends unknown[]>(
  label: string,
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`[api] ${label} failed`, error);
      return NextResponse.json(
        { error: "Error interno del servidor. Inténtalo de nuevo.", code: errorCode(error) },
        { status: 500 }
      );
    }
  };
}

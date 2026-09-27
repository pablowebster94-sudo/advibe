import { describe, expect, it } from "vitest";
import { errorCode } from "@/lib/error-code";

describe("errorCode", () => {
  it("classifies pooler errors by SQLSTATE and pooler code without the message", () => {
    const error = {
      meta: {
        driverAdapterError: {
          cause: { kind: "postgres", code: "XX000", message: "(EMAXCONNSESSION) max clients reached in session mode" },
        },
      },
    };
    expect(errorCode(error)).toBe("postgres:XX000:EMAXCONNSESSION");
  });
  it("keeps specific adapter kinds", () => {
    expect(errorCode({ meta: { driverAdapterError: { cause: { kind: "TooManyConnections" } } } })).toBe("TooManyConnections");
  });
});

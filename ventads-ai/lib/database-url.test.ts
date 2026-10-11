import { afterEach, describe, expect, it } from "vitest";
import { runtimeConnectionString, runtimePoolerMode } from "@/lib/database-url";

const session = "postgresql://postgres.ref:pw@aws-1-us-west-2.pooler.supabase.com:5432/postgres?schema=ventads";

describe("runtimeConnectionString", () => {
  afterEach(() => {
    delete process.env.DATABASE_POOL_MODE;
  });

  it("uses Supabase's transaction pooler (6543) at runtime, same host, user and params", () => {
    const url = new URL(runtimeConnectionString(session));
    expect(url.port).toBe("6543");
    expect(url.hostname).toBe("aws-1-us-west-2.pooler.supabase.com");
    expect(url.username).toBe("postgres.ref");
    expect(url.searchParams.get("schema")).toBe("ventads");
    expect(runtimePoolerMode(session)).toBe("transaction");
  });

  it("leaves non-Supabase URLs and an explicit opt-out unchanged", () => {
    const local = "postgresql://postgres@127.0.0.1:5433/ventads";
    expect(runtimeConnectionString(local)).toBe(local);
    expect(runtimePoolerMode(local)).toBe("direct");
    process.env.DATABASE_POOL_MODE = "session";
    expect(runtimeConnectionString(session)).toBe(session);
    expect(runtimePoolerMode(session)).toBe("session");
  });
});

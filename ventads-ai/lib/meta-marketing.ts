import { NextResponse } from "next/server";

const API_VERSION = process.env.META_GRAPH_API_VERSION || "v27.0";
const TOKEN = process.env.META_SYSTEM_USER_TOKEN;

export function metaConfig() {
  if (!TOKEN) throw new Error("META_SYSTEM_USER_TOKEN is not configured");
  return { token: TOKEN, version: API_VERSION };
}

export async function metaGet(path: string, params: Record<string, string> = {}) {
  const { token, version } = metaConfig();
  const url = new URL(`https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = payload?.error?.message || `Meta API request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export async function metaPost(path: string, body: Record<string, string>) {
  const { token, version } = metaConfig();
  const form = new URLSearchParams({ ...body, access_token: token });
  const response = await fetch(`https://graph.facebook.com/${version}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = payload?.error?.message || `Meta API request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected Meta API error";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

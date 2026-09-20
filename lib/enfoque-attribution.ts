import { cookies } from "next/headers";

export async function getAttribution() {
  const jar = await cookies();
  const raw = jar.get("ev_attr")?.value;
  const visitorId = jar.get("ev_vid")?.value;
  if (!raw) return {visitorId};
  try {
    return {...JSON.parse(decodeURIComponent(raw)),visitorId};
  } catch {
    return {visitorId};
  }
}

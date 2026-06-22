import { auth } from "@/Lib/BetterAuth/Config/server";

export async function getSession(headers: Headers) {
  try {
    const session = await auth.api.getSession({ headers });
    return session ?? null;
  } catch {
    return null;
  }
}

import { auth } from "@/Lib/BetterAuth/Config/server";

export async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

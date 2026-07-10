import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/Lib/BetterAuth/Config/server";

export const { GET, POST } = toNextJsHandler(auth);

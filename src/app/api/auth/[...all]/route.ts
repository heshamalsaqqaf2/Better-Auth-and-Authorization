import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/core/foundations/infrastructure/services/better-auth/auth-server";

export const { POST, GET } = toNextJsHandler(auth);

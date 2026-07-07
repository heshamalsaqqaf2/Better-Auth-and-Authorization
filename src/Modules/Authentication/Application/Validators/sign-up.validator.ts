import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Must be a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpCommandDTO = z.infer<typeof SignUpSchema>;

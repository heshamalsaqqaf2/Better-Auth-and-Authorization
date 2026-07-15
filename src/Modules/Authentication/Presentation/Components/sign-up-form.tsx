"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createOperationId } from "@/Core/Foundations/Types";
import { signUpAction } from "@/Modules/Authentication/Presentation/Actions/sign-up.action";
import type { SignUpFormState } from "@/Modules/Authentication/Presentation/Types";
import { Button } from "@/Shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/Shared/components/ui/card";
import { Input } from "@/Shared/components/ui/input";
import { Label } from "@/Shared/components/ui/label";

const initialState: SignUpFormState = {
  _tag: "Success",
  data: null,
  operationId: createOperationId("Initial"),
};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (state._tag === "Success" && state.data && !redirected.current) {
      redirected.current = true;
      router.push("/dashboard");
      return;
    }
    if (state._tag === "Failure") {
      switch (state.error._tag) {
        case "AuthenticationError":
        case "AuthorizationError":
        case "SystemError":
        case "NetworkError":
          toast.error(state.error.userMessage);
          break;
      }
    }
  }, [state, router]);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: ({ value }) => {
      const fd = new FormData();
      fd.set("name", value.name);
      fd.set("email", value.email);
      fd.set("password", value.password);
      startTransition(() => formAction(fd));
    },
  });

  const fieldErrors = state._tag === "Failure" && state.error._tag === "ValidationError" ? state.error.fieldErrors : {};

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {fieldErrors.name && <p className="text-destructive text-sm">{fieldErrors.name.join(", ")}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {fieldErrors.email && <p className="text-destructive text-sm">{fieldErrors.email.join(", ")}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {fieldErrors.password && <p className="text-destructive text-sm">{fieldErrors.password.join(", ")}</p>}
              </div>
            )}
          </form.Field>
          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value, fieldApi }) => {
                if (value !== fieldApi.form.getFieldValue("password")) {
                  return "Passwords must match";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Confirm Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-destructive text-sm">{field.state.meta.errors.join(", ")}</p>
                )}
              </div>
            )}
          </form.Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <a href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

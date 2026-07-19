"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { type PresentationResult, successResult } from "@/Core/Foundations/Presentation";
import { createOperationId } from "@/Core/Foundations/Types";
import { signOutAction } from "@/Modules/Authentication/Presentation/Actions/sign-out.action";
import { Button } from "@/Shared/components/ui/button";

const initialState: PresentationResult<null> = successResult(null, createOperationId("Initial"));

export default function SignOutButton() {
  const [state, formAction, isPending] = useActionState(signOutAction, initialState);
  const router = useRouter();
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (state._tag === "Success" && hasSubmitted.current) {
      router.push("/sign-in");
      return;
    }
    if (state._tag === "Failure" && hasSubmitted.current) {
      if ("userMessage" in state.error) {
        toast.error(state.error.userMessage);
      }
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        hasSubmitted.current = true;
      }}
    >
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Signing out..." : "Sign Out"}
      </Button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/Shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Shared/components/ui/card";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", { message: error.message, cause: error.cause, digest: error.digest });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">We encountered an error loading the admin panel.</p>
          <div className="flex gap-2">
            <Button onClick={() => unstable_retry()} variant="default">
              Try again
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-border px-2 h-7 text-xs font-medium hover:bg-input/50"
            >
              Go to User Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

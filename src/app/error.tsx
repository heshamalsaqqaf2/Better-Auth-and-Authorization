"use client";

import { useEffect } from "react";
import { Button } from "@/Shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Shared/components/ui/card";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", { message: error.message, cause: error.cause, digest: error.digest });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Please try again. If the problem persists, contact support.</p>
          <Button onClick={() => unstable_retry()} variant="default" className="self-start">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import SignOutButton from "./sign-out-button";

export default function UserNav({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">{user.name}</span>
      <span className="text-xs text-muted-foreground">{user.email}</span>
      <SignOutButton />
    </div>
  );
}

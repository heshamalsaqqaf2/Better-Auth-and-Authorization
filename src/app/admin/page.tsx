import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/Lib/BetterAuth/utils/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/Shared/components/ui/card";

export default async function AdminPage() {
  const h = await headers();
  const session = await getSession(h);

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Welcome, {session.user.name}!</p>
      </CardContent>
    </Card>
  );
}

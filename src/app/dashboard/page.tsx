import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/Lib/BetterAuth/utils/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/Shared/components/ui/card";

export default async function DashboardPage() {
  const h = await headers();
  const session = await getSession(h);

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Welcome, {session.user.name}!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
      </CardContent>
    </Card>
  );
}

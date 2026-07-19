import { Card, CardContent, CardHeader, CardTitle } from "@/Shared/components/ui/card";

export default async function DashboardPage() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Welcome, Username</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">User Email</p>
      </CardContent>
    </Card>
  );
}

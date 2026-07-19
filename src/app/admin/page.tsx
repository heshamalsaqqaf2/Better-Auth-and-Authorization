import { Card, CardContent, CardHeader, CardTitle } from "@/Shared/components/ui/card";

export default async function AdminPage() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Welcome, Admin UserName</p>
      </CardContent>
    </Card>
  );
}

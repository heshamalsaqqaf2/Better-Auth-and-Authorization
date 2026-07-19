import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/Lib/BetterAuth/utils/get-session";
import UserNav from "@/Modules/Authentication/Presentation/Components/user-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const session = await getSession(h);
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-end px-4">
          <UserNav user={{ name: session.user.name, email: session.user.email }} />
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

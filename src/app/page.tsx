import Link from "next/link";
import { Button } from "@/Shared/components/ui/button";

export default async function Home() {
  return (
    <div className="grid m-auto gap-2 justify-center items-center">
      <h1 className="w-full font-bold text-2xl">Home Page</h1>
      <div className="flex gap-1">
        <Button variant={"default"}>
          <Link href={"sign-in"}>Sign-in Page</Link>
        </Button>
        <Button variant={"secondary"}>
          <Link href={"sign-up"}>Sign-up Page</Link>
        </Button>
      </div>
      <div className="flex gap-1">
        <Button variant={"destructive"}>
          <Link href={"admin"}>Admin Dashboard</Link>
        </Button>
        <Button variant={"outline"}>
          <Link href={"dashboard"}>User Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

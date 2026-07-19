import Link from "next/link";
import { Button } from "@/Shared/components/ui/button";

export default async function Home() {
  return (
    <div className="grid min-h-screen items-center justify-items-center">
      <div className="p-5">
        <h1>Home Page</h1>
        <Button variant={"default"}>
          <Link href={"sign-in"}>SIGN IN</Link>
        </Button>
        <Button variant={"secondary"}>
          <Link href={"sign-up"}>SIGN UP</Link>
        </Button>
      </div>
    </div>
  );
}

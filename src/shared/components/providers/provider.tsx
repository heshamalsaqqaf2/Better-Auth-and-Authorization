import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/Shared/components/ui/tooltip";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <NextTopLoader easing="ease" showSpinner={false} color="var(--primary)" />
      {children}
      <Toaster position="top-right" />
    </TooltipProvider>
  );
}

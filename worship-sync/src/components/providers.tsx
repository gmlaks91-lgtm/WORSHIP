"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delay={0}>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}

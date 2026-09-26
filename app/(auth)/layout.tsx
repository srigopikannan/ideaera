import * as React from "react";
import { AppFooter } from "@/components/shell/AppFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#050608]">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <AppFooter />
    </div>
  );
}

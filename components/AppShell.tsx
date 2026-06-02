import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

type AppShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: {
    href: string;
    label: string;
  };
  children: ReactNode;
};

export function AppShell({ title, subtitle, backHref, action, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <MobileHeader title={title} subtitle={subtitle} backHref={backHref} action={action} />
      <main className="mx-auto max-w-md px-5 pb-24 pt-5 lg:max-w-6xl lg:px-8 lg:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

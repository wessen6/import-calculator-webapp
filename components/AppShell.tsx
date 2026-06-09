import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { HeaderNoticeProvider } from "./HeaderNotice";
import { MobileHeader } from "./MobileHeader";

type AppShellProps = {
  title: string;
  subtitle?: string;
  headerAside?: ReactNode;
  action?: {
    href: string;
    label: string;
  };
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  headerAside,
  action,
  children
}: AppShellProps) {
  return (
    <HeaderNoticeProvider>
      <div className="min-h-screen">
        <MobileHeader
          title={title}
          subtitle={subtitle}
          headerAside={headerAside}
          action={action}
        />
        <main className="mx-auto max-w-md px-5 pb-24 pt-5 lg:max-w-6xl lg:px-8 lg:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </HeaderNoticeProvider>
  );
}

"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

type SerwistProviderWrapperProps = {
  children: ReactNode;
};

export function SerwistProviderWrapper({ children }: SerwistProviderWrapperProps) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
      {children}
    </SerwistProvider>
  );
}

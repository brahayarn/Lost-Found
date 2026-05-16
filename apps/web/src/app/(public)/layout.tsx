import type { ReactNode } from "react";
import { PublicHeader } from "@/components/public/header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Lost &amp; Found
      </footer>
    </div>
  );
}

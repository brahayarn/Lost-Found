"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-stone-200 bg-white text-sm text-stone-900 shadow-md",
          description: "text-stone-500",
        },
      }}
    />
  );
}

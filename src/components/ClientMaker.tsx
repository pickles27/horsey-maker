"use client";

import dynamic from "next/dynamic";

// The maker reads saved horsies and share links from the browser, so it only renders client-side.
const HorseyMaker = dynamic(() => import("@/components/HorseyMaker"), {
  ssr: false,
  loading: () => (
    <div className="card flex h-96 items-center justify-center text-lg font-semibold text-ink/60">
      Saddling up…
    </div>
  ),
});

export default function ClientMaker() {
  return <HorseyMaker />;
}

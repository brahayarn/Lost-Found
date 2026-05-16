"use client";

import { LatestMatches } from "@/components/admin/latest-matches";

export default function AdminMatchesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Збіги</h1>
        <p className="text-sm text-stone-500">
          Пропозиції автоматичного матчингу між знахідками та заявками.
        </p>
      </div>
      <LatestMatches />
    </div>
  );
}

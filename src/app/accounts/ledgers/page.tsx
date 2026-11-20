"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AccountsPage from "../page";

function LedgersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // We effectively want to render the AccountsPage but with the "ledgers" tab active.
  // The AccountsPage currently manages its own activeTab state.
  // To keep it simple and consistent with the existing structure,
  // we'll use the same component but ensure it opens to the ledgers tab.

  return <AccountsPageInitialTab tab="ledgers" />;
}

// Wrapper to inject initial tab
function AccountsPageInitialTab({ tab }: { tab: string }) {
  // We need to modify AccountsPage slightly or just use a state override here if possible.
  // Since we can't easily modify the internal state of AccountsPage from outside without props,
  // I will implement a dedicated Ledgers view that reuses the logic.

  // Actually, the most robust way is to create a dedicated page that looks exactly like
  // the Ledgers tab in the main accounts page.

  return <AccountsPage overrideTab={tab} />;
}

export default function LedgersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Ledgers...</div>}>
      <LedgersContent />
    </Suspense>
  );
}

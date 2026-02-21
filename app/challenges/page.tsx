"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { checkProfileCompletion } from "@/lib/profileCompletion";
import ProfileRequiredGate from "@/components/ProfileRequiredGate";

export default function Page() {
  return (
    <AppShell title="Challenges">
      <div style={{ background: "white", border: "1px solid #e6e6e6", borderRadius: 16, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Challenges</h2>
        <p>Komt binnenkort.</p>
      </div>
    </AppShell>
  );
}
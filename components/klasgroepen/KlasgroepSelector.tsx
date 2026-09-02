"use client";

import React, { useEffect, useState } from "react";
import { haalKlasgroepLeden, haalMijnKlasgroepen } from "@/lib/klasgroepen/client";
import type { Klasgroep, KlasgroepLid } from "@/types/klasgroepen";

type Props = {
  schooljaar: string;
  value: string | null;
  onChange: (klasgroepId: string | null, leden: KlasgroepLid[]) => void;
  disabled?: boolean;
  label?: string;
  includeAllOption?: boolean;
};

export default function KlasgroepSelector({
  schooljaar,
  value,
  onChange,
  disabled = false,
  label = "Klasgroep",
  includeAllOption = true,
}: Props) {
  const [groepen, setGroepen] = useState<Klasgroep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let actief = true;

    async function laden() {
      setLoading(true);
      setError(null);

      try {
        const resultaat = await haalMijnKlasgroepen(schooljaar);
        if (!actief) return;
        setGroepen(resultaat);

        if (value && !resultaat.some((groep) => groep.id === value)) {
          onChange(null, []);
        }
      } catch (err) {
        if (actief) setError(err instanceof Error ? err.message : "Kon klasgroepen niet laden.");
      } finally {
        if (actief) setLoading(false);
      }
    }

    laden();
    return () => {
      actief = false;
    };
  }, [schooljaar]); // onChange en value bewust niet: herladen gebeurt bij schooljaarwijziging.

  async function selecteer(nextId: string) {
    setError(null);

    if (!nextId) {
      onChange(null, []);
      return;
    }

    try {
      const leden = await haalKlasgroepLeden(nextId);
      onChange(nextId, leden);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon klasgroep niet openen.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <label style={{ color: "rgba(234,240,255,0.76)", fontSize: 13, fontWeight: 900 }}>
        {label}
      </label>

      <select
        value={value ?? ""}
        onChange={(event) => selecteer(event.target.value)}
        disabled={disabled || loading}
        style={{
          width: "100%",
          minHeight: 46,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(5,10,16,0.72)",
          color: "rgba(234,240,255,0.94)",
          padding: "0 13px",
          fontWeight: 800,
        }}
      >
        <option value="">
          {loading
            ? "Klasgroepen laden..."
            : includeAllOption
              ? "Alle leerlingen / geen klasgroep"
              : "Kies een klasgroep"}
        </option>

        {groepen.map((groep) => (
          <option key={groep.id} value={groep.id}>
            {groep.naam}
          </option>
        ))}
      </select>

      {error ? (
        <p style={{ margin: 0, color: "#fda4af", fontSize: 13, fontWeight: 700 }}>{error}</p>
      ) : null}

      {!loading && groepen.length === 0 ? (
        <p style={{ margin: 0, color: "rgba(234,240,255,0.62)", fontSize: 13 }}>
          Je hebt nog geen persoonlijke klasgroepen voor {schooljaar}.
        </p>
      ) : null}
    </div>
  );
}


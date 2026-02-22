import React from "react";
import type { Entry } from "./types";

export default function ScoreTable({ title, entries }: { title: string; entries: Entry[] }) {
  const top1 = entries.slice(0, 1);

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.20)",
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 950,
          color: "rgba(234,240,255,0.86)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.85 }}>1e</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {top1.map((e, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "7px 10px",
                  fontSize: 12.5,
                  color: "rgba(234,240,255,0.84)",
                  borderTop: "none",
                  width: "72%",
                }}
              >
                <span style={{ opacity: 0.75, marginRight: 8 }}>1.</span>
                {e.name}
                {e.extra ? <span style={{ opacity: 0.75 }}> • {e.extra}</span> : null}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  fontSize: 12.5,
                  color: "rgba(234,240,255,0.92)",
                  borderTop: "none",
                  width: "28%",
                  textAlign: "right",
                  fontWeight: 950,
                  whiteSpace: "nowrap",
                }}
              >
                {e.record}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
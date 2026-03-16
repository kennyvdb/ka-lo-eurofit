"use client";

import React from "react";

type TileGridProps = {
  children: React.ReactNode;
};

export function TileGrid({ children }: TileGridProps) {
  return (
    <div className="tile-grid-wrap">
      <div className="tile-grid">{children}</div>

      <style jsx>{`
        .tile-grid-wrap {
          width: 100%;
        }

        .tile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
        }

        @media (min-width: 700px) {
          .tile-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 1100px) {
          .tile-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            max-width: 1120px;
          }
        }
      `}</style>
    </div>
  );
}
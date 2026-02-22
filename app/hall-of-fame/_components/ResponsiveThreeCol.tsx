import React from "react";

export default function ResponsiveThreeCol({ children }: { children: React.ReactNode }) {
  const [isWide, setIsWide] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isWide ? "repeat(3, minmax(0, 1fr))" : "1fr",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}
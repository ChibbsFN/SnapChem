import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SnapChem",
  description: "Scan-first chemical safety + inventory (starter)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        margin: 0,
        background: "#0b0b0c",
        color: "#f2f2f3",
      }}>
        {children}
      </body>
    </html>
  );
}

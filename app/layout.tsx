import { redirect } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔥 FORCE all traffic to signup unless already there
  if (typeof window === "undefined") {
    const path = "/"; // server side doesn't know path easily, so we just force root behavior
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
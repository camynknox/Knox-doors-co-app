"use client";

import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 40 }}>
      <h1>Sign Up (Temporarily Disabled)</h1>

      <button
        onClick={() => router.push("/login")}
        style={{
          padding: "12px 18px",
          borderRadius: "12px",
          background: "#111",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Go to Login
      </button>
    </div>
  );
}
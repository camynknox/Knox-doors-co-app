"use client";

import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            margin: 0,
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          Sign Up
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "24px",
          }}
        >
          This page is temporarily disabled for deployment.
        </p>

        <button
          onClick={() => router.push("/login")}
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            border: "none",
            background: "#111",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
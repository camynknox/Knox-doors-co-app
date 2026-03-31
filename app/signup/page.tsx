"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignupPage() {
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Create Account</h1>

      <form onSubmit={handleSignUp}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <p>{message}</p>

      <p style={{ marginTop: 20 }}>
        Already have an account?{" "}
        <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
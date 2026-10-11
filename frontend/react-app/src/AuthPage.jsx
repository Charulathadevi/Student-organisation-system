import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck, UserRound, Sparkles } from "lucide-react";
import "./AuthPage.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  function updateForm(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload = mode === "signup"
        ? form
        : { email: form.email, password: form.password };
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to authenticate. Please try again.");
      localStorage.setItem("campushub_token", data.token);
      localStorage.setItem("campushub_user", JSON.stringify(data.user));
      onAuthenticated({ token: data.token, user: data.user });
    } catch (err) {
      setError(err.message || "Could not connect to the server. Please check that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-integrated">
      <section className="auth-integrated-brand">
        <div className="auth-integrated-mark"><GraduationCap size={30} /></div>
        <p className="auth-integrated-eyebrow">YOUR CAMPUS. YOUR COMMUNITY.</p>
        <h1>One campus.<br /><span>Many possibilities.</span></h1>
        <p className="auth-integrated-intro">Manage your student organisation, discover campus events, and stay connected with your community.</p>
        <div className="auth-integrated-feature"><ShieldCheck size={18} /> Secure, role-based access</div>
        <div className="auth-integrated-feature"><Sparkles size={18} /> One portal for your organisation</div>
      </section>

      <section className="auth-integrated-card">
        <div className="auth-integrated-mobile-brand"><GraduationCap size={23} /><strong>Skyline Association</strong></div>
        <span className="auth-integrated-pill"><Sparkles size={13} /> STUDENT ORGANISATION</span>
        <h2>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
        <p className="auth-integrated-subtitle">{mode === "signup" ? "Join your campus community today." : "Sign in to continue to your portal."}</p>
        <div className="auth-integrated-tabs">
          <button type="button" className={mode === "signin" ? "selected" : ""} onClick={() => { setMode("signin"); setError(""); }}>Sign In</button>
          <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => { setMode("signup"); setError(""); }}>Sign Up</button>
        </div>
        <form className="auth-integrated-form" onSubmit={submit}>
          {mode === "signup" && <label>Full name<div className="auth-integrated-input"><UserRound size={17} /><input name="name" value={form.name} onChange={updateForm} placeholder="Enter your full name" minLength={2} autoComplete="name" required /></div></label>}
          <label>Email address<div className="auth-integrated-input"><span className="auth-at">@</span><input name="email" type="email" value={form.email} onChange={updateForm} placeholder="you@example.com" autoComplete="email" required /></div></label>
          <label>Password<div className="auth-integrated-input"><ShieldCheck size={17} /><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateForm} placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required /><button className="auth-eye" type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Show or hide password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{mode === "signup" && <small>Use 8+ characters, including uppercase, lowercase, a number and a symbol.</small>}</label>
          {mode === "signup" && <label>Confirm password<div className="auth-integrated-input"><ShieldCheck size={17} /><input name="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={updateForm} placeholder="Enter password again" autoComplete="new-password" required /></div></label>}
          {error && <div className="auth-integrated-error" role="alert">{error}</div>}
          <button className="auth-integrated-submit" disabled={busy}>{busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={17} /></button>
        </form>
        <p className="auth-integrated-switch">{mode === "signup" ? "Already have an account?" : "New to your campus portal?"} <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}>{mode === "signup" ? "Sign in" : "Create account"}</button></p>
        <p className="auth-integrated-footnote">Your dashboard is selected automatically based on your account role.</p>
      </section>
    </div>
  );
}

import { apiRequest } from "./api";
import { Brand, GraduationMark, Icon, ThemeToggle } from "./UI";
import { useEffect, useState } from "react";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function checkLogin() {
      try {
        const data = await apiRequest("/api/auth/me", { signal: controller.signal });
        setUser(data.user);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }

    checkLogin();

    return () => controller.abort();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const formData = new FormData(event.currentTarget);

    const values = {
      email: formData.get("email").trim(),
      password: formData.get("password"),
    };

    if (registering) {
      values.name = formData.get("name").trim();
    }

    try {
      const data = await apiRequest(
        `/api/auth/${registering ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError("");

    try {
      await apiRequest("/api/auth/logout", { method: "POST" });

      setUser(null);
      setRegistering(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <div className="header-actions">
          <ThemeToggle />
          {user && <>
            <div className="account-summary"><span className="account-name">{user.name}</span><span className="role-badge">{user.role === "admin" ? "Admin" : "User"}</span></div>
            <button type="button" className="logout-button" disabled={busy} onClick={handleLogout}><Icon name="logout" /><span>{busy ? "Logging out..." : "Logout"}</span></button>
          </>}
        </div>
      </div>
    </header>
  );

  if (checking) {
    return <>{header}<main><p role="status" className="status-line"><span className="spinner" />Checking your login...</p></main></>;
  }

  if (user) {
    return <><a className="skip-link" href="#main-content">Skip to dashboard</a>{header}{error && <div className="header-error" role="alert">{error}</div>}{children(user)}</>;
  }

  return (
    <>
      {header}
      <main className="auth-layout">
        <aside className="auth-intro">
          <span className="intro-mark"><GraduationMark /></span>
          <p className="eyebrow">YOUR STUDENT DIRECTORY</p>
          <h1>A little more organized.<br /><span>A lot more focused.</span></h1>
          <p>One place for student records, recent registrations, and the details that matter.</p>
          <div className="intro-features"><span><Icon name="users" />Student records</span><span><Icon name="calendar" />Registration overview</span><span><Icon name="book" />Course information</span></div>
          <p className="intro-credit">Devixo Solutions · Web Development Internship</p>
        </aside>
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="eyebrow">STUDENT MANAGEMENT SYSTEM</p>
          <h2 id="auth-title">{registering ? "Create your account" : "Welcome back"}</h2>
          <p className="section-description">{registering ? "Register to browse your student directory." : "Login to continue to your dashboard."}</p>
          <form key={registering ? "register" : "login"} onSubmit={handleSubmit}>
            <fieldset disabled={busy}>
              <legend className="sr-only">{registering ? "Registration details" : "Login details"}</legend>
              {registering && <div className="form-field"><label htmlFor="accountName">Full name</label><input id="accountName" name="name" autoComplete="name" placeholder="Your full name" maxLength={100} required /></div>}
              <div className="form-field"><label htmlFor="accountEmail">Email address</label><input id="accountEmail" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></div>
              <div className="form-field"><label htmlFor="accountPassword">Password</label><input id="accountPassword" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : undefined} placeholder={registering ? "At least 8 characters" : "Enter your password"} required /></div>
              {registering && <p className="field-help">New accounts have read-only access. Admin access is managed separately.</p>}
              <button className="button-primary auth-submit" type="submit">{busy && <span className="spinner" />}{busy ? "Please wait..." : registering ? "Create Account" : "Login"}{!busy && <Icon name="chevron" />}</button>
            </fieldset>
          </form>
          {error && <p role="alert">{error}</p>}
          <p className="auth-switch">{registering ? "Already registered?" : "New here?"}<button type="button" className="text-button" disabled={busy} onClick={() => { setRegistering(!registering); setError(""); }}>{registering ? "Login" : "Create an account"}</button></p>
        </section>
      </main>
    </>
  );
}

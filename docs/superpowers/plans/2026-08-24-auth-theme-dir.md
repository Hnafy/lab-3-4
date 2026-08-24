# Auth Gating, Theme & Direction Contexts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the existing todo app behind FreeAPI login (token in localStorage), with logout, plus dark/light theme and ltr/rtl direction managed via separate React contexts.

**Architecture:** Three independent contexts (`AuthContext`, `ThemeContext`, `DirContext`), each provider + custom hook. `App.jsx` conditionally renders `AuthForm` (login/register toggled by `useState`) or `Header` + `TodoList` based on token presence. No react-router.

**Tech Stack:** React 18, Vite 5, plain `fetch()`, CSS variables. Spec: `docs/superpowers/specs/2026-08-24-auth-theme-dir-design.md`

**Note:** This project is NOT a git repository, so there are no commit steps. Verification is `npm run lint` plus manual browser checks (no test framework installed — per spec's verification plan).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/context/ThemeContext.jsx` | Create | theme state, persistence, `data-theme` on body |
| `src/context/DirContext.jsx` | Create | dir state, persistence, `dir` attribute on html |
| `src/context/AuthContext.jsx` | Create | token/user state, localStorage, login/register/logout |
| `src/components/AuthForm.jsx` | Create | login + register forms toggled by useState |
| `src/components/auth.css` | Create | auth card styles |
| `src/components/Header.jsx` | Create | greeting, Logout button |
| `src/components/header.css` | Create | header styles |
| `src/components/PreferencesControls.jsx` | Create | shared theme + dir toggle buttons (used by both Header and AuthForm) |
| `src/components/preferences.css` | Create | styles for PreferencesControls |
| `src/App.jsx` | Modify | providers + conditional rendering |
| `src/index.css` | Modify | own all CSS variables (dark defaults + light overrides) so both screens are themed even when TodoList isn't mounted |
| `src/components/todoList.css` | Modify | remove `:root` block (moved to index.css) |

---

### Task 1: DirContext

**Files:**
- Create: `src/context/DirContext.jsx`

- [ ] **Step 1: Create the DirProvider and useDir hook**

Create `src/context/DirContext.jsx` with exactly this content:

```jsx
import { createContext, useContext, useEffect, useState } from "react";

const DirContext = createContext(null);

export function DirProvider({ children }) {
  const [dir, setDir] = useState(() => localStorage.getItem("dir") || "ltr");

  useEffect(() => {
    document.documentElement.dir = dir;
    localStorage.setItem("dir", dir);
  }, [dir]);

  function toggleDir() {
    setDir((d) => (d === "ltr" ? "rtl" : "ltr"));
  }

  return (
    <DirContext.Provider value={{ dir, toggleDir }}>
      {children}
    </DirContext.Provider>
  );
}

export function useDir() {
  const ctx = useContext(DirContext);
  if (!ctx) throw new Error("useDir must be used within DirProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify no lint errors in the new file**

Run: `npm run lint`
Expected: exits without error for this file (other files unchanged, so overall output should be clean).

---

### Task 2: ThemeContext

**Files:**
- Create: `src/context/ThemeContext.jsx`

- [ ] **Step 1: Create the ThemeProvider and useTheme hook**

Create `src/context/ThemeContext.jsx` with exactly this content:

```jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify no lint errors**

Run: `npm run lint`
Expected: clean.

---

### Task 3: AuthContext

**Files:**
- Create: `src/context/AuthContext.jsx`

- [ ] **Step 1: Create the AuthProvider and useAuth hook**

Create `src/context/AuthContext.jsx` with exactly this content:

```jsx
import { createContext, useContext, useState } from "react";

const API_URL = "https://api.freeapi.app/api/v1";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

async function postJson(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);

  async function login(username, password) {
    const json = await postJson("/users/login", { username, password });
    const { accessToken, user: loggedInUser } = json.data;
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  }

  async function register({ username, email, password }) {
    await postJson("/users/register", {
      username,
      email,
      password,
      role: "USER",
    });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify no lint errors**

Run: `npm run lint`
Expected: clean.

---

### Task 4: Move CSS variables to index.css and add light theme

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/todoList.css:7-34`

- [ ] **Step 1: Replace src/index.css entirely**

The variables must live in `index.css` because it is always loaded; `todoList.css` only loads when TodoList mounts, and the logged-out auth screen needs the variables too.

Replace the whole content of `src/index.css` with:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Backgrounds */
  --page-bg: #0f172a;
  --bg-primary: #121212;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #222222;
  --bg-info: #0f1f33;
  --bg-success: #1a2b14;
  --bg-warning: #33240f;
  --bg-danger: #2b1414;

  /* Text */
  --text-primary: #f5f5f5;
  --text-secondary: #b3b3b3;
  --text-tertiary: #808080;
  --text-info: #6cb6ff;
  --text-success: #8fd14f;
  --text-warning: #ffb347;
  --text-danger: #ff6b6b;

  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.4);
  --border-secondary: rgba(255, 255, 255, 0.25);
  --border-tertiary: rgba(255, 255, 255, 0.12);
  --border-info: #4da3ff;
  --border-success: #7ecb3a;
  --border-warning: #e09b3d;
  --border-danger: #ff5c5c;

  /* Accent */
  --accent: #534ab7;
  --accent-hover: #3c3489;
  --accent-text: #ffffff;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background-color: var(--page-bg);
  transition: background-color 0.2s;
}

body[data-theme="light"] {
  --page-bg: #e2e8f0;
  --bg-primary: #ffffff;
  --bg-secondary: #f1f5f9;
  --bg-tertiary: #e2e8f0;
  --bg-info: #dbeafe;
  --bg-success: #dcfce7;
  --bg-warning: #fef3c7;
  --bg-danger: #fee2e2;

  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-tertiary: #64748b;
  --text-info: #1d4ed8;
  --text-success: #15803d;
  --text-warning: #b45309;
  --text-danger: #b91c1c;

  --border-primary: rgba(15, 23, 42, 0.4);
  --border-secondary: rgba(15, 23, 42, 0.25);
  --border-tertiary: rgba(15, 23, 42, 0.12);
  --border-info: #3b82f6;
  --border-success: #22c55e;
  --border-warning: #f59e0b;
  --border-danger: #ef4444;

  --accent: #534ab7;
  --accent-hover: #3c3489;
  --accent-text: #ffffff;
}
```

- [ ] **Step 2: Remove the :root block from todoList.css**

Delete lines 7-34 of `src/components/todoList.css` (the entire `:root { ... }` block). Everything else stays untouched.

- [ ] **Step 3: Verify app still renders dark theme**

Run: `npm run dev`, open http://localhost:5173
Expected: todo list looks identical to before (dark).

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 5: AuthForm component

**Files:**
- Create: `src/components/AuthForm.jsx`
- Create: `src/components/auth.css`

- [ ] **Step 1: Create AuthForm.jsx**

```jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PreferencesControls from "./PreferencesControls";
import "./auth.css";

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    if (nextMode === "register") setInfo("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (mode === "register" && !email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setMode("login");
        setUsername("");
        setEmail("");
        setPassword("");
        setInfo("Account created successfully. Please log in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-top">
        <PreferencesControls />
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Login" : "Register"}</h2>

        {info && <p className="auth-info">{info}</p>}
        {error && <p className="auth-error">{error}</p>}

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="doejohn"
          />
        </label>

        {mode === "register" && (
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user.email@domain.com"
            />
          </label>
        )}

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Register"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => switchMode("register")}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("login")}>
                Login
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create auth.css**

```css
.auth-wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.auth-top {
  width: 100%;
  max-width: 380px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  padding: 28px 24px;
  border: 0.5px solid var(--border-secondary);
  border-radius: 12px;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-card h2 {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

.auth-card label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.auth-card input {
  height: 40px;
  padding: 0 14px;
  font-size: 14px;
  border-radius: 8px;
  border: 0.5px solid var(--border-secondary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.auth-card input:focus-visible {
  outline: 2px solid var(--text-info);
  outline-offset: 2px;
}

.auth-card input::placeholder {
  color: var(--text-tertiary);
}

.auth-card button[type="submit"] {
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: var(--accent-text);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.auth-card button[type="submit"]:hover:not(:disabled) {
  background: var(--accent-hover);
}

.auth-card button[type="submit"]:active:not(:disabled) {
  transform: scale(0.97);
}

.auth-card button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}

.auth-switch button {
  background: none;
  border: none;
  color: var(--text-info);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.auth-switch button:hover {
  text-decoration: underline;
}

.auth-error {
  font-size: 13px;
  color: var(--text-danger);
  background: var(--bg-danger);
  border: 0.5px solid var(--border-danger);
  border-radius: 8px;
  padding: 8px 12px;
}

.auth-info {
  font-size: 13px;
  color: var(--text-success);
  background: var(--bg-success);
  border: 0.5px solid var(--border-success);
  border-radius: 8px;
  padding: 8px 12px;
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 6: PreferencesControls (shared theme + dir toggles)

**Files:**
- Create: `src/components/PreferencesControls.jsx`
- Create: `src/components/preferences.css`

The spec requires theme/dir toggles on BOTH the login screen and the logged-in screen, so the buttons live in one shared component.

- [ ] **Step 1: Create PreferencesControls.jsx**

```jsx
import { useTheme } from "../context/ThemeContext";
import { useDir } from "../context/DirContext";
import "./preferences.css";

export default function PreferencesControls() {
  const { theme, toggleTheme } = useTheme();
  const { dir, toggleDir } = useDir();

  return (
    <div className="prefs">
      <button onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <button onClick={toggleDir} aria-label="Toggle direction">
        {dir === "ltr" ? "RTL" : "LTR"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create preferences.css**

```css
.prefs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prefs button {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 0.5px solid var(--border-tertiary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.prefs button:hover {
  border-color: var(--border-secondary);
  background: var(--bg-tertiary);
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 7: Header component

**Files:**
- Create: `src/components/Header.jsx`
- Create: `src/components/header.css`

- [ ] **Step 1: Create Header.jsx**

```jsx
import { useAuth } from "../context/AuthContext";
import PreferencesControls from "./PreferencesControls";
import "./header.css";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="brand">Todo App</span>
        {user?.username && <span className="username">Hi, {user.username}</span>}
      </div>
      <div className="header-actions">
        <PreferencesControls />
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create header.css**

```css
.app-header {
  max-width: 500px;
  margin: 16px auto 0;
  padding: 12px 24px;
  border: 0.5px solid var(--border-secondary);
  border-radius: 12px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.username {
  font-size: 13px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-button {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 0.5px solid var(--border-danger);
  background: var(--bg-danger);
  color: var(--text-danger);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.logout-button:hover {
  border-color: var(--border-danger);
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 8: Wire everything in App.jsx

**Files:**
- Modify: `src/App.jsx` (replace entire file)

- [ ] **Step 1: Replace App.jsx**

```jsx
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DirProvider } from "./context/DirContext";
import Header from "./components/Header";
import AuthForm from "./components/AuthForm";
import Todo from "./components/TodoList";

function AppContent() {
  const { token } = useAuth();

  if (!token) {
    return <AuthForm />;
  }

  return (
    <>
      <Header />
      <Todo />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DirProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </DirProvider>
    </ThemeProvider>
  );
}
```

Note: `main.jsx` already renders `<App />` inside StrictMode and imports `./index.css` — no change needed there.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 9: Full manual verification

**Files:** none (verification only)

Run: `npm run dev`, open http://localhost:5173

- [ ] **Step 1: Logged-out gating**

Open DevTools > Application > Local Storage > http://localhost:5173 and remove any `token` key (or use a fresh profile). Reload.
Expected: ONLY the login card is visible (no header, no todos).

- [ ] **Step 2: Register flow**

Click "Register". Fill username/email/password (e.g. `doejohn` / an unused email / `test@123`) and submit.
Expected: switches back to Login view with green "Account created successfully. Please log in." message. (If username/email already exists, a red API error appears instead — also acceptable behavior.)

- [ ] **Step 3: Login + token persistence**

Log in with valid credentials (the seeded account `doejohn` / `test@123` or your new account).
Expected: todo screen appears with header showing "Hi, doejohn". In Application > Local Storage: `token` holds the JWT accessToken string, `user` holds the JSON user object.

- [ ] **Step 4: Refresh keeps session**

Reload the page.
Expected: still logged in (token was read back from localStorage).

- [ ] **Step 5: Theme toggle + persistence**

Click the theme button.
Expected: page flips to light colors. Click again -> back to dark. Reload -> choice persists (localStorage `theme`).

- [ ] **Step 6: Dir toggle + persistence**

Click the RTL/LTR button.
Expected: whole page direction flips (`<html dir="rtl">`). Click again -> back. Reload -> persists (localStorage `dir`).

- [ ] **Step 7: Logout**

Click Logout.
Expected: returns immediately to the login-only screen. Local Storage no longer contains `token` or `user`. Reload -> login screen still shown. The theme and dir toggles are ALSO visible on this logged-out screen and keep working there.

- [ ] **Step 8: Final lint**

Run: `npm run lint`
Expected: clean exit.

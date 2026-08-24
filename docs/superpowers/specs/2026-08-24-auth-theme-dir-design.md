# Design: Auth Gating, Theme & Direction Contexts (Task 14)

Date: 2026-08-24
Project: Vite + React 18 todo app (ITI Training, Task 14)

## Goal

Add authentication to the existing todo app using the FreeAPI backend:

1. Save the auth token in `localStorage` after a successful login.
2. When not logged in, show only the login screen (with a register view).
3. Provide a Logout button that clears the token.
4. Manage theme (dark/light) via `useContext`.
5. Manage text direction (`ltr`/`rtl`) via `useContext`.

Login and register are switched with `useState` conditional rendering. No react-router.

## API

Base URL: `https://api.freeapi.app/api/v1`

### Register

`POST /users/register`

```json
{ "email": "...", "password": "...", "role": "USER", "username": "..." }
```

Response: `{ success: true, data: { user } }`

### Login

`POST /users/login`

```json
{ "password": "...", "username": "..." }
```

Response: `{ success: true, data: { accessToken, refreshToken, user }, message, statusCode }`

## Architecture

Three separate React contexts, each with a provider component and a custom hook:

```
src/
  context/
    AuthContext.jsx    AuthProvider + useAuth   -> { token, user, login, register, logout }
    ThemeContext.jsx   ThemeProvider + useTheme -> { theme, toggleTheme }
    DirContext.jsx     DirProvider + useDir     -> { dir, toggleDir }
  components/
    TodoList.jsx       existing component, logic untouched; restyled via CSS variables
    todoList.css       extended for light/dark themes
    AuthForm.jsx       login/register card; useState("login" | "register") toggles views
    auth.css           styles for AuthForm
    Header.jsx         greeting with username, Logout button, theme toggle, dir toggle
    header.css         styles for Header
  App.jsx              providers wrap content; renders Header+TodoList or AuthForm based on token
```

## Data Flow

### Auth (AuthContext)

- State: `{ token, user }`.
- Initialization: read `localStorage.getItem("token")` and `localStorage.getItem("user")` lazily so a page refresh keeps the user logged in.
- `login(username, password)`:
  1. POST `/users/login` with JSON body.
  2. On success store `data.accessToken` under localStorage key `token`, and `data.user` under key `user` (JSON-stringified); set both in state.
  3. On failure throw/return the API error message for display.
- `register({ username, email, password })`:
  1. POST `/users/register` with JSON body (`role` defaults to `"USER"`).
  2. On success the caller switches the form back to the login view.
- `logout()`:
  1. Remove `token` and `user` from localStorage.
  2. Reset state to `{ token: null, user: null }` -> app re-renders to the login screen.

Requests use plain `fetch()` with `Content-Type: application/json`.

### Gating (App.jsx)

- `const { token } = useAuth()`
- `token ? <><Header/><TodoList/></> : <AuthForm/>`
- Nothing else mounts while logged out.

## ThemeContext

- Values: `"dark"` | `"light"`. Default `"dark"` (matches current design).
- Persisted in localStorage key `theme`; initialized lazily from it.
- Effect applies `document.body.dataset.theme = theme` so CSS variables switch:
  - `[data-theme="dark"]`: `--bg: #0f172a`, light card/text colors.
  - `[data-theme="light"]`: `--bg: #f1f5f9`, dark card/text colors.
- Exposes `{ theme, toggleTheme }`.

## DirContext

- Values: `"ltr"` | `"rtl"`. Default `"ltr"`.
- Persisted in localStorage key `dir`; initialized lazily.
- Effect sets `document.documentElement.dir = dir` (whole page flips direction).
- Exposes `{ dir, toggleDir }`.

## Components

### AuthForm

- Local state: `mode` ("login" | "register"), form fields, error message, loading flag.
- Client-side required-field validation before hitting the API.
- Shows the API's error message in red on failure; disables the submit button while loading.
- After successful registration, switches to login mode with an info message ("Account created - please log in").
- Login success calls `login()` from useAuth; no manual navigation needed.

### Header

- Shows logged-in username (from `useAuth().user.username`).
- Buttons: Logout (calls `logout()`), Theme toggle (sun/moon label), Dir toggle (`LTR`/`RTL` label).
- Uses `useTheme()` and `useDir()`.

### TodoList

- Existing logic unchanged. Styling moves onto CSS variables so it adapts to theme automatically.

## Error Handling

- Network/API errors surface their message under the relevant form.
- Token validity is not re-verified against the API on load (out of task scope); logout always works locally.
- Malformed/corrupted `user` JSON in localStorage falls back to `null` safely.

## Verification Plan

Manual checks:

1. Register a new account -> lands back on login view.
2. Login -> DevTools > Application > Local Storage shows `token` and `user`.
3. Refresh -> still logged in (todo screen visible).
4. Logout -> back to login-only screen; localStorage keys removed.
5. Toggle theme -> colors change; refresh keeps choice.
6. Toggle dir -> page direction flips; refresh keeps choice.
7. `npm run lint` passes.

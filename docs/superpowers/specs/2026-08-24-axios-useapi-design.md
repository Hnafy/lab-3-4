# Design: Axios Instance + useApi Custom Hook

Date: 2026-08-24
Builds on: `2026-08-24-auth-theme-dir-design.md`, `2026-08-24-server-todos-design.md`

## Goal

Restructure the API layer to match the requested pattern: a configured axios instance with interceptors plus endpoint functions exported from one module, consumed through a reusable `useApi` custom hook. Replaces the hand-written `fetch` helper everywhere.

## Decisions (user-approved)

- Token source: dynamic — request interceptor reads `localStorage.getItem("token")` per call instead of a hardcoded constant.
- Scope: ALL calls (auth + todos) go through axios; the old `fetch`-based helper is deleted.
- Auto-logout on 401 is preserved inside the response error interceptor.
- Response interceptor unwraps `response.data.data` (FreeAPI envelope), so callers receive payloads directly.

## Files

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | add `axios` dependency |
| `src/lib/api.js` | Rewrite | axios instance + request/response interceptors + endpoint functions (`loginUser`, `registerUser`, `getAllTodos`, `createTodo`, `updateTodo`, `toggleTodoStatus`, `deleteTodo`) + `setUnauthorizedHandler` |
| `src/hooks/useApi.js` | Create | generic `useApi(apiFunction, immediate)` -> `{ data, loading, error, execute, setData }` |
| `src/context/AuthContext.jsx` | Modify | use `loginUser`/`registerUser`; unwrapped login payload `{ accessToken, refreshToken, user }` |
| `src/components/TodoList.jsx` | Modify | `useApi(getAllTodos)` for list; endpoint functions for mutations; refetch via `execute` after each mutation |

## Behavior Notes

- `useApi` initializes `data` as `[]`, runs immediately by default, exposes `execute(...args)` for manual/refetch calls.
- Mutation failures surface via local `actionError`; list errors come from the hook's own `error`. UI shows whichever exists.
- Per-row busy lock (`busyId`) unchanged.
- Live-API corrections discovered during verification: todo completion field is `isComplete` (not `isDone` as in FreeAPI docs), and `/todos` is public (200 without token) so 401 auto-logout is dormant for todos. `smoke-test.mjs` at repo root exercises the whole axios layer against the live API.

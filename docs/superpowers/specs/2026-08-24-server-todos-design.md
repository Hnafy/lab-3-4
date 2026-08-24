# Design: Server-Backed Todos via FreeAPI

Date: 2026-08-24
Builds on: `2026-08-24-auth-theme-dir-design.md`

## Goal

Replace localStorage todo persistence with the FreeAPI todos endpoints. Todos live on the server per logged-in user, sent with the Bearer token from login.

## API Contract (verified live)

Base: `https://api.freeapi.app/api/v1`, header `Authorization: Bearer <accessToken>`

| Action | Method & Path | Body | Result |
|---|---|---|---|
| List | `GET /todos` | - | `data: Todo[]` |
| Create | `POST /todos/` | `{ title }` (`description` optional) | `data: Todo` |
| Update | `PATCH /todos/{todoId}` | `{ title }` | `data: Todo` |
| Toggle done | `PATCH /todos/toggle/status/{todoId}` | - | toggles `isDone` |
| Delete | `DELETE /todos/{todoId}` | - | removes |

Todo shape: `{ _id, title, description, isComplete, createdAt, updatedAt }` (live API uses `isComplete`; older FreeAPI docs call it `isDone`). NOTE: `/todos` is public on FreeAPI — it answers 200 even without a token, so 401 auto-logout stays dormant for these endpoints.
Error envelope: `{ success: false, message, statusCode }` (422 validation, 401 unauthorized)

## Architecture

**Approach B: shared API helper.**

```
src/lib/api.js            apiFetch(path, { method, body }) -> parsed json.data-aware envelope
src/context/AuthContext.jsx  registers handleUnauthorized callback; postJson removed in favor of apiFetch
src/components/TodoList.jsx  rewritten: server CRUD, no localStorage
```

### api.js

- Reads token from localStorage directly (no React imports).
- Attaches `Authorization: Bearer <token>` when present.
- Parses JSON envelope; throws `Object { message, status }` when `!res.ok || !json.success`.
- On status 401 calls the registered `onUnauthorized()` callback if set.

### AuthContext changes

- On mount sets the unauthorized callback via `setUnauthorizedHandler(() => logout())`.
- Login/register switch to `apiFetch`; behavior unchanged otherwise.
- Logout also clears the callback? No — callback stays registered; it only fires on 401 which cannot happen when logged out (no API calls are made).

### TodoList.jsx rewrite

- State: `todos[]`, `input`, `editingId`, `loading`, `error`, `busyId` (per-row request lock).
- Mount effect: fetch list; map `_id -> id`, `title -> todo text`, `isDone -> completed` conceptually but store raw API objects and adapt render.
- Add: POST, then refresh list from response data (append returned todo).
- Edit: PATCH with new title.
- Complete toggle: PATCH toggle/status, use returned todo to update state.
- Delete: DELETE by id, remove from state on success.
- Errors: banner at top of card using `--text-danger`/`--bg-danger` vars; auto-clears on next successful action.
- localStorage key `myTodo` and its persistence effect removed entirely.

## Error Handling

- Network failure / non-success envelope: message shown in red banner inside todo card.
- 401 anywhere: auto-logout -> login screen.
- Empty list: keep existing `.empty` styling ("No todos yet").

## Verification Plan

1. Login -> todos load from server (spinner text while loading).
2. Add todo -> appears in server list (verify via GET /todos).
3. Click text -> strikethrough persists after refresh (server isDone).
4. Update -> new title persisted.
5. X delete -> row gone after refresh.
6. Tamper token in localStorage -> any action logs out automatically.
7. `npm run lint` + `npm run build` clean.

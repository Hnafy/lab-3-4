# Server-Backed Todos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage todo persistence with FreeAPI `/todos` CRUD using the Bearer token, with auto-logout on 401.

**Architecture:** Shared `src/lib/api.js` helper (attaches Bearer token, parses FreeAPI envelope, registers unauthorized callback). AuthContext registers the callback and uses `apiFetch` for login/register. TodoList rewritten as server-CRUD component. Spec: `docs/superpowers/specs/2026-08-24-server-todos-design.md`

**Tech Stack:** React 18, Vite, plain fetch. Not a git repo — no commit steps.

**Verified live contract:** `GET /todos`, `POST /todos/ {title}`, `PATCH /todos/{id} {title}`, `PATCH /todos/toggle/status/{id}`, `DELETE /todos/{id}` — envelope `{success,message,data,statusCode}`. Note: some mutations return sparse bodies, so every successful mutation re-fetches the list (`fetchTodos()`) instead of trusting the response payload.

---

### Task 1: Create src/lib/api.js

**Files:**
- Create: `src/lib/api.js`

- [ ] **Step 1: Write the module**

```js
const API_URL = "https://api.freeapi.app/api/v1";

let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok || !json || !json.success) {
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const error = new Error(
      (json && json.message) || `Request failed (${res.status})`,
    );
    error.status = res.status;
    throw error;
  }

  return json;
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 2: Refactor AuthContext onto apiFetch

**Files:**
- Modify: `src/context/AuthContext.jsx` (replace entire file)

- [ ] **Step 1: Replace AuthContext.jsx**

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, setUnauthorizedHandler } from "../lib/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);

  function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, []);

  async function login(username, password) {
    const json = await apiFetch("/users/login", {
      method: "POST",
      body: { username, password },
    });
    const { accessToken, user: loggedInUser } = json.data;
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  }

  async function register({ username, email, password }) {
    await apiFetch("/users/register", {
      method: "POST",
      body: { username, email, password, role: "USER" },
    });
  }

  function logout() {
    clearSession();
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

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 3: Rewrite TodoList.jsx as server CRUD

**Files:**
- Modify: `src/components/TodoList.jsx` (replace entire file)
- Modify: `src/components/todoList.css` (append one rule)

- [ ] **Step 1: Replace TodoList.jsx**

```jsx
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import "./todoList.css";

export default function Todo() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const addInput = useRef();

  async function fetchTodos() {
    try {
      const json = await apiFetch("/todos");
      setTodos(json.data);
      return true;
    } catch (err) {
      if (err.status !== 401) setError(err.message);
      return false;
    }
  }

  useEffect(() => {
    (async () => {
      await fetchTodos();
      setLoading(false);
    })();
  }, []);

  async function runMutation(id, action) {
    setBusyId(id);
    setError("");
    try {
      await action();
      await fetchTodos();
      return true;
    } catch (err) {
      if (err.status !== 401) setError(err.message);
      return false;
    } finally {
      setBusyId(null);
    }
  }

  // add/update btn
  function saveTodo() {
    const title = input.trim();
    if (title === "") return;

    if (editingId !== null) {
      runMutation("form", () =>
        apiFetch(`/todos/${editingId}`, { method: "PATCH", body: { title } }),
      ).then((ok) => {
        if (ok) {
          setEditingId(null);
          setInput("");
          addInput.current.focus();
        }
      });
      return;
    }

    runMutation("form", () =>
      apiFetch("/todos/", { method: "POST", body: { title } }),
    ).then((ok) => {
      if (ok) {
        setInput("");
        addInput.current.focus();
      }
    });
  }

  // complete toggle on row click
  function handelComplete(id) {
    runMutation(id, () =>
      apiFetch(`/todos/toggle/status/${id}`, { method: "PATCH" }),
    );
  }

  // delete btn in row
  function deleteTodo(id) {
    runMutation(id, () => apiFetch(`/todos/${id}`, { method: "DELETE" }));
  }

  // update btn in row
  function editTodo(item) {
    setEditingId(item._id);
    setInput(item.title);
    addInput.current.focus();
  }

  return (
    <div className="container">
      <h2>To Do List</h2>

      {error && <p className="todo-error">{error}</p>}

      <ul>
        {todos.map((item) => (
          <div className="todo" key={item._id}>
            <li
              onClick={() => handelComplete(item._id)}
              className={item.isDone ? "liActive" : ""}
            >
              {item.title}
            </li>

            <div className="todo-actions">
              <button
                className="edit-button"
                disabled={busyId === item._id}
                onClick={() => editTodo(item)}
              >
                Update
              </button>
              <button
                className="delete-button"
                aria-label={`Delete ${item.title}`}
                disabled={busyId === item._id}
                onClick={() => deleteTodo(item._id)}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </ul>

      {todos.length === 0 && (
        <div className="empty">
          {loading ? "Loading todos..." : "No todos yet"}
        </div>
      )}

      <div className="box">
        <input
          type="text"
          placeholder="Add a new todo"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          ref={addInput}
        />
        <button
          className={editingId !== null ? "update-button" : ""}
          disabled={busyId === "form"}
          onClick={saveTodo}
        >
          {editingId !== null ? "Update" : "Add"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Append error banner style to todoList.css**

```css
.todo-error {
  width: 100%;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-danger);
  background: var(--bg-danger);
  border: 0.5px solid var(--border-danger);
  border-radius: 8px;
  padding: 8px 12px;
}
```

Also add `disabled` cursor styling for row buttons:

```css
.container ul .todo button:disabled,
.container .box button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

---

### Task 4: Verification

**Files:** none

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: builds successfully.

- [ ] **Step 2: Manual browser pass** (http://localhost:5173)

Login -> server todos load; add/toggle/update/delete each reflected after refresh; tamper `token` value in DevTools -> next action bounces to login screen.

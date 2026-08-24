# Axios + useApi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all API traffic to an axios instance with interceptors and endpoint functions, consumed via a `useApi` custom hook.

**Architecture:** See `docs/superpowers/specs/2026-08-24-axios-useapi-design.md`.

**Tech Stack:** React 18, Vite, axios. Not a git repo — no commit steps.

---

### Task 1: Install axios

- [ ] **Step 1:** Run `npm install axios`
Expected: added to dependencies.

### Task 2: Rewrite src/lib/api.js

```js
import axios from "axios";

let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

const api = axios.create({
  baseURL: "https://api.freeapi.app/api/v1",
});

api.interceptors.request.use((config) => {
  const Access_Token = localStorage.getItem("token");
  if (Access_Token) {
    config.headers.Authorization = `Bearer ${Access_Token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const message = error.response?.data?.message || "Internal Server Error";
    return Promise.reject(new Error(message));
  },
);

export default api;

// ---------------auth----------------
export const loginUser = (username, password) =>
  api.post("/users/login", { username, password });

export const registerUser = ({ username, email, password }) =>
  api.post("/users/register", { username, email, password, role: "USER" });

// ---------------todos----------------
export const getAllTodos = () => api.get("/todos");

export const createTodo = (title) => api.post("/todos/", { title });

export const updateTodo = (todoId, title) =>
  api.patch(`/todos/${todoId}`, { title });

export const toggleTodoStatus = (todoId) =>
  api.patch(`/todos/toggle/status/${todoId}`);

export const deleteTodo = (todoId) => api.delete(`/todos/${todoId}`);
```

### Task 3: Create src/hooks/useApi.js

```js
import { useCallback, useEffect, useState } from "react";

export function useApi(apiFunction, immediate = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, execute, setData };
}
```

### Task 4: Update AuthContext to axios endpoints

Login payload arrives unwrapped: `{ accessToken, refreshToken, user }`.

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, setUnauthorizedHandler } from "../lib/api";

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
    const data = await loginUser(username, password);
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  }

  async function register({ username, email, password }) {
    await registerUser({ username, email, password });
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

### Task 5: Update TodoList to useApi

Replace imports and state wiring; render JSX unchanged except error/loading sources.

```jsx
import { useEffect, useRef, useState } from "react";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  toggleTodoStatus,
  updateTodo,
} from "../lib/api";
import { useApi } from "../hooks/useApi";
import "./todoList.css";

export default function Todo() {
  const {
    data: todos,
    loading,
    error: listError,
    execute: refreshTodos,
  } = useApi(getAllTodos);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const addInput = useRef();

  const error = listError || actionError;

  async function runMutation(id, action) {
    setBusyId(id);
    setActionError("");
    try {
      await action();
      await refreshTodos();
      return true;
    } catch (err) {
      setActionError(err.message);
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
      runMutation("form", () => updateTodo(editingId, title)).then((ok) => {
        if (ok) {
          setEditingId(null);
          setInput("");
          addInput.current.focus();
        }
      });
      return;
    }

    runMutation("form", () => createTodo(title)).then((ok) => {
      if (ok) {
        setInput("");
        addInput.current.focus();
      }
    });
  }

  // complete toggle on row click
  function handelComplete(id) {
    runMutation(id, () => toggleTodoStatus(id));
  }

  // delete btn in row
  function deleteItem(id) {
    runMutation(id, () => deleteTodo(id));
  }

  // update btn in row
  function editTodo(item) {
    setEditingId(item._id);
    setInput(item.title);
    addInput.current.focus();
  }

  /* JSX identical to previous version:
     - error banner: {error && <p className="todo-error">{error}</p>}
     - rows map over todos with item._id / item.title / item.isDone
     - empty block shows loading ? "Loading todos..." : "No todos yet"
     - form button disabled={busyId === "form"} */
}
```

(Full JSX carried over from current TodoList.jsx without modification.)

### Task 6: Verification

- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] Manual: login -> list loads; CRUD works; corrupt token -> next action bounces to login.

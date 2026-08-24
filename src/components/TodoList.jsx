import { useMemo, useRef, useState } from "react";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  toggleTodoStatus,
  updateTodo,
} from "../api/api";
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
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const addInput = useRef();

  const error = listError || actionError;

  const filteredTodos = useMemo(
    () =>
      todos.filter((item) =>
        item.title.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [todos, search],
  );

  async function wrapper(id, action) {
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
      wrapper("form", () => updateTodo(editingId, title)).then((ok) => {
        if (ok) {
          setEditingId(null);
          setInput("");
          addInput.current.focus();
        }
      });
      return;
    }

    wrapper("form", () => createTodo(title)).then((ok) => {
      if (ok) {
        setInput("");
        addInput.current.focus();
      }
    });
  }

  // complete toggle on row click
  function handelComplete(id) {
    wrapper(id, () => toggleTodoStatus(id));
  }

  // delete btn in row
  function deleteItem(id) {
    wrapper(id, () => deleteTodo(id));
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

      <input
        type="text"
        className="todo-search"
        placeholder="Search todos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul>
        {filteredTodos.map((item) => (
          <div className="todo" key={item._id}>
            <li
              onClick={() => handelComplete(item._id)}
              className={item.isComplete ? "liActive" : ""}
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
                onClick={() => deleteItem(item._id)}
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

      {todos.length > 0 && filteredTodos.length === 0 && (
        <div className="empty">No matching todos</div>
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

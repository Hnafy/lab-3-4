import { useAuth } from "../context/AuthContext";
import PreferencesControls from "./Controls";
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

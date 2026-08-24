import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DirProvider } from "./context/DirContext";
import Header from "./components/Header";
import AuthForm from "./components/AuthForm";
import Todo from "./components/TodoList";
import Posts from "./components/Posts";
import "./App.css";

function AppContent() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("todos");

  if (!token) {
    return <AuthForm />;
  }

  return (
    <>
      <Header />
      <div className="tabs">
        <button
          className={activeTab === "todos" ? "tab active" : "tab"}
          onClick={() => setActiveTab("todos")}
        >
          Todos
        </button>
        <button
          className={activeTab === "posts" ? "tab active" : "tab"}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
      </div>
      {activeTab === "todos" ? <Todo /> : <Posts />}
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

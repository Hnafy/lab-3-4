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

import { useTheme } from "../context/ThemeContext";
import { useDir } from "../context/DirContext";
import "./preferences.css";

export default function PreferencesControls() {
  const { theme, toggleTheme } = useTheme();
  const { dir, toggleDir } = useDir();

  return (
    <div className="prefs">
      <button onClick={toggleTheme}>
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <button onClick={toggleDir}>
        {dir === "ltr" ? "RTL" : "LTR"}
      </button>
    </div>
  );
}

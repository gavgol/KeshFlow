import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Lock to RTL globally
document.documentElement.setAttribute("dir", "rtl");
document.documentElement.setAttribute("lang", "he");

createRoot(document.getElementById("root")!).render(<App />);

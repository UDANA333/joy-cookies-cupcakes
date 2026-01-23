import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClickToComponent } from "click-to-react-component";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <ClickToComponent />
    <App />
  </StrictMode>
);

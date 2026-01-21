import { createRoot } from "react-dom/client";
import { ClickToComponent } from "click-to-react-component";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <ClickToComponent />
    <App />
  </>
);

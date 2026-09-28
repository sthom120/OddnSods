import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import "./ListPageMobilePolish.css";
import { initialisePwa } from "./pwa";
import { initialiseListPagePolish } from "./listPagePolish";

initialisePwa();
initialiseListPagePolish();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
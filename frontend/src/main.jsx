import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// import { BrowserRouter } from "react-router";
import ContextProvider from "./context/ContextApi.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ContextProvider>
      {/* <BrowserRouter> */}
      <ToastContainer position="top-center" autoClose={3000} theme="dark" />
      <App />
      {/* </BrowserRouter> */}
    </ContextProvider>
  </StrictMode>
);

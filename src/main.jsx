import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import GameNotesPage from "./GameNotesPage.jsx";

const isGameNotes = ["/the-next-play", "/game-notes"].includes(window.location.pathname.replace(/\/$/, ""));
createRoot(document.getElementById("root")).render(isGameNotes ? <GameNotesPage /> : <App />);

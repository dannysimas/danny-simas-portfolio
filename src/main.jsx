import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import GameNotesPage from "./GameNotesPage.jsx";
import { NEXT_PLAY_ENABLED } from "./features.js";

const isGameNotes = ["/the-next-play", "/game-notes"].includes(window.location.pathname.replace(/\/$/, ""));
// Keep old links on the portfolio while The Next Play is paused.
if (isGameNotes && !NEXT_PLAY_ENABLED) {
  window.history.replaceState(null, "", "/");
}

createRoot(document.getElementById("root")).render(
  NEXT_PLAY_ENABLED && isGameNotes ? <GameNotesPage /> : <App />,
);

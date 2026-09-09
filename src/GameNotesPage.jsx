import { useEffect } from "react";
import GameNotes from "./GameNotes.jsx";

export default function GameNotesPage() {
  useEffect(() => {
    document.title = "The Next Play | Danny Simas";
    if (window.location.pathname.replace(/\/$/, "") === "/game-notes") {
      window.history.replaceState(null, "", `/the-next-play${window.location.search}${window.location.hash}`);
    }
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "The Next Play by Danny Simas. First impressions of new releases and upcoming games: buy, wait, or skip.",
    );
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, []);

  return (
    <main className="site-bg game-notes-page play-page">
      <header className="play-header">
        <a className="play-brand" href="/the-next-play">
          <span aria-hidden="true" className="play-forward-mark"><i /><i /><i /></span>
          <span className="play-wordmark"><span className="play-wordmark-the">THE</span><span className="play-wordmark-next">NEXT</span><span className="play-wordmark-play">PLAY</span></span>
          <small>BY DANNY SIMAS</small>
        </a>
        <a className="play-portfolio-link" href="/">Visit portfolio ↗</a>
      </header>
      <GameNotes />
    </main>
  );
}

import { useEffect, useState } from "react";
import "./gaming-library.css";

const gameNotes = [
  {
    id: "onimusha-way-of-the-sword",
    number: "01",
    title: "Onimusha: Way of the Sword",
    stage: "Demo impression",
    meta: "Played the demo · Personal take",
    image: "/images/next-play/onimusha-demo.jpg",
    screenshots: [
      { src: "/images/next-play/screenshots/onimusha-combat.jpg", alt: "Musashi fighting a Genma in the Kiyomizu demo area" },
      { src: "/images/next-play/screenshots/onimusha-enemy.png", alt: "Musashi facing a group of Genma in a temple courtyard" },
      { src: "/images/next-play/screenshots/onimusha-forest.jpg", alt: "Musashi clashing swords with a Genma in a dark forest" },
    ],
    video: { youtubeId: "YBO6nE9I7A8", label: "Official demo trailer", credit: "Capcom USA" },
    verdict: "Wait for sale",
    tone: "wait",
    take: "The combat is fun and the characters look incredible, but the blue-and-teal-heavy palette keeps the world from popping.",
    reasonLabel: "Why I’m waiting",
    reason: "September is packed with releases, so I’m waiting for a sale before I give this one my time and money.",
    positives: ["Fun swordplay", "Great character designs", "Photo mode"],
    concerns: ["Enemy designs", "A flat, blue-and-teal-heavy palette"],
  },
  {
    id: "blood-of-dawnwalker",
    number: "02",
    title: "The Blood of Dawnwalker",
    stage: "Early impression",
    meta: "Played 1 hour · Returned",
    image: "/images/next-play/blood-dawnwalker.jpg",
    screenshots: [
      { src: "/images/next-play/screenshots/dawnwalker-combat.jpg", alt: "Coen fighting bandits in a Dawnwalker forest" },
      { src: "/images/next-play/screenshots/dawnwalker-trail.jpg", alt: "Coen travelling through a mountain trail in Dawnwalker" },
      { src: "/images/next-play/screenshots/dawnwalker-ruins.jpg", alt: "Coen exploring torch-lit ruins in Dawnwalker" },
    ],
    video: { youtubeId: "jVQiJ9ci0HI", label: "Official story trailer", credit: "Rebel Wolves / Bandai Namco" },
    verdict: "Wait for sale",
    tone: "wait",
    take: "After one hour I can’t judge the story, but the visuals and characters disappointed me—and the combat and time system added more friction than fun.",
    reasonLabel: "Why I’m waiting",
    reason: "I returned it for now; I’ll revisit it when the price drops. The performance issues and time investment are hard to justify at $70, especially with The Witcher 3 remaster on the way.",
    positives: [],
    concerns: ["Visuals and characters feel underwhelming", "Combat and time system add friction", "Performance issues", "No photo mode"],
  },
];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const communityConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const supabaseRestUrl = communityConfigured ? `${supabaseUrl}/rest/v1` : "";

function getVisitorId() {
  const storageKey = "danny-simas-community-visitor-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const visitorId = window.crypto?.randomUUID?.()
    || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, visitorId);
  return visitorId;
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseRestUrl}/${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Community request failed (${response.status}).`);
  }

  const responseBody = await response.text();
  return responseBody ? JSON.parse(responseBody) : null;
}

function formatCommentDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
}

function drawCoverImage(context, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;

  context.drawImage(
    image,
    (width - drawnWidth) / 2,
    (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  );
}

function drawContainedImage(context, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;

  context.drawImage(
    image,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  );
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let lastLine = visibleLines[maxLines - 1];

    while (context.measureText(`${lastLine}…`).width > maxWidth && lastLine.length > 1) {
      lastLine = lastLine.slice(0, -1);
    }

    visibleLines[maxLines - 1] = `${lastLine.trim()}…`;
  }

  visibleLines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + visibleLines.length * lineHeight;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function createStoryCard(note) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");

  if (document.fonts?.ready) await document.fonts.ready;

  context.fillStyle = "#050607";
  context.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const image = await loadImage(note.image);

    // Keep a soft, full-bleed version behind the card so the portrait still feels rich.
    context.save();
    context.filter = "blur(22px)";
    context.globalAlpha = 0.28;
    drawCoverImage(context, image, canvas.width, canvas.height);
    context.restore();

    // The source art is landscape, so show the complete frame instead of cropping its characters.
    const artX = 38;
    const artY = 304;
    const artWidth = 1004;
    const artHeight = 570;
    context.fillStyle = "#0a101a";
    context.fillRect(artX, artY, artWidth, artHeight);
    drawContainedImage(context, image, artX, artY, artWidth, artHeight);

    context.strokeStyle = "rgba(103, 232, 249, 0.26)";
    context.lineWidth = 2;
    context.strokeRect(artX, artY, artWidth, artHeight);
  } catch {
    // The branded background still produces a usable card if an image is unavailable.
  }

  const topShade = context.createLinearGradient(0, 0, 0, 620);
  topShade.addColorStop(0, "rgba(5, 6, 7, 0.94)");
  topShade.addColorStop(1, "rgba(5, 6, 7, 0)");
  context.fillStyle = topShade;
  context.fillRect(0, 0, canvas.width, 700);

  const bottomShade = context.createLinearGradient(0, 650, 0, 1920);
  bottomShade.addColorStop(0, "rgba(5, 6, 7, 0)");
  bottomShade.addColorStop(0.32, "rgba(5, 6, 7, 0.52)");
  bottomShade.addColorStop(1, "rgba(5, 6, 7, 0.98)");
  context.fillStyle = bottomShade;
  context.fillRect(0, 600, canvas.width, 1320);

  const colorWash = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  colorWash.addColorStop(0, "rgba(34, 211, 238, 0.12)");
  colorWash.addColorStop(0.55, "rgba(139, 92, 246, 0)");
  colorWash.addColorStop(1, "rgba(139, 92, 246, 0.22)");
  context.fillStyle = colorWash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const accent = context.createLinearGradient(76, 0, 1004, 0);
  accent.addColorStop(0, "#22d3ee");
  accent.addColorStop(1, "#8b5cf6");
  context.fillStyle = accent;
  context.fillRect(76, 78, 928, 7);

  context.textBaseline = "top";
  context.fillStyle = "#ffffff";
  context.font = '800 38px "Space Grotesk", Inter, sans-serif';
  context.letterSpacing = "7px";
  context.fillText("THE NEXT PLAY", 76, 116);

  context.fillStyle = "#67e8f9";
  context.font = '800 25px Inter, sans-serif';
  context.letterSpacing = "5px";
  context.fillText(`BY DANNY SIMAS / ${note.number}`, 76, 186);

  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.font = '800 20px Inter, sans-serif';
  context.letterSpacing = "4px";
  context.fillText("FIRST IMPRESSION · NO SCORE", 76, 242);

  context.fillStyle = "#c4b5fd";
  context.font = '800 27px Inter, sans-serif';
  context.letterSpacing = "4px";
  context.fillText(note.stage.toUpperCase(), 76, 1010);

  context.fillStyle = "#ffffff";
  context.font = '900 84px "Space Grotesk", Inter, sans-serif';
  context.letterSpacing = "-3px";
  let nextY = drawWrappedText(context, note.title.toUpperCase(), 76, 1068, 928, 88, 3);

  const verdictColor = note.tone === "buy" ? "#67e8f9" : note.tone === "wait" ? "#c4b5fd" : "#ffffff";
  context.fillStyle = verdictColor;
  context.font = '900 49px "Space Grotesk", Inter, sans-serif';
  context.letterSpacing = "1px";
  context.fillText(note.verdict.toUpperCase(), 76, nextY + 38);

  context.fillStyle = "rgba(255, 255, 255, 0.84)";
  context.font = '600 34px Inter, sans-serif';
  context.letterSpacing = "0px";
  drawWrappedText(context, note.take, 76, nextY + 120, 900, 48, 3);

  context.strokeStyle = "rgba(255, 255, 255, 0.24)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(76, 1780);
  context.lineTo(1004, 1780);
  context.stroke();

  context.fillStyle = "#ffffff";
  context.font = '800 24px Inter, sans-serif';
  context.letterSpacing = "4px";
  context.fillText("DANNYSIMAS.COM", 76, 1820);
  context.textAlign = "right";
  context.fillText("@DANNYSIMAS", 1004, 1820);
  context.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the story image."));
    }, "image/png");
  });
}

function StoryPreview({ note, onClose }) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function downloadStory() {
    setStatus("Creating image…");

    try {
      const blob = await createStoryCard(note);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `danny-simas-${note.id}-story.png`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Story card saved.");
    } catch {
      setStatus("Couldn’t create the image. Please try again.");
    }
  }

  async function shareStory() {
    setStatus("Preparing story…");

    try {
      const blob = await createStoryCard(note);
      const file = new File([blob], `danny-simas-${note.id}-story.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${note.title} — The Next Play`,
          text: note.take,
        });
        setStatus("Ready to share.");
        return;
      }

      await downloadStory();
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("");
        return;
      }

      setStatus("Couldn’t open sharing. Download the image instead.");
    }
  }

  async function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}#note-${note.id}`;

    try {
      await navigator.clipboard.writeText(link);
      setStatus("Link copied.");
    } catch {
      setStatus("Copy failed. Use the page address instead.");
    }
  }

  return (
    <div className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-title">
      <button className="story-modal-backdrop" type="button" onClick={onClose} aria-label="Close" />

      <div className="story-modal-panel">
        <div className="story-modal-copy">
          <p className="section-kicker">Story Preview</p>
          <h2 id="story-title">Ready for Stories</h2>
          <p>
            One tap creates a vertical image. Add the note link with your platform’s link sticker.
          </p>

          <div className="story-actions">
            <button type="button" className="primary-btn" onClick={shareStory}>
              Share / Save Image ↗
            </button>
            <button type="button" className="outline-btn" onClick={downloadStory}>
              Download PNG ↓
            </button>
            <button type="button" className="story-link-btn" onClick={copyLink}>
              Copy Note Link
            </button>
          </div>

          <p className="story-status" aria-live="polite">
            {status}
          </p>
        </div>

        <div className={`story-frame story-frame-${note.tone}`}>
          <img src={note.image} alt="" />
          <div className="story-frame-shade" />

          <div className="story-frame-top">
            <span>The Next Play</span>
            <span>By Danny Simas / {note.number}</span>
            <small>First impression · No score</small>
          </div>

          <div className="story-frame-bottom">
            <p>{note.stage}</p>
            <h3>{note.title}</h3>
            <strong>{note.verdict}</strong>
            <span>{note.take}</span>

            <div>
              <small>dannysimas.com</small>
              <small>@dannysimas</small>
            </div>
          </div>
        </div>

        <button type="button" className="story-close" onClick={onClose} aria-label="Close preview">
          ×
        </button>
      </div>
    </div>
  );
}

function GameCommunity({ note }) {
  const [reactions, setReactions] = useState({ likes: 0, dislikes: 0, choice: null, loading: true });
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCommunity() {
      if (!communityConfigured) {
        setReactions((current) => ({ ...current, loading: false }));
        setCommentsLoading(false);
        return;
      }

      try {
        const visitorId = getVisitorId();
        const gameFilter = encodeURIComponent(`eq.${note.id}`);
        const visitorFilter = encodeURIComponent(`eq.${visitorId}`);
        const [reactionRows, visitorRows, commentRows] = await Promise.all([
          supabaseRequest(`game_reactions?game_id=${gameFilter}&select=reaction_type`),
          supabaseRequest(`game_reactions?game_id=${gameFilter}&visitor_id=${visitorFilter}&select=reaction_type`),
          supabaseRequest(`game_comments?game_id=${gameFilter}&status=eq.approved&select=id,name,body,created_at&order=created_at.desc`),
        ]);

        if (!active) return;
        const reactionCounts = reactionRows.reduce(
          (counts, reaction) => {
            if (reaction.reaction_type === "dislike") counts.dislikes += 1;
            else counts.likes += 1;
            return counts;
          },
          { likes: 0, dislikes: 0 },
        );
        setReactions({
          ...reactionCounts,
          choice: visitorRows[0]?.reaction_type ?? null,
          loading: false,
        });
        setComments(commentRows);
      } catch {
        if (!active) return;
        setStatus("Community features are unavailable right now.");
        setReactions((current) => ({ ...current, loading: false }));
      } finally {
        if (active) setCommentsLoading(false);
      }
    }

    loadCommunity();
    return () => {
      active = false;
    };
  }, [note.id]);

  async function toggleReaction(type) {
    if (!communityConfigured || reactions.loading) return;
    setStatus("");

    try {
      const visitorId = getVisitorId();
      const gameFilter = encodeURIComponent(`eq.${note.id}`);
      const visitorFilter = encodeURIComponent(`eq.${visitorId}`);

      if (reactions.choice) {
        await supabaseRequest(`game_reactions?game_id=${gameFilter}&visitor_id=${visitorFilter}`, { method: "DELETE" });
      }

      if (reactions.choice !== type) {
        await supabaseRequest("game_reactions", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ game_id: note.id, visitor_id: visitorId, reaction_type: type }),
        });
      }

      const reactionRows = await supabaseRequest(`game_reactions?game_id=${gameFilter}&select=reaction_type`);
      const reactionCounts = reactionRows.reduce(
        (counts, reaction) => {
          if (reaction.reaction_type === "dislike") counts.dislikes += 1;
          else counts.likes += 1;
          return counts;
        },
        { likes: 0, dislikes: 0 },
      );
      setReactions({ ...reactionCounts, choice: reactions.choice === type ? null : type, loading: false });
    } catch {
      setStatus("That reaction could not be saved. Please try again.");
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!communityConfigured || submitting) return;
    if (honeypot) return;
    if (!name.trim() || !body.trim()) {
      setStatus("Add your name and a comment first.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      const submittedName = name.trim();
      const submittedBody = body.trim();
      const createdComments = await supabaseRequest("game_comments?select=id,name,body,created_at", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          game_id: note.id,
          name: submittedName,
          body: submittedBody,
          status: "approved",
        }),
      });

      if (Array.isArray(createdComments) && createdComments[0]) {
        setComments((current) => [createdComments[0], ...current]);
      }
      setName("");
      setBody("");
      setStatus("Thanks — your comment is live.");
    } catch {
      setStatus("Your comment could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="game-community" aria-labelledby={`community-${note.id}`}>
      <div className="community-heading">
        <div>
          <p className="community-kicker">COMMUNITY SIGNAL</p>
          <h2 id={`community-${note.id}`}>What do you think?</h2>
          <p>Leave a quick thought or react to the game.</p>
        </div>

        <div className="community-reactions" role="group" aria-label="Community reactions">
            <button
              type="button"
              className={`community-reaction community-like ${reactions.choice === "like" ? "is-selected" : ""}`}
              onClick={() => toggleReaction("like")}
              disabled={!communityConfigured || reactions.loading}
              aria-pressed={reactions.choice === "like"}
              title={communityConfigured ? "Like this game" : "Community features are being connected"}
            >
              <span className="community-reaction-icon" aria-hidden="true">♥</span>
              <span>{reactions.choice === "like" ? "Liked" : "Like this game"}</span>
              <strong>{reactions.likes}</strong>
            </button>
            <button
              type="button"
              className={`community-reaction community-dislike ${reactions.choice === "dislike" ? "is-selected" : ""}`}
              onClick={() => toggleReaction("dislike")}
              disabled={!communityConfigured || reactions.loading}
              aria-pressed={reactions.choice === "dislike"}
              title={communityConfigured ? "Not for me" : "Community features are being connected"}
            >
              <span className="community-reaction-icon" aria-hidden="true">×</span>
              <span>{reactions.choice === "dislike" ? "Not for me" : "Not for me"}</span>
              <strong>{reactions.dislikes}</strong>
            </button>
        </div>
      </div>

      {!communityConfigured ? (
        <div className="community-setup">
          Community features are ready to connect. Add the Supabase keys to enable reactions and comments.
        </div>
      ) : (
        <div className="community-grid">
          <form className="community-form" onSubmit={submitComment}>
            <h3>Leave a comment</h3>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required />
            </label>
            <label>
              Your take
              <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={800} rows={5} required />
            </label>
            <label className="community-honeypot" aria-hidden="true">
              Website
              <input tabIndex="-1" autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send comment ↗"}
            </button>
          </form>

          <div className="community-comments">
            <div className="community-comments-heading">
              <h3>Comments</h3>
              <span>{comments.length}</span>
            </div>
            {commentsLoading ? (
              <p className="community-empty">Loading comments…</p>
            ) : comments.length ? (
              <div className="community-comment-list">
                {comments.map((comment) => (
                  <article key={comment.id} className="community-comment">
                    <div>
                      <strong>{comment.name}</strong>
                      <time dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
                    </div>
                    <p>{comment.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="community-empty">No comments yet. Be the first to share a take.</p>
            )}
          </div>
        </div>
      )}

      <p className="community-status" aria-live="polite">{status}</p>
    </section>
  );
}

function GameVideo({ note }) {
  const [playing, setPlaying] = useState(false);
  const video = note.video;
  if (!video) return null;
  const watchUrl = video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : video.src;

  return (
    <section className="play-video" aria-label={`${note.title} video`}>
      <div className="play-video-heading">
        <h2>{video.label}</h2>
        <a href={watchUrl} target="_blank" rel="noreferrer">{video.youtubeId ? "Open on YouTube" : "Open video"} ↗</a>
      </div>
      <div className="play-video-screen">
        {playing ? (
          video.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={`${note.title} — ${video.label}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video controls autoPlay playsInline poster={note.image} src={video.src}>
              Your browser cannot play this video. <a href={video.src}>Open video</a>
            </video>
          )
        ) : (
          <button type="button" className="play-video-launch" onClick={() => setPlaying(true)} aria-label={`Play ${note.title} ${video.label}`}>
            <img src={note.image} alt="" loading="lazy" />
            <span className="play-video-icon" aria-hidden="true">▶</span>
            <span className="play-video-caption">Watch trailer <span aria-hidden="true">↗</span></span>
          </button>
        )}
      </div>
      <p className="play-video-credit">{video.credit}</p>
    </section>
  );
}

function GameScreenshots({ note }) {
  if (!note.screenshots?.length) return null;

  return (
    <section className="play-screenshots" aria-label={`${note.title} screenshots`}>
      <div className="play-screenshots-heading">
        <div>
          <p className="play-screenshots-kicker">VISUAL CHECK</p>
          <h2>Gameplay screenshots</h2>
        </div>
        <span>Click to view full size ↗</span>
      </div>
      <div className="play-screenshots-grid">
        {note.screenshots.map((screenshot, index) => (
          <a
            key={screenshot.src}
            className="play-screenshot"
            href={screenshot.src}
            target="_blank"
            rel="noreferrer"
          >
            <img src={screenshot.src} alt={screenshot.alt} loading="lazy" />
            <span>Screenshot {String(index + 1).padStart(2, "0")} ↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function GameNotes() {
  const [activeNote, setActiveNote] = useState(null);
  const [selectedId, setSelectedId] = useState(() => window.location.hash.replace("#note-", ""));
  const selected = gameNotes.find((note) => note.id === selectedId) || gameNotes[0];
  useEffect(() => {
    const sync = () => setSelectedId(window.location.hash.replace("#note-", ""));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <>
      <section id="game-notes" className="play-library">
        <aside className="play-shelf">
          <div className="play-shelf-heading"><span>SELECT A GAME</span><span>02</span></div>
          <nav aria-label="Game library" className="play-titles">
            {gameNotes.map((note) => (
              <a key={note.id} href={`#note-${note.id}`} aria-current={selected.id === note.id ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedId(note.id);
                  window.history.replaceState(null, "", `#note-${note.id}`);
                }}>
                <img src={note.image} alt="" />
                <span><small>{note.stage}</small><strong>{note.title}</strong><em>{note.verdict}</em></span>
                <b aria-hidden="true">›</b>
              </a>
            ))}
          </nav>
          <div className="play-shelf-foot"><span>THE NEXT PLAY</span><p>New releases.<br />Upcoming games. My take.</p><small>First entry live · More games coming soon</small></div>
        </aside>
        <div className="game-notes-grid">
          {[selected].map((note) => (
            <article
              id={`note-${note.id}`}
              key={note.id}
              className={`play-detail play-detail-${note.tone}`}
            >
              <div className="game-note-image">
                <img src={note.image} alt="" />
                <div className="game-note-image-shade" />
                <div className="game-note-image-meta">
                  <span className="game-note-slot">Note / {note.number}</span>
                  <span>{note.stage}</span>
                </div>
              </div>

              <div className="play-content-grid">
              <div className="game-note-body">
                <p className="game-note-meta"><span className="note-status-light" aria-hidden="true" />{note.meta}</p>
                <h1>{note.title}</h1>
                <p className="game-note-take">{note.take}</p>
                <div className="play-reason">
                  <h2>{note.reasonLabel}</h2>
                  <p>{note.reason}</p>
                </div>

                <div className="game-note-signals" aria-label="Quick takeaways">
                  {note.positives.map((positive) => (
                    <span key={positive} className="positive">
                      <b>+</b> {positive}
                    </span>
                  ))}
                  {(note.concerns || [note.concern]).map((concern) => (
                    <span key={concern} className="negative">
                      <b>−</b> {concern}
                    </span>
                  ))}
                </div>

                <div className="game-note-footer">
                  <div>
                    <span>Current verdict</span>
                    <strong>{note.verdict}</strong>
                  </div>

                  <button type="button" onClick={() => setActiveNote(note)} aria-haspopup="dialog">
                    Share to Stories ↗
                  </button>
                </div>
              </div>
              <GameVideo key={note.id} note={note} />
              </div>
              <GameScreenshots note={note} />
              <GameCommunity note={note} />
            </article>
          ))}
        </div>
      </section>

      {activeNote && <StoryPreview note={activeNote} onClose={() => setActiveNote(null)} />}
    </>
  );
}

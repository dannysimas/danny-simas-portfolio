import { useEffect, useRef, useState } from "react";
import "./styles.css";

const img =
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=90";
const img2 =
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1600&q=90";
const img3 =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=90";
const img4 =
  "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1600&q=90";

const aboutImg = "/images/about/about-danny.webp";

const folders = [
  {
    title: "Resident Evil",
    type: "Cinematic Key Art",
    cat: "Key Art",
    cover: img4,
    images: [img4, img, img2, img3],
  },
  {
    title: "Pragmata",
    type: "Social Coverage",
    cat: "Social Coverage",
    cover: img,
    images: [img, img2, img3, img4],
  },
  {
    title: "Clair Obscur: Expedition 33",
    type: "Virtual Photography",
    cat: "Virtual Photography",
    cover: img2,
    images: [img2, img3, img4, img],
  },
  {
    title: "Devil May Cry",
    type: "Editorial Visuals",
    cat: "Key Art",
    cover: img3,
    images: [img3, img4, img, img2],
  },
  {
    title: "Tomb Raider",
    type: "Cinematic Coverage",
    cat: "Social Coverage",
    cover: img2,
    images: [img2, img, img3, img4],
  },
];

const nav = [
  ["Work", "#work"],
  ["About", "#about"],
  ["Collaborations", "#collabs"],
  ["Media Kit", "#media-kit"],
  ["Contact", "#contact"],
];

const collabs = [
  ["Game Studios", ["Rogue Factor", "Myrkur Games", "Nekki", "One More Level"]],
  ["Publishers", ["Deep Silver", "Focus Entertainment", "PLAION", "Nekki", "One More Level"]],
  ["Hardware Brands", ["Razer", "GameSir"]],
  ["Creator Programs", ["Deep Silver", "Keymailer"]],
];

const stats = [
  [
    "55K+",
    "Followers",
    "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M21 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  ],
  [
    "Millions",
    "Monthly Reach",
    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ],
  ["High", "Engagement", "M3 12h4l2.5-7 5 14 2.5-7h4"],
  [
    "Studio + Brand",
    "Collabs",
    "M4 7h16v12H4V7Z M9 7V5h6v2 M8 12h8 M8 15h5 M17 15l1 1 2-3",
  ],
];

const wins = [
  {
    label: "Platform Feature",
    title: "PlayStation Deutschland",
    text: "Reposted a full carousel with credit.",
  },
  {
    label: "Brand Campaign",
    title: "Razer",
    text: "Gifted campaign content and gaming gear coverage.",
  },
  {
    label: "Contest Win",
    title: "Myrkur Games",
    text: "Photomode contest winner and creator recognition.",
  },
  {
    label: "Partner Program",
    title: "IO Interactive",
    text: "Partner Program member for game coverage.",
  },
  {
    label: "Creator Access",
    title: "Deep Silver",
    text: "Creator Collective access and publisher-side opportunities.",
  },
  {
    label: "Audience Proof",
    title: "55K+ Community",
    text: "Gaming audience with monthly reach in the millions.",
  },
];

const filters = ["All", "Key Art", "Virtual Photography", "Social Coverage"];

const IconInstagram = () => (
  <svg
    viewBox="0 0 24 24"
    className="social-icon"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconTikTok = () => (
  <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor">
    <path d="M16.7 3c.3 2 1.5 3.4 3.7 3.8v3.3c-1.4 0-2.7-.4-3.7-1.2v5.8c0 3.9-2.5 6.3-6 6.3-3.2 0-5.7-2.4-5.7-5.6 0-3.5 2.9-6 6.5-5.5v3.3c-1.7-.4-3.1.5-3.1 2.1 0 1.3 1 2.3 2.3 2.3 1.5 0 2.5-.9 2.5-2.8V3h3.5Z" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor">
    <path d="M14.3 8.6V6.8c0-.8.5-1 1-1h2.4V2.2C17.2 2.1 15.9 2 14.5 2c-3 0-5 1.8-5 5.1v1.5H6.3v4h3.2V22h4v-9.4h3.1l.5-4h-3.8Z" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor">
    <path d="M18.9 3h3.1l-6.8 7.8L23.2 21h-6.3l-4.9-6.3L6.4 21H3.2l7.3-8.4L2.8 3h6.5l4.4 5.7L18.9 3Zm-1.1 16.2h1.7L8.4 4.7H6.5l11.3 14.5Z" />
  </svg>
);

const IconYouTube = () => (
  <svg viewBox="0 0 24 24" className="social-icon" fill="currentColor">
    <path d="M21.6 7.1c-.2-.9-.9-1.6-1.8-1.8C18.2 4.9 12 4.9 12 4.9s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.7 2 12 2 12s0 3.3.4 4.9c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.9.4-4.9s0-3.3-.4-4.9ZM10 14.9V9.1l5.2 2.9L10 14.9Z" />
  </svg>
);

const socials = [
  ["Instagram", "https://www.instagram.com/dannysimas/", <IconInstagram />],
  ["TikTok", "https://www.tiktok.com/@dannysimass", <IconTikTok />],
  ["Facebook", "https://www.facebook.com/dannysimass", <IconFacebook />],
  ["X", "https://x.com/dannysimass", <IconX />],
  ["YouTube", "https://www.youtube.com/@dannysimass", <IconYouTube />],
];

export default function App() {
  const [open, setOpen] = useState("Resident Evil");
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const [hideMenu, setHideMenu] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      setHideMenu(scrollingDown && currentScrollY > 80);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setCursor({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll(".reveal, .slide-up, .fade-in");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [filter, open]);

  const shown = filter === "All" ? folders : folders.filter((folder) => folder.cat === filter);

  function changeFilter(next) {
    setFilter(next);
    const first = next === "All" ? folders[0] : folders.find((folder) => folder.cat === next);
    setOpen(first?.title || "");
  }

  function openInstagram() {
    window.open("https://www.instagram.com/dannysimas/", "_blank", "noopener,noreferrer");
  }

  function previousImage() {
    setLightbox((value) => ({
      ...value,
      index: value.index === 0 ? value.folder.images.length - 1 : value.index - 1,
    }));
  }

  function nextImage() {
    setLightbox((value) => ({
      ...value,
      index: value.index === value.folder.images.length - 1 ? 0 : value.index + 1,
    }));
  }

  return (
    <main className="site-bg">
      <div
        className="cursor-dot"
        style={{ "--cursor-x": `${cursor.x}px`, "--cursor-y": `${cursor.y}px` }}
      />

      <header className={`top-menu ${hideMenu ? "top-menu-hidden" : ""}`}>
        <div className="edge header-inner">
          <a href="#home" className="brand">
            Danny Simas
          </a>

          <nav className="main-nav">
            {nav.map(([label, href]) => (
              <a key={label} href={href} className="nav-link">
                {label}
              </a>
            ))}
          </nav>

          <div className="header-socials">
            {socials.map(([label, url, icon]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}>
                {icon}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section id="home" className="hero-section">
        <div className="hero-panels">
          {[img, img2, img3, img4].map((image, index) => (
            <div
              key={image}
              className="hero-panel"
              style={{
                clipPath:
                  index === 0
                    ? "polygon(0 0,100% 0,86% 100%,0 100%)"
                    : "polygon(14% 0,100% 0,86% 100%,0 100%)",
              }}
            >
              <div
                className="hero-panel-image"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
          ))}
        </div>

        <div className="hero-mask" />

        <div className="edge hero-content">
          <div className="hero-left">
            <p>Cinematic game visuals with a movie-poster mindset.</p>
            <div className="hero-line" />
            <a href="#work">Explore Work →</a>
          </div>
        </div>
      </section>

      <section id="about" className="edge reveal about-section">
        <div className="about-image-wrap">
          <img src={aboutImg} alt="Danny Simas" className="about-image" />
        </div>

        <div className="fade-in about-copy">
          <p className="section-kicker">About Danny Simas</p>
          <h2>Visual Storytelling for Games</h2>

          <p>
            I’m Danny Simas, a cinematic gaming visual artist and content creator focused on
            virtual photography, key art, and social-first game coverage.
          </p>

          <p>
            My work blends in-game capture, composition, lighting, and visual storytelling to create
            images that feel closer to movie posters than traditional screenshots. I build visuals
            designed to stop the scroll, connect with gaming audiences, and help games feel larger
            than the screen.
          </p>

          <div className="tag-row">
            {["Virtual Photography", "Key Art", "Social Coverage"].map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <a href="#media-kit" className="outline-btn">
            View Media Kit →
          </a>
        </div>
      </section>

      <section className="edge reveal stats-section">
        <div className="stats-grid">
          {stats.map(([number, label, icon]) => (
            <div key={label} className="slide-up stat-item">
              <span className="stat-logo">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path className="stroke-icon" d={icon} />
                </svg>
              </span>

              <div>
                <p>{number}</p>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="collabs" className="edge reveal collab-section">
        <div className="section-title-row">
          <div className="line-accent" />
          <p>Collaborations</p>
        </div>

        <div className="collab-grid">
          {collabs.map(([title, items]) => (
            <div key={title} className="slide-up collab-card">
              <p>{title}</p>
              <div>
                {items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="edge reveal highlights-section">
        <div className="highlights-head">
          <div>
            <div className="section-title-row">
              <div className="line-accent" />
              <p>Creator Highlights</p>
            </div>
            <h2>Proof of Work</h2>
          </div>

          <p>
            A quick snapshot of creator wins, platform recognition, brand trust, and audience proof.
          </p>
        </div>

        <div className="highlights-grid">
          {wins.map((win, index) => (
            <article key={win.title} className="highlight-card slide-up">
              <div>
                <span className="highlight-index">0{index + 1}</span>
                <span className="highlight-label">{win.label}</span>
              </div>

              <div>
                <h3>{win.title}</h3>
                <p>{win.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className="edge reveal archive-section">
        <div className="archive-head">
          <div className="fade-in">
            <p className="section-kicker">Visual Archive</p>
            <h2>Featured Work</h2>
          </div>

          <div className="filters">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeFilter(item)}
                className={filter === item ? "active" : ""}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="folder-list">
          {shown.map((folder) => {
            const isOpen = open === folder.title;

            return (
              <div key={folder.title} className="slide-up folder">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? "" : folder.title)}
                  className="folder-cover"
                >
                  <img src={folder.cover} alt="" />

                  <div className="folder-overlay" />

                  <div className="folder-content">
                    <div>
                      <h3>{folder.title}</h3>
                      <p>
                        {folder.type} • {folder.images.length} pieces
                      </p>
                    </div>

                    <span className="folder-icon">
                      <span />
                      {!isOpen && <span />}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="gallery-grid">
                    {folder.images.map((image, index) => (
                      <button
                        key={`${folder.title}-${index}`}
                        type="button"
                        onClick={() => setLightbox({ folder, index })}
                        className="gallery-item"
                      >
                        <div style={{ backgroundImage: `url(${image})` }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="archive-disclaimer">
          Selected visual work inspired by official game worlds and social coverage. All trademarks
          belong to their respective owners.
        </p>
      </section>

      <section id="social-feed" className="edge reveal social-section">
        <div className="social-content">
          <div className="fade-in">
            <p className="section-kicker">Social Feed</p>
            <h2>Latest on Instagram</h2>
            <p>Follow the live work, reels, process shots, and new cinematic game visuals.</p>
            <button type="button" onClick={openInstagram} className="outline-btn">
              Visit @dannysimas →
            </button>
          </div>

          <div className="feed-grid">
            {[img, img2, img3, img4, img, img2].map((post, index) => (
              <a
                key={index}
                href="https://www.instagram.com/dannysimas/"
                target="_blank"
                rel="noreferrer"
                className="slide-up feed-item"
                style={{ backgroundImage: `url(${post})` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="media-kit" className="edge reveal media-section">
        <div>
          <div className="media-cta">
            <div className="fade-in">
              <p className="section-kicker">Media Kit</p>
              <h2>Interested in Working Together?</h2>
              <p>
                Let’s create something unforgettable for game coverage, creator programs, press
                access, or brand collaborations.
              </p>
            </div>
          </div>

          <div className="media-grid">
            {[
              ["Audience", ["55K+ Instagram followers", "Millions in monthly reach", "Gaming-focused community"]],
              ["Coverage", ["Cinematic key art", "Virtual photography", "Reels and carousels"]],
              ["Available For", ["Game coverage", "Creator programs", "Hardware partnerships"]],
            ].map(([title, items]) => (
              <div key={title} className="slide-up media-card">
                <p>{title}</p>
                {items.map((item) => (
                  <span key={item}>◆ {item}</span>
                ))}
              </div>
            ))}
          </div>

          <div id="contact" className="contact-section">
            <div className="fade-in">
              <h2>Let’s Talk</h2>
              <p>For game coverage, brand collaborations, press access, or licensing inquiries.</p>
            </div>

            <form action="mailto:dannysimas@gmail.com" method="post" encType="text/plain">
              <input name="name" placeholder="Your name" />
              <input name="email" placeholder="your@email.com" />
              <textarea name="message" rows="5" placeholder="Tell me what you’re working on..." />
              <button type="submit" className="primary-btn">
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </section>

      {lightbox && (
        <div className="lightbox">
          <button
            className="lightbox-bg"
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          />

          <div className="lightbox-card">
            <button type="button" className="close-lightbox" onClick={() => setLightbox(null)}>
              ×
            </button>

            <img src={lightbox.folder.images[lightbox.index]} alt="Gallery preview" />

            <div className="lightbox-info">
              <div>
                <p>{lightbox.folder.title}</p>
                <span>
                  {lightbox.index + 1} / {lightbox.folder.images.length}
                </span>
              </div>

              <div>
                <button type="button" onClick={previousImage}>
                  ‹
                </button>
                <button type="button" onClick={nextImage}>
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="edge footer">
        <p className="footer-brand">Danny Simas</p>

        <div>
          {socials.map(([label, url, icon]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}>
              {icon}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
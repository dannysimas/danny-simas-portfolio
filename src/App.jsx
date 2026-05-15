import { useState } from "react";

const stock1 =
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=90";
const stock2 =
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1800&q=90";
const stock3 =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90";
const stock4 =
  "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1800&q=90";

const aboutImg = "/images/about/about-danny.webp";

const heroImages = [stock1, stock2, stock3, stock4];

const folders = [
  {
    title: "Resident Evil",
    type: "Cinematic Key Art",
    category: "Key Art",
    cover: stock4,
    images: [stock4, stock1, stock2, stock3],
  },
  {
    title: "Pragmata",
    type: "Social Coverage",
    category: "Social Coverage",
    cover: stock1,
    images: [stock1, stock2, stock3, stock4],
  },
  {
    title: "Clair Obscur: Expedition 33",
    type: "Virtual Photography",
    category: "Virtual Photography",
    cover: stock2,
    images: [stock2, stock3, stock4, stock1],
  },
  {
    title: "Devil May Cry",
    type: "Editorial Visuals",
    category: "Key Art",
    cover: stock3,
    images: [stock3, stock4, stock1, stock2],
  },
  {
    title: "Tomb Raider",
    type: "Cinematic Coverage",
    category: "Social Coverage",
    cover: stock2,
    images: [stock2, stock1, stock3, stock4],
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

const IconPerson = () => (
  <svg
    viewBox="0 0 24 24"
    className="stat-svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M4.5 21c1.4-4.5 4.1-6.8 7.5-6.8s6.1 2.3 7.5 6.8" />
  </svg>
);

const socials = [
  ["Instagram", "https://www.instagram.com/dannysimas/", <IconInstagram />],
  ["TikTok", "https://www.tiktok.com/@dannysimass", <IconTikTok />],
  ["Facebook", "https://www.facebook.com/dannysimass", <IconFacebook />],
  ["X", "https://x.com/dannysimass", <IconX />],
  ["YouTube", "https://www.youtube.com/@dannysimass", <IconYouTube />],
];

const nav = [
  ["About", "#about"],
  ["Collaborations", "#collabs"],
  ["Game Galleries", "#work"],
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
  [<IconPerson />, "55K+", "Followers"],
  ["◉", "Millions", "Monthly Reach"],
  ["⌁", "High", "Engagement"],
  ["◇", "Studio + Brand", "Collabs"],
];

const wins = [
  "PlayStation Deutschland reposted a full carousel",
  "Razer gifted campaign content and gear coverage",
  "Myrkur Games photomode contest winner",
  "IO Interactive Partner Program member",
  "Deep Silver Creator Collective access",
  "55K+ gaming audience with monthly reach in the millions",
];

export default function App() {
  const [openFolder, setOpenFolder] = useState("Resident Evil");
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shownFolders =
    filter === "All" ? folders : folders.filter((folder) => folder.category === filter);

  function changeFilter(nextFilter) {
    setFilter(nextFilter);
    const firstFolder =
      nextFilter === "All"
        ? folders[0]
        : folders.find((folder) => folder.category === nextFilter);

    setOpenFolder(firstFolder?.title || "");
  }

  function openInstagram() {
    window.open("https://www.instagram.com/dannysimas/", "_blank", "noopener,noreferrer");
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function nextImage() {
    setLightbox((current) => {
      if (!current) return current;

      const nextIndex =
        current.index === current.folder.images.length - 1 ? 0 : current.index + 1;

      return { ...current, index: nextIndex };
    });
  }

  function prevImage() {
    setLightbox((current) => {
      if (!current) return current;

      const prevIndex =
        current.index === 0 ? current.folder.images.length - 1 : current.index - 1;

      return { ...current, index: prevIndex };
    });
  }

  return (
    <main className="site">
      <div className="background-grid" />

      <header className="header">
        <a href="#home" className="brand" onClick={closeMobileMenu}>
          Danny Simas
        </a>

        <div className="header-right">
          <nav className="desktop-nav">
            {nav.map(([label, href]) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
          </nav>

          <div className="social-row header-socials">
            {socials.map(([label, url, icon]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}>
                {icon}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            {nav.map(([label, href]) => (
              <a key={label} href={href} onClick={closeMobileMenu}>
                {label}
              </a>
            ))}

            <div className="mobile-socials">
              {socials.map(([label, url, icon]) => (
                <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <section id="home" className="hero">
        <div className="hero-panels">
          {heroImages.map((image, index) => (
            <div
              key={image}
              className="hero-panel"
              style={{
                backgroundImage: `url(${image})`,
                clipPath:
                  index === 0
                    ? "polygon(0 0,100% 0,86% 100%,0 100%)"
                    : "polygon(14% 0,100% 0,86% 100%,0 100%)",
              }}
            />
          ))}
        </div>

        <div className="hero-overlay" />

        <div className="hero-content">
          <h1 className="hero-title">
            <span>
              Cinematic <strong>Gaming</strong>
            </span>
            <span className="outline">Visuals</span>
          </h1>

          <p>Creating cinematic game visuals for audiences, studios, and brands.</p>

          <div className="hero-buttons">
            <a href="#work" className="primary-btn">
              View Galleries →
            </a>
            <a href="#contact" className="ghost-btn">
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="section about">
        <div className="about-image">
          <img src={aboutImg} alt="Danny Simas profile portrait" />
        </div>

        <div className="about-copy">
          <p className="eyebrow">About Danny Simas</p>
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

          <div className="tags">
            <span>Virtual Photography</span>
            <span>Key Art</span>
            <span>Social Coverage</span>
          </div>

          <a href="#media-kit" className="ghost-btn small">
            View Media Kit →
          </a>
        </div>
      </section>

      <section className="section stats">
        {stats.map(([icon, value, label]) => (
          <div className="stat-card lift" key={label}>
            <span className="stat-icon">{icon}</span>

            <div>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          </div>
        ))}
      </section>

      <section id="collabs" className="section">
        <p className="section-label">Collaborations</p>

        <div className="collab-grid">
          {collabs.map(([title, items]) => (
            <div className="panel lift" key={title}>
              <h3>{title}</h3>

              <div className="chips">
                {items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="section-label">Creator Highlights</p>

        <div className="wins-grid">
          {wins.map((win) => (
            <div className="panel lift" key={win}>
              {win}
            </div>
          ))}
        </div>
      </section>

      <section id="work" className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Visual Archive</p>
            <h2>Game Galleries</h2>
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
          {shownFolders.map((folder) => {
            const isOpen = openFolder === folder.title;

            return (
              <div className="folder lift" key={folder.title}>
                <button
                  type="button"
                  className="folder-cover"
                  onClick={() => setOpenFolder(isOpen ? "" : folder.title)}
                  style={{ backgroundImage: `url(${folder.cover})` }}
                >
                  <span>
                    <strong>{folder.title}</strong>
                    <small>
                      {folder.type} • {folder.images.length} pieces
                    </small>
                  </span>

                  <i className={isOpen ? "minus" : "plus"} />
                </button>

                {isOpen && (
                  <div className="gallery-grid">
                    {folder.images.map((image, index) => (
                      <button
                        type="button"
                        key={`${folder.title}-${index}`}
                        className="gallery-item"
                        onClick={() => setLightbox({ folder, index })}
                      >
                        <img src={image} alt={`${folder.title} gallery ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="disclaimer">
          Selected visual work inspired by official game worlds and social coverage. All trademarks
          belong to their respective owners.
        </p>
      </section>

      <section id="social-feed" className="section social-feed">
        <div>
          <div className="social-head">
            <div>
              <p className="eyebrow">Social Feed</p>
              <h2>Latest on Instagram</h2>
              <p>Follow the live work, reels, process shots, and new cinematic game visuals.</p>
            </div>

            <button type="button" onClick={openInstagram} className="ghost-btn">
              Visit @dannysimas →
            </button>
          </div>

          <div className="feed-grid">
            {[stock1, stock2, stock3, stock4, stock1, stock2].map((post, index) => (
              <a
                key={index}
                href="https://www.instagram.com/dannysimas/"
                target="_blank"
                rel="noreferrer"
              >
                <img src={post} alt={`Instagram preview ${index + 1}`} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="media-kit" className="section media-kit">
        <p className="eyebrow">Media Kit</p>
        <h2>Creator Snapshot</h2>

        <p>
          Available for game coverage, creator programs, asset-based campaigns, and hardware
          partnerships built around cinematic visual storytelling.
        </p>

        <div className="media-grid">
          <div className="panel">
            <h3>Audience</h3>
            <p>◆ 55K+ Instagram followers</p>
            <p>◆ Millions in monthly reach</p>
            <p>◆ Gaming-focused community</p>
          </div>

          <div className="panel">
            <h3>Coverage</h3>
            <p>◆ Cinematic key art</p>
            <p>◆ Virtual photography</p>
            <p>◆ Reels and carousels</p>
          </div>

          <div className="panel">
            <h3>Available For</h3>
            <p>◆ Game coverage</p>
            <p>◆ Creator programs</p>
            <p>◆ Hardware partnerships</p>
          </div>
        </div>

        <div id="contact" className="contact">
          <div>
            <h2>Let’s Talk</h2>
            <p>For game coverage, brand collaborations, press access, or licensing inquiries.</p>
            <a href="mailto:dannysimas@gmail.com">dannysimas@gmail.com</a>
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
      </section>

      {lightbox && (
        <div className="lightbox">
          <button
            type="button"
            className="lightbox-bg"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          />

          <div className="lightbox-card">
            <button type="button" className="close" onClick={() => setLightbox(null)}>
              ×
            </button>

            <img src={lightbox.folder.images[lightbox.index]} alt="Gallery preview" />

            <div className="lightbox-info">
              <div>
                <strong>{lightbox.folder.title}</strong>
                <small>
                  {lightbox.index + 1} / {lightbox.folder.images.length}
                </small>
              </div>

              <div className="lightbox-controls">
                <button type="button" onClick={prevImage}>
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

      <footer>
        <strong>Danny Simas</strong>
        <span>▽</span>

        <div className="social-row">
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
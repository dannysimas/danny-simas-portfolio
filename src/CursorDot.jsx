import { useEffect, useState } from "react";

export default function CursorDot() {
  const [cursor, setCursor] = useState({ x: -100, y: -100, visible: false });

  useEffect(() => {
    const isFrame = (target) => target instanceof Element && target.tagName === "IFRAME";
    const hideCursor = () => setCursor((current) => (
      current.visible ? { ...current, visible: false } : current
    ));
    const showCursor = (event) => {
      // Embedded pages render their own cursor; this page must hand it off.
      if (isFrame(event.target)) {
        hideCursor();
        return;
      }
      setCursor({ x: event.clientX, y: event.clientY, visible: true });
    };
    const handleMouseOut = (event) => {
      if (!event.relatedTarget || isFrame(event.relatedTarget)) hideCursor();
    };

    document.addEventListener("mousemove", showCursor);
    document.addEventListener("mouseover", showCursor);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("blur", hideCursor);
    document.addEventListener("visibilitychange", hideCursor);

    return () => {
      document.removeEventListener("mousemove", showCursor);
      document.removeEventListener("mouseover", showCursor);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("blur", hideCursor);
      document.removeEventListener("visibilitychange", hideCursor);
    };
  }, []);

  return (
    <div
      className="cursor-dot"
      aria-hidden="true"
      style={{
        "--cursor-x": `${cursor.x}px`,
        "--cursor-y": `${cursor.y}px`,
        visibility: cursor.visible ? "visible" : "hidden",
      }}
    />
  );
}

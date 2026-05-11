import { useState, useEffect } from "react";

interface AIStreamingTextProps {
  text: string;
  isStreaming: boolean;
  onComplete?: () => void;
  className?: string;
}

export function AIStreamingText({
  text,
  isStreaming,
  onComplete,
  className = "",
}: AIStreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        if (!isStreaming && onComplete) {
          onComplete();
        }
      }
    }, 20); // Adjust speed here (lower = faster)

    return () => clearInterval(interval);
  }, [text, isStreaming, onComplete]);

  // Cursor blink effect
  useEffect(() => {
    if (!isStreaming && displayedText === text) {
      setShowCursor(false);
      return;
    }

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, [isStreaming, displayedText, text]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 align-middle"
          style={{ background: "var(--brand)" }}
        />
      )}
    </span>
  );
}

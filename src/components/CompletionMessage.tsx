import { useState, useEffect, useRef } from "react";

interface CompletionMessageProps {
  isVisible: boolean;
}

export const CompletionMessage = ({ isVisible }: CompletionMessageProps) => {
  const [displayText, setDisplayText] = useState(false);
  const [shownLongEnough, setShownLongEnough] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Show the message with a slight delay for dramatic effect
      timeoutRef.current = window.setTimeout(() => {
        setDisplayText(true);
      }, 500);
      setTimeout(() => {
        setShownLongEnough(true);
      }, 10000);
    } else {
      setDisplayText(false);
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  if (!displayText || shownLongEnough) return null;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#f4e0b6",
          fontSize: "48px",
          fontFamily: "'MedievalSharp', cursive",
          textAlign: "center",
          textShadow:
            "2px 2px 4px rgba(0,0,0,0.7), 0 0 20px rgba(240,214,166,0.7)",
          pointerEvents: "none",
          zIndex: 1000,
          width: "80%",
          maxWidth: "800px",
          padding: "30px",
          background: "rgba(0,0,0,0.7)",
          borderRadius: "15px",
          backdropFilter: "blur(10px)",
          animation: "fadeInScale 1.5s ease-out",
          border: "2px solid #f4e0b6",
          boxShadow: "0 0 30px rgba(240,214,166,0.3)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          RETURN TO THE ENTRANCE
        </div>
        <div style={{ 
          fontSize: "32px", 
          lineHeight: "1.4",
          marginBottom: "20px" 
        }}>
          You have explored the entire dungeon.
        </div>
        <div style={{ 
          fontSize: "28px", 
          fontStyle: "italic",
          opacity: 0.9
        }}>
          Complete your map and report back to the Guild.
        </div>
        <style>
          {`
            @keyframes fadeInScale {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
              50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}
        </style>
      </div>
    </>
  );
}; 
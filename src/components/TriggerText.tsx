import { useState, useEffect, useRef } from "react";

interface TriggerTextProps {
  text: string | null;
}

export const TriggerText = ({ text }: TriggerTextProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (text) {
      setIsVisible(true);

      // Clear any existing timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      // Hide text after 3 seconds
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } else {
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  if (!isVisible || !text) return null;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#f4e0b6",
          fontSize: "36px",
          fontFamily: "'MedievalSharp', cursive",
          textAlign: "center",
          textShadow:
            "2px 2px 4px rgba(0,0,0,0.7), 0 0 10px rgba(240,214,166,0.5)",
          pointerEvents: "none",
          zIndex: 1000,
          width: "100%",
          padding: "0 20px",
          animation: "fadeInOut 3s ease-in-out",
          letterSpacing: "2px",
        }}
      >
        {text.toUpperCase().replace(/-/g, " ")}
        <style>
          {`
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
              10% { opacity: 1; transform: translateX(-50%) scale(1); }
              80% { opacity: 1; transform: translateX(-50%) scale(1); }
              100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
            }
          `}
        </style>
      </div>
    </>
  );
};

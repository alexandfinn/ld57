import levelJson from "../level.json";
import { useState, useEffect } from "react";
import { StrikethroughSound } from "./StrikethroughSound";

interface TriggerListProps {
  triggeredTriggers: string[];
}

export const TriggerList = ({ triggeredTriggers }: TriggerListProps) => {
  const [prevTriggeredTriggers, setPrevTriggeredTriggers] = useState<string[]>([]);
  const [shouldPlaySound, setShouldPlaySound] = useState(false);

  // Get unique trigger names from level.json
  const allTriggers = [
    ...new Set(
      levelJson.objects
        .filter((obj) => obj.type === "trigger")
        .map((obj) => obj.name)
    ),
  ];

  useEffect(() => {
    // Check if any new triggers were added
    const newTriggers = triggeredTriggers.filter(
      trigger => !prevTriggeredTriggers.includes(trigger)
    );
    
    if (newTriggers.length > 0) {
      setShouldPlaySound(true);
      // Reset the sound flag after a short delay
      const timer = setTimeout(() => {
        setShouldPlaySound(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggeredTriggers, prevTriggeredTriggers]);

  useEffect(() => {
    setPrevTriggeredTriggers(triggeredTriggers);
  }, [triggeredTriggers]);

  return (
    <>
      <StrikethroughSound shouldPlay={shouldPlaySound} />
      <link
        href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          color: "#f4e0b6",
          fontSize: "24px",
          fontFamily: "'MedievalSharp', cursive",
          textAlign: "right",
          textShadow:
            "2px 2px 4px rgba(0,0,0,0.7), 0 0 10px rgba(240,214,166,0.5)",
          pointerEvents: "none",
          zIndex: 1000,
          padding: "20px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "10px",
          backdropFilter: "blur(5px)",
        }}
      >
        {allTriggers.map((trigger) => (
          <div
            key={trigger}
            style={{
              marginBottom: "10px",
              opacity: triggeredTriggers.includes(trigger) ? 1 : 0.3,
              textDecoration: triggeredTriggers.includes(trigger)
                ? "line-through"
                : "none",
              animation: triggeredTriggers.includes(trigger)
                ? "strikeThrough 0.5s ease-out"
                : "none",
            }}
          >
            {triggeredTriggers.includes(trigger)
              ? trigger.toUpperCase().replace(/-/g, " ")
              : "???????"}
          </div>
        ))}
        <style>
          {`
            @keyframes strikeThrough {
              0% { text-decoration: none; }
              100% { text-decoration: line-through; }
            }
          `}
        </style>
      </div>
    </>
  );
};

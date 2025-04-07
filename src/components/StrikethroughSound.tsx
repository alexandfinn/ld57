import { useEffect, useRef } from "react";

interface StrikethroughSoundProps {
  shouldPlay: boolean;
}

export const StrikethroughSound = ({ shouldPlay }: StrikethroughSoundProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/pencil-strikethrough.mp3`);
    
    // Configure audio
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }

    // Cleanup when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const playStrikethroughSound = async () => {
      try {
        if (audioRef.current && shouldPlay) {
          await audioRef.current.play();
        }
      } catch (error) {
        console.error("Error playing strikethrough sound:", error);
      }
    };

    playStrikethroughSound();
  }, [shouldPlay]);

  return null;
}; 
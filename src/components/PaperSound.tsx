import { useEffect, useRef } from "react";

interface PaperSoundProps {
  shouldPlay: boolean;
  onEnded?: () => void;
}

export const PaperSound = ({ shouldPlay, onEnded }: PaperSoundProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (shouldPlay && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error("Error playing paper sound:", error);
      });
    }
  }, [shouldPlay]);

  return (
    <audio
      ref={audioRef}
      src={`${import.meta.env.BASE_URL}audio/paper.mp3`}
      onEnded={onEnded}
      preload="auto"
    />
  );
}; 
import { useEffect, useRef } from 'react';

interface BackgroundMusicProps {
  hasStarted: boolean;
}

export const BackgroundMusic = ({ hasStarted }: BackgroundMusicProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/audio/dungeon-air.mp3');
    
    // Configure audio
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Set volume to 30%
    }

    // Start playing when component mounts and game has started
    const playAudio = async () => {
      try {
        if (audioRef.current && hasStarted) {
          await audioRef.current.play();
        }
      } catch (error) {
        console.error('Error playing background music:', error);
      }
    };

    playAudio();

    // Cleanup when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [hasStarted]);

  return null; // This component doesn't render anything
}; 
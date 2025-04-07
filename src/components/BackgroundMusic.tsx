import { useEffect, useRef } from "react";

interface BackgroundMusicProps {
  hasStarted: boolean;
}

export const BackgroundMusic = ({ hasStarted }: BackgroundMusicProps) => {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const chainAudioRef = useRef<HTMLAudioElement | null>(null);
  const doorAudioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create audio elements
    backgroundAudioRef.current = new Audio("/audio/dungeon-air.mp3");
    chainAudioRef.current = new Audio("/audio/chain-drag.mp3");
    doorAudioRef.current = new Audio("/audio/door-creaking.mp3");

    // Configure background audio
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.3;
    }

    // Configure chain audio
    if (chainAudioRef.current) {
      chainAudioRef.current.volume = 0.05;
    }

    // Configure door audio
    if (doorAudioRef.current) {
      doorAudioRef.current.volume = 0.05;
    }

    // Start playing when component mounts and game has started
    const playBackgroundAudio = async () => {
      try {
        if (backgroundAudioRef.current && hasStarted) {
          await backgroundAudioRef.current.play();
        }
      } catch (error) {
        console.error("Error playing background music:", error);
      }
    };

    // Function to randomly play chain sound
    const playChainSound = async () => {
      try {
        if (chainAudioRef.current && hasStarted) {
          await chainAudioRef.current.play();
        }
      } catch (error) {
        console.error("Error playing chain sound:", error);
      }
    };

    const playDoorSound = async () => {
      try {
        if (doorAudioRef.current && hasStarted) {
          await doorAudioRef.current.play();
        }
      } catch (error) {
        console.error("Error playing door sound:", error);
      }
    };

    playBackgroundAudio();

    // Set up interval to play chain sound randomly
    if (hasStarted) {
      intervalRef.current = setInterval(() => {
        // 20% chance to play the sound every 60 seconds
        if (Math.random() < 0.5) {
          playChainSound();
        } else {
          playDoorSound();
        }
      }, 30000);
    }

    // Cleanup when component unmounts
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
      if (chainAudioRef.current) {
        chainAudioRef.current.pause();
        chainAudioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hasStarted]);

  return null;
};

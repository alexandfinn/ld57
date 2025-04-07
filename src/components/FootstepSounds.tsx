import { useEffect, useRef } from "react";

interface FootstepSoundsProps {
  isMoving: boolean;
}

export const FootstepSounds = ({ isMoving }: FootstepSoundsProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayTime = useRef<number>(0);
  const currentSoundIndex = useRef<number>(1);
  const minTimeBetweenSteps = 0.5; // seconds
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();

    // Configure audio
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Clear any existing timer
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Handle starting/stopping the footstep timer
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If player is moving, start a timer to play footsteps
    if (isMoving) {
      // Play first footstep immediately
      playFootstepSound();
      
      // Set up interval to play footsteps at regular intervals
      timerRef.current = window.setInterval(() => {
        playFootstepSound();
      }, minTimeBetweenSteps * 1000);
    }

    return () => {
      // Clean up timer when component unmounts or isMoving changes
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isMoving]);

  // Function to play a footstep sound
  const playFootstepSound = () => {
    if (!audioRef.current) return;

    const soundPath = `/audio/Tiles/Steps_tiles-${String(
      currentSoundIndex.current
    ).padStart(3, "0")}.ogg`;

    // Create a new Audio instance for each play to allow overlapping sounds
    const stepSound = new Audio(soundPath);
    stepSound.volume = 0.1;

    stepSound.play().catch((error) => {
      console.error("Error playing footstep sound:", error);
    });

    // Move to next sound
    currentSoundIndex.current = (currentSoundIndex.current % 21) + 1;
  };

  return null; // This component doesn't render anything
};

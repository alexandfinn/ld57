import { useEffect, useRef } from "react";

interface SecretAudioProps {
  shouldPlay: boolean;
  triggerName: string | null;
}

export const SecretAudio = ({ shouldPlay, triggerName }: SecretAudioProps) => {
  const secretAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    secretAudioRef.current = new Audio("/audio/secret.mp3");
    
    // Configure secret audio
    if (secretAudioRef.current) {
      secretAudioRef.current.volume = 0.5;
    }

    // Cleanup when component unmounts
    return () => {
      if (secretAudioRef.current) {
        secretAudioRef.current.pause();
        secretAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const playSecretAudio = async () => {
      try {
        if (secretAudioRef.current && shouldPlay && triggerName) {
          console.log(`Playing secret audio for trigger: ${triggerName}`);
          await secretAudioRef.current.play();
        }
      } catch (error) {
        console.error("Error playing secret audio:", error);
      }
    };

    playSecretAudio();
  }, [shouldPlay, triggerName]);

  return null;
}; 
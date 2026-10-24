/**
 * Multilingual Speech Synthesis & Recognition Service for Rural Trainees
 * Supports text-to-speech narration in Hindi (hi-IN) and Indian English (en-IN)
 * and voice-to-text queries for accessibility and low-literacy trainees.
 */

export class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isAudioPlaying = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isVoiceInputSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Reads lesson or message text aloud using Web Speech API
   */
  public speak(
    text: string,
    language: 'EN' | 'HI' = 'EN',
    onStateChange?: (playing: boolean) => void
  ): void {
    if (!this.synth) {
      console.warn('Speech synthesis not supported on this browser.');
      return;
    }

    this.stop();

    // Clean markdown headings, bullets, and symbols for natural narration
    const cleanText = text
      .replace(/[#*_`$]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'HI' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // slightly slower for instructional clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isAudioPlaying = true;
      if (onStateChange) onStateChange(true);
    };

    utterance.onend = () => {
      this.isAudioPlaying = false;
      this.currentUtterance = null;
      if (onStateChange) onStateChange(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech error:', e);
      this.isAudioPlaying = false;
      this.currentUtterance = null;
      if (onStateChange) onStateChange(false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isAudioPlaying = false;
      this.currentUtterance = null;
    }
  }

  public isPlaying(): boolean {
    return this.isAudioPlaying;
  }

  /**
   * Voice Recognition (Speech-to-Text) for Trainee Question input
   */
  public startListening(
    language: 'EN' | 'HI',
    onTranscript: (text: string) => void,
    onStatusChange?: (listening: boolean) => void
  ): () => void {
    if (!this.isVoiceInputSupported()) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return () => {};
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language === 'HI' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      if (onStatusChange) onStatusChange(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err);
      if (onStatusChange) onStatusChange(false);
    };

    recognition.onend = () => {
      if (onStatusChange) onStatusChange(false);
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {
        // Safe ignore
      }
    };
  }
}

export const speechService = new SpeechService();

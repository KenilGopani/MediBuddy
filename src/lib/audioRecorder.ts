export type AudioRecorderCallback = (base64: string) => void;

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private _isRecording: boolean = false;
  private _isPaused: boolean = false;
  private _duration: number = 0;

  public onChunk: AudioRecorderCallback | null = null;
  public onStop: (() => void) | null = null;
  public onError: ((error: Error) => void) | null = null;
  public onDurationUpdate: ((seconds: number) => void) | null = null;

  get isRecording(): boolean {
    return this._isRecording;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get duration(): number {
    return this._duration;
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Choose supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      this.chunks = [];
      this._isRecording = true;
      this._isPaused = false;
      this._duration = 0;
      this.startTime = Date.now();

      // Collect data in 30-second chunks
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          if (this.onChunk) {
            const base64 = await this.blobToBase64(event.data);
            this.onChunk(base64);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        this._isRecording = false;
        this._isPaused = false;
        this.stopTimer();
        if (this.onStop) {
          this.onStop();
        }
      };

      this.mediaRecorder.onerror = () => {
        this._isRecording = false;
        if (this.onError) {
          this.onError(new Error("MediaRecorder error occurred"));
        }
      };

      // Start recording with 30-second timeslice
      this.mediaRecorder.start(30000);
      this.startTimer();
    } catch (error) {
      this._isRecording = false;
      if (this.onError) {
        this.onError(
          error instanceof Error ? error : new Error("Failed to start recording")
        );
      }
      throw error;
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.stopStream();
    this.stopTimer();
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
      this._isPaused = true;
      this.stopTimer();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
      this._isPaused = false;
      this.startTimer();
    }
  }

  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      this._duration = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.onDurationUpdate) {
        this.onDurationUpdate(this._duration);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  getFullRecording(): Blob {
    const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
    return new Blob(this.chunks, { type: mimeType });
  }
}

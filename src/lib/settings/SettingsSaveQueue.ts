export type SettingsSaveStatus = 'idle' | 'saved' | 'error';

interface SaveQueueOptions<T> {
  snapshot: () => T;
  save: (value: T) => Promise<void>;
  onStatusChange: (status: SettingsSaveStatus) => void;
  debounceMs?: number;
}

export class SettingsSaveQueue<T> {
  readonly #snapshot: () => T;
  readonly #save: (value: T) => Promise<void>;
  readonly #onStatusChange: (status: SettingsSaveStatus) => void;
  readonly #debounceMs: number;

  #debounceTimer: ReturnType<typeof setTimeout> | undefined;
  #statusTimer: ReturnType<typeof setTimeout> | undefined;
  #saveRequested = false;
  #saveLoop: Promise<void> | null = null;

  constructor({
    snapshot,
    save,
    onStatusChange,
    debounceMs = 200,
  }: SaveQueueOptions<T>) {
    this.#snapshot = snapshot;
    this.#save = save;
    this.#onStatusChange = onStatusChange;
    this.#debounceMs = debounceMs;
  }

  request(): void {
    this.#saveRequested = true;
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = undefined;
      void this.#startLoop().catch(() => {
        // The status callback exposes the failure to the UI.
      });
    }, this.#debounceMs);
  }

  flush(): Promise<void> {
    this.#saveRequested = true;
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = undefined;
    }
    return this.#startLoop();
  }

  dispose(): void {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = undefined;
    }
    if (this.#statusTimer) {
      clearTimeout(this.#statusTimer);
      this.#statusTimer = undefined;
    }
    if (this.#saveRequested) {
      void this.flush().catch(() => {
        // The owning component is closing; save() already reported the error.
      });
    }
  }

  #startLoop(): Promise<void> {
    if (!this.#saveLoop) {
      this.#saveLoop = this.#runLoop().finally(() => {
        this.#saveLoop = null;
      });
    }
    return this.#saveLoop;
  }

  async #runLoop(): Promise<void> {
    while (this.#saveRequested) {
      this.#saveRequested = false;
      try {
        await this.#save(this.#snapshot());
        this.#showSavedStatus();
      } catch (error) {
        this.#onStatusChange('error');
        throw error;
      }
    }
  }

  #showSavedStatus(): void {
    this.#onStatusChange('saved');
    if (this.#statusTimer) {
      clearTimeout(this.#statusTimer);
    }
    this.#statusTimer = setTimeout(() => {
      this.#onStatusChange('idle');
      this.#statusTimer = undefined;
    }, 2200);
  }
}

export async function loadSettingsWithRetry<T>(
  load: () => Promise<T>,
  retryDelaysMs: readonly number[] = [50, 150, 300, 600],
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      lastError = error;
      if (attempt === retryDelaysMs.length) break;

      const delayMs = retryDelaysMs[attempt];
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

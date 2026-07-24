export type WidgetState =
  | 'idle'
  | 'listening'
  | 'finishing'
  | 'transcribing'
  | 'refining'
  | 'copied'
  | 'error'
  | 'cancelled'
  // Legacy aliases
  | 'recording'
  | 'stopping'
  | 'recognizing'
  | 'enhancing'
  | 'inserting'
  | 'processing'
  | 'done'
  | 'no_speech'
  | 'mic_unavailable';

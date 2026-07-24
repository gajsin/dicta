export const DEFAULT_HOTKEY = 'F9';

export interface HotkeyKeyboardEvent {
  code: string;
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
}

export type HotkeyCaptureResult =
  | { kind: 'captured'; hotkey: string }
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

const MODIFIER_CODES = new Set([
  'AltLeft',
  'AltRight',
  'ControlLeft',
  'ControlRight',
  'MetaLeft',
  'MetaRight',
  'ShiftLeft',
  'ShiftRight',
]);

const SUPPORTED_NAMED_CODES = new Set([
  'AudioVolumeDown',
  'AudioVolumeMute',
  'AudioVolumeUp',
  'Backquote',
  'Backslash',
  'Backspace',
  'BracketLeft',
  'BracketRight',
  'CapsLock',
  'Comma',
  'Delete',
  'End',
  'Enter',
  'Equal',
  'Escape',
  'Home',
  'Insert',
  'MediaPause',
  'MediaPlay',
  'MediaPlayPause',
  'MediaStop',
  'MediaTrackNext',
  'MediaTrackPrevious',
  'Minus',
  'NumLock',
  'NumpadAdd',
  'NumpadDecimal',
  'NumpadDivide',
  'NumpadEnter',
  'NumpadEqual',
  'NumpadMultiply',
  'NumpadSubtract',
  'PageDown',
  'PageUp',
  'Pause',
  'Period',
  'PrintScreen',
  'Quote',
  'ScrollLock',
  'Semicolon',
  'Slash',
  'Space',
  'Tab',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
]);

const DISPLAY_NAMES: Record<string, string> = {
  AudioVolumeDown: 'Volume −',
  AudioVolumeMute: 'Mute',
  AudioVolumeUp: 'Volume +',
  Backquote: '`',
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Comma: ',',
  Equal: '=',
  MediaTrackPrevious: 'Previous',
  Minus: '−',
  NumpadAdd: 'Num +',
  NumpadDecimal: 'Num .',
  NumpadDivide: 'Num /',
  NumpadEnter: 'Num Enter',
  NumpadEqual: 'Num =',
  NumpadMultiply: 'Num ×',
  NumpadSubtract: 'Num −',
  Period: '.',
  Quote: "'",
  Semicolon: ';',
  Slash: '/',
  Space: 'Space',
  Super: 'Win',
  Meta: 'Win',
  Control: 'Ctrl',
};

export function isSupportedPrimaryCode(code: string): boolean {
  return (
    /^Key[A-Z]$/.test(code) ||
    /^Digit[0-9]$/.test(code) ||
    /^F(?:[1-9]|1[0-9]|2[0-4])$/.test(code) ||
    /^Numpad[0-9]$/.test(code) ||
    SUPPORTED_NAMED_CODES.has(code)
  );
}

export function hotkeyFromKeyboardEvent(
  event: HotkeyKeyboardEvent,
): HotkeyCaptureResult {
  if (event.repeat || MODIFIER_CODES.has(event.code)) {
    return { kind: 'pending' };
  }

  if (!isSupportedPrimaryCode(event.code)) {
    return {
      kind: 'error',
      message: `Клавиша «${event.key || event.code}» не поддерживается системой глобальных сочетаний`,
    };
  }

  const parts: string[] = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Win');
  parts.push(event.code);

  return { kind: 'captured', hotkey: parts.join('+') };
}

export function formatHotkey(hotkey: string): string[] {
  const value = hotkey.trim() || DEFAULT_HOTKEY;

  return value.split('+').map((rawPart) => {
    const part = rawPart.trim();
    if (/^Key[A-Z]$/i.test(part)) {
      return part.slice(3).toUpperCase();
    }
    if (/^Digit[0-9]$/i.test(part)) {
      return part.slice(5);
    }
    if (/^Numpad[0-9]$/i.test(part)) {
      return `Num ${part.slice(6)}`;
    }

    return DISPLAY_NAMES[part] ?? part;
  });
}

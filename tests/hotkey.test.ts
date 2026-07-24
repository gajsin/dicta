import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatHotkey,
  hotkeyFromKeyboardEvent,
  type HotkeyKeyboardEvent,
} from '../src/lib/settings/hotkey.js';

function keyboardEvent(
  code: string,
  key: string,
  modifiers: Partial<HotkeyKeyboardEvent> = {},
): HotkeyKeyboardEvent {
  return {
    code,
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    ...modifiers,
  };
}

test('captures physical letter codes independently of the active layout', () => {
  assert.deepEqual(hotkeyFromKeyboardEvent(keyboardEvent('KeyA', 'ф')), {
    kind: 'captured',
    hotkey: 'KeyA',
  });
  assert.deepEqual(hotkeyFromKeyboardEvent(keyboardEvent('KeyF', 'а')), {
    kind: 'captured',
    hotkey: 'KeyF',
  });
});

test('captures lock, editing and symbol keys as standalone hotkeys', () => {
  for (const [code, key] of [
    ['CapsLock', 'CapsLock'],
    ['NumLock', 'NumLock'],
    ['Escape', 'Escape'],
    ['Backspace', 'Backspace'],
    ['Delete', 'Delete'],
    ['Semicolon', 'ж'],
  ]) {
    assert.deepEqual(hotkeyFromKeyboardEvent(keyboardEvent(code, key)), {
      kind: 'captured',
      hotkey: code,
    });
  }
});

test('captures modifiers and shifted symbols using the physical key', () => {
  assert.deepEqual(
    hotkeyFromKeyboardEvent(
      keyboardEvent('CapsLock', 'CapsLock', { shiftKey: true, metaKey: true }),
    ),
    { kind: 'captured', hotkey: 'Shift+Win+CapsLock' },
  );
  assert.deepEqual(
    hotkeyFromKeyboardEvent(
      keyboardEvent('Digit1', '!', { shiftKey: true }),
    ),
    { kind: 'captured', hotkey: 'Shift+Digit1' },
  );
});

test('waits for a primary key and ignores key-repeat events', () => {
  assert.deepEqual(
    hotkeyFromKeyboardEvent(keyboardEvent('ControlLeft', 'Control', { ctrlKey: true })),
    { kind: 'pending' },
  );
  assert.deepEqual(
    hotkeyFromKeyboardEvent(keyboardEvent('F9', 'F9', { repeat: true })),
    { kind: 'pending' },
  );
});

test('formats canonical hotkeys for compact UI keycaps', () => {
  assert.deepEqual(formatHotkey('Ctrl+Shift+KeyA'), ['Ctrl', 'Shift', 'A']);
  assert.deepEqual(formatHotkey('Shift+Digit1'), ['Shift', '1']);
  assert.deepEqual(formatHotkey('Win+CapsLock'), ['Win', 'CapsLock']);
});

<script lang="ts">
  import './ColorPicker.css';
  import { onMount } from 'svelte';
  import { ACCENT_PRESETS, getLuminance } from '../../utils/accentTheme';

  interface Props {
    value?: string;
    opacity?: number;
    onchange?: (hex: string, opacity: number) => void;
  }

  let {
    value = '#5B5FEF',
    opacity = 100,
    onchange = () => {},
  }: Props = $props();

  // Single Source of Truth: HSV + Alpha state
  let h = $state(240); // 0..360
  let s = $state(80);  // 0..100
  let v = $state(90);  // 0..100
  let a = $state(100); // 0..100 % (opacity)

  let formatMode = $state<'Hex' | 'RGB'>('Hex');
  let hexText = $state('5B5FEF');
  let rgbText = $state('91, 95, 239');

  // Dragging active flags
  let isDragging = $state(false);

  // Eyedropper support
  let hasEyeDropper = $state(false);

  onMount(() => {
    hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
    syncFromHexProp(value);
    a = normalizeOpacity(opacity);
  });

  $effect(() => {
    if (!isDragging && value) {
      const cleanInput = value.replace('#', '').toUpperCase();
      if (cleanInput !== hexText.toUpperCase()) {
        syncFromHexProp(value);
      }
      a = normalizeOpacity(opacity);
    }
  });

  function normalizeOpacity(nextOpacity: number): number {
    return Number.isFinite(nextOpacity)
      ? Math.min(100, Math.max(0, Math.round(nextOpacity)))
      : 100;
  }

  function syncFromHexProp(hex: string) {
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6 && c.length !== 8) return;

    if (c.length === 8) {
      const alphaHex = c.substring(6, 8);
      a = Math.round((parseInt(alphaHex, 16) / 255) * 100);
      c = c.substring(0, 6);
    }

    hexText = c.toUpperCase();

    const rInt = parseInt(c.substring(0, 2), 16);
    const gInt = parseInt(c.substring(2, 4), 16);
    const bInt = parseInt(c.substring(4, 6), 16);
    rgbText = `${rInt}, ${gInt}, ${bInt}`;

    const r = rInt / 255;
    const g = gInt / 255;
    const b = bInt / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hVal = 0;
    const d = max - min;
    const sVal = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: hVal = (g - b) / d + (g < b ? 6 : 0); break;
        case g: hVal = (b - r) / d + 2; break;
        case b: hVal = (r - g) / d + 4; break;
      }
      hVal /= 6;
    }
    h = Math.round(hVal * 360);
    s = Math.round(sVal * 100);
    v = Math.round(max * 100);
  }

  function hsvToHex(hDeg: number, sPct: number, vPct: number): string {
    const sFrac = Math.max(0, Math.min(1, sPct / 100));
    const vFrac = Math.max(0, Math.min(1, vPct / 100));
    const c = vFrac * sFrac;
    const x = c * (1 - Math.abs(((hDeg / 60) % 2) - 1));
    const m = vFrac - c;
    let r = 0, g = 0, b = 0;
    if (0 <= hDeg && hDeg < 60) { r = c; g = x; b = 0; }
    else if (60 <= hDeg && hDeg < 120) { r = x; g = c; b = 0; }
    else if (120 <= hDeg && hDeg < 180) { r = 0; g = c; b = x; }
    else if (180 <= hDeg && hDeg < 240) { r = 0; g = x; b = c; }
    else if (240 <= hDeg && hDeg < 300) { r = x; g = 0; b = c; }
    else if (300 <= hDeg && hDeg <= 360) { r = c; g = 0; b = x; }
    const rInt = Math.round((r + m) * 255);
    const gInt = Math.round((g + m) * 255);
    const bInt = Math.round((b + m) * 255);
    const toHexStr = (n: number) => n.toString(16).padStart(2, '0');
    return `${toHexStr(rInt)}${toHexStr(gInt)}${toHexStr(bInt)}`.toUpperCase();
  }

  function emitHexChange(newHex: string) {
    const clean = newHex.replace('#', '').toUpperCase();
    hexText = clean;
    const rInt = parseInt(clean.substring(0, 2), 16);
    const gInt = parseInt(clean.substring(2, 4), 16);
    const bInt = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(rInt) && !isNaN(gInt) && !isNaN(bInt)) {
      rgbText = `${rInt}, ${gInt}, ${bInt}`;
    }
    onchange(`#${clean}`, a);
  }

  // Preset Selection
  function handleSelectPreset(presetHex: string) {
    syncFromHexProp(presetHex);
    emitHexChange(presetHex);
  }

  // --- 1. 2D Saturation / Value Area Dragging ---
  let satAreaRef = $state<HTMLDivElement | null>(null);

  function updateSatVal(e: MouseEvent | TouchEvent) {
    if (!satAreaRef) return;
    const rect = satAreaRef.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const r = 8; // radius of 16px marker
    const clampedX = Math.max(r, Math.min(rect.width - r, clientX - rect.left));
    const clampedY = Math.max(r, Math.min(rect.height - r, clientY - rect.top));

    s = Math.round(((clampedX - r) / (rect.width - 2 * r)) * 100);
    v = Math.round((1 - (clampedY - r) / (rect.height - 2 * r)) * 100);

    const hex = hsvToHex(h, s, v);
    emitHexChange(hex);
  }

  function onSatMouseDown(e: MouseEvent | TouchEvent) {
    isDragging = true;
    updateSatVal(e);
    window.addEventListener('mousemove', onSatMouseMove);
    window.addEventListener('mouseup', onSatMouseUp);
    window.addEventListener('touchmove', onSatTouchMove);
    window.addEventListener('touchend', onSatMouseUp);
  }

  function onSatMouseMove(e: MouseEvent) {
    if (isDragging) updateSatVal(e);
  }

  function onSatTouchMove(e: TouchEvent) {
    if (isDragging) updateSatVal(e);
  }

  function onSatMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', onSatMouseMove);
    window.removeEventListener('mouseup', onSatMouseUp);
    window.removeEventListener('touchmove', onSatTouchMove);
    window.removeEventListener('touchend', onSatMouseUp);
  }

  // --- 2. Rainbow Hue Slider Dragging ---
  let hueTrackRef = $state<HTMLDivElement | null>(null);
  let isDraggingHue = $state(false);

  function updateHueFromEvent(e: MouseEvent | TouchEvent) {
    if (!hueTrackRef) return;
    const rect = hueTrackRef.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const r = 6; // radius of 12px handle
    const clampedX = Math.max(r, Math.min(rect.width - r, clientX - rect.left));
    const ratio = (clampedX - r) / (rect.width - 2 * r);
    h = Math.round(ratio * 360);
    const hex = hsvToHex(h, s, v);
    emitHexChange(hex);
  }

  function onHueMouseDown(e: MouseEvent | TouchEvent) {
    isDragging = true;
    isDraggingHue = true;
    updateHueFromEvent(e);
    window.addEventListener('mousemove', onHueMouseMove);
    window.addEventListener('mouseup', onHueMouseUp);
    window.addEventListener('touchmove', onHueTouchMove);
    window.addEventListener('touchend', onHueMouseUp);
  }

  function onHueMouseMove(e: MouseEvent) {
    if (isDraggingHue) updateHueFromEvent(e);
  }

  function onHueTouchMove(e: TouchEvent) {
    if (isDraggingHue) updateHueFromEvent(e);
  }

  function onHueMouseUp() {
    isDragging = false;
    isDraggingHue = false;
    window.removeEventListener('mousemove', onHueMouseMove);
    window.removeEventListener('mouseup', onHueMouseUp);
    window.removeEventListener('touchmove', onHueTouchMove);
    window.removeEventListener('touchend', onHueMouseUp);
  }

  // --- 3. Opacity Slider Dragging ---
  let opacityTrackRef = $state<HTMLDivElement | null>(null);
  let isDraggingOpacity = $state(false);

  function updateOpacityFromEvent(e: MouseEvent | TouchEvent) {
    if (!opacityTrackRef) return;
    const rect = opacityTrackRef.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const r = 6; // radius of 12px handle
    const clampedX = Math.max(r, Math.min(rect.width - r, clientX - rect.left));
    const ratio = (clampedX - r) / (rect.width - 2 * r);
    a = Math.round(ratio * 100);
    onchange(currentFullHex, a);
  }

  function onOpacityMouseDown(e: MouseEvent | TouchEvent) {
    isDragging = true;
    isDraggingOpacity = true;
    updateOpacityFromEvent(e);
    window.addEventListener('mousemove', onOpacityMouseMove);
    window.addEventListener('mouseup', onOpacityMouseUp);
    window.addEventListener('touchmove', onOpacityTouchMove);
    window.addEventListener('touchend', onOpacityMouseUp);
  }

  function onOpacityMouseMove(e: MouseEvent) {
    if (isDraggingOpacity) updateOpacityFromEvent(e);
  }

  function onOpacityTouchMove(e: TouchEvent) {
    if (isDraggingOpacity) updateOpacityFromEvent(e);
  }

  function onOpacityMouseUp() {
    isDragging = false;
    isDraggingOpacity = false;
    window.removeEventListener('mousemove', onOpacityMouseMove);
    window.removeEventListener('mouseup', onOpacityMouseUp);
    window.removeEventListener('touchmove', onOpacityTouchMove);
    window.removeEventListener('touchend', onOpacityMouseUp);
  }

  // Eyedropper API Tool
  async function pickColorWithEyedropper() {
    if (typeof window === 'undefined' || !window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        syncFromHexProp(result.sRGBHex);
        emitHexChange(result.sRGBHex.replace('#', '').toUpperCase());
      }
    } catch {
      // Cancelling the native picker is expected and needs no user-facing error.
    }
  }

  // Text Inputs
  function handleHexTextInput(e: Event) {
    const text = (e.target as HTMLInputElement).value.trim().replace('#', '');
    hexText = text.toUpperCase();
    if (/^[0-9A-Fa-f]{6}$/.test(text)) {
      syncFromHexProp(`#${text}`);
      emitHexChange(text.toUpperCase());
    }
  }

  function handleRgbTextInput(e: Event) {
    const text = (e.target as HTMLInputElement).value;
    rgbText = text;
    const parts = text.split(/[\s,]+/).map(p => parseInt(p, 10));
    if (parts.length >= 3 && !parts.some(isNaN)) {
      const r = Math.min(255, Math.max(0, parts[0]));
      const g = Math.min(255, Math.max(0, parts[1]));
      const b = Math.min(255, Math.max(0, parts[2]));
      const hex = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
      syncFromHexProp(`#${hex}`);
      emitHexChange(hex);
    }
  }

  function handleOpacityTextInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(val)) {
      a = Math.min(100, Math.max(0, val));
      onchange(currentFullHex, a);
    }
  }

  function getCheckColorForPreset(hex: string): string {
    return getLuminance(hex) > 0.45 ? '#0F172A' : '#FFFFFF';
  }

  const currentHuePureHex = $derived(`#${hsvToHex(h, 100, 100)}`);
  const currentFullHex = $derived(`#${hexText}`);
</script>

<div class="accent-color-picker-grid">
  <!-- Left Column: Custom Color Controls (290px) -->
  <div class="picker-left-col">
    <!-- Header with Eyedropper Button -->
    <div class="col-header">
      <span class="col-title">Свой цвет</span>
      <button
        type="button"
        class="eyedropper-btn"
        onclick={pickColorWithEyedropper}
        title={hasEyeDropper ? 'Пипетка (выбрать цвет с экрана)' : 'Пипетка недоступна в этом браузере'}
        disabled={!hasEyeDropper}
        aria-label="Пипетка (выбрать цвет с экрана)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 22 1-1h3l9-9"/>
          <path d="M3 21v-3l9-9"/>
          <path d="m15 6 3 3"/>
          <path d="m18 3 3 3"/>
          <path d="m14 7 3-3a2.12 2.12 0 0 1 3 3l-3 3"/>
        </svg>
      </button>
    </div>

    <!-- 2D Saturation / Value Matrix Box -->
    <div
      class="sat-val-canvas"
      bind:this={satAreaRef}
      onmousedown={onSatMouseDown}
      ontouchstart={onSatMouseDown}
      style="background-color: {currentHuePureHex};"
      role="slider"
      aria-valuenow={s}
      aria-label="Матрица насыщенности и яркости"
      tabindex="0"
    >
      <div class="sat-gradient"></div>
      <div class="val-gradient"></div>
      <div
        class="matrix-handle-ring"
        style="left: calc(8px + (100% - 16px) * ({s} / 100)); top: calc(8px + (100% - 16px) * ((100 - {v}) / 100));"
      >
        <span class="handle-inner-color" style="background-color: {currentFullHex};"></span>
      </div>
    </div>

    <!-- Sliders Stack -->
    <div class="sliders-stack">
      <!-- 1. Rainbow Hue Spectrum Bar -->
      <div
        class="hue-slider-track"
        bind:this={hueTrackRef}
        onmousedown={onHueMouseDown}
        ontouchstart={onHueMouseDown}
        role="slider"
        aria-valuenow={h}
        aria-label="Спектр цвета (Hue)"
        tabindex="0"
      >
        <div
          class="slider-thumb-ring"
          style="left: calc(6px + (100% - 12px) * ({h} / 360));"
        ></div>
      </div>

      <!-- 2. Opacity / Transparency Bar -->
      <div
        class="opacity-slider-track"
        bind:this={opacityTrackRef}
        onmousedown={onOpacityMouseDown}
        ontouchstart={onOpacityMouseDown}
        style="--slider-color: {currentFullHex};"
        role="slider"
        aria-valuenow={a}
        aria-label="Прозрачность (Opacity)"
        tabindex="0"
      >
        <div
          class="slider-thumb-ring"
          style="left: calc(6px + (100% - 12px) * ({a} / 100));"
        ></div>
      </div>
    </div>
  </div>

  <!-- Right Column: Presets, Values & Preview -->
  <div class="picker-right-col">
    <!-- Presets Block -->
    <div class="right-block">
      <div class="col-header">
        <span class="col-title">Готовые пресеты</span>
      </div>
      <div class="presets-swatches-row" role="radiogroup" aria-label="Готовые пресеты">
        {#each ACCENT_PRESETS as preset (preset.id)}
          {@const isSelected = value.toLowerCase() === preset.hex.toLowerCase()}
          {@const checkColor = getCheckColorForPreset(preset.hex)}
          <button
            type="button"
            class="swatch-btn"
            class:selected={isSelected}
            style="background-color: {preset.hex};"
            onclick={() => handleSelectPreset(preset.hex)}
            title="{preset.name} ({preset.hex})"
            aria-label="Выбрать цвет {preset.name}"
            role="radio"
            aria-checked={isSelected}
          >
            {#if isSelected}
              <svg viewBox="0 0 24 24" fill="none" stroke={checkColor} stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Value Fields Block -->
    <div class="right-block">
      <span class="block-label">Параметры цвета</span>
      <div class="values-inputs-row">
        <!-- Format Select (72px) -->
        <select class="format-select" bind:value={formatMode} aria-label="Формат цвета">
          <option value="Hex">HEX</option>
          <option value="RGB">RGB</option>
        </select>

        <!-- Color Value Field (flex: 1) -->
        <div class="color-value-input-wrap">
          {#if formatMode === 'Hex'}
            <span class="hash-prefix">#</span>
            <input
              type="text"
              class="value-text-field"
              value={hexText}
              oninput={handleHexTextInput}
              maxlength="6"
              placeholder="5B5FEF"
              aria-label="HEX значение цвета"
            />
          {:else}
            <input
              type="text"
              class="value-text-field"
              value={rgbText}
              oninput={handleRgbTextInput}
              placeholder="91, 95, 239"
              aria-label="RGB значение цвета"
            />
          {/if}
        </div>

        <!-- Opacity Input (130px) -->
        <div class="opacity-input-wrap" title="Прозрачность">
          <input
            type="number"
            class="opacity-text-field"
            style="width: {Math.max(1, String(a).length)}ch;"
            value={a}
            min="0"
            max="100"
            oninput={handleOpacityTextInput}
            aria-label="Прозрачность в процентах"
          />
          <span class="percent-suffix">%</span>
        </div>
      </div>
    </div>
  </div>
</div>

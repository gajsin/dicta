<script lang="ts">
  interface Props {
    visible?: boolean;
    isListening?: boolean;
    audioLevel?: number;
  }

  let { visible = true, isListening = true, audioLevel = 0 }: Props = $props();

  let smoothedLevel = $state(0);
  const BAR_ENVELOPE = [0.35, 0.55, 0.8, 1.0, 1.25, 1.0, 0.8, 0.55, 0.35];
  let barHeights = $state<number[]>([3.5, 4.5, 6.5, 9.5, 12, 9.5, 6.5, 4.5, 3.5]);

  $effect(() => {
    let animId: number | null = null;

    if (isListening && visible) {
      const updateFrame = () => {
        const now = performance.now() / 1000;

        // Smooth Lerp on incoming audio level (0.18 factor for organic fluid motion)
        smoothedLevel += (audioLevel - smoothedLevel) * 0.18;

        barHeights = BAR_ENVELOPE.map((env, i) => {
          // Ambient breathing sine wave for natural idle state
          const wave = Math.sin(now * 3.8 + i * 0.8) * 1.2 + Math.cos(now * 2.4 - i * 0.6) * 0.8;
          const baseHeight = [3.5, 4.5, 6.5, 9.5, 12, 9.5, 6.5, 4.5, 3.5][i];
          const idleHeight = baseHeight + wave * 0.35;

          if (smoothedLevel < 0.03) {
            return Math.min(13, Math.max(3, idleHeight));
          }

          // Active voice response with dynamic gain envelope
          const dynamicGain = Math.min(1, smoothedLevel * 3.5);
          const voiceWave = Math.sin(now * 14 + i * 1.2) * 1.8;
          const activeHeight = baseHeight + dynamicGain * 6 * env + voiceWave * dynamicGain;

          return Math.min(13, Math.max(3, activeHeight));
        });

        animId = requestAnimationFrame(updateFrame);
      };
      animId = requestAnimationFrame(updateFrame);
    }

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
    };
  });
</script>

<div class="waveform-container" data-tauri-drag-region>
  {#each barHeights as h, i}
    <span
      class="wave-bar"
      style="transform: scaleY({(h / 13).toFixed(3)})"
      data-tauri-drag-region
    ></span>
  {/each}
</div>

<style>
  .waveform-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 14px;
    width: 56px;
    flex-shrink: 0;
    margin: 0 12px 0 0;
    box-sizing: border-box;
  }

  .wave-bar {
    width: 3px;
    height: 13px;
    background: var(--accent-muted, var(--accent-primary, var(--accent-color, #5B5FEF)));
    opacity: 0.38;
    border-radius: 99px;
    flex-shrink: 0;
    transform-origin: center;
    will-change: transform;
    box-shadow: none;
  }
</style>

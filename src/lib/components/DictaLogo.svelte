<script lang="ts">
  import iconBlack from '../assets/only-logo-black.png';
  import iconWhite from '../assets/only-logo-white.png';
  import logoBlack from '../assets/dicta-logo-black.png';
  import logoWhite from '../assets/dicta-logo-white.png';

  interface Props {
    class?: string;
    variant?: 'icon' | 'full';
    size?: number | string;
  }

  let {
    class: className = '',
    variant = 'icon',
    size = 20,
  }: Props = $props();

  const numSize = $derived(typeof size === 'number' ? size : parseFloat(size) || 20);
  const aspectRatio = $derived(variant === 'full' ? 2740 / 896 : 808 / 756);
  const width = $derived(Math.round(numSize * aspectRatio));
  const blackSource = $derived(variant === 'full' ? logoBlack : iconBlack);
  const whiteSource = $derived(variant === 'full' ? logoWhite : iconWhite);
  const label = $derived(variant === 'full' ? 'Dicta' : 'Dicta icon');
</script>

<span
  class={`dicta-logo ${className}`}
  style:width={`${width}px`}
  style:height={`${numSize}px`}
  role="img"
  aria-label={label}
>
  <img class="dicta-logo__black" src={blackSource} alt="" width={width} height={numSize} />
  <img class="dicta-logo__white" src={whiteSource} alt="" width={width} height={numSize} />
</span>

<style>
  .dicta-logo {
    display: inline-block;
    position: relative;
    vertical-align: middle;
    user-select: none;
    pointer-events: none;
    flex-shrink: 0;
  }

  .dicta-logo img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .dicta-logo__white {
    display: none !important;
  }

  :global(.theme-dark) .dicta-logo__black {
    display: none;
  }

  :global(.theme-dark) .dicta-logo__white {
    display: block !important;
  }
</style>

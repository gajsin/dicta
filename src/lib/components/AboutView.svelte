<script lang="ts">
  import { fade } from 'svelte/transition';
  import DictaLogo from './DictaLogo.svelte';

  interface Props {
    onBack?: () => void;
  }

  let { onBack = () => {} }: Props = $props();
</script>

<div class="view-container info-view about-view" in:fade={{ duration: 150 }} out:fade={{ duration: 100 }}>
  <div class="info-content-card text-center">
    <div class="about-logo-holder">
      <DictaLogo variant="full" size={52} class="about-logo-svg" />
    </div>

    <p class="about-version">Версия 0.2.0</p>

    <p class="about-text-content">
      Dicta — это современный инструмент для диктовки и быстрой трансформации речи в текст с ИИ-постобработкой.
    </p>
    <p class="about-text-content footer-credit">
      Ваш голос. Ваши мысли. Ваша продуктивность.
    </p>
  </div>

  <div class="about-actions">
    <button class="back-footer-btn" onclick={onBack}>Назад в меню</button>
  </div>
</div>

<style>
  .info-view {
    padding-bottom: 12px;
  }

  .info-content-card {
    flex-grow: 1;
    background: transparent;
    border: none;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    overflow-y: auto;
    box-shadow: none;
    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  .about-view {
    justify-content: center;
  }

  .text-center {
    text-align: center;
  }

  .about-logo-holder {
    height: 48px;
    margin: 8px 0 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.about-logo-svg) {
    height: 100%;
    width: auto;
    display: block;
  }

  .about-version {
    font-size: 12px;
    font-weight: 500;
    color: var(--sec-text, #72757D);
    letter-spacing: 0.02em;
    margin: 0 0 18px;
  }

  .about-text-content {
    font-size: 14px;
    line-height: 1.55;
    color: var(--main-text, #17181B);
    margin: 0 auto 16px;
    max-width: 320px;
  }

  .footer-credit {
    font-size: 12px;
    color: var(--sec-text, #72757D);
    margin-top: 24px;
  }

  .about-actions {
    margin-top: auto;
    padding: 16px 24px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
  }

  .back-footer-btn {
    min-width: 140px;
    padding: 0 20px;
    height: 36px;
    background: var(--surface-color, #FFFFFF);
    border: 1px solid var(--border-color, #E1E3E7);
    color: var(--main-text, #17181B);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-footer-btn:hover {
    background: var(--secondary-bg, #F0F1F3);
  }

  .view-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-app, #F5F6F8);
    color: var(--text-primary, #15171A);
  }
</style>

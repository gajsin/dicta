<script lang="ts">
</script>

<div class="detail-loading-skeleton">
  <div class="skeleton-bar toolbar"></div>
  <div class="skeleton-bar meta"></div>
  <div class="skeleton-card">
    <div class="skeleton-line full"></div>
    <div class="skeleton-line medium"></div>
    <div class="skeleton-line long"></div>
  </div>
</div>

<style>
  .detail-loading-skeleton {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 32px;
    height: 100%;
  }

  .skeleton-bar {
    background: var(--skeleton-bg, rgba(0, 0, 0, 0.06));
    border-radius: 6px;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-bar.toolbar {
    height: 36px;
    width: 220px;
  }

  .skeleton-bar.meta {
    height: 16px;
    width: 340px;
  }

  .skeleton-card {
    background: var(--card-bg, #FFFFFF);
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #E5E7EB);
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-line {
    background: var(--skeleton-bg, rgba(0, 0, 0, 0.06));
    border-radius: 4px;
    height: 14px;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-line.full { width: 100%; }
  .skeleton-line.medium { width: 75%; }
  .skeleton-line.long { width: 90%; }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.25; }
  }
</style>

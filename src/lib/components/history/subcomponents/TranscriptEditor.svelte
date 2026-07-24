<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    oninput: (value: string) => void;
    onSave?: () => void;
    onCancel?: () => void;
  }

  let {
    value = '',
    placeholder = 'Введите текст диктовки…',
    oninput,
    onSave,
    onCancel
  }: Props = $props();

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
  };
</script>

<textarea
  class="document-editor-textarea"
  {value}
  oninput={(e) => oninput(e.currentTarget.value)}
  onkeydown={handleKeyDown}
  {placeholder}
></textarea>

<style>
  .document-editor-textarea {
    width: 100%;
    max-width: 680px;
    min-height: 240px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--text-primary, #E5E7EB);
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    outline: none;
    resize: vertical;
    font-family: var(--font-sans);
    padding: 0;
  }
  .document-editor-textarea:focus-visible {
    outline: none;
  }
</style>

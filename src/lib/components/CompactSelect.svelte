<script lang="ts">
  import Select from './ui/Select.svelte';
  import type { SelectOption } from './ui/types';

  interface Props {
    value: string;
    options: SelectOption[];
    placeholder?: string;
    ariaLabel?: string;
    disabled?: boolean;
    onChange?: (val: string) => void;
  }

  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Выберите',
    ariaLabel = 'Выбор',
    disabled = false,
    onChange = () => {}
  }: Props = $props();
</script>

<Select
  bind:value
  {options}
  {placeholder}
  {ariaLabel}
  {disabled}
  {onChange}
/>

import type { ProviderId } from '../settings/model.js';

export interface ModelOption {
  value: string;
  label: string;
  detail?: string;
}

export const STT_MODELS_BY_PROVIDER: Record<ProviderId, ModelOption[]> = {
  groq: [
    {
      value: 'whisper-large-v3-turbo',
      label: 'Whisper Large v3 Turbo',
      detail: 'whisper-large-v3-turbo',
    },
    {
      value: 'whisper-large-v3',
      label: 'Whisper Large v3',
      detail: 'whisper-large-v3',
    },
  ],
  polza: [
    { value: 'whisper-1', label: 'Whisper 1', detail: 'whisper-1' },
    {
      value: 'openai/gpt-4o-mini-transcribe',
      label: 'GPT-4o Mini Transcribe',
      detail: 'openai/gpt-4o-mini-transcribe',
    },
    {
      value: 'openai/gpt-4o-transcribe',
      label: 'GPT-4o Transcribe',
      detail: 'openai/gpt-4o-transcribe',
    },
  ],
  openai: [
    { value: 'whisper-1', label: 'Whisper 1', detail: 'whisper-1' },
    {
      value: 'gpt-4o-mini-transcribe',
      label: 'GPT-4o Mini Transcribe',
      detail: 'gpt-4o-mini-transcribe',
    },
    {
      value: 'gpt-4o-transcribe',
      label: 'GPT-4o Transcribe',
      detail: 'gpt-4o-transcribe',
    },
  ],
  openrouter: [
    {
      value: 'openai/gpt-4o-mini-transcribe',
      label: 'GPT-4o Mini Transcribe',
      detail: 'openai/gpt-4o-mini-transcribe',
    },
    {
      value: 'openai/gpt-4o-transcribe',
      label: 'GPT-4o Transcribe',
      detail: 'openai/gpt-4o-transcribe',
    },
    {
      value: 'openai/whisper-large-v3',
      label: 'Whisper Large v3',
      detail: 'openai/whisper-large-v3',
    },
  ],
};

export const LLM_MODELS_BY_PROVIDER: Record<ProviderId, ModelOption[]> = {
  groq: [
    {
      value: 'openai/gpt-oss-120b',
      label: 'GPT-OSS 120B',
      detail: 'openai/gpt-oss-120b',
    },
    {
      value: 'openai/gpt-oss-20b',
      label: 'GPT-OSS 20B',
      detail: 'openai/gpt-oss-20b',
    },
  ],
  polza: [
    {
      value: 'openai/gpt-4o-mini',
      label: 'GPT-4o Mini',
      detail: 'openai/gpt-4o-mini',
    },
    {
      value: 'openai/gpt-4o',
      label: 'GPT-4o',
      detail: 'openai/gpt-4o',
    },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', detail: 'gpt-4o-mini' },
    { value: 'gpt-4o', label: 'GPT-4o', detail: 'gpt-4o' },
  ],
  openrouter: [
    {
      value: 'openai/gpt-4o-mini',
      label: 'GPT-4o Mini',
      detail: 'openai/gpt-4o-mini',
    },
    {
      value: 'meta-llama/llama-3.3-70b-instruct',
      label: 'Llama 3.3 70B Instruct',
      detail: 'meta-llama/llama-3.3-70b-instruct',
    },
  ],
};

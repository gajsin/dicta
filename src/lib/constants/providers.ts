export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string;
  placeholder: string;
  formatHelp: string;
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'groq',
    name: 'Groq',
    description: 'Высокоскоростная обработка текста и облачный Whisper',
    capabilities: 'Распознавание речи • Обработка текста',
    placeholder: 'gsk_...',
    formatHelp: 'Начинается с gsk_'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Официальные модели Whisper-1 и GPT-4o',
    capabilities: 'Распознавание речи • Обработка текста',
    placeholder: 'sk-...',
    formatHelp: 'Начинается с sk-'
  },
  {
    id: 'polza',
    name: 'Polza.ai',
    description: 'Единый API-шлюз с поддержкой широкого спектра моделей',
    capabilities: 'Распознавание речи • Обработка текста',
    placeholder: 'polza_...',
    formatHelp: 'Начинается с polza_'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Мультимодельный агрегатор нейросетей',
    capabilities: 'Распознавание речи • Обработка текста',
    placeholder: 'sk-or-...',
    formatHelp: 'Начинается с sk-or-'
  },
];

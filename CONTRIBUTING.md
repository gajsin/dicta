# Участие в разработке Dicta

Спасибо за желание помочь проекту. Dicta — Windows-приложение на Tauri 2, Svelte 5 и Rust.

## Локальная разработка

Требуются Node.js 22+, Rust stable, Visual Studio Build Tools и WebView2.

```powershell
npm ci
npm run tauri dev
```

Перед pull request выполните:

```powershell
npm run check
npm run format:check
npm run lint
```

## Правила изменений

- Создавайте небольшие, тематические pull request.
- Описывайте сценарий ручной проверки для исправлений логики.
- Не храните API-ключи в коде, тестах, логах и снимках экрана.
- Не меняйте формат `settings.json` без обратной совместимости.
- Горячие клавиши сохраняются в каноническом виде на основе физического кода клавиши.
- Не добавляйте пользовательский `settings.json` в репозиторий: он может содержать API-ключи.

Архитектура описана в [docs/architecture.md](docs/architecture.md).

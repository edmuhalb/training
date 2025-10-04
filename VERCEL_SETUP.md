# Настройка Vercel

## 1. Переменные окружения

В настройках Vercel добавьте следующие переменные:

```
NODE_ENV=production
PORT=3000
```

## 2. Структура проекта

```
├── api/
│   └── index.js          # Vercel serverless function
├── src/
│   ├── webapp.js         # Express app
│   ├── database.js       # SQLite database
│   └── services/         # Business logic
├── public/               # Static files
│   ├── index.html
│   ├── css/
│   └── js/
├── vercel.json           # Vercel config
└── package.json
```

## 3. Деплой

1. Подключите репозиторий к Vercel
2. Убедитесь, что переменные окружения настроены
3. Деплой должен работать автоматически

## 4. Возможные проблемы

- **404 ошибка**: Проверьте `vercel.json` и структуру файлов
- **База данных**: SQLite файлы не сохраняются в serverless функциях
- **Статические файлы**: Убедитесь, что `public/` папка доступна

## 5. Альтернатива

Для продакшена лучше использовать:
- **PostgreSQL** вместо SQLite
- **Railway** или **Heroku** для полноценного сервера
- **Vercel** только для статических файлов + API

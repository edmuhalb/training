# Инструкции по развертыванию

## Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

```bash
cp env.example .env
```

Отредактируйте `.env` файл:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL=./data/training_bot.db
PORT=3000
NODE_ENV=development
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

### 4. Запуск тестов

```bash
npm test
```

## Развертывание на Heroku

### 1. Подготовка

1. Создайте аккаунт на [Heroku](https://heroku.com)
2. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

### 2. Создание приложения

```bash
# Логин в Heroku
heroku login

# Создание приложения
heroku create your-app-name

# Установка переменных окружения
heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token
heroku config:set NODE_ENV=production
```

### 3. Развертывание

```bash
# Добавление Heroku как удаленного репозитория
git remote add heroku https://git.heroku.com/your-app-name.git

# Развертывание
git push heroku main
```

### 4. Настройка webhook (опционально)

```bash
# Получение URL приложения
heroku apps:info

# Установка webhook URL
heroku config:set TELEGRAM_WEBHOOK_URL=https://your-app-name.herokuapp.com/webhook
```

## Развертывание на VPS

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2
```

### 2. Клонирование и настройка

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd training

# Установка зависимостей
npm install

# Создание .env файла
cp env.example .env
nano .env
```

### 3. Настройка PM2

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'training-bot',
    script: 'src/bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 4. Запуск

```bash
# Запуск с PM2
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup
```

## Развертывание с Docker

### 1. Создание Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Создание docker-compose.yml

```yaml
version: '3.8'

services:
  training-bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - DATABASE_URL=./data/training_bot.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 3. Запуск

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

## Настройка Nginx (для VPS)

### 1. Установка Nginx

```bash
sudo apt install nginx
```

### 2. Создание конфигурации

```bash
sudo nano /etc/nginx/sites-available/training-bot
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Активация конфигурации

```bash
sudo ln -s /etc/nginx/sites-available/training-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг

### 1. Логи PM2

```bash
# Просмотр логов
pm2 logs training-bot

# Мониторинг в реальном времени
pm2 monit
```

### 2. Мониторинг системы

```bash
# Установка htop
sudo apt install htop

# Мониторинг ресурсов
htop
```

### 3. Резервное копирование

```bash
# Создание скрипта резервного копирования
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz data/
# Загрузка в облачное хранилище
```

## Обновление

### 1. Обновление кода

```bash
# Остановка бота
pm2 stop training-bot

# Обновление кода
git pull origin main

# Установка новых зависимостей
npm install

# Запуск бота
pm2 start training-bot
```

### 2. Обновление базы данных

```bash
# Миграции (если необходимо)
npm run migrate
```

## Безопасность

### 1. Настройка файрвола

```bash
# Установка UFW
sudo apt install ufw

# Настройка правил
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Ограничение доступа к базе данных

```bash
# Создание отдельного пользователя для приложения
sudo -u postgres createuser --interactive training_bot
```

## Устранение неполадок

### 1. Проверка статуса

```bash
# Статус PM2
pm2 status

# Статус Nginx
sudo systemctl status nginx

# Статус приложения
curl http://localhost:3000/health
```

### 2. Логи

```bash
# Логи приложения
pm2 logs training-bot

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 3. Перезапуск сервисов

```bash
# Перезапуск бота
pm2 restart training-bot

# Перезапуск Nginx
sudo systemctl restart nginx
```




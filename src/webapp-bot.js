const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

class WebAppBot {
    constructor() {
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        this.webAppUrl = process.env.WEBAPP_URL || 'https://your-domain.com';
        
        this.setupHandlers();
    }

    setupHandlers() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const welcomeMessage = `
🏋️ **Добро пожаловать в Last Man Training!**

Это веб-приложение для составления программ тренировок на основе СРЦ (саморасчитывающихся циклов).

Нажмите кнопку ниже, чтобы открыть приложение:
            `;

            const keyboard = {
                inline_keyboard: [[
                    {
                        text: '🚀 Открыть приложение',
                        web_app: { url: this.webAppUrl }
                    }
                ]]
            };

            this.bot.sendMessage(chatId, welcomeMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            const helpMessage = `
📖 **Помощь по использованию Last Man Training**

**Основные функции:**
• 📝 Заполнение профиля (пол, вес, рост, уровень подготовки)
• 📋 Выбор тренировочного цикла
• 💪 Генерация персонального плана тренировок
• 📊 Расчет ИМТ и рекомендаций

**Команды:**
/start - Запустить приложение
/help - Показать эту справку
/app - Открыть веб-приложение

**Как использовать:**
1. Нажмите "Открыть приложение"
2. Заполните свой профиль
3. Выберите подходящий цикл
4. Получите персональный план тренировок!

Если у вас есть вопросы, обратитесь к администратору.
            `;

            this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        // App command
        this.bot.onText(/\/app/, (msg) => {
            const chatId = msg.chat.id;
            const keyboard = {
                inline_keyboard: [[
                    {
                        text: '🚀 Открыть приложение',
                        web_app: { url: this.webAppUrl }
                    }
                ]]
            };

            this.bot.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть приложение:', {
                reply_markup: keyboard
            });
        });

        // Handle web app data
        this.bot.on('message', (msg) => {
            if (msg.web_app_data) {
                const chatId = msg.chat.id;
                const data = JSON.parse(msg.web_app_data.data);
                
                // Handle web app data if needed
                console.log('Received web app data:', data);
                
                this.bot.sendMessage(chatId, '✅ Данные получены! Спасибо за использование приложения.');
            }
        });

        // Error handling
        this.bot.on('polling_error', (error) => {
            console.error('Polling error:', error);
        });

        this.bot.on('error', (error) => {
            console.error('Bot error:', error);
        });
    }

    start() {
        console.log('🤖 WebApp Bot started!');
        console.log(`📱 WebApp URL: ${this.webAppUrl}`);
        console.log('Bot is polling for messages...');
    }

    stop() {
        this.bot.stopPolling();
        console.log('Bot stopped');
    }
}

// Start bot if this file is run directly
if (require.main === module) {
    const bot = new WebAppBot();
    bot.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down bot...');
        bot.stop();
        process.exit(0);
    });
}

module.exports = WebAppBot;

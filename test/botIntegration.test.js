const TrainingBot = require('../src/bot');
const TelegramBotMock = require('./mocks/telegramBotMock');
const Database = require('../src/database');

// Мокаем node-telegram-bot-api
jest.mock('node-telegram-bot-api', () => {
    const TelegramBotMock = require('./mocks/telegramBotMock');
    return jest.fn().mockImplementation(() => new TelegramBotMock());
});

describe('TrainingBot Integration Tests', () => {
    let bot;
    let botMock;
    let database;

    beforeAll(async () => {
        // Создаем тестовую базу данных
        process.env.DATABASE_URL = './test/data/test_bot.db';
        process.env.TELEGRAM_BOT_TOKEN = 'test_token';
        
        database = new Database();
        await database.init();
    });

    afterAll(async () => {
        if (database) {
            database.close();
        }
    });

    beforeEach(() => {
        bot = new TrainingBot();
        botMock = bot.bot; // Получаем мок-объект
    });

    describe('Bot Initialization', () => {
        test('should initialize bot with all services', () => {
            expect(bot.bot).toBeDefined();
            expect(bot.database).toBeDefined();
            expect(bot.cycleService).toBeDefined();
            expect(bot.userService).toBeDefined();
            expect(bot.workoutService).toBeDefined();
            expect(bot.dialogService).toBeDefined();
        });
    });

    describe('Start Command', () => {
        test('should handle /start command', async () => {
            const message = {
                chat: { id: 12345 },
                from: { id: 67890, username: 'testuser', first_name: 'Test', last_name: 'User' }
            };

            await bot.bot.simulateMessage({ text: '/start', ...message });

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Добро пожаловать в бот');
            expect(response.text).toContain('/setup_profile');
        });
    });

    describe('Profile Dialog', () => {
        test('should start profile dialog with /setup_profile', async () => {
            const message = {
                chat: { id: 12345 },
                from: { id: 67890 }
            };

            await bot.bot.simulateMessage({ text: '/setup_profile', ...message });

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Давайте заполним ваш профиль');
            expect(response.text).toContain('Шаг 1 из 4');
        });

        test('should handle gender selection in dialog', async () => {
            const chatId = 12345;
            const userId = 67890;

            // Начинаем диалог
            await bot.dialogService.startProfileDialog(bot.bot, chatId, userId);
            botMock.clearMessages();

            // Симулируем выбор пола
            const callbackQuery = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: 'dialog_gender_male'
            };

            await bot.bot.simulateCallbackQuery(callbackQuery);

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Шаг 2 из 4');
            expect(response.text).toContain('вес в килограммах');
        });
    });

    describe('Cycle Selection', () => {
        test('should show available cycles', async () => {
            const message = {
                chat: { id: 12345 },
                from: { id: 67890 }
            };

            await bot.bot.simulateMessage({ text: '/cycles', ...message });

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Выберите тренировочный цикл');
            expect(response.options.reply_markup).toBeDefined();
        });

        test('should handle cycle selection', async () => {
            const chatId = 12345;
            const userId = 67890;

            // Создаем пользователя с полным профилем
            await bot.userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });
            await bot.userService.setGender(userId, 'male');
            await bot.userService.setWeight(userId, 75);
            await bot.userService.setHeight(userId, 180);
            await bot.userService.setLevel(userId, 'КМС');

            const callbackQuery = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: 'cycle_1'
            };

            await bot.bot.simulateCallbackQuery(callbackQuery);

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('план тренировок');
        });
    });

    describe('User Commands', () => {
        test('should show profile information', async () => {
            const userId = 67890;
            const chatId = 12345;

            // Создаем пользователя
            await bot.userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });

            const message = {
                chat: { id: chatId },
                from: { id: userId }
            };

            await bot.bot.simulateMessage({ text: '/profile', ...message });

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Ваш профиль');
        });

        test('should show help information', async () => {
            const message = {
                chat: { id: 12345 },
                from: { id: 67890 }
            };

            await bot.bot.simulateMessage({ text: '/help', ...message });

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Помощь по боту');
            expect(response.text).toContain('/setup_profile');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid commands gracefully', async () => {
            const message = {
                chat: { id: 12345 },
                from: { id: 67890 },
                text: 'invalid_command'
            };

            await bot.bot.simulateMessage(message);

            // Не должно быть ошибок
            expect(botMock.getMessagesCount()).toBe(0);
        });

        test('should handle database errors', async () => {
            // Закрываем базу данных для создания ошибки
            await bot.database.close();

            const message = {
                chat: { id: 12345 },
                from: { id: 67890 }
            };

            await bot.bot.simulateMessage({ text: '/start', ...message });

            // Бот должен обработать ошибку gracefully
            expect(botMock.getMessagesCount()).toBe(1);
        });
    });

    describe('Dialog State Management', () => {
        test('should cancel dialog with /cancel command', async () => {
            const userId = 67890;
            const chatId = 12345;

            // Начинаем диалог
            await bot.dialogService.startProfileDialog(bot.bot, chatId, userId);
            botMock.clearMessages();

            const message = {
                chat: { id: chatId },
                from: { id: userId }
            };

            await bot.bot.simulateMessage({ text: '/cancel', ...message });

            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Диалог отменен');
        });
    });
});

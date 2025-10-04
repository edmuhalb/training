const TrainingBot = require('../../src/bot');
// const TelegramBotMock = require('../mocks/telegramBotMock');
const Database = require('../../src/database');

// Мокаем node-telegram-bot-api (опциональная зависимость)
jest.mock('node-telegram-bot-api', () => {
    try {
        const TelegramBotMock = require('../mocks/telegramBotMock');
        return jest.fn().mockImplementation(() => new TelegramBotMock());
    } catch (error) {
        // Если модуль не найден, возвращаем заглушку
        return jest.fn().mockImplementation(() => ({}));
    }
});

describe.skip('Bot E2E Tests', () => {
    let bot;
    let botMock;
    let database;

    beforeAll(async() => {
        process.env.DATABASE_URL = './test/data/e2e_test.db';
        process.env.TELEGRAM_BOT_TOKEN = 'test_token';

        database = new Database();
        await database.init();
    });

    afterAll(async() => {
        if (database) {
            database.close();
        }
    });

    beforeEach(() => {
        bot = new TrainingBot();
        botMock = bot.bot;
    });

    describe('Complete User Journey', () => {
        test('should complete full user registration and workout plan generation', async() => {
            const userId = 999999;
            const chatId = 888888;

            // 1. User starts bot
            const startMessage = {
                chat: { id: chatId },
                from: { id: userId, username: 'e2euser', first_name: 'E2E', last_name: 'User' }
            };

            await bot.bot.simulateMessage({ text: '/start', ...startMessage });
            expect(botMock.getMessagesCount()).toBe(1);
            expect(botMock.getLastMessage().text).toContain('Добро пожаловать');

            // 2. User starts profile setup
            await bot.bot.simulateMessage({ text: '/setup_profile', ...startMessage });
            expect(botMock.getMessagesCount()).toBe(2);
            expect(botMock.getLastMessage().text).toContain('Давайте заполним ваш профиль');

            // 3. User selects gender
            const genderCallback = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: 'dialog_gender_male'
            };

            await bot.bot.simulateCallbackQuery(genderCallback);
            expect(botMock.getMessagesCount()).toBe(3);
            expect(botMock.getLastMessage().text).toContain('Шаг 2 из 4');

            // 4. User enters weight
            const weightMessage = {
                chat: { id: chatId },
                from: { id: userId },
                text: '75'
            };

            await bot.bot.simulateMessage(weightMessage);
            expect(botMock.getMessagesCount()).toBe(4);
            expect(botMock.getLastMessage().text).toContain('Шаг 3 из 4');

            // 5. User enters height
            const heightMessage = {
                chat: { id: chatId },
                from: { id: userId },
                text: '180'
            };

            await bot.bot.simulateMessage(heightMessage);
            expect(botMock.getMessagesCount()).toBe(5);
            expect(botMock.getLastMessage().text).toContain('Шаг 4 из 4');

            // 6. User selects level
            const levelCallback = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: 'dialog_level_КМС'
            };

            await bot.bot.simulateCallbackQuery(levelCallback);
            expect(botMock.getMessagesCount()).toBe(6);
            expect(botMock.getLastMessage().text).toContain('Профиль успешно заполнен');

            // 7. User views cycles
            await bot.bot.simulateMessage({ text: '/cycles', ...startMessage });
            expect(botMock.getMessagesCount()).toBe(7);
            expect(botMock.getLastMessage().text).toContain('Выберите тренировочный цикл');

            // 8. User selects a cycle
            const cycleCallback = {
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: 'cycle_1'
            };

            await bot.bot.simulateCallbackQuery(cycleCallback);
            expect(botMock.getMessagesCount()).toBe(8);
            expect(botMock.getLastMessage().text).toContain('план тренировок');

            // 9. User views profile
            await bot.bot.simulateMessage({ text: '/profile', ...startMessage });
            expect(botMock.getMessagesCount()).toBe(9);
            expect(botMock.getLastMessage().text).toContain('Ваш профиль');
        });
    });

    describe('Error Handling E2E', () => {
        test('should handle invalid inputs gracefully', async() => {
            const userId = 999998;
            const chatId = 888887;

            // Start profile dialog
            await bot.bot.simulateMessage({
                chat: { id: chatId },
                from: { id: userId },
                text: '/setup_profile'
            });

            // Select gender
            await bot.bot.simulateCallbackQuery({
                message: { chat: { id: chatId } },
                from: { id: userId },
                data: 'dialog_gender_male'
            });

            // Enter invalid weight
            await bot.bot.simulateMessage({
                chat: { id: chatId },
                from: { id: userId },
                text: 'invalid_weight'
            });

            const lastMessage = botMock.getLastMessage();
            expect(lastMessage.text).toContain('Введите вес числом');

            // Enter valid weight
            await bot.bot.simulateMessage({
                chat: { id: chatId },
                from: { id: userId },
                text: '75'
            });

            // Enter invalid height
            await bot.bot.simulateMessage({
                chat: { id: chatId },
                from: { id: userId },
                text: 'invalid_height'
            });

            const heightMessage = botMock.getLastMessage();
            expect(heightMessage.text).toContain('Введите рост числом');
        });

        test('should handle dialog cancellation', async() => {
            const userId = 999997;
            const chatId = 888886;

            // Start profile dialog
            await bot.bot.simulateMessage({
                chat: { id: chatId },
                from: { id: userId },
                text: '/setup_profile'
            });

            // Cancel dialog
            await bot.bot.simulateMessage({
                chat: { id: chatId },
                from: { id: userId },
                text: '/cancel'
            });

            const lastMessage = botMock.getLastMessage();
            expect(lastMessage.text).toContain('Диалог отменен');
        });
    });

    describe('Multiple Users E2E', () => {
        test('should handle multiple users simultaneously', async() => {
            const user1 = { id: 999996, chatId: 888885 };
            const user2 = { id: 999995, chatId: 888884 };

            // User 1 starts profile dialog
            await bot.bot.simulateMessage({
                chat: { id: user1.chatId },
                from: { id: user1.id },
                text: '/setup_profile'
            });

            // User 2 starts profile dialog
            await bot.bot.simulateMessage({
                chat: { id: user2.chatId },
                from: { id: user2.id },
                text: '/setup_profile'
            });

            // Both users should be in separate dialogs
            expect(bot.dialogService.isUserInDialog(user1.id)).toBe(true);
            expect(bot.dialogService.isUserInDialog(user2.id)).toBe(true);

            // User 1 selects gender
            await bot.bot.simulateCallbackQuery({
                message: { chat: { id: user1.chatId } },
                from: { id: user1.id },
                data: 'dialog_gender_male'
            });

            // User 2 selects gender
            await bot.bot.simulateCallbackQuery({
                message: { chat: { id: user2.chatId } },
                from: { id: user2.id },
                data: 'dialog_gender_female'
            });

            // Both users should progress independently
            expect(bot.dialogService.getDialogState(user1.id).state).toBe('waiting_weight');
            expect(bot.dialogService.getDialogState(user2.id).state).toBe('waiting_weight');
        });
    });

    describe('Performance E2E', () => {
        test('should handle rapid message processing', async() => {
            const userId = 999994;
            const chatId = 888883;

            const startTime = Date.now();

            // Send multiple messages rapidly
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(bot.bot.simulateMessage({
                    chat: { id: chatId },
                    from: { id: userId },
                    text: `/start_${i}`
                }));
            }

            await Promise.all(promises);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should process all messages within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds
        });
    });
});

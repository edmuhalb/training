const DialogService = require('../../src/services/dialogService');
const UserService = require('../../src/services/userService');
const Database = require('../../src/database');
const TelegramBotMock = require('../mocks/telegramBotMock');

describe('DialogService', () => {
    let dialogService;
    let userService;
    let database;

    // Увеличиваем таймаут для тестов
    jest.setTimeout(10000);
    let botMock;

    beforeAll(async() => {
        database = new Database();
        await database.init();
        // Убеждаемся, что таблицы созданы
        await database.createTables();
        // Небольшая задержка для завершения создания таблиц
        await new Promise(resolve => setTimeout(resolve, 100));
        userService = new UserService(database);
        dialogService = new DialogService(userService);
        botMock = new TelegramBotMock();
    });

    beforeEach(async() => {
        botMock.clearMessages();
        // Очищаем тестовые данные
        try {
            await database.run('DELETE FROM users WHERE id > 1000000');
        } catch (error) {
            // Игнорируем ошибки очистки
        }
        // Очищаем состояния диалогов
        dialogService.userStates.clear();
    });

    afterAll(async() => {
        if (database) {
            database.close();
        }
    });

    describe('startProfileDialog', () => {
        test('should start profile dialog for new user', async() => {
            const chatId = 12345;
            const userId = 999001;

            // Создаем пользователя без полного профиля
            await userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });
            // НЕ заполняем профиль полностью

            await dialogService.startProfileDialog(botMock, chatId, userId);

            expect(botMock.getMessagesCount()).toBe(1);
            const message = botMock.getLastMessage();
            expect(message.text).toContain('Давайте заполним ваш профиль');
            expect(message.text).toContain('Шаг 1 из 4');
            expect(message.options.reply_markup).toBeDefined();
        });

        test('should not start dialog if profile is complete', async() => {
            const chatId = 12345;
            const userId = 67890;

            // Создаем пользователя с полным профилем
            await userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });
            await userService.setGender(userId, 'male');
            await userService.setWeight(userId, 75);
            await userService.setHeight(userId, 180);
            await userService.setLevel(userId, 'КМС');

            await dialogService.startProfileDialog(botMock, chatId, userId);

            const message = botMock.getLastMessage();
            expect(message.text).toContain('Ваш профиль уже заполнен');
        });
    });

    describe('handleDialogResponse', () => {
        test('should handle gender selection via callback', async() => {
            const userId = 999002;
            const chatId = 12345;

            // Создаем пользователя
            await userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });

            // Начинаем диалог
            await dialogService.startProfileDialog(botMock, chatId, userId);
            botMock.clearMessages();

            // Симулируем выбор пола
            const callbackQuery = {
                chat: { id: chatId },
                from: { id: userId },
                text: null,
                data: 'dialog_gender_male'
            };

            const handled = await dialogService.handleDialogResponse(botMock, callbackQuery, 'dialog_gender_male');

            expect(handled).toBe(true);
            expect(botMock.getMessagesCount()).toBe(1);
            const message = botMock.getLastMessage();
            expect(message.text).toContain('Шаг 2 из 4');
            expect(message.text).toContain('вес в килограммах');
        });

        test('should handle weight input', async() => {
            const userId = 67890;
            const chatId = 12345;

            // Устанавливаем состояние диалога
            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_WEIGHT,
                data: { gender: 'male' }
            });

            const message = {
                chat: { id: chatId },
                from: { id: userId },
                text: '75'
            };

            const handled = await dialogService.handleDialogResponse(botMock, message);

            expect(handled).toBe(true);
            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Шаг 3 из 4');
            expect(response.text).toContain('рост в сантиметрах');
        });

        test('should handle height input', async() => {
            const userId = 67890;
            const chatId = 12345;

            // Устанавливаем состояние диалога
            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_HEIGHT,
                data: { gender: 'male', weight: 75 }
            });

            const message = {
                chat: { id: chatId },
                from: { id: userId },
                text: '180'
            };

            const handled = await dialogService.handleDialogResponse(botMock, message);

            expect(handled).toBe(true);
            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Шаг 4 из 4');
            expect(response.text).toContain('уровень подготовки');
        });

        test('should handle level selection and complete dialog', async() => {
            const userId = 67890;
            const chatId = 12345;

            // Устанавливаем состояние диалога
            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_LEVEL,
                data: { gender: 'male', weight: 75, height: 180 }
            });

            const callbackQuery = {
                chat: { id: chatId },
                from: { id: userId },
                text: null,
                data: 'dialog_level_КМС'
            };

            const handled = await dialogService.handleDialogResponse(botMock, callbackQuery, 'dialog_level_КМС');

            expect(handled).toBe(true);
            expect(botMock.getMessagesCount()).toBe(1);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Профиль успешно заполнен');
            expect(response.text).toContain('ИМТ');
        });

        test('should validate weight input', async() => {
            const userId = 999003;
            const chatId = 12345;

            // Создаем пользователя
            await userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });

            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_WEIGHT,
                data: { gender: 'male' }
            });

            const message = {
                chat: { id: chatId },
                from: { id: userId },
                text: 'invalid_weight'
            };

            const handled = await dialogService.handleDialogResponse(botMock, message);

            expect(handled).toBe(true);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Введите вес числом');
        });

        test('should validate height input', async() => {
            const userId = 999004;
            const chatId = 12345;

            // Создаем пользователя
            await userService.createOrUpdateUser({
                id: userId,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            });

            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_HEIGHT,
                data: { gender: 'male', weight: 75 }
            });

            const message = {
                chat: { id: chatId },
                from: { id: userId },
                text: 'invalid_height'
            };

            const handled = await dialogService.handleDialogResponse(botMock, message);

            expect(handled).toBe(true);
            const response = botMock.getLastMessage();
            expect(response.text).toContain('Введите рост числом');
        });
    });

    describe('BMI calculation', () => {
        test('should calculate BMI correctly', () => {
            const bmi = dialogService.calculateBMI(75, 180);
            expect(bmi).toBe('23.1');
        });

        test('should categorize BMI correctly', () => {
            expect(dialogService.getBMICategory(18.0)).toBe('Недостаточный вес');
            expect(dialogService.getBMICategory(22.0)).toBe('Нормальный вес');
            expect(dialogService.getBMICategory(27.0)).toBe('Избыточный вес');
            expect(dialogService.getBMICategory(32.0)).toBe('Ожирение');
        });
    });

    describe('dialog state management', () => {
        test('should track user dialog state', () => {
            const userId = 12345;
            expect(dialogService.isUserInDialog(userId)).toBe(false);

            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_GENDER,
                data: {}
            });

            expect(dialogService.isUserInDialog(userId)).toBe(true);
        });

        test('should cancel dialog', () => {
            const userId = 12345;
            dialogService.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_GENDER,
                data: {}
            });

            expect(dialogService.isUserInDialog(userId)).toBe(true);
            dialogService.cancelDialog(userId);
            expect(dialogService.isUserInDialog(userId)).toBe(false);
        });
    });
});

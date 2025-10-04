// Optional dependency - install with: npm install node-telegram-bot-api
let TelegramBot;
try {
    TelegramBot = require('node-telegram-bot-api');
} catch (error) {
    console.log('node-telegram-bot-api not installed. Bot functionality disabled.');
    TelegramBot = null;
}
const express = require('express');
const dotenv = require('dotenv');
const Database = require('./database');
const CycleService = require('./services/cycleService');
const UserService = require('./services/userService');
const WorkoutService = require('./services/workoutService');
const DialogService = require('./services/dialogService');
const UserCommands = require('./commands/userCommands');

// Загружаем переменные окружения
dotenv.config();

class TrainingBot {
    constructor() {
        if (!TelegramBot) {
            throw new Error('node-telegram-bot-api is required for bot functionality. Install with: npm install node-telegram-bot-api');
        }

        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        this.app = express();
        this.database = new Database();
        this.cycleService = new CycleService();
        this.userService = new UserService(this.database);
        this.workoutService = new WorkoutService(this.database);
        this.dialogService = new DialogService(this.userService);

        this.setupMiddleware();
        this.setupHandlers();
        this.setupWebhook();

        // Инициализируем команды пользователя
        this.userCommands = new UserCommands(this.bot, this.userService);
    }

    setupMiddleware() {
        this.app.use(express.json());
    }

    setupHandlers() {
        // Команда /start
        this.bot.onText(/\/start/, async(msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                await this.userService.createOrUpdateUser({
                    id: userId,
                    username: msg.from.username,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name
                });

                const welcomeMessage = `
🏋️‍♂️ Добро пожаловать в бот для составления программ тренировок!

Этот бот поможет вам:
• Выбрать подходящий тренировочный цикл (СРЦ)
• Составить персональный план тренировок
• Отслеживать прогресс

🚀 Для начала заполните профиль:
/setup_profile - Заполнить профиль в диалоговом режиме

📋 Другие команды:
/cycles - Просмотреть доступные циклы
/profile - Настроить профиль
/help - Помощь
                `;

                await this.bot.sendMessage(chatId, welcomeMessage);
            } catch (error) {
                console.error('Ошибка при обработке /start:', error);
                await this.bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
            }
        });

        // Команда /cycles - показать доступные циклы
        this.bot.onText(/\/cycles/, async(msg) => {
            const chatId = msg.chat.id;

            try {
                const cycles = await this.cycleService.getAvailableCycles();
                const keyboard = this.createCyclesKeyboard(cycles);

                await this.bot.sendMessage(chatId, 'Выберите тренировочный цикл:', {
                    reply_markup: {
                        inline_keyboard: keyboard
                    }
                });
            } catch (error) {
                console.error('Ошибка при получении циклов:', error);
                await this.bot.sendMessage(chatId, 'Не удалось загрузить циклы. Попробуйте позже.');
            }
        });

        // Команда /profile - настройка профиля
        this.bot.onText(/\/profile/, async(msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                const user = await this.userService.getUser(userId);
                const profileMessage = `
👤 Ваш профиль:
• Пол: ${user.gender || 'Не указан'}
• Вес: ${user.weight || 'Не указан'} кг
• Рост: ${user.height || 'Не указан'} см
• Уровень: ${user.level || 'Не указан'}

Для изменения данных используйте команды:
/setup_profile - Заполнить профиль в диалоговом режиме
/set_gender - Установить пол
/set_weight - Установить вес
/set_height - Установить рост
/set_level - Установить уровень подготовки
                `;

                await this.bot.sendMessage(chatId, profileMessage);
            } catch (error) {
                console.error('Ошибка при получении профиля:', error);
                await this.bot.sendMessage(chatId, 'Ошибка при загрузке профиля.');
            }
        });

        // Команда /setup_profile - диалоговое заполнение профиля
        this.bot.onText(/\/setup_profile/, async(msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                await this.dialogService.startProfileDialog(this.bot, chatId, userId);
            } catch (error) {
                console.error('Ошибка при запуске диалога профиля:', error);
                await this.bot.sendMessage(chatId, 'Произошла ошибка при настройке профиля.');
            }
        });

        // Команда /cancel - отмена диалога
        this.bot.onText(/\/cancel/, async(msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                if (this.dialogService.isUserInDialog(userId)) {
                    this.dialogService.cancelDialog(userId);
                    await this.bot.sendMessage(chatId, '❌ Диалог отменен. Используйте /setup_profile для повторного заполнения профиля.');
                } else {
                    await this.bot.sendMessage(chatId, 'Вы не находитесь в диалоге.');
                }
            } catch (error) {
                console.error('Ошибка при отмене диалога:', error);
                await this.bot.sendMessage(chatId, 'Произошла ошибка при отмене диалога.');
            }
        });

        // Обработка callback запросов
        this.bot.on('callback_query', async(callbackQuery) => {
            const chatId = callbackQuery.message.chat.id;
            const { data } = callbackQuery;
            const userId = callbackQuery.from.id;

            try {
                // Проверяем, находится ли пользователь в диалоге
                if (this.dialogService.isUserInDialog(userId) && data.startsWith('dialog_')) {
                    const handled = await this.dialogService.handleDialogResponse(this.bot, callbackQuery.message, data);
                    if (handled) {
                        await this.bot.answerCallbackQuery(callbackQuery.id);
                        return;
                    }
                }

                if (data.startsWith('cycle_')) {
                    const cycleId = data.replace('cycle_', '');
                    await this.handleCycleSelection(chatId, cycleId);
                } else if (data.startsWith('gender_')) {
                    const gender = data.replace('gender_', '');
                    await this.handleGenderSelection(chatId, userId, gender);
                }

                await this.bot.answerCallbackQuery(callbackQuery.id);
            } catch (error) {
                console.error('Ошибка при обработке callback:', error);
                await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' });
            }
        });

        // Обработка текстовых сообщений
        this.bot.on('message', async(msg) => {
            if (msg.text && !msg.text.startsWith('/')) {
                // Проверяем, находится ли пользователь в диалоге
                if (this.dialogService.isUserInDialog(msg.from.id)) {
                    const handled = await this.dialogService.handleDialogResponse(this.bot, msg);
                    if (handled) return;
                }

                await this.handleTextMessage(msg);
            }
        });
    }

    createCyclesKeyboard(cycles) {
        const keyboard = [];

        cycles.forEach(cycle => {
            keyboard.push([{
                text: `${cycle.name} (${cycle.direction})`,
                callback_data: `cycle_${cycle.id}`
            }]);
        });

        return keyboard;
    }

    async handleCycleSelection(chatId, cycleId) {
        try {
            const cycle = await this.cycleService.getCycleById(cycleId);
            const user = await this.userService.getUser(chatId);

            if (!user.weight || !user.height || !user.gender) {
                await this.bot.sendMessage(chatId,
                    'Для составления плана необходимо заполнить профиль. Используйте /profile');
                return;
            }

            const workoutPlan = await this.workoutService.generateWorkoutPlan(cycle, user);

            const planMessage = `
🏋️‍♂️ Ваш план тренировок:

${cycle.name}
Направление: ${cycle.direction}
Уровень: ${cycle.level}
Период: ${cycle.period}

${workoutPlan.description}

${workoutPlan.exercises.map((exercise, index) =>
        `${index + 1}. ${exercise.name} - ${exercise.sets} подходов x ${exercise.reps} повторений`
    ).join('\n')}
            `;

            await this.bot.sendMessage(chatId, planMessage);
        } catch (error) {
            console.error('Ошибка при выборе цикла:', error);
            await this.bot.sendMessage(chatId, 'Ошибка при составлении плана тренировок.');
        }
    }

    async handleGenderSelection(chatId, userId, gender) {
        try {
            await this.userService.updateUser(userId, { gender });
            await this.bot.sendMessage(chatId, `Пол установлен: ${gender === 'male' ? 'Мужской' : 'Женский'}`);
        } catch (error) {
            console.error('Ошибка при установке пола:', error);
            await this.bot.sendMessage(chatId, 'Ошибка при сохранении данных.');
        }
    }

    async handleTextMessage(msg) {
        const chatId = msg.chat.id;
        const { text } = msg;

        // Простая обработка текстовых команд
        if (text.includes('вес') || text.includes('weight')) {
            await this.bot.sendMessage(chatId, 'Для установки веса используйте команду /set_weight');
        } else if (text.includes('рост') || text.includes('height')) {
            await this.bot.sendMessage(chatId, 'Для установки роста используйте команду /set_height');
        }
    }

    setupWebhook() {
        this.app.post('/webhook', (req, res) => {
            this.bot.processUpdate(req.body);
            res.sendStatus(200);
        });
    }

    async start() {
        try {
            await this.database.init();
            console.log('База данных инициализирована');

            const port = process.env.PORT || 3000;
            this.app.listen(port, () => {
                console.log(`Сервер запущен на порту ${port}`);
            });

            console.log('Telegram бот запущен');
        } catch (error) {
            console.error('Ошибка при запуске бота:', error);
        }
    }
}

// Запуск бота
const bot = new TrainingBot();
bot.start();

module.exports = TrainingBot;

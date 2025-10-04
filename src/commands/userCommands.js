class UserCommands {
    constructor(bot, userService) {
        this.bot = bot;
        this.userService = userService;
        this.setupCommands();
    }

    setupCommands() {
        // Команда /set_gender
        this.bot.onText(/\/set_gender/, async(msg) => {
            const chatId = msg.chat.id;
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Мужской', callback_data: 'gender_male' },
                            { text: 'Женский', callback_data: 'gender_female' }
                        ]
                    ]
                }
            };

            await this.bot.sendMessage(chatId, 'Выберите ваш пол:', keyboard);
        });

        // Команда /set_weight
        this.bot.onText(/\/set_weight/, async(msg) => {
            const chatId = msg.chat.id;
            await this.bot.sendMessage(chatId,
                'Введите ваш вес в килограммах (например: 75.5):\n\n' +
                'Используйте формат: /set_weight 75.5'
            );
        });

        // Обработка команды /set_weight с параметром
        this.bot.onText(/\/set_weight (.+)/, async(msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const [, weight] = match;

            try {
                await this.userService.setWeight(userId, weight);
                await this.bot.sendMessage(chatId, `Вес установлен: ${weight} кг`);
            } catch (error) {
                await this.bot.sendMessage(chatId,
                    'Ошибка при установке веса. Убедитесь, что вы ввели число (например: 75.5)');
            }
        });

        // Команда /set_height
        this.bot.onText(/\/set_height/, async(msg) => {
            const chatId = msg.chat.id;
            await this.bot.sendMessage(chatId,
                'Введите ваш рост в сантиметрах (например: 180):\n\n' +
                'Используйте формат: /set_height 180'
            );
        });

        // Обработка команды /set_height с параметром
        this.bot.onText(/\/set_height (.+)/, async(msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const [, height] = match;

            try {
                await this.userService.setHeight(userId, height);
                await this.bot.sendMessage(chatId, `Рост установлен: ${height} см`);
            } catch (error) {
                await this.bot.sendMessage(chatId,
                    'Ошибка при установке роста. Убедитесь, что вы ввели число (например: 180)');
            }
        });

        // Команда /set_level
        this.bot.onText(/\/set_level/, async(msg) => {
            const chatId = msg.chat.id;
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Начальный', callback_data: 'level_Начальный' }],
                        [{ text: 'II разряд', callback_data: 'level_II разряд' }],
                        [{ text: 'I разряд', callback_data: 'level_I разряд' }],
                        [{ text: 'КМС', callback_data: 'level_КМС' }],
                        [{ text: 'МС', callback_data: 'level_МС' }],
                        [{ text: 'МСМК', callback_data: 'level_МСМК' }],
                        [{ text: 'Средний уровень', callback_data: 'level_Средний уровень' }]
                    ]
                }
            };

            await this.bot.sendMessage(chatId, 'Выберите ваш уровень подготовки:', keyboard);
        });

        // Команда /my_plans
        this.bot.onText(/\/my_plans/, async(msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                const user = await this.userService.getUser(userId);
                if (!user) {
                    await this.bot.sendMessage(chatId, 'Сначала зарегистрируйтесь командой /start');
                    return;
                }

                // Здесь можно добавить получение планов пользователя
                await this.bot.sendMessage(chatId,
                    'Функция просмотра ваших планов будет добавлена в следующей версии.\n\n' +
                    'Пока что используйте /cycles для создания нового плана тренировок.');
            } catch (error) {
                console.error('Ошибка при получении планов пользователя:', error);
                await this.bot.sendMessage(chatId, 'Ошибка при загрузке ваших планов.');
            }
        });

        // Команда /help
        this.bot.onText(/\/help/, async(msg) => {
            const chatId = msg.chat.id;
            const helpMessage = `
🤖 Помощь по боту тренировок

📋 Основные команды:
/start - Начать работу с ботом
/cycles - Просмотреть доступные циклы тренировок
/profile - Настроить профиль
/my_plans - Мои планы тренировок

⚙️ Настройка профиля:
/setup_profile - Заполнить профиль в диалоговом режиме (рекомендуется)
/set_gender - Установить пол
/set_weight - Установить вес
/set_height - Установить рост
/set_level - Установить уровень подготовки

🔄 Управление диалогом:
/cancel - Отменить текущий диалог

ℹ️ Дополнительно:
/help - Эта справка

💡 Совет: Для быстрого заполнения профиля используйте /setup_profile
            `;

            await this.bot.sendMessage(chatId, helpMessage);
        });

        // Обработка callback для уровня подготовки
        this.bot.on('callback_query', async(callbackQuery) => {
            const chatId = callbackQuery.message.chat.id;
            const { data } = callbackQuery;
            const userId = callbackQuery.from.id;

            if (data.startsWith('level_')) {
                const level = data.replace('level_', '');
                try {
                    await this.userService.setLevel(userId, level);
                    await this.bot.sendMessage(chatId, `Уровень подготовки установлен: ${level}`);
                } catch (error) {
                    await this.bot.sendMessage(chatId, 'Ошибка при установке уровня подготовки.');
                }
            }
        });
    }
}

module.exports = UserCommands;

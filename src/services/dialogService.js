class DialogService {
    constructor(userService) {
        this.userService = userService;
        this.userStates = new Map(); // Храним состояние диалога для каждого пользователя
    }

    // Состояния диалога
    static DIALOG_STATES = {
        NONE: 'none',
        WAITING_GENDER: 'waiting_gender',
        WAITING_WEIGHT: 'waiting_weight',
        WAITING_HEIGHT: 'waiting_height',
        WAITING_LEVEL: 'waiting_level',
        COMPLETED: 'completed'
    };

    async startProfileDialog(bot, chatId, userId) {
        try {
            // Проверяем текущий профиль пользователя
            const user = await this.userService.getUser(userId);
            
            if (user && user.gender && user.weight && user.height && user.level) {
                // Профиль уже заполнен
                await bot.sendMessage(chatId, 
                    '✅ Ваш профиль уже заполнен!\n\n' +
                    'Используйте /profile для просмотра или изменения данных.');
                return;
            }

            // Начинаем диалог
            this.userStates.set(userId, {
                state: DialogService.DIALOG_STATES.WAITING_GENDER,
                data: {}
            });

            await this.askGender(bot, chatId);
        } catch (error) {
            console.error('Ошибка при запуске диалога профиля:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка при настройке профиля.');
        }
    }

    async askGender(bot, chatId) {
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '👨 Мужской', callback_data: 'dialog_gender_male' },
                        { text: '👩 Женский', callback_data: 'dialog_gender_female' }
                    ]
                ]
            }
        };

        await bot.sendMessage(chatId, 
            '👤 Давайте заполним ваш профиль!\n\n' +
            '**Шаг 1 из 4:** Выберите ваш пол:', keyboard);
    }

    async askWeight(bot, chatId) {
        await bot.sendMessage(chatId, 
            '⚖️ **Шаг 2 из 4:** Введите ваш вес в килограммах\n\n' +
            'Например: 75 или 75.5');
    }

    async askHeight(bot, chatId) {
        await bot.sendMessage(chatId, 
            '📏 **Шаг 3 из 4:** Введите ваш рост в сантиметрах\n\n' +
            'Например: 180');
    }

    async askLevel(bot, chatId) {
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🟢 Начальный', callback_data: 'dialog_level_Начальный' }],
                    [{ text: '🟡 II разряд', callback_data: 'dialog_level_II разряд' }],
                    [{ text: '🟠 I разряд', callback_data: 'dialog_level_I разряд' }],
                    [{ text: '🔵 КМС', callback_data: 'dialog_level_КМС' }],
                    [{ text: '🟣 МС', callback_data: 'dialog_level_МС' }],
                    [{ text: '🟤 МСМК', callback_data: 'dialog_level_МСМК' }],
                    [{ text: '⚪ Средний уровень', callback_data: 'dialog_level_Средний уровень' }]
                ]
            }
        };

        await bot.sendMessage(chatId, 
            '🏆 **Шаг 4 из 4:** Выберите ваш уровень подготовки:', keyboard);
    }

    async handleDialogResponse(bot, msg, callbackData = null) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text;

        try {
            const userState = this.userStates.get(userId);
            if (!userState) {
                return false; // Пользователь не в диалоге
            }

            switch (userState.state) {
                case DialogService.DIALOG_STATES.WAITING_GENDER:
                    if (callbackData && callbackData.startsWith('dialog_gender_')) {
                        const gender = callbackData.replace('dialog_gender_', '');
                        await this.userService.setGender(userId, gender);
                        userState.data.gender = gender;
                        userState.state = DialogService.DIALOG_STATES.WAITING_WEIGHT;
                        await this.askWeight(bot, chatId);
                        return true;
                    }
                    break;

                case DialogService.DIALOG_STATES.WAITING_WEIGHT:
                    if (text && !isNaN(parseFloat(text))) {
                        const weight = parseFloat(text);
                        if (weight > 0 && weight < 500) {
                            await this.userService.setWeight(userId, weight);
                            userState.data.weight = weight;
                            userState.state = DialogService.DIALOG_STATES.WAITING_HEIGHT;
                            await this.askHeight(bot, chatId);
                            return true;
                        } else {
                            await bot.sendMessage(chatId, 
                                '❌ Неверный вес! Введите число от 1 до 500 кг.\n\n' +
                                'Например: 75');
                        }
                    } else {
                        await bot.sendMessage(chatId, 
                            '❌ Введите вес числом!\n\n' +
                            'Например: 75 или 75.5');
                        return true;
                    }
                    break;

                case DialogService.DIALOG_STATES.WAITING_HEIGHT:
                    if (text && !isNaN(parseFloat(text))) {
                        const height = parseFloat(text);
                        if (height > 0 && height < 300) {
                            await this.userService.setHeight(userId, height);
                            userState.data.height = height;
                            userState.state = DialogService.DIALOG_STATES.WAITING_LEVEL;
                            await this.askLevel(bot, chatId);
                            return true;
                        } else {
                            await bot.sendMessage(chatId, 
                                '❌ Неверный рост! Введите число от 1 до 300 см.\n\n' +
                                'Например: 180');
                        }
                    } else {
                        await bot.sendMessage(chatId, 
                            '❌ Введите рост числом!\n\n' +
                            'Например: 180');
                        return true;
                    }
                    break;

                case DialogService.DIALOG_STATES.WAITING_LEVEL:
                    if (callbackData && callbackData.startsWith('dialog_level_')) {
                        const level = callbackData.replace('dialog_level_', '');
                        await this.userService.setLevel(userId, level);
                        userState.data.level = level;
                        
                        // Завершаем диалог
                        await this.completeProfileDialog(bot, chatId, userId, userState.data);
                        this.userStates.delete(userId);
                        return true;
                    }
                    break;
            }

            return false; // Ответ не обработан
        } catch (error) {
            console.error('Ошибка при обработке ответа диалога:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте еще раз.');
            return false;
        }
    }

    async completeProfileDialog(bot, chatId, userId, profileData) {
        try {
            const user = await this.userService.getUser(userId);
            const bmi = this.calculateBMI(profileData.weight, profileData.height);
            const bmiCategory = this.getBMICategory(bmi);

            const completionMessage = `
🎉 **Профиль успешно заполнен!**

👤 **Ваши данные:**
• Пол: ${profileData.gender === 'male' ? 'Мужской' : 'Женский'}
• Вес: ${profileData.weight} кг
• Рост: ${profileData.height} см
• Уровень: ${profileData.level}
• ИМТ: ${bmi} (${bmiCategory})

✅ Теперь вы можете:
• Выбрать цикл тренировок: /cycles
• Просмотреть профиль: /profile
• Получить справку: /help
            `;

            await bot.sendMessage(chatId, completionMessage);
        } catch (error) {
            console.error('Ошибка при завершении диалога:', error);
            await bot.sendMessage(chatId, 'Профиль заполнен, но произошла ошибка при отображении данных.');
        }
    }

    calculateBMI(weight, height) {
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    getBMICategory(bmi) {
        if (bmi < 18.5) return 'Недостаточный вес';
        if (bmi < 25) return 'Нормальный вес';
        if (bmi < 30) return 'Избыточный вес';
        return 'Ожирение';
    }

    isUserInDialog(userId) {
        return this.userStates.has(userId);
    }

    cancelDialog(userId) {
        this.userStates.delete(userId);
    }

    getDialogState(userId) {
        return this.userStates.get(userId);
    }
}

module.exports = DialogService;

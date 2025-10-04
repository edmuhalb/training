class TelegramBotMock {
    constructor() {
        this.sentMessages = [];
        this.callbackQueries = [];
        this.onTextHandlers = new Map();
        this.onHandlers = new Map();
        this.isPolling = false;
    }

    // Мок методы для Telegram Bot API
    sendMessage(chatId, text, options = {}) {
        const message = {
            chatId,
            text,
            options,
            timestamp: new Date()
        };
        this.sentMessages.push(message);
        return Promise.resolve(message);
    }

    answerCallbackQuery(callbackQueryId, options = {}) {
        return Promise.resolve({ ok: true });
    }

    // Регистрация обработчиков
    onText(regex, handler) {
        this.onTextHandlers.set(regex, handler);
    }

    on(event, handler) {
        if (!this.onHandlers.has(event)) {
            this.onHandlers.set(event, []);
        }
        this.onHandlers.get(event).push(handler);
    }

    // Методы для тестирования
    simulateMessage(message) {
        const handlers = this.onTextHandlers;
        for (const [regex, handler] of handlers) {
            if (regex.test(message.text)) {
                return handler(message);
            }
        }
        return Promise.resolve();
    }

    simulateCallbackQuery(callbackQuery) {
        const handlers = this.onHandlers.get('callback_query') || [];
        return Promise.all(handlers.map(handler => handler(callbackQuery)));
    }

    // Получение отправленных сообщений
    getLastMessage() {
        return this.sentMessages[this.sentMessages.length - 1];
    }

    getMessagesByChatId(chatId) {
        return this.sentMessages.filter(msg => msg.chatId === chatId);
    }

    clearMessages() {
        this.sentMessages = [];
    }

    // Проверка отправленных сообщений
    hasMessageContaining(text) {
        return this.sentMessages.some(msg => msg.text.includes(text));
    }

    hasMessageWithKeyboard() {
        return this.sentMessages.some(msg => msg.options && msg.options.reply_markup);
    }

    getMessagesCount() {
        return this.sentMessages.length;
    }
}

module.exports = TelegramBotMock;


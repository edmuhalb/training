class MaxWeightService {
    constructor(database) {
        this.db = database;
    }

    // Сохранить или обновить ПМ для упражнения
    async saveMaxWeight(userId, exerciseName, maxWeight) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT OR REPLACE INTO user_max_weights 
                    (user_id, exercise_name, max_weight, updated_at) 
                    VALUES (?, ?, ?, datetime('now'))`,
                    [userId, exerciseName, maxWeight],
                    function(err) {
                        if (err) {
                            console.error('Ошибка при сохранении ПМ:', err);
                            reject(err);
                        } else {
                            resolve({
                                id: this.lastID,
                                userId,
                                exerciseName,
                                maxWeight
                            });
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Ошибка при сохранении ПМ:', error);
            throw error;
        }
    }

    // Получить все ПМ пользователя
    async getUserMaxWeights(userId) {
        try {
            return new Promise((resolve, reject) => {
                this.db.all(
                    'SELECT * FROM user_max_weights WHERE user_id = ? ORDER BY exercise_name',
                    [userId],
                    (err, weights) => {
                        if (err) {
                            console.error('Ошибка при получении ПМ:', err);
                            reject(err);
                        } else {
                            const result = weights.map(weight => ({
                                id: weight.id,
                                exerciseName: weight.exercise_name,
                                maxWeight: weight.max_weight,
                                updatedAt: weight.updated_at
                            }));
                            resolve(result);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Ошибка при получении ПМ:', error);
            throw error;
        }
    }

    // Получить ПМ для конкретного упражнения
    async getMaxWeight(userId, exerciseName) {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(
                    'SELECT * FROM user_max_weights WHERE user_id = ? AND exercise_name = ?',
                    [userId, exerciseName],
                    (err, weight) => {
                        if (err) {
                            console.error('Ошибка при получении ПМ:', err);
                            reject(err);
                        } else if (weight) {
                            resolve({
                                id: weight.id,
                                exerciseName: weight.exercise_name,
                                maxWeight: weight.max_weight,
                                updatedAt: weight.updated_at
                            });
                        } else {
                            resolve(null);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Ошибка при получении ПМ:', error);
            throw error;
        }
    }

    // Рассчитать вес на основе ПМ и процента
    calculateWeightFromMax(maxWeight, percentage) {
        if (!maxWeight || !percentage) return 0;

        // Убираем символ % если есть
        const cleanPercentage = percentage.toString().replace('%', '');
        const percent = parseFloat(cleanPercentage) / 100;

        return Math.round(maxWeight * percent * 10) / 10; // Округляем до 0.1 кг
    }

    // Рассчитать ПМ на основе веса и повторений (формула Эпли)
    calculateMaxFromWeightAndReps(weight, reps) {
        if (!weight || !reps || reps <= 0) return 0;

        // Формула Эпли: ПМ = вес * (1 + reps/30)
        const maxWeight = weight * (1 + reps / 30);
        return Math.round(maxWeight * 10) / 10; // Округляем до 0.1 кг
    }

    // Получить рекомендуемые проценты для упражнения
    getRecommendedPercentages(exerciseName, level) {
        const basePercentages = {
            Приседания: [85, 80, 75, 70],
            'Жим лежа': [85, 80, 75, 70],
            'Становая тяга': [85, 80, 75, 70],
            'Жим стоя': [80, 75, 70, 65],
            Подтягивания: [100, 90, 80, 70] // Для подтягиваний проценты от собственного веса
        };

        const percentages = basePercentages[exerciseName] || [80, 75, 70, 65];

        // Корректируем в зависимости от уровня
        if (level === 'Начальный') {
            return percentages.map(p => Math.max(60, p - 10));
        } else if (level === 'МС' || level === 'МСМК') {
            return percentages.map(p => Math.min(95, p + 5));
        }

        return percentages;
    }
}

module.exports = MaxWeightService;

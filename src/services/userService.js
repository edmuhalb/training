class UserService {
    constructor(database) {
        this.db = database;
    }

    async createOrUpdateUser(userData) {
        const { id, username, firstName, lastName, gender, weight, height, level } = userData;

        try {
            // Проверяем, существует ли пользователь
            const existingUser = await this.db.get(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );

            if (existingUser) {
                // Обновляем существующего пользователя
                await this.db.run(
                    'UPDATE users SET username = ?, first_name = ?, last_name = ?, gender = ?, weight = ?, height = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [username, firstName, lastName, gender, weight, height, level, id]
                );
            } else {
                // Создаем нового пользователя
                await this.db.run(
                    'INSERT INTO users (id, username, first_name, last_name, gender, weight, height, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, username, firstName, lastName, gender, weight, height, level]
                );
            }

            return await this.getUser(id);
        } catch (error) {
            console.error('Ошибка при создании/обновлении пользователя:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const user = await this.db.get(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            return user;
        } catch (error) {
            console.error('Ошибка при получении пользователя:', error);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && updateData[key] !== null) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('Нет данных для обновления');
            }

            values.push(userId);

            await this.db.run(
                `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values
            );

            return await this.getUser(userId);
        } catch (error) {
            console.error('Ошибка при обновлении пользователя:', error);
            throw error;
        }
    }

    async setGender(userId, gender) {
        return await this.updateUser(userId, { gender });
    }

    async setWeight(userId, weight) {
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            throw new Error('Неверный формат веса');
        }
        return await this.updateUser(userId, { weight: weightNum });
    }

    async setHeight(userId, height) {
        const heightNum = parseFloat(height);
        if (isNaN(heightNum) || heightNum <= 0) {
            throw new Error('Неверный формат роста');
        }
        return await this.updateUser(userId, { height: heightNum });
    }

    async setLevel(userId, level) {
        const validLevels = [
            'Начальный',
            'II разряд',
            'I разряд',
            'КМС',
            'МС',
            'МСМК',
            'Средний уровень'
        ];

        if (!validLevels.includes(level)) {
            throw new Error('Неверный уровень подготовки');
        }

        return await this.updateUser(userId, { level });
    }

    async getUserProfile(userId) {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                throw new Error('Пользователь не найден');
            }

            return {
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                gender: user.gender,
                weight: user.weight,
                height: user.height,
                level: user.level,
                isProfileComplete: !!(user.gender && user.weight && user.height && user.level)
            };
        } catch (error) {
            console.error('Ошибка при получении профиля пользователя:', error);
            throw error;
        }
    }

    async getUsersByLevel(level) {
        try {
            const users = await this.db.query(
                'SELECT * FROM users WHERE level = ?',
                [level]
            );
            return users;
        } catch (error) {
            console.error('Ошибка при получении пользователей по уровню:', error);
            throw error;
        }
    }

    async getUsersStats() {
        try {
            const stats = await this.db.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN gender IS NOT NULL THEN 1 END) as users_with_gender,
                    COUNT(CASE WHEN weight IS NOT NULL THEN 1 END) as users_with_weight,
                    COUNT(CASE WHEN height IS NOT NULL THEN 1 END) as users_with_height,
                    COUNT(CASE WHEN level IS NOT NULL THEN 1 END) as users_with_level,
                    COUNT(CASE WHEN gender IS NOT NULL AND weight IS NOT NULL AND height IS NOT NULL AND level IS NOT NULL THEN 1 END) as complete_profiles
                FROM users
            `);

            return stats[0];
        } catch (error) {
            console.error('Ошибка при получении статистики пользователей:', error);
            throw error;
        }
    }

    validateUserData(userData) {
        const errors = [];

        if (userData.gender && !['male', 'female'].includes(userData.gender)) {
            errors.push('Пол должен быть "male" или "female"');
        }

        if (userData.weight && (isNaN(userData.weight) || userData.weight <= 0)) {
            errors.push('Вес должен быть положительным числом');
        }

        if (userData.height && (isNaN(userData.height) || userData.height <= 0)) {
            errors.push('Рост должен быть положительным числом');
        }

        if (userData.level) {
            const validLevels = [
                'Начальный',
                'II разряд',
                'I разряд',
                'КМС',
                'МС',
                'МСМК',
                'Средний уровень'
            ];

            if (!validLevels.includes(userData.level)) {
                errors.push('Неверный уровень подготовки');
            }
        }

        return errors;
    }

    calculateBMI(weight, height) {
        if (!weight || !height) return null;
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    getBMICategory(bmi) {
        if (!bmi) return null;

        if (bmi < 18.5) return 'Недостаточный вес';
        if (bmi < 25) return 'Нормальный вес';
        if (bmi < 30) return 'Избыточный вес';
        return 'Ожирение';
    }
}

module.exports = UserService;


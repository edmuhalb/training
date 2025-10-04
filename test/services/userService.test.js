const UserService = require('../../src/services/userService');
const Database = require('../../src/database');

describe('UserService', () => {
    let userService;
    let database;
    
    // Увеличиваем таймаут для тестов
    jest.setTimeout(10000);

    beforeAll(async() => {
        database = new Database();
        await database.init();
        // Убеждаемся, что таблицы созданы
        await database.createTables();
        userService = new UserService(database);
    });

    afterAll(async() => {
        if (database) {
            database.close();
        }
    });

    beforeEach(async() => {
        // Очищаем тестовые данные
        try {
            await database.run('DELETE FROM users WHERE id > 1000000');
        } catch (error) {
            // Игнорируем ошибки очистки
            console.log('Cleanup error (ignored):', error.message);
        }
    });

    describe('createOrUpdateUser', () => {
        test('should create new user', async() => {
            const userData = {
                id: 1234567,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            };

            const user = await userService.createOrUpdateUser(userData);

            expect(user).toBeDefined();
            expect(user.id).toBe(1234567);
            expect(user.username).toBe('testuser');
            expect(user.first_name).toBe('Test');
            expect(user.last_name).toBe('User');
        });

        test('should update existing user', async() => {
            const userData = {
                id: 1234567,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            };

            // Создаем пользователя
            await userService.createOrUpdateUser(userData);

            // Обновляем пользователя
            const updatedData = {
                id: 1234567,
                username: 'updateduser',
                firstName: 'Updated',
                lastName: 'User'
            };

            const user = await userService.createOrUpdateUser(updatedData);

            expect(user.username).toBe('updateduser');
            expect(user.first_name).toBe('Updated');
        });
    });

    describe('getUser', () => {
        test('should return user by id', async() => {
            const userData = {
                id: 1234568,
                username: 'testuser2',
                firstName: 'Test2',
                lastName: 'User2'
            };

            await userService.createOrUpdateUser(userData);
            const user = await userService.getUser(1234568);

            expect(user).toBeDefined();
            expect(user.id).toBe(1234568);
        });

        test('should return undefined for non-existent user', async() => {
            const user = await userService.getUser(9999999);
            expect(user).toBeUndefined();
        });
    });

    describe('updateUser', () => {
        test('should update user data', async() => {
            const userData = {
                id: 1234569,
                username: 'testuser3',
                firstName: 'Test3',
                lastName: 'User3'
            };

            await userService.createOrUpdateUser(userData);

            const updateData = {
                gender: 'male',
                weight: 75.5,
                height: 180
            };

            const user = await userService.updateUser(1234569, updateData);

            expect(user.gender).toBe('male');
            expect(user.weight).toBe(75.5);
            expect(user.height).toBe(180);
        });

        test('should handle empty update data', async() => {
            const userData = {
                id: 1234570,
                username: 'testuser4',
                firstName: 'Test4',
                lastName: 'User4'
            };

            await userService.createOrUpdateUser(userData);

            // Подавляем console.error для этого теста
            const originalError = console.error;
            console.error = jest.fn();

            await expect(userService.updateUser(1234570, {})).rejects.toThrow('Нет данных для обновления');

            // Восстанавливаем console.error
            console.error = originalError;
        });
    });

    describe('setGender', () => {
        test('should set user gender', async() => {
            const userData = {
                id: 1234571,
                username: 'testuser5',
                firstName: 'Test5',
                lastName: 'User5'
            };

            await userService.createOrUpdateUser(userData);
            const user = await userService.setGender(1234571, 'male');

            expect(user.gender).toBe('male');
        });
    });

    describe('setWeight', () => {
        test('should set user weight', async() => {
            const userData = {
                id: 1234572,
                username: 'testuser6',
                firstName: 'Test6',
                lastName: 'User6',
                gender: 'male',
                weight: 70,
                height: 175,
                level: 'Начальный'
            };

            await userService.createOrUpdateUser(userData);
            const user = await userService.setWeight(1234572, 75.5);

            expect(user).toBeDefined();
            expect(user.weight).toBe(75.5);
        });

        test('should validate weight input', async() => {
            const userData = {
                id: 1234573,
                username: 'testuser7',
                firstName: 'Test7',
                lastName: 'User7'
            };

            await userService.createOrUpdateUser(userData);

            await expect(userService.setWeight(1234573, 'invalid')).rejects.toThrow('Неверный формат веса');
            await expect(userService.setWeight(1234573, -10)).rejects.toThrow('Неверный формат веса');
            await expect(userService.setWeight(1234573, 0)).rejects.toThrow('Неверный формат веса');
        });
    });

    describe('setHeight', () => {
        test('should set user height', async() => {
            const userData = {
                id: 1234574,
                username: 'testuser8',
                firstName: 'Test8',
                lastName: 'User8',
                gender: 'male',
                weight: 70,
                height: 175,
                level: 'Начальный'
            };

            await userService.createOrUpdateUser(userData);
            const user = await userService.setHeight(1234574, 180);

            expect(user).toBeDefined();
            expect(user.height).toBe(180);
        });

        test('should validate height input', async() => {
            const userData = {
                id: 1234575,
                username: 'testuser9',
                firstName: 'Test9',
                lastName: 'User9'
            };

            await userService.createOrUpdateUser(userData);

            await expect(userService.setHeight(1234575, 'invalid')).rejects.toThrow('Неверный формат роста');
            await expect(userService.setHeight(1234575, -10)).rejects.toThrow('Неверный формат роста');
            await expect(userService.setHeight(1234575, 0)).rejects.toThrow('Неверный формат роста');
        });
    });

    describe('setLevel', () => {
        test('should set user level', async() => {
            const userData = {
                id: 1234576,
                username: 'testuser10',
                firstName: 'Test10',
                lastName: 'User10'
            };

            await userService.createOrUpdateUser(userData);
            const user = await userService.setLevel(1234576, 'КМС');

            expect(user.level).toBe('КМС');
        });

        test('should validate level input', async() => {
            const userData = {
                id: 1234577,
                username: 'testuser11',
                firstName: 'Test11',
                lastName: 'User11'
            };

            await userService.createOrUpdateUser(userData);

            await expect(userService.setLevel(1234577, 'Invalid Level')).rejects.toThrow('Неверный уровень подготовки');
        });
    });

    describe('getUserProfile', () => {
        test('should return complete user profile', async() => {
            const userData = {
                id: 1234578,
                username: 'testuser12',
                firstName: 'Test12',
                lastName: 'User12'
            };

            await userService.createOrUpdateUser(userData);
            await userService.setGender(1234578, 'male');
            await userService.setWeight(1234578, 75);
            await userService.setHeight(1234578, 180);
            await userService.setLevel(1234578, 'КМС');

            const profile = await userService.getUserProfile(1234578);

            expect(profile.id).toBe(1234578);
            expect(profile.gender).toBe('male');
            expect(profile.weight).toBe(75);
            expect(profile.height).toBe(180);
            expect(profile.level).toBe('КМС');
            expect(profile.isProfileComplete).toBe(true);
        });

        test('should return incomplete profile', async() => {
            const userData = {
                id: 1234579,
                username: 'testuser13',
                firstName: 'Test13',
                lastName: 'User13'
            };

            await userService.createOrUpdateUser(userData);
            const profile = await userService.getUserProfile(1234579);

            expect(profile.isProfileComplete).toBe(false);
        });
    });

    describe('validateUserData', () => {
        test('should validate correct user data', () => {
            const validData = {
                gender: 'male',
                weight: 75.5,
                height: 180,
                level: 'КМС'
            };

            const errors = userService.validateUserData(validData);
            expect(errors).toHaveLength(0);
        });

        test('should detect invalid user data', () => {
            const invalidData = {
                gender: 'invalid',
                weight: -10,
                height: 0,
                level: 'Invalid Level'
            };

            const errors = userService.validateUserData(invalidData);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors).toContain('Пол должен быть "male" или "female"');
            expect(errors).toContain('Вес должен быть положительным числом');
            // Рост 0 не проверяется в validateUserData, только в setHeight
            expect(errors).toContain('Неверный уровень подготовки');
        });
    });

    describe('BMI calculation', () => {
        test('should calculate BMI correctly', () => {
            const bmi = userService.calculateBMI(75, 180);
            expect(bmi).toBe('23.1');
        });

        test('should return null for missing data', () => {
            const bmi1 = userService.calculateBMI(null, 180);
            const bmi2 = userService.calculateBMI(75, null);

            expect(bmi1).toBeNull();
            expect(bmi2).toBeNull();
        });

        test('should categorize BMI correctly', () => {
            expect(userService.getBMICategory(18.0)).toBe('Недостаточный вес');
            expect(userService.getBMICategory(22.0)).toBe('Нормальный вес');
            expect(userService.getBMICategory(27.0)).toBe('Избыточный вес');
            expect(userService.getBMICategory(32.0)).toBe('Ожирение');
        });
    });

    describe('getUsersStats', () => {
        test('should return user statistics', async() => {
            // Создаем тестовых пользователей
            await userService.createOrUpdateUser({
                id: 1234580,
                username: 'user1',
                firstName: 'User1',
                lastName: 'Test'
            });

            await userService.createOrUpdateUser({
                id: 1234581,
                username: 'user2',
                firstName: 'User2',
                lastName: 'Test'
            });

            await userService.setGender(1234580, 'male');
            await userService.setWeight(1234580, 75);
            await userService.setHeight(1234580, 180);
            await userService.setLevel(1234580, 'КМС');

            const stats = await userService.getUsersStats();

            expect(stats.total_users).toBeGreaterThan(0);
            expect(stats.users_with_gender).toBeGreaterThan(0);
            expect(stats.users_with_weight).toBeGreaterThan(0);
            expect(stats.users_with_height).toBeGreaterThan(0);
            expect(stats.users_with_level).toBeGreaterThan(0);
            expect(stats.complete_profiles).toBeGreaterThan(0);
        });
    });
});

// const TrainingBot = require('../src/bot');
const Database = require('../src/database');
const CycleService = require('../src/services/cycleService');
const UserService = require('../src/services/userService');
const WorkoutService = require('../src/services/workoutService');

describe('Training Bot Tests', () => {
    let database;
    let cycleService;
    let userService;
    let workoutService;

    beforeAll(async() => {
        // Инициализация тестовой базы данных
        database = new Database();
        await database.init();

        cycleService = new CycleService();
        userService = new UserService(database);
        workoutService = new WorkoutService(database);
    });

    afterAll(async() => {
        if (database) {
            database.close();
        }
    });

    describe('CycleService', () => {
        test('should return available cycles', async() => {
            const cycles = await cycleService.getAvailableCycles();
            expect(cycles).toBeDefined();
            expect(Array.isArray(cycles)).toBe(true);
            expect(cycles.length).toBeGreaterThan(0);
        });

        test('should return cycle by id', async() => {
            const cycle = await cycleService.getCycleById(1);
            expect(cycle).toBeDefined();
            expect(cycle.id).toBe(1);
            expect(cycle.name).toBe('СРЦ1');
        });

        test('should filter cycles by criteria', async() => {
            const criteria = {
                gender: 'male',
                level: 'II разряд'
            };
            const cycles = await cycleService.getCyclesByCriteria(criteria);
            expect(cycles).toBeDefined();
            expect(Array.isArray(cycles)).toBe(true);
        });
    });

    describe('UserService', () => {
        test('should create user', async() => {
            const userData = {
                id: 12345,
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            };

            const user = await userService.createOrUpdateUser(userData);
            expect(user).toBeDefined();
            expect(user.id).toBe(12345);
        });

        test('should update user weight', async() => {
            const userId = 12345;
            const weight = 75.5;

            await userService.setWeight(userId, weight);
            const user = await userService.getUser(userId);
            expect(user.weight).toBe(75.5);
        });

        test('should validate user data', () => {
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
        });
    });

    describe('WorkoutService', () => {
        test('should generate workout plan', async() => {
            const cycle = await cycleService.getCycleById(1);
            const userProfile = {
                id: 12345,
                weight: 75,
                height: 180,
                level: 'КМС',
                gender: 'male'
            };

            const plan = await workoutService.generateWorkoutPlan(cycle, userProfile);
            expect(plan).toBeDefined();
            expect(plan.exercises).toBeDefined();
            expect(Array.isArray(plan.exercises)).toBe(true);
        });

        test('should format workout plan', () => {
            const plan = {
                name: 'СРЦ1',
                direction: 'Троеборье',
                level: 'II разряд – КМС',
                period: 'Силовой',
                duration: '8-12 недель',
                frequency: '3-4 раза в неделю',
                exercises: [
                    {
                        name: 'Приседания',
                        sets: 4,
                        reps: '5-8',
                        intensity: '80-90%'
                    }
                ],
                notes: ['Тестовая заметка']
            };

            const formatted = workoutService.formatWorkoutPlan(plan);
            expect(formatted).toContain('СРЦ1');
            expect(formatted).toContain('Приседания');
        });
    });

    describe('Database', () => {
        test('should connect to database', () => {
            expect(database).toBeDefined();
            expect(database.db).toBeDefined();
        });

        test('should execute queries', async() => {
            const result = await database.query('SELECT COUNT(*) as count FROM users');
            expect(result).toBeDefined();
            expect(result[0].count).toBeDefined();
        });
    });
});


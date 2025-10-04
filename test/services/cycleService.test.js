const CycleService = require('../../src/services/cycleService');

describe('CycleService', () => {
    let cycleService;

    beforeEach(() => {
        cycleService = new CycleService();
    });

    describe('getAvailableCycles', () => {
        test('should return array of cycles', async() => {
            const cycles = await cycleService.getAvailableCycles();

            expect(Array.isArray(cycles)).toBe(true);
            expect(cycles.length).toBeGreaterThan(0);

            // Проверяем структуру цикла
            const [cycle] = cycles;
            expect(cycle).toHaveProperty('id');
            expect(cycle).toHaveProperty('name');
            expect(cycle).toHaveProperty('direction');
            expect(cycle).toHaveProperty('level');
            expect(cycle).toHaveProperty('period');
        });

        test('should return cycles with correct structure', async() => {
            const cycles = await cycleService.getAvailableCycles();

            cycles.forEach(cycle => {
                expect(typeof cycle.id).toBe('number');
                expect(typeof cycle.name).toBe('string');
                expect(typeof cycle.direction).toBe('string');
                expect(typeof cycle.level).toBe('string');
                expect(typeof cycle.period).toBe('string');
            });
        });
    });

    describe('getCycleById', () => {
        test('should return cycle by valid id', async() => {
            const cycle = await cycleService.getCycleById(1);

            expect(cycle).toBeDefined();
            expect(cycle.id).toBe(1);
            expect(cycle.name).toBe('СРЦ1');
            expect(cycle.direction).toBe('Троеборье');
        });

        test('should return undefined for invalid id', async() => {
            const cycle = await cycleService.getCycleById(999);
            expect(cycle).toBeUndefined();
        });
    });

    describe('getCyclesByCriteria', () => {
        test('should filter cycles by gender', async() => {
            const criteria = { gender: 'male' };
            const cycles = await cycleService.getCyclesByCriteria(criteria);

            expect(cycles.length).toBeGreaterThan(0);
            cycles.forEach(cycle => {
                expect(cycle.gender).toBe('male');
            });
        });

        test('should filter cycles by level', async() => {
            const criteria = { level: 'КМС' };
            const cycles = await cycleService.getCyclesByCriteria(criteria);

            expect(cycles.length).toBeGreaterThan(0);
            cycles.forEach(cycle => {
                expect(cycle.level).toContain('КМС');
            });
        });

        test('should filter cycles by direction', async() => {
            const criteria = { direction: 'Жим лежа' };
            const cycles = await cycleService.getCyclesByCriteria(criteria);

            expect(cycles.length).toBeGreaterThan(0);
            cycles.forEach(cycle => {
                expect(cycle.direction).toBe('Жим лежа');
            });
        });

        test('should filter cycles by weight', async() => {
            const criteria = { weight: 85 };
            const cycles = await cycleService.getCyclesByCriteria(criteria);

            expect(cycles.length).toBeGreaterThan(0);
            cycles.forEach(cycle => {
                if (cycle.weightMin) {
                    expect(criteria.weight).toBeGreaterThanOrEqual(cycle.weightMin);
                }
            });
        });

        test('should return empty array for no matches', async() => {
            const criteria = { gender: 'female' };
            const cycles = await cycleService.getCyclesByCriteria(criteria);

            expect(cycles.length).toBe(0);
        });
    });

    describe('getCycleDescription', () => {
        test('should return formatted description', () => {
            const cycle = {
                name: 'СРЦ1',
                direction: 'Троеборье',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weightMin: 80,
                additionalInfo: 'Тестовая информация'
            };

            const description = cycleService.getCycleDescription(cycle);

            expect(description).toContain('СРЦ1');
            expect(description).toContain('Троеборье');
            expect(description).toContain('II разряд – КМС');
            expect(description).toContain('Силовой');
            expect(description).toContain('80+ кг');
            expect(description).toContain('Тестовая информация');
        });
    });

    describe('getWorkoutPlan', () => {
        test('should generate workout plan for cycle and user', () => {
            const cycle = {
                id: 1,
                name: 'СРЦ1',
                direction: 'Троеборье',
                level: 'II разряд – КМС',
                period: 'Силовой',
                exercises: [
                    { name: 'Приседания', sets: 4, reps: '5-8', intensity: '80-90%' }
                ]
            };

            const userProfile = {
                id: 12345,
                weight: 75,
                height: 180,
                level: 'КМС',
                gender: 'male'
            };

            const plan = cycleService.getWorkoutPlan(cycle, userProfile);

            expect(plan).toHaveProperty('name', 'СРЦ1');
            expect(plan).toHaveProperty('direction', 'Троеборье');
            expect(plan).toHaveProperty('level', 'II разряд – КМС');
            expect(plan).toHaveProperty('period', 'Силовой');
            expect(plan).toHaveProperty('duration');
            expect(plan).toHaveProperty('frequency');
            expect(plan).toHaveProperty('exercises');
            expect(plan).toHaveProperty('notes');
            expect(Array.isArray(plan.exercises)).toBe(true);
            expect(Array.isArray(plan.notes)).toBe(true);
        });
    });

    describe('getCycleDuration', () => {
        test('should return correct duration for different periods', () => {
            const cycle1 = { period: 'Силовой' };
            const cycle2 = { period: 'Выносливость' };
            const cycle3 = { period: 'Выход на пик' };
            const cycle4 = { period: 'Массонабор' };

            expect(cycleService.getCycleDuration(cycle1)).toBe('8-12 недель');
            expect(cycleService.getCycleDuration(cycle2)).toBe('6-10 недель');
            expect(cycleService.getCycleDuration(cycle3)).toBe('4-6 недель');
            expect(cycleService.getCycleDuration(cycle4)).toBe('12-16 недель');
        });
    });

    describe('getTrainingFrequency', () => {
        test('should return correct frequency for different directions', () => {
            const cycle1 = { direction: 'Троеборье' };
            const cycle2 = { direction: 'Жим лежа' };
            const cycle3 = { direction: 'Армрестлинг' };
            const cycle4 = { direction: 'Бодибилдинг' };

            expect(cycleService.getTrainingFrequency(cycle1)).toBe('3-4 раза в неделю');
            expect(cycleService.getTrainingFrequency(cycle2)).toBe('2-3 раза в неделю');
            expect(cycleService.getTrainingFrequency(cycle3)).toBe('3-4 раза в неделю');
            expect(cycleService.getTrainingFrequency(cycle4)).toBe('4-6 раз в неделю');
        });
    });

    describe('getCycleNotes', () => {
        test('should generate notes based on cycle and user profile', () => {
            const cycle = {
                additionalInfo: 'Тестовая информация',
                period: 'Массонабор'
            };

            const userProfile = {
                weight: 65,
                height: 180,
                level: 'Начальный'
            };

            const notes = cycleService.getCycleNotes(cycle, userProfile);

            expect(Array.isArray(notes)).toBe(true);
            expect(notes.length).toBeGreaterThan(0);
            expect(notes).toContain('Тестовая информация');
            expect(notes).toContain('🍽️ Особое внимание к питанию и режиму сна');
        });

        test('should generate weight recommendation for light users', () => {
            const cycle = { weightMin: 80 };
            const userProfile = { weight: 65, height: 180 };

            const notes = cycleService.getCycleNotes(cycle, userProfile);

            expect(notes).toContain('⚠️ Рекомендуется набрать вес до 80 кг для оптимальных результатов');
        });

        test('should generate peak preparation notes', () => {
            const cycle = { period: 'Выход на пик' };
            const userProfile = { level: 'МС' };

            const notes = cycleService.getCycleNotes(cycle, userProfile);

            expect(notes).toContain('🏆 Период подготовки к соревнованиям - максимальная интенсивность');
        });
    });
});

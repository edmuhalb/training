class CycleService {
    constructor(database) {
        this.db = database;
        this.cycles = [
            {
                id: 1,
                name: 'СРЦ1',
                direction: 'Троеборье',
                gender: 'male',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: '',
                exercises: [
                    { name: 'Приседания', sets: 4, reps: '5-8', intensity: '80-90%' },
                    { name: 'Жим лежа', sets: 4, reps: '5-8', intensity: '80-90%' },
                    { name: 'Становая тяга', sets: 3, reps: '5-8', intensity: '80-90%' },
                    { name: 'Жим стоя', sets: 3, reps: '6-10', intensity: '70-80%' },
                    { name: 'Подтягивания', sets: 3, reps: '6-12', intensity: 'Собственный вес' }
                ]
            },
            {
                id: 2,
                name: 'СРЦ2',
                direction: 'Троеборье',
                gender: 'male',
                level: 'КМС – МС',
                period: 'Силовой',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: '',
                exercises: [
                    { name: 'Приседания', sets: 5, reps: '3-6', intensity: '85-95%' },
                    { name: 'Жим лежа', sets: 5, reps: '3-6', intensity: '85-95%' },
                    { name: 'Становая тяга', sets: 4, reps: '3-6', intensity: '85-95%' },
                    { name: 'Жим стоя', sets: 4, reps: '4-8', intensity: '75-85%' },
                    { name: 'Подтягивания', sets: 4, reps: '5-10', intensity: 'Собственный вес + отягощение' }
                ]
            },
            {
                id: 3,
                name: 'СРЦ3',
                direction: 'Жим лежа',
                gender: 'male',
                level: 'Начальный',
                period: 'Выносливость',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: '',
                exercises: [
                    { name: 'Жим лежа', sets: 4, reps: '8-12', intensity: '60-75%' },
                    { name: 'Жим на наклонной скамье', sets: 3, reps: '10-15', intensity: '50-65%' },
                    { name: 'Отжимания на брусьях', sets: 3, reps: '8-15', intensity: 'Собственный вес' },
                    { name: 'Разводка гантелей', sets: 3, reps: '12-20', intensity: '40-55%' },
                    { name: 'Жим узким хватом', sets: 3, reps: '8-12', intensity: '60-75%' }
                ]
            },
            {
                id: 4,
                name: 'СРЦ4',
                direction: 'Армрестлинг',
                gender: 'male',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: 'Стиль борьбы - верх.',
                exercises: [
                    { name: 'Статическая тяга', sets: 4, reps: '5-8', intensity: '80-90%' },
                    { name: 'Молотковые сгибания', sets: 4, reps: '6-10', intensity: '70-85%' },
                    { name: 'Концентрированные сгибания', sets: 3, reps: '8-12', intensity: '60-75%' },
                    { name: 'Обратные сгибания', sets: 3, reps: '8-12', intensity: '60-75%' },
                    { name: 'Удержание веса', sets: 3, reps: '10-30 сек', intensity: 'Максимальное время' }
                ]
            },
            {
                id: 5,
                name: 'СРЦ5',
                direction: 'Жим лежа',
                gender: 'male',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: 'Дополнительное внимание жиму стоя',
                exercises: [
                    { name: 'Жим лежа', sets: 4, reps: '5-8', intensity: '80-90%' },
                    { name: 'Жим стоя', sets: 4, reps: '5-8', intensity: '80-90%' },
                    { name: 'Жим на наклонной скамье', sets: 3, reps: '6-10', intensity: '70-80%' },
                    { name: 'Жим сидя', sets: 3, reps: '6-10', intensity: '70-80%' },
                    { name: 'Разводка гантелей', sets: 3, reps: '8-12', intensity: '60-75%' }
                ]
            },
            {
                id: 6,
                name: 'СРЦ6',
                direction: 'Жим лежа',
                gender: 'male',
                level: 'КМС – МС',
                period: 'Силовой',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: '',
                exercises: [
                    { name: 'Жим лежа', sets: 5, reps: '3-6', intensity: '85-95%' },
                    { name: 'Жим на наклонной скамье', sets: 4, reps: '4-8', intensity: '75-85%' },
                    { name: 'Жим узким хватом', sets: 4, reps: '4-8', intensity: '75-85%' },
                    { name: 'Отжимания на брусьях', sets: 3, reps: '6-12', intensity: 'Собственный вес + отягощение' },
                    { name: 'Разводка гантелей', sets: 3, reps: '8-15', intensity: '50-70%' }
                ]
            },
            {
                id: 7,
                name: 'СРЦ7',
                direction: 'Троеборье',
                gender: 'male',
                level: 'МС – МСМК',
                period: 'Выход на пик',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: '',
                exercises: [
                    { name: 'Приседания', sets: 3, reps: '1-3', intensity: '90-100%' },
                    { name: 'Жим лежа', sets: 3, reps: '1-3', intensity: '90-100%' },
                    { name: 'Становая тяга', sets: 2, reps: '1-3', intensity: '90-100%' },
                    { name: 'Вспомогательные упражнения', sets: 2, reps: '5-8', intensity: '70-80%' }
                ]
            },
            {
                id: 8,
                name: 'СРЦ8',
                direction: 'Бодибилдинг',
                gender: 'male',
                level: 'Средний уровень',
                period: 'Массонабор',
                weightMin: 80,
                weightMax: null,
                weightHeightRatio: 'Нормальное',
                additionalInfo: 'Увеличение мышечной массы. Пристальное внимание на диету и режим.',
                exercises: [
                    { name: 'Жим лежа', sets: 4, reps: '8-12', intensity: '65-80%' },
                    { name: 'Приседания', sets: 4, reps: '8-12', intensity: '65-80%' },
                    { name: 'Становая тяга', sets: 3, reps: '6-10', intensity: '70-85%' },
                    { name: 'Жим стоя', sets: 3, reps: '8-12', intensity: '60-75%' },
                    { name: 'Подтягивания', sets: 3, reps: '8-15', intensity: 'Собственный вес' },
                    { name: 'Изолирующие упражнения', sets: 3, reps: '10-20', intensity: '50-70%' }
                ]
            }
        ];
    }

    async getAvailableCycles() {
        return this.cycles.map(cycle => ({
            id: cycle.id,
            name: cycle.name,
            direction: cycle.direction,
            level: cycle.level,
            period: cycle.period
        }));
    }

    async getCycleById(id) {
        return this.cycles.find(cycle => cycle.id === parseInt(id));
    }

    async getCyclesByCriteria(criteria) {
        return this.cycles.filter(cycle => {
            if (criteria.gender && cycle.gender !== criteria.gender) return false;
            if (criteria.level && !cycle.level.includes(criteria.level)) return false;
            if (criteria.direction && cycle.direction !== criteria.direction) return false;
            if (criteria.weight && cycle.weightMin && criteria.weight < cycle.weightMin) return false;
            if (criteria.weight && cycle.weightMax && criteria.weight > cycle.weightMax) return false;

            return true;
        });
    }

    getCycleDescription(cycle) {
        return `
🏋️‍♂️ ${cycle.name} - ${cycle.direction}
📊 Уровень: ${cycle.level}
⏱️ Период: ${cycle.period}
⚖️ Вес: ${cycle.weightMin}+ кг
${cycle.additionalInfo ? `ℹ️ Дополнительно: ${cycle.additionalInfo}` : ''}
        `.trim();
    }

    getWorkoutPlan(cycle, userProfile) {
        const plan = {
            name: cycle.name,
            direction: cycle.direction,
            level: cycle.level,
            period: cycle.period,
            duration: this.getCycleDuration(cycle),
            frequency: this.getTrainingFrequency(cycle),
            exercises: cycle.exercises,
            notes: this.getCycleNotes(cycle, userProfile)
        };

        return plan;
    }

    getCycleDuration(cycle) {
        switch (cycle.period) {
        case 'Силовой':
            return '8-12 недель';
        case 'Выносливость':
            return '6-10 недель';
        case 'Выход на пик':
            return '4-6 недель';
        case 'Массонабор':
            return '12-16 недель';
        default:
            return '8-12 недель';
        }
    }

    getTrainingFrequency(cycle) {
        switch (cycle.direction) {
        case 'Троеборье':
            return '3-4 раза в неделю';
        case 'Жим лежа':
            return '2-3 раза в неделю';
        case 'Армрестлинг':
            return '3-4 раза в неделю';
        case 'Бодибилдинг':
            return '4-6 раз в неделю';
        default:
            return '3-4 раза в неделю';
        }
    }

    getCycleNotes(cycle, userProfile) {
        const notes = [];

        if (cycle.additionalInfo) {
            notes.push(cycle.additionalInfo);
        }

        if (userProfile.weight < cycle.weightMin) {
            notes.push(`⚠️ Рекомендуется набрать вес до ${cycle.weightMin} кг для оптимальных результатов`);
        }

        if (cycle.period === 'Массонабор') {
            notes.push('🍽️ Особое внимание к питанию и режиму сна');
        }

        if (cycle.period === 'Выход на пик') {
            notes.push('🏆 Период подготовки к соревнованиям - максимальная интенсивность');
        }

        return notes;
    }

    async getCycles() {
        // Return cycles from database if available, otherwise return static cycles
        try {
            if (this.db) {
                const cycles = await this.db.all('SELECT * FROM cycles ORDER BY id');
                return cycles;
            } else {
                console.log('Database not available, returning static cycles');
                return this.cycles;
            }
        } catch (error) {
            console.log('Database not available, returning static cycles');
            return this.cycles;
        }
    }
}

module.exports = CycleService;


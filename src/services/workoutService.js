const MaxWeightService = require('./maxWeightService');

class WorkoutService {
    constructor(database) {
        this.db = database;
        this.maxWeightService = new MaxWeightService(database);
    }

    async generateWorkoutPlan(cycle, userProfile) {
        try {
            const plan = {
                cycleId: cycle.id,
                userId: userProfile.id,
                name: cycle.name,
                direction: cycle.direction,
                level: cycle.level,
                period: cycle.period,
                duration: this.getCycleDuration(cycle),
                frequency: this.getTrainingFrequency(cycle),
                exercises: this.generateExercises(cycle, userProfile),
                notes: this.generateNotes(cycle, userProfile),
                createdAt: new Date().toISOString()
            };

            // Сохраняем план в базу данных
            const savedPlan = await this.saveWorkoutPlan(plan);

            return savedPlan;
        } catch (error) {
            console.error('Ошибка при генерации плана тренировок:', error);
            throw error;
        }
    }

    generateExercises(cycle, userProfile) {
        if (!cycle.exercises || !Array.isArray(cycle.exercises)) {
            console.log('No exercises found in cycle, using default exercises');
            return this.getDefaultExercises();
        }
        
        const exercises = cycle.exercises.map(exercise => {
            const adjustedExercise = { ...exercise };
            
            // Корректируем интенсивность в зависимости от уровня пользователя
            if (userProfile.level === 'Начальный') {
                adjustedExercise.intensity = this.adjustIntensityForBeginner(exercise.intensity);
                adjustedExercise.reps = this.adjustRepsForBeginner(exercise.reps);
            } else if (userProfile.level === 'МС' || userProfile.level === 'МСМК') {
                adjustedExercise.intensity = this.adjustIntensityForAdvanced(exercise.intensity);
            }
            
            // Корректируем в зависимости от веса пользователя
            if (userProfile.weight && userProfile.weight < 70) {
                adjustedExercise.reps = this.increaseRepsForLightWeight(exercise.reps);
            }
            
            return adjustedExercise;
        });

        return exercises;
    }

    calculateWeightFromIntensity(maxWeight, intensity) {
        if (!maxWeight || !intensity) return null;
        
        // Извлекаем процент из строки типа "80-90%"
        const percentageMatch = intensity.match(/(\d+)-(\d+)%/);
        if (percentageMatch) {
            const minPercent = parseInt(percentageMatch[1]);
            const maxPercent = parseInt(percentageMatch[2]);
            const avgPercent = (minPercent + maxPercent) / 2;
            return this.maxWeightService.calculateWeightFromMax(maxWeight, avgPercent);
        }
        
        // Если формат другой, пробуем извлечь число
        const singleMatch = intensity.match(/(\d+)%/);
        if (singleMatch) {
            const percent = parseInt(singleMatch[1]);
            return this.maxWeightService.calculateWeightFromMax(maxWeight, percent);
        }
        
        return null;
    }

    getDefaultExercises() {
        return [
            {
                name: 'Приседания',
                sets: 3,
                reps: '8-12',
                intensity: '70-80%',
                description: 'Базовое упражнение для развития ног'
            },
            {
                name: 'Жим лежа',
                sets: 3,
                reps: '8-12',
                intensity: '70-80%',
                description: 'Базовое упражнение для развития груди'
            },
            {
                name: 'Становая тяга',
                sets: 3,
                reps: '6-10',
                intensity: '75-85%',
                description: 'Базовое упражнение для развития спины'
            },
            {
                name: 'Жим стоя',
                sets: 3,
                reps: '8-12',
                intensity: '65-75%',
                description: 'Упражнение для развития плеч'
            },
            {
                name: 'Подтягивания',
                sets: 3,
                reps: '6-12',
                intensity: 'Собственный вес',
                description: 'Упражнение для развития спины и бицепса'
            }
        ];
    }

    generateWorkoutSessions(plan, cycle, userProfile) {
        const sessions = [];
        const totalWeeks = this.parseDuration(plan.duration);
        const frequency = this.parseFrequency(plan.frequency);
        
        // Определяем типы тренировок в зависимости от направления
        const sessionTypes = this.getSessionTypes(plan.direction);
        
        for (let week = 1; week <= totalWeeks; week++) {
            for (let day = 1; day <= frequency; day++) {
                const sessionType = sessionTypes[(day - 1) % sessionTypes.length];
                const session = this.createWorkoutSession(plan, week, day, sessionType, userProfile);
                sessions.push(session);
            }
        }
        
        return sessions;
    }

    parseDuration(duration) {
        // "8-12 недель" -> 10 (среднее значение)
        const match = duration.match(/(\d+)-(\d+)/);
        if (match) {
            return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        }
        return 8; // по умолчанию
    }

    parseFrequency(frequency) {
        // "3-4 раза в неделю" -> 3 (минимум)
        const match = frequency.match(/(\d+)-(\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        return 3; // по умолчанию
    }

    getSessionTypes(direction) {
        switch (direction) {
            case 'Троеборье':
                return ['Силовая', 'Техническая', 'Восстановительная'];
            case 'Двоеборье':
                return ['Силовая', 'Техническая'];
            case 'Жим лежа':
                return ['Жимовая', 'Вспомогательная'];
            default:
                return ['Силовая', 'Общая'];
        }
    }

    createWorkoutSession(plan, week, day, sessionType, userProfile) {
        const sessionName = `${sessionType} тренировка (Неделя ${week}, День ${day})`;
        
        // Выбираем упражнения для типа тренировки
        const sessionExercises = this.selectExercisesForSession(plan.exercises, sessionType, week);
        
        // Адаптируем под неделю (прогрессия)
        const adaptedExercises = this.adaptExercisesForWeek(sessionExercises, week, userProfile);
        
        return {
            weekNumber: week,
            dayNumber: day,
            sessionName: sessionName,
            exercises: adaptedExercises,
            notes: this.generateSessionNotes(sessionType, week, userProfile)
        };
    }

    selectExercisesForSession(exercises, sessionType, week) {
        switch (sessionType) {
            case 'Силовая':
                return exercises.filter(ex => 
                    ex.name.includes('Приседания') || 
                    ex.name.includes('Жим лежа') || 
                    ex.name.includes('Становая тяга')
                );
            case 'Техническая':
                return exercises.filter(ex => 
                    ex.name.includes('Жим стоя') || 
                    ex.name.includes('Подтягивания')
                );
            case 'Восстановительная':
                return exercises.slice(0, 2); // Меньше упражнений
            case 'Жимовая':
                return exercises.filter(ex => ex.name.includes('Жим'));
            case 'Вспомогательная':
                return exercises.filter(ex => 
                    !ex.name.includes('Приседания') && 
                    !ex.name.includes('Становая тяга')
                );
            default:
                return exercises;
        }
    }

    adaptExercisesForWeek(exercises, week, userProfile) {
        return exercises.map(exercise => {
            const adapted = { ...exercise };
            
            // Прогрессия по неделям
            if (week <= 2) {
                // Первые 2 недели - адаптация
                adapted.sets = Math.max(2, exercise.sets - 1);
                adapted.intensity = this.reduceIntensity(exercise.intensity, 10);
            } else if (week >= 6) {
                // Последние недели - пик
                adapted.sets = exercise.sets + 1;
                adapted.intensity = this.increaseIntensity(exercise.intensity, 5);
            }
            
            return adapted;
        });
    }

    reduceIntensity(intensity, percent) {
        if (intensity.includes('%')) {
            const value = parseInt(intensity.replace(/[^\d]/g, ''));
            const newValue = Math.max(50, value - percent);
            return `${newValue}%`;
        }
        return intensity;
    }

    increaseIntensity(intensity, percent) {
        if (intensity.includes('%')) {
            const value = parseInt(intensity.replace(/[^\d]/g, ''));
            const newValue = Math.min(100, value + percent);
            return `${newValue}%`;
        }
        return intensity;
    }

    generateSessionNotes(sessionType, week, userProfile) {
        const notes = [];
        
        if (sessionType === 'Силовая') {
            notes.push('💪 Фокус на максимальных весах и технике');
            if (week >= 6) {
                notes.push('🔥 Пиковая неделя - максимальная интенсивность');
            }
        } else if (sessionType === 'Техническая') {
            notes.push('🎯 Работа над техникой выполнения');
            notes.push('📝 Записывайте ощущения и прогресс');
        } else if (sessionType === 'Восстановительная') {
            notes.push('🔄 Легкая тренировка для восстановления');
            notes.push('💤 Следите за качеством сна');
        }
        
        if (userProfile.level === 'Начальный') {
            notes.push('⚠️ Начинайте с разминки 10-15 минут');
        }
        
        return notes;
    }

    adjustIntensityForBeginner(intensity) {
        if (intensity.includes('%')) {
            const percentage = parseInt(intensity.replace(/[^\d]/g, ''));
            const adjustedPercentage = Math.max(50, percentage - 10);
            return `${adjustedPercentage}%`;
        }
        return intensity;
    }

    adjustIntensityForAdvanced(intensity) {
        if (intensity.includes('%')) {
            const percentage = parseInt(intensity.replace(/[^\d]/g, ''));
            const adjustedPercentage = Math.min(100, percentage + 5);
            return `${adjustedPercentage}%`;
        }
        return intensity;
    }

    adjustRepsForBeginner(reps) {
        if (reps.includes('-')) {
            const [min, max] = reps.split('-').map(r => parseInt(r));
            return `${min + 2}-${max + 3}`;
        }
        return reps;
    }

    increaseRepsForLightWeight(reps) {
        if (reps.includes('-')) {
            const [min, max] = reps.split('-').map(r => parseInt(r));
            return `${min + 1}-${max + 2}`;
        }
        return reps;
    }

    generateNotes(cycle, userProfile) {
        const notes = [];
        
        // Базовые заметки цикла
        if (cycle.additionalInfo) {
            notes.push(cycle.additionalInfo);
        }
        
        // Персональные рекомендации
        if (userProfile.weight && userProfile.height) {
            const bmi = this.calculateBMI(userProfile.weight, userProfile.height);
            if (bmi < 18.5) {
                notes.push('💡 Рекомендуется увеличить калорийность питания для набора массы');
            } else if (bmi > 30) {
                notes.push('💡 Рекомендуется сочетать силовые тренировки с кардио');
            }
        }
        
        if (userProfile.level === 'Начальный') {
            notes.push('🎯 Фокус на технике выполнения упражнений');
            notes.push('⏰ Увеличьте время отдыха между подходами до 2-3 минут');
        } else if (userProfile.level === 'МС' || userProfile.level === 'МСМК') {
            notes.push('🏆 Период подготовки к соревнованиям - максимальная концентрация');
            notes.push('📊 Ведите детальный дневник тренировок');
        }
        
        if (cycle.period === 'Массонабор') {
            notes.push('🍽️ Питание: 1.6-2.2г белка на кг веса');
            notes.push('😴 Сон: минимум 8 часов в сутки');
        }
        
        if (cycle.period === 'Выносливость') {
            notes.push('💪 Фокус на объеме тренировок');
            notes.push('⏱️ Короткие перерывы между подходами (60-90 сек)');
        }
        
        return notes;
    }

    calculateBMI(weight, height) {
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
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

    async saveWorkoutPlan(plan) {
        try {
            const result = await this.db.run(
                `INSERT INTO workout_plans 
                (user_id, cycle_id, name, direction, level, period, duration, frequency, exercises, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    plan.userId, 
                    plan.cycleId, 
                    plan.name, 
                    plan.direction, 
                    plan.level, 
                    plan.period, 
                    plan.duration, 
                    plan.frequency, 
                    JSON.stringify(plan.exercises), 
                    JSON.stringify(plan.notes)
                ]
            );
            
            return {
                id: result.lastID,
                ...plan
            };
        } catch (error) {
            console.error('Ошибка при сохранении плана тренировок:', error);
            throw error;
        }
    }

    async saveWorkoutSessions(planId, sessions) {
        try {
            for (const session of sessions) {
                await new Promise((resolve, reject) => {
                    this.db.run(
                        `INSERT INTO workout_sessions 
                        (plan_id, week_number, day_number, session_name, exercises, notes) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            planId,
                            session.weekNumber,
                            session.dayNumber,
                            session.sessionName,
                            JSON.stringify(session.exercises),
                            JSON.stringify(session.notes)
                        ],
                        function(err) {
                            if (err) {
                                console.error('Ошибка при сохранении сессии тренировки:', err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        }
                    );
                });
            }
        } catch (error) {
            console.error('Ошибка при сохранении сессий тренировок:', error);
            throw error;
        }
    }

    async getUserWorkoutPlans(userId) {
        try {
            return new Promise((resolve, reject) => {
                this.db.all(
                    'SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC',
                    [userId],
                    (err, plans) => {
                        if (err) {
                            console.error('Ошибка при получении планов пользователя:', err);
                            reject(err);
                        } else {
                            const result = plans.map(plan => ({
                                id: plan.id,
                                userId: plan.user_id,
                                cycleId: plan.cycle_id,
                                name: plan.name,
                                direction: plan.direction,
                                level: plan.level,
                                period: plan.period,
                                duration: plan.duration,
                                frequency: plan.frequency,
                                exercises: JSON.parse(plan.exercises),
                                notes: JSON.parse(plan.notes || '[]'),
                                createdAt: plan.created_at
                            }));
                            resolve(result);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Ошибка при получении планов пользователя:', error);
            throw error;
        }
    }

    async getWorkoutPlanById(planId) {
        try {
            const plan = await this.db.get(
                'SELECT * FROM workout_plans WHERE id = ?',
                [planId]
            );
            
            if (!plan) {
                throw new Error('План тренировок не найден');
            }
            
            return {
                id: plan.id,
                ...JSON.parse(plan.plan_data),
                createdAt: plan.created_at
            };
        } catch (error) {
            console.error('Ошибка при получении плана по ID:', error);
            throw error;
        }
    }

    formatWorkoutPlan(plan) {
        const exercisesText = plan.exercises.map((exercise, index) => 
            `${index + 1}. ${exercise.name}\n   • Подходы: ${exercise.sets}\n   • Повторения: ${exercise.reps}\n   • Интенсивность: ${exercise.intensity}`
        ).join('\n\n');

        const notesText = plan.notes.length > 0 ? 
            `\n\n📝 Рекомендации:\n${plan.notes.map(note => `• ${note}`).join('\n')}` : '';

        return `
🏋️‍♂️ План тренировок: ${plan.name}
📊 Направление: ${plan.direction}
🎯 Уровень: ${plan.level}
⏱️ Период: ${plan.period}
📅 Длительность: ${plan.duration}
🔄 Частота: ${plan.frequency}

💪 Упражнения:
${exercisesText}${notesText}
        `.trim();
    }

    async deleteWorkoutPlan(planId, userId) {
        try {
            const result = await this.db.run(
                'DELETE FROM workout_plans WHERE id = ? AND user_id = ?',
                [planId, userId]
            );
            
            if (result.changes === 0) {
                throw new Error('План тренировок не найден или у вас нет прав на его удаление');
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка при удалении плана тренировок:', error);
            throw error;
        }
    }
}

module.exports = WorkoutService;




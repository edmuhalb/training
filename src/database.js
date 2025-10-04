const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const exercises = require('./init/exercises');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_URL || './data/training_bot.db';
    }

    async init() {
        return new Promise((resolve, reject) => {
            // Создаем директорию для базы данных если её нет
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Ошибка подключения к базе данных:', err);
                    reject(err);
                } else {
                    // eslint-disable-next-line no-console
        console.log('Подключение к базе данных установлено');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    gender TEXT,
                    weight REAL,
                    height REAL,
                    level TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createCyclesTable = `
                CREATE TABLE IF NOT EXISTS cycles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    direction TEXT NOT NULL,
                    gender TEXT NOT NULL,
                    level TEXT NOT NULL,
                    period TEXT NOT NULL,
                    weight_min INTEGER,
                    weight_max INTEGER,
                    weight_height_ratio TEXT,
                    additional_info TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createWorkoutPlansTable = `
                CREATE TABLE IF NOT EXISTS workout_plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    cycle_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    direction TEXT,
                    level TEXT,
                    period TEXT,
                    duration TEXT,
                    frequency TEXT,
                    exercises TEXT NOT NULL,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (cycle_id) REFERENCES cycles (id)
                )
            `;

            const createWorkoutSessionsTable = `
                CREATE TABLE IF NOT EXISTS workout_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plan_id INTEGER NOT NULL,
                    week_number INTEGER NOT NULL,
                    day_number INTEGER NOT NULL,
                    session_name TEXT NOT NULL,
                    exercises TEXT NOT NULL,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plan_id) REFERENCES workout_plans (id)
                )
            `;

            const createUserMaxWeightsTable = `
                CREATE TABLE IF NOT EXISTS user_max_weights (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    exercise_name TEXT NOT NULL,
                    max_weight REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    UNIQUE(user_id, exercise_name)
                )
            `;

            const createExercisesTable = `
                CREATE TABLE IF NOT EXISTS exercises (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.serialize(() => {
                this.db.run(createUsersTable);
                this.db.run(createCyclesTable);
                this.db.run(createWorkoutPlansTable);
                this.db.run(createWorkoutSessionsTable);
                this.db.run(createUserMaxWeightsTable);
                this.db.run(createExercisesTable);

                // Вставляем базовые циклы и упражнения
                this.insertDefaultCycles();
                this.insertDefaultExercises();

                resolve();
            });
        });
    }

    insertDefaultCycles() {
        const cycles = [
            {
                name: 'СРЦ1',
                direction: 'Троеборье',
                gender: 'male',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: ''
            },
            {
                name: 'СРЦ2',
                direction: 'Троеборье',
                gender: 'male',
                level: 'КМС – МС',
                period: 'Силовой',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: ''
            },
            {
                name: 'СРЦ3',
                direction: 'Жим лежа',
                gender: 'male',
                level: 'Начальный',
                period: 'Выносливость',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: ''
            },
            {
                name: 'СРЦ4',
                direction: 'Армрестлинг',
                gender: 'male',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: 'Стиль борьбы - верх.'
            },
            {
                name: 'СРЦ5',
                direction: 'Жим лежа',
                gender: 'male',
                level: 'II разряд – КМС',
                period: 'Силовой',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: 'Дополнительное внимание жиму стоя'
            },
            {
                name: 'СРЦ6',
                direction: 'Жим лежа',
                gender: 'male',
                level: 'КМС – МС',
                period: 'Силовой',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: ''
            },
            {
                name: 'СРЦ7',
                direction: 'Троеборье',
                gender: 'male',
                level: 'МС – МСМК',
                period: 'Выход на пик',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: ''
            },
            {
                name: 'СРЦ8',
                direction: 'Бодибилдинг',
                gender: 'male',
                level: 'Средний уровень',
                period: 'Массонабор',
                weight_min: 80,
                weight_max: null,
                weight_height_ratio: 'Нормальное',
                additional_info: 'Увеличение мышечной массы. Пристальное внимание на диету и режим.'
            }
        ];

        cycles.forEach(cycle => {
            this.db.run(`
                INSERT OR IGNORE INTO cycles (name, direction, gender, level, period, weight_min, weight_max, weight_height_ratio, additional_info)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cycle.name,
                cycle.direction,
                cycle.gender,
                cycle.level,
                cycle.period,
                cycle.weight_min,
                cycle.weight_max,
                cycle.weight_height_ratio,
                cycle.additional_info
            ]);
        });
    }

    insertDefaultExercises() {
        exercises.forEach(exercise => {
            this.db.run(`
                INSERT OR IGNORE INTO exercises (name, category, description)
                VALUES (?, ?, ?)
            `, [
                exercise.name,
                exercise.category,
                exercise.description
            ]);
        });
    }

    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = Database;

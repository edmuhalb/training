const express = require('express');
const path = require('path');
const Database = require('./database');
const UserService = require('./services/userService');
const CycleService = require('./services/cycleService');
const WorkoutService = require('./services/workoutService');

class WebApp {
    constructor() {
        this.app = express();
        this.database = new Database();
        this.userService = new UserService(this.database);
        this.cycleService = new CycleService(this.database);
        this.workoutService = new WorkoutService(this.database);
        this.maxWeightService = new (require('./services/maxWeightService'))(this.database);
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json());
        
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Serve index.html for root path
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
        
        // CORS for Telegram WebApp
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }

    setupRoutes() {
        // Main page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // Favicon
        this.app.get('/favicon.ico', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/favicon.svg'));
        });

        // API Routes
        this.app.get('/api/profile', this.getProfile.bind(this));
        this.app.post('/api/profile', this.saveProfile.bind(this));
        this.app.get('/api/cycles', this.getCycles.bind(this));
        this.app.post('/api/workout-plan', this.generateWorkoutPlan.bind(this));
        this.app.get('/api/workout-plans', this.getWorkoutPlans.bind(this));
        
        // Max Weight API
        this.app.get('/api/max-weights', this.getMaxWeights.bind(this));
        this.app.post('/api/max-weights', this.saveMaxWeight.bind(this));
        this.app.put('/api/max-weights', this.updateMaxWeight.bind(this));
    }

    // Get user profile
    async getProfile(req, res) {
        try {
            // For demo purposes, we'll use a default user ID
            // In a real app, you'd get this from Telegram WebApp data
            const userId = 1;
            const user = await this.userService.getUser(userId);
            
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ message: 'Profile not found' });
            }
        } catch (error) {
            console.error('Error getting profile:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Save user profile
    async saveProfile(req, res) {
        try {
            const { gender, weight, height, level } = req.body;
            
            // Validate input
            if (!gender || !weight || !height || !level) {
                return res.status(400).json({ message: 'All fields are required' });
            }
            
            if (weight < 30 || weight > 200) {
                return res.status(400).json({ message: 'Weight must be between 30 and 200 kg' });
            }
            
            if (height < 120 || height > 250) {
                return res.status(400).json({ message: 'Height must be between 120 and 250 cm' });
            }
            
            // For demo purposes, we'll use a default user ID
            const userId = 1;
            
            // Create or update user
            const userData = {
                id: userId,
                username: 'webapp_user',
                firstName: 'WebApp',
                lastName: 'User',
                gender,
                weight,
                height,
                level
            };
            
            const user = await this.userService.createOrUpdateUser(userData);
            res.json(user);
        } catch (error) {
            console.error('Error saving profile:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get available cycles
    async getCycles(req, res) {
        try {
            const cycles = await this.cycleService.getCycles();
            res.json(cycles);
        } catch (error) {
            console.error('Error getting cycles:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Generate workout plan
    async generateWorkoutPlan(req, res) {
        try {
            const { cycleId, userId } = req.body;
            console.log('Generating workout plan for cycleId:', cycleId, 'userId:', userId);
            
            if (!cycleId || !userId) {
                return res.status(400).json({ message: 'Cycle ID and User ID are required' });
            }
            
            // Get user profile
            console.log('Getting user profile...');
            const userProfile = await this.userService.getUser(userId);
            if (!userProfile) {
                console.log('User not found');
                return res.status(404).json({ message: 'User not found' });
            }
            console.log('User profile found:', userProfile);
            
            // Get cycle
            console.log('Getting cycles...');
            const cycles = await this.cycleService.getCycles();
            console.log('Found cycles:', cycles.length);
            const cycle = cycles.find(c => c.id == cycleId);
            if (!cycle) {
                console.log('Cycle not found');
                return res.status(404).json({ message: 'Cycle not found' });
            }
            console.log('Cycle found:', cycle.name);
            
            console.log('Generating workout plan...');
            const workoutPlan = await this.workoutService.generateWorkoutPlan(cycle, userProfile);
            console.log('Workout plan generated successfully');
            res.json(workoutPlan);
        } catch (error) {
            console.error('Error generating workout plan:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get user's workout plans
    async getWorkoutPlans(req, res) {
        try {
            const userId = req.query.userId || 1;
            const plans = await this.workoutService.getUserWorkoutPlans(userId);
            res.json(plans);
        } catch (error) {
            console.error('Error getting workout plans:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Start server
    async start(port = 3000) {
        try {
            // Initialize database
            await this.database.init();
            console.log('Database initialized');
            
            // Initialize default data
            await this.initializeDefaultData();
            console.log('Default data initialized');
            
            // Start server
            this.app.listen(port, () => {
                console.log(`WebApp server running on port ${port}`);
                console.log(`Open http://localhost:${port} in your browser`);
            });
        } catch (error) {
            console.error('Error starting WebApp:', error);
            process.exit(1);
        }
    }

    // Initialize default data
    async initializeDefaultData() {
        try {
            // Check if cycles exist
            const cycles = await this.cycleService.getCycles();
            if (cycles.length === 0) {
                console.log('No cycles found, initializing default cycles...');
                await this.initializeDefaultCycles();
            }
        } catch (error) {
            console.error('Error initializing default data:', error);
        }
    }

    // Initialize default cycles
    async initializeDefaultCycles() {
        const defaultCycles = [
            {
                name: 'Базовый цикл для новичков',
                description: 'Подходит для начинающих спортсменов',
                duration: 8,
                level: 'Новичок',
                notes: 'Рекомендуется для первых 6 месяцев тренировок'
            },
            {
                name: 'Цикл для любителей',
                description: 'Для спортсменов с опытом 1-3 года',
                duration: 12,
                level: 'Любитель',
                notes: 'Интенсивные тренировки с акцентом на технику'
            },
            {
                name: 'Подготовительный цикл',
                description: 'Для подготовки к соревнованиям',
                duration: 16,
                level: 'Разрядник',
                notes: 'Максимальная интенсивность, подготовка к пику формы'
            },
            {
                name: 'Цикл для КМС',
                description: 'Высокий уровень подготовки',
                duration: 20,
                level: 'КМС',
                notes: 'Профессиональный уровень подготовки'
            },
            {
                name: 'Цикл для МС',
                description: 'Мастер спорта',
                duration: 24,
                level: 'МС',
                notes: 'Элитный уровень подготовки'
            }
        ];

        for (const cycle of defaultCycles) {
            await this.database.run(
                'INSERT INTO cycles (name, description, duration, level, notes) VALUES (?, ?, ?, ?, ?)',
                [cycle.name, cycle.description, cycle.duration, cycle.level, cycle.notes]
            );
        }

        console.log('Default cycles initialized');
    }

    // Get user's max weights
    async getMaxWeights(req, res) {
        try {
            const userId = req.query.userId || 1;
            const maxWeights = await this.maxWeightService.getUserMaxWeights(userId);
            res.json(maxWeights);
        } catch (error) {
            console.error('Error getting max weights:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Save max weight
    async saveMaxWeight(req, res) {
        try {
            const { userId, exerciseName, maxWeight } = req.body;
            
            if (!userId || !exerciseName || !maxWeight) {
                return res.status(400).json({ message: 'User ID, exercise name and max weight are required' });
            }
            
            const result = await this.maxWeightService.saveMaxWeight(userId, exerciseName, maxWeight);
            res.json(result);
        } catch (error) {
            console.error('Error saving max weight:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Update max weight
    async updateMaxWeight(req, res) {
        try {
            const { userId, exerciseName, maxWeight } = req.body;
            
            if (!userId || !exerciseName || !maxWeight) {
                return res.status(400).json({ message: 'User ID, exercise name and max weight are required' });
            }
            
            const result = await this.maxWeightService.saveMaxWeight(userId, exerciseName, maxWeight);
            res.json(result);
        } catch (error) {
            console.error('Error updating max weight:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

// Start WebApp if this file is run directly
if (require.main === module) {
    const webapp = new WebApp();
    const port = process.env.PORT || 3000;
    webapp.start(port);
}

// Export for Vercel
module.exports = WebApp;

// For Vercel serverless functions
if (process.env.VERCEL) {
    const webapp = new WebApp();
    module.exports = webapp.app;
}

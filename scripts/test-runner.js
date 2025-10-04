#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            lint: { passed: false, output: '' },
            unit: { passed: false, output: '' },
            integration: { passed: false, output: '' },
            e2e: { passed: false, output: '' },
            coverage: { passed: false, output: '' }
        };
    }

    async runAllTests() {
        console.log('🚀 Запуск полного набора тестов...\n');

        try {
            await this.runLint();
            await this.runUnitTests();
            await this.runIntegrationTests();
            await this.runE2ETests();
            await this.runCoverage();
            
            this.printSummary();
        } catch (error) {
            console.error('❌ Ошибка при запуске тестов:', error.message);
            process.exit(1);
        }
    }

    async runLint() {
        console.log('🔍 Запуск линтера...');
        try {
            const output = execSync('npm run lint', { encoding: 'utf8' });
            this.results.lint = { passed: true, output };
            console.log('✅ Линтер прошел успешно\n');
        } catch (error) {
            this.results.lint = { passed: false, output: error.stdout || error.message };
            console.log('❌ Линтер нашел ошибки\n');
        }
    }

    async runUnitTests() {
        console.log('🧪 Запуск unit тестов...');
        try {
            const output = execSync('npm run test:services', { encoding: 'utf8' });
            this.results.unit = { passed: true, output };
            console.log('✅ Unit тесты прошли успешно\n');
        } catch (error) {
            this.results.unit = { passed: false, output: error.stdout || error.message };
            console.log('❌ Unit тесты провалились\n');
        }
    }

    async runIntegrationTests() {
        console.log('🔗 Запуск интеграционных тестов...');
        try {
            const output = execSync('npm run test:integration', { encoding: 'utf8' });
            this.results.integration = { passed: true, output };
            console.log('✅ Интеграционные тесты прошли успешно\n');
        } catch (error) {
            this.results.integration = { passed: false, output: error.stdout || error.message };
            console.log('❌ Интеграционные тесты провалились\n');
        }
    }

    async runE2ETests() {
        console.log('🌐 Запуск E2E тестов...');
        try {
            const output = execSync('npm run test:e2e', { encoding: 'utf8' });
            this.results.e2e = { passed: true, output };
            console.log('✅ E2E тесты прошли успешно\n');
        } catch (error) {
            this.results.e2e = { passed: false, output: error.stdout || error.message };
            console.log('❌ E2E тесты провалились\n');
        }
    }

    async runCoverage() {
        console.log('📊 Генерация отчета о покрытии...');
        try {
            const output = execSync('npm run test:coverage', { encoding: 'utf8' });
            this.results.coverage = { passed: true, output };
            console.log('✅ Отчет о покрытии сгенерирован\n');
        } catch (error) {
            this.results.coverage = { passed: false, output: error.stdout || error.message };
            console.log('❌ Ошибка при генерации отчета о покрытии\n');
        }
    }

    printSummary() {
        console.log('📋 Сводка результатов тестирования:');
        console.log('=====================================');

        const tests = [
            { name: 'Линтер', result: this.results.lint },
            { name: 'Unit тесты', result: this.results.unit },
            { name: 'Интеграционные тесты', result: this.results.integration },
            { name: 'E2E тесты', result: this.results.e2e },
            { name: 'Покрытие кода', result: this.results.coverage }
        ];

        let passedCount = 0;
        let totalCount = tests.length;

        tests.forEach(test => {
            const status = test.result.passed ? '✅' : '❌';
            console.log(`${status} ${test.name}: ${test.result.passed ? 'ПРОШЕЛ' : 'ПРОВАЛЕН'}`);
            if (test.result.passed) passedCount++;
        });

        console.log('=====================================');
        console.log(`📊 Результат: ${passedCount}/${totalCount} тестов прошли успешно`);

        if (passedCount === totalCount) {
            console.log('🎉 Все тесты прошли успешно!');
            process.exit(0);
        } else {
            console.log('⚠️  Некоторые тесты провалились. Проверьте вывод выше.');
            process.exit(1);
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total: Object.keys(this.results).length,
                passed: Object.values(this.results).filter(r => r.passed).length,
                failed: Object.values(this.results).filter(r => !r.passed).length
            }
        };

        const reportPath = path.join(__dirname, '../test-reports');
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        fs.writeFileSync(
            path.join(reportPath, `test-report-${Date.now()}.json`),
            JSON.stringify(report, null, 2)
        );

        console.log(`📄 Отчет сохранен в ${reportPath}`);
    }
}

// Запуск тестов
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().then(() => {
        runner.generateReport();
    });
}

module.exports = TestRunner;




import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = __dirname;

// Global Assertion Helpers
global.assert = {
    strictEqual: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(`${message || ''} Expected "${expected}" but got "${actual}"`);
        }
    },
    deepStrictEqual: (actual, expected, message) => {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(`${message || ''} Expected ${expectedStr} but got ${actualStr}`);
        }
    },
    ok: (value, message) => {
        if (!value) throw new Error(`${message || ''} Expected truthy value`);
    },
    throws: async (block, errorMatch, message) => {
        try {
            await block();
        } catch (e) {
            if (errorMatch) {
                if (typeof errorMatch === 'string' && !e.message.includes(errorMatch)) {
                    throw new Error(`${message || ''} Expected error including "${errorMatch}" but got "${e.message}"`);
                }
            }
            return;
        }
        throw new Error(`${message || ''} Expected error but none was thrown`);
    }
};

async function runTests() {
    console.log('🚀 Starting Test Runner...');
    let passed = 0;
    let failed = 0;
    let totalFiles = 0;

    function findTestFiles(dir) {
        let results = [];
        if (!fs.existsSync(dir)) return results;

        const list = fs.readdirSync(dir);
        list.forEach(file => {
            // Skip run_tests.js itself
            if (file === 'run_tests.js') return;

            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(findTestFiles(file));
            } else {
                if (file.endsWith('.test.js')) {
                    results.push(file);
                }
            }
        });
        return results;
    }

    const files = findTestFiles(testDir);

    if (files.length === 0) {
        console.log('⚠️ No test files found.');
        return;
    }

    console.log(`found ${files.length} test files.\n`);

    for (const file of files) {
        const relativePath = path.relative(testDir, file);
        console.log(`📄 ${relativePath}`);

        // Reset tests for this file
        const fileTests = [];
        global.test = (name, fn) => {
            fileTests.push({ name, fn });
        };

        try {
            // Import the test file
            await import('file://' + file);

            if (fileTests.length === 0) {
                console.warn(`  ⚠️ No tests defined in this file.`);
            }

            for (const t of fileTests) {
                try {
                    await t.fn();
                    console.log(`  ✅ ${t.name}`);
                    passed++;
                } catch (e) {
                    console.error(`  ❌ ${t.name}`);
                    console.error(`     Error: ${e.message}`);
                    failed++;
                }
            }
            totalFiles++;
        } catch (e) {
            console.error(`  🔥 detailed error loading file: ${e.message}`);
            // stack trace
            console.error(e.stack);
            failed++;
        }
        console.log(''); // Empty line
    }

    console.log('---------------------------------------------------');
    console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
    console.log('---------------------------------------------------');

    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error("Runner Fatal Error:", err);
    process.exit(1);
});

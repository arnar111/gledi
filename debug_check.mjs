
import dotenv from 'dotenv';
dotenv.config();

const modules = [
    ['shared/schema', './shared/schema.ts'],
    ['shared/routes', './shared/routes.ts'],
    ['server/db', './server/db.ts'],
    ['server/storage', './server/storage.ts'],
    ['server/twilio', './server/twilio.ts'],
    ['server/routes', './server/routes.ts'],
    ['server/vite', './server/vite.ts']
];

async function run() {
    console.log('--- STARTING DEBUG CHECK ---');

    for (const [name, path] of modules) {
        try {
            process.stdout.write(`Testing ${name}... `);
            await import(path);
            console.log('✅ OK');
        } catch (error) {
            console.log('❌ FAILED');
            console.error(`\nCRASH IN ${name}:`);
            console.error(error);
            process.exit(1);
        }
    }

    console.log('\n--- ALL MODULES IMPORTED SUCCESSFULLY ---');
    console.log('If you see this, the issue is likely in server/index.ts execution');
}

run();


import dotenv from 'dotenv';
dotenv.config();

async function testImport(name, path) {
    try {
        process.stdout.write(`Importing ${name}... `);
        await import(path);
        console.log('OK');
        return true;
    } catch (error) {
        console.log('FAILED');
        console.error(`\n❌ Error importing ${name}:`);
        console.error(error);
        return false;
    }
}

async function run() {
    console.log('Starting dependency check...\n');

    // 1. Shared Schema (no dependencies)
    if (!await testImport('shared/schema', './shared/schema.ts')) return;

    // 2. Shared Routes (depends on schema)
    if (!await testImport('shared/routes', './shared/routes.ts')) return;

    // 3. DB (depends on env)
    if (!await testImport('server/db', './server/db.ts')) return;

    // 4. Storage (depends on db, schema)
    if (!await testImport('server/storage', './server/storage.ts')) return;

    // 5. Twilio Service (standalone)
    if (!await testImport('server/twilio', './server/twilio.ts')) return;

    // 6. Routes (depends on storage, shared routes, twilio)
    if (!await testImport('server/routes', './server/routes.ts')) return;

    // 7. Vite Setup
    if (!await testImport('server/vite', './server/vite.ts')) return;

    // 8. Server Index
    if (!await testImport('server/index', './server/index.ts')) return;

    console.log('\n✅ All imports successful!');
}

run();

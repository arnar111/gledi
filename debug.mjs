// Quick debug script to check imports
import dotenv from 'dotenv';
dotenv.config();

console.log('✓ dotenv loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');

try {
    console.log('\nTesting server imports...');
    await import('./server/index.ts');
} catch (error) {
    console.error('\n❌ Error importing server:');
    console.error(error);
    process.exit(1);
}

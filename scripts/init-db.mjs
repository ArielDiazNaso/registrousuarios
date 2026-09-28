import { initDb } from '../lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔄 Conectando a Turso y creando tablas...');
  try {
    await initDb();
    console.log('✅ Tablas creadas exitosamente en Turso DB:');
    console.log('   - users');
    console.log('   - sessions');
    console.log('   - accounts');
    console.log('   - verification_tokens');
  } catch (err) {
    console.error('❌ Error creando tablas:', err.message);
  }
}

main();

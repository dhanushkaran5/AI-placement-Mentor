import app from './src/app.js';
import dotenv from 'dotenv';
import { initDb, query, get } from './src/config/db.js';
import { seedDatabase } from './src/config/seed.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start DB and Express Server
const startServer = async () => {
  try {
    await initDb();
    
    // Auto-seed if demo account or initial insights do not exist
    try {
      const demoUser = await get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
      const insights = await query('SELECT count(*) as count FROM company_insights');
      if (!demoUser || (insights[0]?.count === 0)) {
        console.log('🌱 Initializing database with seed data & demo account...');
        await seedDatabase();
      }
    } catch (seedErr) {
      console.warn('Auto-seed notice:', seedErr.message);
    }
    
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  AI Placement Mentor Agent Server listening on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Diagnostics:  http://localhost:${PORT}/api/health/diagnostics`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize database and start server:', error);
    process.exit(1);
  }
};

startServer();

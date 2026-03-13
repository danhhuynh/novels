const { initializeDb, createTables } = require('./database/db');
const { seedDatabase } = require('./database/seed');
const fs = require('fs');
const path = require('path');

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    console.log('Starting application initialization...');
    
    // Initialize database connection
    await initializeDb();
    console.log('Database connection established');
    
    // Create tables if they don't exist
    await createTables();
    console.log('Database tables created/verified');
    
    // Check if database is empty and seed if needed
    const dbPath = path.join(__dirname, 'database', 'novels.db');
    const stats = fs.statSync(dbPath);
    
    // If database file is very small (just created), seed it
    if (stats.size < 1000) {
      console.log('Database appears to be empty, seeding with initial data...');
      await seedDatabase();
      console.log('Database seeded successfully');
    }
    
    console.log('Application initialized successfully!');
    
    // Your application logic starts here
    startApplication();
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

/**
 * Start your main application logic
 */
function startApplication() {
  // Import your novels functions after database is initialized
  const {
    getAllNovels,
    getNovelById,
    searchNovels,
    getChapterInfo,
    getChapterNavigation,
    getNovelsByGenre,
    getAllGenres
  } = require('./data/novels');
  
  console.log('Application is ready to serve requests');
  
  // Example usage - you can replace this with your actual application logic
  // If you're using Express, start your server here
  // If you're using a different framework, initialize it here
  
  // Example: Test the database functions
  testDatabaseFunctions();
}

/**
 * Test database functions to ensure everything works
 */
async function testDatabaseFunctions() {
  try {
    const { getAllNovels, getAllGenres } = require('./data/novels');
    
    const novels = await getAllNovels();
    console.log(`Loaded ${novels.length} novels from database`);
    
    const genres = await getAllGenres();
    console.log(`Available genres: ${genres.join(', ')}`);
    
  } catch (error) {
    console.error('Error testing database functions:', error);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  const { closeDb } = require('./database/db');
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  const { closeDb } = require('./database/db');
  await closeDb();
  process.exit(0);
});

// Start the application
initializeApp();

module.exports = { initializeApp, startApplication };

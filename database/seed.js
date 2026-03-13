const { initializeDb, createTables, getDb } = require('./db');

const seedData = {
  novels: [
    {
      id: 'vot-thi-nhan',
      title: 'Vớt Thi Nhân',
      author: 'Rồng Nhỏ Thuần Khiết',
      description: 'Con người biết nỗi kinh hoàng của ma quỷ, nhưng ma quỷ lại hiểu rõ sự độc ác trong lòng người. Đây là một tiểu thuyết siêu nhiên truyền thống.',
      coverImage: 'vot-thi-nhan.webp',
      genre: 'Linh Dị',
      status: 'In Progress',
      totalChapters: 1000,
      lastUpdated: '2024-03-15'
    },
  ],
  chapters: [
    // Vớt Thi Nhân
    { novelId: 'vot-thi-nhan', number: 1, title: 'Chương 1', publishDate: '2024-03-15' },
  ]
};

async function seedDatabase() {
  try {
    await initializeDb();
    await createTables();
    
    const db = getDb();

    // Clear existing data
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM chapters', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM novels', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Insert novels
    const insertNovel = db.prepare(`
      INSERT INTO novels (id, title, author, description, coverImage, genre, status, totalChapters, lastUpdated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seedData.novels.forEach(novel => {
      insertNovel.run([
        novel.id, novel.title, novel.author, novel.description,
        novel.coverImage, novel.genre, novel.status, novel.totalChapters, novel.lastUpdated
      ]);
    });

    insertNovel.finalize();

    // Insert chapters
    const insertChapter = db.prepare(`
      INSERT INTO chapters (novelId, number, title, publishDate)
      VALUES (?, ?, ?, ?)
    `);

    seedData.chapters.forEach(chapter => {
      insertChapter.run([chapter.novelId, chapter.number, chapter.title, chapter.publishDate]);
    });

    insertChapter.finalize();

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

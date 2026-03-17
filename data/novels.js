const { getDb } = require('../database/db');
const { getCoverImageUrl, getChapterContent, chapterExists } = require('../config/aws');

/**
 * Get all novels
 * @returns {Promise<Array>} Array of all novels with chapters
 */
function getAllNovels() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const query = `
      SELECT n.*, 
             GROUP_CONCAT(
               json_object(
                 'number', c.number,
                 'title', c.title,
                 'publishDate', c.publishDate
               )
               ORDER BY c.number
             ) as chapters_json
      FROM novels n
      LEFT JOIN chapters c ON n.id = c.novelId
      GROUP BY n.id
      ORDER BY n.lastUpdated DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const novels = rows.map(row => {
        const novel = { ...row };
        
        // Add full cover image URL
        novel.coverImageUrl = getCoverImageUrl(novel.coverImage);
        
        // Parse chapters JSON
        if (row.chapters_json) {
          try {
            novel.chapters = row.chapters_json.split(',').map(chapterStr => JSON.parse(chapterStr));
          } catch (e) {
            novel.chapters = [];
          }
        } else {
          novel.chapters = [];
        }

        delete novel.chapters_json;
        return novel;
      });

      resolve(novels);
    });
  });
}

/**
 * Get a novel by ID
 * @param {string} novelId - The novel ID
 * @returns {Promise<Object|null>} Novel object or null if not found
 */
function getNovelById(novelId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const novelQuery = 'SELECT * FROM novels WHERE id = ?';
    const chaptersQuery = 'SELECT number, title, publishDate FROM chapters WHERE novelId = ? ORDER BY number';

    db.get(novelQuery, [novelId], (err, novel) => {
      if (err) {
        reject(err);
        return;
      }

      if (!novel) {
        resolve(null);
        return;
      }

      // Add full cover image URL
      novel.coverImageUrl = getCoverImageUrl(novel.coverImage);

      db.all(chaptersQuery, [novelId], (err, chapters) => {
        if (err) {
          reject(err);
          return;
        }

        novel.chapters = chapters || [];
        resolve(novel);
      });
    });
  });
}

/**
 * Search novels by title, author, or genre
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching novels
 */
function searchNovels(query) {
  return new Promise(async (resolve, reject) => {
    if (!query || typeof query !== 'string') {
      try {
        const allNovels = await getAllNovels();
        resolve(allNovels);
      } catch (error) {
        reject(error);
      }
      return;
    }

    const db = getDb();
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const searchQuery = `
      SELECT n.*, 
             GROUP_CONCAT(
               json_object(
                 'number', c.number,
                 'title', c.title,
                 'publishDate', c.publishDate
               )
               ORDER BY c.number
             ) as chapters_json
      FROM novels n
      LEFT JOIN chapters c ON n.id = c.novelId
      WHERE LOWER(n.title) LIKE ? 
         OR LOWER(n.author) LIKE ? 
         OR LOWER(n.genre) LIKE ? 
         OR LOWER(n.description) LIKE ?
      GROUP BY n.id
      ORDER BY n.lastUpdated DESC
    `;

    db.all(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const novels = rows.map(row => {
        const novel = { ...row };
        
        if (row.chapters_json) {
          try {
            novel.chapters = row.chapters_json.split(',').map(chapterStr => JSON.parse(chapterStr));
          } catch (e) {
            novel.chapters = [];
          }
        } else {
          novel.chapters = [];
        }

        // Add full cover image URL
        novel.coverImageUrl = getCoverImageUrl(novel.coverImage);

        delete novel.chapters_json;
        return novel;
      });

      resolve(novels);
    });
  });
}

/**
 * Get chapter information for a specific novel and chapter number
 * @param {string} novelId - The novel ID
 * @param {number} chapterNumber - The chapter number
 * @returns {Promise<Object|null>} Chapter object or null if not found
 */
function getChapterInfo(novelId, chapterNumber) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const query = 'SELECT * FROM chapters WHERE novelId = ? AND number = ?';

    db.get(query, [novelId, parseInt(chapterNumber)], (err, chapter) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(chapter || null);
    });
  });
}

/**
 * Get navigation information for a chapter
 * @param {string} novelId - The novel ID
 * @param {number} chapterNumber - The current chapter number
 * @returns {Promise<Object|null>} Navigation information
 */
function getChapterNavigation(novelId, chapterNumber) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const query = `
      SELECT number, title FROM chapters 
      WHERE novelId = ? 
      ORDER BY number
    `;

    db.all(query, [novelId], (err, chapters) => {
      if (err) {
        reject(err);
        return;
      }

      if (!chapters || chapters.length === 0) {
        resolve(null);
        return;
      }

      const currentChapter = parseInt(chapterNumber);
      const totalChapters = chapters.length;

      const navigation = {
        currentChapter,
        totalChapters,
        hasPrevious: currentChapter > 1,
        hasNext: currentChapter < totalChapters,
        previousChapter: currentChapter > 1 ? currentChapter - 1 : null,
        nextChapter: currentChapter < totalChapters ? currentChapter + 1 : null,
        allChapters: chapters.map(ch => ({
          number: ch.number,
          title: ch.title
        }))
      };

      resolve(navigation);
    });
  });
}

/**
 * Get novels by genre
 * @param {string} genre - The genre to filter by
 * @returns {Promise<Array>} Array of novels in the specified genre
 */
function getNovelsByGenre(genre) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const query = `
      SELECT n.*, 
             GROUP_CONCAT(
               json_object(
                 'number', c.number,
                 'title', c.title,
                 'publishDate', c.publishDate
               )
               ORDER BY c.number
             ) as chapters_json
      FROM novels n
      LEFT JOIN chapters c ON n.id = c.novelId
      WHERE LOWER(n.genre) = LOWER(?)
      GROUP BY n.id
      ORDER BY n.lastUpdated DESC
    `;

    db.all(query, [genre], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const novels = rows.map(row => {
        const novel = { ...row };
        
        if (row.chapters_json) {
          try {
            novel.chapters = row.chapters_json.split(',').map(chapterStr => JSON.parse(chapterStr));
          } catch (e) {
            novel.chapters = [];
          }
        } else {
          novel.chapters = [];
        }

        // Add full cover image URL
        novel.coverImageUrl = getCoverImageUrl(novel.coverImage);

        delete novel.chapters_json;
        return novel;
      });

      resolve(novels);
    });
  });
}

/**
 * Get all unique genres
 * @returns {Promise<Array>} Array of unique genres
 */
function getAllGenres() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const query = 'SELECT DISTINCT genre FROM novels ORDER BY genre';

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const genres = rows.map(row => row.genre);
      resolve(genres);
    });
  });
}

/**
 * Get chapter information with content from S3
 * @param {string} novelId - The novel ID
 * @param {number} chapterNumber - The chapter number
 * @returns {Promise<Object|null>} Chapter object with content or null if not found
 */
async function getChapterWithContent(novelId, chapterNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = getDb();
      const query = 'SELECT * FROM chapters WHERE novelId = ? AND number = ?';

      db.get(query, [novelId, parseInt(chapterNumber)], async (err, chapter) => {
        if (err) {
          reject(err);
          return;
        }

        if (!chapter) {
          resolve(null);
          return;
        }

        try {
          // Check if chapter content exists and fetch it
          const contentExists = await chapterExists(novelId, chapterNumber);
          if (contentExists) {
            const content = await getChapterContent(novelId, chapterNumber);
            chapter.content = content;
            chapter.hasContent = true;
          } else {
            chapter.content = 'Chương này chưa được cập nhật.';
            chapter.hasContent = false;
          }
chapter.content="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
          resolve(chapter);
        } catch (contentError) {
          console.error('Error fetching chapter content:', contentError);
          chapter.content = 'Không thể tải nội dung chương.';
          chapter.hasContent = false;
          resolve(chapter);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getAllNovels,
  getNovelById,
  searchNovels,
  getChapterInfo,
  getChapterWithContent,
  getChapterNavigation,
  getNovelsByGenre,
  getAllGenres
};
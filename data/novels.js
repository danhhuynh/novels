// Mock data for novels and chapters
// In a real application, this would come from a database

const novels = [
  {
    id: 'the-great-adventure',
    title: 'The Great Adventure',
    author: 'John Smith',
    description: 'An epic tale of courage and discovery in uncharted lands.',
    coverImage: '/images/covers/great-adventure.jpg',
    genre: 'Adventure',
    status: 'Completed',
    chapters: [
      { number: 1, title: 'The Journey Begins', publishDate: '2024-01-01' },
      { number: 2, title: 'Into the Unknown', publishDate: '2024-01-02' },
      { number: 3, title: 'The First Challenge', publishDate: '2024-01-03' },
      { number: 4, title: 'New Allies', publishDate: '2024-01-04' },
      { number: 5, title: 'The Final Battle', publishDate: '2024-01-05' }
    ],
    totalChapters: 5,
    lastUpdated: '2024-01-05'
  },
  {
    id: 'mystery-mansion',
    title: 'Mystery of the Old Mansion',
    author: 'Emily Watson',
    description: 'A thrilling mystery set in a haunted Victorian mansion.',
    coverImage: '/images/covers/mystery-mansion.jpg',
    genre: 'Mystery',
    status: 'Ongoing',
    chapters: [
      { number: 1, title: 'The Invitation', publishDate: '2024-02-01' },
      { number: 2, title: 'Arrival at Midnight', publishDate: '2024-02-03' },
      { number: 3, title: 'Strange Sounds', publishDate: '2024-02-05' },
      { number: 4, title: 'The Hidden Room', publishDate: '2024-02-07' }
    ],
    totalChapters: 4,
    lastUpdated: '2024-02-07'
  },
  {
    id: 'fantasy-realm',
    title: 'Chronicles of the Fantasy Realm',
    author: 'Michael Chang',
    description: 'A magical journey through mystical lands filled with dragons and wizards.',
    coverImage: '/images/covers/fantasy-realm.jpg',
    genre: 'Fantasy',
    status: 'Ongoing',
    chapters: [
      { number: 1, title: 'The Chosen One', publishDate: '2024-03-01' },
      { number: 2, title: 'First Magic', publishDate: '2024-03-03' },
      { number: 3, title: 'Dragon Encounter', publishDate: '2024-03-05' },
      { number: 4, title: 'The Ancient Prophecy', publishDate: '2024-03-07' },
      { number: 5, title: 'Alliance of Mages', publishDate: '2024-03-09' }
    ],
    totalChapters: 5,
    lastUpdated: '2024-03-09'
  },
  {
    id: 'space-odyssey',
    title: 'Stellar Odyssey',
    author: 'Sarah Johnson',
    description: 'An interstellar adventure spanning multiple galaxies.',
    coverImage: '/images/covers/space-odyssey.jpg',
    genre: 'Science Fiction',
    status: 'Ongoing',
    chapters: [
      { number: 1, title: 'Launch Day', publishDate: '2024-03-10' },
      { number: 2, title: 'First Contact', publishDate: '2024-03-11' },
      { number: 3, title: 'Alien Civilization', publishDate: '2024-03-12' }
    ],
    totalChapters: 3,
    lastUpdated: '2024-03-12'
  },
  {
    id: 'romantic-tale',
    title: 'Love in the City',
    author: 'Lisa Chen',
    description: 'A heartwarming romance set in modern-day New York.',
    coverImage: '/images/covers/romantic-tale.jpg',
    genre: 'Romance',
    status: 'Completed',
    chapters: [
      { number: 1, title: 'Coffee Shop Meeting', publishDate: '2024-01-15' },
      { number: 2, title: 'Second Chances', publishDate: '2024-01-16' },
      { number: 3, title: 'Misunderstandings', publishDate: '2024-01-17' },
      { number: 4, title: 'Truth Revealed', publishDate: '2024-01-18' },
      { number: 5, title: 'Happy Ever After', publishDate: '2024-01-19' }
    ],
    totalChapters: 5,
    lastUpdated: '2024-01-19'
  }
];

/**
 * Get all novels
 * @returns {Array} Array of all novels
 */
function getAllNovels() {
  return novels;
}

/**
 * Get a novel by ID
 * @param {string} novelId - The novel ID
 * @returns {Object|null} Novel object or null if not found
 */
function getNovelById(novelId) {
  return novels.find(novel => novel.id === novelId) || null;
}

/**
 * Search novels by title, author, or genre
 * @param {string} query - Search query
 * @returns {Array} Array of matching novels
 */
function searchNovels(query) {
  if (!query || typeof query !== 'string') {
    return novels;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return novels.filter(novel => 
    novel.title.toLowerCase().includes(searchTerm) ||
    novel.author.toLowerCase().includes(searchTerm) ||
    novel.genre.toLowerCase().includes(searchTerm) ||
    novel.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get chapter information for a specific novel and chapter number
 * @param {string} novelId - The novel ID
 * @param {number} chapterNumber - The chapter number
 * @returns {Object|null} Chapter object or null if not found
 */
function getChapterInfo(novelId, chapterNumber) {
  const novel = getNovelById(novelId);
  if (!novel) return null;

  const chapter = novel.chapters.find(ch => ch.number === parseInt(chapterNumber));
  return chapter || null;
}

/**
 * Get navigation information for a chapter
 * @param {string} novelId - The novel ID
 * @param {number} chapterNumber - The current chapter number
 * @returns {Object} Navigation information
 */
function getChapterNavigation(novelId, chapterNumber) {
  const novel = getNovelById(novelId);
  if (!novel) return null;

  const currentChapter = parseInt(chapterNumber);
  const totalChapters = novel.chapters.length;

  return {
    currentChapter,
    totalChapters,
    hasPrevious: currentChapter > 1,
    hasNext: currentChapter < totalChapters,
    previousChapter: currentChapter > 1 ? currentChapter - 1 : null,
    nextChapter: currentChapter < totalChapters ? currentChapter + 1 : null,
    allChapters: novel.chapters.map(ch => ({
      number: ch.number,
      title: ch.title
    }))
  };
}

/**
 * Get novels by genre
 * @param {string} genre - The genre to filter by
 * @returns {Array} Array of novels in the specified genre
 */
function getNovelsByGenre(genre) {
  return novels.filter(novel => 
    novel.genre.toLowerCase() === genre.toLowerCase()
  );
}

/**
 * Get all unique genres
 * @returns {Array} Array of unique genres
 */
function getAllGenres() {
  const genres = new Set(novels.map(novel => novel.genre));
  return Array.from(genres).sort();
}

module.exports = {
  getAllNovels,
  getNovelById,
  searchNovels,
  getChapterInfo,
  getChapterNavigation,
  getNovelsByGenre,
  getAllGenres
};
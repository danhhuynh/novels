const express = require('express');
const router = express.Router();
const { getNovelById, getNovelsByGenre } = require('../data/novels');

// Novel detail page route
router.get('/:novelId', (req, res) => {
  const { novelId } = req.params;
  const novel = getNovelById(novelId);
  
  if (!novel) {
    return res.status(404).render('error', {
      title: 'Novel Not Found',
      message: 'The novel you are looking for does not exist.',
      statusCode: 404
    });
  }

  res.render('novel-detail', {
    title: `${novel.title} - Chapters`,
    novel
  });
});

// Genre filter route
router.get('/genre/:genre', (req, res) => {
  const { genre } = req.params;
  const novels = getNovelsByGenre(genre);
  
  res.render('index', {
    title: `${genre} Novels`,
    novels,
    searchQuery: '',
    genres: [],
    totalNovels: novels.length,
    searchResultsCount: novels.length,
    currentGenre: genre
  });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { getAllNovels, searchNovels, getAllGenres } = require('../data/novels');

// Homepage route
router.get('/', (req, res) => {
  const searchQuery = req.query.search || '';
  const novels = searchQuery ? searchNovels(searchQuery) : getAllNovels();
  const genres = getAllGenres();
  
  res.render('index', {
    title: 'Novel Reading Website',
    novels,
    searchQuery,
    genres,
    totalNovels: getAllNovels().length,
    searchResultsCount: novels.length
  });
});

// Search route (AJAX endpoint)
router.get('/search', (req, res) => {
  const searchQuery = req.query.q || '';
  const novels = searchQuery ? searchNovels(searchQuery) : getAllNovels();
  
  res.json({
    novels,
    searchQuery,
    totalResults: novels.length
  });
});

module.exports = router;
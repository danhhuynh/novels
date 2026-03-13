const express = require('express');
const router = express.Router();
const { getAllNovels, searchNovels, getAllGenres } = require('../data/novels');

// Homepage route
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const novels = searchQuery ? await searchNovels(searchQuery) : await getAllNovels();
    const genres = await getAllGenres();
    const allNovels = await getAllNovels();

    res.render('index', {
      title: 'Novel Reading Website',
      novels,
      searchQuery,
      genres,
      totalNovels: allNovels.length,
      searchResultsCount: novels.length
    });
  } catch (err) {
    console.error('Error in homepage route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Failed to load novels.',
      statusCode: 500
    });
  }
});

// Search route (AJAX endpoint)
router.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const novels = searchQuery ? await searchNovels(searchQuery) : await getAllNovels();

    res.json({
      novels,
      searchQuery,
      totalResults: novels.length
    });
  } catch (err) {
    console.error('Error in search API:', err);
    res.status(500).json({ error: 'Failed to search novels' });
  }
});

// API Get All Novels
router.get('/novels', async (req, res) => {
  try {
    const novels = await getAllNovels();
    res.json(novels);
  } catch (err) {
    console.error('Error in novels API:', err);
    res.status(500).json({ error: 'Failed to fetch novels' });
  }
});

module.exports = router;
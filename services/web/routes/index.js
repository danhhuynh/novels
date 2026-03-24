const express = require('express');
const router = express.Router();
const { getAllNovels, searchNovels, getAllGenres } = require('../../../shared/data/novels');
const { getCoverImageStream } = require('../../../shared/config/aws');

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

// S3 Image Proxy Route
router.get('/proxy-cover/:filename', (req, res) => {
  const { filename } = req.params;
  try {
    const stream = getCoverImageStream(filename);

    // Set basic headers
    if (filename.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    else if (filename.endsWith('.png')) res.setHeader('Content-Type', 'image/png');

    stream.on('error', (err) => {
      console.error('S3 Stream Error:', err);
      if (!res.headersSent) res.status(404).send('Not Found');
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Proxy Cover Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
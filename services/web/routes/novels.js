const express = require('express');
const router = express.Router();
const { getNovelById, getNovelsByGenre } = require('../../../shared/data/novels');

// Novel detail page route
router.get('/:novelId', async (req, res) => {
  try {
    const { novelId } = req.params;
    const novel = await getNovelById(novelId);

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
  } catch (err) {
    console.error('Error in novel detail route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Failed to load novel.',
      statusCode: 500
    });
  }
});

// Genre filter route
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const novels = await getNovelsByGenre(genre);

    res.render('index', {
      title: `${genre} Novels`,
      novels,
      searchQuery: '',
      genres: [],
      totalNovels: novels.length,
      searchResultsCount: novels.length,
      currentGenre: genre
    });
  } catch (err) {
    console.error('Error in genre filter route:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Failed to load novels by genre.',
      statusCode: 500
    });
  }
});

module.exports = router;
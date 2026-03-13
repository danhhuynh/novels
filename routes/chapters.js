const express = require('express');
const router = express.Router();
const { getNovelById, getChapterInfo, getChapterNavigation, getChapterWithContent } = require('../data/novels');

// Chapter reading page route
router.get('/:novelId/:chapterNumber', async (req, res) => {
  try {
    const { novelId, chapterNumber } = req.params;
    const chapterNum = parseInt(chapterNumber);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return res.status(400).render('error', {
        title: 'Invalid Chapter',
        message: 'Invalid chapter number provided.',
        statusCode: 400
      });
    }

    const novel = await getNovelById(novelId);
    if (!novel) {
      return res.status(404).render('error', {
        title: 'Novel Not Found',
        message: 'The novel you are looking for does not exist.',
        statusCode: 404
      });
    }

    const chapterInfo = await getChapterInfo(novelId, chapterNum);
    if (!chapterInfo) {
      return res.status(404).render('error', {
        title: 'Chapter Not Found',
        message: 'The chapter you are looking for does not exist.',
        statusCode: 404
      });
    }

    const navigation = await getChapterNavigation(novelId, chapterNum);

    // Try to get content from S3, fall back to sample
    let chapterContent;
    try {
      const chapterWithContent = await getChapterWithContent(novelId, chapterNum);
      chapterContent = chapterWithContent.content;
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      chapterContent = generateSampleContent(novel.title, chapterInfo.title, chapterNum);
    }

    res.render('chapter', {
      title: `${novel.title} - Chapter ${chapterNum}: ${chapterInfo.title}`,
      novel,
      chapter: chapterInfo,
      chapterContent,
      navigation,
      chapterNumber: chapterNum
    });

  } catch (error) {
    console.error('Error in chapter route:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while loading the chapter.',
      statusCode: 500
    });
  }
});

// Chapter navigation API endpoint
router.get('/:novelId/:chapterNumber/nav', async (req, res) => {
  try {
    const { novelId, chapterNumber } = req.params;
    const chapterNum = parseInt(chapterNumber);

    const novel = await getNovelById(novelId);
    if (!novel) {
      return res.status(404).json({ error: 'Novel not found' });
    }

    const navigation = await getChapterNavigation(novelId, chapterNum);
    if (!navigation) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(navigation);
  } catch (error) {
    console.error('Error in chapter nav API:', error);
    res.status(500).json({ error: 'Failed to load navigation' });
  }
});

function generateSampleContent(novelTitle, chapterTitle, chapterNumber) {
  return `
<h2>Chapter ${chapterNumber}: ${chapterTitle}</h2>
<p>Nội dung chương ${chapterNumber} của "${novelTitle}" đang được cập nhật.</p>
<p>Vui lòng quay lại sau để đọc nội dung mới nhất.</p>
  `.trim();
}

module.exports = router;
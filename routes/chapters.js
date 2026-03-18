const express = require('express');
const router = express.Router();
const { getNovelById, getChapterInfo, getChapterNavigation, getChapterWithContent } = require('../data/novels');

// Middleware to block common bots/programmatic access (anti-theft)
const antiBotMiddleware = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const accept = req.get('Accept') || '';
  const secFetchDest = req.get('Sec-Fetch-Dest');
  const secFetchMode = req.get('Sec-Fetch-Mode');
  const xRequestedWith = req.get('X-Requested-With');

  // 1. Block known simple programmatic agents
  const blockedAgents = ['curl', 'postman', 'python', 'wget', 'httpie', 'insomnia', 'java', 'node', 'go-http-client', 'axios', 'node-fetch', 'libwww-perl'];
  const uaLower = userAgent.toLowerCase();

  // If no User-Agent, block
  if (!userAgent) {
    return serveBotError(res, 'Missing User-Agent');
  }

  // If known bot User-Agent, block
  for (const bot of blockedAgents) {
    if (uaLower.includes(bot)) {
      return serveBotError(res, 'Prohibited User-Agent');
    }
  }

  // 2. Browser request hints
  // Web browsers request HTML when loading a page
  if (!accept.includes('text/html')) {
    return serveBotError(res, 'Invalid Accept Header');
  }

  // 3. Modern browser Fetch Metadata ( highly reliable if present )
  // Browsers loading a top-level page will send Sec-Fetch-Dest: document or Sec-Fetch-Mode: navigate
  if (secFetchDest && secFetchDest !== 'document' && secFetchDest !== 'empty' && secFetchMode !== 'navigate') {
    // An iframe or image trying to fetch this HTML
    return serveBotError(res, 'Invalid Fetch Destination');
  }

  // 4. Block common AJAX scrape patterns on the main chapter route
  if (xRequestedWith === 'XMLHttpRequest') {
    return serveBotError(res, 'Direct AJAX fetching blocked');
  }

  next(); // Passes checks, allow request
};

function serveBotError(res, reason) {
  return res.status(403).render('error', {
    title: 'Access Denied',
    message: 'We have detected unusual traffic from your network or client, which suggests automated access. For security and anti-theft reasons, programmatic access is blocked.',
    statusCode: 403
  });
}

// Chapter reading page route (Protected)
router.get('/:novelId/:chapterNumber', antiBotMiddleware, async (req, res) => {
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
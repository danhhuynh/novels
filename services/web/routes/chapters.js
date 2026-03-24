const express = require('express');
const router = express.Router();
const { getNovelById, getChapterInfo, getChapterNavigation, getChapterWithContent } = require('../../../shared/data/novels');

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

    // Inject stealth anti-theft watermarks into the final content before serving
    chapterContent = injectWatermarks(chapterContent);

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

/**
 * Injects randomized stealth watermarks into the HTML content to hinder scraping.
 * The text is visually hidden from readers but will be grabbed by bots and manual copiers.
 * @param {string} htmlContent - The raw chapter HTML
 * @returns {string} The watermarked HTML
 */
function injectWatermarks(htmlContent) {
  if (!htmlContent) return htmlContent;

  const domains = [
    'vonguquan.com',
    'vo-ngu-quan.com',
    'vongu-quan.com',
    'vo-nguquan.com',
    'vonguquan . com'
  ];

  const getWatermark = () => {
    const domain = domains[Math.floor(Math.random() * domains.length)];
    // Creates a subtle, visible credit within the text.
    return `<span style="opacity: 0.5; font-size: 0.85em; font-style: italic;"> (Nguồn truyện: ${domain}) </span>`;
  };

  // Attempt to split by paragraph endings
  let parts = htmlContent.split('</p>');

  if (parts.length > 2) {
    // Inject watermark in up to 3 random paragraphs
    let numWatermarks = Math.min(3, parts.length - 1);
    let targetIndexes = new Set();
    while (targetIndexes.size < numWatermarks) {
      targetIndexes.add(Math.floor(Math.random() * (parts.length - 1)));
    }
    for (let idx of targetIndexes) {
      parts[idx] = parts[idx] + getWatermark();
    }
    return parts.join('</p>');
  }

  // Alternative: Attempt to split by line breaks for plain text/br tags
  let brParts = htmlContent.split(/<br\s*\/?>/i);
  if (brParts.length > 2) {
    let numWatermarks = Math.min(3, brParts.length - 1);
    let targetIndexes = new Set();
    while (targetIndexes.size < numWatermarks) {
      targetIndexes.add(Math.floor(Math.random() * (brParts.length - 1)));
    }
    for (let idx of targetIndexes) {
      brParts[idx] = brParts[idx] + getWatermark();
    }
    return brParts.join('<br>');
  }

  // Fallback: split by period if no HTML tags found
  let dotParts = htmlContent.split('. ');
  if (dotParts.length > 5) {
    let numWatermarks = Math.min(3, dotParts.length - 1);
    let targetIndexes = new Set();
    while (targetIndexes.size < numWatermarks) {
      targetIndexes.add(Math.floor(Math.random() * (dotParts.length - 1)));
    }
    for (let idx of targetIndexes) {
      dotParts[idx] = dotParts[idx] + getWatermark() + '. ';
    }
    return dotParts.join('');
  }

  // Last resort
  return htmlContent + getWatermark();
}

module.exports = router;
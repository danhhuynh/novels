const express = require('express');
const router = express.Router();
const { getNovelById, getChapterInfo, getChapterNavigation } = require('../data/novels');
const S3Service = require('../services/s3Service');

const s3Service = new S3Service();

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

    // Get novel and chapter information
    const novel = getNovelById(novelId);
    if (!novel) {
      return res.status(404).render('error', {
        title: 'Novel Not Found',
        message: 'The novel you are looking for does not exist.',
        statusCode: 404
      });
    }

    const chapterInfo = getChapterInfo(novelId, chapterNum);
    if (!chapterInfo) {
      return res.status(404).render('error', {
        title: 'Chapter Not Found',
        message: 'The chapter you are looking for does not exist.',
        statusCode: 404
      });
    }

    // Get navigation information
    const navigation = getChapterNavigation(novelId, chapterNum);
    
    // Fetch chapter content from S3
    let chapterContent;
    try {
      chapterContent = await s3Service.getChapterContent(novelId, chapterNum);
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      
      // Fallback to sample content if S3 fetch fails
      chapterContent = generateSampleChapterContent(novel.title, chapterInfo.title, chapterNum);
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
router.get('/:novelId/:chapterNumber/nav', (req, res) => {
  const { novelId, chapterNumber } = req.params;
  const chapterNum = parseInt(chapterNumber);
  
  const novel = getNovelById(novelId);
  if (!novel) {
    return res.status(404).json({ error: 'Novel not found' });
  }

  const navigation = getChapterNavigation(novelId, chapterNum);
  if (!navigation) {
    return res.status(404).json({ error: 'Chapter not found' });
  }

  res.json(navigation);
});

/**
 * Generate sample chapter content for demonstration purposes
 * This would not be needed in production where content comes from S3
 */
function generateSampleChapterContent(novelTitle, chapterTitle, chapterNumber) {
  return `
<h2>Chapter ${chapterNumber}: ${chapterTitle}</h2>

<p>This is sample content for "${novelTitle}" - Chapter ${chapterNumber}.</p>

<p>In a real application, this content would be fetched from the S3 bucket. The S3 service is configured to look for files with the following pattern:</p>

<p><code>novels/{novelId}/chapters/chapter-{chapterNumber}.txt</code></p>

<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

<p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>

<blockquote>
<p>"This is where the exciting part of ${novelTitle} begins. The adventure unfolds as our characters face new challenges and discoveries."</p>
</blockquote>

<p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>

<p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>

<p>To be continued in the next chapter...</p>
  `.trim();
}

module.exports = router;
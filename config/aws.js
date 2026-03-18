require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION
});

const s3 = new AWS.S3();

const config = {
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION,
  bucketUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`
};

/**
 * Get cover image URL (Proxy through server to avoid 403 on private bucket)
 * @param {string} coverImage - Cover image filename
 * @returns {string} Proxy URL to cover image
 */
function getCoverImageUrl(coverImage) {
  if (!coverImage) return null;
  return `/api/proxy-cover/${encodeURIComponent(coverImage)}`;
}

/**
 * Get cover image stream from S3
 * @param {string} coverImage - Cover image filename
 * @returns {Object} S3 read stream
 */
function getCoverImageStream(coverImage) {
  const params = {
    Bucket: config.bucketName,
    Key: `images/${coverImage}`
  };
  return s3.getObject(params).createReadStream();
}

/**
 * Get chapter folder for S3 (e.g. 0-99 => 0, 100-199 => 100, 300-399 => 300)
 * @param {number} chapterNumber
 * @returns {number} Folder name
 */
function getChapterFolder(chapterNumber) {
  return Math.floor(chapterNumber / 100) * 100;
}

/**
 * Get chapter content URL
 * @param {string} novelId - Novel ID
 * @param {number} chapterNumber - Chapter number
 * @returns {string} Full URL to chapter content
 */
function getChapterContentUrl(novelId, chapterNumber) {
  const folder = getChapterFolder(chapterNumber);
  return `${config.bucketUrl}/novels/${novelId}/${folder}/chuong-${chapterNumber}.txt`;
}

/**
 * Fetch chapter content from S3 bucket
 * @param {string} novelId - Novel ID
 * @param {number} chapterNumber - Chapter number
 * @returns {Promise<string>} Chapter content text
 */
async function getChapterContent(novelId, chapterNumber) {
  try {
    const folder = getChapterFolder(chapterNumber);
    const key = `novels/${novelId}/${folder}/chuong-${chapterNumber}.txt`;
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    console.log(`[S3] Fetching chapter content:`, params);

    const data = await s3.getObject(params).promise();
    console.log(`[S3] Successfully fetched chapter content for ${novelId}/${folder}/chuong-${chapterNumber}.txt`);
    return data.Body.toString('utf-8');
  } catch (error) {
    console.error(`[S3] Error fetching chapter content for ${novelId}/chuong-${chapterNumber}.txt:`, error);
    throw error;
  }
}

/**
 * Check if chapter content exists in S3
 * @param {string} novelId - Novel ID
 * @param {number} chapterNumber - Chapter number
 * @returns {Promise<boolean>} True if chapter exists
 */
async function chapterExists(novelId, chapterNumber) {
  try {
    const folder = getChapterFolder(chapterNumber);
    const key = `novels/${novelId}/${folder}/chuong-${chapterNumber}.txt`;
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    console.log(`[S3] Checking if chapter exists:`, params);

    await s3.headObject(params).promise();
    console.log(`[S3] Chapter exists: ${novelId}/${folder}/chuong-${chapterNumber}.txt`);
    return true;
  } catch (error) {
    console.warn(`[S3] Chapter does NOT exist: ${novelId}/chuong-${chapterNumber}.txt`);
    return false;
  }
}

module.exports = {
  s3,
  config,
  getCoverImageUrl,
  getCoverImageStream,
  getChapterContentUrl,
  getChapterContent,
  chapterExists
};

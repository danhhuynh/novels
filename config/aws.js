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
  bucketUrl: `https://${process.env.S3_BUCKET_NAME}.${process.env.S3_REGION}.amazonaws.com`
};

/**
 * Get cover image URL
 * @param {string} coverImage - Cover image filename
 * @returns {string} Full URL to cover image
 */
function getCoverImageUrl(coverImage) {
  if (!coverImage) return null;
  return `${config.bucketUrl}/images/${coverImage}`;
}

/**
 * Get chapter content URL
 * @param {string} novelId - Novel ID
 * @param {number} chapterNumber - Chapter number
 * @returns {string} Full URL to chapter content
 */
function getChapterContentUrl(novelId, chapterNumber) {
  return `${config.bucketUrl}/novels/${novelId}/chuong-${chapterNumber}`;
}

/**
 * Fetch chapter content from S3 bucket
 * @param {string} novelId - Novel ID
 * @param {number} chapterNumber - Chapter number
 * @returns {Promise<string>} Chapter content text
 */
async function getChapterContent(novelId, chapterNumber) {
  try {
    const key = `novels/${novelId}/chuong-${chapterNumber}`;
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    console.log(`[S3] Fetching chapter content:`, params);

    const data = await s3.getObject(params).promise();
    console.log(`[S3] Successfully fetched chapter content for ${novelId}/chuong-${chapterNumber}`);
    return data.Body.toString('utf-8');
  } catch (error) {
    console.error(`[S3] Error fetching chapter content for ${novelId}/chuong-${chapterNumber}:`, error);
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
    const key = `novels/${novelId}/chuong-${chapterNumber}`;
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    console.log(`[S3] Checking if chapter exists:`, params);

    await s3.headObject(params).promise();
    console.log(`[S3] Chapter exists: ${novelId}/chuong-${chapterNumber}`);
    return true;
  } catch (error) {
    console.warn(`[S3] Chapter does NOT exist: ${novelId}/chuong-${chapterNumber}`);
    return false;
  }
}

module.exports = {
  s3,
  config,
  getCoverImageUrl,
  getChapterContentUrl,
  getChapterContent,
  chapterExists
};

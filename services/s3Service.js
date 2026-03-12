const AWS = require('aws-sdk');

class S3Service {
  constructor() {
    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION
    });

    this.s3 = new AWS.S3();
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  /**
   * Fetch chapter content from S3
   * @param {string} novelId - The novel identifier
   * @param {number} chapterNumber - The chapter number
   * @returns {Promise<string>} Chapter content as string
   */
  async getChapterContent(novelId, chapterNumber) {
    try {
      // Construct S3 object key
      // Example format: novels/{novelId}/chapters/chapter-{chapterNumber}.txt
      const key = `novels/${novelId}/chapters/chapter-${chapterNumber}.txt`;
      
      console.log(`Fetching chapter content from S3: ${key}`);

      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const response = await this.s3.getObject(params).promise();
      return response.Body.toString('utf-8');
    } catch (error) {
      console.error('Error fetching chapter from S3:', error);
      
      if (error.code === 'NoSuchKey') {
        throw new Error('Chapter not found');
      } else if (error.code === 'AccessDenied') {
        throw new Error('Access denied to S3 bucket');
      } else {
        throw new Error('Failed to fetch chapter content');
      }
    }
  }

  /**
   * Check if a chapter exists in S3
   * @param {string} novelId - The novel identifier
   * @param {number} chapterNumber - The chapter number
   * @returns {Promise<boolean>} True if chapter exists
   */
  async chapterExists(novelId, chapterNumber) {
    try {
      const key = `novels/${novelId}/chapters/chapter-${chapterNumber}.txt`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get list of available chapters for a novel
   * @param {string} novelId - The novel identifier
   * @returns {Promise<Array<number>>} Array of chapter numbers
   */
  async getAvailableChapters(novelId) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: `novels/${novelId}/chapters/`,
        Delimiter: '/'
      };

      const response = await this.s3.listObjectsV2(params).promise();
      const chapters = [];

      if (response.Contents) {
        response.Contents.forEach(object => {
          const match = object.Key.match(/chapter-(\d+)\.txt$/);
          if (match) {
            chapters.push(parseInt(match[1]));
          }
        });
      }

      return chapters.sort((a, b) => a - b);
    } catch (error) {
      console.error('Error listing chapters from S3:', error);
      return [];
    }
  }

  /**
   * Generate example S3 object keys for documentation
   * @returns {Array<string>} Example S3 object keys
   */
  static getExampleS3Keys() {
    return [
      'novels/the-great-adventure/chapters/chapter-1.txt',
      'novels/the-great-adventure/chapters/chapter-2.txt',
      'novels/the-great-adventure/chapters/chapter-3.txt',
      'novels/mystery-mansion/chapters/chapter-1.txt',
      'novels/mystery-mansion/chapters/chapter-2.txt',
      'novels/fantasy-realm/chapters/chapter-1.txt',
      'novels/fantasy-realm/chapters/chapter-2.txt',
      'novels/fantasy-realm/chapters/chapter-3.txt',
      'novels/fantasy-realm/chapters/chapter-4.txt'
    ];
  }
}

module.exports = S3Service;
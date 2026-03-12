# Novel Reading Website

A server-side rendered (SSR) Node.js application for reading novels with chapter content stored in AWS S3.

## Features

- **Homepage**: Browse novels with search and filtering capabilities
- **Novel Detail Pages**: View chapter lists for each novel
- **Chapter Reading**: Server-side rendered chapter content from S3
- **Navigation**: Previous/Next chapter navigation and chapter jumping
- **Search**: Real-time search by title, author, or genre
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Toggle between light and dark modes
- **Reading Preferences**: Adjustable font size and theme persistence
- **Keyboard Navigation**: Full keyboard accessibility

## Technology Stack

- **Backend**: Node.js with Express
- **Templating**: EJS for server-side rendering
- **Storage**: AWS S3 for chapter content
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **Security**: Helmet, rate limiting, and content security policies

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS account with S3 access

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your actual values:
     ```env
     PORT=3000
     NODE_ENV=development
     AWS_ACCESS_KEY_ID=your_actual_access_key_id
     AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key
     S3_BUCKET_NAME=your-actual-bucket-name
     S3_REGION=us-east-1
     ```

## AWS S3 Setup

### S3 Bucket Structure

The application expects chapter content to be stored in S3 with the following key pattern:

```
novels/{novelId}/chapters/chapter-{chapterNumber}.txt
```

### Example S3 Object Keys

Here are example S3 object keys that match the sample novels in the application:

```
novels/the-great-adventure/chapters/chapter-1.txt
novels/the-great-adventure/chapters/chapter-2.txt
novels/the-great-adventure/chapters/chapter-3.txt
novels/the-great-adventure/chapters/chapter-4.txt
novels/the-great-adventure/chapters/chapter-5.txt

novels/mystery-mansion/chapters/chapter-1.txt
novels/mystery-mansion/chapters/chapter-2.txt
novels/mystery-mansion/chapters/chapter-3.txt
novels/mystery-mansion/chapters/chapter-4.txt

novels/fantasy-realm/chapters/chapter-1.txt
novels/fantasy-realm/chapters/chapter-2.txt
novels/fantasy-realm/chapters/chapter-3.txt
novels/fantasy-realm/chapters/chapter-4.txt
novels/fantasy-realm/chapters/chapter-5.txt

novels/space-odyssey/chapters/chapter-1.txt
novels/space-odyssey/chapters/chapter-2.txt
novels/space-odyssey/chapters/chapter-3.txt

novels/romantic-tale/chapters/chapter-1.txt
novels/romantic-tale/chapters/chapter-2.txt
novels/romantic-tale/chapters/chapter-3.txt
novels/romantic-tale/chapters/chapter-4.txt
novels/romantic-tale/chapters/chapter-5.txt
```

### Creating Sample Content

To test the application, create text files in your S3 bucket with the above keys. Each file should contain the chapter content in plain text or HTML format.

Example chapter content:
```html
<h2>Chapter 1: The Journey Begins</h2>

<p>This is the beginning of our adventure...</p>

<p>The protagonist steps into a world of wonder and mystery.</p>

<blockquote>
<p>"Every journey begins with a single step."</p>
</blockquote>

<p>And so the story unfolds...</p>
```

### AWS IAM Permissions

Your AWS credentials need the following S3 permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

## Running the Application

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000` (or your configured PORT).

## Application Structure

```
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── routes/
│   ├── index.js              # Homepage and search routes
│   ├── novels.js             # Novel detail routes
│   └── chapters.js           # Chapter reading routes
├── views/
│   ├── partials/
│   │   ├── header.ejs        # Common header
│   │   └── footer.ejs        # Common footer
│   ├── index.ejs             # Homepage template
│   ├── novel-detail.ejs      # Novel detail page template
│   ├── chapter.ejs           # Chapter reading template
│   └── error.ejs             # Error page template
├── public/
│   ├── css/
│   │   └── styles.css        # Main stylesheet
│   └── js/
│       └── main.js           # Client-side JavaScript
├── services/
│   └── s3Service.js          # AWS S3 integration service
└── data/
    └── novels.js             # Mock novel data (replace with database)
```

## API Endpoints

- `GET /` - Homepage with novel list and search
- `GET /search?q={query}` - Search API endpoint
- `GET /novels/{novelId}` - Novel detail page
- `GET /novels/genre/{genre}` - Filter novels by genre
- `GET /chapters/{novelId}/{chapterNumber}` - Chapter reading page
- `GET /chapters/{novelId}/{chapterNumber}/nav` - Chapter navigation API

## Customization

### Adding New Novels

To add new novels, update the `data/novels.js` file with the novel information:

```javascript
{
  id: 'novel-id',                    // Used in S3 keys and URLs
  title: 'Novel Title',
  author: 'Author Name',
  description: 'Novel description',
  coverImage: '/images/cover.jpg',   // Optional
  genre: 'Genre',
  status: 'Ongoing',                 // 'Ongoing' or 'Completed'
  chapters: [
    { number: 1, title: 'Chapter Title', publishDate: '2024-01-01' },
    // ... more chapters
  ],
  totalChapters: 1,
  lastUpdated: '2024-01-01'
}
```

### Styling Customization

The application uses CSS custom properties (variables) for easy theming. Modify the `:root` selector in `public/css/styles.css`:

```css
:root {
  --primary-color: #2563eb;        /* Main brand color */
  --primary-hover: #1d4ed8;        /* Hover state */
  --secondary-color: #64748b;      /* Secondary elements */
  --accent-color: #f59e0b;         /* Accent/highlight color */
  /* ... other variables */
}
```

## Production Deployment

1. **Environment Variables**: Set production environment variables
2. **Process Management**: Use PM2 or similar for process management
3. **Reverse Proxy**: Configure Nginx or similar for reverse proxy
4. **SSL**: Enable HTTPS for production
5. **Monitoring**: Set up application monitoring and logging

Example PM2 configuration:
```bash
pm2 start server.js --name "novel-website"
```

## Security Considerations

- Environment variables are used for sensitive configuration
- Rate limiting is enabled to prevent abuse
- Content Security Policy (CSP) headers are configured
- Input validation on search queries
- AWS credentials should use least-privilege principle

## Performance Features

- Server-side rendering for fast initial page loads
- Gzip compression enabled
- CSS and JavaScript minification ready
- Lazy loading for images
- Local storage for user preferences
- Efficient S3 content caching (can be enhanced)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ features used
- CSS Grid and Flexbox for layout
- Progressive enhancement approach

## Troubleshooting

### Common Issues

1. **AWS Credentials Error**:
   - Verify your `.env` file has correct AWS credentials
   - Check IAM permissions for S3 access

2. **Chapter Content Not Loading**:
   - Verify S3 object keys match the expected pattern
   - Check S3 bucket permissions
   - Look for errors in console logs

3. **Search Not Working**:
   - Ensure JavaScript is enabled
   - Check browser console for errors

4. **Styling Issues**:
   - Clear browser cache
   - Check if CSS file is loading correctly

### Logs

Application logs are output to the console. In production, consider using a logging service like Winston or Bunyan.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

## Development Notes

This application serves as a complete example of a server-side rendered Node.js application with:
- Modern Express.js patterns
- EJS templating best practices
- AWS S3 integration
- Responsive web design
- Accessibility considerations
- Security best practices

The code is well-documented and structured for easy maintenance and extension.
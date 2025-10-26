import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://www.learnmates.org';

// Base routes that are always included
const baseRoutes = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/curriculum', changefreq: 'weekly', priority: 0.9 },
  { url: '/curriculum-page', changefreq: 'weekly', priority: 0.8 },
  { url: '/topic', changefreq: 'daily', priority: 0.8 },
  { url: '/donate', changefreq: 'monthly', priority: 0.7 },
  { url: '/contribute', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
];

// Function to scan directory and get topic routes
function getTopicRoutes() {
  const documentsPath = path.join(__dirname, '../public/documents');
  const topicRoutes = [];

  // Get all files recursively from documents folder
  function scanDir(dir) {
    const files = readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        // Try each pattern to match topic number
        let topicNumber = null;
        
        // Check IAL pattern
        let match = file.name.match(/IAL .*?U\d+ topic (\d+)/i);
        if (match) topicNumber = match[1];
        
        // Check IGCSE pattern
        if (!topicNumber) {
          match = file.name.match(/IGCSE .*?(?:topic|chapter) (\d+)/i);
          if (match) topicNumber = match[1];
        }
        
        // Check A-Level pattern
        if (!topicNumber) {
          match = file.name.match(/(?:topic|chapter)\s*(\d+)/i);
          if (match) topicNumber = match[1];
        }

        if (topicNumber) {
          topicRoutes.push({
            url: `/topic/${topicNumber}`,
            changefreq: 'weekly',
            priority: 0.7
          });
        }
      }
    });
  }

  try {
    scanDir(documentsPath);
  } catch (err) {
    console.warn('Warning: Error scanning documents directory', err);
  }

  return topicRoutes;
}

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: baseUrl });
  const writeStream = createWriteStream(path.join(__dirname, '../public/sitemap.xml'));
  sitemap.pipe(writeStream);

  // Combine base routes and topic routes
  const allRoutes = [...baseRoutes, ...getTopicRoutes()];

  // Write all routes to sitemap
  allRoutes.forEach(route => {
    sitemap.write({
      url: route.url,
      changefreq: route.changefreq,
      priority: route.priority,
      lastmod: new Date().toISOString().split('T')[0]
    });
  });

  sitemap.end();
  await streamToPromise(sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap();
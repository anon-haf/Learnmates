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
  const subjects = ['Biology', 'Physics'];
  const topicRoutes = [];

  // Scan Chemistry topics (directly in documents folder)
  const chemistryFiles = readdirSync(documentsPath)
    .filter(file => file.endsWith('.pdf') && file.includes('topic'));

  chemistryFiles.forEach(file => {
    const match = file.match(/topic\s*(\d+)/i);
    if (match) {
      topicRoutes.push({
        url: `/topic/chemistry/${match[1]}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    }
  });

  // Scan other subjects
  subjects.forEach(subject => {
    const subjectPath = path.join(documentsPath, subject);
    try {
      const files = readdirSync(subjectPath);
      files.forEach(file => {
        const match = file.match(/Chapter\s*(\d+)/i);
        if (match) {
          topicRoutes.push({
            url: `/topic/${subject.toLowerCase()}/${match[1]}`,
            changefreq: 'weekly',
            priority: 0.7
          });
        }
      });
    } catch (err) {
      console.warn(`Warning: Could not read directory for ${subject}`);
    }
  });

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
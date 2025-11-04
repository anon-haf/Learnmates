import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://www.learnmates.org';

// Base routes that are always included
const baseRoutes = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/curriculum', changefreq: 'weekly', priority: 0.9 },
  { url: '/donate', changefreq: 'monthly', priority: 0.7 },
  { url: '/contribute', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 }
];

// Function to get topic routes from metadata
function getTopicRoutes() {
  const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
  let topicRoutes = [];

  try {
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));

    // Add topic routes from metadata
    Object.values(metadata.topics).forEach(topic => {
      topicRoutes.push({
        url: topic.url,
        changefreq: 'weekly',
        priority: 0.8
      });
    });
  } catch (err) {
    console.warn('Warning: Error reading metadata file', err);
  }

  return topicRoutes;
}

async function generateSitemap() {
  try {
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
    console.log(`Total routes: ${allRoutes.length}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

generateSitemap();
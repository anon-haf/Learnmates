const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

const baseUrl = 'https://www.learnmates.org';

const routes = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/curriculum', changefreq: 'weekly', priority: 0.9 },
  { url: '/curriculum-page', changefreq: 'weekly', priority: 0.8 },
  { url: '/topic', changefreq: 'daily', priority: 0.8 },
  { url: '/donate', changefreq: 'monthly', priority: 0.7 },
  { url: '/contribute', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
];

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: baseUrl });
  const writeStream = createWriteStream(path.join(__dirname, '../public/sitemap.xml'));
  sitemap.pipe(writeStream);

  routes.forEach(route => {
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
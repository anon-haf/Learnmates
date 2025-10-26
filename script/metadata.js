import path from 'path';
import { readdirSync } from 'fs';

// Default metadata that applies to all topics
const defaultMetadata = {
  publisher: "Learnmates",
  language: "English",
  website: "https://www.learnmates.org",
  copyright: `© ${new Date().getFullYear()} Learnmates`,
  format: "PDF",
  lastUpdated: new Date().toISOString(),
  // SEO metadata
  titleTemplate: "{subject} {topicName} - {level} {board} | Learnmates",
  descriptionTemplate: "Study {subject} {topicName} for {level} {board}. Access free study materials, video lessons, and practice questions. Learn at your own pace with Learnmates.",
  keywords: ["education", "study", "learning", "exam preparation", "online learning", "{subject}", "{level}", "{board}"],
  type: "article",
  site_name: "Learnmates"
};

// Regular expressions for extracting information from filenames
const patterns = {
  ial: /IAL (\w+) U(\d+) topic (\d+) Self-Study booklet\(@Aeth_en\)\.pdf$/,
  igcse: /IGCSE (\w+) (?:topic|chapter) (\d+).*\.(pdf|docx)$/,
  alevel: /(?:Chapter|Topic) (\d+)\.(pdf|docx)$/
};

// Map exam levels and boards
const examLevels = {
  ial: {
    level: 'A-Level',
    board: 'Edexcel',
    yearPattern: {
      '1': 'AS',
      '2': 'AS',
      '4': 'A2',
      '5': 'A2'
    }
  },
  igcse: {
    level: 'IGCSE',
    board: 'Cambridge'  // Default board
  },
  alevel: {
    level: 'A-Level',
    board: 'Cambridge'  // Default board
  }
};

// Extract metadata from filename
function extractMetadata(filename, defaultSubject = null) {
  // Try IAL pattern first
  let match = filename.match(patterns.ial);
  if (match) {
    const [, subject, unit, topic] = match;
    return {
      topicName: `Unit ${unit} Topic ${topic}`,
      topicNumber: parseInt(topic),
      unit: parseInt(unit),
      subject: subject,
      level: examLevels.ial.level,
      board: examLevels.ial.board,
      year: examLevels.ial.yearPattern[unit] || ''
    };
  }

  // Try IGCSE pattern
  match = filename.match(patterns.igcse);
  if (match) {
    const [, subject, topic] = match;
    return {
      topicName: `Topic ${topic}`,
      topicNumber: parseInt(topic),
      subject: subject,
      level: examLevels.igcse.level,
      board: examLevels.igcse.board
    };
  }

  // Try A-Level pattern
  match = filename.match(patterns.alevel);
  if (match && defaultSubject) {
    const [, topic] = match;
    return {
      topicName: `Topic ${topic}`,
      topicNumber: parseInt(topic),
      subject: defaultSubject,
      level: examLevels.alevel.level,
      board: examLevels.alevel.board
    };
  }

  return null;
}

// Generate metadata for a specific file
function generateTopicMetadata(filename, subject = null) {
  const specificMetadata = extractMetadata(filename, subject);

  if (!specificMetadata) {
    return null;
  }

  // Combine default and specific metadata
  const combinedMetadata = {
    ...defaultMetadata,
    ...specificMetadata,
    id: `${specificMetadata.subject.toLowerCase()}-${specificMetadata.topicNumber}`,
    slug: `${specificMetadata.subject.toLowerCase()}-topic-${specificMetadata.topicNumber}`
  };

  // Generate SEO title and description using templates
  combinedMetadata.title = combinedMetadata.titleTemplate
    .replace("{subject}", combinedMetadata.subject)
    .replace("{topicName}", combinedMetadata.topicName)
    .replace("{level}", combinedMetadata.level)
    .replace("{board}", combinedMetadata.board);

  combinedMetadata.description = combinedMetadata.descriptionTemplate
    .replace("{subject}", combinedMetadata.subject)
    .replace("{topicName}", combinedMetadata.topicName)
    .replace("{level}", combinedMetadata.level)
    .replace("{board}", combinedMetadata.board);

  return combinedMetadata;
}

// Helper function to process directory recursively
async function processDirectory(dir, metadata, defaultSubject = null) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // If it's a directory under /documents/, use its name as the subject
      const subject = defaultSubject || entry.name;
      await processDirectory(fullPath, metadata, subject);
    } else if (entry.isFile() && (entry.name.endsWith('.pdf') || entry.name.endsWith('.docx'))) {
      const topicMetadata = generateTopicMetadata(entry.name, defaultSubject);
      if (topicMetadata) {
        metadata.set(topicMetadata.id, topicMetadata);
      }
    }
  }
}

// Generate metadata for all topics in the documents directory
export async function generateAllMetadata() {
  const documentsPath = path.join(process.cwd(), 'public/documents');
  const metadata = new Map();

  try {
    await processDirectory(documentsPath, metadata);
  } catch (err) {
    console.error('Error processing documents:', err);
  }

  return Object.fromEntries(metadata);
}

// Example usage:
// const metadata = await generateAllMetadata();
// console.log(JSON.stringify(metadata, null, 2));
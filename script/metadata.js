import path from 'path';
import { readdirSync } from 'fs';

// Default metadata that applies to all topics
const defaultMetadata = {
  publisher: "Learnmates",
  language: "English",
  website: "https://www.learnmates.org",
  copyright: `© ${new Date().getFullYear()} Learnmates`,
  format: "PDF",
  lastUpdated: new Date().toISOString()
};

// Regular expressions for extracting information from filenames
const patterns = {
  chemistry: /IAL Chemistry U(\d+) topic (\d+) Self-Study booklet\(@Aeth_en\)\.pdf$/,
  biology: /Chapter (\d+)\.(pdf|docx)$/,
  physics: /Chapter (\d+)\.(pdf|docx)$/
};

// Map units to levels and boards
const unitToLevel = {
  // Chemistry
  '1': { level: 'A-Level', board: 'Edexcel', year: 'AS' },
  '2': { level: 'A-Level', board: 'Edexcel', year: 'AS' },
  '4': { level: 'A-Level', board: 'Edexcel', year: 'A2' },
  '5': { level: 'A-Level', board: 'Edexcel', year: 'A2' }
};

// Extract metadata from chemistry filename
function extractChemistryMetadata(filename) {
  const match = filename.match(patterns.chemistry);
  if (!match) return null;

  const [, unit, topic] = match;
  const unitInfo = unitToLevel[unit] || { level: 'A-Level', board: 'Edexcel' };

  return {
    topicName: `Unit ${unit} Topic ${topic}`,
    topicNumber: parseInt(topic),
    unit: parseInt(unit),
    subject: 'Chemistry',
    ...unitInfo
  };
}

// Extract metadata from biology/physics filename
function extractSubjectMetadata(filename, subject) {
  const pattern = patterns[subject.toLowerCase()];
  const match = filename.match(pattern);
  if (!match) return null;

  const [, chapter] = match;
  return {
    topicName: `Chapter ${chapter}`,
    topicNumber: parseInt(chapter),
    subject: subject,
    level: 'A-Level',
    board: 'Cambridge'
  };
}

// Generate metadata for a specific file
function generateTopicMetadata(filename, subject = null) {
  let specificMetadata;

  if (filename.includes('Chemistry')) {
    specificMetadata = extractChemistryMetadata(filename);
  } else if (subject) {
    specificMetadata = extractSubjectMetadata(filename, subject);
  }

  if (!specificMetadata) {
    return null;
  }

  // Combine default and specific metadata
  return {
    ...defaultMetadata,
    ...specificMetadata,
    id: `${specificMetadata.subject.toLowerCase()}-${specificMetadata.topicNumber}`,
    slug: `${specificMetadata.subject.toLowerCase()}-topic-${specificMetadata.topicNumber}`
  };
}

// Generate metadata for all topics in the documents directory
export async function generateAllMetadata() {
  const documentsPath = path.join(process.cwd(), 'public/documents');
  const metadata = new Map();

  // Process Chemistry files (in root documents folder)
  const chemistryFiles = readdirSync(documentsPath)
    .filter(file => file.endsWith('.pdf') && file.includes('Chemistry'));

  chemistryFiles.forEach(file => {
    const topicMetadata = generateTopicMetadata(file);
    if (topicMetadata) {
      metadata.set(topicMetadata.id, topicMetadata);
    }
  });

  // Process Biology and Physics files
  ['Biology', 'Physics'].forEach(subject => {
    const subjectPath = path.join(documentsPath, subject);
    try {
      const files = readdirSync(subjectPath);
      files.forEach(file => {
        const topicMetadata = generateTopicMetadata(file, subject);
        if (topicMetadata) {
          metadata.set(topicMetadata.id, topicMetadata);
        }
      });
    } catch (err) {
      console.warn(`Warning: Could not read directory for ${subject}`);
    }
  });

  return Object.fromEntries(metadata);
}

// Example usage:
// const metadata = await generateAllMetadata();
// console.log(JSON.stringify(metadata, null, 2));
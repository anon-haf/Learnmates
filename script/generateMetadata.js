import { writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { generateSubjectMetadata, generateTopicMetadata } from './metadata.js';

function generateMetadata() {
  const documentsPath = path.join(process.cwd(), 'public/documents');
  const metadata = {
    subjects: {},
    topics: {}
  };

  // Function to scan directory and generate metadata
  function processDirectory(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const subject = entry.name;
      const subjectPath = path.join(dir, entry.name);
      const files = readdirSync(subjectPath, { withFileTypes: true });

      // Generate subject metadata
      ['igcse', 'alevel'].forEach(type => {
        const subjectMeta = generateSubjectMetadata({
          type,
          board: 'cambridge',
          subject
        });
        metadata.subjects[subjectMeta.url] = subjectMeta;
      });

      // Process topic files
      files.forEach(file => {
        if (!file.isFile() || !file.name.match(/\.(pdf|docx|odg)$/i)) return;

        // Extract topic number from filename
        const match = file.name.match(/(?:topic|chapter)\s*(\d+)/i);
        if (!match) return;

        const topicNumber = parseInt(match[1]);
        const type = file.name.toLowerCase().includes('igcse') ? 'igcse' : 'alevel';
        
        const topicMeta = generateTopicMetadata({
          type,
          board: 'cambridge',
          subject,
          topicNumber,
          topicTitle: null // Using default topic number based title
        });

        metadata.topics[topicMeta.url] = topicMeta;
      });
    }
  }

  try {
    processDirectory(documentsPath);
    
    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'public', 'metadata.json');
    writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    console.log('Metadata generated and saved successfully!');
    console.log(`Subjects processed: ${Object.keys(metadata.subjects).length}`);
    console.log(`Topics processed: ${Object.keys(metadata.topics).length}`);
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
}

// Run the metadata generation
generateMetadata();
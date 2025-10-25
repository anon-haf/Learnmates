import { writeFileSync } from 'fs';
import path from 'path';
import { generateAllMetadata } from './metadata.js';

async function saveMetadata() {
  try {
    const metadata = await generateAllMetadata();
    
    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'public', 'metadata.json');
    writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    console.log('Metadata generated and saved successfully!');
    console.log(`Total topics processed: ${Object.keys(metadata).length}`);
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
}

// Run the metadata generation
saveMetadata();
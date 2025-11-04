import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTopicMetadata } from './metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateMetadata() {
  try {
    // Read the CurriculumPage.tsx to extract curriculum data
    const curriculumPagePath = path.join(__dirname, '..', 'src', 'pages', 'CurriculumPage.tsx');
    const curriculumPageContent = readFileSync(curriculumPagePath, 'utf8');
    
    // Extract the curriculumData object using regex
    const curriculumDataMatch = curriculumPageContent.match(/const\s+curriculumData\s*:\s*Record<string,\s*Curriculum>\s*=\s*({[\s\S]*?});/);
    if (!curriculumDataMatch) {
      throw new Error('Could not find curriculumData in CurriculumPage.tsx');
    }

    // Parse the curriculumData object (this is safe since it's our own code)
    const curriculumDataStr = curriculumDataMatch[1];
    const curriculumData = eval(`(${curriculumDataStr})`);

    const metadata = {
      topics: {}
    };

    // Process each curriculum level and board
    Object.entries(curriculumData).forEach(([level, curriculum]) => {
      const curriculumType = level === 'igcse' ? 'IGCSE' : 'A-Level';
      
      ['cambridge', 'edexcel'].forEach(board => {
        const topics = curriculum.boards[board]?.topics || [];
        
        topics.forEach(topic => {
          const topicMeta = generateTopicMetadata({
            title: topic.title,
            subject: topic.subject,
            curriculum: curriculumType,
            board: board
          });

          // Add additional metadata about content availability
          topicMeta.hasVideo = Array.isArray(topic.videos) && topic.videos.length > 0;
          topicMeta.hasResources = Array.isArray(topic.resources) && topic.resources.length > 0;
          topicMeta.hasQuiz = Array.isArray(topic.quizzes) && topic.quizzes.length > 0;

          metadata.topics[topicMeta.url] = topicMeta;
        });
      });
    });

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'public', 'metadata.json');
    writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    console.log('Metadata generated and saved successfully!');
    console.log(`Topics processed: ${Object.keys(metadata.topics).length}`);
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
}

// Run the metadata generation
generateMetadata();
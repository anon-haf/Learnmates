import slugify from '../src/utils/slugify.ts';

// Default metadata for all pages
const defaultMetadata = {
  publisher: "Learnmates",
  website: "https://www.learnmates.org",
  copyright: `© ${new Date().getFullYear()} Learnmates`,
  lastUpdated: new Date().toISOString()
};

// Function to generate topic metadata
function generateTopicMetadata({ title, subject, curriculum, board }) {
  const urlSafeSubject = subject;
  const urlSafeTitle = slugify(title);
  const type = curriculum.toLowerCase().includes('igcse') ? 'igcse' : 'a-level';

  return {
    ...defaultMetadata,
    subject,
    curriculum,
    board,
    title: `${title} - ${curriculum} ${subject} | Learnmates`,
    description: `Study ${subject} ${title} for ${curriculum}. Access free study materials, video lessons, and practice questions.`,
    // Keywords: default keywords + title + board + subject + curriculum/type
    keywords: [
      'Learnmates',
      'free study materials',
      'video lessons',
      'practice quizzes',
      title,
      board,
      subject,
      curriculum
    ].filter(Boolean).join(', '),
    url: `/curriculum/${type}/${board}/${urlSafeSubject}/${urlSafeTitle}`,
    hasVideo: false, // Will be updated by generateMetadata script
    hasResources: false, // Will be updated by generateMetadata script
    hasQuiz: false // Will be updated by generateMetadata script
  };
}

export { generateTopicMetadata };


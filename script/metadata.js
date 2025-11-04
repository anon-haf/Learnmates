// Default metadata for all pages
const defaultMetadata = {
  publisher: "Learnmates",
  website: "https://www.learnmates.org",
  copyright: `© ${new Date().getFullYear()} Learnmates`,
  lastUpdated: new Date().toISOString()
};

// Function to generate subject metadata
function generateSubjectMetadata({ type, board, subject }) {
  const urlSafeSubject = subject.toLowerCase().replace(/\s+/g, '-');
  
  return {
    ...defaultMetadata,
    type,
    board,
    subject,
    title: `${subject} - ${type.toUpperCase()} ${board} | Learnmates`,
    description: `Study ${subject} for ${type.toUpperCase()} ${board}. Access free study materials, video lessons, and practice questions.`,
    url: `/curriculum/${type}/${board}/${urlSafeSubject}`
  };
}

// Function to generate topic metadata
function generateTopicMetadata({ type, board, subject, topicNumber, topicTitle = null }) {
  const urlSafeSubject = subject.toLowerCase().replace(/\s+/g, '-');
  const urlSafeTitle = topicTitle ? 
    topicTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 
    `${urlSafeSubject}-topic-${topicNumber}`;

  return {
    ...defaultMetadata,
    type,
    board,
    subject,
    topicNumber,
    topicTitle: topicTitle || `Topic ${topicNumber}`,
    title: `${subject} ${topicTitle || `Topic ${topicNumber}`} - ${type.toUpperCase()} ${board} | Learnmates`,
    description: `Study ${subject} ${topicTitle || `Topic ${topicNumber}`} for ${type.toUpperCase()} ${board}. Access free study materials, video lessons, and practice questions.`,
    url: `/curriculum/${type}/${board}/${urlSafeSubject}/${urlSafeTitle}`
  };
}

export { generateSubjectMetadata, generateTopicMetadata };
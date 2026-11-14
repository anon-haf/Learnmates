// Shared types for topical page configuration

export interface SearchTopic {
  topic: string;
  search?: string;
  subtopics?: { subtopic: string; search: string }[];
}

export interface UnitConfig {
  unit: string;
  topics: SearchTopic[];
  pastPapersOnly?: boolean;
}

export interface SubjectConfig {
  subject: string;
  board: string;
  level: string;
  units: UnitConfig[];
}

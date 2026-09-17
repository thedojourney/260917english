export type BoxLevel = 1 | 2 | 3 | 4 | 5;

export interface Word {
  id: string;
  english: string;
  meaning: string;
  example?: string;
  tags?: string[];
  boxLevel: BoxLevel;
  nextReviewDate: string; // ISO date (YYYY-MM-DD)
  createdAt: string; // ISO datetime
}

export interface StudyStats {
  totalReviews: number;
  correctReviews: number;
  studyDates: string[]; // unique ISO dates (YYYY-MM-DD) on which at least one review happened
}

export interface AppData {
  words: Word[];
  stats: StudyStats;
}

export type NewWordInput = {
  english: string;
  meaning: string;
  example?: string;
  tags?: string[];
};

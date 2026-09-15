export interface Section {
  id: string;
  title: string;
  summary: string;
  intuitiveExplanation?: string;
  realWorldAnalogy?: string;
  plainEnglishTakeaway?: string;
  content: string[]; // Markdown/KaTeX text blocks
  keyFormulas?: { label: string; formula: string; note?: string }[];
  simulationId?: string;
  hasInteractiveDemo?: boolean;
  notesPageRef?: string; // Reference to original handwritten notes
}

export interface SolvedProblem {
  id: string;
  title: string;
  problemStatement: string;
  category: string;
  givenData: Record<string, string | number>;
  defaultInputs: Record<string, number>;
  inputParams: {
    key: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    description: string;
  }[];
  calculate: (inputs: Record<string, number>) => {
    steps: { title: string; latex: string; explanation: string; result?: string }[];
    finalAnswer: string;
    diagramType?: string;
  };
  notesReference: string;
}

export interface QuizQuestion {
  id: string;
  chapterId: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  formulaRef?: string;
}

export interface FormulaParameter {
  symbol: string;
  name: string;
  unit: string;
  description?: string;
}

export interface QuickFormula {
  name: string;
  latex: string;
  conditions: string;
  understandableForm?: string;
  verbalMeaning?: string;
  parameters?: FormulaParameter[];
}

export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  iconName: string;
  description: string;
  pageRange: string;
  sections: Section[];
  solvedProblems: SolvedProblem[];
  quizzes: QuizQuestion[];
  quickFormulas: QuickFormula[];
}

export type ReaderViewMode = 'book' | 'slides' | 'lab' | 'solver' | 'quiz' | 'formula';

export interface Flashcard {
  id: string;
  chapterId: number;
  chapterTitle?: string;
  category: string;
  front: string; // Question, concept term or scenario
  back: string; // Answer, explanation and rationale
  formula?: string;
  analogy?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardProgress {
  seenIds: string[];
  masteredIds: string[]; // Cards rated 'easy' / 'mastered'
  hardIds: string[]; // Cards requiring frequent review
  ratings: Record<string, 'again' | 'hard' | 'good' | 'easy'>;
  reviewCount: number;
  streak: number;
  lastStudiedDate?: string;
}

export interface QuizHistoryRecord {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface QuizProgress {
  answeredQuestionIds: string[];
  correctQuestionIds: string[];
  incorrectQuestionIds: string[];
  history: QuizHistoryRecord[];
  totalAnswered: number;
  streak: number;
}


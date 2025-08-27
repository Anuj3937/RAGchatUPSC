// For MCQ Test Generation
export type MCQQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export type MCQTest = {
  questions: MCQQuestion[];
};

// For Subjective Test Generation
export type SubjectiveQuestion = {
  question: string;
}

export type SubjectiveTest = {
  questions: string[];
};

// For Flash Card Generation
export type FlashCard = {
    front: string;
    back: string;
}

export type FlashCards = {
    cards: FlashCard[];
}

// For Test Evaluation
export type QuestionForEvaluation = {
  question: string;
  type: 'mcq' | 'subjective';
  correctAnswer?: string;
  options?: string[];
};

export type EvaluationResult = {
  question: string;
  type: 'mcq' | 'subjective';
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
};

export type TestEvaluation = {
  results: EvaluationResult[];
  overallFeedback: string;
};

// For Chat History
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
};


import { Timestamp } from "firebase/firestore";

// For MCQ Test Generation
export type MCQQuestion = {
  question: string;
  options: string[];
  answer: string;
  type: 'mcq';
};

// For Subjective Test Generation
export type SubjectiveQuestion = {
  question: string;
  type: 'subjective';
}

// For Flash Card Generation
export type FlashCard = {
    front: string;
    back: string;
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

// For Chat History
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
};

// Firestore Document Types
export type UserRole = 'admin' | 'teacher' | 'student';

export type UserProfile = {
  uid: string;
  email: string;
  role: UserRole;
  classIds?: string[]; // Only for students
};

export type Class = {
  id: string;
  name: string;
  division: string;
  teacherId: string | null;
  studentIds: string[];
};

export type Test = {
  id: string;
  name: string;
  classId: string | null; // Can be null for drafts
  questions: (MCQQuestion | SubjectiveQuestion)[];
  createdBy: string; // teacher's uid
  createdAt: Timestamp;
  isDraft: boolean;
  documentBase64?: string; // Storing uploaded PDF as base64
};

export type Submission = {
  id: string;
  testId: string;
  studentId: string;
  classId: string;
  answers: string[];
  evaluation: {
    results: EvaluationResult[];
    overallFeedback: string;
  } | null; // Can be null until evaluation is complete
  submittedAt: Timestamp;
};

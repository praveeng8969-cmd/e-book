import React from 'react';
import { QuizQuestion } from '../types';
import { SmartQuizEngine } from './SmartQuizEngine';

interface InteractiveQuizProps {
  quizzes?: QuizQuestion[];
  chapterTitle?: string;
  chapterId?: number;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  chapterTitle = 'Thermodynamics Chapter',
  chapterId = 0,
}) => {
  return (
    <SmartQuizEngine chapterId={chapterId} chapterTitle={chapterTitle} />
  );
};

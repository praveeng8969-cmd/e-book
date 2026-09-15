import React, { useState, useEffect, useMemo } from 'react';
import { QuizQuestion, QuizProgress } from '../types';
import { masterQuizDatabase } from '../data/quizDatabase';
import { MathView } from './MathView';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Layers,
  AlertCircle,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  Brain,
} from 'lucide-react';

const QUIZ_STORAGE_KEY = 'thermo_quiz_progress_v2';

interface SmartQuizEngineProps {
  chapterId?: number; // Optional: filter by chapter
  chapterTitle?: string;
}

export const SmartQuizEngine: React.FC<SmartQuizEngineProps> = ({
  chapterId = 0,
  chapterTitle,
}) => {
  // Persistence state
  const [progress, setProgress] = useState<QuizProgress>(() => {
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load quiz progress', e);
    }
    return {
      answeredQuestionIds: [],
      correctQuestionIds: [],
      incorrectQuestionIds: [],
      history: [],
      totalAnswered: 0,
      streak: 0,
    };
  });

  // Settings
  const [selectedChapter, setSelectedChapter] = useState<number>(chapterId);
  const [sessionMode, setSessionMode] = useState<'unseen' | 'incorrect' | 'all'>('unseen');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active quiz session state
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<number>(1);

  // Save progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save quiz progress', e);
    }
  }, [progress]);

  // Sync if chapterId prop changes
  useEffect(() => {
    if (chapterId > 0) {
      setSelectedChapter(chapterId);
    }
  }, [chapterId]);

  // Generate a non-repeating question pool for this session
  useEffect(() => {
    let pool = [...masterQuizDatabase];

    if (selectedChapter > 0) {
      pool = pool.filter((q) => q.chapterId === selectedChapter);
    }

    let candidateQuestions: QuizQuestion[] = [];

    if (sessionMode === 'unseen') {
      // Prioritize unseen questions first
      const unseen = pool.filter((q) => !progress.answeredQuestionIds.includes(q.id));
      if (unseen.length > 0) {
        candidateQuestions = unseen;
      } else {
        // If all answered, pull unmastered/incorrect questions
        const incorrect = pool.filter((q) => progress.incorrectQuestionIds.includes(q.id));
        candidateQuestions = incorrect.length > 0 ? incorrect : pool;
      }
    } else if (sessionMode === 'incorrect') {
      const incorrect = pool.filter((q) => progress.incorrectQuestionIds.includes(q.id));
      candidateQuestions = incorrect.length > 0 ? incorrect : pool;
    } else {
      candidateQuestions = pool;
    }

    // Shuffle candidate questions
    const shuffled = [...candidateQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    setSessionQuestions(selected);
    setSelectedAnswers({});
    setIsSubmitted(false);
  }, [selectedChapter, sessionMode, questionCount, sessionKey, progress.answeredQuestionIds.length]);

  // Handle Option Click
  const handleSelect = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // Submit and grade quiz
  const handleGrade = () => {
    setIsSubmitted(true);

    let correctCount = 0;
    const newHistory = [...progress.history];
    const newAnswered = new Set(progress.answeredQuestionIds);
    const newCorrect = new Set(progress.correctQuestionIds);
    const newIncorrect = new Set(progress.incorrectQuestionIds);

    sessionQuestions.forEach((q) => {
      const userChoice = selectedAnswers[q.id];
      if (userChoice !== undefined) {
        newAnswered.add(q.id);
        const isRight = userChoice === q.correctIndex;

        if (isRight) {
          correctCount++;
          newCorrect.add(q.id);
          newIncorrect.delete(q.id);
        } else {
          newIncorrect.add(q.id);
          newCorrect.delete(q.id);
        }

        newHistory.push({
          questionId: q.id,
          selectedOption: userChoice,
          isCorrect: isRight,
          timestamp: Date.now(),
        });
      }
    });

    setProgress((prev) => ({
      ...prev,
      answeredQuestionIds: Array.from(newAnswered),
      correctQuestionIds: Array.from(newCorrect),
      incorrectQuestionIds: Array.from(newIncorrect),
      history: newHistory,
      totalAnswered: prev.totalAnswered + Object.keys(selectedAnswers).length,
    }));

    if (correctCount === sessionQuestions.length && sessionQuestions.length > 0) {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Start fresh new session with new unseen questions
  const handleNewSession = () => {
    setSessionKey((prev) => prev + 1);
  };

  // Reset quiz history
  const handleResetHistory = () => {
    if (window.confirm('Reset all quiz history? All questions will be marked as unseen.')) {
      const resetState: QuizProgress = {
        answeredQuestionIds: [],
        correctQuestionIds: [],
        incorrectQuestionIds: [],
        history: [],
        totalAnswered: 0,
        streak: 0,
      };
      setProgress(resetState);
      setSelectedAnswers({});
      setIsSubmitted(false);
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      setSessionKey((prev) => prev + 1);
    }
  };

  // Global stats
  const totalQuestionsInDatabase = masterQuizDatabase.length;
  const totalAnswered = progress.answeredQuestionIds.length;
  const totalCorrect = progress.correctQuestionIds.length;
  const totalIncorrect = progress.incorrectQuestionIds.length;
  const totalUnseen = Math.max(0, totalQuestionsInDatabase - totalAnswered);

  // Session score
  const sessionScore = sessionQuestions.reduce(
    (acc, q) => (selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );
  const sessionPercentage =
    sessionQuestions.length > 0 ? Math.round((sessionScore / sessionQuestions.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-2xl space-y-6">
      {/* Header & Mode Select */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-md">
              Non-Repeating Quiz Engine
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">• Smart Question Pool</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>
              {chapterTitle ? `${chapterTitle} Practice Quiz` : 'Thermodynamics Master Quiz Engine'}
            </span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Questions are automatically drawn from the unseen pool so you never get repeat questions on subsequent attempts.
          </p>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Unseen: </span>
            <span className="text-cyan-700 dark:text-cyan-400 font-bold">{totalUnseen}</span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Mastered: </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{totalCorrect}</span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Missed: </span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">{totalIncorrect}</span>
          </div>
          <button
            onClick={handleResetHistory}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors text-xs font-mono"
            title="Reset question history to make all questions fresh again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Control Bar: Mode, Question Count, Chapter Selector */}
      <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Pool Mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 dark:text-slate-500 font-mono font-semibold">Pool:</span>
          <button
            onClick={() => setSessionMode('unseen')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              sessionMode === 'unseen'
                ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950 dark:shadow-md dark:shadow-cyan-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unseen First</span>
          </button>
          <button
            onClick={() => setSessionMode('incorrect')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              sessionMode === 'incorrect'
                ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950 dark:shadow-md dark:shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Missed Questions ({totalIncorrect})</span>
          </button>
          <button
            onClick={() => setSessionMode('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              sessionMode === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Questions</span>
          </button>
        </div>

        {/* Count & Chapter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-500 font-mono font-semibold">Questions:</span>
            {[3, 5, 10].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-2.5 py-1 rounded-md font-mono font-bold transition-all ${
                  questionCount === count
                    ? 'bg-cyan-600 text-white dark:bg-cyan-500/20 dark:text-cyan-300 dark:border dark:border-cyan-500/40'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>

          {chapterId === 0 && (
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl font-mono focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value={0}>All Chapters</option>
              <option value={1}>Ch 1: Basic Concepts</option>
              <option value={2}>Ch 2: Zeroth Law</option>
              <option value={3}>Ch 3: Energy Interactions</option>
              <option value={4}>Ch 4: Second Law</option>
              <option value={5}>Ch 5: Entropy</option>
              <option value={6}>Ch 6: Exergy</option>
              <option value={7}>Ch 7: Gas Mixtures</option>
              <option value={8}>Ch 8: Pure Substances</option>
              <option value={9}>Ch 9: Thermo Relations</option>
            </select>
          )}
        </div>
      </div>

      {/* Session Progress / Score Bar */}
      {isSubmitted && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award
              className={`w-8 h-8 ${sessionPercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
            />
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono uppercase font-bold">Session Result:</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {sessionScore} / {sessionQuestions.length} ({sessionPercentage}%)
                <span className="text-xs text-slate-600 dark:text-slate-400 font-normal ml-2">
                  {sessionPercentage >= 80 ? '🎉 Outstanding mastery!' : '💪 Keep practicing!'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewSession}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Next Fresh Set
          </button>
        </div>
      )}

      {/* Questions List */}
      {sessionQuestions.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">All questions in this pool have been answered!</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            You have completed all questions in this category. Switch to &quot;All Questions&quot; or reset question history.
          </p>
          <button
            onClick={() => setSessionMode('all')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Review All Questions
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sessionQuestions.map((q, qIndex) => {
            const userAnswer = selectedAnswers[q.id];
            const isAnswered = userAnswer !== undefined;
            const isCorrect = isAnswered && userAnswer === q.correctIndex;
            const wasPreviouslyAnswered = progress.answeredQuestionIds.includes(q.id);

            return (
              <div
                key={q.id}
                className="bg-slate-50/80 dark:bg-slate-950/90 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800/90 space-y-4 transition-all"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <h4 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {q.question}
                    </h4>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {!wasPreviouslyAnswered ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 text-[10px] font-mono font-bold">
                        ✨ Unseen
                      </span>
                    ) : progress.incorrectQuestionIds.includes(q.id) ? (
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] font-mono font-bold">
                        ⚡ Missed Prior
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = userAnswer === optIndex;
                    let btnStyle =
                      'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white';

                    if (isSubmitted) {
                      if (optIndex === q.correctIndex) {
                        btnStyle =
                          'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/50';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-200 line-through';
                      } else {
                        btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800 text-slate-500';
                      }
                    } else if (isSelected) {
                      btnStyle =
                        'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-semibold shadow-sm';
                    }

                    return (
                      <button
                        key={optIndex}
                        disabled={isSubmitted}
                        onClick={() => handleSelect(q.id, optIndex)}
                        className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${btnStyle}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="flex-1 leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Rationale & Formula on Submit */}
                {isSubmitted && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2 mt-3 ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Correct Answer!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>
                            Incorrect. Correct answer is option{' '}
                            {String.fromCharCode(65 + q.correctIndex)}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{q.explanation}</p>

                    {q.formulaRef && (
                      <div className="bg-white dark:bg-slate-950/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center mt-2">
                        <MathView math={q.formulaRef} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Footer */}
      {sessionQuestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {Object.keys(selectedAnswers).length} of {sessionQuestions.length} answered
          </span>

          <div className="flex items-center gap-2.5">
            {isSubmitted ? (
              <button
                onClick={handleNewSession}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> Next Fresh Question Set
              </button>
            ) : (
              <button
                disabled={Object.keys(selectedAnswers).length === 0}
                onClick={handleGrade}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Submit & Check Answers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

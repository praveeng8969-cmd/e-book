import React, { useState, useEffect, useMemo } from 'react';
import { Flashcard, FlashcardProgress } from '../types';
import { thermodynamicsFlashcards } from '../data/flashcardsData';
import { MathView } from './MathView';
import confetti from 'canvas-confetti';
import {
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  Zap,
  HelpCircle,
  Lightbulb,
  Award,
  SlidersHorizontal,
} from 'lucide-react';

const STORAGE_KEY = 'thermo_flashcards_progress_v2';

export const FlashcardsLab: React.FC = () => {
  // Persistence state
  const [progress, setProgress] = useState<FlashcardProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load flashcard progress', e);
    }
    return {
      seenIds: [],
      masteredIds: [],
      hardIds: [],
      ratings: {},
      reviewCount: 0,
      streak: 0,
    };
  });

  // Filters & deck mode
  const [selectedChapter, setSelectedChapter] = useState<number>(0); // 0 = All chapters
  const [deckMode, setDeckMode] = useState<'unseen' | 'hard' | 'all' | 'mastered'>('unseen');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // Save progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save flashcard progress', e);
    }
  }, [progress]);

  // Filter cards based on chapter and mode
  const activeDeck = useMemo(() => {
    let cards = [...thermodynamicsFlashcards];

    if (selectedChapter > 0) {
      cards = cards.filter((c) => c.chapterId === selectedChapter);
    }

    if (deckMode === 'unseen') {
      // Unseen cards first, then unmastered cards
      const unseen = cards.filter((c) => !progress.seenIds.includes(c.id));
      const notMastered = cards.filter(
        (c) => progress.seenIds.includes(c.id) && !progress.masteredIds.includes(c.id)
      );
      return unseen.length > 0 ? unseen : notMastered.length > 0 ? notMastered : cards;
    } else if (deckMode === 'hard') {
      const hardCards = cards.filter((c) => progress.hardIds.includes(c.id));
      return hardCards.length > 0 ? hardCards : cards;
    } else if (deckMode === 'mastered') {
      const masteredCards = cards.filter((c) => progress.masteredIds.includes(c.id));
      return masteredCards.length > 0 ? masteredCards : cards;
    }

    return cards;
  }, [selectedChapter, deckMode, progress]);

  // Current Card
  const currentCard: Flashcard | undefined = activeDeck[currentIndex] || activeDeck[0];

  // Flip card
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Move to next card
  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSummary(true);
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Grade card with spaced repetition confidence
  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    setProgress((prev) => {
      const seen = new Set(prev.seenIds);
      seen.add(currentCard.id);

      const mastered = new Set(prev.masteredIds);
      const hard = new Set(prev.hardIds);

      if (rating === 'easy') {
        mastered.add(currentCard.id);
        hard.delete(currentCard.id);
      } else if (rating === 'hard' || rating === 'again') {
        hard.add(currentCard.id);
        mastered.delete(currentCard.id);
      } else if (rating === 'good') {
        hard.delete(currentCard.id);
      }

      return {
        ...prev,
        seenIds: Array.from(seen),
        masteredIds: Array.from(mastered),
        hardIds: Array.from(hard),
        ratings: {
          ...prev.ratings,
          [currentCard.id]: rating,
        },
        reviewCount: prev.reviewCount + 1,
      };
    });

    handleNext();
  };

  // Shuffle current deck
  const handleShuffle = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setShowSummary(false);
  };

  // Reset card history
  const handleResetHistory = () => {
    if (window.confirm('Reset all flashcard history? This will mark all cards as unseen.')) {
      const resetState: FlashcardProgress = {
        seenIds: [],
        masteredIds: [],
        hardIds: [],
        ratings: {},
        reviewCount: 0,
        streak: 0,
      };
      setProgress(resetState);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSummary(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Total stats across all thermodynamics flashcards
  const totalDeckSize = thermodynamicsFlashcards.length;
  const totalSeen = progress.seenIds.length;
  const totalMastered = progress.masteredIds.length;
  const totalHard = progress.hardIds.length;
  const totalUnseen = Math.max(0, totalDeckSize - totalSeen);

  const isCurrentCardMastered = currentCard && progress.masteredIds.includes(currentCard.id);
  const isCurrentCardHard = currentCard && progress.hardIds.includes(currentCard.id);
  const isCurrentCardUnseen = currentCard && !progress.seenIds.includes(currentCard.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Stats Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-2xl space-y-5 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                Flashcards Engine
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">• Spaced Mastery & Recall</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <span>Thermodynamics Flashcards Laboratory</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Master core thermodynamic concepts, definitions, derivations, and formulas with our smart flashcard deck. Every session prioritizes fresh, unseen concepts.
            </p>
          </div>

          <button
            onClick={handleResetHistory}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors flex items-center gap-1.5 font-mono"
            title="Reset history to make all flashcards unseen again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset History</span>
          </button>
        </div>

        {/* Global Progress Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono font-bold uppercase">Unseen Cards</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">{totalUnseen}</div>
            <div className="text-[10px] text-slate-500">Fresh for practice</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold uppercase">Mastered</div>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">{totalMastered}</div>
            <div className="text-[10px] text-slate-500">Rated Easy</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold uppercase">Needs Review</div>
            <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400 font-mono mt-0.5">{totalHard}</div>
            <div className="text-[10px] text-slate-500">Marked Hard/Again</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center">
            <div className="text-[10px] text-purple-700 dark:text-purple-400 font-mono font-bold uppercase">Reviews Done</div>
            <div className="text-xl font-extrabold text-purple-700 dark:text-purple-400 font-mono mt-0.5">{progress.reviewCount}</div>
            <div className="text-[10px] text-slate-500">Total card flips</div>
          </div>
        </div>

        {/* Filters & Mode Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-mono">Mode:</span>
            <button
              onClick={() => {
                setDeckMode('unseen');
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowSummary(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                deckMode === 'unseen'
                  ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950 dark:shadow-md dark:shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unseen First ({totalUnseen})</span>
            </button>
            <button
              onClick={() => {
                setDeckMode('hard');
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowSummary(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                deckMode === 'hard'
                  ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950 dark:shadow-md dark:shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Needs Practice ({totalHard})</span>
            </button>
            <button
              onClick={() => {
                setDeckMode('all');
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowSummary(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                deckMode === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({totalDeckSize})</span>
            </button>
          </div>

          {/* Chapter Filter Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-mono">Chapter:</span>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(Number(e.target.value));
                setCurrentIndex(0);
                setIsFlipped(false);
                setShowSummary(false);
              }}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-medium focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value={0}>All 9 Chapters ({thermodynamicsFlashcards.length} cards)</option>
              <option value={1}>Ch 1: Basic Concepts</option>
              <option value={2}>Ch 2: Zeroth Law & Temp</option>
              <option value={3}>Ch 3: Energy Interactions & 1st Law</option>
              <option value={4}>Ch 4: Second Law & Carnot</option>
              <option value={5}>Ch 5: Entropy & Clausius</option>
              <option value={6}>Ch 6: Exergy & Gouy-Stodola</option>
              <option value={7}>Ch 7: Gas Mixtures</option>
              <option value={8}>Ch 8: Pure Substances & Steam</option>
              <option value={9}>Ch 9: Thermodynamic Relations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Flashcard Interactive Area */}
      {activeDeck.length === 0 || showSummary ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-sm dark:shadow-xl">
          <Award className="w-16 h-16 text-cyan-600 dark:text-cyan-400 mx-auto" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Deck Session Complete!</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            You reviewed all cards in this current queue. Choose another mode or restart the deck to continue testing your recall.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleShuffle}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-cyan-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> Restart Deck
            </button>
            <button
              onClick={() => {
                setDeckMode('hard');
                setCurrentIndex(0);
                setShowSummary(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors border border-amber-300 dark:border-amber-500/30"
            >
              <AlertCircle className="w-4 h-4" /> Practice Difficult Cards ({totalHard})
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Header Info */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-cyan-700 dark:text-cyan-400 font-bold">
                Card {currentIndex + 1} of {activeDeck.length}
              </span>
              <span>•</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{currentCard?.chapterTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentCardUnseen && (
                <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-[10px] font-bold">
                  ✨ Unseen
                </span>
              )}
              {isCurrentCardMastered && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                  ✓ Mastered
                </span>
              )}
              {isCurrentCardHard && (
                <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] font-bold">
                  ⚡ Needs Practice
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold">
                {currentCard?.category}
              </span>
            </div>
          </div>

          {/* Interactive Flip Card Component */}
          <div
            onClick={handleFlip}
            className={`min-h-[360px] md:min-h-[420px] bg-white dark:bg-slate-900 border-2 rounded-3xl p-6 md:p-10 shadow-md dark:shadow-2xl cursor-pointer transition-all duration-300 relative flex flex-col justify-between select-none ${
              isFlipped
                ? 'border-emerald-500/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20'
                : 'border-cyan-500/50 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 hover:border-cyan-500'
            }`}
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                {isFlipped ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400">Answer & Explanation</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-cyan-700 dark:text-cyan-400">Question / Problem / Concept</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-mono">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click card or space to flip</span>
              </div>
            </div>

            {/* Middle Content */}
            <div className="py-6 flex-1 flex flex-col justify-center">
              {!isFlipped ? (
                <div className="space-y-4 text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed max-w-2xl mx-auto">
                    {currentCard?.front}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                    {currentCard?.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] font-mono border border-slate-200 dark:border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-3 text-slate-800 dark:text-slate-200 leading-relaxed text-sm md:text-base">
                    {currentCard?.back.split('\n').map((para, pIdx) => {
                      if (para.startsWith('$$') && para.endsWith('$$')) {
                        return (
                          <div
                            key={pIdx}
                            className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center my-2 overflow-x-auto"
                          >
                            <MathView math={para.slice(2, -2).trim()} block />
                          </div>
                        );
                      }
                      return <p key={pIdx}>{para}</p>;
                    })}
                  </div>

                  {currentCard?.formula && (
                    <div className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-center">
                      <div className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold mb-1">
                        Governing Equation:
                      </div>
                      <MathView math={currentCard.formula} />
                    </div>
                  )}

                  {currentCard?.analogy && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-800 dark:text-amber-300">Everyday Analogy: </span>
                        {currentCard.analogy}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Footer Status */}
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono text-[11px] font-semibold">Difficulty: {currentCard?.difficulty}</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-mono text-[11px] font-semibold">
                {isFlipped ? 'Click to see question' : 'Click to reveal answer'}
              </span>
            </div>
          </div>

          {/* Rating & Action Buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Nav Arrows */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                title="Skip to Next Card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Recall Confidence Grading (Displayed after flip) */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mr-1">Rate Recall:</span>
              <button
                onClick={() => handleRate('again')}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-all"
                title="Forgot completely - show again soon"
              >
                🔴 Again
              </button>
              <button
                onClick={() => handleRate('hard')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-bold transition-all"
                title="Struggled to recall"
              >
                🟡 Hard
              </button>
              <button
                onClick={() => handleRate('good')}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-all"
                title="Recalled with moderate effort"
              >
                🔵 Good
              </button>
              <button
                onClick={() => handleRate('easy')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-bold transition-all shadow-sm dark:shadow-md dark:shadow-emerald-500/20"
                title="Mastered - mark as learned"
              >
                🌟 Mastered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuizQuestion } from '@/lib/types/firestore';
import Button from '@/components/ui/Button';

interface QuizPlayerProps {
    questions: QuizQuestion[];
    onComplete: (score: number, total: number, answers?: Record<string, number | string>, totalPoints?: number, timePerQuestion?: Record<string, number>) => void;
    onCancel: () => void;
}

/** Calculate points based on response time (seconds). Only for correct answers. */
function calculatePoints(timeSec: number): number {
    if (timeSec <= 3) return 100;
    if (timeSec <= 6) return 80;
    if (timeSec <= 10) return 60;
    if (timeSec <= 15) return 40;
    if (timeSec <= 30) return 20;
    return 10;
}

/** Return a label for the speed tier */
function getSpeedLabel(timeSec: number): { label: string; emoji: string; color: string } {
    if (timeSec <= 3) return { label: 'Lightning', emoji: '⚡', color: 'text-yellow-500' };
    if (timeSec <= 6) return { label: 'Fast', emoji: '🔥', color: 'text-orange-500' };
    if (timeSec <= 10) return { label: 'Good', emoji: '👍', color: 'text-green-500' };
    if (timeSec <= 15) return { label: 'Steady', emoji: '⏱️', color: 'text-blue-500' };
    if (timeSec <= 30) return { label: 'Slow', emoji: '🐢', color: 'text-gray-500' };
    return { label: 'Minimum', emoji: '🐌', color: 'text-slate-500' };
}

export default function QuizPlayer({ questions, onComplete, onCancel, reviewMode = false, userAnswers = {} }: QuizPlayerProps & { reviewMode?: boolean; userAnswers?: Record<string, number | string> }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number | string>>(userAnswers);
    const [showResults, setShowResults] = useState(false);
    const [activeReviewMode, setActiveReviewMode] = useState(reviewMode);

    // Timer state
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    if (!questions || questions.length === 0) {
        return (
            <div className="bg-slate-900 p-6 rounded-2xl text-center max-w-2xl mx-auto border border-slate-800">
                <p className="text-slate-400 mb-4">No questions available in this quiz yet.</p>
                <Button onClick={onCancel}>Close</Button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;
    const getType = (q: QuizQuestion) => q.type || 'multiple_choice';

    const mcqQuestions = questions.filter(q => getType(q) === 'multiple_choice');
    const textQuestions = questions.filter(q => getType(q) !== 'multiple_choice');

    // Start/reset timer when question changes
    useEffect(() => {
        if (activeReviewMode) return;

        const now = Date.now();
        setQuestionStartTime(now);
        setElapsedTime(0);

        // Tick every 100ms for smooth timer display
        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - now) / 1000));
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentIndex, activeReviewMode]);

    // Record time when an MCQ option is selected
    const recordTime = useCallback(() => {
        if (activeReviewMode) return;
        const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
        // Only record the first selection for this question
        if (timePerQuestion[currentQuestion.id] === undefined) {
            setTimePerQuestion(prev => ({ ...prev, [currentQuestion.id]: timeTaken }));
        }
    }, [activeReviewMode, questionStartTime, currentQuestion?.id, timePerQuestion]);

    const handleOptionSelect = (optionIndex: number) => {
        if (activeReviewMode) return;
        recordTime();
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    };

    const handleTextChange = (value: string) => {
        if (activeReviewMode) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleNext = () => {
        if (isLastQuestion) {
            if (activeReviewMode) {
                onCancel();
            } else {
                calculateResults();
            }
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const calculateResults = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setShowResults(true);
    };

    const isCurrentAnswered = () => {
        const qType = getType(currentQuestion);
        if (qType === 'multiple_choice') {
            return answers[currentQuestion.id] !== undefined;
        }
        const val = answers[currentQuestion.id];
        return typeof val === 'string' && val.trim().length > 0;
    };

    // Format elapsed time for display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`;
        return `${secs}s`;
    };

    // Get timer bar color based on elapsed time
    const getTimerColor = () => {
        if (elapsedTime <= 3) return 'bg-green-500';
        if (elapsedTime <= 6) return 'bg-green-400';
        if (elapsedTime <= 10) return 'bg-yellow-400';
        if (elapsedTime <= 15) return 'bg-orange-400';
        if (elapsedTime <= 30) return 'bg-red-400';
        return 'bg-red-600';
    };

    // Calculate timer bar width (caps at 30 seconds visually)
    const getTimerWidth = () => {
        const maxDisplay = 30;
        return Math.min((elapsedTime / maxDisplay) * 100, 100);
    };

    if (showResults && !activeReviewMode) {
        let score = 0;
        let totalPoints = 0;
        const questionResults: { id: string; correct: boolean; time: number; points: number }[] = [];

        mcqQuestions.forEach(q => {
            const isCorrect = answers[q.id] === q.correctOption;
            const time = timePerQuestion[q.id] || 0;
            const points = isCorrect ? calculatePoints(time) : 0;

            if (isCorrect) score++;
            totalPoints += points;

            questionResults.push({ id: q.id, correct: isCorrect, time, points });
        });

        const mcqTotal = mcqQuestions.length;
        const textTotal = textQuestions.length;
        const maxPossiblePoints = mcqTotal * 100;

        return (
            <div className="bg-slate-900 p-6 rounded-2xl max-w-2xl mx-auto text-center space-y-6 border border-slate-800 shadow-xl">
                {/* Points Display */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-32 h-32 rounded-full flex flex-col items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                    <span className="text-3xl font-bold text-white">{totalPoints}</span>
                    <span className="text-xs text-indigo-100 font-semibold tracking-wider">POINTS</span>
                </div>

                <h2 className="text-2xl font-bold text-white">Quiz Completed!</h2>

                {mcqTotal > 0 && (
                    <div className="space-y-1">
                        <p className="text-slate-300 font-medium">
                            You answered <span className="font-bold text-indigo-400">{score}</span> out of <span className="font-bold text-white">{mcqTotal}</span> multiple choice questions correctly.
                        </p>
                        <p className="text-sm text-slate-400">
                            {totalPoints} / {maxPossiblePoints} possible points
                        </p>
                    </div>
                )}

                {/* Per-question breakdown */}
                {mcqTotal > 0 && (
                    <div className="text-left bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 max-h-48 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Question Breakdown</h3>
                        <div className="space-y-2">
                            {questionResults.map((qr, idx) => {
                                const speed = getSpeedLabel(qr.time);
                                return (
                                    <div key={qr.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${qr.correct ? 'bg-green-950/60 text-green-300 border border-green-800/50' : 'bg-red-950/60 text-red-300 border border-red-800/50'}`}>
                                                {qr.correct ? '✓' : '✗'}
                                            </span>
                                            <span className="text-slate-300 font-medium">Q{idx + 1}</span>
                                            <span className="text-slate-500 text-xs">({qr.time}s)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {qr.correct && (
                                                <span className={`text-xs ${speed.color}`}>{speed.emoji} {speed.label}</span>
                                            )}
                                            <span className="font-semibold text-slate-100 w-16 text-right">{qr.points} pts</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {textTotal > 0 && (
                    <p className="text-slate-400 text-sm italic">
                        {textTotal} text response{textTotal > 1 ? 's' : ''} submitted.
                    </p>
                )}

                <div className="flex justify-center gap-4 pt-4">
                    <Button
                        variant="primary"
                        onClick={() => onComplete(score, mcqTotal, answers, totalPoints, timePerQuestion)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 font-bold shadow-md shadow-indigo-600/30"
                    >
                        Finish & Save
                    </Button>
                </div>
            </div>
        );
    }

    const qType = getType(currentQuestion);

    const getOptionStyle = (index: number) => {
        if (!activeReviewMode) {
            const isSelected = answers[currentQuestion.id] === index;
            return isSelected
                ? 'border-indigo-500 bg-indigo-950/80 text-indigo-100 font-semibold shadow-sm'
                : 'border-slate-700/80 bg-slate-800/80 text-slate-100 hover:border-indigo-500 hover:bg-slate-800';
        }

        const isSelected = answers[currentQuestion.id] === index;
        const isCorrect = currentQuestion.correctOption === index;

        if (isCorrect) {
            return 'border-green-600 bg-green-950/80 text-green-100 font-semibold';
        }
        if (isSelected && !isCorrect) {
            return 'border-red-600 bg-red-950/80 text-red-100 font-semibold';
        }
        return 'border-slate-800 bg-slate-800/30 text-slate-400 opacity-60';
    };

    return (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl max-w-2xl mx-auto min-h-[400px] flex flex-col border border-slate-800 shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-400">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${qType === 'multiple_choice' ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60' :
                            qType === 'short_answer' ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60' :
                                'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        }`}>
                        {qType === 'multiple_choice' ? 'Multiple Choice' :
                            qType === 'short_answer' ? 'Short Answer' : 'Paragraph'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {activeReviewMode && qType === 'multiple_choice' && (
                        <span className={`text-sm font-bold ${answers[currentQuestion.id] === currentQuestion.correctOption ? 'text-green-400' : 'text-red-400'}`}>
                            {answers[currentQuestion.id] === currentQuestion.correctOption ? 'Correct' : 'Incorrect'}
                        </span>
                    )}
                    {/* Timer Display (only for MCQ, not review mode) */}
                    {!activeReviewMode && qType === 'multiple_choice' && (
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`text-sm font-mono font-bold ${elapsedTime > 15 ? 'text-red-400' : elapsedTime > 10 ? 'text-orange-400' : 'text-slate-200'}`}>
                                {formatTime(elapsedTime)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Timer Bar (only for MCQ, not review mode) */}
            {!activeReviewMode && qType === 'multiple_choice' && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ease-linear ${getTimerColor()}`}
                        style={{ width: `${getTimerWidth()}%` }}
                    />
                </div>
            )}

            {/* Question Content */}
            <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">
                    {currentQuestion.text}
                </h3>

                {currentQuestion.image && (
                    <div className="mb-6 relative w-full h-64 bg-slate-800/80 rounded-xl overflow-hidden border border-slate-700 shadow-sm">
                        <img
                            src={currentQuestion.image}
                            alt="Question"
                            className="w-full h-full object-contain p-2"
                        />
                    </div>
                )}

                {/* Multiple Choice */}
                {qType === 'multiple_choice' && (
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = answers[currentQuestion.id] === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    disabled={activeReviewMode}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${getOptionStyle(index)}`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-xs transition-colors ${activeReviewMode
                                            ? (currentQuestion.correctOption === index
                                                ? 'border-green-500 bg-green-500 text-white'
                                                : (isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-slate-600 text-slate-400 bg-slate-800'))
                                            : (isSelected
                                                ? 'border-indigo-400 bg-indigo-500 text-white shadow-sm'
                                                : 'border-slate-600 text-slate-300 bg-slate-800')
                                            }`}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className="font-semibold text-base leading-snug break-words flex-1 text-inherit">
                                            {option}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Short Answer */}
                {qType === 'short_answer' && (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={(answers[currentQuestion.id] as string) || ''}
                            onChange={(e) => handleTextChange(e.target.value)}
                            disabled={activeReviewMode}
                            placeholder="Type your answer here..."
                            className={`w-full px-4 py-3.5 border-2 rounded-xl text-white !bg-slate-800/90 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-medium text-base ${activeReviewMode ? '!bg-slate-800/50 border-slate-700 cursor-not-allowed text-slate-400' : 'border-slate-700'
                                }`}
                        />
                        {activeReviewMode && (
                            <p className="mt-2 text-sm text-slate-400 italic">This is a text response — no auto-scoring.</p>
                        )}
                    </div>
                )}

                {/* Paragraph */}
                {qType === 'paragraph' && (
                    <div className="space-y-2">
                        <textarea
                            value={(answers[currentQuestion.id] as string) || ''}
                            onChange={(e) => handleTextChange(e.target.value)}
                            disabled={activeReviewMode}
                            placeholder="Type your detailed answer here..."
                            rows={5}
                            className={`w-full px-4 py-3.5 border-2 rounded-xl text-white !bg-slate-800/90 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y font-medium text-base ${activeReviewMode ? '!bg-slate-800/50 border-slate-700 cursor-not-allowed text-slate-400' : 'border-slate-700'
                                }`}
                        />
                        {activeReviewMode && (
                            <p className="mt-2 text-sm text-slate-400 italic">This is a text response — no auto-scoring.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className={`!border-slate-700 !text-slate-200 hover:!bg-slate-800 font-semibold ${currentIndex === 0 ? 'invisible' : ''}`}
                >
                    Previous
                </Button>
                <div className="flex gap-2">
                    <Button
                        onClick={handleNext}
                        disabled={!activeReviewMode && !isCurrentAnswered()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isLastQuestion ? (activeReviewMode ? 'Close Review' : 'Submit Quiz') : 'Next Question'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

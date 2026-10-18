import React, { useState, useRef } from 'react';
import { QuizQuestion } from '@/lib/types/firestore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { uploadImage } from '@/lib/utils/storage';
import { toast } from '@/lib/stores/toastStore';
import Papa from 'papaparse';

interface QuizBuilderProps {
    questions: QuizQuestion[];
    onChange: (questions: QuizQuestion[]) => void;
}

const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
    { value: 'short_answer', label: 'Short Answer', icon: '—' },
    { value: 'paragraph', label: 'Paragraph', icon: '≡' },
] as const;

export default function QuizBuilder({ questions, onChange }: QuizBuilderProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addQuestion = (type: QuizQuestion['type'] = 'multiple_choice') => {
        const newQuestion: QuizQuestion = {
            id: crypto.randomUUID(),
            type: type || 'multiple_choice',
            text: '',
            options: type === 'multiple_choice' ? ['', '', '', ''] : [],
            correctOption: 0,
        };
        onChange([...questions, newQuestion]);
        setEditingId(newQuestion.id);
    };

    const removeQuestion = (id: string) => {
        onChange(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
        onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const changeQuestionType = (id: string, newType: QuizQuestion['type']) => {
        const q = questions.find(q => q.id === id);
        if (!q) return;
        const updates: Partial<QuizQuestion> = { type: newType };
        if (newType === 'multiple_choice' && (!q.options || q.options.length === 0)) {
            updates.options = ['', '', '', ''];
            updates.correctOption = 0;
        }
        if (newType !== 'multiple_choice') {
            updates.options = [];
            updates.correctOption = 0;
        }
        updateQuestion(id, updates);
    };

    const handleImageUpload = async (id: string, file: File) => {
        try {
            const imageUrl = await uploadImage(file, 'programs');
            updateQuestion(id, { image: imageUrl });
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        }
    };

    const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const importedQuestions: QuizQuestion[] = [];
                let errorCount = 0;

                results.data.forEach((row: any) => {
                    if (!row['Question'] || !row['Answer A'] || !row['Answer B'] || !row['Correct Answer']) {
                        if (Object.keys(row).length > 1) {
                            errorCount++;
                        }
                        return;
                    }

                    let correctIndex = 0;
                    const correctAns = row['Correct Answer'].toString().trim().toLowerCase();

                    if (correctAns === 'a' || correctAns === 'a)' || correctAns === row['Answer A']?.toString().toLowerCase()) correctIndex = 0;
                    else if (correctAns === 'b' || correctAns === 'b)' || correctAns === row['Answer B']?.toString().toLowerCase()) correctIndex = 1;
                    else if (correctAns === 'c' || correctAns === 'c)' || correctAns === row['Answer C']?.toString().toLowerCase()) correctIndex = 2;
                    else if (correctAns === 'd' || correctAns === 'd)' || correctAns === row['Answer D']?.toString().toLowerCase()) correctIndex = 3;

                    importedQuestions.push({
                        id: crypto.randomUUID(),
                        type: 'multiple_choice',
                        text: row['Question'],
                        options: [
                            row['Answer A'],
                            row['Answer B'],
                            row['Answer C'] || '',
                            row['Answer D'] || ''
                        ],
                        correctOption: correctIndex
                    });
                });

                if (importedQuestions.length > 0) {
                    onChange([...questions, ...importedQuestions]);
                    toast.success(`Successfully imported ${importedQuestions.length} questions.`);
                } else {
                    toast.error("No valid questions found in CSV. Please check the format.");
                }

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                toast.error('Failed to parse CSV file.');
            }
        });
    };

    const getQuestionType = (q: QuizQuestion) => q.type || 'multiple_choice';
    const getTypeLabel = (type: string) => QUESTION_TYPES.find(t => t.value === type)?.label || 'Multiple Choice';
    const getTypeIcon = (type: string) => QUESTION_TYPES.find(t => t.value === type)?.icon || '◉';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-md font-bold text-gray-900 dark:text-white">Quiz Questions</h4>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVUpload}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800"
                    >
                        Import CSV
                    </Button>
                    <div className="relative group">
                        <Button size="sm" onClick={() => addQuestion('multiple_choice')} type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            Add Question
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick-add buttons for different types */}
            <div className="flex gap-2 flex-wrap">
                {QUESTION_TYPES.map(qt => (
                    <button
                        key={qt.value}
                        type="button"
                        onClick={() => addQuestion(qt.value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                        <span className="text-sm">{qt.icon}</span>
                        {qt.label}
                    </button>
                ))}
            </div>

            {questions.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-400 font-medium">
                    No questions added yet. Click a question type above or "Add Question" to start building your quiz.
                </div>
            )}

            <div className="space-y-4">
                {questions.map((question, index) => {
                    const qType = getQuestionType(question);
                    return (
                        <div key={question.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-800/80 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-gray-900 dark:text-white">Question {index + 1}</h5>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${qType === 'multiple_choice' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50' :
                                            qType === 'short_answer' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50' :
                                                'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                        }`}>
                                        {getTypeIcon(qType)} {getTypeLabel(qType)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(editingId === question.id ? null : question.id)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-semibold"
                                    >
                                        {editingId === question.id ? 'Collapse' : 'Edit'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(question.id)}
                                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {editingId === question.id ? (
                                <div className="space-y-4">
                                    {/* Question Type Selector */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Question Type</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {QUESTION_TYPES.map(qt => (
                                                <button
                                                    key={qt.value}
                                                    type="button"
                                                    onClick={() => changeQuestionType(question.id, qt.value)}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition ${qType === qt.value
                                                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <span>{qt.icon}</span>
                                                    {qt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Question Text</label>
                                        <textarea
                                            value={question.text}
                                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-gray-400 dark:placeholder-slate-500"
                                            rows={2}
                                            placeholder="Enter your question here..."
                                        />
                                    </div>

                                    {/* Question Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Question Image (Optional)</label>
                                        {question.image && (
                                            <div className="mb-2 relative w-full h-48 bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                                <img src={question.image} alt="Question" className="w-full h-full object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuestion(question.id, { image: undefined })}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                        {!question.image && (
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(question.id, file);
                                                }}
                                                className="block w-full text-sm text-gray-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/60 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 cursor-pointer"
                                            />
                                        )}
                                    </div>

                                    {/* Type-specific content */}
                                    {qType === 'multiple_choice' && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Options</label>
                                            {question.options.map((option, optIndex) => (
                                                <div key={optIndex} className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${question.id}`}
                                                        checked={question.correctOption === optIndex}
                                                        onChange={() => updateQuestion(question.id, { correctOption: optIndex })}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-700"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...question.options];
                                                            newOptions[optIndex] = e.target.value;
                                                            updateQuestion(question.id, { options: newOptions });
                                                        }}
                                                        placeholder={`Option ${optIndex + 1}`}
                                                        className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-gray-400 dark:placeholder-slate-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOptions = question.options.filter((_, i) => i !== optIndex);
                                                            let newCorrect = question.correctOption;
                                                            if (question.correctOption === optIndex) newCorrect = 0;
                                                            else if (question.correctOption > optIndex) newCorrect--;
                                                            updateQuestion(question.id, { options: newOptions, correctOption: newCorrect });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500"
                                                        title="Remove Option"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    updateQuestion(question.id, { options: [...question.options, ''] });
                                                }}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold"
                                            >
                                                + Add Option
                                            </Button>
                                        </div>
                                    )}

                                    {qType === 'short_answer' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Response Preview</label>
                                            <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 bg-gray-50 dark:bg-slate-900">
                                                <div className="h-10 border-b-2 border-gray-300 dark:border-slate-700 flex items-end pb-1">
                                                    <span className="text-sm text-gray-400 dark:text-slate-500 italic">Short answer text</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium">Students will type a short text response here.</p>
                                            </div>
                                        </div>
                                    )}

                                    {qType === 'paragraph' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Response Preview</label>
                                            <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 bg-gray-50 dark:bg-slate-900">
                                                <div className="space-y-2">
                                                    <div className="h-6 border-b border-gray-300 dark:border-slate-700"></div>
                                                    <div className="h-6 border-b border-gray-300 dark:border-slate-700"></div>
                                                    <div className="h-6 border-b border-gray-300 dark:border-slate-700 w-3/4"></div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium">Students will type a long-form response here.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{question.text || 'New Question'}</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
                                        {qType === 'multiple_choice' ? `${question.options.length} options defined` :
                                            qType === 'short_answer' ? 'Short answer response' :
                                                'Paragraph response'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

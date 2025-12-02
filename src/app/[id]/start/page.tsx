'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { extractDominantColors, getContrastColor, adjustColorBrightness } from '@/lib/colorUtils';
import { getAssetPath, fetchApi } from '@/lib/api';
import LatexText from '@/components/LatexText';
import { Timer, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function QuizPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const competitionId = params.id as string;
    const nameParam = searchParams.get('name');

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [timeLeft, setTimeLeft] = useState(20);
    const [userName, setUserName] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [settings, setSettings] = useState<any>({});

    // Dynamic Theme State
    const [buttonColor, setButtonColor] = useState('#E60012'); // Default Red
    const [buttonTextColor, setButtonTextColor] = useState('white');

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch settings
        fetchApi(`/api/settings?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(async data => {
                setSettings(data);
                if (data.question_timer) {
                    setTimeLeft(parseInt(data.question_timer));
                }

                // Extract colors if banner exists
                if (data.banner) {
                    try {
                        const bannerUrl = getAssetPath(data.banner);
                        const colors = await extractDominantColors(bannerUrl, 1);
                        if (colors.length > 0) {
                            let primary = colors[0];
                            // If the color is light, darken it by 50%
                            if (getContrastColor(primary) === 'black') {
                                primary = adjustColorBrightness(primary, -50);
                            }
                            setButtonColor(primary);
                            setButtonTextColor(getContrastColor(primary));
                        }
                    } catch (e) {
                        console.error("Failed to extract colors for quiz button", e);
                    }
                }

                // Auto start if name is present
                if (nameParam) {
                    setUserName(nameParam);
                    handleAutoStart(nameParam, data);
                }
            });
    }, [competitionId, nameParam]);

    const handleAutoStart = async (name: string, currentSettings: any) => {
        setLoading(true);
        try {
            const res = await fetchApi(`/api/questions?mode=quiz&competitionId=${competitionId}`);
            const data = await res.json();
            if (data.length === 0) {
                alert('暂无题目');
                setLoading(false);
                return;
            }
            let processedData = data;
            if (currentSettings.random_options === 'true') {
                processedData = data.map((q: any) => {
                    const originalOptions = q.options;
                    const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, Object.keys(originalOptions).length);
                    const correctKeys = q.answer.split('');

                    const entriesWithStatus = Object.entries(originalOptions).map(([k, v]) => ({
                        key: k,
                        val: v,
                        isCorrect: correctKeys.includes(k)
                    }));

                    // Shuffle
                    for (let i = entriesWithStatus.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [entriesWithStatus[i], entriesWithStatus[j]] = [entriesWithStatus[j], entriesWithStatus[i]];
                    }

                    const finalOptions: any = {};
                    let finalAnswer = '';

                    entriesWithStatus.forEach((item, index) => {
                        const newKey = keys[index];
                        finalOptions[newKey] = item.val;
                        if (item.isCorrect) {
                            finalAnswer += newKey;
                        }
                    });

                    finalAnswer = finalAnswer.split('').sort().join('');

                    return {
                        ...q,
                        options: finalOptions,
                        answer: finalAnswer,
                        originalId: q.id
                    };
                });
            }
            setQuestions(processedData);
            setIsStarted(true);
            setStartTime(Date.now());

            // Start timer logic
            if (timerRef.current) clearInterval(timerRef.current);
            const timerValue = currentSettings.question_timer ? parseInt(currentSettings.question_timer) : 20;
            setTimeLeft(timerValue);

            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // We need to handle next, but handleNext depends on state that might be stale in closure if not careful.
                        // But here we are inside useEffect -> handleAutoStart.
                        // Actually, the interval callback will run later.
                        // We should use a ref or a stable function for handleNext if possible, 
                        // or just rely on the fact that we will trigger a state update that might cause re-render?
                        // The issue is calling handleNext from within the interval.
                        // Let's use a ref for the current index or just let the timer run out and auto-submit/next via effect?
                        // For simplicity, let's just use the same logic as startTimer but we need to make sure handleNext works.
                        // Since handleNext uses `questions` and `currentQuestionIndex`, we need to be careful.
                        // A better way is to use a useEffect for the timer decrement.
                        return prev - 1;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Failed to start quiz', error);
            alert('开始答题失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // Re-implement timer effect to handle 0
    useEffect(() => {
        if (!isStarted) return;

        if (timeLeft === 0) {
            handleNext();
        }
    }, [timeLeft, isStarted]);


    const startQuiz = async () => {
        if (!userName.trim()) {
            alert('请输入姓名');
            return;
        }
        setLoading(true);
        try {
            const res = await fetchApi(`/api/questions?mode=quiz&competitionId=${competitionId}`);
            const data = await res.json();
            if (data.length === 0) {
                alert('暂无题目');
                setLoading(false);
                return;
            }
            let processedData = data;
            if (settings.random_options === 'true') {
                processedData = data.map((q: any) => {
                    const originalOptions = q.options;
                    const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, Object.keys(originalOptions).length);
                    const correctKeys = q.answer.split('');

                    const entriesWithStatus = Object.entries(originalOptions).map(([k, v]) => ({
                        key: k,
                        val: v,
                        isCorrect: correctKeys.includes(k)
                    }));

                    // Shuffle
                    for (let i = entriesWithStatus.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [entriesWithStatus[i], entriesWithStatus[j]] = [entriesWithStatus[j], entriesWithStatus[i]];
                    }

                    const finalOptions: any = {};
                    let finalAnswer = '';

                    entriesWithStatus.forEach((item, index) => {
                        const newKey = keys[index];
                        finalOptions[newKey] = item.val;
                        if (item.isCorrect) {
                            finalAnswer += newKey;
                        }
                    });

                    finalAnswer = finalAnswer.split('').sort().join('');

                    return {
                        ...q,
                        options: finalOptions,
                        answer: finalAnswer,
                        originalId: q.id
                    };
                });
            }
            setQuestions(processedData);
            setIsStarted(true);
            setStartTime(Date.now());
            startTimer();
        } catch (error) {
            console.error('Failed to start quiz', error);
            alert('开始答题失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const timerValue = settings.question_timer ? parseInt(settings.question_timer) : 20;
        setTimeLeft(timerValue);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
    };

    const handleOptionSelect = (optionKey: string) => {
        const currentQuestion = questions[currentQuestionIndex];
        const isMultiple = currentQuestion.type === 'multiple';

        if (isMultiple) {
            const currentAns = answers[currentQuestion.id] || '';
            let newAns = currentAns;
            if (currentAns.includes(optionKey)) {
                newAns = currentAns.replace(optionKey, '');
            } else {
                newAns = currentAns + optionKey;
            }
            // Sort to ensure consistency (A, AB, ABC)
            newAns = newAns.split('').sort().join('');
            setAnswers((prev: any) => ({ ...prev, [currentQuestion.id]: newAns }));
        } else {
            setAnswers((prev: any) => ({ ...prev, [currentQuestion.id]: optionKey }));
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            const timerValue = settings.question_timer ? parseInt(settings.question_timer) : 20;
            setTimeLeft(timerValue);
        } else {
            submitQuiz();
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
            const timerValue = settings.question_timer ? parseInt(settings.question_timer) : 20;
            setTimeLeft(timerValue);
        }
    };

    const submitQuiz = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSubmitting(true);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        // Format answers for submission - Include ALL questions
        const formattedAnswers = questions.map((q) => ({
            questionId: q.originalId || q.id, // Use original ID for DB lookup, but we also send options snapshot
            answer: answers[q.id] || '',
            // Send snapshot of options and correct answer for this specific attempt
            options: q.options,
            correctAnswer: q.answer
        }));

        try {
            const res = await fetchApi('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName,
                    answers: formattedAnswers,
                    timeTaken,
                    competitionId
                })
            });
            const result = await res.json();
            router.push(`/${competitionId}/result?id=${result.recordId}`);
        } catch (error) {
            console.error('Submit failed', error);
            alert('提交失败，请重试');
            setSubmitting(false);
        }
    };

    if (!isStarted) {
        // If we are auto-starting (nameParam exists), show loading instead of the start form
        if (nameParam) {
            return (
                <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-500 font-medium">正在进入答题...</p>
                    </div>
                </main>
            );
        }

        return (
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">准备好开始了吗？</h1>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="请输入您的姓名"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg"
                        />
                        <button
                            onClick={startQuiz}
                            disabled={loading}
                            className="w-full py-3 text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all rounded-lg"
                            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                        >
                            {loading ? '加载中...' : '开始答题'}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        共 10 道题目，每题 {settings.question_timer || 20} 秒
                    </p>
                </div>
            </main>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 font-bold text-xs">
                            {userName.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-700">{userName}</span>
                    </div>
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                        <Timer size={20} />
                        {timeLeft}s
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%`, backgroundColor: buttonColor }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>进度</span>
                    <span>{currentQuestionIndex + 1} / {questions.length}</span>
                </div>
            </header>

            {/* Question Card */}
            <div className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div className="space-y-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${currentQuestion.type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {currentQuestion.type === 'single' ? '单选题' : '多选题'}
                        </span>
                        <h2 className="text-xl font-bold text-gray-800 leading-relaxed">
                            <LatexText text={currentQuestion.content} />
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(currentQuestion.options).map(([key, val]: any) => {
                            const isSelected = (answers[currentQuestion.id] || '').includes(key);
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleOptionSelect(key)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3
                                        ${isSelected
                                            ? 'bg-blue-50 shadow-md'
                                            : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    style={isSelected ? { borderColor: buttonColor, color: buttonColor, backgroundColor: `${buttonColor}10` } : {}}
                                >
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 
                                        ${isSelected ? 'text-white' : 'border-gray-300 text-gray-500'}`}
                                        style={isSelected ? { backgroundColor: buttonColor, borderColor: buttonColor } : {}}
                                    >
                                        {key}
                                    </span>
                                    <span className="font-medium text-lg"><LatexText text={val} /></span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    {settings.allow_back_tracking === 'true' && currentQuestionIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            disabled={submitting}
                            className="flex-1 py-4 text-xl font-bold shadow-lg rounded-xl transition-all hover:opacity-90 active:scale-95 bg-gray-200 text-gray-700"
                        >
                            上一题
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={submitting}
                        className="flex-1 py-4 text-xl font-bold shadow-lg rounded-xl transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                        {submitting ? '提交中...' : (currentQuestionIndex < questions.length - 1 ? '下一题' : '提交试卷')}
                    </button>
                </div>
            </div>
        </main>
    );
}

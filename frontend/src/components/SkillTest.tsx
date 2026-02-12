import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';

interface Question {
    id: number;
    question: string;
    options: string[];
}

interface SkillTestProps {
    subject: string;
    onComplete: (passed: boolean, score: number) => void;
}

export const SkillTest: React.FC<SkillTestProps> = ({ subject, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [error, setError] = useState<string | null>(null);

    const startTest = async () => {
        setLoading(true);
        setError(null);
        try {
            const result: any = await apiClient.requestSkillTest({ subject, difficulty: 'intermediate' });
            setQuestions(result.questions);
            setTestStarted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to start test.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: number, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const submitTest = async () => {
        setLoading(true);
        setError(null);
        try {
            const result: any = await apiClient.submitSkillTest({ answers });
            onComplete(result.passed, result.score);
        } catch (err: any) {
            setError(err.message || 'Failed to submit test.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading Skill Test...</div>;

    if (!testStarted) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-xl font-bold mb-4">Take Skill Test: {subject}</h3>
                <p className="mb-4 text-gray-600">
                    Prove your expertise by taking a generic AI-generated quiz.
                    You need 70% to pass.
                </p>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <button
                    onClick={startTest}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                    Start Test
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-6">Skill Assessment: {subject}</h3>
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="space-y-6">
                {questions.map((q) => (
                    <div key={q.id} className="border-b pb-4 last:border-0">
                        <p className="font-semibold mb-3">{q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((option) => (
                                <label key={option} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <input
                                        type="radio"
                                        name={`q-${q.id}`}
                                        value={option}
                                        checked={answers[q.id] === option}
                                        onChange={() => handleAnswer(q.id, option)}
                                        className="form-radio text-blue-600"
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={submitTest}
                disabled={Object.keys(answers).length !== questions.length}
                className={`mt-6 w-full py-2 px-4 rounded text-white transition ${Object.keys(answers).length !== questions.length
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
            >
                Submit Test
            </button>
        </div>
    );
};

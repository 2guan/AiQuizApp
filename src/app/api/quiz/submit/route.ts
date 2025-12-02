import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userName, answers, timeTaken, competitionId } = body;

        if (!userName || !answers) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const db = getDb();

        // Fetch all questions to validate answers
        // If competitionId is provided, filter questions by it
        let allQuestions: any[];
        if (competitionId) {
            allQuestions = db.prepare('SELECT * FROM questions WHERE competition_id = ?').all(competitionId);
        } else {
            allQuestions = db.prepare('SELECT * FROM questions').all();
        }

        const totalInDb = allQuestions.length;

        // Determine scoring rule based on DB size (matching the quiz generation logic)
        // If DB > 10, we assume the user answered 10 questions, each worth 10 points.
        // If DB <= 10, we assume the user answered all questions, each worth 100/total points.

        // Fetch settings for scoring logic
        const settingsStmt = db.prepare('SELECT key, value FROM settings WHERE competition_id = ?');
        const settingsRows = competitionId ? settingsStmt.all(competitionId) : [];
        const settings = settingsRows.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const singleCount = parseInt(settings.single_choice_count || '10');
        const multipleCount = parseInt(settings.multiple_choice_count || '0');
        const configuredTotal = singleCount + multipleCount;

        let pointsPerQuestion = 0;
        if (totalInDb <= configuredTotal) {
            // If total available questions are less than or equal to configured, 
            // score is 100 / total available.
            pointsPerQuestion = totalInDb > 0 ? 100 / totalInDb : 0;
        } else {
            // If total available questions are more than configured,
            // score is 100 / configured total.
            pointsPerQuestion = configuredTotal > 0 ? 100 / configuredTotal : 0;
        }

        let score = 0;
        const details: any = {};

        // answers is expected to be an array: [{ questionId, answer }, ...]
        const answersArray: any[] = [];
        if (Array.isArray(answers)) {
            answersArray.push(...answers);
        } else {
            // Fallback for legacy object format
            Object.keys(answers).forEach(key => {
                answersArray.push({ questionId: parseInt(key), answer: answers[key] });
            });
        }

        answersArray.forEach((item: any) => {
            const qId = item.questionId;
            const userAnswer = item.answer;
            const question = allQuestions.find(q => q.id === qId);

            if (question) {
                // If item has correctAnswer (from shuffled frontend), use it. Otherwise use DB answer.
                const correctAns = item.correctAnswer || question.answer;
                const isCorrect = userAnswer === correctAns;

                if (isCorrect) {
                    score += pointsPerQuestion;
                }
                // We construct details just in case, though we return it based on DB record later
                details[qId] = {
                    userAnswer,
                    correctAnswer: question.answer,
                    isCorrect,
                    explanation: question.explanation,
                    questionContent: question.content,
                    options: JSON.parse(question.options),
                    type: question.type
                };
            }
        });

        score = Math.round(score);

        const insert = db.prepare(`
            INSERT INTO quiz_records (competition_id, user_name, score, time_taken, details, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now', '+8 hours'))
        `);

        const result = insert.run(competitionId || null, userName, score, timeTaken || 0, JSON.stringify(answers));
        const recordId = result.lastInsertRowid;

        // Calculate rank within this competition
        let rankQuery = 'SELECT COUNT(*) as count FROM quiz_records WHERE score > ?';
        let totalQuery = 'SELECT COUNT(*) as count FROM quiz_records';
        const params = [score];
        const totalParams = [];

        if (competitionId) {
            rankQuery += ' AND competition_id = ?';
            totalQuery += ' WHERE competition_id = ?';
            params.push(competitionId);
            totalParams.push(competitionId);
        }

        const rankResult: any = db.prepare(rankQuery).get(...params);
        const rank = rankResult.count + 1;

        const totalResult: any = db.prepare(totalQuery).get(...totalParams);
        const totalParticipants = totalResult.count;

        return NextResponse.json({
            score,
            rank,
            totalParticipants,
            details,
            recordId
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
    }
}

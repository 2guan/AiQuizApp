import { NextResponse } from 'next/server';
import db from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const text = formData.get('text') as string;
        const competitionId = formData.get('competitionId') as string;

        let questionsToCreate: any[] = [];

        if (file) {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            questionsToCreate = jsonData.map((row: any) => {
                const options = {
                    A: (row['选项A'] || '').toString().trim(),
                    B: (row['选项B'] || '').toString().trim(),
                    C: (row['选项C'] || '').toString().trim(),
                    D: (row['选项D'] || '').toString().trim(),
                };
                const typeStr = (row['题目类型'] || '').toString().trim();

                return {
                    competition_id: competitionId || null,
                    type: typeStr.includes('多') ? 'multiple' : 'single',
                    content: (row['题目'] || '').toString().trim(),
                    answer: (row['答案'] || '').toString().trim(),
                    explanation: (row['答案解析'] || '').toString().trim(),
                    options: JSON.stringify(options),
                };
            });
        } else if (text) {
            const lines = text.split('\n');
            questionsToCreate = lines.filter(line => line.trim()).map(line => {
                // Handle potential carriage returns and split by tab
                const parts = line.replace('\r', '').split('\t');

                // Skip header row or empty lines
                if (parts.length < 3 || parts[0].includes('题目类型')) return null;

                const options = {
                    A: (parts[3] || '').trim(),
                    B: (parts[4] || '').trim(),
                    C: (parts[5] || '').trim(),
                    D: (parts[6] || '').trim(),
                };

                const typeStr = (parts[0] || '').trim();

                return {
                    competition_id: competitionId || null,
                    type: typeStr.includes('多') ? 'multiple' : 'single',
                    content: (parts[1] || '').trim(),
                    answer: (parts[2] || '').trim(),
                    explanation: (parts[7] || '').trim(),
                    options: JSON.stringify(options),
                };
            }).filter(q => q !== null);
        }

        if (questionsToCreate.length > 0) {
            const insert = db.prepare(`
        INSERT INTO questions (competition_id, type, content, options, answer, explanation)
        VALUES (@competition_id, @type, @content, @options, @answer, @explanation)
      `);

            const insertMany = db.transaction((questions: any[]) => {
                for (const q of questions) insert.run(q);
            });

            insertMany(questionsToCreate);
        }

        return NextResponse.json({ count: questionsToCreate.length });
    } catch (error) {
        console.error('Error importing questions:', error);
        return NextResponse.json({ error: 'Failed to import questions' }, { status: 500 });
    }
}

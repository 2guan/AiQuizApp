
import { useState } from 'react';
import { Upload, FileText, Loader2, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import LatexText from '@/components/LatexText';

export default function AIGenerator({ onSaveSuccess, competitionId }: { onSaveSuccess?: () => void, competitionId: string }) {
    const [inputText, setInputText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [singleCount, setSingleCount] = useState<number | string>(5);
    const [multipleCount, setMultipleCount] = useState<number | string>(0);
    const [loading, setLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleGenerate = async () => {
        if (!inputText && !file) {
            setError('请提供文本内容或上传 Word 文档');
            return;
        }

        const sCount = typeof singleCount === 'string' ? (parseInt(singleCount) || 0) : singleCount;
        const mCount = typeof multipleCount === 'string' ? (parseInt(multipleCount) || 0) : multipleCount;

        if (sCount === 0 && mCount === 0) {
            setError('请至少生成一道题目');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');
        setGeneratedQuestions([]);

        const formData = new FormData();
        formData.append('text', inputText);
        if (file) formData.append('file', file);
        formData.append('singleCount', sCount.toString());
        formData.append('multipleCount', mCount.toString());
        formData.append('competitionId', competitionId);

        try {
            const res = await fetchApi('/api/ai/generate', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '生成失败');
            }

            setGeneratedQuestions(data);
            // Select all by default
            setSelectedIndices(data.map((_: any, i: number) => i));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (selectedIndices.length === 0) return;

        const questionsToSave = selectedIndices.map(i => generatedQuestions[i]);

        try {
            const res = await fetchApi('/api/ai/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: questionsToSave, competitionId })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setSuccessMsg(`成功保存 ${data.count} 道题目！`);
            setGeneratedQuestions([]);
            setSelectedIndices([]);
            setInputText('');
            setFile(null);
            if (onSaveSuccess) onSaveSuccess();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const toggleSelection = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const removeQuestion = (index: number) => {
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
        setSelectedIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <FileText className="text-blue-600" size={20} />
                    </div>
                    输入内容
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">文本内容</label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-gray-50 focus:bg-white"
                            placeholder="在此粘贴文本内容，AI 将根据内容自动生成题目..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">或上传 Word 文档 (.docx)</label>
                        <div className="flex items-center gap-4">
                            <label className={`cursor-pointer flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-xl transition-all ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
                                <Upload size={20} className={file ? 'text-blue-600' : 'text-gray-400'} />
                                <span className={file ? 'text-blue-700 font-medium' : 'text-gray-500'}>{file ? file.name : '点击选择文件'}</span>
                                <input
                                    type="file"
                                    accept=".docx"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            {file && (
                                <button onClick={() => setFile(null)} className="p-4 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">单选题数量</label>
                            <input
                                type="number"
                                value={singleCount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') setSingleCount('');
                                    else setSingleCount(Math.max(0, parseInt(val) || 0));
                                }}
                                min="0"
                                max="20"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">多选题数量</label>
                            <input
                                type="number"
                                value={multipleCount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') setMultipleCount('');
                                    else setMultipleCount(Math.max(0, parseInt(val) || 0));
                                }}
                                min="0"
                                max="20"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform active:scale-99"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                正在生成题目...
                            </>
                        ) : (
                            <>
                                <FileText />
                                开始生成
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {generatedQuestions.length > 0 && (
                <>
                    <hr className="border-gray-100" />
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <Check className="text-green-600" size={20} />
                                </div>
                                生成结果预览
                            </h2>
                            <button
                                onClick={handleSave}
                                disabled={selectedIndices.length === 0}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                                <Plus size={18} />
                                保存选中题目 ({selectedIndices.length})
                            </button>
                        </div>

                        <div className="space-y-4">
                            {generatedQuestions.map((q, index) => (
                                <div
                                    key={index}
                                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${selectedIndices.includes(index)
                                        ? 'border-blue-500 bg-blue-50/50'
                                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                        }`}
                                    onClick={() => toggleSelection(index)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIndices.includes(index) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                                                }`}>
                                                {selectedIndices.includes(index) && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="font-bold text-gray-900">题目 {index + 1}</span>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${q.type === 'single' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {q.type === 'single' ? '单选' : '多选'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <p className="mb-4 text-gray-800 font-medium text-lg">
                                        <LatexText text={q.content} />
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                                        {Object.entries(q.options).map(([key, val]: any) => (
                                            <div key={key} className={`p-3 rounded-lg border transition-colors ${q.answer.includes(key) ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-white border-gray-200 text-gray-600'
                                                }`}>
                                                <span className="mr-2">{key}.</span> <LatexText text={val} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg border border-gray-200">
                                        <span className="font-bold text-gray-800">解析：</span> <LatexText text={typeof q.explanation === 'object' ? JSON.stringify(q.explanation) : q.explanation} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {successMsg && (
                <div className="fixed bottom-8 right-8 p-4 bg-green-600 text-white rounded-lg shadow-lg animate-bounce-in flex items-center gap-2">
                    <Check />
                    {successMsg}
                </div>
            )}
        </div>
    );
}

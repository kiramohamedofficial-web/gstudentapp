
import React, { useState, useMemo } from 'react';
import { Lesson } from '../../types';
import { getAllGrades, generateAccessToken } from '../../services/storageService';
import { PrinterIcon, QrcodeIcon } from '../common/Icons';

const Select: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string; disabled?: boolean; }> = ({ label, value, onChange, options, placeholder, disabled = false }) => (
    <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all duration-300 disabled:opacity-50"
        >
            <option value="">{placeholder}</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    </div>
);

const QrCodeGeneratorView: React.FC = () => {
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedLessonId, setSelectedLessonId] = useState<string>('');
    
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [generatedForLesson, setGeneratedForLesson] = useState<Lesson | null>(null);

    const grades = useMemo(() => getAllGrades(), []);

    const selectedGrade = useMemo(() => grades.find(g => g.id === parseInt(selectedGradeId)), [grades, selectedGradeId]);
    const semesters = useMemo(() => selectedGrade?.semesters || [], [selectedGrade]);
    
    const selectedSemester = useMemo(() => semesters.find(s => s.id === selectedSemesterId), [semesters, selectedSemesterId]);
    const units = useMemo(() => selectedSemester?.units || [], [selectedSemester]);

    const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);
    const lessons = useMemo(() => selectedUnit?.lessons || [], [selectedUnit]);

    const handleGenerate = () => {
        if (!selectedGradeId || !selectedSemesterId || !selectedUnitId || !selectedLessonId) return;
        const token = generateAccessToken(
            parseInt(selectedGradeId),
            selectedSemesterId,
            selectedUnitId,
            selectedLessonId
        );
        setGeneratedToken(token);
        const lesson = lessons.find(l => l.id === selectedLessonId);
        setGeneratedForLesson(lesson || null);
    };

    const handlePrint = () => {
        const qrCodeElement = document.getElementById('qr-code-printable-area');
        if (qrCodeElement) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <html>
                <head>
                    <title>طباعة رمز QR</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: center; padding: 40px; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .content { border: 2px dashed #ccc; padding: 30px; border-radius: 15px; }
                        img { max-width: 300px; margin-bottom: 20px; border-radius: 10px; }
                        h1 { font-size: 24px; margin: 0 0 10px 0; }
                        p { font-size: 16px; color: #555; margin: 0; }
                    </style>
                </head>
                <body>
                    <div class="content">
                        ${qrCodeElement.innerHTML}
                    </div>
                </body>
                </html>
            `);
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => {
                printWindow?.print();
                printWindow?.close();
            }, 250);
        }
    };

    const resetSelections = (level: 'grade' | 'semester' | 'unit') => {
        if (level === 'grade') {
            setSelectedSemesterId('');
            setSelectedUnitId('');
            setSelectedLessonId('');
        }
        if (level === 'semester') {
            setSelectedUnitId('');
            setSelectedLessonId('');
        }
        if (level === 'unit') {
            setSelectedLessonId('');
        }
        setGeneratedToken(null);
        setGeneratedForLesson(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">مولد رمز الاستجابة السريعة (QR)</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أنشئ رمزًا فريدًا لمرة واحدة لمنح وصول حصري إلى درس أو واجب معين.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side - Configuration */}
                <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">1. حدد المحتوى</h2>
                    <div className="space-y-4">
                        <Select
                            label="الصف الدراسي"
                            value={selectedGradeId}
                            onChange={val => { setSelectedGradeId(val); resetSelections('grade'); }}
                            options={grades.map(g => ({ value: g.id.toString(), label: g.name }))}
                            placeholder="اختر الصف الدراسي..."
                        />
                        <Select
                            label="الفصل الدراسي"
                            value={selectedSemesterId}
                            onChange={val => { setSelectedSemesterId(val); resetSelections('semester'); }}
                            options={semesters.map(s => ({ value: s.id, label: s.title }))}
                            placeholder="اختر الفصل الدراسي..."
                            disabled={!selectedGradeId}
                        />
                        <Select
                            label="الوحدة"
                            value={selectedUnitId}
                            onChange={val => { setSelectedUnitId(val); resetSelections('unit'); }}
                            options={units.map(u => ({ value: u.id, label: u.title }))}
                            placeholder="اختر الوحدة..."
                            disabled={!selectedSemesterId}
                        />
                        <Select
                            label="الدرس"
                            value={selectedLessonId}
                            onChange={setSelectedLessonId}
                            options={lessons.map(l => ({ value: l.id, label: l.title }))}
                            placeholder="اختر الدرس..."
                            disabled={!selectedUnitId}
                        />
                    </div>
                    <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">2. أنشئ الرمز</h2>
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedLessonId}
                            className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-gradient-to-r from-blue-600 to-green-500 rounded-lg 
                                       hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                                       transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <QrcodeIcon className="w-6 h-6 ml-2" />
                            إنشاء الرمز
                        </button>
                    </div>
                </div>
                
                {/* Right side - Result */}
                <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] flex flex-col items-center justify-center min-h-[300px]">
                    {generatedToken ? (
                        <div className="text-center fade-in w-full">
                            <div id="qr-code-printable-area" className="flex flex-col items-center">
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">الرمز جاهز للمسح</h1>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedToken)}&bgcolor=0D1117&color=c9d1d9&qzone=1`}
                                    alt="Generated QR Code"
                                    className="rounded-lg border-4 border-[var(--border-primary)]"
                                />
                                <p className="mt-4 text-[var(--text-secondary)]">هذا الرمز يفتح: <span className="font-bold text-[var(--text-primary)]">{generatedForLesson?.title}</span></p>
                                <p className="text-xs text-yellow-400/80 mt-2">ملاحظة: هذا الرمز صالح للاستخدام مرة واحدة فقط.</p>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="mt-6 w-full max-w-xs flex items-center justify-center py-2.5 px-4 font-semibold text-white bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg 
                                           hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                            >
                                <PrinterIcon className="w-5 h-5 ml-2" />
                                طباعة الرمز
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-secondary)]">
                            <QrcodeIcon className="w-20 h-20 mx-auto opacity-20 mb-4" />
                            <p>سيظهر رمز QR هنا بعد إنشائه.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrCodeGeneratorView;

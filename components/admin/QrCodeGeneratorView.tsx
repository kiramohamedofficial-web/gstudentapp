import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Teacher, SubscriptionCode, ToastType } from '../../types';
import { getTeachers, generateSubscriptionCodes } from '../../services/storageService';
import { PrinterIcon, PlusIcon, ClipboardIcon } from '../common/Icons';
import { useToast } from '../../useToast';

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

const durationOptions = [
    { value: '30', label: 'شهر واحد (30 يوم)' },
    { value: '90', label: '3 أشهر (90 يوم)' },
    { value: '180', label: '6 أشهر (180 يوم)' },
    { value: '365', label: 'سنة كاملة (365 يوم)' },
];

const QrCodeGeneratorView: React.FC = () => {
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [durationDays, setDurationDays] = useState('30');
    const [codeCount, setCodeCount] = useState(1);
    const [maxUses, setMaxUses] = useState(1);
    const [generatedCodes, setGeneratedCodes] = useState<SubscriptionCode[]>([]);
    const printRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    useEffect(() => {
        const fetchTeachers = async () => {
            const teacherData = await getTeachers();
            setTeachers(teacherData);
        };
        fetchTeachers();
    }, []);

    const teacherOptions = useMemo(() => teachers.map(t => ({ value: t.id, label: t.name })), [teachers]);

    const handleGenerate = () => {
        if (!selectedTeacherId || !durationDays || codeCount < 1 || maxUses < 1) {
            return;
        }
        const codes = generateSubscriptionCodes({
            teacherId: selectedTeacherId,
            durationDays: parseInt(durationDays),
            count: codeCount,
            maxUses: maxUses,
        });
        setGeneratedCodes(codes);
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            addToast('تم نسخ الكود بنجاح!', ToastType.SUCCESS);
        }, () => {
            addToast('فشل نسخ الكود.', ToastType.ERROR);
        });
    };

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <html>
                <head>
                    <title>طباعة أكواد الاشتراك</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: center; margin: 0; padding: 10px; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                        .page { 
                            display: grid; 
                            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
                            gap: 15px; 
                            page-break-before: always;
                        }
                        .code-card {
                            border: 1px solid #ccc;
                            padding: 15px;
                            border-radius: 10px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            page-break-inside: avoid;
                        }
                        h3 { font-size: 14px; margin: 0 0 5px 0; font-weight: bold; }
                        p { font-size: 12px; color: #555; margin: 0 0 10px 0; }
                        .code { 
                            font-family: 'Space Mono', monospace; 
                            font-size: 16px;
                            font-weight: bold;
                            color: #000;
                            background: #eee;
                            padding: 5px 10px;
                            border-radius: 5px;
                            letter-spacing: 1px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                        ${printContent}
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


    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">صانع أكواد الاشتراكات</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أنشئ أكوادًا فريدة لتفعيل اشتراكات الطلاب.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side - Configuration */}
                <div className="lg:col-span-1 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] self-start">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">إعدادات الكود</h2>
                    <div className="space-y-4">
                        <Select
                            label="المدرس"
                            value={selectedTeacherId}
                            onChange={setSelectedTeacherId}
                            options={teacherOptions}
                            placeholder="اختر المدرس..."
                        />
                        <Select
                            label="مدة الاشتراك"
                            value={durationDays}
                            onChange={setDurationDays}
                            options={durationOptions}
                            placeholder="اختر المدة..."
                        />
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">عدد الأكواد</label>
                            <input type="number" value={codeCount} onChange={e => setCodeCount(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">عدد مرات الاستخدام (لكل كود)</label>
                            <input type="number" value={maxUses} onChange={e => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"/>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedTeacherId}
                            className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-gradient-to-r from-blue-600 to-green-500 rounded-lg 
                                       hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                                       transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="w-6 h-6 ml-2" />
                            إنشاء الأكواد
                        </button>
                    </div>
                </div>
                
                {/* Right side - Result */}
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] min-h-[300px]">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">الأكواد المُنشأة ({generatedCodes.length})</h2>
                        {generatedCodes.length > 0 && (
                            <button
                                onClick={handlePrint}
                                className="flex items-center text-sm px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-print"
                            >
                                <PrinterIcon className="w-5 h-5 ml-2" /> طباعة
                            </button>
                        )}
                    </div>
                    {generatedCodes.length > 0 ? (
                        <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                             <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {generatedCodes.map(c => (
                                    <div key={c.code} className="code-card p-4 rounded-lg border border-[var(--border-primary)] text-center bg-[var(--bg-tertiary)] flex flex-col justify-center">
                                        <h3 className="font-semibold">اشتراك {durationDays} يوم</h3>
                                        <p className="text-xs text-[var(--text-secondary)] mb-3">{teachers.find(t => t.id === c.teacherId)?.name}</p>
                                        
                                        <div className="flex items-center justify-between w-full bg-[var(--bg-primary)] rounded p-2 mt-auto">
                                            <p className="code font-mono text-lg font-bold tracking-widest text-[var(--text-primary)]">{c.code}</p>
                                            <button onClick={() => handleCopy(c.code)} className="p-1.5 text-gray-400 hover:text-white no-print">
                                                <ClipboardIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[200px] text-center text-[var(--text-secondary)]">
                            <div>
                                <PlusIcon className="w-16 h-16 mx-auto opacity-10 mb-4" />
                                <p>ستظهر الأكواد هنا بعد تحديد الإعدادات والضغط على "إنشاء".</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrCodeGeneratorView;
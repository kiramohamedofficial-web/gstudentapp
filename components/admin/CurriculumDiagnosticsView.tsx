import React, { useState, useCallback } from 'react';
import { supabase } from '../../services/storageService';
import { useToast } from '../../useToast';
import { ToastType, AdminView } from '../../types';
import Loader from '../common/Loader';
import { DatabaseIcon, CheckCircleIcon, XCircleIcon, ShieldExclamationIcon, ArrowRightIcon } from '../common/Icons';

type Status = 'idle' | 'running' | 'ok' | 'warning' | 'error';

interface CheckResult {
    id: string;
    title: string;
    status: Status;
    details: string;
}

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
    const styles: Record<Status, { color: string; label: string; animation?: string }> = {
        idle: { color: 'bg-gray-500', label: 'لم يبدأ' },
        running: { color: 'bg-blue-500', label: 'جاري...', animation: 'animate-pulse' },
        ok: { color: 'bg-green-500', label: 'سليم' },
        warning: { color: 'bg-yellow-500', label: 'تحذير' },
        error: { color: 'bg-red-500', label: 'خطأ' },
    };
    const { color, label, animation } = styles[status];
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color} ${animation || ''}`}></span>
            <span className="text-xs font-semibold">{label}</span>
        </div>
    );
};

interface CurriculumDiagnosticsViewProps {
    onBack: () => void;
}

const CurriculumDiagnosticsView: React.FC<CurriculumDiagnosticsViewProps> = ({ onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<CheckResult[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);
    const { addToast } = useToast();

    const runDiagnostics = useCallback(async () => {
        setIsLoading(true);
        setResults([]);
        setRawData([]);
        let checks: CheckResult[] = [];
        const updateCheck = (id: string, title: string, status: Status, details: string) => {
            checks = [...checks.filter(c => c.id !== id), { id, title, status, details }];
            setResults(prev => [...prev.filter(c => c.id !== id), { id, title, status, details }]);
        };

        try {
            updateCheck('fetch', 'جلب البيانات الخام', 'running', 'جاري جلب البيانات من جدول `grades`...');
            const { data, error } = await supabase.from('grades').select('*').order('id');
            if (error) throw new Error(`فشل جلب البيانات: ${error.message}`);
            
            setRawData(data);
            updateCheck('fetch', 'جلب البيانات الخام', 'ok', `تم جلب ${data.length} صفًا بنجاح.`);

            // FIX: Use .includes() for more robust matching to avoid false negatives.
            const middleSchoolRecords = data.filter(g => g.level_ar?.includes('إعدادي') || g.level?.toLowerCase() === 'middle');
            updateCheck('middle_school', 'وجود صفوف إعدادية', middleSchoolRecords.length > 0 ? 'ok' : 'error', middleSchoolRecords.length > 0 ? `تم العثور على ${middleSchoolRecords.length} صفوف.` : 'خطأ فادح: لم يتم العثور على أي صفوف إعدادية.');
            
            const secondarySchoolRecords = data.filter(g => g.level_ar?.includes('ثانوي') || g.level?.toLowerCase() === 'secondary');
            updateCheck('secondary_school', 'وجود صفوف ثانوية', secondarySchoolRecords.length > 0 ? 'ok' : 'warning', secondarySchoolRecords.length > 0 ? `تم العثور على ${secondarySchoolRecords.length} صفوف.` : 'لم يتم العثور على أي صفوف ثانوية.');

            const missingLevelAr = data.filter(g => !g.level_ar || g.level_ar.trim() === '');
            updateCheck('level_ar', 'حقل `level_ar` العربي', missingLevelAr.length > 0 ? 'error' : 'ok', missingLevelAr.length > 0 ? `يوجد ${missingLevelAr.length} صفوف بدون قيمة في حقل 'level_ar'. هذا هو السبب المحتمل للمشكلة.` : 'جميع الصفوف تحتوي على قيمة.');

            addToast("اكتمل فحص المناهج الدراسية.", ToastType.SUCCESS);
        } catch (e: any) {
            addToast(`حدث خطأ أثناء الفحص: ${e.message}`, ToastType.ERROR);
            updateCheck('fetch', 'جلب البيانات الخام', 'error', e.message);
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    return (
        <div className="fade-in space-y-6">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى فحص الأعطال</span>
            </button>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">فحص بيانات المناهج الدراسية</h1>
            <p className="text-[var(--text-secondary)]">أداة متخصصة لعرض البيانات الخام من قاعدة البيانات وتشخيص سبب عدم ظهور الصفوف الإعدادية.</p>

            <button onClick={runDiagnostics} disabled={isLoading} className="w-full sm:w-auto px-6 py-3 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105 disabled:opacity-50">
                {isLoading ? 'جاري الفحص...' : 'بدء فحص البيانات'}
            </button>

            {results.length > 0 && (
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">نتائج الفحص</h2>
                    <div className="space-y-3">
                        {results.map(check => (
                             <div key={check.id} className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm">{check.title}</h3>
                                    <StatusIndicator status={check.status}/>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">{check.details}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {rawData.length > 0 && (
                 <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">البيانات الخام من جدول `grades`</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-[var(--bg-tertiary)]">
                                <tr>
                                    <th className="px-4 py-2">ID</th>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Level (Eng)</th>
                                    <th className="px-4 py-2">Level (Ar)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rawData.map(row => (
                                    <tr key={row.id} className="border-b border-[var(--border-primary)] last:border-b-0">
                                        <td className="px-4 py-2 font-mono">{row.id}</td>
                                        <td className="px-4 py-2 font-semibold text-[var(--text-primary)]">{row.name}</td>
                                        <td className={`px-4 py-2 font-mono ${!row.level ? 'text-red-400' : ''}`}>{row.level || 'NULL'}</td>
                                        <td className={`px-4 py-2 font-semibold ${!row.level_ar ? 'text-red-400' : ''}`}>{row.level_ar || 'NULL'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumDiagnosticsView;
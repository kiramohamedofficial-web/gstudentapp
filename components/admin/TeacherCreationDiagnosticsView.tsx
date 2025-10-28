import React, { useState } from 'react';
import { supabase, createTeacher, deleteTeacher } from '../../services/storageService';
import { useToast } from '../../useToast';
import { UserCheckIcon, TrashIcon } from '../common/Icons';
import { ToastType } from '../../types';

const LogViewer: React.FC<{ logs: string[] }> = ({ logs }) => (
    <div className="mt-4 bg-[var(--bg-tertiary)] p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
            <p key={index} className={`whitespace-pre-wrap ${log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                {`[${new Date().toLocaleTimeString('en-GB')}] ${log}`}
            </p>
        ))}
    </div>
);

const TeacherCreationDiagnosticsView: React.FC = () => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<string[]>(['سجلات التشخيص ستظهر هنا...']);
    const [isSimulating, setIsSimulating] = useState(false);
    const [subject, setSubject] = useState('رياضيات تجريبي');
    const [lastTestTeacherId, setLastTestTeacherId] = useState<string | null>(null);

    const addLog = (log: string) => setLogs(prev => [...prev, log]);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setLogs([]);
        setLastTestTeacherId(null);
        let createdTeacherId: string | null = null;

        try {
            const testPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
            const testEmail = `${testPhone}@gstudent.com`;
            const testPassword = "Password123!";
            const testName = 'مدرس تجريبي';

            addLog(`بدء محاكاة إنشاء مدرس...`);
            addLog(`- استخدام الهاتف: ${testPhone}`);

            addLog("الخطوة 1: استدعاء دالة 'create_teacher_account'...");
            const result = await createTeacher({
                name: testName,
                email: testEmail,
                password: testPassword,
                subject: subject,
                phone: testPhone,
                teaching_grades: [1], // Prep 1
                teaching_levels: ['Middle'],
                image_url: ''
            });
            
            if (!result.success || !result.data?.teacher_id) {
                 throw new Error(`فشل استدعاء الدالة: ${result.error?.message || 'خطأ غير معروف'}`);
            }

            createdTeacherId = result.data.teacher_id;
            setLastTestTeacherId(createdTeacherId);

            addLog(`✅ نجاح! الدالة استجابت بنجاح.`);
            addLog(`- معرف المدرس الجديد: ${createdTeacherId}`);
            addLog(`- معرف المستخدم الجديد: ${result.data.user_id}`);

            addLog("الخطوة 2: التحقق من وجود ملف المدرس في جدول 'teachers'...");
            const { data: teacherData, error: teacherError } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', createdTeacherId)
                .single();

            if (teacherError || !teacherData) {
                throw new Error(`لم يتم العثور على ملف المدرس بعد الإنشاء: ${teacherError?.message}`);
            }
            addLog(`✅ نجاح! تم العثور على ملف المدرس.`);

            addLog("الخطوة 3: التحقق من وجود ملف المستخدم في جدول 'profiles'...");
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', result.data.user_id)
                .single();

            if (profileError || !profileData) {
                throw new Error(`لم يتم العثور على ملف المستخدم: ${profileError?.message}`);
            }
            addLog('✅ نجاح! تم العثور على ملف المستخدم.');
            
            if (profileData.teacher_id === createdTeacherId) {
                addLog('✅ الربط صحيح! تم ربط ملف المستخدم بملف المدرس.');
            } else {
                 throw new Error(`فشل الربط! ملف المستخدم غير مربوط بملف المدرس. teacher_id is ${profileData.teacher_id}`);
            }

            addLog("🏁 اكتملت المحاكاة بنجاح!");
            addToast("اكتملت محاكاة إنشاء المدرس بنجاح!", ToastType.SUCCESS);

        } catch (error: any) {
            addLog(`❌ فشل المحاكاة: ${error.message}`);
            addToast(`فشلت المحاكاة: ${error.message}`, ToastType.ERROR);
        } finally {
            if (createdTeacherId) {
                addLog(`التنظيف: سيتم محاولة حذف المدرس التجريبي (ID: ${createdTeacherId})...`);
                const { success, error } = await deleteTeacher(createdTeacherId);
                if (success) {
                    addLog(`✅ تم حذف المدرس التجريبي بنجاح.`);
                    setLastTestTeacherId(null);
                } else {
                    addLog(`❌ فشل حذف المدرس التجريبي: ${error?.message}. يرجى الحذف اليدوي.`);
                }
            }
            setIsSimulating(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">فحص إضافة مدرس</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أداة لتشخيص عملية إنشاء حساب مدرس جديد باستخدام دالة قاعدة البيانات (RPC).</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">محاكاة</h2>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">مادة المدرس التجريبي</label>
                            <input 
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
                            />
                        </div>
                        <button 
                            onClick={handleRunSimulation} 
                            disabled={isSimulating}
                            className="w-full mt-4 py-3 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all disabled:opacity-50"
                        >
                            {isSimulating ? 'جاري المحاكاة...' : 'بدء المحاكاة'}
                        </button>
                    </div>

                    {lastTestTeacherId && (
                        <div className="bg-yellow-900/40 border border-yellow-500/50 p-4 rounded-lg">
                             <h3 className="font-bold text-yellow-300">تنظيف يدوي</h3>
                             <p className="text-xs text-yellow-400 mt-1">
                                إذا فشلت عملية التنظيف التلقائي، قم بحذف المدرس التجريبي (ID: {lastTestTeacherId}) يدوياً من صفحة إدارة المدرسين.
                             </p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">سجل المحاكاة</h2>
                    <LogViewer logs={logs} />
                </div>
            </div>
        </div>
    );
};

export default TeacherCreationDiagnosticsView;

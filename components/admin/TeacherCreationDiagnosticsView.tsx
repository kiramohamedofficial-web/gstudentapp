
import React, { useState } from 'react';
import { supabase, createTeacher, deleteTeacher } from '../../services/storageService';
import { useToast } from '../../useToast';
import { UserCheckIcon, TrashIcon, ArrowRightIcon } from '../common/Icons';
import { ToastType, AdminView } from '../../types';

const LogViewer: React.FC<{ logs: string[] }> = ({ logs }) => (
    <div className="mt-4 bg-[var(--bg-tertiary)] p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
            <p key={index} className={`whitespace-pre-wrap ${log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                {`[${new Date().toLocaleTimeString('en-GB')}] ${log}`}
            </p>
        ))}
    </div>
);

interface TeacherCreationDiagnosticsViewProps {
    onBack: () => void;
}

const TeacherCreationDiagnosticsView: React.FC<TeacherCreationDiagnosticsViewProps> = ({ onBack }) => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<string[]>(['سجلات التشخيص ستظهر هنا...']);
    const [isSimulating, setIsSimulating] = useState(false);
    const [subject, setSubject] = useState('رياضيات تجريبي');
    const [lastTestTeacherId, setLastTestTeacherId] = useState<string | null>(null);
    const [testDomain, setTestDomain] = useState('gstudent.app');

    const addLog = (log: string) => setLogs(prev => [...prev, log]);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setLogs([]);
        setLastTestTeacherId(null);
        let createdTeacherId: string | null = null;
        let createdUserId: string | null = null;

        const cleanup = async () => {
             if (createdTeacherId) {
                addLog(`التنظيف: محاولة حذف المدرس التجريبي (ID: ${createdTeacherId})...`);
                const { success, error } = await deleteTeacher(createdTeacherId);
                if (success) {
                    addLog(`✅ تم حذف المدرس التجريبي بنجاح.`);
                } else {
                    addLog(`❌ فشل حذف المدرس التجريبي: ${error?.message}. يرجى الحذف اليدوي.`);
                }
            } else if (createdUserId) {
                // If teacher creation failed but user was created
                addLog(`التنظيف: محاولة حذف المستخدم التجريبي (ID: ${createdUserId})...`);
                const { error } = await supabase.auth.admin.deleteUser(createdUserId);
                 if (error) {
                    addLog(`❌ فشل حذف المستخدم التجريبي: ${error?.message}. يرجى الحذف اليدوي.`);
                } else {
                    addLog(`✅ تم حذف المستخدم التجريبي بنجاح.`);
                }
            }
        };

        try {
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const testPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
            const testEmail = `test.teacher.${randomSuffix}@${testDomain || 'example.com'}`;
            const testPassword = "Password123!";
            const testName = 'مدرس تجريبي';

            addLog(`بدء محاكاة إنشاء مدرس...`);
            addLog(`- استخدام الهاتف: ${testPhone}`);
            addLog(`- استخدام البريد الإلكتروني: ${testEmail}`);

            addLog("الخطوة 1: استدعاء دالة 'createTeacher'...");
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
            
            createdUserId = result.data?.user_id; // Capture user ID early for cleanup

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
            
            if (profileData.teacher_id === createdTeacherId && profileData.role === 'teacher') {
                addLog('✅ الربط صحيح! تم ربط ملف المستخدم بملف المدرس وتعيين الصلاحية.');
            } else {
                 throw new Error(`فشل الربط! ملف المستخدم غير مربوط أو الصلاحية غير صحيحة. teacher_id is ${profileData.teacher_id}, role is ${profileData.role}`);
            }

            addLog("🏁 اكتملت المحاكاة بنجاح!");
            addToast("اكتملت محاكاة إنشاء المدرس بنجاح!", ToastType.SUCCESS);

        } catch (error: any) {
            addLog(`❌ فشل المحاكاة: ${error.message}`);
            addToast(`فشلت المحاكاة: ${error.message}`, ToastType.ERROR);
        } finally {
            await cleanup();
            setIsSimulating(false);
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى فحص الأعطال</span>
            </button>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">فحص إضافة مدرس</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أداة لتشخيص عملية إنشاء حساب مدرس جديد باستخدام دالة قاعدة البيانات (RPC).</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">محاكاة</h2>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">مادة المدرس التجريبي</label>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
                                />
                            </div>
                            <div>
                                <label htmlFor="testDomain" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">نطاق البريد الإلكتروني للاختبار</label>
                                <input 
                                    id="testDomain"
                                    type="text"
                                    value={testDomain}
                                    onChange={e => setTestDomain(e.target.value)}
                                    className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-left"
                                    dir="ltr"
                                    placeholder="example.com"
                                />
                                <p className="text-xs text-[var(--text-secondary)] mt-2">
                                    تأكد من أن هذا النطاق مسموح به في إعدادات المصادقة في Supabase لتجنب خطأ "User not allowed".
                                </p>
                            </div>
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

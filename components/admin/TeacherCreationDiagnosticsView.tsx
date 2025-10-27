import React, { useState } from 'react';
import { supabase } from '../../services/storageService';
import { useToast } from '../../useToast';
import { UserCheckIcon, TrashIcon } from '../common/Icons';

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
    const [lastTestUserId, setLastTestUserId] = useState<string | null>(null);

    const addLog = (log: string) => setLogs(prev => [...prev, log]);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setLogs([]);
        setLastTestUserId(null);
        let authUserId: string | null = null;

        try {
            const testPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
            const testEmail = `${testPhone}@gstudent.com`;
            const testPassword = "Password123!";
            const testName = 'مدرس تجريبي';

            addLog(`بدء محاكاة إنشاء مدرس...`);
            addLog(`- استخدام الهاتف: ${testPhone}`);

            // 1. Create Auth User
            addLog("الخطوة 1: إنشاء حساب الدخول (Authentication)...");
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: testEmail, password: testPassword,
                options: { data: { name: testName, role: 'teacher' } }
            });

            if (authError || !authData.user) {
                throw new Error(`فشل إنشاء حساب الدخول: ${authError?.message}`);
            }
            authUserId = authData.user.id;
            setLastTestUserId(authUserId);
            addLog(`✅ نجاح! تم إنشاء حساب الدخول (ID: ${authUserId})`);

            // 2. Create Teacher Profile
            addLog("الخطوة 2: إنشاء ملف المدرس في جدول 'teachers'...");
            const { data: teacher, error: teacherError } = await supabase.from('teachers').insert({
                name: testName, subject: subject, teaching_grades: [1], teaching_levels: ['Middle']
            }).select().single();

            if (teacherError || !teacher) {
                throw new Error(`فشل إنشاء ملف المدرس: ${teacherError?.message}`);
            }
            addLog(`✅ نجاح! تم إنشاء ملف المدرس (ID: ${teacher.id})`);

            // 3. Link Profile
            addLog("الخطوة 3: ربط حساب الدخول بملف المدرس...");
            addLog("هذه هي الخطوة الحرجة التي قد تفشل بسبب تأخير الربط (DB Trigger).");
            
            let profileUpdated = false;
            for (let i = 0; i < 5; i++) {
                addLog(`- محاولة الربط رقم ${i + 1} (انتظار 1 ثانية)...`);
                await new Promise(res => setTimeout(res, 1000));
                
                const { error: profileUpdateError, count } = await supabase.from('profiles').update({
                    teacher_id: teacher.id, phone: `+2${testPhone}`
                }).eq('id', authUserId);

                if (profileUpdateError) {
                    addLog(`- ❌ حدث خطأ أثناء التحديث: ${profileUpdateError.message}`);
                    continue;
                }
                
                if (count && count > 0) {
                    profileUpdated = true;
                    addLog('✅ نجاح! تم ربط الملف بنجاح.');
                    break;
                } else {
                    addLog('- ⚠️ لم يتم العثور على الملف الشخصي بعد. المحاولة مرة أخرى...');
                }
            }

            if (!profileUpdated) {
                throw new Error('فشل تحديث ملف المستخدم بعد 5 محاولات. مشكلة محتملة في الربط.');
            }
            
            addLog("🏁 اكتملت المحاكاة بنجاح!");

        } catch (error: any) {
            addLog(`❌ فشل المحاكاة: ${error.message}`);
            if (authUserId) {
                addLog(`- حدث خطأ بعد إنشاء حساب الدخول. يوصى بحذف المستخدم التجريبي (ID: ${authUserId}) يدوياً.`);
            }
        } finally {
            setIsSimulating(false);
        }
    };
    
    const handleCleanup = async () => {
        if (!lastTestUserId) {
            addToast('لا يوجد مستخدم تجريبي لحذفه من هذه الجلسة.', 'info');
            return;
        }
        
        addLog(`بدء حذف المستخدم التجريبي (ID: ${lastTestUserId})...`);
        const { error: adminError } = await supabase.auth.admin.deleteUser(lastTestUserId);
        
        if (adminError) {
            addLog(`❌ فشل حذف المستخدم: ${adminError.message}`);
            addToast(`فشل حذف المستخدم: ${adminError.message}`, 'error');
        } else {
            addLog(`✅ تم حذف المستخدم التجريبي بنجاح.`);
            addToast('تم حذف المستخدم التجريبي بنجاح.', 'success');
            setLastTestUserId(null);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">فحص إضافة مدرس</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أداة لتشخيص عملية إنشاء حساب مدرس جديد وتحديد سبب الفشل.</p>
            
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

                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">التنظيف</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            بعد انتهاء المحاكاة، يمكنك حذف حساب المدرس التجريبي الذي تم إنشاؤه.
                        </p>
                        <button
                            onClick={handleCleanup}
                            disabled={!lastTestUserId}
                            className="w-full py-3 font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <TrashIcon className="w-5 h-5 ml-2" />
                            حذف آخر مدرس تجريبي
                        </button>
                    </div>
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
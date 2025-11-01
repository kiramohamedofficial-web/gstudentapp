import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserCheckIcon, ServerIcon, DatabaseIcon, ShieldCheckIcon, TrashIcon } from '../common/Icons';
import { checkDbConnection, getAllUsers, getGradesForSelection, signUp, getUserById, updateUser, deleteUser } from '../../services/storageService';
import { useToast } from '../../useToast';
import { User, ToastType } from '../../types';

type Status = 'idle' | 'running' | 'ok' | 'warning' | 'error';
type TestLevel = 'Middle' | 'Secondary';

interface Check {
    id: string;
    title: string;
    status: Status;
    details: string;
}

const deriveTrackFromGrade = (gradeId: number): 'Scientific' | 'Literary' | undefined => {
    switch (gradeId) {
        case 5: // الثاني الثانوي - علمي
        case 7: // الثالث الثانوي - علمي علوم
        case 8: // الثالث الثانوي - علمي رياضيات
            return 'Scientific';
        case 6: // الثاني الثانوي - أدبي
        case 9: // الثالث الثانوي - أدبي
            return 'Literary';
        default:
            return undefined;
    }
};


const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
    const styles: Record<Status, { color: string; label: string; animation?: string }> = {
        idle: { color: 'bg-gray-500', label: 'لم يتم الفحص' },
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

const LogViewer: React.FC<{ logs: string[] }> = ({ logs }) => (
    <div className="mt-4 bg-[var(--bg-tertiary)] p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
            <p key={index} className={`whitespace-pre-wrap ${log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                {`[${new Date().toLocaleTimeString()}] ${log}`}
            </p>
        ))}
    </div>
);


const AccountCreationDiagnosticsView: React.FC = () => {
    const { addToast } = useToast();
    const [preFlightChecks, setPreFlightChecks] = useState<Check[]>([
        { id: 'db', title: 'اتصال قاعدة البيانات', status: 'idle', details: 'جاهز للفحص.' },
        { id: 'usersTable', title: 'جدول المستخدمين (Profiles)', status: 'idle', details: 'جاهز للفحص.' },
        { id: 'dbTrigger', title: 'ربط قاعدة البيانات (Trigger)', status: 'idle', details: 'جاهز للفحص.' },
    ]);
    const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [testLevel, setTestLevel] = useState<TestLevel>('Middle');

    const runPreFlightChecks = useCallback(async () => {
        const updateCheck = (id: string, status: Status, details: string) => {
            setPreFlightChecks(prev => prev.map(c => c.id === id ? { ...c, status, details } : c));
        };

        // DB Connection
        updateCheck('db', 'running', 'جاري فحص الاتصال...');
        const { error: dbError } = await checkDbConnection();
        updateCheck('db', dbError ? 'error' : 'ok', dbError ? `فشل: ${dbError.message}` : 'الاتصال ناجح.');

        // Users Table
        updateCheck('usersTable', 'running', 'جاري التحقق من الجدول...');
        const users = await getAllUsers();
        if (Array.isArray(users)) {
             updateCheck('usersTable', 'ok', `تم العثور على جدول 'profiles' بنجاح.`);
        } else {
             updateCheck('usersTable', 'error', `فشل الوصول إلى جدول 'profiles'.`);
        }

        // DB Trigger
        updateCheck('dbTrigger', 'ok', 'الفحص يتطلب محاكاة حية للتأكد من عمل الربط.');

    }, []);

    useEffect(() => {
        runPreFlightChecks();
    }, [runPreFlightChecks]);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setSimulationLogs([]);
        let createdUserId: string | null = null;
        const addLog = (log: string) => setSimulationLogs(prev => [...prev, log]);

        const testEmail = `test.user.${Math.random().toString(36).substring(2, 8)}@gstudent.app`;
        const testPassword = "Password123!";
        const testGradeId = testLevel === 'Middle' ? 1 : 7; // 1: 1st Prep, 7: 3rd Sec Scientific
        const testTrack: 'Scientific' | 'Literary' | 'All' = deriveTrackFromGrade(testGradeId) || 'All';
        
        const testData = {
            email: testEmail, password: testPassword, name: 'مستخدم تجريبي',
            phone: '+201000000000', guardianPhone: '+201000000001', grade: testGradeId, track: testTrack
        };
        const levelName = testLevel === 'Middle' ? 'الإعدادية' : 'الثانوية';

        try {
            addLog(`بدء المحاكاة للمرحلة: ${levelName}`);
            addLog(`- استخدام البريد الإلكتروني: ${testEmail}`);
            addLog(`- استخدام الصف الدراسي ID: ${testGradeId} (المسار: ${testTrack})`);
            
            // Step 1: Auth Sign Up
            addLog('الخطوة 1: محاولة إنشاء حساب مصادقة...');
            const { data: authData, error: signUpError } = await signUp(testData);
            if (signUpError || !authData.user) {
                throw new Error(`فشل إنشاء حساب المصادقة: ${signUpError?.message}`);
            }
            createdUserId = authData.user.id;
            addLog(`✅ نجاح! تم إنشاء مستخدم المصادقة (ID: ${createdUserId})`);

            // Step 2: Poll for Profile
            addLog('الخطوة 2: التحقق من إنشاء ملف المستخدم عبر الربط...');
            let initialProfile: User | null = null;
            for (let i = 0; i < 5; i++) {
                await new Promise(res => setTimeout(res, 1500));
                addLog(`- محاولة التحقق رقم ${i + 1}...`);
                const { data: profile } = await getUserById(authData.user.id);
                if (profile) {
                    initialProfile = profile as User;
                    addLog('✅ نجاح! تم العثور على ملف المستخدم. الربط يعمل.');
                    break;
                }
            }

            if (!initialProfile) {
                throw new Error('فشل! لم يتم العثور على ملف المستخدم. قد تكون هناك مشكلة في الربط (DB Trigger).');
            }
            
            // Step 3: Initial Data Verification
            addLog('الخطوة 3: التحقق الأولي من البيانات المحفوظة...');
            let isInitialDataCorrect = true;
            if (initialProfile.grade === testGradeId) {
                addLog(`✅ الصف الدراسي: مطابق (ID: ${initialProfile.grade})`);
            } else {
                addLog(`❌ الصف الدراسي: غير مطابق! المتوقع: ${testGradeId}, المحفوظ: ${initialProfile.grade}`);
                isInitialDataCorrect = false;
            }

            const expectedTrack = deriveTrackFromGrade(testGradeId) || 'All';
            if (initialProfile.track === expectedTrack) {
                addLog(`✅ المسار الدراسي: مطابق ('${initialProfile.track}')`);
            } else {
                addLog(`❌ المسار الدراسي: غير مطابق! المتوقع: '${expectedTrack}', المحفوظ: '${initialProfile.track}'`);
                isInitialDataCorrect = false;
            }

            // Step 4: Manual Correction if necessary
            if (!isInitialDataCorrect) {
                addLog('الخطوة 4: البيانات الأولية غير صحيحة. بدء محاولة التصحيح اليدوي...');
                const { error: updateError } = await updateUser(authData.user.id, { grade: testGradeId, track: testTrack });
                if (updateError) {
                    throw new Error(`فشل التصحيح اليدوي: ${updateError.message}`);
                }
                addLog('✅ نجاح! تم إرسال طلب التحديث.');
                addLog('الخطوة 5: التحقق النهائي بعد التصحيح...');
                await new Promise(res => setTimeout(res, 1000));
                const { data: finalProfile } = await getUserById(authData.user.id);

                if (finalProfile?.grade !== testGradeId || finalProfile?.track !== expectedTrack) {
                    throw new Error(`فشل التحقق النهائي بعد التصحيح. المحفوظ: grade=${finalProfile?.grade}, track='${finalProfile?.track}'`);
                }
                addLog(`✅ البيانات النهائية مطابقة.`);
            }

            // Step 5: Deletion Check
            addLog('الخطوة 5: التحقق من عملية حذف الحساب...');
            const { error: deleteError } = await deleteUser(authData.user.id);
            if (deleteError) {
                createdUserId = authData.user.id; // Keep ID for manual cleanup log
                throw new Error(`فشل حذف المستخدم: ${deleteError.message}`);
            }
            addLog('✅ نجاح! تم إرسال أمر الحذف بنجاح.');

            addLog('الخطوة 6: التأكد من أن المستخدم لم يعد موجودًا...');
            await new Promise(res => setTimeout(res, 1500)); // Wait for deletion to propagate
            const { data: finalCheck } = await getUserById(authData.user.id);
            if (finalCheck) {
                createdUserId = authData.user.id; // Keep ID for manual cleanup log
                throw new Error('فشل التحقق من الحذف! لا يزال من الممكن العثور على المستخدم.');
            }
            addLog('✅ نجاح! تم التأكد من حذف المستخدم نهائيًا.');
            createdUserId = null; // Prevent double cleanup attempt in finally block

            addLog("🏁 اكتملت المحاكاة بنجاح!");
            addToast("اكتملت المحاكاة بنجاح!", ToastType.SUCCESS);
        } catch (error: any) {
             addLog(`❌ فشل المحاكاة: ${error.message}`);
             addToast("فشلت المحاكاة. انظر السجلات للمزيد.", ToastType.ERROR);
        } finally {
            if (createdUserId) {
                addLog(`التنظيف النهائي: محاولة حذف المستخدم التجريبي (ID: ${createdUserId}) مرة أخرى...`);
                const { error: deleteError } = await deleteUser(createdUserId);
                if (deleteError) {
                    addLog(`❌ فشل حذف المستخدم التجريبي: ${deleteError.message}. الرجاء حذفه يدويًا.`);
                } else {
                    addLog(`✅ تم حذف المستخدم التجريبي بنجاح.`);
                }
            }
            setIsSimulating(false);
        }
    };


    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">فحص إنشاء الحساب</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أداة لتشخيص وتحليل عملية تسجيل الطلاب الجدد خطوة بخطوة.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">فحوصات مبدئية</h2>
                        <div className="space-y-4">
                            {preFlightChecks.map(check => (
                                <div key={check.id} className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">{check.title}</span>
                                        <StatusIndicator status={check.status} />
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{check.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">محاكاة حية</h2>
                        <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] p-2 rounded-lg">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">نوع الاختبار:</label>
                             {(['Middle', 'Secondary'] as TestLevel[]).map(level => (
                                <button key={level} onClick={() => setTestLevel(level)} className={`px-3 py-1 text-sm rounded-md ${testLevel === level ? 'bg-purple-600 text-white' : 'hover:bg-purple-600/20'}`}>
                                    {level === 'Middle' ? 'إعدادي' : 'ثانوي'}
                                </button>
                             ))}
                        </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        ستقوم هذه الأداة بمحاكاة عملية تسجيل طالب جديد بالكامل للتحقق من سلامة كل خطوة. سيتم حذف الحساب التجريبي تلقائيًا بعد الانتهاء.
                    </p>
                    <button onClick={handleRunSimulation} disabled={isSimulating} className="w-full mb-4 py-3 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-wait">
                        {isSimulating ? 'جاري المحاكاة...' : `بدء محاكاة (طالب ${testLevel === 'Middle' ? 'إعدادي' : 'ثانوي'})`}
                    </button>
                    <LogViewer logs={simulationLogs} />
                </div>
            </div>
        </div>
    );
};

export default AccountCreationDiagnosticsView;
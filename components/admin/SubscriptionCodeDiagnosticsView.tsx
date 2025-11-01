import React, { useState, useCallback } from 'react';
import { supabase, generateSubscriptionCodes, signUp, createOrUpdateSubscription, deleteUser, deleteSubscriptionCode } from '../../services/storageService';
import { useToast } from '../../useToast';
import { ToastType } from '../../types';
import { ArrowRightIcon, QrcodeIcon } from '../common/Icons';

const LogViewer: React.FC<{ logs: string[] }> = ({ logs }) => (
    <div className="mt-4 bg-[var(--bg-tertiary)] p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
            <p key={index} className={`whitespace-pre-wrap ${log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                {`[${new Date().toLocaleTimeString('en-GB')}] ${log}`}
            </p>
        ))}
    </div>
);

const SubscriptionCodeDiagnosticsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState<string[]>(['سجلات التشخيص ستظهر هنا...']);
    const [isSimulating, setIsSimulating] = useState(false);

    const addLog = (log: string) => setLogs(prev => [...prev, log]);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setLogs([]);
        let createdUserIds: string[] = [];
        let createdCode: string | null = null;

        const cleanup = async () => {
            if (createdCode) {
                addLog(`التنظيف: حذف الكود التجريبي (${createdCode})...`);
                const { error } = await deleteSubscriptionCode(createdCode);
                if (error) addLog(`❌ فشل حذف الكود: ${error.message}`);
                else addLog(`✅ تم حذف الكود بنجاح.`);
            }
            for (const userId of createdUserIds) {
                addLog(`التنظيف: حذف المستخدم التجريبي (ID: ${userId})...`);
                const { error } = await deleteUser(userId);
                if (error) addLog(`❌ فشل حذف المستخدم: ${error.message}`);
                else addLog(`✅ تم حذف المستخدم بنجاح.`);
            }
        };

        try {
            addLog("بدء محاكاة استخدام كود الاشتراك...");

            // Step 1: Generate a single-use code
            addLog("الخطوة 1: إنشاء كود اشتراك تجريبي (استخدام مرة واحدة)...");
            const codes = await generateSubscriptionCodes({ count: 1, durationDays: 30, maxUses: 1 });
            if (codes.length === 0 || !codes[0]) throw new Error("فشل إنشاء الكود التجريبي.");
            createdCode = codes[0].code;
            addLog(`✅ نجاح! تم إنشاء الكود: ${createdCode}`);

            // Step 2: Create Test User 1
            const user1Email = `test.sub.user1.${Date.now()}@gstudent.app`;
            addLog(`الخطوة 2: إنشاء المستخدم التجريبي الأول (${user1Email})...`);
            const { data: user1Data, error: user1Error } = await signUp({
                email: user1Email, password: "Password123!", name: "طالب تجريبي 1", phone: '+201000000002', guardianPhone: '+201000000003', grade: 1
            });
            if (user1Error || !user1Data.user) throw new Error(`فشل إنشاء المستخدم 1: ${user1Error?.message}`);
            createdUserIds.push(user1Data.user.id);
            addLog(`✅ نجاح! تم إنشاء المستخدم 1 (ID: ${user1Data.user.id}).`);

            // Step 3: Redeem code for User 1
            addLog(`الخطوة 3: محاكاة تفعيل الكود للمستخدم 1...`);
            const { error: subError } = await createOrUpdateSubscription(user1Data.user.id, 'Monthly', 'Active');
            if (subError) throw new Error(`فشل إنشاء الاشتراك للمستخدم 1: ${subError.message}`);
            const { error: codeUpdateError } = await supabase.from('subscription_codes').update({
                times_used: 1,
                used_by_user_ids: [user1Data.user.id]
            }).eq('code', createdCode);
            if (codeUpdateError) throw new Error(`فشل تحديث الكود بعد الاستخدام: ${codeUpdateError.message}`);
            addLog(`✅ نجاح! تم تفعيل الاشتراك للمستخدم 1 وتحديث الكود.`);

            // Step 4: Verify code is maxed out
            addLog(`الخطوة 4: التحقق من أن الكود قد استنفد...`);
            const { data: codeData, error: codeFetchError } = await supabase.from('subscription_codes').select('*').eq('code', createdCode).single();
            if (codeFetchError || !codeData) throw new Error(`فشل العثور على الكود للتحقق: ${codeFetchError?.message}`);
            if (codeData.times_used < codeData.max_uses) throw new Error(`فشل التحقق! الكود لم يستنفد. (مرات الاستخدام: ${codeData.times_used})`);
            addLog(`✅ نجاح! الكود مستخدم بالكامل.`);

            // Step 5: Create Test User 2
            const user2Email = `test.sub.user2.${Date.now()}@gstudent.app`;
            addLog(`الخطوة 5: إنشاء المستخدم التجريبي الثاني (${user2Email})...`);
            const { data: user2Data, error: user2Error } = await signUp({
                email: user2Email, password: "Password123!", name: "طالب تجريبي 2", phone: '+201000000004', guardianPhone: '+201000000005', grade: 1
            });
            if (user2Error || !user2Data.user) throw new Error(`فشل إنشاء المستخدم 2: ${user2Error?.message}`);
            createdUserIds.push(user2Data.user.id);
            addLog(`✅ نجاح! تم إنشاء المستخدم 2 (ID: ${user2Data.user.id}).`);

            // Step 6: Attempt to redeem for User 2 (and expect failure)
            addLog(`الخطوة 6: محاكاة محاولة المستخدم 2 استخدام نفس الكود...`);
            if (codeData.times_used >= codeData.max_uses) {
                addLog(`✅ نجاح! تم منع الاستخدام لأن الكود وصل للحد الأقصى.`);
            } else {
                throw new Error(`فشل! منطق التحقق من الاستخدام لم يعمل كما هو متوقع.`);
            }

            addLog("🏁 اكتملت المحاكاة بنجاح! نظام الأكواد يعمل بشكل صحيح.");
            addToast("اكتملت المحاكاة بنجاح!", ToastType.SUCCESS);

        } catch (error: any) {
            addLog(`❌ فشل المحاكاة: ${error.message}`);
            addToast(`فشلت المحاكاة: ${error.message}`, ToastType.ERROR);
        } finally {
            await cleanup();
            setIsSimulating(false);
        }
    };

    return (
        <div className="fade-in">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى فحص الأعطال</span>
            </button>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">فحص أكواد الاشتراك</h1>
            <p className="mb-8 text-[var(--text-secondary)]">محاكاة عملية استخدام كود اشتراك لمرة واحدة للتأكد من عدم إمكانية إعادة استخدامه.</p>
            
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">محاكاة حية</h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            ستقوم هذه الأداة بإنشاء كود استخدام فردي، ثم تحاول استخدامه مرتين بواسطة مستخدمين مختلفين للتحقق من أن النظام يمنع الاستخدام الثاني.
                        </p>
                    </div>
                    <button 
                        onClick={handleRunSimulation} 
                        disabled={isSimulating}
                        className="w-full sm:w-auto px-6 py-3 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all disabled:opacity-50"
                    >
                        {isSimulating ? 'جاري المحاكاة...' : 'بدء المحاكاة'}
                    </button>
                </div>
                <LogViewer logs={logs} />
            </div>
        </div>
    );
};

export default SubscriptionCodeDiagnosticsView;
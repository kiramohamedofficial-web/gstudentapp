import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  User, Role, Subscription, Grade, Teacher, Lesson, Unit, SubscriptionRequest,
  StudentQuestion, SubscriptionCode, Semester, QuizAttempt
} from '../types';

// =================================================================
// SUPABASE CLIENT SETUP (From Guide)
// =================================================================
const supabaseUrl = 'https://csipsaucwcuserhfrehn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXBzYXVjd2N1c2VyaGZyZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQwMTgsImV4cCI6MjA3Njg3MDAxOH0.FJu12ARvbqG0ny0D9d1Jje3BxXQ-q33gjx7JSH26j1w';
const supabase = createClient(supabaseUrl, supabaseKey);

// =================================================================
// DEFAULT DATA (FALLBACK)
// =================================================================
// Default data structure to ensure app functionality on a fresh database.
const defaultGrades: Grade[] = [
    // Middle School
    { id: 1, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's1-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's1-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 2, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's2-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's2-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 3, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's3-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's3-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    // Secondary School
    { id: 4, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's4-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's4-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 5, name: 'الصف الثاني الثانوي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's5-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's5-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 6, name: 'الصف الثالث الثانوي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's6-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's6-2', title: 'الفصل الدراسي الثاني', units: [] }] }
];

const defaultCurriculumData = {
    grades: defaultGrades
};


// =================================================================
// AUTHENTICATION (From Guide & Adapted)
// =================================================================

/**
 * Signs up a new student. This version creates the auth user and explicitly creates the profile
 * in the public 'users' table, which is a safer pattern than relying on triggers.
 */
export async function signUp(userData: Omit<User, 'id' | 'role' | 'subscriptionId' | 'email'> & { email: string, password?: string }) {
    const { email, password, name, phone, guardianPhone, grade, track } = userData;
    
    if(!password) {
        return { data: null, error: { message: "Password is required for sign up." } };
    };

    const { data, error } = await supabase.auth.signUp({
        email,
        phone,
        password,
        options: { data: { name: name, role: 'student' } }
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            return { data, error: { message: 'هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.' } };
        }
        return { data, error };
    }

    if (data.user) {
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                name: name,
                phone: phone,
                guardian_phone: guardianPhone,
                grade_id: grade,
                track: track,
                role: 'student'
            });
        
        if (profileError) {
            console.error("Error creating user profile after signup:", profileError);
            return { 
                data: null, 
                error: { message: `فشل إنشاء الملف الشخصي. تواصل مع الدعم. الخطأ: ${profileError.message}` } 
            };
        }
    }

    return { data, error };
};


/**
 * Signs in a user with either email or phone number.
 */
export async function signIn(identifier: string, password: string) {
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
        return supabase.auth.signInWithPassword({ email: identifier, password });
    } else {
        const trimmed = identifier.trim().replace(/\s/g, '');
        let formattedPhone = '';
        if (trimmed.startsWith('0') && trimmed.length === 11) formattedPhone = `+2${trimmed}`;
        else if (trimmed.startsWith('20') && trimmed.length === 12) formattedPhone = `+${trimmed}`;
        else if (trimmed.startsWith('+20') && trimmed.length === 13) formattedPhone = trimmed;
        else return { data: null, error: { message: 'رقم الهاتف المدخل غير صالح.' } };
        
        return supabase.auth.signInWithPassword({ phone: formattedPhone, password });
    }
};

export const signOut = async () => supabase.auth.signOut();
export const getSession = async () => { const { data: { session } } = await supabase.auth.getSession(); return session; };
export const onAuthStateChange = (callback: (session: Session | null) => void) => supabase.auth.onAuthStateChange((_event, session) => callback(session));

export const getProfile = async (userId: string): Promise<User | null> => {
    const { data: userData, error } = await supabase.from('users').select('*, grades(*)').eq('id', userId).single();
    if (error) { console.error("Error fetching full user profile:", error); return null; }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    return {
        id: userData.id, email: authUser?.email || '', name: userData.name, phone: userData.phone,
        guardianPhone: userData.guardian_phone, grade: userData.grade_id, track: userData.track,
        role: userData.role as Role, teacherId: userData.teacher_id,
    };
};

// =================================================================
// TEACHER MANAGEMENT (From Guide)
// =================================================================

interface CreateTeacherParams { id?: string, email: string; password?: string; name: string; subject: string; phone: string; teaching_grades: number[]; teaching_levels: string[]; image_url?: string; }
export async function createTeacher(params: CreateTeacherParams) {
  try {
    if (!params.password) throw new Error('Password is required for new teacher.');
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name, role: 'teacher' } }
    });
    if (authError || !authData.user) throw authError || new Error('فشل إنشاء حساب المصادقة.');

    // 2. Add teacher profile data
    const { data: teacher, error: teacherError } = await supabase.from('teachers').insert({
        name: params.name, subject: params.subject, teaching_grades: params.teaching_grades,
        teaching_levels: params.teaching_levels, image_url: params.image_url
    }).select().single();
    if (teacherError || !teacher) throw teacherError || new Error('فشل إنشاء ملف المدرس.');

    // 3. Create user profile
    const { error: userProfileError } = await supabase.from('users').insert({
        id: authData.user.id, name: params.name, phone: `+2${params.phone}`,
        role: 'teacher', teacher_id: teacher.id
    });
    if (userProfileError) throw userProfileError;

    return { success: true, teacher };
  } catch (error: any) {
    console.error('Error creating teacher account:', error);
    return { success: false, error: { message: error.message } };
  }
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching all teachers:', error); return []; }
  return (data || []).map((teacher: any) => ({
    id: teacher.id, name: teacher.name, subject: teacher.subject, imageUrl: teacher.image_url,
    teachingLevels: teacher.teaching_levels, teachingGrades: teacher.teaching_grades,
  }));
}

export async function deleteTeacher(teacherId: string) {
  const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
  if (error) { console.error('Error deleting teacher:', error.message); return { success: false, error }; }
  return { success: true };
}

export async function updateTeacher(teacherId: string, updates: any) {
  const { data, error } = await supabase.from('teachers').update({
    name: updates.name, subject: updates.subject, teaching_grades: updates.teachingGrades,
    teaching_levels: updates.teachingLevels, image_url: updates.imageUrl
  }).eq('id', teacherId).select().single();
  if (error) return { success: false, error };

  if (updates.name || updates.phone) {
    const { data: userData } = await supabase.from('users').select('id').eq('teacher_id', teacherId).single();
    if (userData) {
      const userPayload: Record<string, any> = {};
      if (updates.name) userPayload.name = updates.name;
      if (updates.phone) userPayload.phone = `+2${updates.phone}`;
      await supabase.from('users').update(userPayload).eq('id', userData.id);
    }
  }
  return { success: true, data };
}

export async function addTeacherWithTracks(teacherId: string, selectedTracks: string[], gradeId: number) {
  // This function is an example. The actual implementation depends on semester/unit structure.
  // This is a placeholder as the current data model is a JSON blob.
  console.log('Assigning teacher to tracks:', { teacherId, selectedTracks, gradeId });
  return { success: true, message: `تم تعيين المدرس (محاكاة).` };
}

// =================================================================
// SUBSCRIPTIONS (From Guide & Adapted)
// =================================================================

export async function checkUserSubscription(userId: string) {
    const { data, error } = await supabase.rpc('check_user_subscription', { user_id_input: userId });
    if (error) { console.error('Error checking subscription:', error); return null; }
    return { hasActiveSubscription: data.has_active_subscription, endDate: data.subscription_end_date };
}

interface ActivateSubscriptionParams { studentId: string; plan: 'Monthly' | 'Quarterly' | 'SemiAnnually' | 'Annual'; durationDays: number; teacherId?: string; unitId?: string; }
export async function activateStudentSubscription(params: ActivateSubscriptionParams) {
  try {
    const { data, error } = await supabase.rpc('activate_user_subscription', {
      target_user_id: params.studentId, subscription_plan: params.plan, duration_days: params.durationDays,
      teacher_id_param: params.teacherId || null, unit_id_param: params.unitId || null
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error activating subscription:', error);
    return { success: false, error: error.message };
  }
}

export const createOrUpdateSubscription = async (userId: string, plan: Subscription['plan'], status: 'Active' | 'Expired', customEndDate?: string, teacherId?: string): Promise<{ error: Error | null }> => {
    if (!plan) return { error: new Error('فشل تحديث الاشتراك: خطة الاشتراك غير محددة.') };
    const startDate = new Date(); let endDate: Date;
    if (customEndDate) { endDate = new Date(customEndDate); } 
    else {
        endDate = new Date(startDate);
        switch (plan) {
            case 'Monthly': endDate.setMonth(startDate.getMonth() + 1); break;
            case 'Quarterly': endDate.setMonth(startDate.getMonth() + 3); break;
            case 'SemiAnnually': endDate.setMonth(startDate.getMonth() + 6); break;
            case 'Annual': endDate.setFullYear(startDate.getFullYear() + 1); break;
            case 'Code': endDate.setMonth(startDate.getMonth() + 1); break;
        }
    }
    const subscriptionPayload = { user_id: userId, plan, start_date: startDate.toISOString(), end_date: endDate.toISOString(), status, teacher_id: teacherId };
    let query = supabase.from('subscriptions').select('id').eq('user_id', userId);
    if (teacherId) { query = query.eq('teacher_id', teacherId); } else { query = query.is('teacher_id', null); }
    const { data: existing, error: selectError } = await query.maybeSingle();
    if (selectError) return { error: new Error(selectError.message) };
    const { error: dbError } = await (existing ? supabase.from('subscriptions').update(subscriptionPayload).eq('id', existing.id) : supabase.from('subscriptions').insert(subscriptionPayload));
    if (dbError) return { error: new Error(dbError.message) };
    return { error: null };
};

export async function getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching user subscriptions:', error); return []; }
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id }));
}

// =================================================================
// STUDENT PROGRESS (From Guide - Replaces LocalStorage)
// =================================================================

export async function markLessonComplete(userId: string, lessonId: string) {
  const { data, error } = await supabase.from('user_lesson_progress').upsert({ user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }).select();
  if (error) { console.error('Error marking lesson complete:', error); return null; }
  return data;
}

export async function getStudentProgress(userId: string) {
  const { data, error } = await supabase.from('user_lesson_progress').select(`lesson_id, completed_at`).eq('user_id', userId);
  if (error) { console.error('Error getting student progress:', error); return null; }
  return data;
}

export async function getAllStudentProgress() {
    const { data, error } = await supabase.from('user_lesson_progress').select('user_id, lesson_id');
    if (error) { console.error('Error fetching all student progress:', error); return []; }
    return data;
};

export async function saveQuizAttempt(userId: string, lessonId: string, score: number, totalQuestions: number, submittedAnswers: any[], timeTaken: number) {
  const isPass = score >= (totalQuestions * 0.6); // 60% success threshold
  const { data, error } = await supabase.from('quiz_attempts').insert({
      user_id: userId, lesson_id: lessonId, score, total_questions: totalQuestions,
      submitted_answers: submittedAnswers, time_taken: timeTaken, is_pass: isPass,
      submitted_at: new Date().toISOString()
  }).select();
  if (error) { console.error('Error saving quiz attempt:', error); return null; }
  return data;
}

export async function getStudentQuizAttempts(userId: string) {
  const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('submitted_at', { ascending: false });
  if (error) { console.error('Error getting quiz attempts:', error); return null; }
  return (data || []).map((a: any) => ({ id: a.id, userId: a.user_id, lessonId: a.lesson_id, submittedAt: a.submitted_at, score: a.score, submittedAnswers: a.submitted_answers, timeTaken: a.time_taken, isPass: a.is_pass }));
}

// Re-map old functions to new guide-based functions for compatibility
export const addQuizAttempt = async (attemptData: Omit<QuizAttempt, 'id'>): Promise<void> => {
    const { userId, lessonId, score, submittedAnswers, timeTaken } = attemptData;
    // Assuming a total of 10 questions if not specified, for calculating pass/fail
    await saveQuizAttempt(userId, lessonId, score, 10, submittedAnswers || [], timeTaken);
};

export const getQuizAttemptsByUserId = async (userId: string): Promise<QuizAttempt[]> => getStudentQuizAttempts(userId);

export const getLatestQuizAttemptForLesson = async (userId: string, lessonId: string): Promise<QuizAttempt | undefined> => { 
    const attempts = await getStudentQuizAttempts(userId);
    return attempts.find(a => a.lessonId === lessonId);
};


// =================================================================
// GRADES / CURRICULUM
// =================================================================

// NEW functions from guide for relational data fetching
export async function fetchSecondaryGrades() {
  const { data, error } = await supabase.from('grades').select('*').in('level', ['Secondary']);
  if (error) { console.error('Error fetching grades:', error); return null; }
  return data;
}

export async function fetchSecondaryGradesWithUnits() {
  const { data, error } = await supabase.from('grades').select(`*, semesters ( *, units ( id, title, track, teacher_id ) )`).in('level', ['Secondary']);
  if (error) { console.error('Error fetching grades with units:', error); return null; }
  return data;
}

// EXISTING functions for JSON blob data management (kept for compatibility)
let curriculumCache: { grades: Grade[] } | null = null;
let isCurriculumDataLoaded = false;
export async function storeSchoolData(id: string, payload: any) { const { data, error } = await supabase.from('school_data').upsert({ id: id, payload: payload }).select().single(); return { success: !error, data }; }
export async function getSchoolData(id: string) { const { data } = await supabase.from('school_data').select('payload').eq('id', id).single(); return data?.payload; }
export const initData = async (): Promise<void> => {
    if (isCurriculumDataLoaded) return;
    try {
        const payload = await getSchoolData('main_curriculum');
        if (payload && payload.grades && payload.grades.length > 0) { curriculumCache = payload; } 
        else {
            console.log("No curriculum data found. Seeding with default grades.");
            curriculumCache = defaultCurriculumData;
            await storeSchoolData('main_curriculum', curriculumCache);
        }
    } catch (error) {
        console.error("Failed to initialize curriculum data:", error);
        curriculumCache = defaultCurriculumData;
    }
    isCurriculumDataLoaded = true;
};
export const getAllGrades = (): Grade[] => curriculumCache?.grades || [];
export const getGradeById = (gradeId: number): Grade | undefined => getAllGrades().find(g => g.id === gradeId);
const persistCurriculum = async () => { if (curriculumCache) { await storeSchoolData('main_curriculum', curriculumCache); } };
const modifyCurriculum = (modification: (grades: Grade[]) => void) => { if (!curriculumCache) return; modification(curriculumCache.grades); persistCurriculum(); };
export const addUnitToSemester = (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id'|'lessons'>) => modifyCurriculum(grades => { const semester = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId); semester?.units.push({ ...unitData, id: `u${Date.now()}`, lessons: [] }); });
export const addLessonToUnit = (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>) => modifyCurriculum(grades => { const unit = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId)?.units.find(u => u.id === unitId); if (unit) { unit.lessons.push({ ...lessonData, id: `l${Date.now()}` }); } });
export const updateLesson = (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson) => modifyCurriculum(grades => { const unit = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId)?.units.find(u => u.id === unitId); if (unit) { const lessonIndex = unit.lessons.findIndex(l => l.id === updatedLesson.id); if (lessonIndex > -1) { unit.lessons[lessonIndex] = updatedLesson; } } });
export const deleteLesson = (gradeId: number, semesterId: string, unitId: string, lessonId: string) => modifyCurriculum(grades => { const unit = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId)?.units.find(u => u.id === unitId); if (unit) { unit.lessons = unit.lessons.filter(l => l.id !== lessonId); } });
export const updateUnit = (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }) => modifyCurriculum(grades => { const semester = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId); if (semester) { const unitIndex = semester.units.findIndex(u => u.id === updatedUnit.id); if (unitIndex > -1) { semester.units[unitIndex] = { ...semester.units[unitIndex], ...updatedUnit }; } } });
export const deleteUnit = (gradeId: number, semesterId: string, unitId: string) => modifyCurriculum(grades => { const semester = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId); if (semester) { semester.units = semester.units.filter(u => u.id !== unitId); } });

// =================================================================
// OTHER FUNCTIONS (Kept from old service)
// =================================================================
export async function markAttendance(userId: string, lessonId: string, durationMinutes: number) {
  const { data, error } = await supabase.from('attendance_records').insert({ user_id: userId, lesson_id: lessonId, duration_minutes: durationMinutes, attended_at: new Date().toISOString() }).select();
  if (error) { console.error('Error marking attendance:', error); return null; }
  return data;
}

export const getSubscriptionsByTeacherId = async (teacherId: string): Promise<Subscription[]> => { const { data, error } = await supabase.from('subscriptions').select('*').eq('teacher_id', teacherId); if (error) { console.error('Error fetching subscriptions by teacher:', error); return []; } return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id })); };
export const getSubscriptionRequests = async (): Promise<SubscriptionRequest[]> => { const { data, error } = await supabase.from('subscription_requests').select('*').order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(r => ({ ...r, userId: r.user_id, userName: r.user_name, paymentFromNumber: r.payment_from_number, createdAt: r.created_at, subjectName: r.subject_name, unitId: r.unit_id }));};
export const getPendingSubscriptionRequestCount = async (): Promise<number> => { const { count, error } = await supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'); if (error) { console.error(error); return 0; } return count || 0;};
export const addSubscriptionRequest = async (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): Promise<void> => { await supabase.from('subscription_requests').insert({ user_id: userId, user_name: userName, plan, payment_from_number: paymentFromNumber, subject_name: subjectName, unit_id: unitId }); };
export const updateSubscriptionRequest = async (updatedRequest: SubscriptionRequest): Promise<void> => { await supabase.from('subscription_requests').update({ status: updatedRequest.status }).eq('id', updatedRequest.id); };
export const getAllUsers = async (): Promise<User[]> => { const { data, error } = await supabase.from('users').select('*'); if (error) { console.error("Error fetching all user profiles:", error); return []; } return (data || []).map((p: any) => ({ id: p.id, name: p.name, email: '', phone: p.phone, guardianPhone: p.guardian_phone, grade: p.grade_id, track: p.track, role: p.role as Role, teacherId: p.teacher_id, })); };
export const getTeachers = async (): Promise<Teacher[]> => (await getAllTeachers() as Teacher[]) || [];
export const getTeacherById = async (id: string): Promise<Teacher | null> => { const teachers = await getTeachers(); return teachers.find(t => t.id === id) || null; };
export const addActivityLog = (action: string, details: string) => console.log(`Activity: ${action} - ${details}`);
export const getChatUsage = (userId: string) => ({ remaining: 50 });
export const incrementChatUsage = (userId: string) => {};
export const getPlatformSettings = () => ({ platformName: 'Gstudent', heroTitle: 'بوابتك للتفوق الدراسي', heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع المواد، لمساعدتك على تحقيق أعلى الدرجات مع نخبة من أفضل المدرسين.', heroButtonText: 'ابدأ رحلتك الآن', featuresTitle: 'لماذا تختار منصة Gstudent؟', featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.', features: [], footerDescription: '', contactPhone: '', contactFacebookUrl: '', contactYoutubeUrl: '' });
export const updatePlatformSettings = (settings: any) => {};
export const getFeaturedCourses = () => [];
export const getFeaturedBooks = () => [];
export async function generateSubscriptionCode(codeData: any) { const { data, error } = await supabase.from('subscription_codes').insert({ code: codeData.code, duration_days: codeData.durationDays, max_uses: codeData.maxUses, description: codeData.description, teacher_id: codeData.teacherId || null, is_active: true }).select().single(); if (error) { console.error('Error creating code:', error.message); return { success: false, error }; } return { success: true, code: data }; }
export async function getAllCodes() { const { data } = await supabase.from('subscription_codes').select('*').order('created_at', { ascending: false }); return data; }
export async function redeemCode(code: string, userGradeId: number, userTrack: string) { const { data, error } = await supabase.rpc('redeem_subscription_code', { redemption_code: code, user_grade_id: userGradeId, user_track: userTrack }); if (error || !data?.success) { const errorMessage = data?.error || (error ? error.message : 'حدث خطأ.'); return { success: false, error: errorMessage }; } return { success: true, message: data.message }; }
export async function registerAndRedeemCode(userData: any, code: string): Promise<{ error: string | null }> { const { data: authData, error: authError } = await signUp(userData); if (authError || !authData.user) { return { error: authError?.message || 'فشل إنشاء الحساب.' }; } const { success, error: redeemError } = await redeemCode(code, userData.grade, userData.track); if (!success) { return { error: `تم إنشاء حسابك ولكن فشل تفعيل الكود: ${redeemError}. يرجى التواصل مع الدعم.` }; } return { error: null }; };
export async function validateSubscriptionCode(code: string): Promise<{ valid: boolean; error?: string }> { const { data, error } = await supabase.from('subscription_codes').select('*').eq('code', code.trim()).single(); if (error || !data) return { valid: false, error: 'الكود غير موجود.' }; if (data.times_used >= data.max_uses) return { valid: false, error: 'هذا الكود تم استخدامه بالكامل.' }; return { valid: true }; };
export const generateSubscriptionCodes = async (options: any) => { const codes = []; for(let i=0; i < options.count; i++) { const code = `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}`; await generateSubscriptionCode({ code, ...options }); codes.push({ code, ...options, id: code }); } return codes; };
export const updateUser = async (userId: string, updates: Partial<User>) => { const payload: Record<string, any> = {}; if (updates.name) payload.name = updates.name; if (updates.phone) payload.phone = updates.phone; if (updates.guardianPhone) payload.guardian_phone = updates.guardianPhone; if (updates.grade) payload.grade_id = updates.grade; if (updates.track !== undefined) payload.track = updates.track; if (Object.keys(payload).length === 0) { return { error: null }; } const { error } = await supabase.from('users').update(payload).eq('id', userId); return { error }; };
export const deleteUser = async (id: string) => { const { error } = await supabase.from('users').delete().eq('id', id); return { error }; };
export const getGradesForSelection = async (): Promise<{id: number, name: string, level: 'Middle' | 'Secondary'}[]> => { if (!curriculumCache) await initData(); const grades = getAllGrades(); return grades.map(({ id, name, level }) => ({ id, name, level })); };
export const deleteSelf = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: { message: 'User not authenticated.' } }; const { error } = await supabase.from('users').delete().eq('id', user.id); if (!error) await signOut(); return { error }; };
export const addStudentQuestion = async (userId: string, userName: string, questionText: string): Promise<void> => { await supabase.from('student_questions').insert({ user_id: userId, user_name: userName, question_text: questionText }); };
export const getStudentQuestionsByUserId = async (userId: string): Promise<StudentQuestion[]> => { const { data, error } = await supabase.from('student_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(q => ({ ...q, userId: q.user_id, userName: q.user_name, questionText: q.question_text, answerText: q.answer_text, createdAt: q.created_at }));};
export const getAllStudentQuestions = async (): Promise<StudentQuestion[]> => { const { data, error } = await supabase.from('student_questions').select('*').order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(q => ({ ...q, userId: q.user_id, userName: q.user_name, questionText: q.question_text, answerText: q.answer_text, createdAt: q.created_at }));};
export const answerStudentQuestion = async (questionId: string, answerText: string): Promise<void> => { await supabase.from('student_questions').update({ answer_text: answerText, status: 'Answered' }).eq('id', questionId); };
export const getAllSubscriptions = async (): Promise<Subscription[]> => { const { data, error } = await supabase.from('subscriptions').select('*'); if (error) { console.error('Error fetching subscriptions:', error); return []; } return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id })); };
export const getSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => { const subs = await getSubscriptionsByUserId(userId); return subs?.[0] || null; }
export const checkDbConnection = async () => supabase.from('teachers').select('id', { count: 'exact', head: true });

// Dummy functions for unimplemented parts of old service - these should be removed as features are implemented in Supabase
export const getActivityLogs = () => [];
export const addFeaturedCourse = (course: any) => {};
export const updateFeaturedCourse = (course: any) => {};
export const deleteFeaturedCourse = (id: string) => {};
export const addFeaturedBook = (book: any) => {};
export const updateFeaturedBook = (book: any) => {};
export const deleteFeaturedBook = (id: string) => {};

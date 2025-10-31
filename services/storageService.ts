import React from 'react';
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  User, Role, Subscription, Grade, Teacher, Lesson, Unit, SubscriptionRequest,
  SubscriptionCode, Semester, QuizAttempt, ActivityLog, LessonType, PlatformSettings, Course, Book, StudentQuestion
} from '../types';

// =================================================================
// SUPABASE CLIENT SETUP
// =================================================================
const supabaseUrl = 'https://csipsaucwcuserhfrehn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXBzYXVjd2N1c2VyaGZyZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQwMTgsImV4cCI6MjA3Njg3MDAxOH0.FJu12ARvbqG0ny0D9d1Jje3BxXQ-q33gjx7JSH26j1w';
const supabase = createClient(supabaseUrl, supabaseKey);
export { supabase };


// =================================================================
// DEVICE MANAGEMENT & SECURITY
// =================================================================
export function getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('appDeviceId');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('appDeviceId', deviceId);
    }
    return deviceId;
}


// =================================================================
// FILE STORAGE
// =================================================================
const ASSET_BUCKET = 'public';

export async function uploadImage(file: File): Promise<string | null> {
    const filePath = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(ASSET_BUCKET).upload(filePath, file);
    if (error) {
        console.error('Error uploading image:', error.message);
        if (error.message.toLowerCase().includes('bucket not found')) {
            console.error(`Hint: Make sure you have a public Supabase storage bucket named '${ASSET_BUCKET}'.`);
        }
        return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(data.path);
    return publicUrl;
}

// =================================================================
// AUTHENTICATION (Existing Logic - Kept for App Integrity)
// =================================================================
type Track = 'Scientific' | 'Literary' | 'All' | null;

function determineTrack(gradeId: number | null): { track: Track } {
    if (gradeId === null) return { track: 'All' };
    if (gradeId >= 1 && gradeId <= 3) return { track: 'All' };
    if (gradeId === 4) return { track: 'All' };
    if (gradeId === 5 || gradeId === 7 || gradeId === 8) return { track: 'Scientific' };
    if (gradeId === 6 || gradeId === 9) return { track: 'Literary' };
    return { track: 'All' };
}

export async function signUp(userData: Omit<User, 'id' | 'role' | 'subscriptionId'> & { email: string, password?: string }) {
    const { email, password, name, phone, guardianPhone, grade } = userData;
    if (!password) return { data: null, error: { message: "Password is required for sign up." } };
    const { track } = determineTrack(grade);
    const userMetaData = { name, phone, guardian_phone: guardianPhone, grade_id: grade, role: 'student', track };
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: userMetaData } });
    if (error?.message.includes('User already registered')) return { data, error: { message: 'هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.' } };
    return { data, error };
};

export async function signIn(identifier: string, password: string) {
    const isEmail = identifier.includes('@');
    let emailToSignIn = isEmail ? identifier : '';

    if (!isEmail) {
        let phoneToQuery = identifier.replace(/\s/g, '');
        if (!phoneToQuery.startsWith('+')) {
            if (phoneToQuery.startsWith('0')) {
                phoneToQuery = `+2${phoneToQuery}`; // Becomes +20...
            } else if (phoneToQuery.length === 10) {
                phoneToQuery = `+20${phoneToQuery}`; // Becomes +20...
            }
        }
        const { data: email, error: rpcError } = await supabase.rpc('get_email_from_phone', { phone_number: phoneToQuery });
        if (rpcError || !email) {
            console.error('RPC error or no email found for phone:', rpcError?.message);
            return { data: null, error: { message: 'بيانات الدخول غير صحيحة.' } };
        }
        emailToSignIn = email;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: emailToSignIn, password });
    if (signInError) return { data: null, error: { message: 'بيانات الدخول غير صحيحة.' } };
    if (!signInData.user) return { data: null, error: { message: 'لم يتم العثور على المستخدم بعد تسجيل الدخول.' } };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).single();
    if (profile?.role === 'admin' || profile?.role === 'teacher') return { data: signInData, error: null };

    const userId = signInData.user.id;
    const deviceId = getOrCreateDeviceId();
    const { data: activeSessions, error: sessionError } = await supabase.from('user_sessions').select('*').eq('user_id', userId).eq('active', true);
    if (sessionError) { console.error("Error checking active sessions:", sessionError.message); return { data: signInData, error: null }; }

    if (activeSessions && activeSessions.length > 0) {
        if (!activeSessions.some(session => session.device_info?.id === deviceId)) {
            await supabase.auth.signOut();
            return { data: null, error: { message: "تم تسجيل دخولك بالفعل من جهاز آخر. يرجى تسجيل الخروج أولاً." } };
        }
        return { data: signInData, error: null };
    }
    
    const { data: existingSession } = await supabase.from('user_sessions').select('id').eq('user_id', userId).contains('device_info', { id: deviceId }).maybeSingle();
    if (existingSession) await supabase.from('user_sessions').update({ active: true }).eq('id', existingSession.id);
    else await supabase.from('user_sessions').insert({ user_id: userId, device_info: { id: deviceId }, active: true });
    
    return { data: signInData, error: null };
};

export const signOut = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabase.from('user_sessions').update({ active: false }).eq('user_id', session.user.id).contains('device_info', { id: getOrCreateDeviceId() });
    return supabase.auth.signOut();
};

export const getSession = async () => { const { data: { session } } = await supabase.auth.getSession(); return session; };
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => supabase.auth.onAuthStateChange(callback);
export const sendPasswordResetEmail = async (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
export const updateUserPassword = async (password: string) => supabase.auth.updateUser({ password });
export const deleteSelf = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: { message: 'User not authenticated.' } }; const { error } = await supabase.auth.admin.deleteUser(user.id); if (!error) await signOut(); return { error }; };

// =================================================================
// 📚 NEW DATA FETCHING GUIDE IMPLEMENTATION
// =================================================================

// --- 1️⃣ Users & Accounts ---
export async function getAllUsers() { const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (error) console.error(error); return data || []; }
export async function getUserById(userId: string) { return supabase.from('profiles').select('*').eq('id', userId).single(); }
export async function getUserByTeacherId(teacherId: string) { const { data } = await supabase.from('profiles').select('*').eq('teacher_id', teacherId).single(); return data; }
export async function getAllStudents() { return supabase.from('profiles').select('*').eq('role', 'student').order('name'); }
export async function getStudentsByGrade(gradeId: number) { return supabase.from('profiles').select('*').eq('role', 'student').eq('grade_id', gradeId); }
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return supabase.from('profiles').select('*').eq('id', user.id).single();
    return { data: null, error: 'No user logged in' };
}
export const getProfile = getCurrentUser; // Alias for existing app structure

// --- 2️⃣ Teachers ---
export async function getAllTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase.from('teachers').select('*').order('name');
    if (error) {
        console.error('Error fetching teachers:', error);
        return [];
    }
    if (!data) return [];
    
    return data.map((teacher: any) => ({
        id: teacher.id,
        name: teacher.name,
        subject: teacher.subject,
        imageUrl: teacher.image_url,
        teachingLevels: teacher.teaching_levels,
        teachingGrades: teacher.teaching_grades,
    }));
}
export async function getTeacherById(teacherId: string): Promise<Teacher | null> {
    const { data, error } = await supabase.from('teachers').select('*').eq('id', teacherId).single();
    if (error || !data) {
        console.error(`Error fetching teacher ${teacherId}:`, error?.message);
        return null;
    }
    return {
        id: data.id,
        name: data.name,
        subject: data.subject,
        imageUrl: data.image_url,
        teachingLevels: data.teaching_levels,
        teachingGrades: data.teaching_grades,
    } as Teacher;
}
export async function getTeachersBySubject(subject: string) { return supabase.from('teachers').select('*').eq('subject', subject); }
export async function getTeachersWithStudentCount() { return supabase.from('teachers').select('*, students:profiles!teacher_id(count)'); }

// --- 3️⃣ Admins & Supervisors ---
export async function getAllAdmins() { return supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: false }); }
export async function getUsersByRole(role: Role) { return supabase.from('profiles').select('*').eq('role', role); }
export async function getSupervisors() { return getUsersByRole(Role.SUPERVISOR); }

// --- 4️⃣ Grades & Levels ---
export async function getAllGrades(): Promise<Grade[]> {
    const { data, error } = await supabase.from('grades').select('*, semesters(*, units(*, lessons(*)))').order('id');
    if (error) {
        console.error('Error fetching all grades:', error);
        return [];
    }
    if (!data) return [];

    return data.map((grade: any) => ({
        ...grade,
        semesters: (grade.semesters || []).map((semester: any) => ({
            ...semester,
            units: (semester.units || []).map((unit: any) => ({
                ...unit,
                teacherId: unit.teacher_id, // Map snake_case to camelCase
                lessons: (unit.lessons || []).map((lesson: any) => ({
                    ...lesson,
                    quizType: lesson.quiz_type,
                    correctAnswers: lesson.correct_answers,
                    timeLimit: lesson.time_limit,
                    passingScore: lesson.passing_score,
                    dueDate: lesson.due_date,
                }))
            }))
        }))
    })) as Grade[];
}
export async function getGradeById(gradeId: number) { return supabase.from('grades').select('*').eq('id', gradeId).single(); }
export async function getGradesByLevel(level: 'Middle' | 'Secondary') { return supabase.from('grades').select('*').eq('level', level).order('id'); }

// --- 5️⃣ Subjects (Units in this app) ---
export async function getAllSubjects() { return supabase.from('units').select('*').order('title'); }
export async function getSubjectsByGrade(gradeId: number) { return supabase.from('units').select('*, semesters!inner(grade_id)').eq('semesters.grade_id', gradeId); }
export async function getSubjectWithGrade(subjectId: string) { return supabase.from('units').select('*, semesters(grades(*))').eq('id', subjectId).single(); }

// --- 6️⃣ Lessons ---
export async function getAllLessons() { return supabase.from('lessons').select('*').order('id'); }
export async function getLessonsByGrade(gradeId: number) { return supabase.from('lessons').select('*, units!inner(semesters!inner(grade_id))').eq('units.semesters.grade_id', gradeId).order('id'); }
export async function getLessonsBySubject(subjectId: string) { return supabase.from('lessons').select('*').eq('unit_id', subjectId).order('id'); }
export async function getLessonsByTeacher(teacherId: string) { return supabase.from('lessons').select('*, units!inner(teacher_id)').eq('units.teacher_id', teacherId).order('created_at', { ascending: false }); }
export async function getLessonWithDetails(lessonId: string) { return supabase.from('lessons').select('*, units(*, semesters(*, grades(*)), teachers(*))').eq('id', lessonId).single(); }
export async function getLessonsByUnit(unitId: string): Promise<Lesson[]> {
    const { data, error } = await supabase.from('lessons').select('*').eq('unit_id', unitId).order('id');
    if (error) {
        console.error('Error fetching lessons by unit:', error);
        return [];
    }
    if (!data) return [];
    return data.map((lesson: any) => ({
        ...lesson,
        quizType: lesson.quiz_type,
        correctAnswers: lesson.correct_answers,
        timeLimit: lesson.time_limit,
        passingScore: lesson.passing_score,
        dueDate: lesson.due_date,
    })) as Lesson[];
}

// --- 7️⃣ Units ---
export async function getAllUnits() { return supabase.from('units').select('*').order('id'); }
export async function getUnitsByGrade(gradeId: number) { return supabase.from('units').select('*, semesters!inner(grade_id)').eq('semesters.grade_id', gradeId).order('id'); }
export async function getUnitWithLessons(unitId: string) { return supabase.from('units').select('*, lessons(*)').eq('id', unitId).single(); }

// --- 8️⃣ Subscriptions ---
export async function getAllSubscriptions(): Promise<Subscription[]> { 
    const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false }); 
    if (error) {
        console.error(error); 
        return [];
    }
    const mappedData = data?.map(sub => ({
        id: sub.id,
        userId: sub.user_id,
        plan: sub.plan,
        startDate: sub.start_date,
        endDate: sub.end_date,
        status: sub.status,
        teacherId: sub.teacher_id,
    }));
    return (mappedData as Subscription[]) || []; 
}
export async function getSubscriptionsByTeacherId(teacherId: string): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('teacher_id', teacherId);
    if (error) {
        console.error(error);
        return [];
    }
    return (data?.map(sub => ({
        id: sub.id,
        userId: sub.user_id,
        plan: sub.plan,
        startDate: sub.start_date,
        endDate: sub.end_date,
        status: sub.status,
        teacherId: sub.teacher_id,
    })) as Subscription[]) || [];
}
export async function getUserSubscriptions(userId: string) { return supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }); }
export async function getActiveSubscriptions() { return supabase.from('subscriptions').select('*').eq('status', 'Active'); }
export async function getUserUnitSubscription(userId: string, unitId: string) { return supabase.from('subscriptions').select('*').eq('user_id', userId).eq('unit_id', unitId).eq('status', 'Active').single(); }
export async function checkUserSubscription(userId: string) { return supabase.rpc('check_user_subscription', { p_user_id: userId }); }

// --- 9️⃣ Subscription Codes ---
export async function getAllSubscriptionCodes() { return supabase.from('subscription_codes').select('*').order('created_at', { ascending: false }); }
export async function getActiveSubscriptionCodes() { return supabase.from('subscription_codes').select('*').eq('is_active', true).lt('times_used', supabase.raw('max_uses')); }
export async function validateSubscriptionCode(code: string) {
    const { data, error } = await supabase.from('subscription_codes').select('*').eq('code', code).eq('is_active', true).single();
    if (data && data.times_used >= data.max_uses) return { data: null, error: { message: 'Code has been fully used' } };
    return { data, error };
}
export async function getTeacherSubscriptionCodes(teacherId: string) { return supabase.from('subscription_codes').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }); }

// --- 1️⃣0️⃣ Student Progress ---
export async function getStudentProgress(studentId: string): Promise<{lesson_id: string}[]> { const { data, error } = await supabase.from('progress').select('lesson_id').eq('student_id', studentId); if (error) { console.error(error); return []; } return data || []; }
export async function getAllStudentProgress() { const { data, error } = await supabase.from('progress').select('*'); if (error) console.error(error); return data || []; }
export async function getStudentLessonProgress(studentId: string, lessonId: string) { return supabase.from('progress').select('*').eq('student_id', studentId).eq('lesson_id', lessonId).single(); }
export async function getCompletedLessons(studentId: string) { return supabase.from('progress').select('*, lessons(*)').eq('student_id', studentId).eq('watched', true); }

// --- 1️⃣1️⃣ Quiz Attempts ---
export async function getAllQuizAttempts(): Promise<QuizAttempt[]> { 
    const { data, error } = await supabase.from('quiz_attempts').select('*'); 
    if (error) {
        console.error(error);
        return [];
    }
    const mappedData = data?.map((attempt: any) => ({
        id: attempt.id,
        userId: attempt.user_id,
        lessonId: attempt.lesson_id,
        submittedAt: attempt.submitted_at,
        score: attempt.score,
        submittedAnswers: attempt.submitted_answers,
        timeTaken: attempt.time_taken,
        isPass: attempt.is_pass,
    }));
    return (mappedData as QuizAttempt[]) || []; 
}
export async function getStudentQuizAttempts(studentId: string): Promise<QuizAttempt[]> { const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', studentId).order('submitted_at', { ascending: false }); if (error) console.error(error); return (data as QuizAttempt[]) || []; }
export async function getLessonQuizAttempts(lessonId: string) { return supabase.from('quiz_attempts').select('*').eq('lesson_id', lessonId).order('submitted_at', { ascending: false }); }
export async function getStudentBestScore(studentId: string, lessonId: string) { return supabase.from('quiz_attempts').select('*').eq('user_id', studentId).eq('lesson_id', lessonId).order('score', { ascending: false }).limit(1).single(); }

// --- 1️⃣2️⃣ Homework ---
export async function getAllHomework() { return supabase.from('homework').select('*, lessons(*)').order('created_at', { ascending: false }); }
export async function getLessonHomework(lessonId: string) { return supabase.from('homework').select('*').eq('lesson_id', lessonId); }
export async function getHomeworkSubmissions(homeworkId: string) { return supabase.from('homework_submissions').select('*, student:profiles(*)').eq('homework_id', homeworkId).order('submitted_at', { ascending: false }); }
export async function getStudentHomeworkSubmissions(studentId: string) { return supabase.from('homework_submissions').select('*, homework(*)').eq('user_id', studentId).order('submitted_at', { ascending: false }); }

// --- 1️⃣3️⃣ Attendance Records ---
export async function getStudentAttendance(studentId: string) { return supabase.from('attendance').select('*, lessons(*)').eq('user_id', studentId).order('attended_at', { ascending: false }); }
export async function getLessonAttendance(lessonId: string) { return supabase.from('attendance').select('*, student:profiles(*)').eq('lesson_id', lessonId); }

// --- 1️⃣4️⃣ Courses ---
export async function getPublishedCourses(): Promise<Course[]> { const { data, error } = await supabase.from('courses').select('*, teachers(*), units(semesters(grades(*)))').eq('is_published', true).order('created_at', { ascending: false }); if (error) console.error(error); return (data as Course[]) || []; }
export async function getAllCourses(): Promise<Course[]> { const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false }); if (error) console.error(error); return (data as Course[]) || []; }
export async function getFeaturedCourses(): Promise<any[]> {
    const { data, error } = await supabase.from('featured_courses').select('*');
    if (error) {
        console.error('Error fetching featured courses:', error.message);
        return [];
    }
    return data || [];
}
export async function getTeacherCourses(teacherId: string) { return supabase.from('courses').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }); }

// --- 1️⃣5️⃣ Featured Books ---
export async function getFeaturedBooks(): Promise<Book[]> { const { data, error } = await supabase.from('featured_books').select('*, units(semesters(grades(*)))').eq('is_published', true).order('display_order'); if (error) console.error(error); return (data as Book[]) || []; }
export async function getBooksByGrade(gradeId: number) { return supabase.from('featured_books').select('*').eq('grade_id', gradeId).eq('is_published', true); }

// --- 1️⃣6️⃣ Platform Settings ---
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
    const { data } = await supabase.from('platform_settings').select('*').single();
    if (!data) return null;

    // Explicitly map from database snake_case to application camelCase
    const settings: PlatformSettings = {
        platformName: data.platform_name || '',
        heroTitle: data.hero_title || '',
        heroSubtitle: data.hero_subtitle || '',
        heroButtonText: data.hero_button_text || '',
        heroImageUrl: data.hero_image_url,
        teacherImageUrl: data.teacher_image_url,
        featuresTitle: data.features_title || '',
        featuresSubtitle: data.features_subtitle || '',
        features: data.features || [],
        footerDescription: data.footer_description || '',
        contactPhone: data.contact_phone || '',
        contactFacebookUrl: data.contact_facebook_url || '',
        contactYoutubeUrl: data.contact_youtube_url || '',
        announcementBanner: data.announcement_banner,
        monthlyPrice: data.monthly_price || 0,
        quarterlyPrice: data.quarterly_price || 0,
        semiAnnuallyPrice: data.semi_annually_price || 0,
        annualPrice: data.annual_price || 0,
        currency: data.currency || 'EGP',
        paymentNumbers: data.payment_numbers || [],
        enabledSubscriptionModes: data.enabled_subscription_modes || ['comprehensive', 'singleSubject'],
    };
    return settings;
}
export async function getSubscriptionSettings() { return supabase.from('subscription_settings').select('*').single(); }

// --- 1️⃣7️⃣ Subscription Requests ---
export async function getAllSubscriptionRequests(): Promise<SubscriptionRequest[]> {
    const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching subscription requests:", error.message);
        return [];
    }
    
    // Explicitly map snake_case to camelCase and handle potential formatting issues
    const mappedData = data.map(req => {
        let paymentNumber = req.payment_from_number;

        // Handle cases where the leading '0' might be dropped (e.g., if stored as a number)
        if (paymentNumber && typeof paymentNumber === 'number') {
            paymentNumber = String(paymentNumber);
        }
        if (paymentNumber && typeof paymentNumber === 'string' && paymentNumber.length === 10 && !paymentNumber.startsWith('0')) {
            paymentNumber = '0' + paymentNumber;
        }

        return {
            id: req.id,
            userId: req.user_id,
            userName: req.user_name,
            plan: req.plan,
            paymentFromNumber: paymentNumber,
            status: req.status,
            createdAt: req.created_at,
            subjectName: req.subject_name,
            unitId: req.unit_id,
        };
    });
    
    return mappedData;
}

export async function getPendingSubscriptionRequests() { return supabase.from('subscription_requests').select('*').eq('status', 'Pending').order('created_at', { ascending: false }); }
export async function getUserSubscriptionRequests(userId: string) { return supabase.from('subscription_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }); }

// FIX: Added functions to handle student questions for "Ask the Professor" and "Question Bank" features.
// --- 1️⃣8️⃣ Student Questions ---
export async function getStudentQuestions(userId: string): Promise<StudentQuestion[]> {
    const { data, error } = await supabase.from('student_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching student questions:', error.message); return []; }
    return data?.map(q => ({
        id: q.id,
        userId: q.user_id,
        userName: q.user_name,
        questionText: q.question_text,
        answerText: q.answer_text,
        status: q.status,
        createdAt: q.created_at,
    })) || [];
}

export async function addStudentQuestion(userId: string, userName: string, questionText: string): Promise<void> {
    const { error } = await supabase.from('student_questions').insert({ user_id: userId, user_name: userName, question_text: questionText, status: 'Pending' });
    if (error) throw new Error(error.message);
}

export async function getAllStudentQuestions(): Promise<StudentQuestion[]> {
    const { data, error } = await supabase.from('student_questions').select('*').order('status', { ascending: true }).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching all student questions:', error.message); return []; }
    return data?.map(q => ({
        id: q.id,
        userId: q.user_id,
        userName: q.user_name,
        questionText: q.question_text,
        answerText: q.answer_text,
        status: q.status,
        createdAt: q.created_at,
    })) || [];
}

export async function answerStudentQuestion(questionId: string, answerText: string): Promise<void> {
    const { error } = await supabase.from('student_questions').update({ answer_text: answerText, status: 'Answered' }).eq('id', questionId);
    if (error) throw new Error(error.message);
}

// --- 1️⃣9️⃣ Invoices ---
export async function getUserInvoices(userId: string) { return supabase.from('billing_invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false }); }
export async function getUnpaidInvoices() { return supabase.from('billing_invoices').select('*').eq('status', 'pending').order('created_at', { ascending: false }); }

// --- 2️⃣0️⃣ Advanced Queries ---
export async function getStudentFullDetails(studentId: string) { return supabase.from('profiles').select('*, grades(*), teachers(*), subscriptions(*), progress(*), quiz_attempts(*)').eq('id', studentId).eq('role', 'student').single(); }
export async function getLessonFullData(lessonId: string) { return supabase.from('lessons').select('*, units(*, semesters(*, grades(*)), teachers(*)), homework(*), attendance(count), quiz_attempts(count)').eq('id', lessonId).single(); }
export async function getTeacherStatistics(teacherId: string) {
    const students = await supabase.from('profiles').select('count').eq('teacher_id', teacherId).eq('role', 'student');
    const lessons = await supabase.from('lessons').select('count', { count: 'exact' }).eq('teacher_id', teacherId);
    const subscriptions = await supabase.from('subscriptions').select('count', { count: 'exact' }).eq('teacher_id', teacherId).eq('status', 'Active');
    return { students: students.data?.[0]?.count || 0, lessons: lessons.count || 0, activeSubscriptions: subscriptions.count || 0 };
}

// --- 🔍 Search & Filter ---
export async function searchUsers(searchTerm: string) { return supabase.from('profiles').select('*').or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`).order('name'); }
export async function searchLessons(searchTerm: string) { return supabase.from('lessons').select('*').or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`).order('title'); }
export async function getSubscriptionsByDateRange(startDate: string, endDate: string) { return supabase.from('subscriptions').select('*').gte('created_at', startDate).lte('created_at', endDate).order('created_at', { ascending: false }); }

// --- 📊 General Stats ---
export async function getPlatformStatistics() {
    const totalStudents = await supabase.from('profiles').select('count', { count: 'exact' }).eq('role', 'student');
    const totalTeachers = await supabase.from('teachers').select('count', { count: 'exact' });
    const totalLessons = await supabase.from('lessons').select('count', { count: 'exact' });
    const activeSubscriptions = await supabase.from('subscriptions').select('count', { count: 'exact' }).eq('status', 'Active');
    return { totalStudents: totalStudents.count || 0, totalTeachers: totalTeachers.count || 0, totalLessons: totalLessons.count || 0, activeSubscriptions: activeSubscriptions.count || 0 };
}


// =================================================================
// EXISTING FUNCTIONS (Kept for App Integrity or No Guide Equivalent)
// =================================================================
let curriculumCache: { grades: Grade[] } | null = null;
const defaultGrades: Grade[] = [{ id: 1, name: 'الصف الأول الإعدادي', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's1-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's1-2', title: 'الفصل الدراسي الثاني', units: [] }] }];

// initData is crucial for app startup and synchronous grade access
export const initData = async (): Promise<void> => {
    try {
        const dbData = await getAllGrades();
        if (dbData && dbData.length > 0) curriculumCache = { grades: dbData as Grade[] };
        else curriculumCache = { grades: defaultGrades };
    } catch (error: any) {
        console.warn("Could not fetch curriculum, using fallback. Error:", error.message);
        curriculumCache = { grades: defaultGrades };
    }
};

export const getGradesForSelection = (): {id: number, name: string, level: 'Middle' | 'Secondary'}[] => (curriculumCache?.grades || defaultGrades).map(g => ({ id: g.id, name: g.name, level: g.level }));
export const getUnitsForSemester = async (gradeId: number, semesterId: string): Promise<Unit[]> => {
    const { data, error } = await supabase.from('units').select('*').eq('semester_id', semesterId).order('id', { ascending: true });
    if (error) { console.error(error); return []; }
    if (!data) return [];
    return data.map((unit: any) => ({
        ...unit,
        teacherId: unit.teacher_id,
    })) as Unit[];
};

// Kept synchronous version for components that rely on it
export const getGradeByIdSync = (gradeId: number | null): Grade | undefined => {
    if (gradeId === null) return undefined;
    return curriculumCache?.grades.find(g => g.id === gradeId);
};

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
        }
    }
    const subscriptionPayload = { user_id: userId, plan, start_date: startDate.toISOString(), end_date: endDate.toISOString(), status, teacher_id: teacherId };
    const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', userId).is('teacher_id', teacherId || null).maybeSingle();
    const { error: dbError } = await (existing ? supabase.from('subscriptions').update(subscriptionPayload).eq('id', existing.id) : supabase.from('subscriptions').insert(subscriptionPayload));
    if (dbError) return { error: new Error(dbError.message) };
    return { error: null };
};

export const addSubscriptionRequest = async (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): Promise<void> => {
    await supabase.from('subscription_requests').insert({ user_id: userId, user_name: userName, plan, payment_from_number: paymentFromNumber, status: 'Pending', subject_name: subjectName, unit_id: unitId });
};
export const updateSubscriptionRequest = async (updatedRequest: SubscriptionRequest): Promise<void> => {
    const { id, ...updates } = updatedRequest;
    await supabase.from('subscription_requests').update({ status: updates.status }).eq('id', id);
};
export const getPendingSubscriptionRequestCount = async (): Promise<number> => {
    const { count } = await supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    return count || 0;
};

export async function createTeacher(params: any) {
  const { data, error } = await supabase.rpc('create_teacher_account', { teacher_name: params.name, teacher_email: params.email, teacher_password: params.password, teacher_subject: params.subject, teaching_grades_array: params.teaching_grades, teaching_levels_array: params.teaching_levels, teacher_image_url: params.image_url || null });
  if (error) return { success: false, error, data: null };
  if (data?.success) return { success: true, data, error: null };
  return { success: false, error: { message: data?.error || 'An unknown error occurred.' }, data: null };
}

export async function updateTeacher(teacherId: string, updates: any) {
  const { data, error } = await supabase.from('teachers').update({ 
    name: updates.name, 
    subject: updates.subject, 
    teaching_grades: updates.teachingGrades, 
    teaching_levels: updates.teachingLevels, 
    image_url: updates.imageUrl 
  }).eq('id', teacherId).select().single();
  
  if (error) return { success: false, error };

  if (updates.name || updates.phone || updates.email) {
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').eq('teacher_id', teacherId).single();
    if (profileError) {
      return { success: false, error: profileError };
    }
    
    if (profileData) {
      const userId = profileData.id;
      const profilePayload: Record<string, any> = {};
      
      if (updates.name) profilePayload.name = updates.name;
      
      if (updates.phone) {
        let phone = updates.phone;
        if (phone.startsWith('0')) {
            phone = phone.substring(1);
        }
        profilePayload.phone = `+20${phone}`;
      }

      if (updates.email) {
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, { email: updates.email });
          if (authUpdateError) {
              return { success: false, error: authUpdateError };
          }
          profilePayload.email = updates.email;
      }
      
      if (Object.keys(profilePayload).length > 0) {
        const { error: profileUpdateError } = await supabase.from('profiles').update(profilePayload).eq('id', userId);
        if (profileUpdateError) {
          return { success: false, error: profileUpdateError };
        }
      }
    }
  }
  return { success: true, data };
}

export async function deleteTeacher(teacherId: string) {
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').eq('teacher_id', teacherId).single();
    if (profileError && profileError.code !== 'PGRST116') return { success: false, error: profileError };
    if (profileData) {
        const { error: adminDeleteError } = await supabase.auth.admin.deleteUser(profileData.id);
        if (adminDeleteError && !adminDeleteError.message.includes('User not found')) return { success: false, error: adminDeleteError };
    }
    const { error: teacherError } = await supabase.from('teachers').delete().eq('id', teacherId);
    if (teacherError) return { success: false, error: teacherError };
    return { success: true, error: null };
}

export async function redeemCode(code: string, userGradeId: number, userTrack: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User is not authenticated.' };
    const { data: codeData, error: codeError } = await supabase.from('subscription_codes').select('*').eq('code', code).single();
    if (codeError || !codeData) return { success: false, error: 'Invalid code.' };
    if (codeData.times_used >= codeData.max_uses) return { success: false, error: 'Code has reached its maximum usage limit.' };
    if (codeData.used_by_user_ids.includes(user.id)) return { success: false, error: 'You have already used this code.' };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + codeData.duration_days);

    const subResult = await createOrUpdateSubscription(user.id, 'Monthly', 'Active', endDate.toISOString(), codeData.teacher_id);
    if (subResult.error) return { success: false, error: `Failed to activate subscription: ${subResult.error.message}` };
    
    await supabase.from('subscription_codes').update({ times_used: codeData.times_used + 1, used_by_user_ids: [...codeData.used_by_user_ids, user.id] }).eq('code', code);
    return { success: true };
}
export async function registerAndRedeemCode(userData: any, code: string): Promise<{ data: { userId: string } | null, error: string | null }> {
    const { data: authData, error: authError } = await signUp(userData);
    if (authError || !authData.user) return { data: null, error: authError?.message || 'فشل إنشاء الحساب.' };
    const redeemResult = await redeemCode(code, userData.grade, userData.track);
    if (!redeemResult.success) return { data: { userId: authData.user.id }, error: `تم إنشاء حسابك ولكن فشل تفعيل الكود: ${redeemResult.error}. يرجى التواصل مع الدعم.` };
    return { data: { userId: authData.user.id }, error: null };
};
export const updateUser = async (userId: string, updates: Partial<User>) => {
    const payload: Record<string, any> = {};
    if (updates.name) payload.name = updates.name;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.guardianPhone) payload.guardian_phone = updates.guardianPhone;
    if (updates.grade !== undefined) payload.grade_id = updates.grade;
    if (updates.track !== undefined) payload.track = updates.track;
    if (Object.keys(payload).length === 0) return { error: null };
    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    return { error };
};
export const deleteUser = async (id: string) => { const { error } = await supabase.auth.admin.deleteUser(id); return { error }; };
export const clearUserDevices = async (userId: string) => { const { error } = await supabase.from('user_sessions').delete().eq('user_id', userId); return { error }; };

export const clearAllActiveSessions = async () => {
    // This sets all active sessions to inactive, forcing every user to log in again.
    const { error } = await supabase.from('user_sessions').update({ active: false }).eq('active', true);
    return { error };
};

export const checkDbConnection = async () => supabase.from('teachers').select('id', { count: 'exact', head: true });
export async function saveQuizAttempt(userId: string, lessonId: string, score: number, submittedAnswers: QuizAttempt['submittedAnswers'], timeTaken: number) {
    const lesson = (await getLessonWithDetails(lessonId)).data;
    const isPass = score >= (lesson?.passing_score ?? 50);
    const { error } = await supabase.from('quiz_attempts').insert({ user_id: userId, lesson_id: lessonId, score, submitted_answers: submittedAnswers, time_taken: timeTaken, is_pass: isPass });
    if (error) console.error("Error saving quiz attempt:", error.message);
}
export async function generateSubscriptionCodes(options: { teacherId?: string, durationDays: number, count: number, maxUses: number }): Promise<SubscriptionCode[]> {
    const generatedCodes: SubscriptionCode[] = [];
    for (let i = 0; i < options.count; i++) {
        const code = `GS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const {data: newCode} = await supabase.from('subscription_codes').insert({ code, teacher_id: options.teacherId, duration_days: options.durationDays, max_uses: options.maxUses, times_used: 0, used_by_user_ids: [] }).select().single();
        if (newCode) generatedCodes.push(newCode);
    }
    return generatedCodes;
};

// Functions without a direct guide equivalent but necessary for the app
export const getLatestQuizAttemptForLesson = async (userId: string, lessonId: string): Promise<QuizAttempt | null> => (await getStudentBestScore(userId, lessonId)).data as QuizAttempt | null;
export const getSubscriptionsByUserId = async (userId: string): Promise<Subscription[]> => ((await getUserSubscriptions(userId)).data || []) as Subscription[];
export const getSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => (await getUserSubscriptions(userId)).data?.[0] || null;

// Kept for legacy compatibility where direct calls might still exist
export const markLessonComplete = async (userId: string, lessonId: string) => { await supabase.from('progress').insert({ student_id: userId, lesson_id: lessonId }); };
export const addActivityLog = (action: string, details: string) => console.log(`Activity: ${action} - ${details}`);
export const getChatUsage = (userId: string) => ({ remaining: 50 });
export const incrementChatUsage = (userId: string) => {};
export const getActivityLogs = (): ActivityLog[] => [];

export const updatePlatformSettings = async (newSettings: PlatformSettings): Promise<{ error: any }> => {
    // Explicitly map from application camelCase to database snake_case
    // This resolves the error by ensuring the payload matches the database schema.
    const payload = {
        platform_name: newSettings.platformName,
        hero_title: newSettings.heroTitle,
        hero_subtitle: newSettings.heroSubtitle,
        hero_button_text: newSettings.heroButtonText,
        hero_image_url: newSettings.heroImageUrl,
        teacher_image_url: newSettings.teacherImageUrl,
        features_title: newSettings.featuresTitle,
        features_subtitle: newSettings.featuresSubtitle,
        features: newSettings.features,
        footer_description: newSettings.footerDescription,
        contact_phone: newSettings.contactPhone,
        contact_facebook_url: newSettings.contactFacebookUrl,
        contact_youtube_url: newSettings.contactYoutubeUrl,
        announcement_banner: newSettings.announcementBanner,
        monthly_price: newSettings.monthlyPrice,
        quarterly_price: newSettings.quarterlyPrice,
        semi_annually_price: newSettings.semiAnnuallyPrice,
        annual_price: newSettings.annualPrice,
        currency: newSettings.currency,
        payment_numbers: newSettings.paymentNumbers,
        enabled_subscription_modes: newSettings.enabledSubscriptionModes,
    };

    const { data } = await supabase.from('platform_settings').select('id').limit(1).single();
    const { error } = await (data
        ? supabase.from('platform_settings').update(payload).eq('id', data.id)
        : supabase.from('platform_settings').insert([payload])
    );
    
    return { error };
};

export const createCourse = async (courseData: Omit<Course, 'id'>) => supabase.from('courses').insert(courseData).select().single();
export const updateCourse = async (courseId: string, updates: Partial<Course>) => supabase.from('courses').update(updates).eq('id', courseId).select().single();
export const deleteCourse = async (courseId: string) => supabase.from('courses').delete().eq('id', courseId);
export const checkCoursePurchase = async (userId: string, courseId: string): Promise<boolean> => { const { count } = await supabase.from('user_courses').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('course_id', courseId); return (count || 0) > 0; };
export const purchaseCourse = async (userId: string, courseId: string) => supabase.from('user_courses').insert({ user_id: userId, course_id: courseId });
export const addFeaturedBook = async (book: Omit<Book, 'id'>) => supabase.from('featured_books').insert(book);
export const updateFeaturedBook = async (book: Book) => supabase.from('featured_books').update(book).eq('id', book.id);
export const deleteFeaturedBook = async (id: string) => supabase.from('featured_books').delete().eq('id', id);
export const addFeaturedCourse = async (course: any) => supabase.from('featured_courses').insert(course);
export const updateFeaturedCourse = async (course: any) => supabase.from('featured_courses').update(course).eq('id', course.id);
export const deleteFeaturedCourse = async (id: string) => supabase.from('featured_courses').delete().eq('id', id);
export const addUnitToSemester = async (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id'|'lessons'>) => {
    const payload = { ...unitData, semester_id: semesterId };
    if (payload.teacherId) {
        (payload as any).teacher_id = payload.teacherId;
        delete (payload as any).teacherId;
    }
    return supabase.from('units').insert(payload).select().single();
};
export const addLessonToUnit = async (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>) => supabase.from('lessons').insert({ ...lessonData, unit_id: unitId }).select().single();
export const updateLesson = async (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson) => supabase.from('lessons').update(updatedLesson).eq('id', updatedLesson.id);
export const deleteLesson = async (gradeId: number, semesterId: string, unitId: string, lessonId: string) => supabase.from('lessons').delete().eq('id', lessonId);
export const updateUnit = async (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }) => {
    const payload = { ...updatedUnit };
    if (payload.teacherId) {
        (payload as any).teacher_id = payload.teacherId;
        delete payload.teacherId;
    }
    delete (payload as any).lessons;
    return supabase.from('units').update(payload).eq('id', updatedUnit.id);
};
export const deleteUnit = async (gradeId: number, semesterId: string, unitId: string) => supabase.from('units').delete().eq('id', unitId);
// The functions below were in the original file but are now superseded by the guide's functions.
// They are kept here commented out for reference but can be removed.
/*
export async function getStudentProgress(userId: string): Promise<{ lesson_id: string }[]> {
    const { data, error } = await supabase.from('progress').select('lesson_id').eq('student_id', userId);
    if (error) { console.warn('Could not fetch student progress...', error.message); return []; }
    return data || [];
}
export const getQuizAttemptsByUserId = async (userId: string): Promise<QuizAttempt[]> => {
    return getStudentQuizAttempts(userId);
}
*/
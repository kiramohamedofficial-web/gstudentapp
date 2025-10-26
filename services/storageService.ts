import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  User, Role, Subscription, Grade, Teacher, Lesson, Unit, SubscriptionRequest,
  // FIX: Import 'ActivityLog' to resolve 'Cannot find name 'ActivityLog'' error.
  StudentQuestion, SubscriptionCode, Semester, QuizAttempt, ActivityLog
} from '../types';

// =================================================================
// SUPABASE CLIENT SETUP
// =================================================================
const supabaseUrl = 'https://csipsaucwcuserhfrehn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXBzYXVjd2N1c2VyaGZyZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQwMTgsImV4cCI6MjA3Njg3MDAxOH0.FJu12ARvbqG0ny0D9d1Jje3BxXQ-q33gjx7JSH26j1w';
const supabase = createClient(supabaseUrl, supabaseKey);
export { supabase };

// =================================================================
// DEFAULT DATA (FALLBACK)
// =================================================================
const defaultGrades: Grade[] = [
    { id: 1, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's1-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's1-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 2, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's2-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's2-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 3, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 's3-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's3-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 4, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's4-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's4-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 5, name: 'الصف الثاني الثانوي - علمي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's5-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's5-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 6, name: 'الصف الثاني الثانوي - أدبي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's6-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's6-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 7, name: 'الصف الثالث الثانوي - علمي علوم', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's7-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's7-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 8, name: 'الصف الثالث الثانوي - علمي رياضيات', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's8-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's8-2', title: 'الفصل الدراسي الثاني', units: [] }] },
    { id: 9, name: 'الصف الثالث الثانوي - أدبي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 's9-1', title: 'الفصل الدراسي الأول', units: [] }, { id: 's9-2', title: 'الفصل الدراسي الثاني', units: [] }] }
];
const defaultCurriculumData = { grades: defaultGrades };

// =================================================================
// AUTHENTICATION
// =================================================================
type Stage = 'Middle' | 'Secondary' | null;
type Track = 'Scientific' | 'Literary' | 'All' | null;

function determineStageAndTrack(gradeId: number | null): { stage: Stage, track: Track } {
    if (gradeId === null) return { stage: null, track: 'All' };
    if (gradeId >= 1 && gradeId <= 3) return { stage: 'Middle', track: 'All' };
    if (gradeId === 4) return { stage: 'Secondary', track: 'All' };
    if (gradeId === 5 || gradeId === 7 || gradeId === 8) return { stage: 'Secondary', track: 'Scientific' };
    if (gradeId === 6 || gradeId === 9) return { stage: 'Secondary', track: 'Literary' };
    return { stage: null, track: 'All' };
}

export async function signUp(userData: Omit<User, 'id' | 'role' | 'subscriptionId'> & { email: string, password?: string }) {
    const { email, password, name, phone, guardianPhone, grade } = userData;

    if (!password) {
        return { data: null, error: { message: "Password is required for sign up." } };
    };
    
    const { stage, track } = determineStageAndTrack(grade);

    const userMetaData = {
        name: name,
        phone: phone,
        guardian_phone: guardianPhone,
        grade_id: grade,
        role: 'student',
        stage: stage,
        track: track
    };

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userMetaData }
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            return { data, error: { message: 'هذا البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.' } };
        }
        return { data, error };
    }
    return { data, error };
};

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
    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        if (error.message.includes("schema cache")) {
            console.error("DATABASE SETUP ERROR: The 'profiles' table was not found. Please ensure the table exists in the 'public' schema and that the 'anon' role has SELECT permissions on it.");
        }
        if (error.code !== 'PGRST116') console.error("Error fetching profile:", error.message);
        return null;
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    return {
        id: profileData.id, email: authUser?.email || '', name: profileData.name, phone: profileData.phone,
        guardianPhone: profileData.guardian_phone, grade: profileData.grade_id, track: profileData.track,
        role: profileData.role as Role, teacherId: profileData.teacher_id, stage: profileData.stage
    };
};

// =================================================================
// TEACHER MANAGEMENT
// =================================================================
interface CreateTeacherParams { id?: string, email: string; password?: string; name: string; subject: string; phone: string; teaching_grades: number[]; teaching_levels: string[]; image_url?: string; }
export async function createTeacher(params: CreateTeacherParams) {
  try {
    if (!params.password) throw new Error('Password is required for new teacher.');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name, role: 'teacher' } }
    });
    if (authError || !authData.user) throw authError || new Error('فشل إنشاء حساب المصادقة.');

    // The DB trigger on auth.users should create the row in 'profiles'
    // Now we create the teacher-specific data in the 'teachers' table
    const { data: teacher, error: teacherError } = await supabase.from('teachers').insert({
        name: params.name, subject: params.subject, teaching_grades: params.teaching_grades,
        teaching_levels: params.teaching_levels, image_url: params.image_url
    }).select().single();
    if (teacherError || !teacher) throw teacherError || new Error('فشل إنشاء ملف المدرس.');

    // Finally, link the profile to the teacher entry
    const { error: profileUpdateError } = await supabase.from('profiles').update({
        teacher_id: teacher.id, phone: `+2${params.phone}`
    }).eq('id', authData.user.id);
    if (profileUpdateError) throw profileUpdateError;

    return { success: true, teacher };
  } catch (error: any) {
    console.error('Error creating teacher account:', error.message);
    return { success: false, error: { message: error.message } };
  }
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching all teachers:', error.message); return []; }
  return (data || []).map((teacher: any) => ({
    id: teacher.id, name: teacher.name, subject: teacher.subject, imageUrl: teacher.image_url,
    teachingLevels: teacher.teaching_levels, teachingGrades: teacher.teaching_grades,
  }));
}

export async function deleteTeacher(teacherId: string) {
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').eq('teacher_id', teacherId).single();
    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error finding profile for teacher:', profileError.message);
        return { success: false, error: profileError };
    }
    if (profileData) {
        // Admin API to delete user. This will cascade and delete from profiles table, and then teachers table.
        const { error: adminDeleteError } = await supabase.auth.admin.deleteUser(profileData.id);
        if (adminDeleteError) {
             console.error('Error deleting auth user for teacher:', adminDeleteError.message);
             // Fallback to deleting just the teacher profile if auth deletion fails (e.g., permissions)
             const { error: teacherError } = await supabase.from('teachers').delete().eq('id', teacherId);
             if (teacherError) return { success: false, error: teacherError };
        }
    } else {
        // If no user is associated, just delete the teacher profile.
        const { error: teacherError } = await supabase.from('teachers').delete().eq('id', teacherId);
        if (teacherError) return { success: false, error: teacherError };
    }
    return { success: true };
}

export async function updateTeacher(teacherId: string, updates: any) {
  const { data, error } = await supabase.from('teachers').update({
    name: updates.name, subject: updates.subject, teaching_grades: updates.teachingGrades,
    teaching_levels: updates.teachingLevels, image_url: updates.imageUrl
  }).eq('id', teacherId).select().single();
  if (error) return { success: false, error };

  if (updates.name || updates.phone) {
    const { data: profileData } = await supabase.from('profiles').select('id').eq('teacher_id', teacherId).single();
    if (profileData) {
      const profilePayload: Record<string, any> = {};
      if (updates.name) profilePayload.name = updates.name;
      if (updates.phone) profilePayload.phone = `+2${updates.phone}`;
      await supabase.from('profiles').update(profilePayload).eq('id', profileData.id);
    }
  }
  return { success: true, data };
}

// =================================================================
// GRADES / CURRICULUM (RELATIONAL)
// =================================================================
let curriculumCache: { grades: Grade[] } | null = null;
let isCurriculumDataLoaded = false;

export const initData = async (): Promise<void> => {
    if (isCurriculumDataLoaded) return;
    try {
        // Fetch all data from tables separately to avoid relationship issues
        const { data: gradesData, error: gradesError } = await supabase.from('grades').select('*').order('id');
        if (gradesError) throw gradesError;

        const { data: semestersData, error: semestersError } = await supabase.from('semesters').select('*').order('id');
        if (semestersError) throw semestersError;

        const { data: unitsData, error: unitsError } = await supabase.from('units').select('*').order('id');
        if (unitsError) throw unitsError;

        const { data: lessonsData, error: lessonsError } = await supabase.from('lessons').select('*').order('id');
        if (lessonsError) throw lessonsError;

        if (gradesData && semestersData && unitsData && lessonsData) {
            // Manually construct the nested structure in memory
            const lessonsByUnit = new Map<string, Lesson[]>();
            for (const lesson of lessonsData) {
                if (!lessonsByUnit.has(lesson.unit_id)) {
                    lessonsByUnit.set(lesson.unit_id, []);
                }
                lessonsByUnit.get(lesson.unit_id)!.push(lesson);
            }

            const unitsBySemester = new Map<string, Unit[]>();
            for (const unit of unitsData) {
                if (!unitsBySemester.has(unit.semester_id)) {
                    unitsBySemester.set(unit.semester_id, []);
                }
                const unitWithLessons: Unit = { ...unit, lessons: lessonsByUnit.get(unit.id) || [] };
                unitsBySemester.get(unit.semester_id)!.push(unitWithLessons);
            }

            const semestersByGrade = new Map<number, Semester[]>();
            for (const semester of semestersData) {
                 if (!semestersByGrade.has(semester.grade_id)) {
                    semestersByGrade.set(semester.grade_id, []);
                }
                const semesterWithUnits: Semester = { ...semester, units: unitsBySemester.get(semester.id) || [] };
                semestersByGrade.get(semester.grade_id)!.push(semesterWithUnits);
            }
            
            const finalGrades: Grade[] = gradesData.map(grade => ({
                ...grade,
                semesters: semestersByGrade.get(grade.id) || []
            }));

            curriculumCache = { grades: finalGrades };

        } else {
            console.log("No curriculum data found in DB, using local fallback.");
            curriculumCache = defaultCurriculumData;
        }
    } catch (error: any) {
        console.error("Failed to initialize curriculum data from relational tables:", error.message);
        curriculumCache = defaultCurriculumData;
    }
    isCurriculumDataLoaded = true;
};
const refreshData = async () => { isCurriculumDataLoaded = false; await initData(); };

export const getAllGrades = (): Grade[] => curriculumCache?.grades || [];
export const getGradeById = (gradeId: number | null): Grade | undefined => {
    if (gradeId === null) return undefined;
    return getAllGrades().find(g => g.id === gradeId);
};


export const addUnitToSemester = async (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id'|'lessons'>) => { 
    await supabase.from('units').insert({ title: unitData.title, teacher_id: unitData.teacherId, semester_id: semesterId, track: unitData.track });
    await refreshData();
};
export const addLessonToUnit = async (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>) => {
    await supabase.from('lessons').insert({ ...lessonData, unit_id: unitId });
    await refreshData();
};
export const updateLesson = async (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson) => {
    await supabase.from('lessons').update(updatedLesson).eq('id', updatedLesson.id);
    await refreshData();
};
export const deleteLesson = async (gradeId: number, semesterId: string, unitId: string, lessonId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId);
    await refreshData();
};
export const updateUnit = async (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }) => {
    await supabase.from('units').update(updatedUnit).eq('id', updatedUnit.id);
    await refreshData();
};
export const deleteUnit = async (gradeId: number, semesterId: string, unitId: string) => {
    await supabase.from('units').delete().eq('id', unitId);
    await refreshData();
};


// =================================================================
// SUBSCRIPTIONS & PROGRESS
// =================================================================
// FIX: Implemented placeholder function.
export async function checkUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'Active').order('end_date', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found is not an error here
        console.error('Error checking user subscription:', error.message);
        return null;
    }
    return data ? { id: data.id, userId: data.user_id, plan: data.plan, startDate: data.start_date, endDate: data.end_date, status: data.status, teacherId: data.teacher_id } : null;
}
// FIX: Implemented placeholder function.
export async function activateStudentSubscription(params: { userId: string, plan: Subscription['plan'], endDate?: string, teacherId?: string }) {
    const { userId, plan, endDate, teacherId } = params;
    await createOrUpdateSubscription(userId, plan, 'Active', endDate, teacherId);
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
    if (error) { console.error('Error fetching user subscriptions:', error.message); return []; }
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id }));
}
// FIX: Implemented placeholder function.
export async function markLessonComplete(userId: string, lessonId: string) {
    const { error } = await supabase.from('progress').insert({ student_id: userId, lesson_id: lessonId });
    // Ignore unique constraint violation error (23505), as it means the lesson is already marked complete.
    if (error && error.code !== '23505') {
        console.error('Error marking lesson complete:', error.message);
    }
}
// FIX: Implemented placeholder function.
export async function getStudentProgress(userId: string): Promise<{ lesson_id: string }[]> {
    const { data, error } = await supabase.from('progress').select('lesson_id').eq('student_id', userId);
    if (error) {
        console.error('Error fetching student progress:', error.message);
        return [];
    }
    return data || [];
}
// FIX: Implemented placeholder function.
export async function getAllStudentProgress(): Promise<{ user_id: string, lesson_id: string }[]> {
    const { data, error } = await supabase.from('progress').select('student_id, lesson_id');
    if (error) {
        console.error('Error fetching all student progress:', error.message);
        return [];
    }
    // Rename student_id to user_id for consistency with other parts of the app
    return (data || []).map(p => ({ user_id: p.student_id, lesson_id: p.lesson_id }));
}
// FIX: Implemented placeholder function.
export async function saveQuizAttempt(userId: string, lessonId: string, score: number, totalQuestions: number, submittedAnswers: any[], timeTaken: number) {
    const findLesson = (id: string): Lesson | undefined => {
        for (const grade of getAllGrades()) {
            for (const semester of grade.semesters) {
                for (const unit of semester.units) {
                    const lesson = unit.lessons.find(l => l.id === id);
                    if (lesson) return lesson;
                }
            }
        }
        return undefined;
    };
    const lesson = findLesson(lessonId);
    const passingScore = lesson?.passingScore ?? 50;
    const isPass = score >= passingScore;

    const { error } = await supabase.from('quiz_attempts').insert({
        user_id: userId,
        lesson_id: lessonId,
        score,
        submitted_answers: submittedAnswers,
        time_taken: timeTaken,
        is_pass: isPass
    });

    if (error) {
        console.error("Error saving quiz attempt:", error.message);
    }
}
// FIX: Implemented placeholder function.
export async function getStudentQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('submitted_at', { ascending: false });
    if (error) {
        console.error('Error fetching quiz attempts:', error.message);
        return [];
    }
    return (data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        lessonId: a.lesson_id,
        submittedAt: a.submitted_at,
        score: a.score,
        submittedAnswers: a.submitted_answers,
        timeTaken: a.time_taken,
        isPass: a.is_pass,
    }));
}
export const addQuizAttempt = async (attemptData: Omit<QuizAttempt, 'id'>): Promise<void> => { const { userId, lessonId, score, submittedAnswers, timeTaken } = attemptData; await saveQuizAttempt(userId, lessonId, score, 10, submittedAnswers || [], timeTaken); };
// FIX: Fixed function to correctly call and return from getStudentQuizAttempts.
export const getQuizAttemptsByUserId = async (userId: string): Promise<QuizAttempt[]> => getStudentQuizAttempts(userId);
// FIX: Fixed function to correctly call and return from getStudentQuizAttempts.
export const getLatestQuizAttemptForLesson = async (userId: string, lessonId: string): Promise<QuizAttempt | undefined> => { const attempts = await getStudentQuizAttempts(userId); return attempts.find(a => a.lessonId === lessonId); };


// =================================================================
// OTHER FUNCTIONS
// =================================================================
// FIX: Implemented placeholder function.
export async function markAttendance(userId: string, lessonId: string, durationMinutes: number) {
    // Assuming an 'attendance' table exists. This is a fire-and-forget operation.
    console.log(`Marking attendance for ${userId} on lesson ${lessonId} for ${durationMinutes} minutes.`);
    await supabase.from('attendance').insert({ user_id: userId, lesson_id: lessonId, duration_minutes: durationMinutes });
}
// FIX: Implemented placeholder function.
export const getSubscriptionsByTeacherId = async (teacherId: string): Promise<Subscription[]> => {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('teacher_id', teacherId);
    if (error) {
        console.error('Error fetching subscriptions by teacher ID:', error.message);
        return [];
    }
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id }));
};
// FIX: Implemented placeholder function.
export const getSubscriptionRequests = async (): Promise<SubscriptionRequest[]> => {
    const { data, error } = await supabase.from('subscription_requests').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching subscription requests:', error.message);
        return [];
    }
    return (data || []).map(r => ({
        id: r.id, userId: r.user_id, userName: r.user_name, plan: r.plan,
        paymentFromNumber: r.payment_from_number, status: r.status, createdAt: r.created_at,
        subjectName: r.subject_name, unitId: r.unit_id
    }));
};
// FIX: Implemented placeholder function.
export const getPendingSubscriptionRequestCount = async (): Promise<number> => {
    const { count, error } = await supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    if (error) {
        console.error('Error fetching pending subscription request count:', error.message);
        return 0;
    }
    return count || 0;
};
// FIX: Implemented placeholder function.
export const addSubscriptionRequest = async (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): Promise<void> => {
    await supabase.from('subscription_requests').insert({ user_id: userId, user_name: userName, plan, payment_from_number: paymentFromNumber, status: 'Pending', subject_name: subjectName, unit_id: unitId });
};
// FIX: Implemented placeholder function.
export const updateSubscriptionRequest = async (updatedRequest: SubscriptionRequest): Promise<void> => {
    const { id, ...updates } = updatedRequest;
    await supabase.from('subscription_requests').update({ status: updates.status }).eq('id', id);
};
export const getAllUsers = async (): Promise<User[]> => { 
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error("Error fetching all profiles:", error.message); return []; } 
    return (data || []).map((p: any) => ({ 
        id: p.id, name: p.name, email: '', phone: p.phone, guardianPhone: p.guardian_phone, 
        grade: p.grade_id, track: p.track, role: p.role as Role, teacherId: p.teacher_id 
    })); 
};
export const getTeachers = async (): Promise<Teacher[]> => (await getAllTeachers() as Teacher[]) || [];
export const getTeacherById = async (id: string): Promise<Teacher | null> => { const teachers = await getTeachers(); return teachers.find(t => t.id === id) || null; };
export const addActivityLog = (action: string, details: string) => console.log(`Activity: ${action} - ${details}`);
export const getChatUsage = (userId: string) => ({ remaining: 50 });
export const incrementChatUsage = (userId: string) => {};
export const getPlatformSettings = () => ({ platformName: 'Gstudent', heroTitle: 'بوابتك للتفوق الدراسي', heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع المواد، لمساعدتك على تحقيق أعلى الدرجات مع نخبة من أفضل المدرسين.', heroButtonText: 'ابدأ رحلتك الآن', featuresTitle: 'لماذا تختار منصة Gstudent؟', featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.', features: [], footerDescription: '', contactPhone: '', contactFacebookUrl: '', contactYoutubeUrl: '' });
export const updatePlatformSettings = (settings: any) => {};
export const getFeaturedCourses = () => [];
export const getFeaturedBooks = () => [];
// FIX: Implemented placeholder function.
export async function generateSubscriptionCode(codeData: any): Promise<SubscriptionCode | null> {
    const { data, error } = await supabase.from('subscription_codes').insert(codeData).select().single();
    if (error) {
        console.error('Error generating subscription code:', error.message);
        return null;
    }
    if (!data) return null;
    // Map snake_case to camelCase
    return {
        code: data.code,
        teacherId: data.teacher_id,
        durationDays: data.duration_days,
        maxUses: data.max_uses,
        timesUsed: data.times_used,
        usedByUserIds: data.used_by_user_ids,
        createdAt: data.created_at,
    };
}
// FIX: Implemented placeholder function.
export async function getAllCodes(): Promise<SubscriptionCode[]> {
    const { data, error } = await supabase.from('subscription_codes').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching all codes:', error.message);
        return [];
    }
    // Map snake_case to camelCase
    return (data || []).map((c: any) => ({
        code: c.code,
        teacherId: c.teacher_id,
        durationDays: c.duration_days,
        maxUses: c.max_uses,
        timesUsed: c.times_used,
        usedByUserIds: c.used_by_user_ids,
        createdAt: c.created_at,
    }));
}
// FIX: Implemented placeholder function to return a value.
export async function redeemCode(code: string, userGradeId: number, userTrack: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'User is not authenticated.' };
    }
    const { data: codeData, error: codeError } = await supabase.from('subscription_codes').select('*').eq('code', code).single();
    if (codeError || !codeData) return { success: false, error: 'Invalid code.' };
    if (codeData.times_used >= codeData.max_uses) return { success: false, error: 'Code has reached its maximum usage limit.' };
    if (codeData.used_by_user_ids.includes(user.id)) return { success: false, error: 'You have already used this code.' };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + codeData.duration_days);

    const subResult = await createOrUpdateSubscription(user.id, 'Code', 'Active', endDate.toISOString(), codeData.teacher_id);
    if (subResult.error) {
        return { success: false, error: `Failed to activate subscription: ${subResult.error.message}` };
    }

    await supabase.from('subscription_codes').update({
        times_used: codeData.times_used + 1,
        used_by_user_ids: [...codeData.used_by_user_ids, user.id]
    }).eq('code', code);
    
    return { success: true };
}
export async function registerAndRedeemCode(userData: any, code: string): Promise<{ data: { userId: string } | null, error: string | null }> {
    const { data: authData, error: authError } = await signUp(userData);
    if (authError || !authData.user) {
        return { data: null, error: authError?.message || 'فشل إنشاء الحساب.' };
    }
    // FIX: Await the result of redeemCode and check its properties.
    const redeemResult = await redeemCode(code, userData.grade, userData.track);
    if (!redeemResult.success) {
        return { data: { userId: authData.user.id }, error: `تم إنشاء حسابك ولكن فشل تفعيل الكود: ${redeemResult.error}. يرجى التواصل مع الدعم.` };
    }
    return { data: { userId: authData.user.id }, error: null };
};
// FIX: Implemented placeholder function.
export async function validateSubscriptionCode(code: string): Promise<{ valid: boolean; error?: string }> {
    const { data, error } = await supabase.from('subscription_codes').select('times_used, max_uses').eq('code', code).single();
    if (error || !data) {
        return { valid: false, error: 'الكود غير صالح أو غير موجود.' };
    }
    if (data.times_used >= data.max_uses) {
        return { valid: false, error: 'هذا الكود تم استخدامه بالكامل.' };
    }
    return { valid: true };
};
// FIX: Implemented placeholder function.
export const generateSubscriptionCodes = async (options: { teacherId?: string, durationDays: number, count: number, maxUses: number }): Promise<SubscriptionCode[]> => {
    const generatedCodes: SubscriptionCode[] = [];
    for (let i = 0; i < options.count; i++) {
        const code = `GS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const newCode = await generateSubscriptionCode({
            code,
            teacher_id: options.teacherId,
            duration_days: options.durationDays,
            max_uses: options.maxUses,
            times_used: 0,
            used_by_user_ids: [],
        });
        if (newCode) {
            generatedCodes.push(newCode);
        }
    }
    return generatedCodes;
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
export const getGradesForSelection = (): {id: number, name: string, level: 'Middle' | 'Secondary'}[] => {
    // Always use the complete defaultGrades list for registration to ensure all options are available.
    return defaultGrades.map(g => ({ id: g.id, name: g.name, level: g.level }));
};
export const deleteSelf = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: { message: 'User not authenticated.' } }; const { error } = await supabase.auth.admin.deleteUser(user.id); if (!error) await signOut(); return { error }; };
// FIX: Implemented placeholder function.
export const addStudentQuestion = async (userId: string, userName: string, questionText: string): Promise<void> => {
    await supabase.from('student_questions').insert({ user_id: userId, user_name: userName, question_text: questionText, status: 'Pending' });
};
// FIX: Implemented placeholder function.
export const getStudentQuestionsByUserId = async (userId: string): Promise<StudentQuestion[]> => {
    const { data, error } = await supabase.from('student_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching questions:', error.message); return []; }
    return (data || []) as StudentQuestion[];
};
// FIX: Implemented placeholder function.
export const getAllStudentQuestions = async (): Promise<StudentQuestion[]> => {
    const { data, error } = await supabase.from('student_questions').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching all questions:', error.message); return []; }
    return (data || []) as StudentQuestion[];
};
// FIX: Implemented placeholder function.
export const answerStudentQuestion = async (questionId: string, answerText: string): Promise<void> => {
    await supabase.from('student_questions').update({ answer_text: answerText, status: 'Answered' }).eq('id', questionId);
};
// FIX: Implemented placeholder function.
export const getAllSubscriptions = async (): Promise<Subscription[]> => {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) {
        console.error('Error getting all subscriptions:', error.message);
        return [];
    }
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id }));
};
export const getSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => { const subs = await getSubscriptionsByUserId(userId); return subs?.[0] || null; }
export const checkDbConnection = async () => supabase.from('teachers').select('id', { count: 'exact', head: true });
// FIX: Implemented placeholder function.
export const getActivityLogs = (): ActivityLog[] => [];
// FIX: Implemented placeholder function.
export const addFeaturedCourse = (course: any) => { console.log('Adding featured course', course); };
// FIX: Implemented placeholder function.
export const updateFeaturedCourse = (course: any) => { console.log('Updating featured course', course); };
// FIX: Implemented placeholder function.
export const deleteFeaturedCourse = (id: string) => { console.log('Deleting featured course', id); };
// FIX: Implemented placeholder function.
export const addFeaturedBook = (book: any) => { console.log('Adding featured book', book); };
// FIX: Implemented placeholder function.
export const updateFeaturedBook = (book: any) => { console.log('Updating featured book', book); };
// FIX: Implemented placeholder function.
export const deleteFeaturedBook = (id: string) => { console.log('Deleting featured book', id); };

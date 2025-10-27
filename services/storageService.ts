import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  User, Role, Subscription, Grade, Teacher, Lesson, Unit, SubscriptionRequest,
  StudentQuestion, SubscriptionCode, Semester, QuizAttempt, ActivityLog, LessonType, PlatformSettings, Course
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
const ASSET_BUCKET = 'gstudent-assets';

export async function uploadImage(file: File): Promise<string | null> {
    const filePath = `public/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(ASSET_BUCKET).upload(filePath, file);
    if (error) {
        console.error('Error uploading image:', error);
        return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(data.path);
    return publicUrl;
}

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
        track: track,
        device_limit: 1, // Default to 1 device on signup
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
    let signInPromise;
    if (isEmail) {
        signInPromise = supabase.auth.signInWithPassword({ email: identifier, password });
    } else {
        const trimmed = identifier.trim().replace(/\s/g, '');
        let formattedPhone = '';
        if (trimmed.startsWith('0') && trimmed.length === 11) formattedPhone = `+2${trimmed}`;
        else if (trimmed.startsWith('20') && trimmed.length === 12) formattedPhone = `+${trimmed}`;
        else if (trimmed.startsWith('+20') && trimmed.length === 13) formattedPhone = trimmed;
        else return { data: null, error: { message: 'رقم الهاتف المدخل غير صالح.' } };
        signInPromise = supabase.auth.signInWithPassword({ phone: formattedPhone, password });
    }

    const { data: signInData, error: signInError } = await signInPromise;
    if (signInError) return { data: null, error: signInError };
    if (!signInData.user) return { data: null, error: { message: 'User not found after sign in.' } };
    
    // === NEW DEVICE VALIDATION LOGIC ===
    const deviceId = getOrCreateDeviceId();
    const userId = signInData.user.id;

    // Get current device IDs and limit for the user
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('device_ids, device_limit')
        .eq('id', userId)
        .single();
    
    if (profileError) {
        await signOut(); // Log out user if profile can't be fetched
        return { data: null, error: { message: `Could not fetch user profile: ${profileError.message}` } };
    }

    const deviceIds: string[] = profileData.device_ids || [];
    const deviceLimit = profileData.device_limit ?? 1; // Use user's specific limit, default to 1

    if (deviceIds.includes(deviceId)) {
        // Device is already registered, proceed with login
        return { data: signInData, error: null };
    }

    if (deviceIds.length >= deviceLimit) {
        // Device limit reached
        await signOut(); // Log out user
        return { data: null, error: { message: `تم الوصول للحد الأقصى لعدد الأجهزة (${deviceLimit}). لا يمكن تسجيل الدخول من هذا الجهاز.` } };
    }

    // New device, under the limit. Register it.
    const newDeviceIds = [...deviceIds, deviceId];
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ device_ids: newDeviceIds })
        .eq('id', userId);
    
    if (updateError) {
        await signOut(); // Log out user if device registration fails
        return { data: null, error: { message: `فشل تسجيل الجهاز الجديد: ${updateError.message}` } };
    }
    
    // Device registered successfully, proceed with login
    return { data: signInData, error: null };
};

export const signOut = async () => supabase.auth.signOut();
export const getSession = async () => { const { data: { session } } = await supabase.auth.getSession(); return session; };
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => supabase.auth.onAuthStateChange((event, session) => callback(event, session));

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
        role: profileData.role as Role, teacherId: profileData.teacher_id, stage: profileData.stage,
        device_ids: profileData.device_ids || [],
        device_limit: profileData.device_limit ?? 1,
    };
};

export const getUserByTeacherId = async (teacherId: string): Promise<User | null> => {
    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('teacher_id', teacherId).single();
    if (error) {
        if (error.code !== 'PGRST116') console.error("Error fetching profile by teacherId:", error.message);
        return null;
    }
    return {
        id: profileData.id, email: '', name: profileData.name, phone: profileData.phone,
        guardianPhone: profileData.guardian_phone, grade: profileData.grade_id, track: profileData.track,
        role: profileData.role as Role, teacherId: profileData.teacher_id, stage: profileData.stage
    };
};


// =================================================================
// PASSWORD RECOVERY
// =================================================================
export const sendPasswordResetEmail = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
};

export const updateUserPassword = async (password: string) => {
    return supabase.auth.updateUser({ password });
};


// =================================================================
// TEACHER MANAGEMENT
// =================================================================
interface CreateTeacherParams { id?: string, email: string; password?: string; name: string; subject: string; phone: string; teaching_grades: number[]; teaching_levels: string[]; image_url?: string; }

export async function createTeacher(params: CreateTeacherParams) {
  const { data, error } = await supabase.rpc('create_teacher_account', {
    teacher_name: params.name,
    teacher_email: params.email,
    teacher_password: params.password,
    teacher_subject: params.subject,
    teaching_grades_array: params.teaching_grades,
    teaching_levels_array: params.teaching_levels,
    teacher_image_url: params.image_url || null
  });

  if (error) {
    console.error('Error calling create_teacher_account RPC:', error);
    return { success: false, error };
  }
  
  return { success: data.success, data, error: data.success ? null : { message: data.error } };
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
        const { error: adminDeleteError } = await supabase.auth.admin.deleteUser(profileData.id);
        if (adminDeleteError) {
             console.error('Error deleting auth user for teacher:', adminDeleteError.message);
             const { error: teacherError } = await supabase.from('teachers').delete().eq('id', teacherId);
             if (teacherError) return { success: false, error: teacherError };
        }
    } else {
        const { error: teacherError } = await supabase.from('teachers').delete().eq('id', teacherId);
        if (teacherError) return { success: false, error: teacherError };
    }
    return { success: true, error: null };
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

const mapToDbPayload = (obj: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  if (!obj) return newObj;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
};

const toLessonType = (dbType: string): LessonType => {
    if (!dbType) {
        return LessonType.EXPLANATION; 
    }
    const capitalized = dbType.charAt(0).toUpperCase() + dbType.slice(1);
    if (Object.values(LessonType).includes(capitalized as LessonType)) {
        return capitalized as LessonType;
    }
    console.warn(`Unknown lesson type "${dbType}" from database.`);
    return LessonType.EXPLANATION;
};

export const initData = async (): Promise<void> => {
    if (isCurriculumDataLoaded) return;
    try {
        const { data: dbData, error } = await supabase
            .from('grades')
            .select(`
                *,
                semesters (
                    *,
                    units (
                        *,
                        lessons (*)
                    )
                )
            `)
            .order('id', { ascending: true })
            .order('id', { foreignTable: 'semesters', ascending: true })
            .order('id', { foreignTable: 'semesters.units', ascending: true })
            .order('id', { foreignTable: 'semesters.units.lessons', ascending: true });

        if (error) throw error;

        if (dbData && dbData.length > 0) {
            const grades: Grade[] = dbData.map((grade: any) => ({
                id: grade.id,
                name: grade.name,
                ordinal: grade.ordinal,
                level: grade.level,
                levelAr: grade.levelAr,
                semesters: (grade.semesters || []).map((semester: any) => ({
                    id: semester.id,
                    title: semester.title,
                    grade_id: semester.grade_id,
                    units: (semester.units || []).map((unit: any) => ({
                        id: unit.id,
                        title: unit.title,
                        teacherId: unit.teacher_id,
                        track: unit.track,
                        semester_id: unit.semester_id,
                        lessons: (unit.lessons || []).map((lesson: any) => ({
                            id: lesson.id,
                            title: lesson.title,
                            type: toLessonType(lesson.type),
                            content: lesson.content,
                            imageUrl: lesson.image_url,
                            correctAnswers: lesson.correct_answers,
                            timeLimit: lesson.time_limit,
                            passingScore: lesson.passing_score,
                            dueDate: lesson.due_date,
                            quizType: lesson.quiz_type,
                            questions: lesson.questions,
                        }))
                    }))
                }))
            }));
            curriculumCache = { grades };
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
    const payload = mapToDbPayload(unitData);
    delete payload.semester_id;
    const { error } = await supabase.from('units').insert({ ...payload, semester_id: semesterId });
    if (error) { console.error('Error adding unit:', error); throw error; }
    await refreshData();
};
export const addLessonToUnit = async (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>) => {
    const payload = mapToDbPayload(lessonData);
    if (payload.type) {
        payload.type = (payload.type as string).toLowerCase();
    }
    const { error } = await supabase.from('lessons').insert({ ...payload, unit_id: unitId });
    if (error) { console.error('Error adding lesson:', error); throw error; }
    await refreshData();
};
export const updateLesson = async (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson) => {
    const { id, ...lessonData } = updatedLesson;
    const payload = mapToDbPayload(lessonData);
    if (payload.type) {
        payload.type = (payload.type as string).toLowerCase();
    }
    const { error } = await supabase.from('lessons').update(payload).eq('id', id);
    if (error) { console.error('Error updating lesson:', error); throw error; }
    await refreshData();
};
export const deleteLesson = async (gradeId: number, semesterId: string, unitId: string, lessonId: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) { console.error('Error deleting lesson:', error); throw error; }
    await refreshData();
};
export const updateUnit = async (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }) => {
    const { id, ...unitData } = updatedUnit;
    const payload = mapToDbPayload(unitData);

    if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('units').update(payload).eq('id', id);
        if (error) { console.error('Error updating unit:', error); throw error; }
    }
    await refreshData();
};
export const deleteUnit = async (gradeId: number, semesterId: string, unitId: string) => {
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    if (error) { console.error('Error deleting unit:', error); throw error; }
    await refreshData();
};


// =================================================================
// SUBSCRIPTIONS & PROGRESS
// =================================================================
export async function checkUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'Active').order('end_date', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') { 
        console.error('Error checking user subscription:', error.message);
        return null;
    }
    return data ? { id: data.id, userId: data.user_id, plan: data.plan, startDate: data.start_date, endDate: data.end_date, status: data.status, teacherId: data.teacher_id } : null;
}
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
export async function markLessonComplete(userId: string, lessonId: string) {
    const { error } = await supabase.from('progress').insert({ student_id: userId, lesson_id: lessonId });
    if (error && error.code !== '23505') {
        console.error('Error marking lesson complete:', error.message);
    }
}
export async function getStudentProgress(userId: string): Promise<{ lesson_id: string }[]> {
    const { data, error } = await supabase.from('progress').select('lesson_id').eq('student_id', userId);
    if (error) {
        console.error('Error fetching student progress:', error.message);
        return [];
    }
    return data || [];
}
export async function getAllStudentProgress(): Promise<{ user_id: string, lesson_id: string }[]> {
    const { data, error } = await supabase.from('progress').select('student_id, lesson_id');
    if (error) {
        console.error('Error fetching all student progress:', error.message);
        return [];
    }
    return (data || []).map(p => ({ user_id: p.student_id, lesson_id: p.lesson_id }));
}
export async function saveQuizAttempt(userId: string, lessonId: string, score: number, submittedAnswers: QuizAttempt['submittedAnswers'], timeTaken: number) {
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
export const addQuizAttempt = async (attemptData: Omit<QuizAttempt, 'id'>): Promise<void> => { const { userId, lessonId, score, submittedAnswers, timeTaken } = attemptData; await saveQuizAttempt(userId, lessonId, score, submittedAnswers, timeTaken); };
export const getQuizAttemptsByUserId = async (userId: string): Promise<QuizAttempt[]> => {
    return getStudentQuizAttempts(userId);
}
export const getLatestQuizAttemptForLesson = async (userId: string, lessonId: string): Promise<QuizAttempt | undefined> => {
    const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching latest quiz attempt:', error.message);
        return undefined;
    }
    if (!data) return undefined;
    
    return {
        id: data.id,
        userId: data.user_id,
        lessonId: data.lesson_id,
        submittedAt: data.submitted_at,
        score: data.score,
        submittedAnswers: data.submitted_answers,
        timeTaken: data.time_taken,
        isPass: data.is_pass,
    };
};


// =================================================================
// OTHER FUNCTIONS
// =================================================================
export async function markAttendance(userId: string, lessonId: string, durationMinutes: number) {
    console.log(`Marking attendance for ${userId} on lesson ${lessonId} for ${durationMinutes} minutes.`);
    await supabase.from('attendance').insert({ user_id: userId, lesson_id: lessonId, duration_minutes: durationMinutes });
}
export const getSubscriptionsByTeacherId = async (teacherId: string): Promise<Subscription[]> => {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('teacher_id', teacherId);
    if (error) {
        console.error('Error fetching subscriptions by teacher ID:', error.message);
        return [];
    }
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id }));
};
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
export const getPendingSubscriptionRequestCount = async (): Promise<number> => {
    const { count, error } = await supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    if (error) {
        console.error('Error fetching pending subscription request count:', error.message);
        return 0;
    }
    return count || 0;
};
export const addSubscriptionRequest = async (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): Promise<void> => {
    await supabase.from('subscription_requests').insert({ user_id: userId, user_name: userName, plan, payment_from_number: paymentFromNumber, status: 'Pending', subject_name: subjectName, unit_id: unitId });
};
export const updateSubscriptionRequest = async (updatedRequest: SubscriptionRequest): Promise<void> => {
    const { id, ...updates } = updatedRequest;
    await supabase.from('subscription_requests').update({ status: updates.status }).eq('id', id);
};
export const getAllUsers = async (): Promise<User[]> => { 
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error("Error fetching all profiles:", error.message); return []; } 
    return (data || []).map((p: any) => ({ 
        id: p.id, name: p.name, email: '', phone: p.phone, guardianPhone: p.guardian_phone, 
        grade: p.grade_id, track: p.track, role: p.role as Role, teacherId: p.teacher_id,
        device_ids: p.device_ids || [],
        device_limit: p.device_limit ?? 1,
    })); 
};
export const getTeacherById = async (id: string): Promise<Teacher | null> => { const teachers = await getAllTeachers(); return teachers.find(t => t.id === id) || null; };
export const addActivityLog = (action: string, details: string) => console.log(`Activity: ${action} - ${details}`);
export const getChatUsage = (userId: string) => ({ remaining: 50 });
export const incrementChatUsage = (userId: string) => {};
// Platform Settings
const defaultSettings: PlatformSettings = {
    platformName: 'Gstudent',
    heroTitle: 'بوابتك للتفوق الدراسي',
    heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع المواد، لمساعدتك على تحقيق أعلى الدرجات مع نخبة من أفضل المدرسين.',
    heroButtonText: 'ابدأ رحلتك الآن',
    featuresTitle: 'لماذا تختار منصة Gstudent؟',
    featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.',
    features: [],
    footerDescription: '',
    contactPhone: '',
    contactFacebookUrl: '',
    contactYoutubeUrl: '',
    subscriptionPrices: {
        comprehensive: { monthly: 100, quarterly: 249, annual: 799 },
        singleSubject: { monthly: 75, semiAnnually: 400, annually: 700 },
    },
    paymentNumbers: {
        vodafoneCash: '01012345678',
    },
};

let settingsCache: PlatformSettings | null = null;

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
    if (settingsCache) return settingsCache;

    const { data, error } = await supabase.from('platform_settings').select('*').limit(1).single();
    
    if (error || !data) {
        console.warn('Could not fetch platform settings, using default values. Error:', error?.message);
        return defaultSettings;
    }

    const fetchedSettings: Partial<PlatformSettings> = {
        platformName: data.platform_name,
        heroTitle: data.hero_title,
        heroSubtitle: data.hero_subtitle,
        heroButtonText: data.hero_button_text,
        heroImageUrl: data.hero_image_url,
        teacherImageUrl: data.teacher_image_url,
        featuresTitle: data.features_title,
        featuresSubtitle: data.features_subtitle,
        features: data.features,
        footerDescription: data.footer_description,
        contactPhone: data.contact_phone,
        contactFacebookUrl: data.contact_facebook_url,
        contactYoutubeUrl: data.contact_youtube_url,
        subscriptionPrices: data.subscription_prices,
        paymentNumbers: data.payment_numbers,
    };

    const mergedSettings: PlatformSettings = {
        ...defaultSettings,
        ...fetchedSettings,
        subscriptionPrices: {
            ...defaultSettings.subscriptionPrices,
            ...(fetchedSettings.subscriptionPrices || {}),
            comprehensive: { ...defaultSettings.subscriptionPrices.comprehensive, ...(fetchedSettings.subscriptionPrices?.comprehensive || {}) },
            singleSubject: { ...defaultSettings.subscriptionPrices.singleSubject, ...(fetchedSettings.subscriptionPrices?.singleSubject || {}) },
        },
        paymentNumbers: {
            ...defaultSettings.paymentNumbers,
            ...(fetchedSettings.paymentNumbers || {}),
        },
    };

    settingsCache = mergedSettings;
    return mergedSettings;
};

export const updatePlatformSettings = async (newSettings: PlatformSettings): Promise<{ error: any }> => {
    const dbPayload = {
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
        subscription_prices: newSettings.subscriptionPrices,
        payment_numbers: newSettings.paymentNumbers,
    };
    
    const { data, error: fetchError } = await supabase.from('platform_settings').select('id').limit(1).single();

    let error;

    if (data) {
        const { error: updateError } = await supabase.from('platform_settings').update(dbPayload).eq('id', data.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('platform_settings').insert(dbPayload);
        error = insertError;
    }
    
    if (!error) {
        settingsCache = newSettings; 
    }
    return { error };
};


// =================================================================
// COURSE MANAGEMENT (NEW)
// =================================================================
const mapCourseFromDb = (dbCourse: any): Course => ({
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    teacherId: dbCourse.teacher_id,
    coverImage: dbCourse.cover_image_url,
    price: dbCourse.price,
    isFree: dbCourse.is_free,
    pdfUrl: dbCourse.pdf_url,
    videos: dbCourse.videos || [],
});
const mapCourseToDb = (course: Partial<Course>): any => ({
    title: course.title,
    description: course.description,
    teacher_id: course.teacherId,
    cover_image_url: course.coverImage,
    price: course.price,
    is_free: course.isFree,
    pdf_url: course.pdfUrl,
    videos: course.videos,
});

export const getAllCourses = async (): Promise<Course[]> => {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
    return data.map(mapCourseFromDb);
};

export const createCourse = async (courseData: Omit<Course, 'id'>) => {
    const dbPayload = mapCourseToDb(courseData);
    const { data, error } = await supabase.from('courses').insert(dbPayload).select().single();
    return { data: data ? mapCourseFromDb(data) : null, error };
};

export const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    const dbPayload = mapCourseToDb(updates);
    const { data, error } = await supabase.from('courses').update(dbPayload).eq('id', courseId).select().single();
    return { data: data ? mapCourseFromDb(data) : null, error };
};

export const deleteCourse = async (courseId: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    return { error };
};

export const checkCoursePurchase = async (userId: string, courseId: string): Promise<boolean> => {
    const { data, error } = await supabase.from('user_courses').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('course_id', courseId);
    if(error) {
        console.error("Error checking course purchase:", error);
        return false;
    }
    return (data?.count || 0) > 0;
};

export const purchaseCourse = async (userId: string, courseId: string) => {
    const { error } = await supabase.from('user_courses').insert({ user_id: userId, course_id: courseId });
    if(error) console.error("Error purchasing course:", error);
    return { error };
};


export const getFeaturedBooks = () => [];
export async function generateSubscriptionCode(codeData: any): Promise<SubscriptionCode | null> {
    const { data, error } = await supabase.from('subscription_codes').insert(codeData).select().single();
    if (error) {
        console.error('Error generating subscription code:', error.message);
        return null;
    }
    if (!data) return null;
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
export async function getAllCodes(): Promise<SubscriptionCode[]> {
    const { data, error } = await supabase.from('subscription_codes').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching all codes:', error.message);
        return [];
    }
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

    const subResult = await createOrUpdateSubscription(user.id, 'Monthly', 'Active', endDate.toISOString(), codeData.teacher_id);
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
    const redeemResult = await redeemCode(code, userData.grade, userData.track);
    if (!redeemResult.success) {
        return { data: { userId: authData.user.id }, error: `تم إنشاء حسابك ولكن فشل تفعيل الكود: ${redeemResult.error}. يرجى التواصل مع الدعم.` };
    }
    return { data: { userId: authData.user.id }, error: null };
};
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
    if (updates.device_limit !== undefined) payload.device_limit = updates.device_limit;
    if (updates.device_ids !== undefined) payload.device_ids = updates.device_ids;
    if (Object.keys(payload).length === 0) return { error: null };
    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    return { error };
};
export const deleteUser = async (id: string) => { const { error } = await supabase.auth.admin.deleteUser(id); return { error }; };
export const getGradesForSelection = (): {id: number, name: string, level: 'Middle' | 'Secondary'}[] => {
    return defaultGrades.map(g => ({ id: g.id, name: g.name, level: g.level }));
};
export const deleteSelf = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: { message: 'User not authenticated.' } }; const { error } = await supabase.auth.admin.deleteUser(user.id); if (!error) await signOut(); return { error }; };
export const addStudentQuestion = async (userId: string, userName: string, questionText: string): Promise<void> => {
    await supabase.from('student_questions').insert({ user_id: userId, user_name: userName, question_text: questionText, status: 'Pending' });
};
export const getStudentQuestionsByUserId = async (userId: string): Promise<StudentQuestion[]> => {
    const { data, error } = await supabase.from('student_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching questions:', error.message); return []; }
    return (data || []) as StudentQuestion[];
};
export const getAllStudentQuestions = async (): Promise<StudentQuestion[]> => {
    const { data, error } = await supabase.from('student_questions').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching all questions:', error.message); return []; }
    return (data || []) as StudentQuestion[];
};
export const answerStudentQuestion = async (questionId: string, answerText: string): Promise<void> => {
    await supabase.from('student_questions').update({ answer_text: answerText, status: 'Answered' }).eq('id', questionId);
};
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
export const getActivityLogs = (): ActivityLog[] => [];
export const addFeaturedBook = (book: any) => { console.log('Adding featured book', book); };
export const updateFeaturedBook = (book: any) => { console.log('Updating featured book', book); };
export const deleteFeaturedBook = (id: string) => { console.log('Deleting featured book', id); };

export const getFeaturedCourses = (): Course[] => [];
export const addFeaturedCourse = (course: any) => { console.log('Adding featured course', course); };
export const updateFeaturedCourse = (course: any) => { console.log('Updating featured course', course); };
export const deleteFeaturedCourse = (id: string) => { console.log('Deleting featured course', id); };
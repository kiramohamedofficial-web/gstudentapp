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
// 3. USER REGISTRATION & LOGIN (From Guide & Adapted)
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
            // Critical error: The user exists in auth but not in public profiles.
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
 * This is an adapted version that is more robust than the guide's basic example.
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

/**
 * Signs out the current user.
 */
export const signOut = async () => supabase.auth.signOut();

/**
 * Gets the current session.
 */
export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

/**
 * Listens for changes in authentication state.
 */
export const onAuthStateChange = (callback: (session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
};

/**
 * Gets the full profile for a given user ID, joining with grades.
 * Adapted from the guide's `getCurrentUser`.
 */
export const getProfile = async (userId: string): Promise<User | null> => {
    const { data: userData, error } = await supabase
        .from('users')
        .select('*, grades(*)')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error("Error fetching full user profile:", error);
        return null;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();

    return {
        id: userData.id,
        email: authUser?.email || '',
        name: userData.name,
        phone: userData.phone,
        guardianPhone: userData.guardian_phone,
        grade: userData.grade_id,
        track: userData.track,
        role: userData.role as Role,
        teacherId: userData.teacher_id,
    };
};

// =================================================================
// 5. TEACHER MANAGEMENT (From Guide)
// =================================================================

export async function createTeacher(teacherData: any) {
  // 1. Create auth user for the teacher
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: teacherData.email,
    password: teacherData.password,
    options: { data: { name: teacherData.name, role: 'teacher' } }
  });
  if (authError) return { success: false, error: authError };

  // 2. Add teacher data
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .insert({
      name: teacherData.name,
      subject: teacherData.subject,
      teaching_grades: teacherData.teachingGrades,
      teaching_levels: teacherData.teachingLevels,
      image_url: teacherData.imageUrl || null
    }).select().single();
  if (teacherError) return { success: false, error: teacherError };

  // 3. Add teacher role
  await supabase.from('user_roles').insert({ user_id: authData.user!.id, role: 'teacher' });

  // 4. Update users table
  await supabase.from('users').update({ role: 'teacher', teacher_id: teacher.id }).eq('id', authData.user!.id);

  return { success: true, teacher };
}

export async function getAllTeachers() {
  const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching all teachers:', error);
    return [];
  }
  // Map snake_case fields from the database to camelCase fields for the frontend type
  return (data || []).map((teacher: any) => ({
    id: teacher.id,
    name: teacher.name,
    subject: teacher.subject,
    imageUrl: teacher.image_url,
    teachingLevels: teacher.teaching_levels,
    teachingGrades: teacher.teaching_grades,
  }));
}

export async function deleteTeacher(teacherId: string) {
  // This is a simplified version. A full version would also delete the auth user via an edge function.
  const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
  if (error) {
    console.error('Error deleting teacher:', error.message);
    return { success: false, error };
  }
  return { success: true };
}

export async function updateTeacher(teacherId: string, updates: any) {
  const teacherPayload: Record<string, any> = {};
  if (updates.name) teacherPayload.name = updates.name;
  if (updates.subject) teacherPayload.subject = updates.subject;
  if (updates.teachingGrades) teacherPayload.teaching_grades = updates.teachingGrades;
  if (updates.teachingLevels) teacherPayload.teaching_levels = updates.teachingLevels;
  if (updates.imageUrl) teacherPayload.image_url = updates.imageUrl;

  const { data, error: teacherError } = await supabase
    .from('teachers')
    .update(teacherPayload)
    .eq('id', teacherId)
    .select()
    .single();

  if (teacherError) {
    return { success: false, data: null, error: teacherError };
  }
  
  // Also update associated user record
  if (updates.name || updates.phone) {
      const { data: userData, error: userSelectError } = await supabase
        .from('users')
        .select('id')
        .eq('teacher_id', teacherId)
        .single();
      
      if (userData) {
          const userPayload: Record<string, any> = {};
          if (updates.name) userPayload.name = updates.name;
          if (updates.phone) userPayload.phone = `+2${updates.phone}`;
          
          await supabase.from('users').update(userPayload).eq('id', userData.id);
      }
  }

  // Client-side can't update other users' auth details (phone login, password) without admin key.
  // This requires an edge function. We log a warning if a password was attempted.
  if (updates.password) {
      console.warn("Password update for other users is not supported from the client-side and was ignored.");
  }

  return { success: true, data, error: null };
}


// =================================================================
// 6. SUBSCRIPTION CODES (From Guide)
// =================================================================

export async function generateSubscriptionCode(codeData: any) {
    const { data, error } = await supabase
      .from('subscription_codes')
      .insert({
        code: codeData.code,
        duration_days: codeData.durationDays,
        max_uses: codeData.maxUses,
        description: codeData.description,
        teacher_id: codeData.teacherId || null,
        is_active: true
      }).select().single();
  
    if (error) {
      console.error('Error creating code:', error.message);
      return { success: false, error };
    }
    return { success: true, code: data };
}
  
export async function getAllCodes() {
    const { data } = await supabase.from('subscription_codes').select('*').order('created_at', { ascending: false });
    return data;
}

export async function redeemCode(code: string, userGradeId: number, userTrack: string) {
    const { data, error } = await supabase.rpc('redeem_subscription_code', {
      redemption_code: code,
      user_grade_id: userGradeId,
      user_track: userTrack
    });
  
    if (error || !data?.success) {
      const rawError = data?.error || error;
      // Ensure the returned error is always a string to prevent '[object Object]' errors.
      const errorMessage = typeof rawError === 'object' && rawError !== null && 'message' in rawError 
        ? (rawError as any).message 
        : typeof rawError === 'string' 
        ? rawError 
        : 'حدث خطأ عند تفعيل الكود.';
      return { success: false, error: errorMessage };
    }
    return { success: true, message: data.message };
}

export async function registerAndRedeemCode(userData: any, code: string): Promise<{ error: string | null }> {
    // 1. Sign up the user
    const { data: authData, error: authError } = await signUp(userData);
    if (authError || !authData.user) {
        return { error: authError?.message || 'فشل إنشاء الحساب.' };
    }

    // 2. Redeem the code. The user is now logged in automatically by signUp.
    const { success, error: redeemError } = await redeemCode(code, userData.grade, userData.track);

    if (!success) {
        console.error('RPC Error redeeming code after signup:', redeemError);
        return { error: `تم إنشاء حسابك ولكن فشل تفعيل الكود: ${redeemError}. يرجى التواصل مع الدعم.` };
    }
    
    return { error: null };
};

export async function validateSubscriptionCode(code: string): Promise<{ valid: boolean; error?: string }> { 
    const { data, error } = await supabase.from('subscription_codes').select('*').eq('code', code.trim()).single(); 
    if (error || !data) return { valid: false, error: 'الكود غير موجود.' }; 
    if (data.times_used >= data.max_uses) return { valid: false, error: 'هذا الكود تم استخدامه بالكامل.' }; 
    return { valid: true }; 
};

// =================================================================
// 7. SUBSCRIPTION MANAGEMENT (From Guide & Adapted)
// =================================================================

export async function checkUserSubscription(userId: string) {
    const { data } = await supabase.rpc('check_user_subscription', { user_id_input: userId });
    return {
      hasActiveSubscription: data.has_active_subscription,
      endDate: data.subscription_end_date
    };
}
  
export async function getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching user subscriptions:', error);
        return [];
    }
    return (data || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        plan: s.plan,
        startDate: s.start_date,
        endDate: s.end_date,
        status: s.status,
        teacherId: s.teacher_id,
    }));
}

export async function createSubscription(subscriptionData: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: subscriptionData.userId,
        plan: subscriptionData.plan,
        start_date: new Date().toISOString(),
        end_date: subscriptionData.endDate,
        status: 'Active',
        teacher_id: subscriptionData.teacherId
      }).select().single();
    return { success: !error, data, error };
}

export const createOrUpdateSubscription = async (
    userId: string,
    plan: Subscription['plan'],
    status: 'Active' | 'Expired',
    customEndDate?: string,
    teacherId?: string
): Promise<{ error: Error | null }> => {
    const startDate = new Date();
    let endDate: Date;

    if (customEndDate) {
        endDate = new Date(customEndDate);
    } else {
        endDate = new Date(startDate);
        switch (plan) {
            case 'Monthly': endDate.setMonth(startDate.getMonth() + 1); break;
            case 'Quarterly': endDate.setMonth(startDate.getMonth() + 3); break;
            case 'SemiAnnually': endDate.setMonth(startDate.getMonth() + 6); break;
            case 'Annual': endDate.setFullYear(startDate.getFullYear() + 1); break;
            case 'Code': endDate.setMonth(startDate.getMonth() + 1); break; // Default duration for code
        }
    }

    const subscriptionPayload = {
        user_id: userId,
        plan,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status,
        teacher_id: teacherId,
    };

    // 1. Check for an existing subscription matching the criteria
    let query = supabase.from('subscriptions').select('id').eq('user_id', userId);

    if (teacherId) {
        // Teacher-specific subscription: conflict on user_id + teacher_id
        query = query.eq('teacher_id', teacherId);
    } else {
        // Comprehensive subscription: conflict on user_id where teacher_id is NULL
        query = query.is('teacher_id', null);
    }
    
    const { data: existing, error: selectError } = await query.maybeSingle();

    if (selectError) {
        console.error("Error checking for existing subscription:", selectError);
        return { error: new Error(selectError.message) };
    }

    let dbOperation;
    if (existing) {
        // 2a. Update the existing record
        const { user_id, ...payloadForUpdate } = subscriptionPayload;
        dbOperation = supabase.from('subscriptions').update(payloadForUpdate).eq('id', existing.id);
    } else {
        // 2b. Insert a new record
        dbOperation = supabase.from('subscriptions').insert(subscriptionPayload);
    }

    const { error: dbError } = await dbOperation;

    if (dbError) {
        console.error("Error in createOrUpdateSubscription operation:", dbError);
        return { error: new Error(dbError.message) };
    }

    return { error: null };
};

// =================================================================
// 8. GRADES / CURRICULUM (From Guide & Adapted)
// =================================================================

// The app's curriculum logic is complex and relies on a single JSON blob.
// We will replace the direct localStorage access with Supabase calls, but keep the blob structure for now.
let curriculumCache: { grades: Grade[] } | null = null;
let isCurriculumDataLoaded = false;

export async function storeSchoolData(id: string, payload: any) {
    const { data, error } = await supabase.from('school_data').upsert({ id: id, payload: payload }).select().single();
    return { success: !error, data };
}

export async function getSchoolData(id: string) {
    const { data } = await supabase.from('school_data').select('payload').eq('id', id).single();
    return data?.payload;
}

export const initData = async (): Promise<void> => {
    if (isCurriculumDataLoaded) return;
    try {
        const payload = await getSchoolData('main_curriculum');
        // Check if payload or payload.grades is missing/empty
        if (payload && payload.grades && payload.grades.length > 0) {
            curriculumCache = payload;
        } else {
            // Fallback to creating default data if not found in DB
            console.log("No curriculum data found in database. Seeding with default grades.");
            curriculumCache = defaultCurriculumData;
            await storeSchoolData('main_curriculum', curriculumCache);
        }
    } catch (error) {
        console.error("Failed to initialize curriculum data, using fallback:", error);
        curriculumCache = defaultCurriculumData;
    }
    isCurriculumDataLoaded = true;
};

export const getAllGrades = (): Grade[] => curriculumCache?.grades || [];
export const getGradeById = (gradeId: number): Grade | undefined => getAllGrades().find(g => g.id === gradeId);

// The following functions modify the in-memory cache and then persist the entire blob back to Supabase.
// This is not ideal but maintains the app's current logic without a major rewrite.
const persistCurriculum = async () => {
    if (curriculumCache) {
        await storeSchoolData('main_curriculum', curriculumCache);
    }
};

const modifyCurriculum = (modification: (grades: Grade[]) => void) => {
    if (!curriculumCache) return;
    modification(curriculumCache.grades);
    persistCurriculum();
};

export const addUnitToSemester = (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id'|'lessons'>) => modifyCurriculum(grades => {
    const grade = grades.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    semester?.units.push({ ...unitData, id: `u${Date.now()}`, lessons: [] });
});

export const addLessonToUnit = (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>) => modifyCurriculum(grades => {
    const grade = grades.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    const unit = semester?.units.find(u => u.id === unitId);
    if (unit) {
        unit.lessons.push({ ...lessonData, id: `l${Date.now()}` });
    }
});

export const updateLesson = (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson) => modifyCurriculum(grades => {
    const unit = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId)?.units.find(u => u.id === unitId);
    if (unit) {
        const lessonIndex = unit.lessons.findIndex(l => l.id === updatedLesson.id);
        if (lessonIndex > -1) {
            // Smart update: if the base title changes, propagate it to other lessons in the same group.
            const oldLesson = unit.lessons[lessonIndex];
            const oldBaseTitle = oldLesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
            const newBaseTitle = updatedLesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();

            if (oldBaseTitle !== newBaseTitle) {
                unit.lessons.forEach(lesson => {
                    const lessonBaseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
                    if(lessonBaseTitle === oldBaseTitle) {
                         lesson.title = lesson.title.replace(oldBaseTitle, newBaseTitle);
                    }
                });
            }
            // Ensure the primary lesson being edited is updated correctly
            unit.lessons[lessonIndex] = updatedLesson;
        }
    }
});

export const deleteLesson = (gradeId: number, semesterId: string, unitId: string, lessonId: string) => modifyCurriculum(grades => {
    const unit = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId)?.units.find(u => u.id === unitId);
    if (unit) {
        unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
    }
});

export const updateUnit = (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }) => modifyCurriculum(grades => {
    const semester = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId);
    if (semester) {
        const unitIndex = semester.units.findIndex(u => u.id === updatedUnit.id);
        if (unitIndex > -1) {
            semester.units[unitIndex] = { ...semester.units[unitIndex], ...updatedUnit };
        }
    }
});

export const deleteUnit = (gradeId: number, semesterId: string, unitId: string) => modifyCurriculum(grades => {
    const semester = grades.find(g => g.id === gradeId)?.semesters.find(s => s.id === semesterId);
    if (semester) {
        semester.units = semester.units.filter(u => u.id !== unitId);
    }
});

// =================================================================
// OTHER FUNCTIONS (Kept from old service as they are not in the guide)
// =================================================================
export const getSubscriptionsByTeacherId = async (teacherId: string): Promise<Subscription[]> => { 
    const { data, error } = await supabase.from('subscriptions').select('*').eq('teacher_id', teacherId); 
    if (error) { console.error('Error fetching subscriptions by teacher:', error); return []; } 
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id })); 
};

export const getSubscriptionRequests = async (): Promise<SubscriptionRequest[]> => { const { data, error } = await supabase.from('subscription_requests').select('*').order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(r => ({ ...r, userId: r.user_id, userName: r.user_name, paymentFromNumber: r.payment_from_number, createdAt: r.created_at, subjectName: r.subject_name, unitId: r.unit_id }));};
export const getPendingSubscriptionRequestCount = async (): Promise<number> => { const { count, error } = await supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'); if (error) { console.error(error); return 0; } return count || 0;};
export const addSubscriptionRequest = async (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): Promise<void> => { await supabase.from('subscription_requests').insert({ user_id: userId, user_name: userName, plan, payment_from_number: paymentFromNumber, subject_name: subjectName, unit_id: unitId }); };
export const updateSubscriptionRequest = async (updatedRequest: SubscriptionRequest): Promise<void> => { await supabase.from('subscription_requests').update({ status: updatedRequest.status }).eq('id', updatedRequest.id); };

export const getAllUsers = async (): Promise<User[]> => {
    const { data: profiles, error: profileError } = await supabase.from('users').select('*');
    if (profileError) { console.error("Error fetching all user profiles:", profileError); return []; }
    return (profiles || []).map((p: any) => ({ id: p.id, name: p.name, email: '', phone: p.phone, guardianPhone: p.guardian_phone, grade: p.grade_id, track: p.track, role: p.role as Role, teacherId: p.teacher_id, }));
};

export const addQuizAttempt = async (attemptData: Omit<QuizAttempt, 'id'>): Promise<void> => { const { userId, lessonId, ...rest } = attemptData; await supabase.from('quiz_attempts').insert({ user_id: userId, lesson_id: lessonId, ...rest });};
export const getQuizAttemptsByUserId = async (userId: string): Promise<QuizAttempt[]> => { const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('submitted_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(a => ({ ...a, userId: a.user_id, lessonId: a.lesson_id, submittedAt: a.submitted_at, submittedAnswers: a.submitted_answers, timeTaken: a.time_taken, isPass: a.is_pass }));};
export const getLatestQuizAttemptForLesson = async (userId: string, lessonId: string): Promise<QuizAttempt | undefined> => { const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId).eq('lesson_id', lessonId).order('submitted_at', { ascending: false }).limit(1).single(); if(error) return undefined; return data ? { ...data, userId: data.user_id, lessonId: data.lesson_id, submittedAt: data.submitted_at, submittedAnswers: data.submitted_answers, timeTaken: data.time_taken, isPass: data.is_pass } : undefined; };

// LocalStorage functions for non-critical data can remain
const getLocalStore = <T>(key: string): T | null => { const data = localStorage.getItem(key); return data ? JSON.parse(data) as T : null; };
const setLocalStore = <T>(key: string, data: T): void => { localStorage.setItem(key, JSON.stringify(data)); };
const LOCAL_DATA_KEY = 'gstudent-local-data';
interface LocalStorageData { userProgress: Record<string, Record<string, boolean>>; }
const getLocalData = (): LocalStorageData => getLocalStore<LocalStorageData>(LOCAL_DATA_KEY) || { userProgress: {} };
// FIX: The function `setLocalData` was not defined. Changed to `setLocalStore` with the correct key.
const modifyLocalData = (modification: (localData: LocalStorageData) => void) => { const data = getLocalData(); modification(data); setLocalStore(LOCAL_DATA_KEY, data); };
export const getUserProgress = (userId: string): Record<string, boolean> => (getLocalData().userProgress || {})[userId] || {};
export const setLessonCompleted = (userId: string, lessonId: string, completed: boolean): void => modifyLocalData(d => { if (!d.userProgress) d.userProgress = {}; if (!d.userProgress[userId]) d.userProgress[userId] = {}; if (completed) d.userProgress[userId][lessonId] = true; else delete d.userProgress[userId][lessonId]; });

// Dummy functions for unimplemented parts of old service
export const getTeachers = async (): Promise<Teacher[]> => (await getAllTeachers() as Teacher[]) || [];
export const getTeacherById = async (id: string): Promise<Teacher | null> => {
    const teachers = await getTeachers();
    return teachers.find(t => t.id === id) || null;
};
export const addActivityLog = (action: string, details: string) => console.log(`Activity: ${action} - ${details}`);
export const getActivityLogs = () => [];
export const getChatUsage = (userId: string) => ({ remaining: 50 });
export const incrementChatUsage = (userId: string) => {};
export const getPlatformSettings = () => ({ platformName: 'Gstudent', heroTitle: 'بوابتك للتفوق الدراسي', heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع المواد، لمساعدتك على تحقيق أعلى الدرجات مع نخبة من أفضل المدرسين.', heroButtonText: 'ابدأ رحلتك الآن', featuresTitle: 'لماذا تختار منصة Gstudent؟', featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.', features: [], footerDescription: '', contactPhone: '', contactFacebookUrl: '', contactYoutubeUrl: '' });
export const updatePlatformSettings = (settings: any) => {};
export const getFeaturedCourses = () => [];
export const getFeaturedBooks = () => [];
export const generateSubscriptionCodes = async (options: any) => {
    const codes = [];
    for(let i=0; i < options.count; i++) {
        const code = `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await generateSubscriptionCode({ code, ...options });
        codes.push({ code, ...options, id: code });
    }
    return codes;
};
export const addFeaturedCourse = (course: any) => {};
export const updateFeaturedCourse = (course: any) => {};
export const deleteFeaturedCourse = (id: string) => {};
export const addFeaturedBook = (book: any) => {};
export const updateFeaturedBook = (book: any) => {};
export const deleteFeaturedBook = (id: string) => {};
export const updateUser = async (userId: string, updates: Partial<User>) => {
    const payload: Record<string, any> = {};
    if (updates.name) payload.name = updates.name;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.guardianPhone) payload.guardian_phone = updates.guardianPhone;
    if (updates.grade) payload.grade_id = updates.grade;
    if (updates.track !== undefined) payload.track = updates.track;

    if (Object.keys(payload).length === 0) {
        return { error: null }; // No changes to save
    }

    const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId);

    return { error };
};
export const deleteUser = async (id: string) => {
    // This is a simplified version. A full version would also delete the auth user via an edge function.
    const { error } = await supabase.from('users').delete().eq('id', id);
    return { error };
};
export const addTeacher = async (teacher: any) => ({ error: { message: "Use createTeacher" }});
export const getGradesForSelection = async (): Promise<{id: number, name: string, level: 'Middle' | 'Secondary'}[]> => {
    // This ensures that even if called before App.tsx's init, the data is fetched.
    if (!curriculumCache) {
        await initData();
    }
    const grades = getAllGrades();
    return grades.map(({ id, name, level }) => ({ id, name, level }));
};
export const deleteSelf = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: { message: 'User not authenticated.' } };
    }
    // Note: This only deletes from the public 'users' table.
    // The auth.user record remains and must be deleted via an edge function or manually in Supabase dashboard.
    const { error } = await supabase.from('users').delete().eq('id', user.id);
    if (!error) {
        // Also sign the user out if their profile was successfully deleted.
        await signOut();
    }
    return { error };
};
export const addStudentQuestion = async (userId: string, userName: string, questionText: string): Promise<void> => { await supabase.from('student_questions').insert({ user_id: userId, user_name: userName, question_text: questionText }); };
export const getStudentQuestionsByUserId = async (userId: string): Promise<StudentQuestion[]> => { const { data, error } = await supabase.from('student_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(q => ({ ...q, userId: q.user_id, userName: q.user_name, questionText: q.question_text, answerText: q.answer_text, createdAt: q.created_at }));};
export const getAllStudentQuestions = async (): Promise<StudentQuestion[]> => { const { data, error } = await supabase.from('student_questions').select('*').order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(q => ({ ...q, userId: q.user_id, userName: q.user_name, questionText: q.question_text, answerText: q.answer_text, createdAt: q.created_at }));};
export const answerStudentQuestion = async (questionId: string, answerText: string): Promise<void> => { await supabase.from('student_questions').update({ answer_text: answerText, status: 'Answered' }).eq('id', questionId); };
export const getAllSubscriptions = async (): Promise<Subscription[]> => {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) { console.error('Error fetching subscriptions:', error); return []; }
    return (data || []).map(s => ({ id: s.id, userId: s.user_id, plan: s.plan, startDate: s.start_date, endDate: s.end_date, status: s.status, teacherId: s.teacher_id }));
};
export const getSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => {
    const subs = await getSubscriptionsByUserId(userId);
    return subs?.[0] || null;
}
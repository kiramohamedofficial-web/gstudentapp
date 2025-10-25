import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  User,
  Subscription,
  Grade,
  Role,
  LessonType,
  ActivityLog,
  Lesson,
  Unit,
  AccessToken,
  SubscriptionRequest,
  Course,
  Book,
  QuizAttempt,
  PlatformSettings,
  StudentQuestion,
  Teacher,
  SubscriptionCode,
} from '../types';

const DAILY_CHAT_LIMIT = 50;


// =================================================================
// NEW SUPABASE-STYLE ARCHITECTURE
// =================================================================

// --- Supabase Middle School Client ---
const middleSchoolSupabaseUrl = 'https://csipsaucwcuserhfrehn.supabase.co';
const middleSchoolSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXBzYXVjd2N1c2VyaGZyZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQwMTgsImV4cCI6MjA3Njg3MDAxOH0.FJu12ARvbqG0ny0D9d1Jje3BxXQ-q33gjx7JSH26j1w';
const supabaseMiddleSchool = createClient(middleSchoolSupabaseUrl, middleSchoolSupabaseKey);

// --- Supabase Core/Auth Client ---
// In a true multi-project setup, this would have different credentials.
// For now, we point to the same project for both content and authentication.
const supabaseCore = createClient(middleSchoolSupabaseUrl, middleSchoolSupabaseKey);


// --- Data Store Interfaces ---
interface MiddleSchoolData {
    grades: Grade[];
    teachers: Teacher[];
}

interface HighSchoolData {
    grades: Grade[];
    teachers: Teacher[];
}

interface CoreData {
    // Users are now in Supabase Auth, but we keep this structure for other core data.
    users: User[]; // This will now be an empty or deprecated list.
    subscriptions: Subscription[];
    activityLogs: ActivityLog[];
    accessTokens: AccessToken[];
    subscriptionRequests: SubscriptionRequest[];
    quizAttempts: QuizAttempt[];
    studentQuestions: StudentQuestion[];
    subscriptionCodes: SubscriptionCode[];
    userProgress: Record<string, Record<string, boolean>>;
    chatUsage: Record<string, { date: string; count: number }>;
    platformSettings: PlatformSettings;
    featuredCourses: Course[];
    featuredBooks: Book[];
}

// --- LocalStorage Keys ---
const CORE_DATA_KEY = 'gstudent-core-data';
const HIGH_SCHOOL_DATA_KEY = 'gstudent-high-school';
const MIDDLE_SCHOOL_DATA_KEY_CACHE = 'gstudent-middle-school-cache'; // For offline caching

// --- In-memory cache & flags ---
let middleSchoolCache: MiddleSchoolData | null = null;
let isMiddleSchoolDataLoaded = false;

// --- Generic Store Accessors for localStorage ---
const getStore = <T>(key: string): T | null => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) as T : null;
};

const setStore = <T>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save data for key "${key}" to localStorage.`, error);
    }
};

// Async function to persist middle school data
const persistMiddleSchoolData = async (data: MiddleSchoolData) => {
    setStore(MIDDLE_SCHOOL_DATA_KEY_CACHE, data);
    const { error } = await supabaseMiddleSchool
        .from('school_data')
        .upsert({ id: 'middle_school_main', payload: data }, { onConflict: 'id' });
    if (error) console.error('Failed to save middle school data to Supabase:', error);
};

// --- Specific Store Accessors ---
const getCoreData = (): CoreData => getStore<CoreData>(CORE_DATA_KEY) || { users: [], subscriptions: [], activityLogs: [], accessTokens: [], subscriptionRequests: [], quizAttempts: [], studentQuestions: [], subscriptionCodes: [], userProgress: {}, chatUsage: {}, platformSettings: {} as PlatformSettings, featuredCourses: [], featuredBooks: [] };
const setCoreData = (data: CoreData) => setStore(CORE_DATA_KEY, data);

const getHighSchoolData = (): HighSchoolData => getStore<HighSchoolData>(HIGH_SCHOOL_DATA_KEY) || { grades: [], teachers: [] };
const setHighSchoolData = (data: HighSchoolData) => setStore(HIGH_SCHOOL_DATA_KEY, data);

const getMiddleSchoolData = (): MiddleSchoolData => {
    if (!middleSchoolCache) {
        console.warn("Middle school data accessed before it was loaded.");
        return { grades: [], teachers: [] };
    }
    return middleSchoolCache;
};

const setMiddleSchoolData = (data: MiddleSchoolData): void => {
    middleSchoolCache = data;
    persistMiddleSchoolData(data);
};

// --- Helper functions for grade levels ---
const isMiddleSchoolGrade = (gradeId: number) => gradeId >= 7 && gradeId <= 9;

// =================================================================
// NEW AUTHENTICATION SERVICE
// =================================================================

export const signIn = async (identifier: string, password: string) => {
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
        return supabaseCore.auth.signInWithPassword({ email: identifier, password });
    } else {
        // Assume it's a phone number and format it for Supabase (E.164)
        const trimmed = identifier.trim().replace(/\s/g, '');
        let formattedPhone = '';

        // Handle Egyptian numbers: user enters '01xxxxxxxxx'
        if (trimmed.startsWith('0') && trimmed.length === 11) {
            formattedPhone = `+2${trimmed}`; // e.g., user enters 010..., we send +2010...
        } 
        // Handle if user enters with country code but without plus
        else if (trimmed.startsWith('20') && trimmed.length === 12) {
             formattedPhone = `+${trimmed}`; // e.g., user enters 2010..., we send +2010...
        }
        // Handle if user enters full international format
        else if (trimmed.startsWith('+20') && trimmed.length === 13) {
            formattedPhone = trimmed;
        } 
        else {
             return { data: null, error: { message: 'رقم الهاتف المدخل غير صالح. يجب أن يكون 11 رقمًا مصريًا.' } };
        }
        
        return supabaseCore.auth.signInWithPassword({ phone: formattedPhone, password });
    }
};

export const signUp = async (userData: Omit<User, 'id' | 'role' | 'subscriptionId' | 'email'> & { email: string, password?: string }) => {
    const { email, password, name, phone, guardianPhone, grade, track } = userData;
    
    if(!password) {
        return { data: null, error: { message: "Password is required for sign up." } };
    };

    const { data, error } = await supabaseCore.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                phone: phone,
                guardian_phone: guardianPhone,
                grade_id: grade,
                track: track,
                role: 'student'
            }
        }
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            return { data: null, error: { message: 'هذا البريد الإلكتروني مسجل بالفعل.' } };
        }
        if (error.message.includes('Password should be at least')) {
            return { data: null, error: { message: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' } };
        }
        return { data, error };
    }

    // If signup is successful, create a corresponding profile in the public 'users' table.
    if (data.user) {
        const { error: profileError } = await supabaseCore
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
            // This is a critical error. The user exists in auth but not in public profiles.
            return { 
                data: null, 
                error: { message: `تم إنشاء حساب المصادقة ولكن فشل إنشاء الملف الشخصي. يرجى التواصل مع الدعم الفني. الخطأ: ${profileError.message}` } 
            };
        }
    }

    return { data, error };
};


export const signOut = async () => {
    return supabaseCore.auth.signOut();
};

export const getSession = async () => {
    const { data: { session } } = await supabaseCore.auth.getSession();
    return session;
};

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
    return supabaseCore.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
};

export const getProfile = async (userId: string): Promise<Omit<User, 'email'> | null> => {
    const { data, error } = await supabaseCore
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected, 0 rows returned"
        console.error("Error fetching user profile:", JSON.stringify(error, null, 2));
        return null;
    }
    if (!data) return null;

    // Map Supabase user profile to the app's User type
    return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        guardianPhone: data.guardian_phone,
        grade: data.grade_id,
        track: data.track,
        role: data.role as Role,
    };
};


// =================================================================
// DATA INITIALIZATION
// =================================================================
const seedMiddleSchoolData = (): MiddleSchoolData => {
    const initialMiddleSchoolTeachers: Teacher[] = [{ id: 't_eng_01', name: 'أستاذ اللغة الإنجليزية', subject: 'اللغة الإنجليزية', imageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png', teachingLevels: ['Middle'], teachingGrades: [7, 8, 9] }];
    const createPlaceholderLessons = (): Lesson[] => ([]);
    const createSubjects = (subjects: {title: string, teacherId: string, track?: Unit['track']}[], gradeId: number, semesterId: string): Unit[] => subjects.map((subject, i) => ({ id: `unit_${gradeId}_${semesterId}_${i}`, title: subject.title, teacherId: subject.teacherId, track: subject.track || 'All', lessons: createPlaceholderLessons() }));
    const middle_school_subjects = [{ title: 'اللغة الإنجليزية', teacherId: 't_eng_01' }];
    const initialMiddleGrades: Grade[] = [
        { id: 7, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 'sem1_7', title: 'الفصل الدراسي الأول', units: [{ id: 'unit_7_1_eng_0', title: 'اللغة الإنجليزية', teacherId: 't_eng_01', track: 'All', lessons: [{ id: 'l_1720000000000', title: 'شرح الدرس الأول', type: LessonType.EXPLANATION, content: 'D2EAR6gcGcQ' }] }] }, { id: 'sem2_7', title: 'الفصل الدراسي الثاني', units: createSubjects(middle_school_subjects, 7, '2') }] },
        { id: 8, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 'sem1_8', title: 'الفصل الدراسي الأول', units: createSubjects(middle_school_subjects, 8, '1') }, { id: 'sem2_8', title: 'الفصل الدراسي الثاني', units: createSubjects(middle_school_subjects, 8, '2') }] },
        { id: 9, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي', semesters: [{ id: 'sem1_9', title: 'الفصل الدراسي الأول', units: createSubjects(middle_school_subjects, 9, '1') }, { id: 'sem2_9', title: 'الفصل الدراسي الثاني', units: createSubjects(middle_school_subjects, 9, '2') }] },
    ];
    return { grades: initialMiddleGrades, teachers: initialMiddleSchoolTeachers };
};

export const initData = async (): Promise<void> => {
  if (!isMiddleSchoolDataLoaded) {
    try {
        const { data, error } = await supabaseMiddleSchool.from('school_data').select('payload').eq('id', 'middle_school_main').single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data?.payload) {
            middleSchoolCache = data.payload as MiddleSchoolData;
            setStore(MIDDLE_SCHOOL_DATA_KEY_CACHE, middleSchoolCache);
        } else {
            const initialData = seedMiddleSchoolData();
            middleSchoolCache = initialData;
            await persistMiddleSchoolData(initialData);
        }
    } catch (error) {
        console.warn("Supabase unreachable for Middle School data, using cache or fallback.", error);
        middleSchoolCache = getStore<MiddleSchoolData>(MIDDLE_SCHOOL_DATA_KEY_CACHE) || seedMiddleSchoolData();
        setStore(MIDDLE_SCHOOL_DATA_KEY_CACHE, middleSchoolCache);
    }
    isMiddleSchoolDataLoaded = true;
  }
  
  if (getStore(CORE_DATA_KEY)) return;

  console.log("Initializing non-user Core and High School data in localStorage...");
  
  const initialHighSchoolTeachers: Teacher[] = [{ id: 't_math_01', name: 'أستاذ الرياضيات', subject: 'الرياضيات', imageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png', teachingLevels: ['Secondary'], teachingGrades: [10, 11, 12] }];
  const createPlaceholderLessons = (): Lesson[] => ([]);
  const createSubjects = (subjects: {title: string, teacherId: string, track?: Unit['track']}[], gradeId: number, semesterId: string): Unit[] => subjects.map((subject, i) => ({ id: `unit_${gradeId}_${semesterId}_${i}`, title: subject.title, teacherId: subject.teacherId, track: subject.track || 'All', lessons: createPlaceholderLessons() }));
  const sec_subjects = [{ title: 'الرياضيات', teacherId: 't_math_01' }];
  const initialHighSchoolGrades: Grade[] = [
    { id: 10, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 'sem1_10', title: 'الفصل الدراسي الأول', units: createSubjects(sec_subjects, 10, '1') }, { id: 'sem2_10', title: 'الفصل الدراسي الثاني', units: createSubjects(sec_subjects, 10, '2') }] },
    { id: 11, name: 'الصف الثاني الثانوي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 'sem1_11', title: 'الفصل الدراسي الأول', units: createSubjects(sec_subjects, 11, '1') }, { id: 'sem2_11', title: 'الفصل الدراسي الثاني', units: createSubjects(sec_subjects, 11, '2') }] },
    { id: 12, name: 'الصف الثالث الثانوي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي', semesters: [{ id: 'sem1_12', title: 'الفصل الدراسي الأول', units: createSubjects(sec_subjects, 12, '1') }, { id: 'sem2_12', title: 'الفصل الدراسي الثاني', units: createSubjects(sec_subjects, 12, '2') }] },
  ];
  const defaultPlatformSettings: PlatformSettings = { platformName: 'Gstudent', heroTitle: 'بوابتك للتفوق الدراسي', heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع المواد، لمساعدتك على تحقيق أعلى الدرجات مع نخبة من أفضل المدرسين.', heroButtonText: 'ابدأ رحلتك الآن', heroImageUrl: 'https://b.top4top.io/p_3568ksa1i0.jpg', teacherImageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png', featuresTitle: 'لماذا تختار منصة Gstudent؟', featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.', features: [{ title: "شرح تفصيلي ومبسط", description: "فيديوهات عالية الجودة تشرح كل جزء من المنهج بأسلوب سهل وممتع." }, { title: "واجبات وامتحانات دورية", description: "اختبر فهمك وتابع مستواك من خلال واجبات وامتحانات إلكترونية." }, { title: "نخبة من أفضل المدرسين", description: "تعلم على أيدي خبراء في كل مادة لضمان فهم عميق وتفوق مضمون." }, { title: "متابعة مستمرة وذكية", description: "نظام متكامل لمتابعة تقدمك الدراسي وتحديد نقاط القوة والضعف." }], footerDescription: 'منصة Gstudent التعليمية تهدف إلى تقديم أفضل المحتويات التعليمية لطلاب المرحلتين الإعدادية والثانوية.', contactPhone: '+20 123 456 7890', contactFacebookUrl: '#', contactYoutubeUrl: '#' };

  setHighSchoolData({ grades: initialHighSchoolGrades, teachers: initialHighSchoolTeachers });
  setCoreData({ users: [], subscriptions: [], activityLogs: [], accessTokens: [], subscriptionRequests: [], quizAttempts: [], studentQuestions: [], subscriptionCodes: [], userProgress: {}, chatUsage: {}, platformSettings: defaultPlatformSettings, featuredCourses: [], featuredBooks: [] });
};

// =================================================================
// REFACTORED DATA ACCESS FUNCTIONS
// =================================================================

// --- Teacher Functions ---
export const getTeachers = async (): Promise<Teacher[]> => {
    const { data, error } = await supabaseCore.from('teachers').select('*');
    if (error) {
        console.error("Error fetching teachers:", error);
        return [];
    }
    return (data || []).map(t => ({...t, imageUrl: t.image_url, teachingLevels: t.teaching_levels, teachingGrades: t.teaching_grades}));
};

export const getTeacherById = (id: string): Teacher | undefined => {
    // This function is now problematic as data is async.
    // For now, it will return undefined, and components using it should be updated.
    console.warn("getTeacherById is synchronous and data is now fetched asynchronously. This may not work as expected.");
    return undefined;
};
// The add/update/delete teacher functions need to be refactored to handle Supabase Auth for the teacher user account.
// This is a larger change and will be deferred for now to focus on student auth. The existing logic will fail for creating users.

// --- User & Auth Functions (Core Data) ---
// DEPRECATED: This function is replaced by Supabase Auth. Kept for reference or parts of the app that might still call it.
export const getUserByCredentials = (identifier: string, password: string): User | undefined => {
  console.warn("DEPRECATED: getUserByCredentials is called. Should use signIn instead.");
  return undefined;
};

// DEPRECATED: This is now handled by signUp.
export const addUser = (userData: Omit<User, 'id' | 'role' | 'subscriptionId'>): { user: User | null; error: string | null } => {
    console.warn("DEPRECATED: addUser is called. Should use signUp instead.");
    return { user: null, error: "Registration is handled by the new auth system." };
};

// --- Grade/Curriculum Functions (Partitioned Data) ---
export const getAllGrades = (): Grade[] => [...getMiddleSchoolData().grades, ...getHighSchoolData().grades];
export const getGradeById = (gradeId: number): Grade | undefined => getAllGrades().find(g => g.id === gradeId);


// =================================================================
// LEGACY & OTHER FUNCTIONS (TO BE REFACTORED OR VERIFIED)
// =================================================================
// The functions below this line operate on localStorage (CoreData) or partitioned data.
// They should be reviewed to ensure they work with the new Supabase Auth user IDs.
// For now, they are assumed to work as long as a valid `User` object is passed to them.

// --- Subscription Functions ---
export const getAllSubscriptions = (): Subscription[] => getCoreData().subscriptions || [];
export const getSubscriptionByUserId = (userId: string): Subscription | undefined => getAllSubscriptions().find(s => s.userId === userId);
export const getSubscriptionsByTeacherId = (teacherId: string): Subscription[] => getAllSubscriptions().filter(s => s.teacherId === teacherId);

// --- Content Modification Functions ---
const modifyCurriculum = (gradeId: number, semesterId: string, unitId: string, modification: (unit: Unit) => void) => {
    const isMiddle = isMiddleSchoolGrade(gradeId);
    const data = isMiddle ? getMiddleSchoolData() : getHighSchoolData();
    const grade = data.grades.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    const unit = semester?.units.find(u => u.id === unitId);
    if (unit) {
        modification(unit);
        if (isMiddle) setMiddleSchoolData(data); else setHighSchoolData(data);
    }
};

export const addLessonToUnit = (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>): void => {
    modifyCurriculum(gradeId, semesterId, unitId, (unit) => {
        unit.lessons.push({ ...lessonData, id: `l${Date.now()}` });
    });
};
export const updateLesson = (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson): void => {
    modifyCurriculum(gradeId, semesterId, unitId, (unit) => {
        const index = unit.lessons.findIndex(l => l.id === updatedLesson.id);
        if (index !== -1) unit.lessons[index] = updatedLesson;
    });
};
export const deleteLesson = (gradeId: number, semesterId: string, unitId: string, lessonId: string): void => {
    modifyCurriculum(gradeId, semesterId, unitId, (unit) => {
        unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
    });
};
export const addUnitToSemester = (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id' | 'lessons'>): void => {
    const isMiddle = isMiddleSchoolGrade(gradeId);
    const data = isMiddle ? getMiddleSchoolData() : getHighSchoolData();
    const grade = data.grades.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    if (semester) {
        semester.units.push({ ...unitData, id: `u${Date.now()}`, lessons: [] });
        if (isMiddle) setMiddleSchoolData(data); else setHighSchoolData(data);
    }
};
export const updateUnit = (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }): void => {
     const isMiddle = isMiddleSchoolGrade(gradeId);
    const data = isMiddle ? getMiddleSchoolData() : getHighSchoolData();
    const grade = data.grades.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    const unitIndex = semester?.units.findIndex(u => u.id === updatedUnit.id);
    if (semester && unitIndex !== -1) {
        semester.units[unitIndex] = { ...semester.units[unitIndex], ...updatedUnit };
        if (isMiddle) setMiddleSchoolData(data); else setHighSchoolData(data);
    }
};
export const deleteUnit = (gradeId: number, semesterId: string, unitId: string): void => {
     const isMiddle = isMiddleSchoolGrade(gradeId);
    const data = isMiddle ? getMiddleSchoolData() : getHighSchoolData();
    const grade = data.grades.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    if (semester) {
        semester.units = semester.units.filter(u => u.id !== unitId);
        if (isMiddle) setMiddleSchoolData(data); else setHighSchoolData(data);
    }
};

// --- Functions operating on Core Data ---
const modifyCoreData = (modification: (coreData: CoreData) => void) => {
    const coreData = getCoreData();
    modification(coreData);
    setCoreData(coreData);
};

export const addActivityLog = (action: string, details: string): void => {
    modifyCoreData(coreData => {
        const newLog: ActivityLog = { id: Date.now().toString(), timestamp: new Date().toISOString(), action, details };
        coreData.activityLogs = [newLog, ...(coreData.activityLogs || [])];
    });
};
export const getActivityLogs = (): ActivityLog[] => getCoreData().activityLogs || [];
export const getUserProgress = (userId: string): Record<string, boolean> => (getCoreData().userProgress || {})[userId] || {};
export const setLessonCompleted = (userId: string, lessonId: string, completed: boolean): void => {
    modifyCoreData(coreData => {
        if (!coreData.userProgress) coreData.userProgress = {};
        if (!coreData.userProgress[userId]) coreData.userProgress[userId] = {};
        if (completed) coreData.userProgress[userId][lessonId] = true;
        else delete coreData.userProgress[userId][lessonId];
    });
};
export const addStudentQuestion = (userId: string, userName: string, questionText: string): void => {
    modifyCoreData(coreData => {
        const newQuestion: StudentQuestion = { id: `q_${Date.now()}`, userId, userName, questionText, status: 'Pending', createdAt: new Date().toISOString() };
        coreData.studentQuestions = [newQuestion, ...(coreData.studentQuestions || [])];
    });
};
export const getStudentQuestionsByUserId = (userId: string): StudentQuestion[] => (getCoreData().studentQuestions || []).filter(q => q.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const getAllStudentQuestions = (): StudentQuestion[] => (getCoreData().studentQuestions || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const answerStudentQuestion = (questionId: string, answerText: string): void => {
    modifyCoreData(coreData => {
        const index = (coreData.studentQuestions || []).findIndex(q => q.id === questionId);
        if (index !== -1) {
            coreData.studentQuestions[index].answerText = answerText;
            coreData.studentQuestions[index].status = 'Answered';
        }
    });
};
export const getSubscriptionRequests = (): SubscriptionRequest[] => (getCoreData().subscriptionRequests || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const getPendingSubscriptionRequestCount = (): number => getSubscriptionRequests().filter(r => r.status === 'Pending').length;
export const addSubscriptionRequest = (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): void => {
    const newRequest: SubscriptionRequest = { id: `req-${Date.now()}`, userId, userName, plan, paymentFromNumber, status: 'Pending', createdAt: new Date().toISOString(), subjectName, unitId };
    modifyCoreData(coreData => {
        coreData.subscriptionRequests = [newRequest, ...(coreData.subscriptionRequests || [])];
    });
};
export const updateSubscriptionRequest = (updatedRequest: SubscriptionRequest): void => {
    modifyCoreData(coreData => {
        const index = (coreData.subscriptionRequests || []).findIndex(r => r.id === updatedRequest.id);
        if (index !== -1) coreData.subscriptionRequests[index] = updatedRequest;
    });
};
export const createOrUpdateSubscription = (userId: string, plan: Subscription['plan'], status: 'Active' | 'Expired', customEndDate?: string, teacherId?: string): void => {
    modifyCoreData(coreData => {
        const allSubscriptions = coreData.subscriptions || [];
        const existingSubIndex = allSubscriptions.findIndex(s => s.userId === userId);
        const startDate = new Date();
        let endDate: Date;
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
        const newOrUpdatedSubscription: Subscription = { id: existingSubIndex !== -1 ? allSubscriptions[existingSubIndex].id : `sub-${userId}-${Date.now()}`, userId, plan, startDate: startDate.toISOString(), endDate: endDate.toISOString(), status, teacherId };
        if (existingSubIndex !== -1) allSubscriptions[existingSubIndex] = newOrUpdatedSubscription;
        else allSubscriptions.push(newOrUpdatedSubscription);
        coreData.subscriptions = allSubscriptions;
    });
};
export const getSubscriptionCodes = (): SubscriptionCode[] => getCoreData().subscriptionCodes || [];
export const generateSubscriptionCodes = (options: { teacherId: string; durationDays: number; count: number; maxUses: number; }): SubscriptionCode[] => {
    const newCodes: SubscriptionCode[] = [];
    for (let i = 0; i < options.count; i++) {
        newCodes.push({ code: `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`, teacherId: options.teacherId, durationDays: options.durationDays, maxUses: options.maxUses, timesUsed: 0, usedByUserIds: [], createdAt: new Date().toISOString() });
    }
    modifyCoreData(coreData => {
        coreData.subscriptionCodes = [...(coreData.subscriptionCodes || []), ...newCodes];
    });
    return newCodes;
};
export const validateSubscriptionCode = (code: string): { valid: boolean; error?: string } => {
    const foundCode = getSubscriptionCodes().find(c => c.code === code.trim());
    if (!foundCode) return { valid: false, error: 'الكود غير موجود.' };
    if (foundCode.timesUsed >= foundCode.maxUses) return { valid: false, error: 'هذا الكود تم استخدامه بالكامل.' };
    return { valid: true };
};

export const registerAndRedeemCode = async (userData: any, code: string): Promise<{ user: User | null; error: string | null }> => {
    const coreData = getCoreData();
    const codeIndex = (coreData.subscriptionCodes || []).findIndex(c => c.code === code.trim());
    if (codeIndex === -1) return { user: null, error: 'الكود الذي أدخلته غير صالح.' };
    
    const targetCode = coreData.subscriptionCodes[codeIndex];
    if (targetCode.timesUsed >= targetCode.maxUses) return { user: null, error: 'هذا الكود تم استخدامه بالكامل.' };

    const { data: authData, error: authError } = await signUp(userData);
    if (authError || !authData.user) {
        return { user: null, error: authError?.message || 'فشل إنشاء الحساب.' };
    }
    
    const newUser = authData.user;

    modifyCoreData(currentCoreData => {
        const freshCodeIndex = (currentCoreData.subscriptionCodes || []).findIndex(c => c.code === targetCode.code);
        if (freshCodeIndex !== -1) {
            currentCoreData.subscriptionCodes[freshCodeIndex].timesUsed++;
            currentCoreData.subscriptionCodes[freshCodeIndex].usedByUserIds.push(newUser.id);
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + targetCode.durationDays);
        const newSubscription: Subscription = { id: `sub-${newUser.id}-${Date.now()}`, userId: newUser.id, plan: 'Monthly', startDate: startDate.toISOString(), endDate: endDate.toISOString(), status: 'Active', teacherId: targetCode.teacherId };
        currentCoreData.subscriptions = [...(currentCoreData.subscriptions || []), newSubscription];
    });

    const profile = await getProfile(newUser.id);
    if (!profile) return { user: null, error: "فشل استرداد الملف الشخصي بعد التسجيل." };
    
    return { user: { ...profile, email: newUser.email! }, error: null };
};

export const getPlatformSettings = (): PlatformSettings => getCoreData().platformSettings;
export const updatePlatformSettings = (settings: PlatformSettings): void => modifyCoreData(coreData => { coreData.platformSettings = settings; });
export const addQuizAttempt = (attemptData: Omit<QuizAttempt, 'id'>): void => {
    modifyCoreData(coreData => {
        const newAttempt: QuizAttempt = { ...attemptData, id: `attempt_${Date.now()}` };
        coreData.quizAttempts = [...(coreData.quizAttempts || []), newAttempt];
    });
};
export const getQuizAttemptsByUserId = (userId: string): QuizAttempt[] => (getCoreData().quizAttempts || []).filter(a => a.userId === userId).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
export const getLatestQuizAttemptForLesson = (userId: string, lessonId: string): QuizAttempt | undefined => getQuizAttemptsByUserId(userId).find(a => a.lessonId === lessonId);
export const getChatUsage = (userId: string): { remaining: number } => {
    const allUsage = getCoreData().chatUsage || {};
    const today = new Date().toISOString().split('T')[0];
    const userUsage = allUsage[userId];
    if (userUsage && userUsage.date === today) return { remaining: Math.max(0, DAILY_CHAT_LIMIT - userUsage.count) };
    return { remaining: DAILY_CHAT_LIMIT };
};
export const incrementChatUsage = (userId: string): void => {
    modifyCoreData(coreData => {
        if (!coreData.chatUsage) coreData.chatUsage = {};
        const today = new Date().toISOString().split('T')[0];
        const userUsage = coreData.chatUsage[userId];
        if (userUsage && userUsage.date === today) userUsage.count += 1;
        else coreData.chatUsage[userId] = { date: today, count: 1 };
    });
};

// Functions to be refactored
export const getAllUsers = async (): Promise<User[]> => {
    const { data: profiles, error: profileError } = await supabaseCore
        .from('users')
        .select('*');

    if (profileError) {
        console.error("Error fetching all user profiles:", profileError);
        return [];
    }
    
    // NOTE: Listing auth users to get emails requires admin privileges and is not
    // possible from the client-side with an anonymous key. 
    // We will return user profiles without email addresses.
    // The email property will be an empty string.

    return (profiles || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: '', // Email is not available from the public 'users' table.
        phone: p.phone,
        guardianPhone: p.guardian_phone,
        grade: p.grade_id,
        track: p.track,
        role: p.role as Role,
        teacherId: p.teacher_id,
    }));
};
export const updateUser = async (updatedUser: Partial<User> & { id: string }) => {
    const { id, name, phone, guardianPhone, grade, track } = updatedUser;

    const profileUpdate: { [key: string]: any } = {};
    if (name !== undefined) profileUpdate.name = name;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (guardianPhone !== undefined) profileUpdate.guardian_phone = guardianPhone;
    if (grade !== undefined) profileUpdate.grade_id = grade;
    if (track !== undefined) profileUpdate.track = track;
    
    if (Object.keys(profileUpdate).length === 0) {
        const error = new Error("No data to update.");
        return { data: null, error: { ...error, message: error.message } };
    }

    const { data, error } = await supabaseCore
        .from('users')
        .update(profileUpdate)
        .eq('id', id);

    if (error) {
        console.error("Error updating user profile:", JSON.stringify(error, null, 2));
    }
    
    return { data, error };
};
export const deleteUser = async (userId: string) => {
    // This is incomplete. Deleting from auth.users requires admin privileges not available with the anon key.
    // A database function is the proper way to handle this. For now, we only delete the public profile.
    const { data, error } = await supabaseCore
        .from('users')
        .delete()
        .eq('id', userId);
    
    if (error) {
        console.error("Error deleting user profile:", JSON.stringify(error, null, 2));
    }
    return { data, error };
};
export const addTeacher = async (teacherData: any): Promise<{ data: any, error: any }> => {
    const { name, subject, imageUrl, teachingLevels, teachingGrades, phone, password } = teacherData;
    const email = `${phone}@gstudent.app`;
    
    // 1. Get and save the current admin session to prevent auth side-effects from signUp
    const { data: { session: adminSession } } = await supabaseCore.auth.getSession();
    if (!adminSession) {
        return { data: null, error: { message: 'Admin session not found. Please log in again.' } };
    }
    
    // 2. Create the new teacher auth user. This may change the active session.
    const { data: authData, error: authError } = await supabaseCore.auth.signUp({ email, password: password!, options: { data: { name, phone: `+2${phone}`, role: 'teacher' } } });
    if (authError) {
        console.error('Error creating teacher auth account:', authError);
        // Restore session even on failure, just in case.
        await supabaseCore.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
        return { data: null, error: { message: `فشل إنشاء حساب المصادقة: ${authError.message}` } };
    }
    if (!authData.user) {
        // Restore session even on failure, just in case.
        await supabaseCore.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
        return { data: null, error: { message: 'فشل إنشاء حساب المصادغة، لم يتم إرجاع المستخدم.' } };
    }
    const userId = authData.user.id;

    // 3. IMPORTANT: Restore the admin session to perform privileged operations
    const { error: sessionError } = await supabaseCore.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
     if (sessionError) {
        console.error('Failed to restore admin session:', sessionError);
        // Attempt to clean up the created auth user might be needed here, but it's complex.
        return { data: null, error: { message: `فشل استعادة جلسة المدير. لا يمكن إكمال إنشاء المدرس.` } };
    }

    // 4. With admin session restored, create the teacher profile.
    const { data: teacherProfile, error: teacherProfileError } = await supabaseCore.from('teachers').insert({ name, subject, image_url: imageUrl, teaching_levels: teachingLevels, teaching_grades: teachingGrades, }).select().single();
    if (teacherProfileError) {
        console.error('Error creating teacher profile:', teacherProfileError);
        return { data: null, error: { message: `فشل إنشاء ملف المدرس: ${teacherProfileError.message}` } };
    }

    // 5. Create the public user profile for the teacher.
    const { error: publicProfileError } = await supabaseCore.from('users').insert({ id: userId, name, phone: `+2${phone}`, role: 'teacher', teacher_id: teacherProfile.id });
    if (publicProfileError) {
        console.error('Error creating public user profile for teacher:', publicProfileError);
        // If this fails, we should ideally delete the teacher profile and auth user we just created.
        // This is complex transaction logic not easily done on the client.
        return { data: null, error: { message: `فشل ربط حساب المدرس: ${publicProfileError.message}` } };
    }

    return { data: teacherProfile, error: null };
};

export const updateTeacher = async (updatedTeacherData: any): Promise<{ data: any, error: any }> => {
    const { id, name, subject, imageUrl, teachingLevels, teachingGrades, phone } = updatedTeacherData;
    const { data: teacherProfile, error: teacherProfileError } = await supabaseCore.from('teachers').update({ name, subject, image_url: imageUrl, teaching_levels: teachingLevels, teaching_grades: teachingGrades, }).eq('id', id).select().single();
    if (teacherProfileError) return { data: null, error: teacherProfileError };
    
    const { data: users, error: findUserError } = await supabaseCore.from('users').select('id').eq('teacher_id', id);
    if (findUserError || !users || users.length === 0) {
        console.warn(`Could not find user associated with teacher id ${id} to update.`);
    } else {
        const { error: userUpdateError } = await supabaseCore.from('users').update({ name: name, phone: `+2${phone}`}).eq('id', users[0].id);
        if (userUpdateError) console.error("Error updating user profile for teacher:", userUpdateError);
    }
    return { data: teacherProfile, error: null };
};

export const deleteTeacher = async (teacherId: string): Promise<{ error: any }> => {
    const { data: users, error: findUserError } = await supabaseCore.from('users').select('id').eq('teacher_id', teacherId);
    if (findUserError) return { error: findUserError };
    
    const userId = users && users.length > 0 ? users[0].id : null;

    const { error: teacherDeleteError } = await supabaseCore.from('teachers').delete().eq('id', teacherId);
    if (teacherDeleteError) return { error: teacherDeleteError };

    if (userId) {
        const { error: userDeleteError } = await supabaseCore.from('users').delete().eq('id', userId);
        if (userDeleteError) console.error("Error deleting user profile for teacher:", userDeleteError);
        console.warn(`Auth user with id ${userId} was not deleted. This must be done manually or with admin privileges.`);
    }
    return { error: null };
};
export const addFeaturedCourse = (course: Omit<Course, 'id'>): void => modifyCoreData(c => c.featuredCourses.push({ ...course, id: `c_${Date.now()}` }));
export const updateFeaturedCourse = (updatedCourse: Course): void => modifyCoreData(c => { const i = c.featuredCourses.findIndex(x => x.id === updatedCourse.id); if (i > -1) c.featuredCourses[i] = updatedCourse; });
export const deleteFeaturedCourse = (courseId: string): void => modifyCoreData(c => { c.featuredCourses = c.featuredCourses.filter(x => x.id !== courseId); });
export const getFeaturedCourses = (): Course[] => getCoreData().featuredCourses || [];
export const addFeaturedBook = (book: Omit<Book, 'id'>): void => modifyCoreData(c => c.featuredBooks.push({ ...book, id: `b_${Date.now()}` }));
export const updateFeaturedBook = (updatedBook: Book): void => modifyCoreData(c => { const i = c.featuredBooks.findIndex(x => x.id === updatedBook.id); if (i > -1) c.featuredBooks[i] = updatedBook; });
export const deleteFeaturedBook = (bookId: string): void => modifyCoreData(c => { c.featuredBooks = c.featuredBooks.filter(x => x.id !== bookId); });
export const getFeaturedBooks = (): Book[] => getCoreData().featuredBooks || [];
export const generateAccessToken = (gradeId: number, semesterId: string, unitId: string, lessonId: string): string => { return "" };

// Fetches a flat list of grades for UI selection, directly from the database.
// This is to be used in contexts like registration where the full curriculum data is not needed,
// avoiding potential race conditions with the app's caching mechanism.
export const getGradesForSelection = async (): Promise<Pick<Grade, 'id' | 'name' | 'level'>[]> => {
    const { data, error } = await supabaseCore
        .from('grades')
        .select('id, name, level')
        .order('id');
    
    if (error) {
        console.error('Error fetching grades for selection:', error);
        return [];
    }
    // The `level` in the database should match 'Middle' or 'Secondary'
    return data as Pick<Grade, 'id' | 'name' | 'level'>[];
};
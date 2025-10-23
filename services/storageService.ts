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
import { DEMO_ADMIN_IDENTIFIER, DEMO_ADMIN_PASSWORD, DEMO_STUDENT_IDENTIFIER, DEMO_STUDENT_PASSWORD } from '../constants';

const DAILY_CHAT_LIMIT = 50;

// --- New Data Stores ---
const teachers: Teacher[] = [];

// --- Curriculum Data Generation ---

const createPlaceholderLessons = (): Lesson[] => ([]);

const createSubjects = (subjects: {title: string, teacherId: string, track?: Unit['track']}[], gradeId: number, semesterId: string): Unit[] => subjects.map((subject, i) => ({
  id: `unit_${gradeId}_${semesterId}_${i}`,
  title: subject.title,
  teacherId: subject.teacherId,
  track: subject.track || 'All',
  lessons: createPlaceholderLessons()
}));

// --- Subject Lists ---
const middle_school_subjects: { title: string; teacherId: string; track?: Unit['track'] }[] = [];

const sec_1_subjects: { title: string; teacherId: string; track?: Unit['track'] }[] = [];

const sec_2_subjects: { title: string; teacherId: string; track?: Unit['track'] }[] = [];

const sec_3_subjects: { title: string; teacherId: string; track?: Unit['track'] }[] = [];


// Mock Data
const users: User[] = [
  { id: '4', name: 'مدير المنصة', email: DEMO_ADMIN_IDENTIFIER, phone: '+201200000001', password: DEMO_ADMIN_PASSWORD, guardianPhone: '', grade: 0, role: Role.ADMIN },
  { id: '5', name: 'مالك المنصة', email: 'jytt0jewellery@gmail.com', phone: '+201200000002', password: 'Hshsh555&HehgeUDNYf744&&$$@Jg28848', guardianPhone: '', grade: 0, role: Role.ADMIN },
  { id: '6', name: 'مالك جديد', email: 'new.owner@demo.com', phone: '+201200000003', password: 'KLJF5488#$$7ag', guardianPhone: '', grade: 0, role: Role.ADMIN },
];

const subscriptions: Subscription[] = [];

const grades: Grade[] = [
  // Middle School
  {
    id: 7, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_7', title: 'الفصل الدراسي الأول', units: createSubjects(middle_school_subjects, 7, '1') },
      { id: 'sem2_7', title: 'الفصل الدراسي الثاني', units: createSubjects(middle_school_subjects, 7, '2') }
    ],
  },
   {
    id: 8, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_8', title: 'الفصل الدراسي الأول', units: createSubjects(middle_school_subjects, 8, '1') },
      { id: 'sem2_8', title: 'الفصل الدراسي الثاني', units: createSubjects(middle_school_subjects, 8, '2') }
    ],
  },
  {
    id: 9, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_9', title: 'الفصل الدراسي الأول', units: createSubjects(middle_school_subjects, 9, '1') },
      { id: 'sem2_9', title: 'الفصل الدراسي الثاني', units: createSubjects(middle_school_subjects, 9, '2') }
    ],
  },
  // Secondary School
  {
    id: 10, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_10', title: 'الفصل الدراسي الأول', units: createSubjects(sec_1_subjects, 10, '1') },
      { id: 'sem2_10', title: 'الفصل الدراسي الثاني', units: createSubjects(sec_1_subjects, 10, '2') }
    ],
  },
  {
    id: 11, name: 'الصف الثاني الثانوي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_11', title: 'الفصل الدراسي الأول', units: createSubjects(sec_2_subjects, 11, '1') },
      { id: 'sem2_11', title: 'الفصل الدراسي الثاني', units: createSubjects(sec_2_subjects, 11, '2') }
    ],
  },
  {
    id: 12, name: 'الصف الثالث الثانوي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_12', title: 'الفصل الدراسي الأول', units: createSubjects(sec_3_subjects, 12, '1') },
      { id: 'sem2_12', title: 'الفصل الدراسي الثاني', units: createSubjects(sec_3_subjects, 12, '2') }
    ],
  },
];

const defaultPlatformSettings: PlatformSettings = {
    platformName: 'Gstudent',
    heroTitle: 'بوابتك للتفوق الدراسي',
    heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع المواد، لمساعدتك على تحقيق أعلى الدرجات مع نخبة من أفضل المدرسين.',
    heroButtonText: 'ابدأ رحلتك الآن',
    heroImageUrl: 'https://b.top4top.io/p_3568ksa1i0.jpg',
    teacherImageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png',
    featuresTitle: 'لماذا تختار منصة Gstudent؟',
    featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.',
    features: [
        { title: "شرح تفصيلي ومبسط", description: "فيديوهات عالية الجودة تشرح كل جزء من المنهج بأسلوب سهل وممتع." },
        { title: "واجبات وامتحانات دورية", description: "اختبر فهمك وتابع مستواك من خلال واجبات وامتحانات إلكترونية." },
        { title: "نخبة من أفضل المدرسين", description: "تعلم على أيدي خبراء في كل مادة لضمان فهم عميق وتفوق مضمون." },
        { title: "متابعة مستمرة وذكية", description: "نظام متكامل لمتابعة تقدمك الدراسي وتحديد نقاط القوة والضعف." },
    ],
    footerDescription: 'منصة Gstudent التعليمية تهدف إلى تقديم أفضل المحتويات التعليمية لطلاب المرحلتين الإعدادية والثانوية.',
    contactPhone: '+20 123 456 7890',
    contactFacebookUrl: '#',
    contactYoutubeUrl: '#',
};

// --- New Home Screen Data ---

const generateInitialData = () => {
    const settings = getPlatformSettings(); // Get settings first
    const featuredCourses: Course[] = [];
    
    const featuredBooks: Book[] = [];

    return { featuredCourses, featuredBooks };
}


const activityLogs: ActivityLog[] = [];
const accessTokens: AccessToken[] = [];
const subscriptionRequests: SubscriptionRequest[] = [];
const quizAttempts: QuizAttempt[] = [];
const studentQuestions: StudentQuestion[] = [];
const subscriptionCodes: SubscriptionCode[] = [];
// New store for user-specific lesson progress
const userProgress: Record<string, Record<string, boolean>> = {};
const chatUsage: Record<string, { date: string; count: number; }> = {};

const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setData = <T>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save data for key "${key}" to localStorage.`, error);
        // This fails silently in the UI to prevent crashing, e.g., if storage is full.
    }
};

// Data Access Functions
export const initData = (): void => {
  if (!localStorage.getItem('platformSettings')) {
      setData('platformSettings', defaultPlatformSettings);
  }
  if (!localStorage.getItem('users')) {
    const { featuredCourses, featuredBooks } = generateInitialData();
    setData('users', users);
    setData('subscriptions', subscriptions);
    setData('grades', grades);
    setData('activityLogs', activityLogs);
    setData('accessTokens', accessTokens);
    setData('subscriptionRequests', subscriptionRequests);
    setData('featuredCourses', featuredCourses);
    setData('featuredBooks', featuredBooks);
    setData('quizAttempts', quizAttempts);
    setData('studentQuestions', studentQuestions);
    setData('userProgress', userProgress);
    setData('teachers', teachers);
    setData('subscriptionCodes', subscriptionCodes);
    setData('chatUsage', chatUsage);
  }
};

export const getTeachers = (): Teacher[] => getData<Teacher>('teachers');
export const getTeacherById = (id: string): Teacher | undefined => {
    const allTeachers = getData<Teacher>('teachers');
    return allTeachers.find(t => t.id === id);
};

export const addTeacher = (teacherData: Omit<Teacher, 'id'> & { phone: string; password: string }): { teacher: Teacher | null, user: User | null, error?: string } => {
    const allTeachers = getTeachers();
    const allUsers = getAllUsers();
    
    // Normalize and check phone number
    const normalizedPhone = teacherData.phone.startsWith('+2') ? teacherData.phone : `+2${teacherData.phone}`;
    if (allUsers.some(u => u.phone === normalizedPhone)) {
        return { teacher: null, user: null, error: 'رقم الهاتف مستخدم بالفعل.' };
    }
    
    const newTeacher: Teacher = {
        id: `t_${Date.now()}`,
        name: teacherData.name,
        subject: teacherData.subject,
        imageUrl: teacherData.imageUrl,
        teachingLevels: teacherData.teachingLevels,
        teachingGrades: teacherData.teachingGrades,
    };

    const teacherNameForEmail = newTeacher.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const newUserEmail = `${teacherNameForEmail}${newTeacher.id}@teacher.gstudent.com`;
    
    if (allUsers.some(u => u.email === newUserEmail)) {
        return { teacher: null, user: null, error: 'فشل في إنشاء حساب مستخدم فريد للمدرس.' };
    }

    const newUser: User = {
        id: `user_t_${Date.now()}`,
        name: newTeacher.name,
        email: newUserEmail,
        phone: normalizedPhone,
        password: teacherData.password,
        guardianPhone: '',
        grade: 0,
        role: Role.TEACHER,
        teacherId: newTeacher.id,
    };

    setData('teachers', [...allTeachers, newTeacher]);
    setData('users', [...allUsers, newUser]);

    addActivityLog('Teacher Added', `تمت إضافة مدرس جديد "${newTeacher.name}" مع حساب مستخدم "${newUser.email}".`);
    return { teacher: newTeacher, user: newUser };
};

export const updateTeacher = (updatedTeacherData: Teacher & { phone?: string; password?: string; }): { error?: string } => {
    const allTeachers = getTeachers();
    const index = allTeachers.findIndex(t => t.id === updatedTeacherData.id);
    if (index !== -1) {
        // Separate teacher data from user data
        const { phone, password, ...teacherOnlyData } = updatedTeacherData;

        allTeachers[index] = teacherOnlyData;
        
        const allUsers = getAllUsers();
        const userIndex = allUsers.findIndex(u => u.teacherId === updatedTeacherData.id);
        if(userIndex !== -1) {
            const userToUpdate = allUsers[userIndex];
            userToUpdate.name = updatedTeacherData.name;

            if (phone) {
                const normalizedPhone = phone.startsWith('+2') ? phone : `+2${phone}`;
                // Check if new phone number is used by another user
                if (allUsers.some(u => u.phone === normalizedPhone && u.id !== userToUpdate.id)) {
                    return { error: 'رقم الهاتف مستخدم بالفعل.' };
                }
                userToUpdate.phone = normalizedPhone;
            }
            if (password) { // only update password if a new one is provided
                userToUpdate.password = password;
            }
            allUsers[userIndex] = userToUpdate;
            setData('users', allUsers);
        }
        setData('teachers', allTeachers);
        addActivityLog('Teacher Updated', `تم تحديث بيانات المدرس "${updatedTeacherData.name}".`);
        return {};
    }
    return { error: 'لم يتم العثور على المدرس.' };
};


export const deleteTeacher = (teacherId: string): void => {
    let allTeachers = getTeachers();
    const teacherToDelete = allTeachers.find(t => t.id === teacherId);
    if (teacherToDelete) {
        allTeachers = allTeachers.filter(t => t.id !== teacherId);
        setData('teachers', allTeachers);

        let allUsers = getAllUsers();
        allUsers = allUsers.filter(u => u.teacherId !== teacherId);
        setData('users', allUsers);

        addActivityLog('Teacher Deleted', `تم حذف المدرس "${teacherToDelete.name}" وحسابه.`);
    }
};

export const getUserByCredentials = (identifier: string, password: string): User | undefined => {
  const allUsers = getData<User>('users');
  const identifierTrimmed = identifier.trim();
  const passwordTrimmed = password.trim();

  // Normalize input phone number for comparison
  let phoneIdentifier: string | null = null;
  if (/^01[0125]\d{8}$/.test(identifierTrimmed)) { // e.g., 01012345678
      phoneIdentifier = `+20${identifierTrimmed.substring(1)}`;
  } else if (/^\+201[0125]\d{8}$/.test(identifierTrimmed)) { // e.g., +201012345678
      phoneIdentifier = identifierTrimmed;
  } else if (/^1[0125]\d{8}$/.test(identifierTrimmed)) { // e.g., 1012345678
      phoneIdentifier = `+20${identifierTrimmed}`;
  }
  
  return allUsers.find(u => {
    const isEmailMatch = u.email && u.email.trim().toLowerCase() === identifierTrimmed.toLowerCase();
    const isPhoneMatch = (phoneIdentifier && u.phone.trim() === phoneIdentifier) || u.phone.trim() === identifierTrimmed;

    return (isEmailMatch || isPhoneMatch) && u.password.trim() === passwordTrimmed;
  });
};

export const addUser = (userData: Omit<User, 'id' | 'role' | 'subscriptionId'>): { user: User | null; error: string | null } => {
    const allUsers = getData<User>('users');
    
    // Check if email or phone already exists
    if (allUsers.some(u => (u.email && userData.email && u.email.toLowerCase() === userData.email?.toLowerCase()) || u.phone === userData.phone)) {
        return { user: null, error: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل.' };
    }

    const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        role: Role.STUDENT,
    };
    
    const updatedUsers = [...allUsers, newUser];
    setData('users', updatedUsers);
    addActivityLog('User Registered', `New user "${newUser.name}" created an account.`);
    
    return { user: newUser, error: null };
};


export const getSubscriptionByUserId = (userId: string): Subscription | undefined => {
  const allSubscriptions = getData<Subscription>('subscriptions');
  return allSubscriptions.find(s => s.userId === userId);
};

export const getSubscriptionsByTeacherId = (teacherId: string): Subscription[] => {
  const allSubscriptions = getData<Subscription>('subscriptions');
  return allSubscriptions.filter(s => s.teacherId === teacherId);
};

export const getGradeById = (gradeId: number): Grade | undefined => {
    const allGrades = getData<Grade>('grades');
    return allGrades.find(g => g.id === gradeId);
};

export const getAllGrades = (): Grade[] => getData<Grade>('grades');
export const getAllUsers = (): User[] => getData<User>('users');
export const getAllSubscriptions = (): Subscription[] => getData<Subscription>('subscriptions');

// Home Screen Data Accessors
export const getFeaturedCourses = (): Course[] => getData<Course>('featuredCourses');
export const getFeaturedBooks = (): Book[] => getData<Book>('featuredBooks');


export const addActivityLog = (action: string, details: string): void => {
    const logs = getData<ActivityLog>('activityLogs');
    const newLog: ActivityLog = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        action,
        details,
    };
    setData('activityLogs', [newLog, ...logs]);
};
export const getActivityLogs = (): ActivityLog[] => getData<ActivityLog>('activityLogs');

export const updateGrade = (updatedGrade: Grade): void => {
    const grades = getAllGrades();
    const index = grades.findIndex(g => g.id === updatedGrade.id);
    if (index !== -1) {
        grades[index] = updatedGrade;
        setData('grades', grades);
    }
};

export const addLessonToUnit = (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>): void => {
    const grade = getGradeById(gradeId);
    if (!grade) {
        console.error(`Grade with id ${gradeId} not found.`);
        return;
    }

    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) {
        console.error(`Semester with id ${semesterId} not found.`);
        return;
    }

    const unit = semester.units.find(u => u.id === unitId);
    if (!unit) {
        console.error(`Unit with id ${unitId} not found.`);
        return;
    }
    
    const newLesson: Lesson = {
        ...lessonData,
        id: `l${new Date().getTime()}`, // Simple unique ID
    };
    
    unit.lessons.push(newLesson);
    
    updateGrade(grade);
};

export const updateLesson = (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    const unit = semester.units.find(u => u.id === unitId);
    if (!unit) return;
    const lessonIndex = unit.lessons.findIndex(l => l.id === updatedLesson.id);
    if (lessonIndex !== -1) {
        unit.lessons[lessonIndex] = updatedLesson;
        updateGrade(grade);
    }
};

export const deleteLesson = (gradeId: number, semesterId: string, unitId: string, lessonId: string): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    const unit = semester.units.find(u => u.id === unitId);
    if (!unit) return;
    unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
    updateGrade(grade);
};

// --- User Progress Functions (New) ---
export const getUserProgress = (userId: string): Record<string, boolean> => {
    const data = localStorage.getItem('userProgress');
    const allProgress = (data ? JSON.parse(data) : {}) as Record<string, Record<string, boolean>>;
    return allProgress[userId] || {};
};

export const setLessonCompleted = (userId: string, lessonId: string, completed: boolean): void => {
    const data = localStorage.getItem('userProgress');
    const allProgress = (data ? JSON.parse(data) : {}) as Record<string, Record<string, boolean>>;
    if (!allProgress[userId]) {
        allProgress[userId] = {};
    }
    if (completed) {
        allProgress[userId][lessonId] = true;
    } else {
        delete allProgress[userId][lessonId];
    }
    setData('userProgress', allProgress);
};


export const addUnitToSemester = (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id' | 'lessons'>): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    
    const newUnit: Unit = {
        ...unitData,
        id: `u${new Date().getTime()}`,
        lessons: [],
    };
    
    semester.units.push(newUnit);
    updateGrade(grade);
};

export const updateUnit = (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    const unitIndex = semester.units.findIndex(u => u.id === updatedUnit.id);
    if (unitIndex !== -1) {
        semester.units[unitIndex] = { ...semester.units[unitIndex], ...updatedUnit };
        updateGrade(grade);
    }
};

export const deleteUnit = (gradeId: number, semesterId: string, unitId: string): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    semester.units = semester.units.filter(u => u.id !== unitId);
    updateGrade(grade);
};

export const generateAccessToken = (gradeId: number, semesterId: string, unitId: string, lessonId: string): string => {
    const tokens = getData<AccessToken>('accessTokens');
    const newToken: AccessToken = {
        token: `QR-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`,
        gradeId,
        semesterId,
        unitId,
        lessonId,
        isUsed: false,
        createdAt: new Date().toISOString(),
    };
    setData('accessTokens', [...tokens, newToken]);
    addActivityLog('QR Code Generated', `Generated a QR code for lesson ID ${lessonId}.`);
    return newToken.token;
};

// --- "Ask the Prof" Question Functions (New) ---

export const addStudentQuestion = (userId: string, userName: string, questionText: string): void => {
    const questions = getData<StudentQuestion>('studentQuestions');
    const newQuestion: StudentQuestion = {
        id: `q_${Date.now()}`,
        userId,
        userName,
        questionText,
        status: 'Pending',
        createdAt: new Date().toISOString(),
    };
    setData('studentQuestions', [newQuestion, ...questions]);
    addActivityLog('Question Asked', `User "${userName}" asked a question.`);
};

export const getStudentQuestionsByUserId = (userId: string): StudentQuestion[] => {
    const questions = getData<StudentQuestion>('studentQuestions');
    return questions
        .filter(q => q.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAllStudentQuestions = (): StudentQuestion[] => {
    const questions = getData<StudentQuestion>('studentQuestions');
    return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const answerStudentQuestion = (questionId: string, answerText: string): void => {
    let questions = getData<StudentQuestion>('studentQuestions');
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
        questions[index].answerText = answerText;
        questions[index].status = 'Answered';
        setData('studentQuestions', questions);
        addActivityLog('Question Answered', `Answered question ID ${questionId}.`);
    }
};

// --- Subscription Request Functions ---
export const getSubscriptionRequests = (): SubscriptionRequest[] => {
    const requests = getData<SubscriptionRequest>('subscriptionRequests');
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPendingSubscriptionRequestCount = (): number => {
    return getSubscriptionRequests().filter(r => r.status === 'Pending').length;
};

export const getUserSubscriptionRequest = (userId: string): SubscriptionRequest | undefined => {
    const requests = getSubscriptionRequests();
    // Find the most recent pending request for the user.
    return requests.find(r => r.userId === userId && r.status === 'Pending');
};

export const addSubscriptionRequest = (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): void => {
    const requests = getSubscriptionRequests();
    const newRequest: SubscriptionRequest = {
        id: `req-${Date.now()}`,
        userId,
        userName,
        plan,
        paymentFromNumber,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        subjectName,
        unitId,
    };
    setData('subscriptionRequests', [newRequest, ...requests]);
    const details = subjectName
        ? `User "${userName}" requested a ${plan} plan for "${subjectName}" from number ${paymentFromNumber}.`
        : `User "${userName}" requested a comprehensive ${plan} plan from number ${paymentFromNumber}.`;
    addActivityLog('Subscription Request', details);
};

export const updateSubscriptionRequest = (updatedRequest: SubscriptionRequest): void => {
    let requests = getSubscriptionRequests();
    const index = requests.findIndex(r => r.id === updatedRequest.id);
    if (index !== -1) {
        requests[index] = updatedRequest;
        setData('subscriptionRequests', requests);
    }
};

export const createOrUpdateSubscription = (userId: string, plan: Subscription['plan'], status: 'Active' | 'Expired', customEndDate?: string, teacherId?: string): void => {
    const allSubscriptions = getAllSubscriptions();
    const existingSubIndex = allSubscriptions.findIndex(s => s.userId === userId);

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
        }
    }
    
    const newOrUpdatedSubscription: Subscription = {
        id: existingSubIndex !== -1 ? allSubscriptions[existingSubIndex].id : `sub-${userId}-${Date.now()}`,
        userId,
        plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
        teacherId,
    };
    
    if (existingSubIndex !== -1) {
        allSubscriptions[existingSubIndex] = newOrUpdatedSubscription;
    } else {
        allSubscriptions.push(newOrUpdatedSubscription);
    }
    
    setData('subscriptions', allSubscriptions);
    const user = getData<User>('users').find(u => u.id === userId);
    if (user) {
        addActivityLog('Subscription Update', `Subscription for "${user.name}" has been updated/created to ${status}.`);
    }
};

// --- Subscription Code Functions ---

export const getSubscriptionCodes = (): SubscriptionCode[] => getData<SubscriptionCode>('subscriptionCodes');

export const generateSubscriptionCodes = (options: {
    teacherId: string;
    durationDays: number;
    count: number;
    maxUses: number;
}): SubscriptionCode[] => {
    const allCodes = getSubscriptionCodes();
    const newCodes: SubscriptionCode[] = [];
    for (let i = 0; i < options.count; i++) {
        const newCode: SubscriptionCode = {
            code: `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            teacherId: options.teacherId,
            durationDays: options.durationDays,
            maxUses: options.maxUses,
            timesUsed: 0,
            usedByUserIds: [],
            createdAt: new Date().toISOString(),
        };
        newCodes.push(newCode);
    }
    setData('subscriptionCodes', [...allCodes, ...newCodes]);
    addActivityLog('Subscription Codes Generated', `Generated ${options.count} codes for teacher ID ${options.teacherId}.`);
    return newCodes;
};

export const validateSubscriptionCode = (code: string): { valid: boolean; error?: string } => {
    const allCodes = getSubscriptionCodes();
    const foundCode = allCodes.find(c => c.code === code.trim());

    if (!foundCode) {
        return { valid: false, error: 'الكود غير موجود.' };
    }

    if (foundCode.timesUsed >= foundCode.maxUses) {
        return { valid: false, error: 'هذا الكود تم استخدامه بالكامل.' };
    }

    return { valid: true };
};

export const registerAndRedeemCode = (userData: Omit<User, 'id' | 'role' | 'subscriptionId'>, code: string): { user: User | null; error: string | null } => {
    const allCodes = getSubscriptionCodes();
    const codeIndex = allCodes.findIndex(c => c.code === code.trim());
    
    if (codeIndex === -1) {
        return { user: null, error: 'الكود الذي أدخلته غير صالح.' };
    }

    const targetCode = allCodes[codeIndex];
    if (targetCode.timesUsed >= targetCode.maxUses) {
        return { user: null, error: 'هذا الكود تم استخدامه بالكامل.' };
    }

    const addUserResult = addUser(userData);
    if (addUserResult.error || !addUserResult.user) {
        return { user: null, error: addUserResult.error };
    }
    const newUser = addUserResult.user;

    targetCode.timesUsed++;
    targetCode.usedByUserIds.push(newUser.id);
    allCodes[codeIndex] = targetCode;
    setData('subscriptionCodes', allCodes);

    const allSubscriptions = getAllSubscriptions();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + targetCode.durationDays);

    const newSubscription: Subscription = {
        id: `sub-${newUser.id}-${Date.now()}`,
        userId: newUser.id,
        plan: 'Monthly', // This is a placeholder as the duration is custom
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'Active',
        teacherId: targetCode.teacherId,
    };
    allSubscriptions.push(newSubscription);
    setData('subscriptions', allSubscriptions);

    const allUsers = getData<User>('users');
    const userIndex = allUsers.findIndex(u => u.id === newUser.id);
    let updatedUser = newUser;
    if (userIndex !== -1) {
        allUsers[userIndex].subscriptionId = newSubscription.id;
        setData('users', allUsers);
        updatedUser = { ...newUser, subscriptionId: newSubscription.id };
    }
    
    addActivityLog('Subscription Code Redeemed', `User "${updatedUser.name}" redeemed code ${code}.`);
    return { user: updatedUser, error: null };
};


// --- Featured Course Functions ---
export const addFeaturedCourse = (course: Omit<Course, 'id'>): void => {
    const courses = getData<Course>('featuredCourses');
    const newCourse: Course = {
        ...course,
        id: `c_${Date.now()}`
    };
    setData('featuredCourses', [...courses, newCourse]);
    addActivityLog('Home Mgmt', `Added course: ${newCourse.title}`);
};

export const updateFeaturedCourse = (updatedCourse: Course): void => {
    const courses = getData<Course>('featuredCourses');
    const index = courses.findIndex(c => c.id === updatedCourse.id);
    if (index !== -1) {
        courses[index] = updatedCourse;
        setData('featuredCourses', courses);
        addActivityLog('Home Mgmt', `Updated course: ${updatedCourse.title}`);
    }
};

export const deleteFeaturedCourse = (courseId: string): void => {
    let courses = getData<Course>('featuredCourses');
    const courseTitle = courses.find(c => c.id === courseId)?.title || 'Unknown';
    courses = courses.filter(c => c.id !== courseId);
    setData('featuredCourses', courses);
    addActivityLog('Home Mgmt', `Deleted course: ${courseTitle}`);
};


// --- Featured Book Functions ---
export const addFeaturedBook = (book: Omit<Book, 'id'>): void => {
    const books = getData<Book>('featuredBooks');
    const newBook: Book = {
        ...book,
        id: `b_${Date.now()}`
    };
    setData('featuredBooks', [...books, newBook]);
    addActivityLog('Home Mgmt', `Added book: ${newBook.title}`);
};

export const updateFeaturedBook = (updatedBook: Book): void => {
    const books = getData<Book>('featuredBooks');
    const index = books.findIndex(b => b.id === updatedBook.id);
    if (index !== -1) {
        books[index] = updatedBook;
        setData('featuredBooks', books);
        addActivityLog('Home Mgmt', `Updated book: ${updatedBook.title}`);
    }
};

export const deleteFeaturedBook = (bookId: string): void => {
    let books = getData<Book>('featuredBooks');
    const bookTitle = books.find(b => b.id === bookId)?.title || 'Unknown';
    books = books.filter(b => b.id !== bookId);
    setData('featuredBooks', books);
    addActivityLog('Home Mgmt', `Deleted book: ${bookTitle}`);
};

// --- Quiz Attempt Functions ---
export const addQuizAttempt = (attemptData: Omit<QuizAttempt, 'id'>): void => {
    const attempts = getData<QuizAttempt>('quizAttempts');
    const newAttempt: QuizAttempt = {
        ...attemptData,
        id: `attempt_${Date.now()}`
    };
    // To keep the list manageable, we can replace previous attempts by the same user for the same lesson.
    const otherAttempts = attempts.filter(a => !(a.userId === newAttempt.userId && a.lessonId === newAttempt.lessonId));
    setData('quizAttempts', [...otherAttempts, newAttempt]);
    addActivityLog('Quiz Submitted', `User ID ${attemptData.userId} submitted quiz for lesson ID ${attemptData.lessonId} with score ${attemptData.score}%.`);
};

export const getQuizAttemptsByUserId = (userId: string): QuizAttempt[] => {
    const attempts = getData<QuizAttempt>('quizAttempts');
    return attempts.filter(a => a.userId === userId).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const getLatestQuizAttemptForLesson = (userId: string, lessonId: string): QuizAttempt | undefined => {
    const userAttempts = getQuizAttemptsByUserId(userId);
    return userAttempts.find(a => a.lessonId === lessonId);
};

// --- Platform Settings Functions ---
export const getPlatformSettings = (): PlatformSettings => {
    const data = localStorage.getItem('platformSettings');
    const storedSettings = data ? JSON.parse(data) : {};
    return { ...defaultPlatformSettings, ...storedSettings };
};

export const updatePlatformSettings = (settings: PlatformSettings): void => {
    setData('platformSettings', settings);
    addActivityLog('Platform Settings', 'Updated welcome page and footer content.');
};

// --- Admin User Management Functions ---
export const updateUser = (updatedUser: User): void => {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        setData('users', users);
        addActivityLog('User Update', `User profile for "${updatedUser.name}" was updated.`);
    }
};

export const deleteUser = (userId: string): void => {
    let users = getAllUsers();
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
        users = users.filter(u => u.id !== userId);
        setData('users', users);
        // Also remove related data
        let subscriptions = getAllSubscriptions().filter(s => s.userId !== userId);
        setData('subscriptions', subscriptions);

        addActivityLog('User Deletion', `User "${userToDelete.name}" and their data were deleted.`);
    }
};

// --- Chatbot Usage Functions ---
export const getChatUsage = (userId: string): { remaining: number } => {
    const data = localStorage.getItem('chatUsage');
    const allUsage = (data ? JSON.parse(data) : {}) as Record<string, { date: string; count: number }>;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userUsage = allUsage[userId];

    if (userUsage && userUsage.date === today) {
        return { remaining: Math.max(0, DAILY_CHAT_LIMIT - userUsage.count) };
    }

    return { remaining: DAILY_CHAT_LIMIT };
};

export const incrementChatUsage = (userId: string): void => {
    const data = localStorage.getItem('chatUsage');
    const allUsage = (data ? JSON.parse(data) : {}) as Record<string, { date: string; count: number }>;
    
    const today = new Date().toISOString().split('T')[0];
    const userUsage = allUsage[userId];

    if (userUsage && userUsage.date === today) {
        userUsage.count += 1;
    } else {
        allUsage[userId] = { date: today, count: 1 };
    }
    
    setData('chatUsage', allUsage);
};
import {
  User,
  Subscription,
  Grade,
  Role,
  LessonType,
  ActivityLog,
  Lesson,
  Unit,
  PrepaidCode,
  SubscriptionRequest,
  Course,
  Book,
  QuizAttempt,
  PlatformSettings,
  Teacher,
  StudentQuestion,
  Notification,
} from '../types';
import { DEMO_ADMIN_IDENTIFIER, DEMO_ADMIN_PASSWORD, DEMO_STUDENT_IDENTIFIER, DEMO_STUDENT_PASSWORD } from '../constants';
import { teachers as initialTeachers } from '../data/teacherData';

// --- New Curriculum Data Generation ---

const createPlaceholderLessons = (): Lesson[] => ([
  { id: `l_exp_${Date.now()}_${Math.random()}`, title: 'شرح الدرس الأول', type: LessonType.EXPLANATION, content: 'dQw4w9WgXcQ' },
  { 
    id: `l_hw_${Date.now()}_${Math.random()}`, 
    title: 'واجب الدرس الأول', 
    type: LessonType.HOMEWORK, 
    content: '', 
    imageUrl: '', // To be filled by admin
    correctAnswers: ['4', '15'], // Example for a hypothetical image with two questions
    passingScore: 50 
  },
]);

const createUnitsFromSubjects = (subjects: string[], gradeId: number, semesterId: string): Unit[] => subjects.map((subject, i) => ({
  id: `unit_${gradeId}_${semesterId}_${i}`,
  title: subject,
  lessons: createPlaceholderLessons()
}));

// --- Math Units Lists ---
const middle_school_math_units = ['الجبر والإحصاء', 'الهندسة'];
const sec_1_math_units = ['الجبر وحساب المثلثات', 'الهندسة التحليلية'];
const sec_2_math_units = ['الرياضيات البحتة (علمي)', 'الرياضيات التطبيقية (علمي)', 'رياضيات (أدبي)'];
const sec_3_math_units = ['التفاضل والتكامل', 'الجبر والهندسة الفراغية', 'الإستاتيكا', 'الديناميكا'];


// Mock Data
const users: User[] = [
  { id: '1', name: 'طالب تجريبي', email: DEMO_STUDENT_IDENTIFIER, phone: '+201000000001', password: DEMO_STUDENT_PASSWORD, guardianPhone: '+201100000001', grade: 12, role: Role.STUDENT, track: 'Literary' },
  { id: '2', name: 'طالبة متفوقة', email: 'student2@demo.com', phone: '+201000000002', password: '5678', guardianPhone: '+201100000002', grade: 11, role: Role.STUDENT },
  { id: '3', name: 'طالب مجتهد', email: 'student3@demo.com', phone: '+201000000003', password: '9012', guardianPhone: '+201100000003', grade: 12, track: 'Scientific', role: Role.STUDENT },
  { id: '4', name: 'مدير المنصة', email: DEMO_ADMIN_IDENTIFIER, phone: '+201200000001', password: DEMO_ADMIN_PASSWORD, guardianPhone: '', grade: 0, role: Role.ADMIN },
  { id: '5', name: 'مالك المنصة', email: 'jytt0jewellery@gmail.com', phone: '+201200000002', password: 'Hshsh555&HehgeUDNYf744&&$$@Jg28848', guardianPhone: '', grade: 0, role: Role.ADMIN },
  { id: '6', name: 'مالك جديد', email: 'new.owner@demo.com', phone: '+201200000003', password: 'KLJF5488#$$7ag', guardianPhone: '', grade: 0, role: Role.ADMIN },
];

const soonToExpireDate = new Date();
soonToExpireDate.setDate(soonToExpireDate.getDate() + 3); // Expires in 3 days

const subscriptions: Subscription[] = [
  { id: 'sub1', userId: '1', itemId: 'unit_12_1_geo_1', itemName: 'الجغرافيا', itemType: 'unit', plan: 'Monthly', startDate: new Date().toISOString(), endDate: soonToExpireDate.toISOString(), status: 'Active' },
  { id: 'sub2', userId: '2', itemId: 'unit_11_1_0', itemName: 'الرياضيات البحتة (علمي)', itemType: 'unit', plan: 'Quarterly', startDate: '2024-06-01', endDate: '2024-09-01', status: 'Active' },
  { id: 'sub3', userId: '3', itemId: 'unit_12_1_0', itemName: 'التفاضل والتكامل', itemType: 'unit', plan: 'Annual', startDate: '2023-09-01', endDate: '2024-09-01', status: 'Expired' },
];

const grades: Grade[] = [
  // Middle School
  {
    id: 7, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_7', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle_school_math_units, 7, '1').map(u => ({...u, teacherId: 't1'})) },
      { id: 'sem2_7', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle_school_math_units, 7, '2').map(u => ({...u, teacherId: 't1'})) }
    ],
  },
  {
    id: 8, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_8', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle_school_math_units, 8, '1').map(u => ({...u, teacherId: 't1'})) },
      { id: 'sem2_8', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle_school_math_units, 8, '2').map(u => ({...u, teacherId: 't1'})) }
    ],
  },
  {
    id: 9, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_9', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle_school_math_units, 9, '1').map(u => ({...u, teacherId: 't1'})) },
      { id: 'sem2_9', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle_school_math_units, 9, '2').map(u => ({...u, teacherId: 't1'})) }
    ],
  },
  // Secondary School
  {
    id: 10, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_10', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec_1_math_units, 10, '1').map(u => ({...u, teacherId: 't1'})) },
      { id: 'sem2_10', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec_1_math_units, 10, '2').map(u => ({...u, teacherId: 't1'})) }
    ],
  },
  {
    id: 11, name: 'الصف الثاني الثانوي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_11', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec_2_math_units, 11, '1').map(u => ({...u, teacherId: 't1'})) },
      { id: 'sem2_11', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec_2_math_units, 11, '2').map(u => ({...u, teacherId: 't1'})) }
    ],
  },
  {
    id: 12, name: 'الصف الثالث الثانوي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_12', title: 'الفصل الدراسي الأول', units: [
          // Scientific Track
          ...createUnitsFromSubjects(sec_3_math_units, 12, '1').map(u => ({...u, teacherId: 't1'})),
          { id: 'unit_12_1_phys', teacherId: 't2', title: 'الفيزياء', lessons: createPlaceholderLessons() },
          // Literary Track
          { id: 'unit_12_1_geo_1', teacherId: 't5', title: 'الجغرافيا', lessons: createPlaceholderLessons() },
          { id: 'unit_12_1_geo_2', teacherId: 't6', title: 'الجغرافيا', lessons: createPlaceholderLessons() },
          { id: 'unit_12_1_hist', teacherId: 't7', title: 'التاريخ', lessons: createPlaceholderLessons() },
          { id: 'unit_12_1_stat', teacherId: 't1', title: 'الإحصاء', lessons: createPlaceholderLessons() },
          // Shared
          { id: 'unit_12_1_fr', teacherId: 't3', title: 'اللغة الفرنسية', lessons: createPlaceholderLessons() },
          { id: 'unit_12_1_en', teacherId: 't4', title: 'اللغة الإنجليزية', lessons: createPlaceholderLessons() },
      ]},
      { id: 'sem2_12', title: 'الفصل الدراسي الثاني', units: [
          ...createUnitsFromSubjects(sec_3_math_units, 12, '2').map(u => ({...u, teacherId: 't1'})),
          { id: 'unit_12_2_phys', teacherId: 't2', title: 'الفيزياء (مراجعة)', lessons: createPlaceholderLessons() },
      ]}
    ],
  },
];

const defaultPlatformSettings: PlatformSettings = {
    platformName: 'Gstudent',
    heroTitle: 'Gstudent - طريقك للنجاح',
    heroSubtitle: 'شروحات مبسطة وتمارين مكثفة لجميع المواد الدراسية، لمساعدتك على تحقيق أعلى الدرجات.',
    heroButtonText: 'ابدأ رحلتك الآن',
    heroImageUrl: 'https://k.top4top.io/p_358190w910.png',
    teacherImageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png',
    featuresTitle: 'لماذا تختار Gstudent؟',
    featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.',
    features: [
        { title: "شرح تفصيلي ومبسط", description: "فيديوهات عالية الجودة تشرح كل جزء من المنهج بأسلوب سهل وممتع." },
        { title: "واجبات وامتحانات دورية", description: "اختبر فهمك وتابع مستواك من خلال واجبات وامتحانات إلكترونية." },
        { title: "وفر وقتك ومجهودك", description: "ذاكر من أي مكان وفي أي وقت يناسبك، وراجع الدروس أكثر من مرة." },
        { title: "متابعة مستمرة وذكية", description: "نظام متكامل لمتابعة تقدمك الدراسي وتحديد نقاط القوة والضعف." },
    ],
    footerDescription: 'Gstudent هي منصة تعليمية رائدة تهدف إلى تقديم أفضل المحتويات التعليمية لطلاب المرحلتين الإعدادية والثانوية.',
    contactPhone: '+20 123 456 7890',
    contactFacebookUrl: '#',
    contactYoutubeUrl: '#',
};

// --- New Home Screen Data ---

const generateInitialData = () => {
    const settings = getPlatformSettings(); // Get settings first
    const featuredCourses: Course[] = [
        { id: 'c1', teacherId: 't1', title: 'كورس التفاضل والتكامل', subtitle: 'لطلاب الصف الثالث الثانوي', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 10, videoCount: 25, quizCount: 8 },
        { id: 'c2', teacherId: 't2', title: 'كورس فيزياء الثانوية العامة', subtitle: 'لطلاب الصف الثالث الثانوي', coverImage: 'https://i.ibb.co/R9m4M58/course2.png', fileCount: 8, videoCount: 20, quizCount: 5 },
        { id: 'c3', teacherId: 't3', title: 'مراجعة ليلة الامتحان - فرنسي', subtitle: 'لجميع المراحل', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 2, videoCount: 5, quizCount: 2 },
        { id: 'c4', teacherId: 't4', title: 'تأسيس اللغة الإنجليزية', subtitle: 'لجميع المراحل', coverImage: 'https://i.ibb.co/R9m4M58/course2.png', fileCount: 5, videoCount: 15, quizCount: 3 },
    ];
    
    const featuredBooks: Book[] = [
        { id: 'b1', title: 'كتاب البروف في الجبر (3 ث)', teacherName: 'أ. محمد عبد المعبود', teacherImage: settings.teacherImageUrl || 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 250, coverImage: 'https://i.ibb.co/yQxG4d8/book2.png' },
        { id: 'b2', title: 'كتاب البروف في الفيزياء', teacherName: 'أ. ماجد المهندس', teacherImage: settings.teacherImageUrl || 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 150, coverImage: 'https://i.ibb.co/q0V9bFN/book1.png' },
        { id: 'b3', title: 'ملزمة المراجعة النهائية', teacherName: 'فريق Gstudent', teacherImage: settings.teacherImageUrl || 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 100, coverImage: 'https://i.ibb.co/yQxG4d8/book2.png' },
    ];

    return { featuredCourses, featuredBooks };
}


const activityLogs: ActivityLog[] = [];
const prepaidCodes: PrepaidCode[] = [];
const subscriptionRequests: SubscriptionRequest[] = [];
const quizAttempts: QuizAttempt[] = [];
const notifications: Notification[] = [
    {
        id: 'notif_welcome_static',
        userId: '1',
        title: 'مرحباً بك في Gstudent!',
        message: 'نحن سعداء بانضمامك. استكشف المنصة وابدأ رحلتك التعليمية.',
        type: 'general',
        isRead: false,
        createdAt: new Date().toISOString()
    }
];

// FIX: Add StudentQuestion data store
const studentQuestions: StudentQuestion[] = [
  { id: 'q1', userId: '1', userName: 'طالب تجريبي', questionText: 'ما هو الفرق بين التفاضل والتكامل؟', status: 'Answered', createdAt: '2024-07-20T10:00:00Z', answerText: 'التفاضل يدرس معدل التغير، بينما التكامل يدرس المساحة تحت المنحنى. هما عمليتان عكسيتان.' },
  { id: 'q2', userId: '1', userName: 'طالب تجريبي', questionText: 'كيف يمكنني حل هذه المسألة الفيزيائية؟', status: 'Pending', createdAt: '2024-07-21T12:30:00Z' },
];
// New store for user-specific lesson progress
const userProgress: Record<string, Record<string, boolean>> = {};

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
    setData('teachers', initialTeachers);
    setData('activityLogs', activityLogs);
    setData('prepaidCodes', prepaidCodes);
    setData('subscriptionRequests', subscriptionRequests);
    setData('featuredCourses', featuredCourses);
    setData('featuredBooks', featuredBooks);
    setData('quizAttempts', quizAttempts);
    setData('userProgress', userProgress);
    // FIX: Initialize studentQuestions store
    setData('studentQuestions', studentQuestions);
    setData('notifications', notifications);
  }
};

export const getUserByCredentials = (identifier: string, password: string): User | undefined => {
  const allUsers = getData<User>('users');
  const identifierTrimmed = identifier.trim();
  const passwordTrimmed = password.trim();

  // Normalize input phone number to international format for comparison
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
    
    // This will compare the normalized input with what's stored.
    // And also allows exact match for old data or other formats.
    const isPhoneMatch = (phoneIdentifier && u.phone.trim() === phoneIdentifier) || u.phone.trim() === identifierTrimmed;

    return (isEmailMatch || isPhoneMatch) && u.password.trim() === passwordTrimmed;
  });
};

export const addUser = (userData: Omit<User, 'id' | 'role' >, code?: string): { user: User | null; error: string | null } => {
    const allUsers = getData<User>('users');
    
    if (code) {
        const validation = validatePrepaidCode(code);
        if (!validation.success) {
            return { user: null, error: validation.message };
        }
    }

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
    
    if (code) {
        redeemPrepaidCode(code, newUser.id);
    }

    addActivityLog('User Registered', `New user "${newUser.name}" created an account.`);
    
    return { user: newUser, error: null };
};


export const getSubscriptionsByUserId = (userId: string): Subscription[] => {
  const allSubscriptions = getData<Subscription>('subscriptions');
  return allSubscriptions.filter(s => s.userId === userId);
};

export const hasSubscriptionForItem = (userId: string, itemId: string): boolean => {
  const userSubscriptions = getSubscriptionsByUserId(userId);
  // Check for specific item subscription first
  const hasSpecificSub = userSubscriptions.some(s => s.itemId === itemId && s.status === 'Active');
  if (hasSpecificSub) {
    return true;
  }
  // If no specific sub, check for an active platform-wide subscription
  const hasPlatformSub = userSubscriptions.some(s => s.itemType === 'platform' && s.status === 'Active');
  return hasPlatformSub;
};

export const getGradeById = (gradeId: number): Grade | undefined => {
    const allGrades = getData<Grade>('grades');
    return allGrades.find(g => g.id === gradeId);
};

export const getAllGrades = (): Grade[] => getData<Grade>('grades');
export const getAllUsers = (): User[] => getData<User>('users');
export const getAllSubscriptions = (): Subscription[] => getData<Subscription>('subscriptions');
export const getTeachers = (): Teacher[] => getData<Teacher>('teachers');

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
    // FIX: Use `unitId` from parameters instead of a non-existent `updatedUnit`.
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
    // FIX: This was finding the wrong unit (the first one that was NOT the target). Corrected to find the correct unit.
    const unit = semester.units.find(u => u.id === unitId);
    if (!unit) return;
    unit.lessons = unit.lessons.filter(l => l.id !== lessonId);
    updateGrade(grade);
};

// --- User Progress Functions (New) ---
export const getUserProgress = (userId: string): Record<string, boolean> => {
    const allProgress = getData<Record<string, Record<string, boolean>>>('userProgress')[0] || {};
    return allProgress[userId] || {};
};

export const setLessonCompleted = (userId: string, lessonId: string, completed: boolean): void => {
    const allProgress = getData<Record<string, Record<string, boolean>>>('userProgress')[0] || {};
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


export const addUnitToSemester = (gradeId: number, semesterId: string, unitTitle: string): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    
    const newUnit: Unit = {
        id: `u${new Date().getTime()}`,
        title: unitTitle,
        lessons: [],
    };
    
    semester.units.push(newUnit);
    updateGrade(grade);
};

export const updateUnit = (gradeId: number, semesterId: string, updatedUnit: { id: string, title: string }): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    const unit = semester.units.find(u => u.id === updatedUnit.id);
    if (unit) {
        unit.title = updatedUnit.title;
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

// --- Subscription Request Functions ---
export const getSubscriptionRequests = (): SubscriptionRequest[] => {
    const requests = getData<SubscriptionRequest>('subscriptionRequests');
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPendingSubscriptionRequestCount = (): number => {
    return getSubscriptionRequests().filter(r => r.status === 'Pending').length;
};

export const getPendingSubscriptionRequestForItem = (userId: string, itemId: string): SubscriptionRequest | undefined => {
    const requests = getSubscriptionRequests();
    return requests.find(r => r.userId === userId && r.itemId === itemId && r.status === 'Pending');
};

export const addSubscriptionRequest = (
    userId: string, 
    userName: string, 
    plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually', 
    paymentFromNumber: string,
    itemId: string,
    itemName: string,
    itemType: 'unit' | 'course' | 'platform'
): void => {
    const requests = getSubscriptionRequests();
    const newRequest: SubscriptionRequest = {
        id: `req-${Date.now()}`,
        userId,
        userName,
        itemId,
        itemName,
        itemType,
        plan,
        paymentFromNumber,
        status: 'Pending',
        createdAt: new Date().toISOString(),
    };
    setData('subscriptionRequests', [newRequest, ...requests]);
    addActivityLog('Subscription Request', `User "${userName}" requested a ${plan} plan for ${itemName}.`);
};

export const updateSubscriptionRequest = (updatedRequest: SubscriptionRequest): void => {
    let requests = getSubscriptionRequests();
    const index = requests.findIndex(r => r.id === updatedRequest.id);
    if (index !== -1) {
        requests[index] = updatedRequest;
        setData('subscriptionRequests', requests);
    }
};

export const createOrUpdateSubscription = (
    userId: string, 
    plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually', 
    status: 'Active' | 'Expired', 
    itemId: string,
    itemName: string,
    itemType: 'unit' | 'course' | 'platform',
    customEndDate?: string
): void => {
    const allSubscriptions = getAllSubscriptions();
    // A user can have multiple subs, so we find the one for the specific item
    const existingSubIndex = allSubscriptions.findIndex(s => s.userId === userId && s.itemId === itemId);

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
        itemId,
        itemName,
        itemType,
        plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
    };
    
    if (existingSubIndex !== -1) {
        allSubscriptions[existingSubIndex] = newOrUpdatedSubscription;
    } else {
        allSubscriptions.push(newOrUpdatedSubscription);
    }
    
    setData('subscriptions', allSubscriptions);
    const user = getData<User>('users').find(u => u.id === userId);
    if (user) {
        addActivityLog('Subscription Update', `Subscription for "${user.name}" for "${itemName}" has been updated/created to ${status}.`);
    }
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

// --- Student Question Functions ---
export const getAllStudentQuestions = (): StudentQuestion[] => {
    const questions = getData<StudentQuestion>('studentQuestions');
    return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getStudentQuestionsByUserId = (userId: string): StudentQuestion[] => {
    return getAllStudentQuestions().filter(q => q.userId === userId);
};

export const addStudentQuestion = (userId: string, userName: string, questionText: string): void => {
    const questions = getAllStudentQuestions();
    const newQuestion: StudentQuestion = {
        id: `q-${Date.now()}`,
        userId,
        userName,
        questionText,
        status: 'Pending',
        createdAt: new Date().toISOString(),
    };
    setData('studentQuestions', [newQuestion, ...questions]);
    addActivityLog('Question Asked', `User "${userName}" asked a question.`);
};

export const answerStudentQuestion = (questionId: string, answerText: string): void => {
    let questions = getAllStudentQuestions();
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
        questions[index].answerText = answerText;
        questions[index].status = 'Answered';
        setData('studentQuestions', questions);
        addActivityLog('Question Answered', `Answered question ID ${questionId}.`);
    }
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

// --- Teacher Management Functions (New) ---
export const addTeacher = (teacherData: Omit<Teacher, 'id'>): void => {
    const teachers = getTeachers();
    const newTeacher: Teacher = {
        ...teacherData,
        id: `t_${Date.now()}`
    };
    setData('teachers', [...teachers, newTeacher]);
    addActivityLog('Teacher Mgmt', `Added teacher: ${newTeacher.name}`);
};

export const updateTeacher = (updatedTeacher: Teacher): void => {
    const teachers = getTeachers();
    const index = teachers.findIndex(t => t.id === updatedTeacher.id);
    if (index !== -1) {
        teachers[index] = updatedTeacher;
        setData('teachers', teachers);
        addActivityLog('Teacher Mgmt', `Updated teacher: ${updatedTeacher.name}`);
    }
};

export const deleteTeacher = (teacherId: string): void => {
    let teachers = getTeachers();
    const teacherName = teachers.find(t => t.id === teacherId)?.name || 'Unknown';
    teachers = teachers.filter(t => t.id !== teacherId);
    setData('teachers', teachers);
    addActivityLog('Teacher Mgmt', `Deleted teacher: ${teacherName}`);
};

// --- New Professional Teacher Management Functions ---
export const assignTeacherToUnit = (gradeId: number, semesterId: string, unitId: string, teacherId: string | null): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    const semester = grade.semesters.find(s => s.id === semesterId);
    if (!semester) return;
    const unit = semester.units.find(u => u.id === unitId);
    if (unit) {
        unit.teacherId = teacherId || undefined; // Assign new ID or unassign by setting to undefined
        updateGrade(grade);
        const teacher = getTeachers().find(t => t.id === teacherId);
        addActivityLog('Teacher Assignment', `Assigned "${teacher?.name || 'Unassigned'}" to unit "${unit.title}".`);
    }
};

export const getUnitsForTeacher = (teacherId: string): { gradeName: string; unitTitle: string }[] => {
    const allGrades = getAllGrades();
    const assignedUnits: { gradeName: string; unitTitle: string }[] = [];
    allGrades.forEach(grade => {
        grade.semesters.forEach(semester => {
            semester.units.forEach(unit => {
                if (unit.teacherId === teacherId) {
                    assignedUnits.push({ gradeName: grade.name, unitTitle: unit.title });
                }
            });
        });
    });
    return assignedUnits;
};


// --- Notification Functions ---
export const getAllNotifications = (): Notification[] => getData<Notification>('notifications');

export const getNotificationsByUserId = (userId: string): Notification[] => {
    return getAllNotifications()
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>): void => {
    const allNotifications = getAllNotifications();
    const newNotification: Notification = {
        ...notificationData,
        id: `notif_${Date.now()}_${Math.random()}`,
        createdAt: new Date().toISOString(),
    };
    setData('notifications', [newNotification, ...allNotifications]);
};

export const updateNotification = (updatedNotification: Notification): void => {
    const allNotifications = getAllNotifications();
    const index = allNotifications.findIndex(n => n.id === updatedNotification.id);
    if (index !== -1) {
        allNotifications[index] = updatedNotification;
        setData('notifications', allNotifications);
    }
}

export const markNotificationAsRead = (notificationId: string): void => {
    const notification = getAllNotifications().find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
        updateNotification({ ...notification, isRead: true });
    }
};

export const markAllNotificationsAsRead = (userId: string): void => {
    const allNotifications = getAllNotifications();
    const userNotifications = allNotifications.filter(n => n.userId === userId && !n.isRead);
    if (userNotifications.length > 0) {
        const updatedNotifications = allNotifications.map(n => 
            (n.userId === userId && !n.isRead) ? { ...n, isRead: true } : n
        );
        setData('notifications', updatedNotifications);
    }
};

export const deleteNotification = (notificationId: string): void => {
    const allNotifications = getAllNotifications().filter(n => n.id !== notificationId);
    setData('notifications', allNotifications);
};

export const generateSubscriptionNotifications = (userId: string): void => {
    const userSubscriptions = getSubscriptionsByUserId(userId);
    const userNotifications = getNotificationsByUserId(userId);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    userSubscriptions.forEach(sub => {
        const endDate = new Date(sub.endDate);
        if (sub.status === 'Active' && endDate <= sevenDaysFromNow) {
            const existingNotification = userNotifications.find(
                n => n.type === 'subscription' && n.itemId === sub.id
            );

            if (!existingNotification) {
                const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const title = daysLeft > 0 ? "تذكير بانتهاء الاشتراك" : "انتهى اشتراكك";
                const message = daysLeft > 1
                    ? `اشتراكك في "${sub.itemName}" سينتهي خلال ${daysLeft} أيام. جدده الآن!`
                    : daysLeft === 1
                    ? `اشتراكك في "${sub.itemName}" سينتهي غداً. جدده الآن!`
                    : `انتهى اشتراكك في "${sub.itemName}". جدده لمتابعة التعلم.`;

                addNotification({
                    userId: userId,
                    title: title,
                    message: message,
                    type: 'subscription',
                    isRead: false,
                    itemId: sub.id,
                    link: {
                        view: 'subscription'
                    }
                });
            }
        }
    });
};

// --- Prepaid Code Functions ---
export const generatePrepaidCode = (teacherId: string, plan: 'Monthly' | 'Annual'): string => {
    const codes = getData<PrepaidCode>('prepaidCodes');
    let newCodeStr: string;
    // Ensure code is unique
    do {
        newCodeStr = Array.from({ length: 3 }, () => Math.floor(1000 + Math.random() * 9000).toString()).join('-');
    } while (codes.some(c => c.code === newCodeStr));

    const newCode: PrepaidCode = {
        code: newCodeStr,
        teacherId,
        plan,
        isUsed: false,
        createdAt: new Date().toISOString(),
    };
    setData('prepaidCodes', [...codes, newCode]);
    const teacher = getTeachers().find(t => t.id === teacherId);
    addActivityLog('Code Generated', `Generated a ${plan} code for teacher "${teacher?.name || teacherId}".`);
    return newCodeStr;
};

export const validatePrepaidCode = (code: string): { success: boolean; message: string } => {
    const codes = getData<PrepaidCode>('prepaidCodes');
    const foundCode = codes.find(c => c.code === code.trim());

    if (!foundCode) {
        return { success: false, message: 'كود التفعيل غير صحيح.' };
    }
    if (foundCode.isUsed) {
        return { success: false, message: 'هذا الكود تم استخدامه بالفعل.' };
    }
    return { success: true, message: 'الكود صالح.' };
};

export const redeemPrepaidCode = (code: string, userId: string): { success: boolean, message: string } => {
    const codes = getData<PrepaidCode>('prepaidCodes');
    const codeIndex = codes.findIndex(c => c.code === code.trim());

    if (codeIndex === -1) {
        return { success: false, message: 'الرمز غير صحيح.' };
    }

    const foundCode = codes[codeIndex];
    if (foundCode.isUsed) {
        return { success: false, message: 'هذا الرمز تم استخدامه بالفعل.' };
    }

    const getUnitsByTeacherId = (teacherId: string): Unit[] => {
        const allGrades = getAllGrades();
        const teacherUnits: Unit[] = [];
        allGrades.forEach(grade => {
            grade.semesters.forEach(semester => {
                semester.units.forEach(unit => {
                    if (unit.teacherId === teacherId) {
                        teacherUnits.push(unit);
                    }
                });
            });
        });
        return teacherUnits;
    };
    
    const teacherUnits = getUnitsByTeacherId(foundCode.teacherId);
    if (teacherUnits.length === 0) {
        return { success: false, message: 'لا توجد مواد متاحة لهذا المعلم حاليًا.' };
    }

    teacherUnits.forEach(unit => {
        createOrUpdateSubscription(userId, foundCode.plan, 'Active', unit.id, unit.title, 'unit');
    });

    foundCode.isUsed = true;
    foundCode.usedByUserId = userId;
    foundCode.usedAt = new Date().toISOString();
    codes[codeIndex] = foundCode;
    setData('prepaidCodes', codes);

    const teacher = getTeachers().find(t => t.id === foundCode.teacherId);
    addActivityLog('Code Redeemed', `User ID ${userId} redeemed a code for ${teacher?.name || 'teacher'}.`);

    return { success: true, message: `تم تفعيل اشتراكك بنجاح في جميع مواد أ. ${teacher?.name || ''}!` };
};

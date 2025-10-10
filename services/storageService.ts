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
  StudentQuestion,
  QuizAttempt,
  PlatformSettings,
} from '../types';
import { DEMO_ADMIN_IDENTIFIER, DEMO_ADMIN_PASSWORD, DEMO_STUDENT_IDENTIFIER, DEMO_STUDENT_PASSWORD } from '../constants';

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
  { id: '1', name: 'طالب تجريبي', email: DEMO_STUDENT_IDENTIFIER, phone: '+201000000001', password: DEMO_STUDENT_PASSWORD, guardianPhone: '+201100000001', grade: 10, role: Role.STUDENT, subscriptionId: 'sub1' },
  { id: '2', name: 'طالبة متفوقة', email: 'student2@demo.com', phone: '+201000000002', password: '5678', guardianPhone: '+201100000002', grade: 11, role: Role.STUDENT, subscriptionId: 'sub2' },
  { id: '3', name: 'طالب مجتهد', email: 'student3@demo.com', phone: '+201000000003', password: '9012', guardianPhone: '+201100000003', grade: 12, track: 'Scientific', role: Role.STUDENT, subscriptionId: 'sub3' },
  { id: '4', name: 'مدير المنصة', email: DEMO_ADMIN_IDENTIFIER, phone: '+201200000001', password: DEMO_ADMIN_PASSWORD, guardianPhone: '', grade: 0, role: Role.ADMIN },
  { id: '5', name: 'مالك المنصة', email: 'jytt0jewellery@gmail.com', phone: '+201200000002', password: 'Hshsh555&HehgeUDNYf744&&$$@Jg28848', guardianPhone: '', grade: 0, role: Role.ADMIN },
];

const subscriptions: Subscription[] = [
  { id: 'sub1', userId: '1', plan: 'Monthly', startDate: '2024-07-01', endDate: '2024-08-01', status: 'Active' },
  { id: 'sub2', userId: '2', plan: 'Quarterly', startDate: '2024-06-01', endDate: '2024-09-01', status: 'Active' },
  { id: 'sub3', userId: '3', plan: 'Annual', startDate: '2023-09-01', endDate: '2024-09-01', status: 'Expired' },
];

const grades: Grade[] = [
  // Middle School
  {
    id: 7, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_7', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle_school_math_units, 7, '1') },
      { id: 'sem2_7', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle_school_math_units, 7, '2') }
    ],
  },
  {
    id: 8, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_8', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle_school_math_units, 8, '1') },
      { id: 'sem2_8', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle_school_math_units, 8, '2') }
    ],
  },
  {
    id: 9, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_9', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle_school_math_units, 9, '1') },
      { id: 'sem2_9', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle_school_math_units, 9, '2') }
    ],
  },
  // Secondary School
  {
    id: 10, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_10', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec_1_math_units, 10, '1') },
      { id: 'sem2_10', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec_1_math_units, 10, '2') }
    ],
  },
  {
    id: 11, name: 'الصف الثاني الثانوي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_11', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec_2_math_units, 11, '1') },
      { id: 'sem2_11', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec_2_math_units, 11, '2') }
    ],
  },
  {
    id: 12, name: 'الصف الثالث الثانوي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_12', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec_3_math_units, 12, '1') },
      { id: 'sem2_12', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec_3_math_units, 12, '2') }
    ],
  },
];

// --- New Home Screen Data ---

const featuredCourses: Course[] = [
    { id: 'c1', title: 'كورس التفاضل والتكامل', subtitle: 'لطلاب الصف الثالث الثانوي', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 10, videoCount: 25, quizCount: 8 },
    { id: 'c2', title: 'كورس الجبر والهندسة', subtitle: 'لطلاب الصف الأول الإعدادي', coverImage: 'https://i.ibb.co/R9m4M58/course2.png', fileCount: 8, videoCount: 20, quizCount: 5 },
    { id: 'c3', title: 'مراجعة ليلة الامتحان - هندسة', subtitle: 'لطلاب الصف الثالث الإعدادي', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 2, videoCount: 5, quizCount: 2 },
    { id: 'c4', title: 'تأسيس الرياضيات', subtitle: 'لجميع المراحل', coverImage: 'https://i.ibb.co/R9m4M58/course2.png', fileCount: 5, videoCount: 15, quizCount: 3 },
];

const featuredBooks: Book[] = [
    { id: 'b1', title: 'كتاب البروف في الجبر (3 ث)', teacherName: 'البروف وجدي الفخراني', teacherImage: 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 250, coverImage: 'https://i.ibb.co/yQxG4d8/book2.png' },
    { id: 'b2', title: 'كتاب البروف في الهندسة (1 إع)', teacherName: 'البروف وجدي الفخراني', teacherImage: 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 150, coverImage: 'https://i.ibb.co/q0V9bFN/book1.png' },
    { id: 'b3', title: 'ملزمة المراجعة النهائية', teacherName: 'البروف وجدي الفخراني', teacherImage: 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 100, coverImage: 'https://i.ibb.co/yQxG4d8/book2.png' },
];

const defaultPlatformSettings: PlatformSettings = {
    platformName: 'البروف وجدي الفخراني',
    heroTitle: 'أتقن الرياضيات مع البروف وجدي الفخراني',
    heroSubtitle: 'شرح مبسط وتمارين مكثفة لجميع فروع الرياضيات، لمساعدتك على تحقيق أعلى الدرجات.',
    heroButtonText: 'ابدأ رحلتك الآن',
    featuresTitle: 'لماذا تختار منصة البروف؟',
    featuresSubtitle: 'نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات في الرياضيات بأبسط الطرق.',
    features: [
        { title: "شرح تفصيلي ومبسط", description: "فيديوهات عالية الجودة تشرح كل جزء من المنهج بأسلوب سهل وممتع." },
        { title: "واجبات وامتحانات دورية", description: "اختبر فهمك وتابع مستواك من خلال واجبات وامتحانات إلكترونية." },
        { title: "وفر وقتك ومجهودك", description: "ذاكر من أي مكان وفي أي وقت يناسبك، وراجع الدروس أكثر من مرة." },
        { title: "متابعة مستمرة وذكية", description: "نظام متكامل لمتابعة تقدمك الدراسي وتحديد نقاط القوة والضعف." },
    ],
    footerDescription: 'منصة متخصصة في مادة الرياضيات تهدف إلى تقديم أفضل المحتويات التعليمية لطلاب المرحلتين الإعدادية والثانوية.',
    contactPhone: '+20 123 456 7890',
    contactFacebookUrl: '#',
    contactYoutubeUrl: '#',
};


const activityLogs: ActivityLog[] = [];
const accessTokens: AccessToken[] = [];
const subscriptionRequests: SubscriptionRequest[] = [];
const studentQuestions: StudentQuestion[] = [];
const quizAttempts: QuizAttempt[] = [];
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
  if (!localStorage.getItem('users')) {
    setData('users', users);
    setData('subscriptions', subscriptions);
    setData('grades', grades);
    setData('activityLogs', activityLogs);
    setData('accessTokens', accessTokens);
    setData('subscriptionRequests', subscriptionRequests);
    setData('featuredCourses', featuredCourses);
    setData('featuredBooks', featuredBooks);
    setData('studentQuestions', studentQuestions);
    setData('quizAttempts', quizAttempts);
    setData('userProgress', userProgress);
  }
  if (!localStorage.getItem('platformSettings')) {
      setData('platformSettings', defaultPlatformSettings);
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

export const addSubscriptionRequest = (userId: string, userName: string, plan: 'Monthly' | 'Quarterly' | 'Annual', paymentFromNumber: string): void => {
    const requests = getSubscriptionRequests();
    const newRequest: SubscriptionRequest = {
        id: `req-${Date.now()}`,
        userId,
        userName,
        plan,
        paymentFromNumber,
        status: 'Pending',
        createdAt: new Date().toISOString(),
    };
    setData('subscriptionRequests', [newRequest, ...requests]);
    addActivityLog('Subscription Request', `User "${userName}" requested a ${plan} plan from number ${paymentFromNumber}.`);
};

export const updateSubscriptionRequest = (updatedRequest: SubscriptionRequest): void => {
    let requests = getSubscriptionRequests();
    const index = requests.findIndex(r => r.id === updatedRequest.id);
    if (index !== -1) {
        requests[index] = updatedRequest;
        setData('subscriptionRequests', requests);
    }
};

export const activateSubscription = (userId: string, plan: 'Monthly' | 'Quarterly' | 'Annual'): void => {
    const allSubscriptions = getAllSubscriptions();
    const existingSubIndex = allSubscriptions.findIndex(s => s.userId === userId);

    const startDate = new Date();
    let endDate = new Date(startDate);

    switch (plan) {
        case 'Monthly':
            endDate.setMonth(startDate.getMonth() + 1);
            break;
        case 'Quarterly':
            endDate.setMonth(startDate.getMonth() + 3);
            break;
        case 'Annual':
            endDate.setFullYear(startDate.getFullYear() + 1);
            break;
    }
    
    const newSubscription: Subscription = {
        id: `sub-${userId}-${Date.now()}`,
        userId,
        plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'Active',
    };
    
    if (existingSubIndex !== -1) {
        allSubscriptions[existingSubIndex] = newSubscription;
    } else {
        allSubscriptions.push(newSubscription);
    }
    setData('subscriptions', allSubscriptions);
    const user = getData<User>('users').find(u => u.id === userId);
    if (user) {
        addActivityLog('Subscription Activated', `Subscription for "${user.name}" has been activated.`);
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

// --- Student Question Functions ---
export const getStudentQuestionsByUserId = (userId: string): StudentQuestion[] => {
    const questions = getData<StudentQuestion>('studentQuestions');
    return questions.filter(q => q.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAllStudentQuestions = (): StudentQuestion[] => {
    const questions = getData<StudentQuestion>('studentQuestions');
    return questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPendingStudentQuestionCount = (): number => {
    return getAllStudentQuestions().filter(q => q.status === 'Pending').length;
};

export const addStudentQuestion = (userId: string, userName: string, questionText: string): void => {
    const questions = getData<StudentQuestion>('studentQuestions');
    const newQuestion: StudentQuestion = {
        id: `q_${Date.now()}`,
        userId,
        userName,
        questionText,
        answerText: null,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        answeredAt: null,
    };
    setData('studentQuestions', [newQuestion, ...questions]);
    addActivityLog('Question Asked', `User "${userName}" asked a question.`);
};

export const answerStudentQuestion = (questionId: string, answerText: string): void => {
    const questions = getData<StudentQuestion>('studentQuestions');
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
        questions[questionIndex] = {
            ...questions[questionIndex],
            answerText,
            status: 'Answered',
            answeredAt: new Date().toISOString(),
        };
        setData('studentQuestions', questions);
        addActivityLog('Question Answered', `Admin answered a question from "${questions[questionIndex].userName}".`);
    }
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
    return data ? JSON.parse(data) : defaultPlatformSettings;
};

export const updatePlatformSettings = (settings: PlatformSettings): void => {
    setData('platformSettings', settings);
    addActivityLog('Platform Settings', 'Updated welcome page and footer content.');
};

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
  FeaturedTeacher,
  Course,
  Book,
} from '../types';
import { DEMO_ADMIN_CODE, DEMO_ADMIN_USERNAME, DEMO_STUDENT_CODE, DEMO_STUDENT_USERNAME } from '../constants';

// --- New Curriculum Data Generation ---

const createPlaceholderLessons = (): Lesson[] => ([
  { id: `l_exp_${Date.now()}_${Math.random()}`, title: 'شرح الدرس الأول', type: LessonType.EXPLANATION, content: 'dQw4w9WgXcQ', isCompleted: false },
  { id: `l_hw_${Date.now()}_${Math.random()}`, title: 'واجب الدرس الأول', type: LessonType.HOMEWORK, content: '', questions: [], isCompleted: false },
]);

const createUnitsFromSubjects = (subjects: string[], gradeId: number, semesterId: string): Unit[] => subjects.map((subject, i) => ({
  id: `unit_${gradeId}_${semesterId}_${i}`,
  title: subject,
  lessons: createPlaceholderLessons()
}));

// --- Subject Lists ---
const middle1_subjects = ['لغة عربية', 'لغة إنجليزية', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'تربية دينية', 'كمبيوتر وتكنولوجيا معلومات', 'تربية فنية', 'تربية موسيقية', 'تربية رياضية'];
const middle3_subjects = ['لغة عربية', 'لغة إنجليزية', 'رياضيات', 'علوم', 'دراسات اجتماعية', 'تربية دينية', 'كمبيوتر'];
const sec1_subjects = ['لغة عربية', 'لغة إنجليزية', 'لغة ثانية', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'تاريخ', 'جغرافيا', 'فلسفة ومنطق', 'تربية دينية', 'كمبيوتر', 'تربية وطنية'];
const sec2_subjects = ['لغة عربية', 'لغة إنجليزية', 'لغة ثانية', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'تاريخ', 'جغرافيا', 'فلسفة ومنطق', 'علم نفس', 'تربية دينية', 'تربية وطنية'];
const sec3_subjects = ['لغة عربية', 'لغة إنجليزية', 'لغة ثانية', 'أحياء', 'كيمياء', 'فيزياء', 'جيولوجيا وعلوم البيئة', 'رياضيات تطبيقية', 'رياضيات بحتة', 'تاريخ', 'جغرافيا', 'علم نفس واجتماع', 'فلسفة ومنطق'];

// Mock Data
const users: User[] = [
  { id: '1', name: DEMO_STUDENT_USERNAME, code: DEMO_STUDENT_CODE, grade: 10, role: Role.STUDENT, subscriptionId: 'sub1' },
  { id: '2', name: 'طالبة متفوقة', code: '5678', grade: 11, role: Role.STUDENT, subscriptionId: 'sub2' },
  { id: '3', name: 'طالب مجتهد', code: '9012', grade: 12, role: Role.STUDENT, subscriptionId: 'sub3' },
  { id: '4', name: DEMO_ADMIN_USERNAME, code: DEMO_ADMIN_CODE, grade: 0, role: Role.ADMIN },
  { id: '5', name: 'مالك المنصة', email: 'jytt0jewellery@gmail.com', code: 'Hshsh555&HehgeUDNYf744&&$$@Jg28848', grade: 0, role: Role.ADMIN },
  { id: '6', name: 'محمد', email: 'mohammed.k221m@gmail.com', code: 'Hshsh555&HehgeUDNYf744&&$$@Jg28848', grade: 10, role: Role.STUDENT, subscriptionId: 'sub4' },
];

const subscriptions: Subscription[] = [
  { id: 'sub1', userId: '1', plan: 'Monthly', startDate: '2024-07-01', endDate: '2024-08-01', status: 'Active' },
  { id: 'sub2', userId: '2', plan: 'Quarterly', startDate: '2024-06-01', endDate: '2024-09-01', status: 'Active' },
  { id: 'sub3', userId: '3', plan: 'Annual', startDate: '2023-09-01', endDate: '2024-09-01', status: 'Expired' },
  { id: 'sub4', userId: '6', plan: 'Monthly', startDate: '2024-07-15', endDate: '2024-08-15', status: 'Active' },
];

const grades: Grade[] = [
  // Middle School
  {
    id: 7, name: 'الصف الأول الإعدادي', ordinal: '1st', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_7', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle1_subjects, 7, '1') },
      { id: 'sem2_7', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle1_subjects, 7, '2') }
    ],
  },
  {
    id: 8, name: 'الصف الثاني الإعدادي', ordinal: '2nd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_8', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle1_subjects, 8, '1') },
      { id: 'sem2_8', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle1_subjects, 8, '2') }
    ],
  },
  {
    id: 9, name: 'الصف الثالث الإعدادي', ordinal: '3rd', level: 'Middle', levelAr: 'الإعدادي',
    semesters: [
      { id: 'sem1_9', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(middle3_subjects, 9, '1') },
      { id: 'sem2_9', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(middle3_subjects, 9, '2') }
    ],
  },
  // Secondary School
  {
    id: 10, name: 'الصف الأول الثانوي', ordinal: '1st', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_10', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec1_subjects, 10, '1') },
      { id: 'sem2_10', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec1_subjects, 10, '2') }
    ],
  },
  {
    id: 11, name: 'الصف الثاني الثانوي', ordinal: '2nd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_11', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec2_subjects, 11, '1') },
      { id: 'sem2_11', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec2_subjects, 11, '2') }
    ],
  },
  {
    id: 12, name: 'الصف الثالث الثانوي', ordinal: '3rd', level: 'Secondary', levelAr: 'الثانوي',
    semesters: [
      { id: 'sem1_12', title: 'الفصل الدراسي الأول', units: createUnitsFromSubjects(sec3_subjects, 12, '1') },
      { id: 'sem2_12', title: 'الفصل الدراسي الثاني', units: createUnitsFromSubjects(sec3_subjects, 12, '2') }
    ],
  },
];

// --- New Home Screen Data ---

const featuredTeachers: FeaturedTeacher[] = [
    { id: 't1', name: 'كريم فكري', subject: 'اللغة الإنجليزية', imageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png' },
    { id: 't2', name: 'حسين الجبلاوي', subject: 'اللغة الفرنسية', imageUrl: 'https://i.ibb.co/c2j3G55/teacher2.png' },
    { id: 't3', name: 'ماجد المهندس', subject: 'الفيزياء', imageUrl: 'https://i.ibb.co/3Wf4QYf/teacher3.png' },
    { id: 't4', name: 'إسماعيل السيد', subject: 'الأحياء', imageUrl: 'https://i.ibb.co/pwnLz3S/teacher4.png' },
    { id: 't5', name: 'أحمد مدحي', subject: 'الكيمياء', imageUrl: 'https://i.ibb.co/z5pW7P6/teacher5.png' },
];

const featuredCourses: Course[] = [
    { id: 'c1', title: 'UNIT 1 PART 1', subtitle: 'الحصة 3 - الصف الثالث الثانوي', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 1, videoCount: 2, quizCount: 1 },
    { id: 'c2', title: 'Unit 1 part 3', subtitle: 'الحصة 3 - الصف الثالث الثانوي', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 2, videoCount: 1, quizCount: 1 },
    { id: 'c3', title: 'Writing Skills 3', subtitle: 'الحصة 5 - الصف الأول الثانوي', coverImage: 'https://i.ibb.co/g7jCg0D/course1.png', fileCount: 0, videoCount: 2, quizCount: 0 },
    { id: 'c4', title: 'حصة 5 (ت)', subtitle: 'الحصة 5 - الصف الأول الثانوي', coverImage: 'https://i.ibb.co/R9m4M58/course2.png', fileCount: 0, videoCount: 2, quizCount: 0 },
];

const featuredBooks: Book[] = [
    { id: 'b1', title: 'كتاب الترم الأول - فرنساوي (3 ث)', teacherName: 'حسين الجبلاوي', teacherImage: 'https://i.ibb.co/c2j3G55/teacher2.png', price: 285, coverImage: 'https://i.ibb.co/q0V9bFN/book1.png' },
    { id: 'b2', title: 'كتاب الترم الأول - فرنساوي (3 ث)', teacherName: 'حسين الجبلاوي', teacherImage: 'https://i.ibb.co/c2j3G55/teacher2.png', price: 285, coverImage: 'https://i.ibb.co/q0V9bFN/book1.png' },
    { id: 'b3', title: 'كتاب الشرح والأسئلة', teacherName: 'كريم فكري', teacherImage: 'https://i.ibb.co/bJCmnz5/teacher1.png', price: 300, coverImage: 'https://i.ibb.co/yQxG4d8/book2.png' },
];


const activityLogs: ActivityLog[] = [];
const accessTokens: AccessToken[] = [];
const subscriptionRequests: SubscriptionRequest[] = [];

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
    setData('featuredTeachers', featuredTeachers);
    setData('featuredCourses', featuredCourses);
    setData('featuredBooks', featuredBooks);
  }
};

export const getUserByCredentials = (identifier: string, code: string): User | undefined => {
  const allUsers = getData<User>('users');
  const identifierTrimmed = identifier.trim();
  const codeTrimmed = code.trim();
  
  // Allow login with either name or a case-insensitive email.
  return allUsers.find(u => 
    (u.name.trim() === identifierTrimmed || (u.email && u.email.trim().toLowerCase() === identifierTrimmed.toLowerCase())) && 
    u.code.trim() === codeTrimmed
  );
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
export const getFeaturedTeachers = (): FeaturedTeacher[] => getData<FeaturedTeacher>('featuredTeachers');
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

export const addLessonToUnit = (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id' | 'isCompleted'>): void => {
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
        isCompleted: false,
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

export const setLessonCompleted = (gradeId: number, lessonId: string, completed: boolean): void => {
    const grade = getGradeById(gradeId);
    if (!grade) return;
    
    let lessonFound = false;
    for (const semester of grade.semesters) {
        for (const unit of semester.units) {
            const lessonToUpdate = unit.lessons.find(l => l.id === lessonId);
            if (lessonToUpdate) {
                lessonToUpdate.isCompleted = completed;
                lessonFound = true;
                break;
            }
        }
        if (lessonFound) break;
    }

    if (lessonFound) {
        updateGrade(grade);
    }
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

// --- Featured Teacher Functions ---
export const addFeaturedTeacher = (teacher: Omit<FeaturedTeacher, 'id'>): void => {
    const teachers = getData<FeaturedTeacher>('featuredTeachers');
    const newTeacher: FeaturedTeacher = {
        ...teacher,
        id: `t_${Date.now()}`
    };
    setData('featuredTeachers', [...teachers, newTeacher]);
    addActivityLog('Home Mgmt', `Added teacher: ${newTeacher.name}`);
};

export const updateFeaturedTeacher = (updatedTeacher: FeaturedTeacher): void => {
    const teachers = getData<FeaturedTeacher>('featuredTeachers');
    const index = teachers.findIndex(t => t.id === updatedTeacher.id);
    if (index !== -1) {
        teachers[index] = updatedTeacher;
        setData('featuredTeachers', teachers);
        addActivityLog('Home Mgmt', `Updated teacher: ${updatedTeacher.name}`);
    }
};

export const deleteFeaturedTeacher = (teacherId: string): void => {
    let teachers = getData<FeaturedTeacher>('featuredTeachers');
    const teacherName = teachers.find(t => t.id === teacherId)?.name || 'Unknown';
    teachers = teachers.filter(t => t.id !== teacherId);
    setData('featuredTeachers', teachers);
    addActivityLog('Home Mgmt', `Deleted teacher: ${teacherName}`);
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

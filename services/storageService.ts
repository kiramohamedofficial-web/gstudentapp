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
} from '../types';

// --- New Curriculum Data Generation ---

const createPlaceholderLessons = (): Lesson[] => ([
  { id: `l_exp_${Date.now()}_${Math.random()}`, title: 'شرح الدرس الأول', type: LessonType.EXPLANATION, content: '', isCompleted: false },
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
  { id: '1', name: 'طالب تجريبي', code: '1234', grade: 10, role: Role.STUDENT, subscriptionId: 'sub1' },
  { id: '2', name: 'طالبة متفوقة', code: '5678', grade: 11, role: Role.STUDENT, subscriptionId: 'sub2' },
  { id: '3', name: 'طالب مجتهد', code: '9012', grade: 12, role: Role.STUDENT, subscriptionId: 'sub3' },
  { id: '4', name: 'مدير المنصة', code: 'admin', grade: 0, role: Role.ADMIN },
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

const activityLogs: ActivityLog[] = [];
const accessTokens: AccessToken[] = [];
const subscriptionRequests: SubscriptionRequest[] = [];

// Data Access Functions
export const initData = (): void => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    localStorage.setItem('grades', JSON.stringify(grades));
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
    localStorage.setItem('accessTokens', JSON.stringify(accessTokens));
    localStorage.setItem('subscriptionRequests', JSON.stringify(subscriptionRequests));
  }
};

const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setData = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};


export const getUserByCredentials = (name: string, code: string): User | undefined => {
  const allUsers = getData<User>('users');
  return allUsers.find(u => u.name === name && u.code === code);
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

export const addActivityLog = (action: string, details: string): void => {
    const logs = getData<ActivityLog>('activityLogs');
    const newLog: ActivityLog = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        action,
        details,
    };
    localStorage.setItem('activityLogs', JSON.stringify([newLog, ...logs]));
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
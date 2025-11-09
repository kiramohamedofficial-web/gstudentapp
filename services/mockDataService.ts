// NEW FILE
import { Role, User, Teacher, Grade, Semester, Unit, Lesson, LessonType, QuizQuestion, QuizType, Subscription, SubscriptionRequest, PlatformSettings, CartoonMovie, Reel, SupervisorProfile } from '../types';
import { DEMO_ADMIN_IDENTIFIER, DEMO_PROF_ADMIN_IDENTIFIER, DEMO_STUDENT_IDENTIFIER, DEMO_TEACHER_IDENTIFIER, DEMO_SUPERVISOR_IDENTIFIER } from '../constants';

// --- HELPERS ---
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// --- RAW DATA ---
const firstNames = ["أحمد", "محمد", "علي", "محمود", "عمر", "خالد", "يوسف", "سارة", "فاطمة", "مريم", "عائشة", "نور", "هدى", "زينب"];
const lastNames = ["المصري", "السيد", "عبدالله", "حسن", "علي", "الشريف", "طارق", "صلاح"];
const subjects = ["الجبر", "الهندسة", "حساب المثلثات", "التفاضل والتكامل", "الديناميكا", "الإحصاء"];
const youtubeVideoIds = ['_Uv9Vn3s_pA', 'h3gEkwh_S7A', 'dQw4w9WgXcQ', '3JZ_D3ELwOQ'];

// --- GENERATORS ---

export const generateTeachers = (count: number): Teacher[] => {
    const teachers: Teacher[] = [];
    for (let i = 0; i < count; i++) {
        teachers.push({
            id: `teacher-${i + 1}`,
            name: `أ. ${randomItem(firstNames)} ${randomItem(lastNames)}`,
            subject: 'الرياضيات',
            imageUrl: `https://i.pravatar.cc/150?u=teacher${i}`,
            teachingLevels: ['Middle', 'Secondary'],
            teachingGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        });
    }
    return teachers;
};

export let mockTeachers = generateTeachers(50);

export const generateCurriculum = (teachers: Teacher[]): Grade[] => {
    const grades: Grade[] = [
        { id: 1, name: 'الصف الأول الإعدادي', level: 'Middle', levelAr: 'الإعدادي', semesters: [] },
        { id: 2, name: 'الصف الثاني الإعدادي', level: 'Middle', levelAr: 'الإعدادي', semesters: [] },
        { id: 3, name: 'الصف الثالث الإعدادي', level: 'Middle', levelAr: 'الإعدادي', semesters: [] },
        { id: 4, name: 'الصف الأول الثانوي', level: 'Secondary', levelAr: 'الثانوي', semesters: [] },
        { id: 5, name: 'الصف الثاني الثانوي - علمي', level: 'Secondary', levelAr: 'الثانوي', semesters: [] },
        { id: 6, name: 'الصف الثاني الثانوي - أدبي', level: 'Secondary', levelAr: 'الثانوي', semesters: [] },
    ];

    grades.forEach(grade => {
        const semesters: Semester[] = [{ id: `s${grade.id}-1`, title: 'الفصل الدراسي الأول', units: [], grade_id: grade.id }, { id: `s${grade.id}-2`, title: 'الفصل الدراسي الثاني', units: [], grade_id: grade.id }];
        semesters.forEach(semester => {
            const units: Unit[] = [];
            for (let i = 0; i < 4; i++) {
                const unit: Unit = {
                    id: `unit-${grade.id}-${semester.id.slice(-1)}-${i}`,
                    title: `${randomItem(subjects)} - الوحدة ${i + 1}`,
                    lessons: [],
                    teacherId: randomItem(teachers).id,
                    track: 'All',
                    semester_id: semester.id,
                };
                const lessons: Lesson[] = [];
                for (let j = 0; j < 5; j++) {
                    const baseTitle = `الدرس ${j + 1}`;
                    lessons.push({
                        id: `lesson-${unit.id}-${j}-exp`, title: `${baseTitle} - شرح`, type: LessonType.EXPLANATION, content: randomItem(youtubeVideoIds)
                    });
                    const questions: QuizQuestion[] = Array.from({ length: 3 }, (_, k) => ({
                        questionText: `ما هو حل السؤال رقم ${k + 1} في واجب ${baseTitle}?`,
                        options: ['الإجابة أ', 'الإجابة ب', 'الإجابة ج', 'الإجابة د'],
                        correctAnswerIndex: randomInt(0, 3)
                    }));
                    lessons.push({
                        id: `lesson-${unit.id}-${j}-hw`, title: `${baseTitle} - واجب`, type: LessonType.HOMEWORK, quizType: QuizType.MCQ, questions
                    });
                }
                unit.lessons = lessons;
                units.push(unit);
            }
            semester.units = units;
        });
        grade.semesters = semesters;
    });
    return grades;
};

export let mockCurriculum = generateCurriculum(mockTeachers);

export const generateStudents = (count: number, grades: Grade[]): User[] => {
    const students: User[] = [];
    for (let i = 0; i < count; i++) {
        const grade = randomItem(grades);
        students.push({
            id: `student-${i + 1}`,
            name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
            email: `student${i + 1}@demo.com`,
            phone: `+2010${randomInt(10000000, 99999999)}`,
            guardianPhone: `+2011${randomInt(10000000, 99999999)}`,
            grade: grade.id,
            gradeData: grade,
            track: 'All',
            role: Role.STUDENT,
        });
    }
    // Add the main demo student
    students[0] = { ...students[0], id: 'demo-student-id', email: DEMO_STUDENT_IDENTIFIER, name: 'طالب تجريبي' };
    return students;
};

export let mockStudents = generateStudents(500, mockCurriculum);

export const generateSubscriptions = (students: User[], teachers: Teacher[]): Subscription[] => {
    const subs: Subscription[] = [];
    for (let i = 0; i < 200; i++) {
        const student = randomItem(students);
        const startDate = randomDate(new Date(2023, 0, 1), new Date());
        const endDate = addDays(startDate, randomItem([30, 90, 365]));
        subs.push({
            id: `sub-${i}`,
            userId: student.id,
            plan: randomItem(['Monthly', 'Quarterly', 'Annual']),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: endDate > new Date() ? 'Active' : 'Expired',
            teacherId: randomItem([...teachers, {id: ''} as any]).id || undefined, // some comprehensive
        });
    }
    return subs;
};

export let mockSubscriptions = generateSubscriptions(mockStudents, mockTeachers);

export const generateSubscriptionRequests = (students: User[]): SubscriptionRequest[] => {
    const requests: SubscriptionRequest[] = [];
    for (let i = 0; i < 30; i++) {
        const student = randomItem(students);
        requests.push({
            id: `req-${i}`,
            userId: student.id,
            userName: student.name,
            plan: randomItem(['Monthly', 'Quarterly']),
            paymentFromNumber: `010${randomInt(10000000, 99999999)}`,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            subjectName: randomItem(subjects),
        });
    }
    return requests;
};

export let mockSubscriptionRequests = generateSubscriptionRequests(mockStudents);

// --- STATIC MOCK DATA ---
export const mockPlatformSettings: PlatformSettings = {
    platformName: "Gstudent",
    heroTitle: "مستقبلك يبدأ من هنا",
    heroSubtitle: "منصة متخصصة في مادة الرياضيات لجميع صفوف المرحلتين الإعدادية والثانوية مع البروف وجدي الفخراني.",
    heroButtonText: "ابدأ رحلتك التعليمية",
    featuresTitle: "لماذا تختار منصتنا؟",
    featuresSubtitle: "نقدم لك تجربة تعليمية فريدة ومتكاملة تساعدك على تحقيق أفضل النتائج.",
    features: [
        { title: "شرح مبسط", description: "شرح تفصيلي ومبسط لجميع أجزاء المنهج." },
        { title: "متابعة مستمرة", description: "متابعة دورية لحل الواجبات والامتحانات." },
        { title: "تواصل مباشر", description: "إمكانية التواصل المباشر مع المدرس." },
    ],
    footerDescription: "منصة تعليمية رائدة في مادة الرياضيات.",
    contactPhone: "+201012345678",
    contactFacebookUrl: "https://facebook.com",
    contactYoutubeUrl: "https://youtube.com",
    monthlyPrice: 100,
    quarterlyPrice: 250,
    semiAnnuallyPrice: 450,
    annualPrice: 800,
    currency: "EGP",
    paymentNumbers: ["01012345678", "01112345678"],
    enabledSubscriptionModes: ['comprehensive', 'singleSubject'],
    announcementBanner: { text: "خصم 20% على الباقة السنوية لفترة محدودة!", enabled: true }
};

export const mockCartoonMovies: CartoonMovie[] = Array.from({ length: 10 }, (_, i) => ({
    id: `movie-${i}`,
    title: `فيلم كرتون ${i + 1}`,
    story: `قصة الفيلم رقم ${i + 1} وهي قصة شيقة وممتعة.`,
    posterUrl: `https://picsum.photos/seed/movie${i}/400/600`,
    downloadUrl: '#',
    downloadInstructions: '1. اضغط على الرابط.\n2. حمل الملف.',
    loadInstructions: '1. فك الضغط.\n2. شغل الفيديو.',
    instructionsThumbnailUrl: 'https://l.top4top.io/p_35939s82l0.png',
    isPublished: true,
    createdAt: new Date().toISOString(),
}));

export const mockReels: Reel[] = Array.from({ length: 15 }, (_, i) => ({
    id: `reel-${i}`,
    title: `ريل قصير ومفيد رقم ${i + 1}`,
    youtubeUrl: 'https://www.youtube.com/shorts/O_ie5k4kmnM',
    isPublished: true,
    createdAt: new Date().toISOString(),
}));

export const mockAdmins: User[] = [
    {
        id: 'demo-admin-id',
        name: 'مدير تجريبي',
        email: DEMO_ADMIN_IDENTIFIER,
        phone: '',
        guardianPhone: '',
        grade: null,
        role: Role.ADMIN,
    },
    {
        id: 'prof-admin-id',
        name: 'بروف وجدي',
        email: DEMO_PROF_ADMIN_IDENTIFIER,
        phone: '',
        guardianPhone: '',
        grade: null,
        role: Role.ADMIN,
    }
];

// Add demo users for teacher and supervisor
mockTeachers[0] = { ...mockTeachers[0], id: 'demo-teacher-id' };
export const mockTeacherUsers: User[] = [{
    id: 'demo-teacher-user-id',
    name: mockTeachers[0].name,
    email: DEMO_TEACHER_IDENTIFIER,
    phone: `+2012${randomInt(10000000, 99999999)}`,
    guardianPhone: '',
    grade: null,
    role: Role.TEACHER,
    teacherId: 'demo-teacher-id'
}];

export const mockSupervisors: SupervisorProfile[] = [{
    id: 'demo-supervisor-id',
    name: 'مشرف تجريبي',
    email: DEMO_SUPERVISOR_IDENTIFIER,
    phone: '',
    guardianPhone: '',
    grade: null,
    role: Role.SUPERVISOR,
    supervisor_teachers: [{ teachers: mockTeachers[1] }, { teachers: mockTeachers[2] }]
}];
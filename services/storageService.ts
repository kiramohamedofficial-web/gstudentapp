import React from 'react';
import {
  User, Role, Subscription, Grade, Teacher, Lesson, Unit, SubscriptionRequest,
  SubscriptionCode, Semester, QuizAttempt, ActivityLog, LessonType, PlatformSettings, Course, Book, StudentQuestion,
  CartoonMovie,
  SupervisorProfile,
  Reel,
  Session
} from '../types';
import { 
    mockTeachers, mockCurriculum, mockStudents, mockSubscriptions, mockSubscriptionRequests,
    mockPlatformSettings, mockCartoonMovies, mockReels, mockAdmins, mockTeacherUsers, mockSupervisors
} from './mockDataService';
import { DEMO_ADMIN_IDENTIFIER, DEMO_ADMIN_PASSWORD, DEMO_STUDENT_IDENTIFIER, DEMO_STUDENT_PASSWORD, DEMO_TEACHER_IDENTIFIER, DEMO_TEACHER_PASSWORD, DEMO_SUPERVISOR_IDENTIFIER, DEMO_SUPERVISOR_PASSWORD, DEMO_PROF_ADMIN_IDENTIFIER, DEMO_PROF_ADMIN_PASSWORD } from '../constants';


// =================================================================
// MOCK SUPABASE CLIENT & AUTHENTICATION
// =================================================================

// FIX: Define randomInt locally as it's not exported from mockDataService.
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// This replaces the actual Supabase client.
// FIX: Expanded Supabase mock to handle complex queries, channels, and prevent cascading errors in components.
const mockChannel = {
    on: function(event: string, config: any, callback: (payload: any) => void) {
        // Mock implementation, returning `this` for chaining
        return this;
    },
    subscribe: function(callback?: (status: string) => void) {
        if (callback) {
            callback('SUBSCRIBED');
        }
        return this; // for chaining
    },
    unsubscribe: function() {}
};

export const supabase = {
    channel: (name: string) => mockChannel,
    removeChannel: (channel: any) => {},
    from: (tableName: string) => ({
      select: (columns = '*') => {
        const queryBuilder = {
          _tableName: tableName,
          _filters: [] as any[],
          _limit: 0,
          _order: null as any,
          eq: function(column: string, value: any) {
            this._filters.push({ column, value, operator: 'eq' });
            return this;
          },
          in: function(column: string, values: any[]) {
            this._filters.push({ column, values, operator: 'in' });
            return this;
          },
          not: function(column: string, operator: string, value: any) {
             this._filters.push({ column, value, operator: 'not' });
             return this;
          },
          gte: function(column: string, value: any) {
              this._filters.push({ column, value, operator: 'gte' });
              return this;
          },
          order: function(column: string, options: any) {
            this._order = { column, ...options };
            return this;
          },
          single: function() {
              if(this._tableName === 'profiles') {
                   const idFilter = this._filters.find(f => f.column === 'id');
                   const allUsers = [...mockStudents, ...mockAdmins, ...mockTeacherUsers, ...mockSupervisors];
                   const user = allUsers.find(u => u.id === idFilter.value);
                   return Promise.resolve({ data: user || null, error: null });
              }
              if(this._tableName === 'subscription_codes') {
                   return Promise.resolve({ data: { times_used: 1, max_uses: 1 }, error: null });
              }
              return Promise.resolve({ data: {}, error: null });
          },
          // Make it thenable to be used with await
          then: function(resolve: any, reject: any) {
              if (this._tableName === 'profiles') {
                  const inFilter = this._filters.find(f => f.operator === 'in');
                  if(inFilter) {
                    const allUsers = [...mockStudents, ...mockAdmins, ...mockTeacherUsers, ...mockSupervisors];
                    resolve({ data: allUsers.filter(u => inFilter.values.includes(u.id)), error: null });
                  } else {
                    const teacherRoleFilter = this._filters.find(f => f.column === 'role' && f.value === 'teacher');
                    const teacherIdNotNullFilter = this._filters.find(f => f.column === 'teacher_id' && f.operator === 'not');
                    if (teacherRoleFilter && teacherIdNotNullFilter) {
                         resolve({ data: mockTeacherUsers.map(u => ({ teacher_id: u.teacherId })), error: null });
                    }
                  }
              } else if (this._tableName === 'user_sessions') {
                  resolve({data: mockStudents.slice(0,5).map(s=>({user_id: s.id})), error: null})
              } else if (this._tableName === 'grades') {
                  resolve({ data: mockCurriculum, error: null });
              }
              resolve({ data: [], error: null });
          }
        };
        return queryBuilder;
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null })
      }),
      insert: (data: any) => Promise.resolve({ error: null })
    }),
    auth: {
      admin: {
        deleteUser: (id: string) => Promise.resolve({ error: null }),
        updateUserById: (id: string, updates: any) => Promise.resolve({ error: null })
      }
    }
};

let currentSession: { user: User } | null = null;
let authStateChangeCallback: ((event: string, session: Partial<Session> | null) => void) | null = null;

export function getOrCreateDeviceId(): string {
    return 'mock-device-id';
}

export const signUp = async (userData: any) => {
    const newUser: User = {
        id: `student-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        guardianPhone: userData.guardianPhone,
        grade: userData.grade,
        track: userData.track,
        role: Role.STUDENT,
    };
    mockStudents.push(newUser);
    // Simulate auto-login after sign up
    currentSession = { user: newUser };
     if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_IN', { user: { id: newUser.id, email: newUser.email } });
    }
    return { data: { user: { id: newUser.id } }, error: null };
};

export const signIn = async (identifier: string, password: string) => {
    let userToLogin: User | null = null;
    if (identifier === DEMO_STUDENT_IDENTIFIER && password === DEMO_STUDENT_PASSWORD) {
        userToLogin = mockStudents[0];
    } else if (identifier === DEMO_ADMIN_IDENTIFIER && password === DEMO_ADMIN_PASSWORD) {
        userToLogin = mockAdmins[0];
    } else if (identifier === DEMO_PROF_ADMIN_IDENTIFIER && password === DEMO_PROF_ADMIN_PASSWORD) {
        userToLogin = mockAdmins.find(a => a.email === DEMO_PROF_ADMIN_IDENTIFIER) || null;
    } else if (identifier === DEMO_TEACHER_IDENTIFIER && password === DEMO_TEACHER_PASSWORD) {
        userToLogin = mockTeacherUsers[0];
    } else if (identifier === DEMO_SUPERVISOR_IDENTIFIER && password === DEMO_SUPERVISOR_PASSWORD) {
        userToLogin = mockSupervisors[0];
    }

    if (userToLogin) {
        currentSession = { user: userToLogin };
        if (authStateChangeCallback) {
            authStateChangeCallback('SIGNED_IN', { user: { id: userToLogin.id, email: userToLogin.email } });
        }
        return { data: { user: { id: userToLogin.id } }, error: null };
    } else {
        return { data: null, error: { message: 'بيانات الدخول غير صحيحة.' } };
    }
};

export const signOut = async () => {
    currentSession = null;
    if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_OUT', null);
    }
    return Promise.resolve({ error: null });
};

export const getSession = async () => {
    if (currentSession) {
        return { data: { session: { user: { id: currentSession.user.id } } } };
    }
    return { data: { session: null } };
};

export const onAuthStateChange = (callback: (event: string, session: Partial<Session> | null) => void) => {
    authStateChangeCallback = callback;
    // Immediately call with current state to simulate initial load
    setTimeout(() => {
        if (currentSession) {
            callback('INITIAL_SESSION', { user: { id: currentSession.user.id } });
        } else {
            callback('INITIAL_SESSION', null);
        }
    }, 100);

    return { data: { subscription: { unsubscribe: () => { authStateChangeCallback = null; } } } };
};

// FIX: Ensure mock functions return the expected object shape.
export const sendPasswordResetEmail = async (email: string) => Promise.resolve({ error: null });
export const updateUserPassword = async (password: string) => Promise.resolve({ error: null });
export const deleteSelf = async () => Promise.resolve({ error: null });

// =================================================================
// MOCKED DATA FETCHING & MANIPULATION
// =================================================================

// --- Users, Teachers, Admins ---
export async function getAllUsers(): Promise<User[]> { return Promise.resolve([...mockStudents, ...mockAdmins, ...mockTeacherUsers, ...mockSupervisors]); }
export async function getUserById(userId: string) { 
    const all = [...mockStudents, ...mockAdmins, ...mockTeacherUsers, ...mockSupervisors];
    return Promise.resolve({ data: all.find(u => u.id === userId) || null, error: null });
}
export async function getUserByTeacherId(teacherId: string) {
    return Promise.resolve({ data: mockTeacherUsers.find(u => u.teacherId === teacherId) || null, error: null });
}
export async function getAllStudents() { return Promise.resolve({ data: mockStudents, error: null }); }
export async function getCurrentUser() {
    if (currentSession) {
        const user = (await getAllUsers()).find(u => u.id === currentSession!.user.id);
        const gradeData = getGradeByIdSync(user?.grade || null);
        return { data: { ...user, gradeData }, error: null };
    }
    return { data: null, error: 'No user logged in' };
}
export const getProfile = getCurrentUser;
export async function getAllTeachers(): Promise<Teacher[]> { return Promise.resolve(mockTeachers); }
export async function getTeacherById(teacherId: string): Promise<Teacher | null> { return Promise.resolve(mockTeachers.find(t => t.id === teacherId) || null); }
export async function getSupervisorsWithTeachers(): Promise<SupervisorProfile[]> { return Promise.resolve(mockSupervisors); }


// --- Curriculum ---
export let curriculumCache: { grades: Grade[] } | null = { grades: mockCurriculum };
export const initData = async (): Promise<void> => {
    curriculumCache = { grades: mockCurriculum };
    return Promise.resolve();
};
export async function getAllGrades(): Promise<Grade[]> { return Promise.resolve(mockCurriculum); }
export const getGradesForSelection = (): {id: number, name: string, level: 'Middle' | 'Secondary', levelAr: 'الإعدادي' | 'الثانوي'}[] => (curriculumCache?.grades || []).map(g => ({ id: g.id, name: g.name, level: g.level, levelAr: g.levelAr }));
export const getGradeByIdSync = (gradeId: number | null): Grade | undefined => {
    if (gradeId === null) return undefined;
    return curriculumCache?.grades.find(g => g.id === gradeId);
};
export async function getLessonsByUnit(unitId: string): Promise<Lesson[]> {
    for (const grade of mockCurriculum) {
        for (const semester of grade.semesters) {
            const unit = semester.units.find(u => u.id === unitId);
            if (unit) return Promise.resolve(unit.lessons);
        }
    }
    return Promise.resolve([]);
}
export async function getUnitsForSemester(gradeId: number, semesterId: string): Promise<Unit[]> {
    const grade = mockCurriculum.find(g => g.id === gradeId);
    const semester = grade?.semesters.find(s => s.id === semesterId);
    return Promise.resolve(semester?.units || []);
}


// --- Subscriptions ---
export async function getAllSubscriptions(): Promise<Subscription[]> { return Promise.resolve(mockSubscriptions); }
export async function getSubscriptionsByTeacherId(teacherId: string): Promise<Subscription[]> { return Promise.resolve(mockSubscriptions.filter(s => s.teacherId === teacherId)); }
export async function getUserSubscriptions(userId: string) { return Promise.resolve({ data: mockSubscriptions.filter(s => s.userId === userId), error: null }); }
export async function getAllSubscriptionRequests(): Promise<SubscriptionRequest[]> { return Promise.resolve(mockSubscriptionRequests); }
export async function getPendingSubscriptionRequestCount(): Promise<number> { return Promise.resolve(mockSubscriptionRequests.filter(r => r.status === 'Pending').length); }
export const createOrUpdateSubscription = async (userId: string, plan: Subscription['plan'], status: 'Active' | 'Expired', customEndDate?: string, teacherId?: string): Promise<{ error: Error | null }> => {
    const existingIndex = mockSubscriptions.findIndex(s => s.userId === userId && s.teacherId === teacherId);
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
    const newSub: Subscription = { id: `sub-${Date.now()}`, userId, plan, startDate: startDate.toISOString(), endDate: endDate.toISOString(), status, teacherId };
    if (existingIndex > -1) {
        mockSubscriptions[existingIndex] = newSub;
    } else {
        mockSubscriptions.push(newSub);
    }
    return Promise.resolve({ error: null });
};
export const addSubscriptionRequest = async (userId: string, userName: string, plan: SubscriptionRequest['plan'], paymentFromNumber: string, subjectName?: string, unitId?: string): Promise<void> => {
    mockSubscriptionRequests.push({ id: `req-${Date.now()}`, userId, userName, plan, paymentFromNumber, status: 'Pending', createdAt: new Date().toISOString(), subjectName, unitId });
    return Promise.resolve();
};
export const updateSubscriptionRequest = async (updatedRequest: SubscriptionRequest): Promise<void> => {
    const index = mockSubscriptionRequests.findIndex(r => r.id === updatedRequest.id);
    if (index > -1) mockSubscriptionRequests[index] = updatedRequest;
    return Promise.resolve();
};

// --- CRUD ---
export const updateUser = async (userId: string, updates: Partial<User>) => {
    const user = mockStudents.find(s => s.id === userId);
    if (user) Object.assign(user, updates);
    return Promise.resolve({ error: null });
};
export const deleteUser = async (id: string) => {
    // FIX: Mutate array in place to avoid reassigning an imported variable.
    const index = mockStudents.findIndex(s => s.id === id);
    if (index > -1) {
        mockStudents.splice(index, 1);
    }
    return Promise.resolve({ error: null });
};
export async function createTeacher(params: any) {
    const newTeacher: Teacher = {
        id: `teacher-${Date.now()}`,
        name: params.name,
        subject: params.subject,
        imageUrl: params.image_url,
        teachingLevels: params.teaching_levels,
        teachingGrades: params.teaching_grades,
    };
    mockTeachers.push(newTeacher);
    return Promise.resolve({ success: true, data: { teacher_id: newTeacher.id, user_id: `user-${Date.now()}` }, error: null });
}
export async function updateTeacher(teacherId: string, updates: any) {
    const index = mockTeachers.findIndex(t => t.id === teacherId);
    if (index > -1) {
        mockTeachers[index] = { ...mockTeachers[index], ...updates };
    }
    return Promise.resolve({ success: true, data: {}, error: null });
}
export async function deleteTeacher(teacherId: string) {
    // FIX: Mutate array in place to avoid reassigning an imported variable.
    const index = mockTeachers.findIndex(t => t.id === teacherId);
    if (index > -1) {
        mockTeachers.splice(index, 1);
    }
    return Promise.resolve({ success: true, error: null });
}

// --- Other ---
export async function getPlatformSettings(): Promise<PlatformSettings | null> { return Promise.resolve(mockPlatformSettings); }
export const uploadImage = async (file: File): Promise<string | null> => Promise.resolve('https://picsum.photos/400/600');
export const clearUserDevices = async (userId: string) => Promise.resolve({ error: null });
export const clearAllActiveSessions = async () => Promise.resolve({ error: null });
export const checkDbConnection = async () => Promise.resolve({ error: null });
export async function getStudentProgress(studentId: string): Promise<{lesson_id: string}[]> { return Promise.resolve([]); }
export async function getAllStudentProgress() { return Promise.resolve([]); }
export async function getAllQuizAttempts(): Promise<QuizAttempt[]> { return Promise.resolve([]); }
export async function getStudentQuizAttempts(studentId: string): Promise<QuizAttempt[]> { return Promise.resolve([]); }
export async function saveQuizAttempt(userId: string, lessonId: string, score: number, submittedAnswers: QuizAttempt['submittedAnswers'], timeTaken: number) { return Promise.resolve(); }
export async function generateSubscriptionCodes(options: any): Promise<SubscriptionCode[]> {
    const codes: SubscriptionCode[] = [];
    for (let i = 0; i < options.count; i++) {
        codes.push({ code: `GS-MOCK${randomInt(1000, 9999)}`, durationDays: options.durationDays, maxUses: 1, timesUsed: 0, usedByUserIds: [], createdAt: new Date().toISOString() });
    }
    return Promise.resolve(codes);
}
export const getSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => Promise.resolve(mockSubscriptions.find(s => s.userId === userId) || null);
export const getLatestQuizAttemptForLesson = async (userId: string, lessonId: string): Promise<QuizAttempt | null> => Promise.resolve(null);
export const markLessonComplete = async (userId: string, lessonId: string) => Promise.resolve();
export async function getPublishedCartoonMovies(): Promise<CartoonMovie[]> { return Promise.resolve(mockCartoonMovies.filter(m => m.isPublished)); }
export async function getAllCartoonMovies(): Promise<CartoonMovie[]> { return Promise.resolve(mockCartoonMovies); }
export async function addCartoonMovie(movie: any) { mockCartoonMovies.unshift({ ...movie, id: `movie-${Date.now()}`, createdAt: new Date().toISOString() }); return Promise.resolve({}); }
export async function updateCartoonMovie(id: string, updates: any) { const i = mockCartoonMovies.findIndex(m => m.id === id); if(i > -1) mockCartoonMovies[i] = {...mockCartoonMovies[i], ...updates}; return Promise.resolve({}); }
export async function deleteCartoonMovie(id: string) { 
    // FIX: Mutate array in place to avoid reassigning an imported variable.
    const index = mockCartoonMovies.findIndex(m => m.id === id);
    if (index > -1) {
        mockCartoonMovies.splice(index, 1);
    }
    return Promise.resolve({}); 
}
export async function getPublishedReels(): Promise<Reel[]> { return Promise.resolve(mockReels.filter(r => r.isPublished)); }
export async function getAllReels(): Promise<Reel[]> { return Promise.resolve(mockReels); }
export async function addReel(reel: any) { mockReels.unshift({ ...reel, id: `reel-${Date.now()}`, createdAt: new Date().toISOString() }); return Promise.resolve({}); }
export async function updateReel(id: string, updates: any) { const i = mockReels.findIndex(r => r.id === id); if(i > -1) mockReels[i] = {...mockReels[i], ...updates}; return Promise.resolve({}); }
export async function deleteReel(id: string) { 
    // FIX: Mutate array in place to avoid reassigning an imported variable.
    const index = mockReels.findIndex(r => r.id === id);
    if (index > -1) {
        mockReels.splice(index, 1);
    }
    return Promise.resolve({}); 
}
export async function getStudentQuestions(userId: string): Promise<StudentQuestion[]> { return Promise.resolve([]); }
export async function addStudentQuestion(userId: string, userName: string, questionText: string): Promise<void> { return Promise.resolve(); }
export async function getAllStudentQuestions(): Promise<StudentQuestion[]> { return Promise.resolve([]); }
export async function answerStudentQuestion(questionId: string, answerText: string): Promise<void> { return Promise.resolve(); }
export async function createSupervisor(params: any) { return Promise.resolve({ success: true, data: { user_id: 'new-sup' }}); }
export async function updateSupervisor(supervisorId: string, updates: any) { return Promise.resolve({ success: true }); }
export async function deleteSupervisor(supervisorId: string) { return Promise.resolve({ success: true, error: null }); }
export const redeemCode = async (code: string, userGradeId: number, userTrack: string): Promise<{ success: boolean; error?: string }> => { return Promise.resolve({ success: true }); }
export async function registerAndRedeemCode(userData: any, code: string): Promise<{ data: { userId: string } | null, error: string | null }> {
    const { data, error } = await signUp(userData);
    if(error || !data.user) return { data: null, error: error || 'Signup failed' };
    return { data: { userId: data.user.id }, error: null };
}

// Unimplemented mock functions - kept for type consistency
export async function getFeaturedCourses(): Promise<any[]> { return Promise.resolve([]); }
export async function addFeaturedCourse(course: any) { return Promise.resolve({ error: null }); }
export async function updateFeaturedCourse(course: any) { return Promise.resolve({ error: null }); }
export async function deleteFeaturedCourse(id: string) { return Promise.resolve({ error: null }); }
export async function getFeaturedBooks(): Promise<Book[]> { return Promise.resolve([]); }
export async function addFeaturedBook(book: any) { return Promise.resolve({ error: null }); }
export async function updateFeaturedBook(book: any) { return Promise.resolve({ error: null }); }
export async function deleteFeaturedBook(id: string) { return Promise.resolve({ error: null }); }

export const createCourse = async (courseData: Omit<Course, 'id'>) => Promise.resolve({});
export const updateCourse = async (courseId: string, updates: Partial<Course>) => Promise.resolve({});
export const deleteCourse = async (courseId: string) => Promise.resolve({ error: null });
export const getAllPublishedCourses = async (): Promise<Course[]> => Promise.resolve([]);
export const getPublishedCourses = async (): Promise<Course[]> => Promise.resolve([]);
export const checkCoursePurchase = async (userId: string, courseId: string): Promise<boolean> => Promise.resolve(false);
export const purchaseCourse = async (userId: string, courseId: string): Promise<void> => Promise.resolve();
export const deleteSubscriptionCode = async (code: string) => Promise.resolve({ error: null });

export const addUnitToSemester = async (gradeId: number, semesterId: string, unitData: Omit<Unit, 'id'|'lessons'>) => Promise.resolve({});
export const addLessonToUnit = async (gradeId: number, semesterId: string, unitId: string, lessonData: Omit<Lesson, 'id'>) => Promise.resolve({});
export const updateLesson = async (gradeId: number, semesterId: string, unitId: string, updatedLesson: Lesson) => Promise.resolve({});
export const deleteLesson = async (gradeId: number, semesterId: string, unitId: string, lessonId: string) => Promise.resolve({});
export const updateUnit = async (gradeId: number, semesterId: string, updatedUnit: Partial<Unit> & { id: string }) => Promise.resolve({});
export const deleteUnit = async (gradeId: number, semesterId: string, unitId: string) => Promise.resolve({});
export const getChatUsage = (userId: string): { remaining: number } => ({ remaining: 50 });
export const incrementChatUsage = (userId: string): { remaining: number } => ({ remaining: 49 });
export const getActivityLogs = (): ActivityLog[] => [];
export const updatePlatformSettings = async (newSettings: PlatformSettings): Promise<{ error: any }> => Promise.resolve({ error: null });
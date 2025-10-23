
// This file contains mock data for teachers.
// It's now simplified for a single teacher, "البروف وجدي الفخراني".

interface TeacherInfo {
    name: string;
    icon: string; // Emoji or character
    imageUrl: string; // Base64 Data URI or URL
}

const PROF_FAKHRANY: TeacherInfo = {
    name: 'البروف وجدي الفخراني',
    icon: '🧑‍🏫',
    imageUrl: 'https://i.ibb.co/bJCmnz5/teacher1.png', // Using an existing image as placeholder
};

export const TEACHERS_DATA: { [key: string]: TeacherInfo } = {
    // --- Middle School Math Units ---
    'الجبر والإحصاء': { ...PROF_FAKHRANY, icon: '📊' },
    'الهندسة': { ...PROF_FAKHRANY, icon: '📐' },

    // --- Secondary 1 Math Units ---
    'الجبر وحساب المثلثات': { ...PROF_FAKHRANY, icon: '➕' },
    'الهندسة التحليلية': { ...PROF_FAKHRANY, icon: '📉' },

    // --- Secondary 2 Math Units ---
    'الرياضيات البحتة (علمي)': { ...PROF_FAKHRANY, icon: '🧠' },
    'الرياضيات التطبيقية (علمي)': { ...PROF_FAKHRANY, icon: '⚙️' },
    'رياضيات (أدبي)': { ...PROF_FAKHRANY, icon: '📚' },

    // --- Secondary 3 Math Units ---
    'التفاضل والتكامل': { ...PROF_FAKHRANY, icon: '∫' },
    'الجبر والهندسة الفراغية': { ...PROF_FAKHRANY, icon: '🧊' },
    'الإستاتيكا': { ...PROF_FAKHRANY, icon: '⚖️' },
    'الديناميكا': { ...PROF_FAKHRANY, icon: '🚀' },

    // --- Default Fallback ---
    'Default': PROF_FAKHRANY,
};

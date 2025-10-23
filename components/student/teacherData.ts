

// This file contains mock data for teachers.
// It's now simplified for a single teacher, "البروف وجدي الفخراني".

interface TeacherInfo {
    name: string;
    icon: string; // Emoji or character
    imageUrl: string; // Base64 Data URI or URL
}

export const TEACHERS_DATA: { [key: string]: TeacherInfo } = {};
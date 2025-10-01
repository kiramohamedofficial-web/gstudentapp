
import { GoogleGenAI } from "@google/genai";
import { Grade } from '../types';

// Per coding guidelines, the API key is sourced directly from process.env.API_KEY
// and is assumed to be pre-configured and valid.

export const getAIExplanation = async (
  topic: string,
  question: string,
  grade: Grade['name']
): Promise<string> => {
  // Initialize the AI client here to prevent app crash on load due to undefined process.env in browser.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  // The prompt is structured to guide the AI to act as a friendly and expert science teacher.
  const prompt = `
    أنت دكتور أحمد صابر، معلم علوم خبير وودود لطلاب المرحلتين الإعدادية والثانوية.
    طالب في ${grade} يدرس موضوع "${topic}" وقد طرح السؤال التالي: "${question}".

    يرجى شرح المفهوم بوضوح وبساطة، بطريقة يمكن لطالب في هذا المستوى أن يفهمها.
    حافظ على نبرة مشجعة وداعمة. استخدم أمثلة بسيطة إذا أمكن. لا تجب على سؤال الواجب مباشرة، ولكن اشرح المفهوم الأساسي.
    يجب أن تكون إجابتك باللغة العربية.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching AI explanation:", error);
    return "عذراً، لقد واجهت خطأ أثناء محاولة إنشاء شرح. يرجى المحاولة مرة أخرى لاحقًا.";
  }
};
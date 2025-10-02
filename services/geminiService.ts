
import { GoogleGenAI } from "@google/genai";
import { Grade } from '../types';

// Per coding guidelines, the API key is sourced directly from process.env.API_KEY
// and is assumed to be pre-configured and valid.

export const getAIExplanation = async (
  subject: string,
  question: string,
  grade: Grade['name']
): Promise<string> => {
  // This check ensures the app doesn't crash if the API key is not provided
  // in the environment, which is common after exporting the project.
  if (!process.env.API_KEY) {
    const errorMessage = "مفتاح API غير متوفر. لا يمكن استخدام المساعد الذكي.";
    const userFriendlyMessage = "عذرًا، خدمة المساعد الذكي غير متاحة حاليًا بسبب مشكلة في الإعدادات. يرجى التواصل مع مسؤول المنصة.";
    console.error(errorMessage);
    return userFriendlyMessage;
  }

  // Initialize the AI client.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // The prompt is structured to guide the AI to act as a friendly and expert teacher.
  const prompt = `
    أنت مساعد تعليمي خبير من سنتر جوجل التعليمي. مهمتك هي مساعدة الطلاب في جميع المواد الدراسية للمرحلتين الإعدادية والثانوية.
    طالب في ${grade} يدرس مادة "${subject}" وقد طرح السؤال التالي: "${question}".

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
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    let userMessage = "عذراً، لقد واجهت خطأ أثناء محاولة إنشاء شرح. يرجى المحاولة مرة أخرى لاحقًا.";
    
    if (error instanceof Error) {
        // Check for specific common API errors if possible
        if (error.message.includes('API key not valid')) {
            userMessage = "حدث خطأ في المصادقة مع المساعد الذكي. يرجى التواصل مع الدعم الفني.";
        } else if (error.message.includes('429')) { // Too Many Requests
            userMessage = "الطلب على المساعد الذكي مرتفع حاليًا. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
        }
    }
    
    return userMessage;
  }
};

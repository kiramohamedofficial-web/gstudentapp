import { GoogleGenAI, Type } from "@google/genai";
import { Grade, GeneratorFormState, Question, WeakArea } from '../types';

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

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    question_id: { type: Type.STRING, description: "Unique identifier, e.g., ARA-12-MCQ-0001" },
    subject: { type: Type.STRING },
    stream: { type: Type.STRING, description: "Should be 'Literary' or 'Scientific'" },
    grade: { type: Type.INTEGER, description: "Should be 12" },
    curriculum_ref: { type: Type.STRING, description: "Reference to the curriculum topic, e.g., Arabic-2025/Unit1" },
    type: { type: Type.STRING, description: "MCQ | ShortAnswer | LongAnswer" },
    difficulty: { type: Type.STRING, description: "easy | medium | hard" },
    bloom_level: { type: Type.STRING, description: "remember|understand|apply|analyze|evaluate|create" },
    time_allocated_sec: { type: Type.INTEGER },
    marks: { type: Type.INTEGER },
    stem: { type: Type.STRING, description: "The question text itself, in Arabic." },
    options: {
      type: Type.ARRAY,
      description: "Required for MCQ type. An array of 4 option objects.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A, B, C, or D" },
          text: { type: Type.STRING, description: "The option text, in Arabic." },
        },
        required: ['id', 'text']
      }
    },
    answer_key: { type: Type.STRING, description: "For MCQ, the ID of the correct option (e.g., 'B'). For other types, the full answer text." },
    rationale: { type: Type.STRING, description: "Explanation for the correct answer, in Arabic." },
    tags: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: "Relevant keywords."
    },
  },
  required: ['question_id', 'subject', 'stream', 'grade', 'curriculum_ref', 'type', 'difficulty', 'bloom_level', 'time_allocated_sec', 'marks', 'stem', 'answer_key', 'rationale', 'tags'],
};

export const generateQuestions = async (formState: GeneratorFormState): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { subject, topic, questionCount, mcqPercentage, difficulty } = formState;

  const prompt = `
    You are an expert curriculum designer for the Egyptian Thanaweya Amma (Grade 12) for the year 2025, literary stream.
    Your task is to generate ${questionCount} high-quality exam questions in ARABIC.

    **Instructions:**
    1. **Subject:** ${subject}
    2. **Topic:** ${topic}
    3. **Total Questions:** ${questionCount}
    4. **Question Type Distribution:** Approximately ${mcqPercentage}% of questions should be Multiple Choice (MCQ). The rest can be Short Answer.
    5. **Difficulty Distribution:** Distribute the questions according to this profile: ${difficulty.easy}% easy, ${difficulty.medium}% medium, ${difficulty.hard}% hard.
    6. **MCQ Rules:** For MCQ questions, provide 4 distinct options (A, B, C, D). One option must be clearly correct.
    7. **Language:** All content (stem, options, rationale) MUST be in ARABIC.
    8. **Context:** The questions must be relevant to the Egyptian curriculum and culture for 12th-grade literary stream students.
    9. **Format:** Return a JSON array of question objects adhering strictly to the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: questionSchema
        },
      },
    });

    const jsonText = response.text.trim();
    const generatedQuestions = JSON.parse(jsonText);

    if (!Array.isArray(generatedQuestions)) {
      throw new Error("API did not return a valid array of questions.");
    }
    return generatedQuestions as Question[];
  } catch (error) {
    console.error("Error generating questions from Gemini:", error);
    throw new Error("Failed to parse or receive valid data from the AI. Please check the console for details.");
  }
};

export const getAIStudyPlan = async (
  userName: string,
  gradeName: string,
  weakAreas: WeakArea[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "عذرًا، خدمة المرشد الذكي غير متاحة حاليًا بسبب مشكلة في الإعدادات.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const weakAreasString = weakAreas
    .map(area => `- مادة "${area.unitTitle}", درس "${area.lessonTitle}" (الدرجة: ${area.score}%)`)
    .join('\n');
  
  const prompt = `
    أنت خبير إرشادي أكاديمي متخصص في مساعدة طلاب المرحلة الثانوية والإعدادية في مصر. اسمك "المرشد الذكي".
    مهمتك هي إنشاء خطة مذاكرة مخصصة ومشجعة للطالب "${userName}" في "${gradeName}".

    لقد قمنا بتحليل أداء الطالب ووجدنا أنه يواجه بعض الصعوبات في المواضيع التالية:
    ${weakAreasString}

    بناءً على هذه المعلومات، قم بإنشاء خطة مذاكرة واضحة ومفصلة في شكل نقاط.
    
    يجب أن تتضمن الخطة ما يلي:
    1.  مقدمة قصيرة ومحفزة تخاطب الطالب باسمه.
    2.  قائمة بالمواضيع التي يجب التركيز عليها، مرتبة حسب الأولوية (من الأكثر صعوبة إلى الأقل).
    3.  لكل موضوع، قدم خطوتين أو ثلاث خطوات عملية ومحددة للمراجعة. على سبيل المثال: "إعادة مشاهدة فيديو الشرح"، "حل 5 مسائل إضافية من كتاب التدريبات"، "تلخيص المفاهيم الأساسية في نقاط".
    4.  نصيحة عامة للمذاكرة الفعالة.
    5.  خاتمة إيجابية ومشجعة.

    استخدم تنسيق Markdown البسيط (عناوين باستخدام #، قوائم نقطية باستخدام - أو *).
    حافظ على نبرة إيجابية وداعمة. يجب أن تكون الخطة باللغة العربية.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error: unknown) {
    console.error("Gemini API Error for Study Plan:", error);
    return "عذراً، حدث خطأ أثناء إنشاء خطتك الدراسية. يرجى المحاولة مرة أخرى.";
  }
};

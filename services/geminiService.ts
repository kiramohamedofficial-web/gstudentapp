import { GoogleGenAI, Type } from "@google/genai";
import { Grade, QuizQuestion, Unit } from '../types';

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

export const generatePracticeTest = async (
  unit: string,
  topic: string,
  grade: string,
  difficulty: 'سهل' | 'متوسط' | 'صعب',
  numQuestions: number,
  questionTypes: string[]
): Promise<QuizQuestion[]> => {
  if (!process.env.API_KEY) {
    throw new Error("مفتاح API غير متوفر.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    أنت خبير في وضع الامتحانات للمناهج التعليمية المصرية.
    مهمتك هي إنشاء اختبار تدريبي تفاعلي بنظام الاختيار من متعدد (MCQ).

    **معلومات الاختبار:**
    - المادة (الوحدة): "${unit}"
    - الموضوع (الدرس): "${topic}"
    - الصف الدراسي: ${grade}
    - مستوى الصعوبة: ${difficulty}
    - عدد الأسئلة: ${numQuestions}

    **التعليمات:**
    1.  أنشئ ${numQuestions} سؤالاً بصيغة الاختيار من متعدد حول الموضوع المحدد.
    2.  يجب أن يكون لكل سؤال 4 اختيارات (خيارات).
    3.  يجب أن يكون هناك إجابة واحدة صحيحة فقط.
    4.  لكل سؤال، قدم شرحًا موجزًا وواضحًا للإجابة الصحيحة (rationale). يجب أن يكون الشرح تعليميًا ومفيدًا للطالب.
    5.  يجب أن تكون جميع المحتويات (الأسئلة، الخيارات، الشرح) باللغة العربية.
    6.  يجب أن يكون الناتج بصيغة JSON مطابقة تمامًا للمخطط المحدد أدناه.

    Example of a single question object:
    {
      "questionText": "ما هي عاصمة مصر؟",
      "options": ["الإسكندرية", "القاهرة", "الجيزة", "الأقصر"],
      "correctAnswerIndex": 1,
      "rationale": "القاهرة هي العاصمة الرسمية لجمهورية مصر العربية وأكبر مدنها."
    }
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: 'Array of quiz questions',
            items: {
                type: Type.OBJECT,
                properties: {
                    questionText: { 
                        type: Type.STRING,
                        description: 'The text of the question in Arabic.'
                    },
                    options: {
                        type: Type.ARRAY,
                        description: 'An array of 4 possible answers in Arabic.',
                        items: { type: Type.STRING }
                    },
                    correctAnswerIndex: { 
                        type: Type.INTEGER,
                        description: 'The 0-based index of the correct answer in the options array.'
                    },
                    rationale: {
                        type: Type.STRING,
                        description: 'A brief explanation for why the correct answer is right, in Arabic.'
                    }
                },
                required: ['questionText', 'options', 'correctAnswerIndex', 'rationale']
            }
        }
    },
    required: ['questions']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.questions || [];
  } catch (error) {
    console.error("Gemini Practice Test Generation Error:", error);
    throw new Error("فشل توليد الاختبار. قد يكون الطلب معقدًا جدًا أو حدث خطأ في الشبكة. حاول مرة أخرى.");
  }
};

export const generateQuiz = async (
  topic: string,
  grade: string,
  difficulty: 'سهل' | 'متوسط' | 'صعب',
  numQuestions: number
): Promise<QuizQuestion[]> => {
  if (!process.env.API_KEY) {
    throw new Error("مفتاح API غير متوفر.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    أنت مدرس خبير في المناهج المصرية.
    مهمتك هي إنشاء اختبار قصير (كويز) بنظام الاختيار من متعدد.
    الموضوع: "${topic}"
    الصف الدراسي: ${grade}
    مستوى الصعوبة: ${difficulty}
    عدد الأسئلة: ${numQuestions}

    أنشئ ${numQuestions} سؤالاً بصيغة الاختيار من متعدد حول الموضوع المحدد وبالمستوى المطلوب.
    يجب أن يكون لكل سؤال 4 اختيارات.
    يجب أن تكون الإجابات بصيغة JSON المطلوبة تمامًا.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: 'Array of quiz questions',
            items: {
                type: Type.OBJECT,
                properties: {
                    questionText: { 
                        type: Type.STRING,
                        description: 'The text of the question.'
                    },
                    options: {
                        type: Type.ARRAY,
                        description: 'An array of 4 possible answers.',
                        items: { type: Type.STRING }
                    },
                    correctAnswerIndex: { 
                        type: Type.INTEGER,
                        description: 'The 0-based index of the correct answer in the options array.'
                    }
                },
                required: ['questionText', 'options', 'correctAnswerIndex']
            }
        }
    },
    required: ['questions']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.questions || [];
  } catch (error) {
    console.error("Gemini Quiz Generation Error:", error);
    throw new Error("فشل توليد الأسئلة. يرجى المحاولة مرة أخرى.");
  }
};


const CHAT_SYSTEM_INSTRUCTION = `أنت "مساعد Gstudent الذكي"، مساعد ذكاء اصطناعي ودود ومفيد للطلاب في المرحلتين الإعدادية والثانوية في مصر. مهمتك هي مساعدة الطلاب على فهم موادهم الدراسية. حافظ على إجاباتك موجزة ومفيدة وباللغة العربية الفصحى المبسطة. تجنب الردود الطويلة جداً ما لم يطلب منك ذلك.`;

export type ChatMode = 'normal' | 'fast' | 'thinking';

export const getChatbotResponseStream = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  mode: ChatMode
) => {
  if (!process.env.API_KEY) {
    throw new Error("مفتاح API غير متوفر. لا يمكن استخدام المساعد الذكي.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const modelMap: Record<ChatMode, string> = {
    normal: 'gemini-2.5-flash',
    fast: 'gemini-2.5-flash-lite',
    thinking: 'gemini-2.5-pro',
  };

  const configMap: Record<ChatMode, any> = {
    normal: {},
    fast: {},
    thinking: { thinkingConfig: { thinkingBudget: 32768 } },
  };

  const model = modelMap[mode];
  const config = {
    ...configMap[mode],
    systemInstruction: CHAT_SYSTEM_INSTRUCTION
  };
  
  const contents = [...history, { role: 'user', parts: [{ text: newMessage }] }];

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });
    return responseStream;
  } catch (error: unknown) {
    console.error("Gemini Chat API Error:", error);
    let userMessage = "حدث خطأ أثناء التواصل مع المساعد الذكي. يرجى المحاولة مرة أخرى.";

    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            userMessage = "حدث خطأ في المصادقة مع المساعد الذكي. يرجى التواصل مع الدعم الفني.";
        } else if (error.message.includes('429')) { // Too Many Requests
            userMessage = "الطلب على المساعد الذكي مرتفع حاليًا. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
        }
    }
    // Re-throw a more user-friendly error
    throw new Error(userMessage);
  }
};

export interface StudyPlanInputs {
    gradeName: string;
    dailyStudyHours: number;
    dayStartTime: string;
    dayEndTime: string;
    subjects: {
        name: string;
        weeklyHours: number;
        priority: 'مرتفعة' | 'عادية';
    }[];
    busyTimes: Record<string, string[]>; // e.g., { 'الأحد': ['14:00-16:00'] }
}

export interface StudyScheduleItem {
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
}

export const generateStudyPlan = async (inputs: StudyPlanInputs): Promise<StudyScheduleItem[]> => {
    if (!process.env.API_KEY) {
        throw new Error("مفتاح API غير متوفر. لا يمكن استخدام المساعد الذكي.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const busyTimesString = Object.entries(inputs.busyTimes)
        .filter(([, times]) => times.length > 0)
        .map(([day, times]) => `- ${day}: ${times.join(', ')}`)
        .join('\n');

    const subjectsString = inputs.subjects
        .map(s => `- مادة "${s.name}": ${s.weeklyHours} ساعات أسبوعيًا, الأهمية: ${s.priority}`)
        .join('\n');

    const prompt = `
        أنت خبير في تنظيم الجداول الدراسية للطلاب. مهمتك هي إنشاء جدول دراسي أسبوعي منظم لطالب بناءً على المدخلات التالية.

        **بيانات الطالب:**
        - الصف الدراسي: ${inputs.gradeName}
        - هدف المذاكرة اليومي: حوالي ${inputs.dailyStudyHours} ساعات.
        - الأوقات المتاحة للمذاكرة بشكل عام: من ${inputs.dayStartTime} صباحًا إلى ${inputs.dayEndTime} مساءً.

        **المواد المطلوبة هذا الأسبوع:**
        ${subjectsString}

        **الأوقات غير المتاحة (مشغول):**
        ${busyTimesString || 'لا يوجد أوقات محددة كغير متاحة.'}

        **التعليمات:**
        1.  قم بإنشاء جدول دراسي أسبوعي (من الأحد إلى السبت).
        2.  استخدم فقط الأوقات المتاحة للطالب.
        3.  ابدأ بجدولة المواد ذات الأهمية "المرتفعة" أولاً.
        4.  أنشئ جلسات مذاكرة تتراوح مدتها بين ساعة وساعتين. تجنب الجلسات الأطول من ساعتين متواصلة لنفس المادة.
        5.  وزّع المواد بشكل متوازن على مدار الأسبوع.
        6.  تأكد من تحقيق إجمالي الساعات المطلوبة أسبوعيًا لكل مادة.
        7.  يجب أن يكون الناتج بصيغة JSON مطابقة تمامًا للمخطط المحدد. يجب أن تكون أيام الأسبوع والأسماء باللغة العربية.
    `;

    const scheduleSchema = {
        type: Type.OBJECT,
        properties: {
            schedule: {
                type: Type.ARRAY,
                description: "الجدول الدراسي الأسبوعي.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING, description: "يوم الأسبوع باللغة العربية (مثال: 'الأحد')." },
                        startTime: { type: Type.STRING, description: "وقت البدء بصيغة HH:mm (مثال: '15:00')." },
                        endTime: { type: Type.STRING, description: "وقت الانتهاء بصيغة HH:mm (مثال: '17:00')." },
                        subject: { type: Type.STRING, description: "اسم المادة الدراسية." },
                    },
                    required: ['day', 'startTime', 'endTime', 'subject']
                }
            }
        },
        required: ['schedule']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using pro for this complex task
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: scheduleSchema,
                temperature: 0.2, // Lower temperature for more deterministic output
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.schedule || [];
    } catch (error) {
        console.error("Gemini Study Plan Generation Error:", error);
        throw new Error("فشل توليد الخطة. قد يكون الطلب معقدًا جدًا. حاول تقليل عدد المواد أو الساعات.");
    }
};
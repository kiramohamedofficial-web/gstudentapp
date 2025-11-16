import React, { createContext, useState, useEffect, useContext } from 'react';
import { getPlatformSettings } from './services/storageService';
import { IconSettings } from './types';

// Define all default icon URLs here, matching the previous hardcoded ones
const defaultIcons: IconSettings = {
    faviconUrl: 'https://h.top4top.io/p_3583m5j8t0.png',
    mainLogoUrl: 'https://j.top4top.io/p_3584uziv73.png',

    welcomeHeroImageUrl: 'https://d.top4top.io/p_3584t5zwf3.png',
    welcomeStatStudentIconUrl: 'https://k.top4top.io/p_3583inhay3.png',
    welcomeStatLessonIconUrl: 'https://j.top4top.io/p_3583kuzn32.png',
    welcomeStatSatisfactionIconUrl: 'https://h.top4top.io/p_3583croib0.png',
    welcomeStatSupportIconUrl: 'https://i.ibb.co/L1pDcnv/support.png',
    welcomeFeatureStatsIconUrl: 'https://f.top4top.io/p_3583e5jv00.png',
    welcomeFeaturePlayerIconUrl: 'https://h.top4top.io/p_3583a5wke2.png',
    welcomeFeatureAiIconUrl: 'https://g.top4top.io/p_358376lzw1.png',

    studentNavHomeIconUrl: 'https://k.top4top.io/p_3591rrrv00.png',
    studentNavCurriculumIconUrl: 'https://j.top4top.io/p_3583qcfj42.png',
    studentNavReelsIconUrl: 'https://f.top4top.io/p_3597znq510.png',
    studentNavSubscriptionIconUrl: 'https://k.top4top.io/p_35830gaoq2.png',
    studentNavProfileIconUrl: 'https://l.top4top.io/p_3583el7rr0.png',
    studentNavResultsIconUrl: 'https://www2.0zz0.com/2025/11/02/17/240318741.png',
    studentNavChatbotIconUrl: 'https://b.top4top.io/p_3583ycfjf2.png',
    studentNavCartoonIconUrl: 'https://h.top4top.io/p_3584kk8d71.png',
    studentNavQuestionBankIconUrl: 'https://www2.0zz0.com/2025/11/02/17/635761079.png',
    
    adminNavContentIconUrl: 'https://a.top4top.io/p_3591fcsm53.png',
    adminNavTeacherIconUrl: 'https://l.top4top.io/p_3591st8vz2.png',
    adminNavStudentIconUrl: 'https://l.top4top.io/p_3591vsc7c1.png',
    adminNavHealthIconUrl: 'https://g.top4top.io/p_3584g68tl0.png',
    adminNavCartoonIconUrl: 'https://h.top4top.io/p_3584kk8d71.png',
};

const IconContext = createContext<IconSettings>(defaultIcons);

export const IconProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [icons, setIcons] = useState<IconSettings>(defaultIcons);

    useEffect(() => {
        getPlatformSettings().then(settings => {
            if (settings?.iconSettings) {
                // Merge fetched settings with defaults, so we always have a fallback
                setIcons(prev => ({ ...prev, ...settings.iconSettings }));
            }
        });
    }, []);

    return <IconContext.Provider value={icons}>{children}</IconContext.Provider>;
};

export const useIcons = () => useContext(IconContext);
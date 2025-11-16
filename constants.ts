import React from 'react';
import { CrownIcon, MoonIcon, SunIcon, CocktailIcon, SakuraIcon, ScrollIcon, SunsetIcon, TreeIcon, WaveIcon, SynthwaveIcon, MatrixIcon, GhostIcon, SparklesIcon, AtomIcon } from './components/common/Icons';

export const THEMES = [
    { id: 'light', name: 'أساسي فاتح', colors: { accent: '#3366cc', gradient: 'linear-gradient(to right, #e0eafc, #cfdef3)' } },
    { id: 'dark', name: 'أساسي داكن', colors: { accent: '#7094e2', gradient: 'linear-gradient(to right, #232526, #414345)' } },
    { id: '.clymorphism-light', name: '.Clymorphism فاتح', colors: { accent: '#8a3ffc', gradient: 'linear-gradient(to right, #f2efff, #fbfaff)' } },
    { id: '.clymorphism-dark', name: '.Clymorphism داكن', colors: { accent: '#9f7aea', gradient: 'linear-gradient(to right, #252330, #2d2a3a)' } },
];

// Demo User Credentials
export const DEMO_STUDENT_IDENTIFIER = 'student@demo.com';
export const DEMO_STUDENT_PASSWORD = '1234';
export const DEMO_ADMIN_IDENTIFIER = 'admin@demo.com';
export const DEMO_ADMIN_PASSWORD = 'admin';
// FIX: Import React to resolve "Cannot find namespace 'React'" error.
import React from 'react';
import { CrownIcon, MoonIcon, SunIcon, CocktailIcon, SakuraIcon, ScrollIcon, SunsetIcon, TreeIcon, WaveIcon, SynthwaveIcon, MatrixIcon } from './components/common/Icons';

// Demo User Credentials
export const DEMO_STUDENT_IDENTIFIER = 'student@demo.com';
export const DEMO_STUDENT_PASSWORD = '1234';
export const DEMO_ADMIN_IDENTIFIER = 'admin@demo.com';
export const DEMO_ADMIN_PASSWORD = 'admin';

export const THEMES: {
  id: string;
  name: string;
  icon: React.FC<{className?: string}>;
  colors: { bg: string, accent: string, text?: string, gradient?: string };
}[] = [
  { id: 'light', name: 'فاتح', icon: SunIcon, colors: { bg: '#F9F9FB', accent: '#007AFF', text: '#1D1D1F', gradient: 'linear-gradient(135deg, #A8C6FD, #C2E9FB)' } },
  { id: 'dark', name: 'داكن', icon: MoonIcon, colors: { bg: '#141414', accent: '#4F46E5', text: '#EDEDED', gradient: 'linear-gradient(135deg, #1e293b, #0f172a)' } },
  { id: 'royal', name: 'ملكي', icon: CrownIcon, colors: { bg: '#1C162C', accent: '#D4AF37', text: '#EAE6F5', gradient: 'linear-gradient(135deg, #432E72, #1C162C)' } },
  { id: 'gold', name: 'ذهبي', icon: CrownIcon, colors: { bg: '#1F1C19', accent: '#D4AF37', text: '#F0E6D8', gradient: 'linear-gradient(135deg, #4b3821, #1F1C19)' } },
  { id: 'cocktail', name: 'كوكتيل', icon: CocktailIcon, colors: { bg: '#4A152B', accent: '#FF6B6B', text: '#FDECF5', gradient: 'linear-gradient(135deg, #e53935, #ff8a65)' } },
  { id: 'pink', name: 'وردي', icon: SakuraIcon, colors: { bg: '#421D34', accent: '#F472B6', text: '#FDECF5', gradient: 'linear-gradient(135deg, #c2185b, #f06292)' } },
  { id: 'paper', name: 'ورقي', icon: ScrollIcon, colors: { bg: '#F4F1E9', accent: '#8D6E63', text: '#4A3F35', gradient: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)' } },
  { id: 'sunset', name: 'غروب', icon: SunsetIcon, colors: { bg: '#211E3B', accent: '#FF8C42', text: '#E6E0FF', gradient: 'linear-gradient(135deg, #4a148c, #ff6f00)' } },
  { id: 'forest', name: 'غابة', icon: TreeIcon, colors: { bg: '#2A3A34', accent: '#6A994E', text: '#E4EBE8', gradient: 'linear-gradient(135deg, #1b5e20, #4caf50)' } },
  { id: 'ocean', name: 'محيط', icon: WaveIcon, colors: { bg: '#1B263B', accent: '#778DA9', text: '#E0E1DD', gradient: 'linear-gradient(135deg, #0d47a1, #42a5f5)' } },
  { id: 'wave', name: 'موجة', icon: SynthwaveIcon, colors: { bg: '#241838', accent: '#FF00A0', text: '#F0EAFE', gradient: 'linear-gradient(135deg, #0D0221, #241838)' } },
  { id: 'matrix', name: 'ماتركس', icon: MatrixIcon, colors: { bg: '#0A0A0A', accent: '#39FF14', text: '#39FF14', gradient: 'linear-gradient(135deg, #003300, #000000)' } },
];
import { Theme } from './types';

export const THEMES = [
  { id: Theme.DARK, name: 'مظلم' },
  { id: Theme.LIGHT, name: 'فاتح' },
  { id: Theme.GOLD, name: 'ذهبي' },
  { id: Theme.PINK, name: 'وردي' },
];

export const THEME_CLASSES: { [key in Theme]: { main: string; bodyBg: string } } = {
  [Theme.DARK]: { main: 'theme-dark', bodyBg: '#0D1117' },
  [Theme.LIGHT]: { main: 'theme-light', bodyBg: '#f6f8fa' },
  [Theme.GOLD]: { main: 'theme-gold', bodyBg: '#fffaf0' },
  [Theme.PINK]: { main: 'theme-pink', bodyBg: '#fff0f5' },
};

// Demo User Credentials
export const DEMO_STUDENT_USERNAME = 'طالب تجريبي';
export const DEMO_STUDENT_CODE = '1234';
export const DEMO_ADMIN_USERNAME = 'مدير المنصة';
export const DEMO_ADMIN_CODE = 'admin';

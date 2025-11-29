const brandBlue = '#00AFF0'; // Softer Skype-like blue

// Dark theme (FINN-inspired)
const darkBg = '#1A1A1A';
const darkCard = '#252525';
const darkBorder = '#333333';
const darkText = '#FFFFFF';
const darkTextMuted = '#999999';

// Light theme
const lightBg = '#FFFFFF';
const lightCard = '#F9FAFB';
const lightBorder = '#E5E7EB';
const lightText = '#111827';
const lightTextMuted = '#6B7280';

export default {
  light: {
    text: lightText,
    textMuted: lightTextMuted,
    background: lightBg,
    card: lightCard,
    cardElevated: '#FFFFFF',
    border: lightBorder,
    tint: brandBlue,
    primary: brandBlue,
    success: '#10B981',
    error: '#EF4444',
    tabIconDefault: lightTextMuted,
    tabIconSelected: brandBlue,
    input: '#FFFFFF',
    inputBorder: lightBorder,
    shadow: '#000000',
  },
  dark: {
    text: darkText,
    textMuted: darkTextMuted,
    background: darkBg,
    card: darkCard,
    cardElevated: '#2A2A2A',
    border: darkBorder,
    tint: brandBlue,
    primary: brandBlue,
    success: '#10B981',
    error: '#EF4444',
    tabIconDefault: darkTextMuted,
    tabIconSelected: brandBlue,
    input: '#2A2A2A',
    inputBorder: darkBorder,
    shadow: '#000000',
  },
};
import { Platform } from 'react-native';

// iOS uses SF Pro by default when fontFamily is set to 'System'
// On iOS, we can use specific SF Pro variants
export const FontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Typography = {
  // Display text (larger headings)
  displayLarge: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
  },
  displayMedium: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    lineHeight: 36,
  },
  displaySmall: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    lineHeight: 32,
  },
  
  // Headings
  headlineLarge: {
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    fontWeight: FontWeight.semibold,
    lineHeight: 28,
  },
  headlineMedium: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    lineHeight: 26,
  },
  headlineSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    lineHeight: 24,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
  },
  
  // Labels
  labelLarge: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },
  
  // Button text
  button: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
  },
};

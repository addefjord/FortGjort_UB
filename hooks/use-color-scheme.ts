import { useTheme } from '../lib/theme-context';

export function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useTheme();
  return colorScheme;
}
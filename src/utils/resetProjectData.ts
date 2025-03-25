// Utility function to reset project data and set theme to light mode
import { useThemeStore } from '@/store/theme';
import { routes } from '@/lib/routes';

// Clear all application state
export const resetAppState = () => {
  // Reset theme to light mode
  const themeStore = useThemeStore.getState();
  themeStore.setLightTheme();
  
  // Clear localStorage data except for critical system data
  const keysToPreserve = ['theme-storage'];
  
  Object.keys(localStorage).forEach(key => {
    if (!keysToPreserve.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // Reset theme-storage to light mode
  localStorage.setItem('theme-storage', JSON.stringify({ state: { isDark: false } }));
  
  // Reset sessionStorage data
  sessionStorage.clear();
  
  // Return home route for redirection
  return routes.home;
}; 
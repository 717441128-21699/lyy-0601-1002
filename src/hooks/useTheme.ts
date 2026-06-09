import { useEffect, useMemo } from 'react';
import { useInspectionStore } from '@/store/useInspectionStore';
import { applyTheme, themes } from '@/styles/themes';
import type { ThemeType } from '@/types';

export const useTheme = () => {
  const { config, setConfig } = useInspectionStore();

  useEffect(() => {
    applyTheme(config.theme);
  }, [config.theme]);

  const switchTheme = (theme: ThemeType) => {
    setConfig({ theme });
  };

  const themeColors = useMemo(() => ({
    ...config.legend,
    primary: themes[config.theme].colors.accent.primary,
  }), [config.theme, config.legend]);

  return {
    currentTheme: config.theme,
    switchTheme,
    themeColors,
  };
};

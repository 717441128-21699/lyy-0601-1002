import type { ThemeType } from '@/types';

export interface ThemeConfig {
  name: string;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      gradient: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: {
      primary: string;
      secondary: string;
      highlight: string;
    };
    accent: {
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      danger: string;
      info: string;
    };
  };
  backdrop: {
    blur: string;
    opacity: number;
  };
  shadow: {
    card: string;
    hover: string;
    glow: string;
  };
}

export const themes: Record<ThemeType, ThemeConfig> = {
  dark: {
    name: '深色主题',
    colors: {
      background: {
        primary: '#0A1628',
        secondary: '#1C2333',
        tertiary: '#2D3748',
        gradient: 'linear-gradient(135deg, #0A1628 0%, #1A2744 100%)',
      },
      text: {
        primary: '#F7FAFC',
        secondary: '#A0AEC0',
        tertiary: '#718096',
        inverse: '#0A1628',
      },
      border: {
        primary: '#2D3748',
        secondary: '#4A5568',
        highlight: '#00B4D8',
      },
      accent: {
        primary: '#00B4D8',
        secondary: '#0077B6',
        success: '#30D158',
        warning: '#FFD60A',
        danger: '#FF3B30',
        info: '#00B4D8',
      },
    },
    backdrop: {
      blur: 'blur-xl',
      opacity: 0.8,
    },
    shadow: {
      card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      hover: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      glow: '0 0 20px rgba(0, 180, 216, 0.3)',
    },
  },
  light: {
    name: '浅色主题',
    colors: {
      background: {
        primary: '#F7FAFC',
        secondary: '#FFFFFF',
        tertiary: '#EDF2F7',
        gradient: 'linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%)',
      },
      text: {
        primary: '#1A202C',
        secondary: '#4A5568',
        tertiary: '#718096',
        inverse: '#FFFFFF',
      },
      border: {
        primary: '#E2E8F0',
        secondary: '#CBD5E0',
        highlight: '#00B4D8',
      },
      accent: {
        primary: '#0077B6',
        secondary: '#00B4D8',
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#EF4444',
        info: '#0077B6',
      },
    },
    backdrop: {
      blur: 'blur-xl',
      opacity: 0.9,
    },
    shadow: {
      card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      hover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      glow: '0 0 15px rgba(0, 119, 182, 0.2)',
    },
  },
  tech: {
    name: '科技蓝主题',
    colors: {
      background: {
        primary: '#000F1F',
        secondary: '#001A33',
        tertiary: '#002244',
        gradient: 'linear-gradient(135deg, #000F1F 0%, #001A33 50%, #003366 100%)',
      },
      text: {
        primary: '#E0F2FE',
        secondary: '#7DD3FC',
        tertiary: '#38BDF8',
        inverse: '#000F1F',
      },
      border: {
        primary: '#0C4A6E',
        secondary: '#0369A1',
        highlight: '#00FFFF',
      },
      accent: {
        primary: '#00FFFF',
        secondary: '#00D4FF',
        success: '#00FF88',
        warning: '#FFDD00',
        danger: '#FF4444',
        info: '#00B4FF',
      },
    },
    backdrop: {
      blur: 'blur-2xl',
      opacity: 0.7,
    },
    shadow: {
      card: '0 4px 20px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      hover: '0 8px 30px rgba(0, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      glow: '0 0 30px rgba(0, 255, 255, 0.4)',
    },
  },
};

export const applyTheme = (theme: ThemeType) => {
  const config = themes[theme];
  const root = document.documentElement;

  Object.entries(config.colors.background).forEach(([key, value]) => {
    root.style.setProperty(`--bg-${key}`, value);
  });

  Object.entries(config.colors.text).forEach(([key, value]) => {
    root.style.setProperty(`--text-${key}`, value);
  });

  Object.entries(config.colors.border).forEach(([key, value]) => {
    root.style.setProperty(`--border-${key}`, value);
  });

  Object.entries(config.colors.accent).forEach(([key, value]) => {
    root.style.setProperty(`--accent-${key}`, value);
  });

  root.dataset.theme = theme;
};

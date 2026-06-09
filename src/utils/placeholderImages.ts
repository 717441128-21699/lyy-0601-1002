const svgToBase64 = (svg: string): string => {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

export const createPlaceholderImage = (
  type: 'pipeline' | 'leak' | 'blockage' | 'damage' | 'valve' | 'site' | 'equipment' | 'document' | 'repair' | 'normal',
  title: string
): { url: string; thumbnail: string } => {
  const colorMap: Record<string, { bg: string; accent: string; icon: string }> = {
    pipeline: { bg: '#1e3a5f', accent: '#00b4d8', icon: '🔧' },
    leak: { bg: '#2d4a3e', accent: '#30d158', icon: '💧' },
    blockage: { bg: '#4a3d2d', accent: '#ff9f0a', icon: '🚫' },
    damage: { bg: '#4a2d2d', accent: '#ff453a', icon: '⚠️' },
    valve: { bg: '#2d3a4a', accent: '#0a84ff', icon: '🔩' },
    site: { bg: '#3a2d4a', accent: '#bf5af2', icon: '📍' },
    equipment: { bg: '#2d4a4a', accent: '#64d2ff', icon: '⚙️' },
    document: { bg: '#3a3a2d', accent: '#ffd60a', icon: '📋' },
    repair: { bg: '#4a2d3a', accent: '#ff375f', icon: '🔨' },
    normal: { bg: '#1e3a5f', accent: '#30d158', icon: '✅' },
  };

  const colors = colorMap[type] || colorMap.normal;

  const fullSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.bg}dd;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#bg)"/>
      <circle cx="400" cy="400" r="300" fill="url(#accent)"/>
      <text x="400" y="320" font-size="120" text-anchor="middle" dominant-baseline="middle">${colors.icon}</text>
      <rect x="100" y="500" width="600" height="120" rx="20" fill="${colors.accent}22" stroke="${colors.accent}66" stroke-width="2"/>
      <text x="400" y="570" font-size="36" text-anchor="middle" dominant-baseline="middle" fill="${colors.accent}" font-family="Arial, sans-serif">${title}</text>
      <rect x="100" y="660" width="600" height="60" rx="10" fill="${colors.bg}88"/>
      <text x="400" y="700" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#ffffff88" font-family="Arial, sans-serif">智慧水务巡检系统</text>
      <line x1="100" y1="200" x2="700" y2="200" stroke="${colors.accent}33" stroke-width="2"/>
      <line x1="100" y1="250" x2="600" y2="250" stroke="${colors.accent}22" stroke-width="2"/>
      <line x1="100" y1="450" x2="700" y2="450" stroke="${colors.accent}33" stroke-width="2"/>
      <line x1="100" y1="420" x2="500" y2="420" stroke="${colors.accent}22" stroke-width="2"/>
    </svg>
  `;

  const thumbSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="tbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.bg}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#tbg)"/>
      <circle cx="100" cy="85" r="55" fill="${colors.accent}22"/>
      <text x="100" y="95" font-size="40" text-anchor="middle" dominant-baseline="middle">${colors.icon}</text>
      <rect x="20" y="140" width="160" height="40" rx="8" fill="${colors.accent}22"/>
      <text x="100" y="165" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="${colors.accent}" font-family="Arial, sans-serif">${title}</text>
    </svg>
  `;

  return {
    url: svgToBase64(fullSvg),
    thumbnail: svgToBase64(thumbSvg),
  };
};

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

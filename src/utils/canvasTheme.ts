/**
 * Canvas Theme Helper
 * Returns high-contrast color palettes for HTML5 2D Canvas diagrams based on active theme
 */
export function getCanvasTheme() {
  const isLight = document.documentElement.classList.contains('light');

  return {
    isLight,
    bg: isLight ? '#ffffff' : '#090d16',
    subtleBg: isLight ? '#f8fafc' : '#0f172a',
    chamberBg: isLight ? '#f1f5f9' : '#0f172a',
    containerBorder: isLight ? '#cbd5e1' : '#334155',
    axis: isLight ? '#94a3b8' : '#475569',
    axisLabel: isLight ? '#334155' : '#94a3b8',
    textMain: isLight ? '#0f172a' : '#f8fafc',
    textMuted: isLight ? '#475569' : '#94a3b8',
    gridLine: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
    cardOverlay: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.9)',
    cardBorder: isLight ? '#e2e8f0' : '#1e293b',
    primary: isLight ? '#0284c7' : '#38bdf8',
    primaryFill: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.12)',
    heat: isLight ? '#c2410c' : '#f97316',
    heatGlow: isLight ? 'rgba(234, 88, 12, 0.2)' : 'rgba(249, 115, 22, 0.25)',
    success: isLight ? '#059669' : '#10b981',
    warning: isLight ? '#d97706' : '#f59e0b',
    danger: isLight ? '#dc2626' : '#ef4444',
  };
}

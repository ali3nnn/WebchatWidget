// ========================================
// UTILITIES
// ========================================

/**
 * Handles CSS injection into the document head
 * Used to inject the webchat styles dynamically
 */
export class CSSInjector {
  static inject(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

/**
 * Centralized logging utility for the webchat widget
 * Provides consistent logging format and filtering
 */
export class Logger {
  static log(...args: unknown[]): void {
    console.log('[webchat.ts]', ...args);
  }
}

/**
 * Utility for creating gradient colors from single color values
 * Converts hex, HSL, and gradient colors to consistent gradient format
 */
export class ColorUtils {
  static createGradient(color: string | undefined): string {
    if (!color) {
      return '';
    }

    if (color.includes('gradient') || color.includes('linear-gradient')) {
      return color;
    }
    
    if (color.includes('hsl')) {
      const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (hslMatch) {
        const [, h, s, l] = hslMatch;
        const hue = parseInt(h);
        const saturation = parseInt(s);
        const lightness = parseInt(l);
        const lighterLightness = Math.min(100, lightness * 1.4);
        return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lighterLightness}%) 0%, ${color} 100%)`;
      }
    }
    
    const lighterColor = color.replace('#', '').match(/.{2}/g)?.map(hex => {
      const num = parseInt(hex, 16);
      const lighter = Math.min(255, num + Math.round(num * 0.2));
      return lighter.toString(16).padStart(2, '0');
    }).join('') || color;
    
    return `linear-gradient(135deg, #${lighterColor} 0%, ${color} 100%)`;
  }
} 
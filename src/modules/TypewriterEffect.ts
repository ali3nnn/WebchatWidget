// ========================================
// TYPEWRITER EFFECT
// ========================================

/**
 * Creates a typewriter animation effect for bot messages
 * Types out text character by character with configurable speed
 */
export class TypewriterEffect {
  /**
   * Applies typewriter effect to an element
   * @param element - The DOM element to animate
   * @param text - The text to type out
   * @param onComplete - Callback function when typing is complete
   */
  static apply(element: HTMLElement, text: string, onComplete?: () => void): void {
    let index = 0;
    const speed = 20;
    const textNode = document.createTextNode('');
    element.appendChild(textNode);

    function typeNextChar(): void {
      if (index < text.length) {
        textNode.textContent += text[index];
        index++;

        const chatElement = element.closest('#chat');
        if (chatElement) {
          chatElement.scrollTop = chatElement.scrollHeight;
        }

        setTimeout(typeNextChar, speed);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    }

    typeNextChar();
  }
} 
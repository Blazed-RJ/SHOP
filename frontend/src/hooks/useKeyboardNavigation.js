import { useEffect } from 'react';

/**
 * Hook to enable Tally-like keyboard navigation (Enter -> Next Field, Esc -> Call Handler)
 * @param {React.RefObject} containerRef - Ref to the container element
 * @param {Function} onEscape - Callback when Escape key is pressed
 * @param {string} selector - CSS selector for focusable elements (default: 'input, select, textarea, button')
 */
const useKeyboardNavigation = (containerRef, onEscape = null, selector = 'input:not([type="hidden"]), select, textarea, button:not([disabled])') => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!containerRef.current) return;

            // HANDLE ESCAPE
            if (e.key === 'Escape') {
                if (onEscape) {
                    e.preventDefault();
                    onEscape();
                }
                return;
            }

            // HANDLE ENTER
            if (e.key === 'Enter') {
                // Allow default behavior for buttons (submit/click) and textareas (new line)
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') {
                    return;
                }

                e.preventDefault();

                // Find all focusable elements in the container
                const elements = Array.from(containerRef.current.querySelectorAll(selector));

                // Filter out hidden or disabled elements just in case
                const focusable = elements.filter(el => {
                    return el.offsetParent !== null && !el.disabled && el.tabIndex !== -1;
                });

                const index = focusable.indexOf(e.target);

                if (index > -1 && index < focusable.length - 1) {
                    focusable[index + 1].focus();
                } else if (index === focusable.length - 1) {
                    // Optional: Submit logic here or just loop back? 
                    // Tally usually stops or goes to save button.
                    // If we are on the last element, maybe we blur?
                    // e.target.blur();
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (container) {
                container.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [containerRef, onEscape, selector]);
};

export default useKeyboardNavigation;

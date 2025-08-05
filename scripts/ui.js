/* UI helper functions (currently minimal, can be expanded as needed) */

// Example: Smooth scroll to bottom of conversation
function scrollToBottom() {
    const conversation = document.getElementById('conversation');
    if (conversation) {
        conversation.scrollTo({
            top: conversation.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Remove landscape-lock class usage since CSS handles hiding content on mobile landscape

// Initial check on page load
window.addEventListener('load', () => {
    // No JS needed for locking, CSS handles it
});

// Listen for orientation changes
window.addEventListener('orientationchange', () => {
    // No JS needed for locking, CSS handles it
});

// Also listen for resize events as a fallback
window.addEventListener('resize', () => {
    // No JS needed for locking, CSS handles it
});

// Export functions if using modules (optional)
// export { scrollToBottom };

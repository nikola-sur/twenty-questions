// UI helper functions (currently minimal, can be expanded as needed)

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

// Export functions if using modules (optional)
// export { scrollToBottom };

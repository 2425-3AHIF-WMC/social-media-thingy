document.addEventListener('DOMContentLoaded', () => {
    // Find all buttons with class ".like-button" and attach the click handler
    document.querySelectorAll('.like-button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const postId = btn.getAttribute('data-post-id');
            if (!postId) return;

            const isLiked = btn.classList.contains('liked');
            const url     = isLiked ? `/unlike/${postId}` : `/like/${postId}`;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    credentials: 'same-origin'  // important: send the session cookie
                });

                if (res.status === 204) {
                    // Toggle the UI immediately
                    const countSpan = btn.querySelector('.like-count');
                    let count = parseInt(countSpan.textContent, 10) || 0;

                    if (isLiked) {
                        btn.classList.remove('liked');
                        count = Math.max(0, count - 1);
                    } else {
                        btn.classList.add('liked');
                        count = count + 1;
                    }

                    countSpan.textContent = count;
                } else {
                    console.error('Failed to toggle like (status =', res.status, ')');
                }
            } catch (err) {
                console.error('Error toggling like:', err);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1) Tab‐switching logic
    function openTab(name) {
        document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(name).style.display = 'block';
        event.currentTarget.classList.add('active');

        if (name === 'source') {
            // (If you want to load characters lazily, you can do so here)
            // e.g. loadCharacterGallery();
        }
    }
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () =>
            openTab(btn.getAttribute('onclick').match(/'(.+)'/)[1])
        );
    });
    // Open “Posts” tab by default
    document.querySelector('.tab-button').click();

    // 2) “Create Post” modal logic (unchanged from your original file)
    const openPostModalButton = document.getElementById('openPostModalButton');
    const closePostModalButton = document.getElementById('closePostModalButton');
    const createPostModal = document.getElementById('createPostModal');
    const hashtagInput = document.getElementById('hashtagInput');
    const addHashtagButton = document.getElementById('addHashtagButton');
    const hashtagList = document.getElementById('hashtagList');
    const hashtagsField = document.getElementById('hashtags');
    const projectDropdown = document.getElementById('projectId');
    let hashtagsArr = [];

    if (projectDropdown) {
        fetch(`/board/<%= board.id %>/projects`)
            .then(res => res.json())
            .then(projects => {
                projects.forEach(proj => {
                    const option = document.createElement('option');
                    option.value = proj.id;
                    option.textContent = proj.name;
                    projectDropdown.appendChild(option);
                });
            })
            .catch(console.error);
    }

    openPostModalButton.addEventListener('click', () => {
        createPostModal.style.display = 'block';
    });
    closePostModalButton.addEventListener('click', () => {
        createPostModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === createPostModal) {
            createPostModal.style.display = 'none';
        }
    });

    addHashtagButton.addEventListener('click', () => {
        const tag = hashtagInput.value.trim();
        if (tag && !hashtagsArr.includes(tag)) {
            hashtagsArr.push(tag);
            updateHashtagList();
            hashtagInput.value = '';
        }
    });
    function updateHashtagList() {
        hashtagList.innerHTML = '';
        hashtagsArr.forEach((t, idx) => {
            const span = document.createElement('span');
            span.textContent = `#${t}`;
            span.className = 'hashtag-item';
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.className = 'remove-hashtag';
            removeBtn.addEventListener('click', () => {
                hashtagsArr.splice(idx, 1);
                updateHashtagList();
            });
            span.appendChild(removeBtn);
            hashtagList.appendChild(span);
        });
        hashtagsField.value = hashtagsArr.join(',');
    }

    document.getElementById('createPostForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        formData.set('hashtags', hashtagsArr.join(','));
        try {
            const response = await fetch('/createPost', { method: 'POST', body: formData });
            if (response.ok) {
                alert('Post created successfully!');
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to create post'}`);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while creating the post.');
        }
    });
});
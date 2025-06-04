document.addEventListener('DOMContentLoaded', () => {
    // --- Profile & Header Image Logic ---
    const profileImageEl = document.getElementById('userprofileImage');
    const headerImageEl  = document.getElementById('userheaderImage');

    profileImageEl.addEventListener('click', () => {
        document.getElementById('profileImageInput').click();
    });

    headerImageEl.addEventListener('click', () => {
        document.getElementById('headerImageInput').click();
    });

    // --- Avatar Upload Handler ---
    document
        .getElementById('profileImageInput')
        .addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Build a FormData with the new avatar. Multer in user-router expects field name "avatar"
            const fd = new FormData();
            fd.append('avatar', file);

            try {
                const res = await fetch('/api/user/update-user-avatar', {
                    method: 'POST',
                    body: fd
                });
                if (!res.ok) {
                    // If the server returned a non-2xx status, show the raw text
                    const errorMsg = await res.text();
                    return alert('Upload failed: ' + errorMsg);
                }

                // The router responds with { success: true, profile_image: "profile_images/xyz.png" }
                const data = await res.json();
                // Update the <img> src so the user sees the new avatar immediately:
                // If data.profile_image does not start with '/', prepend it:
                profileImageEl.src = data.profile_image.startsWith('/')
                    ? data.profile_image
                    : '/' + data.profile_image;
            } catch (err) {
                console.error(err);
                alert('Something went wrong while uploading avatar.');
            }
        });

    // --- Header Upload Handler ---
    document
        .getElementById('headerImageInput')
        .addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Build a FormData with the new header. Multer expects field name "header"
            const fd = new FormData();
            fd.append('header', file);

            try {
                const res = await fetch('/api/user/update-user-header', {
                    method: 'POST',
                    body: fd
                });
                if (!res.ok) {
                    const errorMsg = await res.text();
                    return alert('Upload failed: ' + errorMsg);
                }

                // The router responds with { success: true, header_image: "profile_images/xyz.png" }
                const data = await res.json();
                headerImageEl.src = data.header_image.startsWith('/')
                    ? data.header_image
                    : '/' + data.header_image;
            } catch (err) {
                console.error(err);
                alert('Something went wrong while uploading header.');
            }
        });

    // --- Username / Logout Button Display Logic (unchanged) ---
    fetch('/username')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                document.getElementById('username').textContent = `Logged in as: ${data.username}`;
                document.getElementById('logout-button').innerHTML = `<a href="/logout">Logout</a>`;
                document.getElementById('login-button').style.display = 'none';
                document.getElementById('register-button').style.display = 'none';
            }
        })
        .catch(console.error);

    // --- “Save Changes” for Profile Fields (unchanged) ---
    document.getElementById('saveProfileButton').addEventListener('click', async () => {
        // … your existing “save profile” logic (unchanged) …
    });

    // --- Hashtag Logic for “Create Board” Form (unchanged) ---
    const hashtagInput      = document.getElementById('hashtagInput');
    const addHashtagButton  = document.getElementById('addHashtagButton');
    const hashtagList       = document.getElementById('hashtagList');
    const hashtagsField     = document.getElementById('hashtags');
    let hashtags            = [];

    addHashtagButton.addEventListener('click', () => {
        const hashtag = hashtagInput.value.trim();
        if (hashtag && !hashtags.includes(hashtag)) {
            hashtags.push(hashtag);
            updateHashtagList();
            hashtagInput.value = '';
        }
    });

    function updateHashtagList() {
        hashtagList.innerHTML = '';
        hashtags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.textContent = `#${tag}`;
            tagElement.className   = 'hashtag-item';

            const removeButton = document.createElement('button');
            removeButton.textContent = 'x';
            removeButton.className   = 'remove-hashtag';
            removeButton.addEventListener('click', () => {
                hashtags.splice(index, 1);
                updateHashtagList();
            });

            tagElement.appendChild(removeButton);
            hashtagList.appendChild(tagElement);
        });
        hashtagsField.value = hashtags.join(',');
    }

    // --- “Create Board” Form Submission (unchanged) ---
    document.getElementById('createBoardForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        formData.set('hashtag', hashtags.join(','));

        try {
            const response = await fetch('/createBoard', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Board created successfully!');
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to create board'}`);
            }
        } catch (error) {
            console.error('Error creating board:', error);
            alert('An error occurred while creating the board.');
        }
    });

    // --- Modal Opening / Closing Logic (unchanged) ---
    const openModalButton    = document.getElementById('openModalButton');
    const closeModalButton   = document.getElementById('closeModalButton');
    const createBoardModal   = document.getElementById('createBoardModal');
    const htmlEl = document.documentElement; // the <html> element
    const body   = document.body;           // the <body> element

    function openModal() {
        createBoardModal.style.display = 'flex';
        htmlEl.classList.add('modal-open');
        body.classList.add('modal-open');
    }

    function closeModal() {
        createBoardModal.style.display = 'none';
        htmlEl.classList.remove('modal-open');
        body.classList.remove('modal-open');
    }

    // Attach “open” handler:
    openModalButton.addEventListener('click', () => {
        openModal();
    });

    // Attach “close” handler to the “×” button:
    closeModalButton.addEventListener('click', () => {
        closeModal();
    });

    // Attach “close” handler when clicking outside modal‐content:
    createBoardModal.addEventListener('click', (event) => {
        if (event.target === createBoardModal) {
            closeModal();
        }
    });
});

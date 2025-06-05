document.addEventListener('DOMContentLoaded', () => {
    function openTab(event, name) {
        document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(name).style.display = 'block';
        event.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (event) => {
            // Extract the tab‐name from the inline onclick="openTab('…')" attribute
            const tabName = btn.getAttribute('onclick').match(/'(.+)'/)[1];
            openTab(event, tabName);
        });
    });

    document.querySelectorAll('.tab-button')[0].click();

    const openPostModalButton  = document.getElementById('openPostModalButton');
    const closePostModalButton = document.getElementById('closePostModalButton');
    const createPostModal      = document.getElementById('createPostModal');
    const hashtagInput         = document.getElementById('hashtagInput');
    const addHashtagButton     = document.getElementById('addHashtagButton');
    const hashtagList          = document.getElementById('hashtagList');
    const hashtagsField        = document.getElementById('hashtags');
    const projectDropdown      = document.getElementById('projectId');
    let hashtagsArr            = [];

    if (projectDropdown) {
        fetch(`/board/${boardId}/projects`)
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

    if (openPostModalButton && createPostModal) {
        openPostModalButton.addEventListener('click', () => {
            createPostModal.style.display = 'flex';
        });
    }
    if (closePostModalButton && createPostModal) {
        closePostModalButton.addEventListener('click', () => {
            createPostModal.style.display = 'none';
        });
    }
    window.addEventListener('click', event => {
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

    document.getElementById('createPostForm').addEventListener('submit', async event => {
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


    // 3) Like/Unlike Button Logic
    document.querySelectorAll('.like-button').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            e.preventDefault();
            const postId = btn.getAttribute('data-post-id');
            if (!postId) return;

            const isLiked = btn.classList.contains('liked');
            const url = isLiked ? `/unlike/${postId}` : `/like/${postId}`;

            try {
                const res = await fetch(url, { method: 'POST', credentials: 'same-origin' });
                if (res.status === 204) {
                    const countSpan = btn.querySelector('.like-count');
                    let count = parseInt(countSpan.textContent, 10);

                    if (isLiked) {
                        btn.classList.remove('liked');
                        count = Math.max(0, count - 1);
                    } else {
                        btn.classList.add('liked');
                        count = count + 1;
                    }

                    countSpan.textContent = count;
                } else {
                    console.error('Failed to toggle like:', res.status);
                }
            } catch (err) {
                console.error('Error toggling like:', err);
            }
        });
    });


    // 5) SOURCE Tab: Character Gallery & Modal Logic
    const projectSelect      = document.getElementById('projectSelect');
    const gallery            = document.getElementById('characterGallery');
    const openAddCharBtn     = document.getElementById('openAddCharModal');
    const addCharModal       = document.getElementById('addCharModal');
    const closeAddCharBtn    = document.getElementById('closeAddCharModal');
    const addCharForm        = document.getElementById('addCharForm');
    const charModal          = document.getElementById('characterModal');
    const charModalCloseBtn  = document.querySelector('#characterModal .close-btn');
    const modalNameEl        = document.getElementById('modalName');
    const modalProjectEl     = document.getElementById('modalProject');
    const modalDescEl        = document.getElementById('modalDesc');
    const modalSpoilerEl     = document.getElementById('modalSpoiler');
    const modalImagesEl      = document.getElementById('modalImages');
    let currentProjectId     = null;
    let charactersLoaded     = false;

    function loadCharacters() {
        if (!currentProjectId || charactersLoaded) return;
        charactersLoaded = true;

        fetch(`/project/${currentProjectId}/source`)
            .then(res => res.json())
            .then(({ characterDescriptions }) => {
                gallery.innerHTML = '';
                characterDescriptions.forEach(c => {
                    const card = document.createElement('div');
                    card.className = 'character-card';
                    const imgSrc = c.image_path ? `/${c.image_path}` : '/uploads/default_profile.png';
                    card.innerHTML = `
            <img src="${imgSrc}" alt="${c.name}" />
            <h4>${c.name}</h4>
          `;
                    card.addEventListener('click', () => openCharacterModal(c));
                    gallery.appendChild(card);
                });
            })
            .catch(console.error);
    }

    function openCharacterModal(c) {
        modalNameEl.textContent    = c.name;
        modalProjectEl.textContent = projectSelect.selectedOptions[0].text;
        modalDescEl.textContent    = c.description || '';
        modalSpoilerEl.textContent = c.spoiler || '';
        modalImagesEl.innerHTML    = '';
        if (c.image_path) {
            const img = document.createElement('img');
            img.src = `/${c.image_path}`;
            modalImagesEl.appendChild(img);
        }
        charModal.style.display = 'flex';
    }

    if (projectSelect) {
        projectSelect.addEventListener('change', e => {
            currentProjectId  = e.target.value;
            charactersLoaded  = false;
            gallery.innerHTML = '';
            if (currentProjectId && document.getElementById('source').style.display === 'block') {
                loadCharacters();
            }
            if (openAddCharBtn) {
                openAddCharBtn.disabled = !currentProjectId;
            }
        });
    }

    if (openAddCharBtn && addCharModal && closeAddCharBtn) {
        openAddCharBtn.addEventListener('click', () => {
            addCharModal.style.display = 'flex';
        });
        closeAddCharBtn.addEventListener('click', () => {
            addCharModal.style.display = 'none';
        });
        window.addEventListener('click', e => {
            if (e.target === addCharModal) {
                addCharModal.style.display = 'none';
            }
        });
        addCharForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (!currentProjectId) return alert('Bitte zuerst ein Projekt auswählen!');
            const fd = new FormData(addCharForm);
            try {
                const res = await fetch(
                    `/project/${currentProjectId}/source/character`,
                    { method: 'POST', body: fd, credentials: 'same-origin' }
                );
                if (!res.ok) throw new Error(`Status ${res.status}`);
                addCharModal.style.display = 'none';
                charactersLoaded = false;
                loadCharacters();
                addCharForm.reset();
            } catch (err) {
                console.error('Error saving character:', err);
                alert(`Konnte Character nicht speichern. (${err.message})`);
            }
        });
    }

    if (charModalCloseBtn && charModal) {
        charModalCloseBtn.addEventListener('click', () => {
            charModal.style.display = 'none';
        });
        window.addEventListener('click', e => {
            if (e.target === charModal) {
                charModal.style.display = 'none';
            }
        });
    }


    // 6) PROJECTS Tab: Modal Logic
    const projectListUl          = document.getElementById('projectList');
    const projectModal           = document.getElementById('projectModal');
    const closeProjBtn           = document.getElementById('closeProjectModal');
    const openProjectModalButton = document.getElementById('openProjectModalButton');
    const postsContainer         = document.getElementById('projectPostsList');
    const projNameEl             = document.getElementById('projectName');
    const projDescEl             = document.getElementById('projectDesc');

    if (projectListUl) {
        projectListUl.addEventListener('click', async e => {
            const li = e.target.closest('.project-item');
            if (!li) return;

            const projectId   = li.dataset.id;
            const projectName = li.dataset.name;
            const projectDesc = li.dataset.desc;

            projNameEl.textContent = projectName;
            projDescEl.textContent = projectDesc;
            postsContainer.innerHTML = '';

            try {
                const res   = await fetch(`/project/${projectId}/posts`);
                const posts = await res.json();
                posts.forEach(post => {
                    const card = document.createElement('div');
                    card.className = 'post-card';

                    const header = document.createElement('div');
                    header.className = 'post-header';
                    header.innerHTML = `
            <img src="/${post.avatar || 'default_profile.png'}" 
                 class="post-avatar" 
                 alt="${post.username}">
            <strong>${post.username}</strong>
            <time>${new Date(post.createdAt).toLocaleString()}</time>
          `;
                    card.appendChild(header);

                    const titleEl = document.createElement('h5');
                    titleEl.textContent = post.title;
                    card.appendChild(titleEl);

                    if (post.type === 'chapter') {
                        const link = document.createElement('a');
                        link.href        = `/chapter/${post.id}`;
                        link.textContent = '📖 Read Chapter';
                        link.className   = 'read-link';
                        card.appendChild(link);
                    } else if (post.type === 'comic') {
                        const link = document.createElement('a');
                        link.href        = `/comic/${post.id}`;
                        link.textContent = '🎞️ Read Comic';
                        link.className   = 'read-link';
                        card.appendChild(link);
                    } else if (post.type === 'image' && post.image) {
                        const img = document.createElement('img');
                        img.src       = `/${post.image}`;
                        img.alt       = 'Post Image';
                        img.className = 'post-image';
                        card.appendChild(img);
                    } else {
                        const contentEl = document.createElement('p');
                        contentEl.textContent = post.content;
                        card.appendChild(contentEl);
                    }

                    if (post.hashtags && post.hashtags.length) {
                        const tagsDiv = document.createElement('div');
                        tagsDiv.className = 'post-hashtags';
                        post.hashtags.split(',').forEach(tag => {
                            const span = document.createElement('span');
                            span.className = 'hashtag-item';
                            span.textContent = `#${tag}`;
                            tagsDiv.appendChild(span);
                        });
                        card.appendChild(tagsDiv);
                    }

                    postsContainer.appendChild(card);
                });
            } catch (err) {
                console.error('Failed loading project posts:', err);
            }

            projectModal.style.display = 'flex';
        });
    }

    if (closeProjBtn) {
        closeProjBtn.addEventListener('click', () => {
            projectModal.style.display = 'none';
        });
    }

    window.addEventListener('click', e => {
        if (e.target === projectModal) {
            projectModal.style.display = 'none';
        }
    });

    const createProjectModal            = document.getElementById('createProjectModal');
    const closeCreateProjectModalButton = document.getElementById('closeCreateProjectModal');
    const createProjectForm             = document.getElementById('createProjectForm');

    if (openProjectModalButton && createProjectModal) {
        openProjectModalButton.addEventListener('click', () => {
            createProjectModal.style.display = 'flex';
        });
    }

    if (closeCreateProjectModalButton && createProjectModal) {
        closeCreateProjectModalButton.addEventListener('click', () => {
            createProjectModal.style.display = 'none';
        });
    }

    window.addEventListener('click', event => {
        if (event.target === createProjectModal) {
            createProjectModal.style.display = 'none';
        }
    });

    if (createProjectForm) {
        createProjectForm.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.target;
            const formData = new URLSearchParams(new FormData(form));

            try {
                const response = await fetch('/createProject', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                if (response.ok) {
                    alert('Project created successfully!');
                    window.location.reload();
                } else {

                    const errorData = await response.json();
                    alert(`Error: ${errorData.error || 'Failed to create project'}`);
                }
            } catch (error) {
                console.error('Error creating project:', error);
                alert('An error occurred while creating the project.');
            }
        });
    }


});

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInformation();
    await fetchUsernames();
    await fetchUserBoards();
    await fetchUserAvatarImage();
    await fetchUserHeaderImage();
});
async function fetchUserAvatarImage() {
    try {
        const response = await fetch('/get-user-avatar', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            const profileImage = data.profile_image.startsWith("profile_images/") ? `/${data.profile_image}` : "/profile_images/default_profile.png";
            document.getElementById('userprofileImage').src = profileImage;
        } else {
            console.error('Error fetching user avatar image');
        }
    } catch (error) {
        console.error('Error fetching user avatar image:', error);
    }
}

async function fetchUserHeaderImage() {
    try {
        const response = await fetch('/get-user-header', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            const headerImage = data.header_image ? `/${data.header_image}` : '/uploads/default_header.png';
            document.getElementById('userheaderImage').src = headerImage;
        } else {
            console.error('Error fetching user header image');
        }
    } catch (error) {
        console.error('Error fetching user header image:', error);
    }
}

async function fetchUserInformation() {
    fetch('/username', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('fetchUsername').textContent = data.username || "click to edit...";
            document.getElementById('fetchEmail').textContent = data.email || "click to edit...";
            document.getElementById('fetchRole').textContent = data.role || "click to edit...";

            const adminButton = document.getElementById('adminButton');
            adminButton.style.display = data.role === 'admin' ? 'block' : 'none';
        })
        .catch(error => console.error('Error fetching user info:', error));
}

async function fetchUsernames() {
    const response = await fetch('/online-users');
    const data = await response.json();

    const onlineUsersList = document.getElementById('onlineUsers');
    onlineUsersList.innerHTML = `<p>Online Users: ${data.count}</p>`;

    data.users.forEach(user => {
        const listItem = document.createElement('li');
        listItem.textContent = user;
        onlineUsersList.appendChild(listItem);
    });
}

async function fetchUserBoards() {
    const userBoardList = document.getElementById('userBoardList');
    userBoardList.innerHTML = ''; // Clear old content

    try {
        const response = await fetch('/user-boards');
        const boards = await response.json();

        if (!boards.length) {
            userBoardList.innerHTML = '<p>No boards found.</p>';
            return;
        }

        boards.forEach(board => {
            const li = document.createElement('li');
            li.classList.add('board-item');

            const profileImage = board.profile_image.startsWith("uploads/") ? `/${board.profile_image}` : "/uploads/default_profile.png";
            const headerImage = board.header_image.startsWith("uploads/") ? `/${board.header_image}` : "/uploads/default_header.png";

            li.innerHTML = `
                <div class="header-container">
                    <img src="${headerImage}" alt="${board.name} header" class="header-image" 
                        onerror="this.onerror=null;this.src='/uploads/default_header.png';" />
                    <img src="${profileImage}" alt="${board.name} profile" class="profile-image" 
                        onerror="this.onerror=null;this.src='/uploads/default_profile.png';" />
                </div>
                <h2>${board.name}</h2>
                <p>${board.description}</p>
            `;

            userBoardList.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching boards:", error);
    }
}

document.getElementById('createBoardForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('boardName').value);
    formData.append('description', document.getElementById('boardDescription').value);

    const profileImage = document.getElementById('profileImage').files[0];
    if (profileImage) formData.append('profileImage', profileImage);

    const headerImage = document.getElementById('headerImage').files[0];
    if (headerImage) formData.append('headerImage', headerImage);

    const visibility = document.getElementById('boardType').value;
    formData.append('visibility', visibility);

    try {
        const response = await fetch('/create', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            await fetchUserBoards();
            document.getElementById('createBoardForm').reset();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.errors.map(e => e.msg).join(', ')}`);
        }
    } catch (error) {
        console.error("Error creating board:", error);
    }
});

document.getElementById('userprofileImage').addEventListener('click', () => {
    document.getElementById('profileImageInput').click();
});

document.getElementById('userheaderImage').addEventListener('click', () => {
    document.getElementById('headerImageInput').click();
});

document.getElementById('profileImageInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/update-user-avatar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                // Profil sofort updaten
                const profileImageElement = document.getElementById('userprofileImage');
                profileImageElement.src = `/${result.profile_image}?t=${new Date().getTime()}`; // Prevent caching issues
            } else {
                console.error('Error updating profile image:', result.error);
            }
        } catch (error) {
            console.error('Error updating profile image:', error);
        }
    }
});

document.getElementById('headerImageInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('header', file);

        try {
            const response = await fetch('/update-user-header', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                // Header sofort updaten
                const headerImageElement = document.getElementById('userheaderImage');
                headerImageElement.src = `/${result.header_image}?t=${new Date().getTime()}`; // Prevent caching issues
            } else {
                console.error('Error updating header image:', result.error);
            }
        } catch (error) {
            console.error('Error updating header image:', error);
        }
    }
});

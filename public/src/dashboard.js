document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInformation();
    await fetchUsernames();
    await fetchUserBoards();
});

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

        console.log("Fetched Boards:", boards); // Debugging: Check if data is returned

        if (!boards.length) {
            userBoardList.innerHTML = '<p>No boards found.</p>';
            return;
        }

        boards.forEach(board => {
            const li = document.createElement('li'); // Using <li> to match previous structure
            li.classList.add('board-item');

            // Ensure images use correct paths
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

    // Ensure images are only added if selected
    const profileImage = document.getElementById('profileImage').files[0];
    if (profileImage) formData.append('profileImage', profileImage);

    const headerImage = document.getElementById('headerImage').files[0];
    if (headerImage) formData.append(' headerImage', headerImage);

    const boardTypeElement = document.getElementById('boardType');
    if (boardTypeElement) {
        formData.append('boardType', boardTypeElement.value);
    }

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

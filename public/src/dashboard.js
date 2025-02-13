document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInformation();
    await fetchUsernames();
    await fetchBoards();
});

async function fetchUserInformation() {
    fetch('/username', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const usernameElement = document.getElementById('fetchUsername');
            if (usernameElement) {
                usernameElement.textContent = data.username;
            }
            const emailElement = document.getElementById('fetchEmail');
            if (emailElement) {
                emailElement.textContent = data.email;
            }
            const roleElement = document.getElementById('fetchRole');
            if (roleElement) {
                roleElement.textContent = data.role;
            }

            const adminButton = document.getElementById('adminButton');
            if (data.role === 'admin') {
                adminButton.style.display = 'block';
            } else {
                adminButton.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

async function fetchUsernames() {
    const response = await fetch('/online-users');
    const data = await response.json();

    const onlineUsersList = document.getElementById('onlineUsers');
    const onlineUsersCount = document.createElement('p');

    onlineUsersCount.textContent = `Online Users: ${data.count}`;
    onlineUsersList.appendChild(onlineUsersCount);

    data.users.forEach(user => {
        const listItem = document.createElement('li');
        listItem.textContent = user;
        onlineUsersList.appendChild(listItem);
    });
}

async function fetchBoards() {
    const boardList = document.getElementById('boardList');
    const response = await fetch('/boards');
    const boards = await response.json();
    boardList.innerHTML = '';
    boards.forEach(board => {
        const li = document.createElement('li');
        //change later so we can see the img of the server profile and header
        li.innerHTML = `
            <div class="header-container">
                <img src="${board.headerImage}" alt="${board.name} header" class="header-image" />
                <img src="${board.profileImage}" alt="${board.name} profile" class="profile-image" />
            </div>
            <h2>${board.name}</h2>
            <p>${board.description}</p>
        `;
        boardList.appendChild(li);
    });
}

document.getElementById('createBoardForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('boardName').value);
    formData.append('description', document.getElementById('boardDescription').value);
    formData.append('profileImage', document.getElementById('profileImage').files[0]);
    formData.append('headerImage', document.getElementById('headerImage').files[0]);

    const response = await fetch('/create', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        fetchBoards();
        document.getElementById('createBoardForm').reset();
    } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.errors.map(e => e.msg).join(', ')}`);
    }
});
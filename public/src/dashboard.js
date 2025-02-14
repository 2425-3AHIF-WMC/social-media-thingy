document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInformation();
    await fetchUsernames();
    await fetchUserBoards();
    enableEditableFields();
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
    const response = await fetch('/user-boards');
    const boards = await response.json();
    userBoardList.innerHTML = '';

    boards.forEach(board => {
        const li = document.createElement('li');
        const descriptionWords = board.description.split(' ').length;
        const descriptionClass = descriptionWords > 30 ? 'description' : '';
        const truncatedDescription = board.description.split(' ').slice(0, 20).join(' ') + (descriptionWords > 20 ? '...' : '');
        li.innerHTML = `
            <div class="header-container">
                <img src="/${board.header_image}" alt="${board.name} header" class="header-image" onerror="this.onerror=null;this.src='/uploads/default_header.png';" />
                <img src="/${board.profile_image}" alt="${board.name} profile" class="profile-image" onerror="this.onerror=null;this.src='/uploads/default_profile.png';" />
            </div>
            <h2>${board.name}</h2>
            <p class="${descriptionClass}" title="${board.description}">${truncatedDescription}</p>
        `;
        userBoardList.appendChild(li);
    });
}

document.getElementById('createBoardForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('boardName').value);
    formData.append('description', document.getElementById('boardDescription').value);
    formData.append('profileImage', document.getElementById('profileImage').files[0]);
    formData.append('headerImage', document.getElementById('headerImage').files[0]);
    formData.append('boardType', document.getElementById('boardType').value);

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
});

function enableEditableFields() {
    document.querySelectorAll(".editable-box").forEach(box => {
        box.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent new line
                const fieldId = event.target.id;
                const newValue = event.target.innerText.trim();

                console.log("Updating field:", fieldId, "with value:", newValue);

                if (fieldId && newValue) {
                    await fetch("/update-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ field: fieldId, value: newValue })
                    });
                }
                event.target.blur(); // Remove focus after saving
            }
        });
    });
}

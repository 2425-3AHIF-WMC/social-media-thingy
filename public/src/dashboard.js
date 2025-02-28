let hashtagsSet = new Set();

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
            li.setAttribute('data-board-id', board.id);

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
                <a href="/board/${board.id}" target="_blank">Open Board</a>
            `;

            userBoardList.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching boards:", error);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".board-item").forEach(item => {
        item.addEventListener("click", (event) => {
            const boardId = item.getAttribute("data-board-id");
            window.open(`/board/${boardId}`, '_blank');
        });
    });
});

document.getElementById("addHashtagButton").addEventListener("click", () => {
    const hashtagInput = document.getElementById("boardHashtags");
    let tag = hashtagInput.value.trim();

    if (!tag || hashtagsSet.has(tag)) return; // Avoid duplicates or empty tags

    if (hashtagsSet.size >= 5) {
        alert("You can only add up to 5 hashtags.");
        document.getElementById("addHashtagButton").disabled = true; // Disable button
        return;
    }

    hashtagsSet.add(tag);
    updateHashtagDisplay();
    hashtagInput.value = "";

    if (hashtagsSet.size >= 5) {
        document.getElementById("addHashtagButton").disabled = true; // Lock button after 5 tags
    }
});

function updateHashtagDisplay() {
    const hashtagList = document.getElementById("hashtagList");
    hashtagList.innerHTML = "";
    hashtagsSet.forEach(tag => {
        const span = document.createElement("span");
        span.textContent = `#${tag} `;
        hashtagList.appendChild(span);
    });
}

document.getElementById("createBoardForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Collect values
    const name = document.getElementById('boardName').value.trim();
    const description = document.getElementById('boardDescription').value.trim();
    const boardType = document.getElementById('boardType').value;

    if (!name || !description) {
        alert("Name and description are required!");
        return;
    }

    // Create FormData object
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('visibility', boardType);

    // Convert hashtags to JSON before appending
    const hashtagsArray = Array.from(hashtagsSet).slice(0, 5);
    if (hashtagsArray.length > 0) {
        formData.append("hashtags", JSON.stringify(hashtagsArray)); // Send as a proper JSON string
    }

    // Handle image uploads correctly
    const profileImage = document.getElementById('profileImage').files[0];
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }

    const headerImage = document.getElementById('headerImage').files[0];
    if (headerImage) {
        formData.append('headerImage', headerImage);
    }

    // Debugging: Log the formData contents before sending
    console.log("🚀 FormData before submission:");
    for (const pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
    }

    try {
        const response = await fetch('/create', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log("🛠️ Server Response:", result);

        if (response.ok) {
            alert("Board created successfully!");
            hashtagsSet.clear();
            updateHashtagDisplay();
            document.getElementById("createBoardForm").reset();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Error creating board:", error);
        alert("Failed to create board. Please try again.");
    }
});

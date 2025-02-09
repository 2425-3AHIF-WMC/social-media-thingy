document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInformation();
    await fetchUsernames();
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
            }else {
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
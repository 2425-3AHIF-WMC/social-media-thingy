document.addEventListener('DOMContentLoaded', () => {
    fetchAllBoards(); // Load all boards on page load

    document.getElementById("searchBoardButton").addEventListener("click", () => {
        const searchTerm = document.getElementById("searchBoardInput").value.trim();
        fetchAllBoards(searchTerm);
    });
});

async function fetchAllBoards(searchTerm = "") {
    const url = searchTerm ? `/boards?search=${encodeURIComponent(searchTerm)}` : "/boards";
    const response = await fetch(url);
    const boards = await response.json();

    const boardResults = document.getElementById("boardResults");
    boardResults.innerHTML = ""; // Clear previous results

    if (!boards.length) {
        boardResults.innerHTML = "<p>No boards found.</p>";
        return;
    }

    boards.forEach(board => {
        const boardElement = document.createElement("li");
        boardElement.classList.add("board-item");

        const profileImage = board.profile_image.startsWith("uploads/") ? `/${board.profile_image}` : "/uploads/default_profile.png";
        const headerImage = board.header_image.startsWith("uploads/") ? `/${board.header_image}` : "/uploads/default_header.png";

        boardElement.innerHTML = `
            <div class="header-container">
                <img src="${headerImage}" class="header-image" alt="Header Image"
                    onerror="this.onerror=null;this.src='/uploads/default_header.png';">
                <img src="${profileImage}" class="profile-image" alt="Profile Image"
                    onerror="this.onerror=null;this.src='/uploads/default_profile.png';">
            </div>
            <h2>${board.name}</h2>
            <p>${board.description}</p>
            <p><strong>Hashtag:</strong> ${formatHashtag(board.hashtag)}</p>
        `;
        boardResults.appendChild(boardElement);
    });
}

function formatHashtag(hashtag) {
    if (!hashtag || hashtag.trim() === "") return "None";
    return hashtag.split(" ").map(tag => `#${tag}`).join(", ");
}

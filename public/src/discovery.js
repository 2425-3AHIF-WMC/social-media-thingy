document.addEventListener('DOMContentLoaded', () => {
    let allBoards = [];
    const showing = {}; // tracking, welche Sektion ausgeklappt ist

    const boardResults = document.getElementById('boardResults');
    const searchInput  = document.getElementById('searchBoardInput');
    const searchButton = document.getElementById('searchBoardButton');

    // 1) Erstmal laden
    fetchAndRender();

    // 2) Suche neu laden
    searchButton.addEventListener('click', () => {
        fetchAndRender(searchInput.value.trim());
    });

    async function fetchAndRender(term = '') {
        // bei neuer Suche alles wieder einklappen
        Object.keys(showing).forEach(k => showing[k] = false);

        const url = term
            ? `/boards?search=${encodeURIComponent(term)}`
            : '/boards';
        const resp = await fetch(url);
        allBoards = await resp.json();
        renderAll();
    }

    function renderAll() {
        boardResults.innerHTML = '';

        // 3) Nach Typ gruppieren (board_type_id: 1=Art, 2=Writing, 3=Comic, sonst All)
        const artBoards     = allBoards.filter(b => b.board_type_id === 1);
        const writingBoards = allBoards.filter(b => b.board_type_id === 2);
        const comicBoards   = allBoards.filter(b => b.board_type_id === 3);
        const allBoardsType = allBoards.filter(b => ![1,2,3].includes(b.board_type_id));

        // 4) „All“-Boards weiter nach Hashtag gruppieren
        const groups = {};
        allBoardsType.forEach(b => {
            if (b.hashtag) {
                b.hashtag.split(',').map(s=>s.trim()).filter(s=>s)
                    .forEach(tag => {
                        const key = tag.toLowerCase();
                        if (!groups[key]) groups[key] = { hashtag: tag, boards: [] };
                        groups[key].boards.push(b);
                    });
            } else {
                if (!groups._uncat) groups._uncat = { hashtag: 'Uncategorized', boards: [] };
                groups._uncat.boards.push(b);
            }
        });
        const allGroups = Object.values(groups)
            .sort((a,b) => {
                if (a.hashtag==='Uncategorized') return 1;
                if (b.hashtag==='Uncategorized') return -1;
                return a.hashtag.localeCompare(b.hashtag);
            });

        // 5) Render-Sektionen
        renderSection('Art',     'art',     artBoards);
        renderSection('Writing', 'writing', writingBoards);
        renderSection('Comic',   'comic',   comicBoards);

        // 6) Untergruppen „All“
        allGroups.forEach(g => {
            const key = `all-${g.hashtag.toLowerCase().replace(/\W/g,'-')}`;
            renderSection(
                g.hashtag==='Uncategorized' ? 'Others' : g.hashtag,
                key,
                g.boards,
                true // <h3> statt <h2>
            );
        });
    }

    function renderSection(title, key, boards, useH3=false) {
        if (!boards.length) return;
        const section = document.createElement('section');
        section.className = 'category-section';

        const Heading = useH3 ? 'h3' : 'h2';
        const headEl = document.createElement(Heading);
        headEl.textContent = title;
        section.appendChild(headEl);

        const grid = document.createElement('div');
        grid.className = 'board-grid';
        boards.slice(0,5).forEach(b=> grid.appendChild(boardCard(b)));
        section.appendChild(grid);

        if (boards.length > 5) {
            const btn = document.createElement('button');
            btn.className = 'toggle-btn';
            btn.textContent = showing[key] ? 'Weniger anzeigen' : 'Zeige alle Boards an';
            btn.addEventListener('click', () => {
                showing[key] = !showing[key];
                extra.classList.toggle('hidden');
                btn.textContent = showing[key] ? 'Weniger anzeigen' : 'Zeige alle Boards an';
            });
            section.appendChild(btn);

            const extra = document.createElement('div');
            extra.id = `extra-${key}`;
            extra.className = 'board-grid hidden';
            boards.slice(5).forEach(b=> extra.appendChild(boardCard(b)));
            section.appendChild(extra);
        }

        boardResults.appendChild(section);
    }

    function boardCard(b) {
        const card = document.createElement('div');
        card.className = 'board-card';
        const prof = b.profile_image.startsWith('uploads/')
            ? `/${b.profile_image}`
            : '/uploads/default_profile.png';
        const head = b.header_image.startsWith('uploads/')
            ? `/${b.header_image}`
            : '/uploads/default_header.png';

        card.innerHTML = `
      <div class="header-container">
        <img src="${head}" class="header-image" alt="Header"
             onerror="this.onerror=null;this.src='/uploads/default_header.png'">
        <img src="${prof}" class="profile-image" alt="Profile"
             onerror="this.onerror=null;this.src='/uploads/default_profile.png'">
      </div>
      <div class="board-info">
        <h3>${b.name}</h3>
        <p>${b.description}</p>
        <p><strong>Hashtags:</strong> ${formatHashtag(b.hashtag)}</p>
        <a href="/board/${b.id}">Open Board</a>
      </div>
    `;
        return card;
    }

    function formatHashtag(str) {
        if (!str) return 'None';
        return str.split(',')
            .map(s=>s.trim())
            .filter(s=>s)
            .map(s=> `#${s}`)
            .join(' ');
    }
});

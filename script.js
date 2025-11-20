let dados = [];
let dadosFiltrados = [];
const cardsSection = document.getElementById('cards-section');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const paginationSection = document.getElementById('pagination-section');
const loader = document.getElementById('loader');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const backToTopBtn = document.getElementById('back-to-top-btn');
const genreFiltersContainer = document.getElementById('genre-filters');
const sortBySelect = document.getElementById('sort-by');
const videoModal = document.getElementById('video-modal');
const videoContainer = document.getElementById('video-container');
const videoCloseBtn = document.querySelector('.video-close-btn');

let paginaAtual = 1;
const itensPorPagina = 6;
let activeGenre = 'Todos';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function renderCards(games) {
    cardsSection.innerHTML = '';
    loader.style.display = 'none';

    if (games.length === 0) {
        cardsSection.innerHTML = '<p class="not-found">Nenhum jogo encontrado.</p>';
        return;
    }

    games.forEach(jogo => {
        const card = document.createElement('article');
        card.classList.add('game-card');

        card.innerHTML = `
            <div class="card-header">
                <h2>${jogo.nome}</h2>
            </div>
            <img src="${jogo.imagem}" alt="Imagem do jogo ${jogo.nome}" class="game-image">
            <p>${jogo.descricao}</p>
            <p class="game-year"><strong>Ano:</strong> ${jogo.ano}</p>
            <div class="card-actions">
                <button class="card-action-btn favorite-btn" data-nome="${jogo.nome}" title="Favoritar">
                    ${favorites.includes(jogo.nome) ? '♥' : '♡'}
                </button>
                <button class="card-action-btn play-video-btn" data-video="${jogo.video}" title="Ver Trailer">▶</button>
            </div>
        `;

        // Adiciona evento de clique na imagem para abrir o link do jogo
        card.querySelector('.game-image').addEventListener('click', () => {
            window.open(jogo.link, '_blank');
        });

        // Lógica de Favoritos
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique no botão dispare outros eventos do card
            toggleFavorite(jogo.nome, favoriteBtn);
        });

        // Lógica do Vídeo
        const playBtn = card.querySelector('.play-video-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openVideoModal(jogo.video);
        });

        let tooltipTimeout;
        card.addEventListener('mouseenter', () => {
            // Lógica da animação 3D aleatória
            const shouldRotateRight = card.dataset.lastDirection !== 'right';
            const randomY = Math.floor(Math.random() * 10) + 8; // Rotação Y entre 8 e 17 graus
            const randomX = Math.floor(Math.random() * 5) + 2;  // Rotação X entre 2 e 6 graus
            const directionMultiplier = shouldRotateRight ? 1 : -1;

            card.style.transform = `perspective(1000px) rotateY(${randomY * directionMultiplier}deg) rotateX(${randomX}deg) scale(1.05)`;
            card.style.boxShadow = `${10 * directionMultiplier}px 20px 30px rgba(0, 0, 0, 0.4)`;
            
            card.dataset.lastDirection = shouldRotateRight ? 'right' : 'left';

            // Lógica do tooltip
            tooltipTimeout = setTimeout(() => {
                const tooltip = document.createElement('div');
                tooltip.className = 'card-tooltip';
                tooltip.innerText = 'Clique para saber mais!';
                card.appendChild(tooltip);
            }, 600); // 600ms
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

            clearTimeout(tooltipTimeout);
            const tooltip = card.querySelector('.card-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });

        cardsSection.appendChild(card);
    });
}

function toggleFavorite(gameName, button) {
    const index = favorites.indexOf(gameName);
    if (index > -1) {
        favorites.splice(index, 1); // Remove dos favoritos
        button.innerHTML = '♡';
    } else {
        favorites.push(gameName); // Adiciona aos favoritos
        button.innerHTML = '♥';
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Se estiver na aba de favoritos, atualiza a tela
    if (activeGenre === 'Favoritos') {
        applyFiltersAndSort();
    }
}

function renderPagination() {
    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
    paginationSection.innerHTML = '';

    if (totalPaginas <= 1) return; // Não mostra paginação se só tem 1 página

    for (let i = 1; i <= totalPaginas; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.classList.add('page-btn');
        if (i === paginaAtual) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            paginaAtual = i;
            updateDisplay();
        });
        paginationSection.appendChild(pageButton);
    }
}

function updateDisplay() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensDaPagina = dadosFiltrados.slice(inicio, fim);

    renderCards(itensDaPagina);
    renderPagination();
}

function applyFiltersAndSort() {
    let filtered = [...dados];

    // 1. Filtrar por Gênero/Favoritos
    if (activeGenre === 'Favoritos') {
        filtered = filtered.filter(jogo => favorites.includes(jogo.nome));
    } else if (activeGenre !== 'Todos') {
        filtered = filtered.filter(jogo => jogo.genero.includes(activeGenre));
    }

    // 2. Filtrar por Busca
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(jogo => 
            jogo.nome.toLowerCase().includes(searchTerm)
        );
    }

    // 3. Ordenar
    const sortValue = sortBySelect.value;
    if (sortValue === 'az') {
        filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (sortValue === 'za') {
        filtered.sort((a, b) => b.nome.localeCompare(a.nome));
    } else if (sortValue === 'newest') {
        filtered.sort((a, b) => b.ano - a.ano);
    } else if (sortValue === 'oldest') {
        filtered.sort((a, b) => a.ano - b.ano);
    }

    dadosFiltrados = filtered;
    paginaAtual = 1;
    updateDisplay();
}

function populateGenreFilters() {
    const genres = new Set(dados.flatMap(jogo => jogo.genero));
    const filterButtons = ['Todos', ...genres, 'Favoritos'];
    genreFiltersContainer.innerHTML = filterButtons.map(genre => `<button class="genre-btn ${genre === activeGenre ? 'active' : ''}" data-genre="${genre}">${genre}</button>`).join('');
}

async function init() {
    // Mostra o loader e esconde a paginação
    loader.style.display = 'block';
    paginationSection.style.display = 'none';

    let resposta = await fetch("data.json");
    dados = await resposta.json();
    populateGenreFilters();
    applyFiltersAndSort();
    updateDisplay();
    paginationSection.style.display = 'flex'; // Mostra a paginação após carregar
}

genreFiltersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('genre-btn')) {
        const selectedGenre = e.target.dataset.genre;
        activeGenre = selectedGenre;
        // Atualiza a classe 'active'
        document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        applyFiltersAndSort();
    }
});

searchButton.addEventListener('click', handleSearch);

searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

searchInput.addEventListener('input', () => {
    applyFiltersAndSort();
});

sortBySelect.addEventListener('change', applyFiltersAndSort);

function handleSearch() { // Função mantida para o botão e Enter
    applyFiltersAndSort();
}

// Lógica do Tema
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.dataset.theme;
    if (currentTheme === 'light') {
        document.body.removeAttribute('data-theme');
        themeToggleBtn.innerText = '🌙';
        localStorage.removeItem('theme');
    } else {
        document.body.dataset.theme = 'light';
        themeToggleBtn.innerText = '☀️';
        localStorage.setItem('theme', 'light');
    }
});

// Lógica do Botão Voltar ao Topo
window.onscroll = function() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
};

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Verifica o tema salvo no carregamento da página
if (localStorage.getItem('theme') === 'light') {
    document.body.dataset.theme = 'light';
    themeToggleBtn.innerText = '☀️';
}

// Lógica do Modal de Vídeo
function openVideoModal(videoId) {
    videoContainer.innerHTML = `<iframe width="100%" height="450" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    videoModal.style.display = 'block';
}

function closeVideoModal() {
    videoContainer.innerHTML = '';
    videoModal.style.display = 'none';
}

videoCloseBtn.addEventListener('click', closeVideoModal);
window.addEventListener('click', (event) => {
    if (event.target == videoModal) {
        closeVideoModal();
    }
});

init();

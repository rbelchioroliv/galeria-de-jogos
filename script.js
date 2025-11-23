let dados = [];
let dadosFiltrados = [];
const mainContent = document.querySelector('main');
const header = document.querySelector('header');
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
let allGenres = []; // Armazenará todos os gêneros para fácil acesso

// --- Lógica de Autenticação ---
let users = JSON.parse(localStorage.getItem('users')) || [];
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

function updateGenreFilterDisplay() {
    // Ponto de quebra para mobile, o mesmo usado no CSS
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        renderGenreSelect();
    } else {
        renderGenreButtons();
    }
}

function renderGenreButtons() {
    genreFiltersContainer.innerHTML = allGenres.map(genre => 
        `<button class="genre-btn ${genre === activeGenre ? 'active' : ''}" data-genre="${genre}">${genre}</button>`
    ).join('');
}

function renderGenreSelect() {
    genreFiltersContainer.innerHTML = ''; // Limpa os botões existentes
    const select = document.createElement('select');
    select.classList.add('genre-select'); // Classe para estilização

    select.innerHTML = allGenres.map(genre => 
        `<option value="${genre}" ${genre === activeGenre ? 'selected' : ''}>${genre}</option>`
    ).join('');

    select.addEventListener('change', (e) => {
        activeGenre = e.target.value;
        applyFiltersAndSort();
    });

    genreFiltersContainer.appendChild(select);
}

function populateAllGenres() {
    const genres = new Set(dados.flatMap(jogo => jogo.genero));
    // Ordena os gêneros alfabeticamente e adiciona 'Todos' e 'Favoritos'
    allGenres = ['Todos', ...Array.from(genres).sort(), 'Favoritos'];
}

function showMainApp(username) {
    // Remove a tela de login/cadastro se existir
    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay) {
        authOverlay.remove();
    }

    // Mostra o conteúdo principal
    mainContent.style.display = 'block';
    header.style.display = 'flex';
    paginationSection.style.display = 'flex';
    document.querySelector('.filters-container').style.display = 'flex';
    document.querySelector('.footer').style.display = 'block';

    // Adiciona informações do usuário e botão de logout no header
    const userInfoDiv = document.createElement('div');
    userInfoDiv.className = 'header-user-info';
    userInfoDiv.innerHTML = `
        <span>Bem-vindo(a), ${username}!</span>
        <button id="logout-btn" class="genre-btn">Sair</button>
    `;
    header.appendChild(userInfoDiv);

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.reload(); // Recarrega a página para mostrar a tela de login
    });
}

function renderAuthScreen() {
    // Esconde o conteúdo principal
    mainContent.style.display = 'none';
    header.style.display = 'none';
    paginationSection.style.display = 'none';
    document.querySelector('.filters-container').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';

    const authOverlay = document.createElement('div');
    authOverlay.id = 'auth-overlay';
    authOverlay.className = 'auth-overlay';

    authOverlay.innerHTML = `
        <div class="auth-container" id="auth-container">
            <div class="auth-flipper">
                <!-- Lado da Frente: Login -->
                <div class="auth-side auth-side-front">
                    <h2>Login</h2>
                    <form class="auth-form" id="login-form">
                        <input type="text" id="login-username" placeholder="Nome de usuário" required>
                        <input type="password" id="login-password" placeholder="Senha" required>
                        <button type="submit">Entrar</button>
                    </form>
                    <p class="auth-error" id="login-error"></p>
                    <p class="auth-switch">Não tem uma conta? <span id="switch-to-register">Cadastre-se</span></p>
                </div>

                <!-- Lado de Trás: Cadastro -->
                <div class="auth-side auth-side-back">
                    <h2>Cadastro</h2>
                    <form class="auth-form" id="register-form">
                        <input type="text" id="register-username" placeholder="Escolha um nome de usuário" required>
                        <input type="password" id="register-password" placeholder="Crie uma senha" required>
                        <button type="submit">Cadastrar</button>
                    </form>
                    <p class="auth-error" id="register-error"></p>
                    <p class="auth-switch">Já tem uma conta? <span id="switch-to-login">Faça login</span></p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(authOverlay);

    const authContainer = document.getElementById('auth-container');

    // Eventos para virar o card
    document.getElementById('switch-to-register').addEventListener('click', () => {
        authContainer.classList.add('is-flipped');
    });

    document.getElementById('switch-to-login').addEventListener('click', () => {
        authContainer.classList.remove('is-flipped');
    });

    // Eventos dos formulários
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

/* As funções renderLoginScreen e renderRegisterScreen não são mais necessárias
   e podem ser removidas ou comentadas. A nova função renderAuthScreen
   cuida de ambas as telas.
*/

function renderLoginScreen() {
    // Esconde o conteúdo principal
    mainContent.style.display = 'none';
    header.style.display = 'none';
    paginationSection.style.display = 'none';
    document.querySelector('.filters-container').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';

    const authOverlay = document.createElement('div');
    authOverlay.id = 'auth-overlay';
    authOverlay.className = 'auth-overlay';

    authOverlay.innerHTML = `
        <div class="auth-container">
            <h2>Login</h2>
            <form class="auth-form" id="login-form">
                <input type="text" id="login-username" placeholder="Nome de usuário" required>
                <input type="password" id="login-password" placeholder="Senha" required>
                <button type="submit">Entrar</button>
            </form>
            <p class="auth-error" id="login-error"></p>
            <p class="auth-switch">Não tem uma conta? <span id="switch-to-register">Cadastre-se</span></p>
        </div>
    `;
    document.body.appendChild(authOverlay);

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('switch-to-register').addEventListener('click', () => {
        authOverlay.remove();
        renderRegisterScreen();
    });
}

function renderRegisterScreen() {
    const authOverlay = document.createElement('div');
    authOverlay.id = 'auth-overlay';
    authOverlay.className = 'auth-overlay';

    authOverlay.innerHTML = `
        <div class="auth-container">
            <h2>Cadastro</h2>
            <form class="auth-form" id="register-form">
                <input type="text" id="register-username" placeholder="Escolha um nome de usuário" required>
                <input type="password" id="register-password" placeholder="Crie uma senha" required>
                <button type="submit">Cadastrar</button>
            </form>
            <p class="auth-error" id="register-error"></p>
            <p class="auth-switch">Já tem uma conta? <span id="switch-to-login">Faça login</span></p>
        </div>
    `;
    document.body.appendChild(authOverlay);

    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('switch-to-login').addEventListener('click', () => {
        authOverlay.remove();
        renderLoginScreen();
    });
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.reload();
    } else {
        errorEl.textContent = 'Usuário ou senha inválidos.';
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');

    if (users.some(u => u.username === username)) {
        errorEl.textContent = 'Este nome de usuário já existe.';
        return;
    }

    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Cadastro realizado com sucesso! Faça o login para continuar.');
    // Vira o card de volta para a tela de login
    const authContainer = document.getElementById('auth-container');
    authContainer.classList.remove('is-flipped');
}

async function init() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (currentUser) {
        // Se o usuário está logado, mostra o app
        showMainApp(currentUser.username);
        loader.style.display = 'block';
        paginationSection.style.display = 'none';
        
        let resposta = await fetch("data.json");
        dados = await resposta.json();
        populateAllGenres();
        updateGenreFilterDisplay();
        applyFiltersAndSort();
        updateDisplay();
        paginationSection.style.display = 'flex';
    } else {
        // Se não, mostra a tela de login
        renderAuthScreen(); // Substituímos a chamada aqui
    }
}

genreFiltersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('genre-btn')) {
        // A delegação de evento continua funcionando para os botões
        const selectedGenre = e.target.dataset.genre;
        activeGenre = selectedGenre;
        // Atualiza a classe 'active'
        document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        applyFiltersAndSort();
    } else if (e.target.classList.contains('genre-select')) {
        // O evento do select é tratado diretamente em sua criação, então não fazemos nada aqui.
        return;
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

// Adiciona um listener para redimensionamento da janela
window.addEventListener('resize', updateGenreFilterDisplay);

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

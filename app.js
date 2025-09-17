// Homebrew Games Website - Main JavaScript
class HomebrewGamesApp {
    constructor() {
        this.currentPage = 'home';
        this.currentSystem = null;
        this.currentStatus = null;
        this.games = [];
        this.filteredGames = [];
        this.currentGameIndex = 0;
        this.gamesPerLoad = 9;
        this.isLoading = false;
        this.hasMoreGames = true;
        this.currentLanguage = 'en';
        this.currentTheme = 'dark';
        this.translations = {};
        
        this.init();
    }

    async init() {
        this.loadSettings();
        this.setupEventListeners();
        this.handleInitialRoute();
        await this.loadTranslations();
        await this.loadGamesData();
        this.updateLanguage();
        this.updateTheme();
    }

    setupEventListeners() {
        // Home link event listener
        document.getElementById('home-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('');
        });

        // Navigation event listeners
        document.querySelectorAll('.dropdown-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                this.navigateTo(href);
            });
        });

        // System card clicks
        document.querySelectorAll('.system-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const system = card.getAttribute('data-system');
                this.navigateTo(`#${system}/new-games`);
            });
        });

        // Infinite scroll
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleInitialRoute();
        });

        // Language switcher event listeners
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                this.changeLanguage(lang);
            });
        });

        // Theme switcher event listener
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    handleInitialRoute() {
        const hash = window.location.hash;
        if (hash) {
            this.navigateTo(hash);
        } else {
            this.showHomePage();
        }
    }

    navigateTo(route) {
        // Update URL without triggering popstate
        if (window.location.hash !== route) {
            history.pushState(null, null, route);
        }

        if (route === '' || route === '#') {
            this.showHomePage();
            return;
        }

        // Parse route: #system/status
        const routeParts = route.substring(1).split('/');
        if (routeParts.length === 2) {
            const [system, status] = routeParts;
            this.showGamesPage(system, status);
        }
    }

    showHomePage() {
        this.currentPage = 'home';
        document.getElementById('home-page').classList.add('active');
        document.getElementById('games-page').classList.remove('active');
        document.title = 'Homebrew Games Archive';
    }

    showGamesPage(system, status) {
        this.currentPage = 'games';
        this.currentSystem = system;
        this.currentStatus = status;
        
        // Update page visibility
        document.getElementById('home-page').classList.remove('active');
        document.getElementById('games-page').classList.add('active');
        
        // Update page title and header
        const systemName = this.getSystemDisplayName(system);
        const statusNames = {
            'new-games': 'New Games',
            'ports': 'Ports',
            're-releases': 'Re-Releases',
            'in-development': 'In Development'
        };
        const statusName = statusNames[status] || status.charAt(0).toUpperCase() + status.slice(1);
        document.getElementById('page-title').textContent = `${systemName} Games`;
        document.getElementById('current-system').textContent = systemName;
        document.getElementById('current-status').textContent = statusName;
        document.title = `${systemName} ${statusName} Games - Homebrew Games Archive`;
        
        // Filter and display games
        this.filterGames(system, status);
        this.resetGamesList();
        this.loadMoreGames();
    }

    getSystemDisplayName(system) {
        const systemNames = {
            'sega-mega-drive': 'Sega Mega Drive',
            'super-nintendo': 'Super Nintendo',
            'master-system': 'Master System',
            'nes': 'NES',
            'playstation-1': 'PlayStation',
            'nintendo-64': 'Nintendo 64',
            'sega-saturn': 'Sega Saturn',
            'sega-dreamcast': 'Sega Dreamcast'
        };
        return systemNames[system] || system;
    }

    async loadGamesData() {
        try {
            // In a real implementation, this would fetch from your GitHub repo
            // For now, we'll use sample data
            this.games = await this.getSampleGamesData();
        } catch (error) {
            console.error('Error loading games data:', error);
            this.games = [];
        }
    }

    // Load games data from JSON file or GitHub API
    async getSampleGamesData() {
        try {
            // Try to load from local JSON file first
            const response = await fetch('data/games.json');
            if (!response.ok) throw new Error('Failed to load games data');
            
            const gamesData = await response.json();
            const allGames = [];
            
            // Convert nested JSON structure to flat array
            Object.keys(gamesData).forEach(system => {
                ['new-games', 'ports', 're-releases', 'in-development'].forEach(status => {
                    if (gamesData[system][status]) {
                        gamesData[system][status].forEach(game => {
                            allGames.push({
                                ...game,
                                system: system,
                                status: status
                            });
                        });
                    }
                });
            });
            
            return allGames;
        } catch (error) {
            console.error('Error loading games data:', error);
            // Fallback to empty array if loading fails
            return [];
        }
    }

    filterGames(system, status) {
        this.filteredGames = this.games.filter(game => 
            game.system === system && game.status === status
        );
        this.hasMoreGames = this.filteredGames.length > 0;
    }

    resetGamesList() {
        this.currentGameIndex = 0;
        document.getElementById('games-grid').innerHTML = '';
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('no-more-games').classList.add('hidden');
    }

    loadMoreGames() {
        if (this.isLoading || !this.hasMoreGames) return;

        this.isLoading = true;
        document.getElementById('loading').classList.remove('hidden');

        // Simulate loading delay
        setTimeout(() => {
            const gamesToLoad = this.filteredGames.slice(
                this.currentGameIndex, 
                this.currentGameIndex + this.gamesPerLoad
            );

            if (gamesToLoad.length === 0) {
                this.hasMoreGames = false;
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('no-more-games').classList.remove('hidden');
                this.isLoading = false;
                return;
            }

            gamesToLoad.forEach(game => {
                this.renderGameCard(game);
            });

            this.currentGameIndex += gamesToLoad.length;
            
            if (this.currentGameIndex >= this.filteredGames.length) {
                this.hasMoreGames = false;
                document.getElementById('no-more-games').classList.remove('hidden');
            }

            document.getElementById('loading').classList.add('hidden');
            this.isLoading = false;
        }, 800);
    }

    renderGameCard(game) {
        const gamesGrid = document.getElementById('games-grid');
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        const statusClasses = {
            'new-games': 'new-games',
            'ports': 'ports',
            're-releases': 're-releases',
            'in-development': 'in-development'
        };
        const statusTexts = {
            'new-games': 'New Game',
            'ports': 'Port',
            're-releases': 'Re-Release',
            'in-development': 'In Development'
        };
        const statusClass = statusClasses[game.status] || 'new-games';
        const statusText = statusTexts[game.status] || 'New Game';
        
        const buyButton = game.buyUrl 
            ? `<a href="${game.buyUrl}" class="buy-button" target="_blank" rel="noopener noreferrer">Buy Now</a>`
            : `<span class="buy-button unavailable">Not Available</span>`;

        gameCard.innerHTML = `
            <div class="game-cover">
                <img src="${game.cover}" alt="${game.title}" loading="lazy" onerror="this.src='assets/placeholder.svg'">
                <div class="game-status ${statusClass}">${statusText}</div>
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <p class="game-developer">${game.developer}</p>
                <p class="game-year">${game.year}</p>
                ${buyButton}
            </div>
        `;

        gamesGrid.appendChild(gameCard);
    }

    handleScroll() {
        if (this.currentPage !== 'games' || this.isLoading || !this.hasMoreGames) return;

        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        
        // Load more when user scrolls to 80% of the page
        if (scrollPosition >= documentHeight * 0.8) {
            this.loadMoreGames();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomebrewGamesApp();
});

// GitHub API integration (for future use)
class GitHubDataManager {
    constructor(repoOwner, repoName, branch = 'main') {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
        this.branch = branch;
        this.baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
    }

    async fetchGamesData() {
        try {
            const response = await fetch(`${this.baseUrl}/contents/data/games.json?ref=${this.branch}`);
            if (!response.ok) throw new Error('Failed to fetch games data');
            
            const data = await response.json();
            const content = atob(data.content);
            return JSON.parse(content);
        } catch (error) {
            console.error('Error fetching games data from GitHub:', error);
            return [];
        }
    }

    async fetchGamesBySystem(system) {
        try {
            const response = await fetch(`${this.baseUrl}/contents/data/${system}.json?ref=${this.branch}`);
            if (!response.ok) throw new Error(`Failed to fetch ${system} games data`);
            
            const data = await response.json();
            const content = atob(data.content);
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error fetching ${system} games data from GitHub:`, error);
            return [];
        }
    }

    getImageUrl(imagePath) {
        return `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.branch}/${imagePath}`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomebrewGamesApp();
});

// Homebrew Games App - Additional methods
HomebrewGamesApp.prototype.loadSettings = function() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.currentTheme = localStorage.getItem('theme') || 'dark';
};

HomebrewGamesApp.prototype.saveSettings = function() {
    localStorage.setItem('language', this.currentLanguage);
    localStorage.setItem('theme', this.currentTheme);
};

HomebrewGamesApp.prototype.loadTranslations = async function() {
    try {
        const response = await fetch(`translations/${this.currentLanguage}.json`);
        if (!response.ok) throw new Error('Failed to load translations');
        this.translations = await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English if current language fails
        if (this.currentLanguage !== 'en') {
            try {
                const fallbackResponse = await fetch('translations/en.json');
                this.translations = await fallbackResponse.json();
            } catch (fallbackError) {
                console.error('Error loading fallback translations:', fallbackError);
                this.translations = {};
            }
        }
    }
};

HomebrewGamesApp.prototype.changeLanguage = async function(lang) {
    if (lang === this.currentLanguage) return;
    
    this.currentLanguage = lang;
    this.saveSettings();
    
    // Update language button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    // Load new translations
    await this.loadTranslations();
    this.updateLanguage();
};

HomebrewGamesApp.prototype.updateLanguage = function() {
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (this.translations[key]) {
            element.textContent = this.translations[key];
        }
    });

    // Update dynamic content
    this.updateDynamicTranslations();
};

HomebrewGamesApp.prototype.updateDynamicTranslations = function() {
    // Update loading text
    const loadingElement = document.querySelector('#loading p');
    if (loadingElement && this.translations['loading-text']) {
        loadingElement.textContent = this.translations['loading-text'];
    }

    // Update no more games text
    const noMoreGamesElement = document.querySelector('#no-more-games p');
    if (noMoreGamesElement && this.translations['no-more-games']) {
        noMoreGamesElement.textContent = this.translations['no-more-games'];
    }

    // Update all dropdown links
    document.querySelectorAll('.dropdown-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href.includes('/new-games')) {
            link.textContent = this.translations['nav-new-games'] || 'New Games';
        } else if (href.includes('/ports')) {
            link.textContent = this.translations['nav-ports'] || 'Ports';
        } else if (href.includes('/re-releases')) {
            link.textContent = this.translations['nav-re-releases'] || 'Re-Releases';
        } else if (href.includes('/in-development')) {
            link.textContent = this.translations['nav-in-development'] || 'In Development';
        }
    });
};

HomebrewGamesApp.prototype.toggleTheme = function() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.saveSettings();
    this.updateTheme();
};

HomebrewGamesApp.prototype.updateTheme = function() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    if (this.currentTheme === 'light') {
        body.setAttribute('data-theme', 'light');
        themeIcon.textContent = '☀️';
    } else {
        body.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }
};

}

// Export for potential use in other modules
window.GitHubDataManager = GitHubDataManager;

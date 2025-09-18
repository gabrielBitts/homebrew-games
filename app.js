// Homebrew Games Website - Main JavaScript
class HomebrewGamesApp {
    constructor() {
        this.currentPage = 'home';
        this.currentSystem = null;
        this.currentFilters = ['all']; // Array to support multiple filter selection
        this.games = [];
        this.filteredGames = [];
        this.currentGameIndex = 0;
        this.gamesPerLoad = 9;
        this.isLoading = false;
        this.hasMoreGames = true;
        this.currentLanguage = 'en';
        this.currentTheme = 'dark';
        this.translations = {};
        this.currentSort = 'title-asc';
        
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
        this.initializeSort();
    }

    setupEventListeners() {
        // Home link event listener
        document.getElementById('home-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('');
        });

        // Navigation event listeners
        document.querySelectorAll('.nav-link[data-system]').forEach(link => {
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
                this.navigateTo(`#${system}`);
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

        // Sort controls event listener
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.saveSettings();
            
            // Re-filter and sort games if we're on the games page
            if (this.currentPage === 'games' && this.currentSystem) {
                this.filterGames(this.currentSystem, this.currentFilters);
                this.resetGamesList();
                this.loadMoreGames();
            }
        });

        // Filter buttons event listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.handleFilterClick(filter);
            });
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

        // Parse route: #system (no more /status)
        const system = route.substring(1);
        if (system) {
            this.showGamesPage(system);
        }
    }

    showHomePage() {
        this.currentPage = 'home';
        this.currentSystem = null;
        document.getElementById('home-page').classList.add('active');
        document.getElementById('games-page').classList.remove('active');
        document.title = 'Homebrew Games';
        
        // Reset navigation highlighting
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
    }

    showGamesPage(system) {
        this.currentPage = 'games';
        this.currentSystem = system;
        this.currentFilters = ['all']; // Reset filters to show all games
        
        // Update page visibility
        document.getElementById('home-page').classList.remove('active');
        document.getElementById('games-page').classList.add('active');
        
        // Update navigation highlighting
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-system') === system) {
                link.classList.add('active');
            }
        });
        
        // Reset filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === 'all') {
                btn.classList.add('active');
            }
        });
        
        // Update page title and header
        const systemName = this.getSystemDisplayName(system);
        document.getElementById('page-title').textContent = systemName;
        document.title = `${systemName} - Homebrew Games Archive`;
        
        // Filter and display games
        this.filterGames(system, this.currentFilters);
        this.updateGamesCount();
        this.resetGamesList();
        this.loadMoreGames();
    }

    getSystemDisplayName(system) {
        const systemNames = {
            'sega-mega-drive': 'Sega Mega Drive',
            'super-nintendo': 'Super Nintendo',
            'master-system': 'Master System',
            'nes': 'NES',
            'playstation-1': 'PlayStation 1',
            'nintendo-64': 'Nintendo 64',
            'sega-saturn': 'Sega Saturn',
            'sega-dreamcast': 'Sega Dreamcast'
        };
        return systemNames[system] || system.charAt(0).toUpperCase() + system.slice(1);
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

    filterGames(system, filters) {
        // If 'all' is selected or no specific filters, show all games for the system
        if (filters.includes('all') || filters.length === 0) {
            this.filteredGames = this.games.filter(game => game.system === system);
        } else {
            // Show games that match any of the selected filters
            this.filteredGames = this.games.filter(game => 
                game.system === system && filters.includes(game.status)
            );
        }
        this.sortGames();
        this.hasMoreGames = this.filteredGames.length > 0;
        this.updateGamesCount();
    }

    sortGames() {
        if (!this.filteredGames || this.filteredGames.length === 0) {
            return;
        }

        this.filteredGames.sort((a, b) => {
            switch (this.currentSort) {
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'title-num-asc':
                    return this.sortByNumbers(a.title, b.title, true);
                case 'title-num-desc':
                    return this.sortByNumbers(a.title, b.title, false);
                case 'developer-asc':
                    return a.developer.localeCompare(b.developer);
                case 'developer-desc':
                    return b.developer.localeCompare(a.developer);
                case 'developer-num-asc':
                    return this.sortByNumbers(a.developer, b.developer, true);
                case 'developer-num-desc':
                    return this.sortByNumbers(a.developer, b.developer, false);
                case 'year-desc':
                    return (b.year || 0) - (a.year || 0);
                case 'year-asc':
                    return (a.year || 0) - (b.year || 0);
                default:
                    return 0;
            }
        });
    }

    updateGamesCount() {
        const gamesTotalElement = document.getElementById('games-total');
        if (gamesTotalElement && this.filteredGames) {
            gamesTotalElement.textContent = this.filteredGames.length;
        }
    }

    sortByNumbers(a, b, ascending = true) {
        // Extract numbers from strings and sort by them
        const getNumbers = (str) => {
            const matches = str.match(/\d+/g);
            return matches ? matches.map(Number) : [];
        };

        const aNumbers = getNumbers(a);
        const bNumbers = getNumbers(b);

        // If both have numbers, compare them
        if (aNumbers.length > 0 && bNumbers.length > 0) {
            for (let i = 0; i < Math.min(aNumbers.length, bNumbers.length); i++) {
                if (aNumbers[i] !== bNumbers[i]) {
                    return ascending ? aNumbers[i] - bNumbers[i] : bNumbers[i] - aNumbers[i];
                }
            }
        }

        // Fallback to alphabetical comparison
        return ascending ? a.localeCompare(b) : b.localeCompare(a);
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
        
        // Determine button type based on availability
        let actionButton;
        let extraStatusClass = '';
        
        if (game.downloadUrl) {
            // Free game with download link
            actionButton = `<a href="${game.downloadUrl}" class="download-button" target="_blank" rel="noopener noreferrer">${this.translations['download-free'] || 'Download Free'}</a>`;
            extraStatusClass = ' free';
        } else if (game.buyUrl) {
            // Paid game with purchase link
            actionButton = `<a href="${game.buyUrl}" class="buy-button" target="_blank" rel="noopener noreferrer">${this.translations['buy-now'] || 'Buy Now'}</a>`;
        } else {
            // Not available for purchase or download
            actionButton = `<span class="buy-button unavailable">${this.translations['not-available'] || 'Not Available'}</span>`;
        }

        gameCard.innerHTML = `
            <div class="game-cover">
                <img src="${game.cover}" alt="${game.title}" loading="lazy" onerror="this.src='assets/placeholder.svg'">
                <div class="game-status ${statusClass}${extraStatusClass}">${game.downloadUrl ? (this.translations['free-game'] || 'Free') : statusText}</div>
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <p class="game-developer">${game.developer}</p>
                <p class="game-year">${game.year}</p>
                ${actionButton}
            </div>
        `;

        gamesGrid.appendChild(gameCard);
    }

    handleFilterClick(filter) {
        if (filter === 'all') {
            // If 'All' is clicked, deselect all other filters and select only 'all'
            this.currentFilters = ['all'];
        } else {
            // If a specific filter is clicked
            if (this.currentFilters.includes('all')) {
                // If 'all' was selected, replace it with the specific filter
                this.currentFilters = [filter];
            } else {
                // Toggle the filter
                if (this.currentFilters.includes(filter)) {
                    this.currentFilters = this.currentFilters.filter(f => f !== filter);
                    // If no filters left, select 'all'
                    if (this.currentFilters.length === 0) {
                        this.currentFilters = ['all'];
                    }
                } else {
                    this.currentFilters.push(filter);
                }
            }
        }

        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const btnFilter = btn.getAttribute('data-filter');
            btn.classList.toggle('active', this.currentFilters.includes(btnFilter));
        });

        // Re-filter games
        if (this.currentPage === 'games' && this.currentSystem) {
            this.filterGames(this.currentSystem, this.currentFilters);
            this.resetGamesList();
            this.loadMoreGames();
        }
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

    // Settings management
    loadSettings() {
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.currentSort = localStorage.getItem('sort') || 'title-asc';
    }

    saveSettings() {
        localStorage.setItem('language', this.currentLanguage);
        localStorage.setItem('theme', this.currentTheme);
        localStorage.setItem('sort', this.currentSort);
    }

    // Translation functionality
    async loadTranslations() {
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
    }

    async changeLanguage(lang) {
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
    }

    updateLanguage() {
        // Update all elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (this.translations[key]) {
                element.textContent = this.translations[key];
            }
        });

        // Update dynamic content
        this.updateDynamicTranslations();
    }

    updateDynamicTranslations() {
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

        // Update filter button text
        document.querySelectorAll('.filter-btn[data-translate]').forEach(btn => {
            const key = btn.getAttribute('data-translate');
            if (this.translations[key]) {
                btn.textContent = this.translations[key];
            }
        });
    }

    // Theme functionality
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.saveSettings();
        this.updateTheme();
    }

    updateTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('.theme-icon');
        
        if (this.currentTheme === 'light') {
            body.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            body.removeAttribute('data-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
        }
    }

    initializeSort() {
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.value = this.currentSort;
        }
    }
}

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

// Export for potential use in other modules
window.GitHubDataManager = GitHubDataManager;
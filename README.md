# Homebrew Games Archive

A lightweight, modern website to track homebrew games for classic gaming consoles including Sega Mega Drive, Super Nintendo, Master System, and NES.

## Features

- **Modern Design**: Clean, responsive interface inspired by contemporary game databases
- **System Navigation**: Hover-based dropdown menus for easy system and status filtering
- **Infinite Scroll**: Load games progressively as you scroll (9 games per load)
- **GitHub Integration**: Uses GitHub as a database for easy content management
- **Lightweight**: No external frameworks, pure HTML/CSS/JavaScript
- **Mobile Responsive**: Optimized for all screen sizes

## Structure

```
homebrew-games-website/
├── index.html          # Main HTML structure
├── styles.css          # Modern CSS with hover effects and responsive design
├── app.js             # JavaScript for navigation and infinite scroll
├── assets/
│   ├── games/         # Game cover images
│   ├── systems/       # Console system images
│   └── placeholder.svg # Fallback image for missing covers
├── data/
│   └── games.json     # Game database in JSON format
└── README.md          # This file
```

## Data Structure

Games are stored in `data/games.json` with the following structure:

```json
{
  "system-name": {
    "released": [
      {
        "id": "unique-id",
        "title": "Game Title",
        "developer": "Developer Name",
        "year": 2023,
        "cover": "assets/games/game-cover.jpg",
        "buyUrl": "https://store-link.com",
        "description": "Game description",
        "genre": "Genre",
        "tags": ["tag1", "tag2"]
      }
    ],
    "unreleased": [...]
  }
}
```

## Adding Games

1. Add game cover image to `assets/games/`
2. Update `data/games.json` with game information
3. Commit changes to GitHub

## GitHub Integration

The website includes a `GitHubDataManager` class for fetching data directly from your GitHub repository:

```javascript
const dataManager = new GitHubDataManager('your-username', 'your-repo');
const games = await dataManager.fetchGamesData();
```

## Deployment

### Static Hosting (Recommended)

Deploy to any static hosting service:

- **GitHub Pages**: Enable in repository settings
- **Netlify**: Connect your GitHub repo
- **Vercel**: Import your GitHub project
- **Traditional Web Hosting**: Upload files via FTP

### Self-Hosting

1. Set up a web server (Apache, Nginx, etc.)
2. Upload files to web directory
3. Configure server to serve static files
4. Optional: Set up SSL certificate

### Local Development

```bash
# Simple Python server
python -m http.server 8000

# Node.js server
npx http-server

# PHP built-in server
php -S localhost:8000
```

## Customization

### Adding New Systems

1. Update navigation in `index.html`
2. Add system data to `games.json`
3. Add system image to `assets/systems/`
4. Update CSS if needed for new system names

### Styling

All styles are in `styles.css` with CSS custom properties for easy theming:

```css
:root {
    --primary-bg: #0a0a0a;
    --accent-color: #ff6b35;
    /* ... more variables */
}
```

### Performance

- Images use lazy loading
- Infinite scroll prevents loading all games at once
- CSS animations use GPU acceleration
- Minimal JavaScript footprint

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with some feature degradation)
- Mobile browsers

## License

This project is open source. Feel free to use and modify for your own homebrew game collections.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For game submissions, please ensure:
- High-quality cover art (300x400px recommended)
- Accurate game information
- Working purchase/download links

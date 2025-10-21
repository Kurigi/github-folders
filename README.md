# GitHub Actions Folder Organizer

Organize your GitHub Actions workflows into custom folders for better project organization. Works seamlessly with GitHub's interface and supports both public and private repositories.

![Example Screenshot](https://via.placeholder.com/800x400?text=Screenshot+Coming+Soon)

## Features

- 📁 **Custom folder organization** - Group workflows however you want
- 🎨 **Native GitHub styling** - Matches GitHub's design perfectly
- 🔒 **Private repo support** - Uses your existing GitHub session
- ⚡ **Smart caching** - Reduces API calls and improves performance
- 🌓 **Dark mode** - Looks great in both light and dark themes
- 🎛️ **Per-repo toggle** - Enable/disable for each repository independently
- 💾 **Folder state memory** - Remembers which folders are expanded/collapsed
- 🔧 **Easy config creation** - One-click button to create config file (for write access users)

## Installation

### From Chrome Web Store (Coming Soon)

*Extension will be available on the Chrome Web Store soon.*

### Load Locally

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked** and select the `github-actions-folders` directory
5. Visit any GitHub Actions page to see it in action!

## Quick Start

### Option 1: Use the Extension Button

1. Visit your repository's Actions page
2. If you have write access, you'll see a **"Create Config File"** button
3. Click it to create a template config file with example folders
4. Edit the file to organize your workflows

### Option 2: Create Manually

Create a file at `.github/actions-folders.json` in your repository:

```json
{
  "folders": [
    {
      "name": "Build & Test",
      "workflows": ["ci.yml", "test.yml"]
    },
    {
      "name": "Deployment",
      "workflows": ["deploy-prod.yml", "deploy-staging.yml"]
    }
  ]
}
```

That's it! Visit your repository's Actions page and your workflows will be organized into folders.

**Notes:**
- Use just the workflow filename (e.g., `ci.yml`), not the full path
- Workflows not in any folder will appear in "Uncategorized"
- Click folder headers to expand/collapse them
- Use the toggle button (bottom of sidebar) to enable/disable per repository

## Example

See it in action: [GitHub Folders Actions](https://github.com/Kurigi/github-folders/actions)

## Troubleshooting

**Extension not working?**
- Make sure you're on a GitHub Actions page (`github.com/*/actions`)
- Check that `.github/actions-folders.json` exists in your repository
- Verify the JSON syntax is valid

**Config not loading?**
- File must be on your default branch (`main` or `master`)
- For private repos, make sure you're logged into GitHub
- Try clearing the cache in the extension options page

**Workflows not showing in folders?**
- Workflow filenames are case-sensitive
- Make sure filenames match exactly with your `.github/workflows/` files

## Options & Settings

Right-click the extension icon and select **Options** to:
- View all repositories with saved folder states
- Clear folder states for specific repositories
- Clear all cached config files

## Privacy & Security

- ✅ Only runs on GitHub Actions pages
- ✅ No data sent to external servers
- ✅ No OAuth tokens or API keys required
- ✅ Uses your existing GitHub session for authentication
- ✅ Config files cached locally in your browser (5-minute expiry)
- ✅ All data stored locally in Chrome storage
- ✅ Open source - inspect the code yourself

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

For development setup and architecture details, see [CLAUDE.md](./CLAUDE.md).

## License

MIT License - See [LICENSE](./LICENSE) file for details.

---

Built with ❤️ for better GitHub Actions organization

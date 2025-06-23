# Renamer

🚀 **Intelligent file naming suggestions based on project-specific naming conventions.** 

A TypeScript/Bun CLI tool that automatically detects, suggests, and renames files to follow your project's naming patterns. Interactive and smart - it asks you about each file individually!

## Features

- 🎯 **Smart Convention Detection**: Automatically detects naming patterns from existing files
- ⚙️ **Flexible Configuration**: Store naming preferences in `naming.config`
- 🔄 **Interactive Renaming**: Ask yes/no for each file individually
- 🖥️ **CLI Interface**: Command-line tool for managing naming conventions
- ✅ **Validation**: Ensures new file names follow project conventions
- 🚫 **Smart Exclusions**: Automatically skips config files, images, and markdown files
- 📊 **Project Analysis**: Analyze naming consistency across your project
- 👀 **File Watcher**: Monitor for new files and suggest names in real-time

## Supported Naming Conventions

- `camelCase`: fileName.ts
- `snake_case`: file_name.ts
- `kebab-case`: file-name.ts
- `PascalCase`: FileName.ts
- `UPPER_SNAKE_CASE`: FILE_NAME.ts

## Installation

```bash
npm install -g smart-renamer
# or
bun install -g smart-renamer
```

## Quick Start

```bash
# Initialize in your project
cd your-project
renamer init

# Rename files interactively - asks yes/no for each file
renamer rename

# Analyze your project's naming patterns
renamer analyze
```

## Commands

### `renamer init`
Initialize naming convention for your project with interactive setup:
```bash
renamer init
```

### `renamer rename` ⭐ **Main Command**
Interactive file renaming - asks yes/no for each file:
```bash
# Interactive mode - asks yes/no for each file
renamer rename

# Preview what would be renamed
renamer rename --dry-run

# Rename all files without asking
renamer rename --force

# Keep specific files unchanged
renamer rename --keep "file1.js,file2.ts"
```

### `renamer set-convention <convention>`
Set the naming convention:
```bash
renamer set-convention kebab-case
```

### `renamer validate`
Validate existing file names:
```bash
# Check all files
renamer validate

# Show suggested fixes
renamer validate --fix
```

### `renamer suggest <filename>`
Get naming suggestions for a specific file:
```bash
renamer suggest "MyFileName.ts"
```

### `renamer watch`
Monitor for new files and suggest names:
```bash
renamer watch
```

### `renamer analyze`
Analyze project structure and naming patterns:
```bash
renamer analyze
```

## Configuration

Create a `naming.config` file in your project root:

```ini
[naming]
convention=kebab-case
files=*.ts,*.js
folders=kebab-case
exceptions=index,main,app
```

### Configuration Options

- `convention`: Primary naming convention 
- `files`: File patterns to apply the convention to
- `folders`: Naming convention for directories
- `exceptions`: Files that don't need to follow the convention

## Smart Exclusions

The tool automatically skips these file types:

### 🚫 **Automatically Excluded:**
- **Config files**: Any file containing "config" (`next.config.mjs`, `webpack.config.js`)
- **Image files**: `.jpg`, `.png`, `.svg`, `.gif`, etc.
- **Markdown files**: `.md`, `.markdown`
- **System files**: `package.json`, `tsconfig.json`, `.gitignore`, etc.
- **Lock files**: `package-lock.json`, `yarn.lock`, `bun.lockb`
- **Environment files**: `.env`, `.env.example`
- **Build configs**: `webpack.config.js`, `vite.config.ts`, etc.

### 📄 **Example Output:**
```bash
$ renamer rename

🔄 Finding files to rename to 'kebab-case' convention...

📄 Skipping next.config.mjs (config files excluded by default)
📄 Skipping logo.png (image files excluded by default)
📄 Skipping README.md (markdown files excluded by default)

📝 Found 3 files that can be renamed:

? Rename "userService.ts" to "user-service.ts"? (Y/n) y
✅ userService.ts → user-service.ts

? Rename "api_helper.js" to "api-helper.js"? (Y/n) y
✅ api_helper.js → api-helper.js

? Rename "MyComponent.jsx" to "my-component.jsx"? (Y/n) n
⏭️  Skipped MyComponent.jsx

📊 Completed: 2 renamed, 1 skipped, 0 failed
```

## Usage Examples

### Typical Workflow
```bash
# 1. Initialize in your project
cd my-react-app
renamer init

# 2. Choose kebab-case for consistency
# (Interactive setup will guide you)

# 3. Rename existing files
renamer rename
# This will ask about each file: "Rename UserProfile.jsx to user-profile.jsx?"

# 4. Set up file watching for new files
renamer watch
```

### Project Analysis
```bash
$ renamer analyze

📊 Project Analysis

📁 Total files: 45
🎯 Most common convention: camelCase
📈 Consistency: 73.3%

📋 Convention breakdown:
   camelCase              25 files (55.6%)
   kebab-case             12 files (26.7%)
   snake_case              5 files (11.1%)
   PascalCase              3 files (6.7%)
   UPPER_SNAKE_CASE        0 files (0.0%)
```

## Why Use Renamer?

- **Consistency**: Maintain consistent naming across your project
- **Team Standards**: Enforce team naming conventions
- **Refactoring**: Easily migrate from one naming style to another
- **New Projects**: Set up naming standards from the start
- **Code Quality**: Improve codebase readability and maintainability

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **CLI**: Commander.js
- **File Watching**: Chokidar
- **Interactive Prompts**: Inquirer.js

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for developers who care about consistent naming conventions.**
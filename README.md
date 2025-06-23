# Renamer

A TypeScript/Bun project that provides intelligent file naming suggestions based on project-specific naming conventions. Automatically suggests names following your established naming pattern when creating new files.

## Features

- 🎯 **Smart Convention Detection**: Automatically detects naming patterns from existing files
- ⚙️ **Flexible Configuration**: Store naming preferences in `naming.config`
- 🔄 **Real-time Suggestions**: Provides naming suggestions during file creation
- 🖥️ **CLI Interface**: Command-line tool for managing naming conventions
- ✅ **Validation**: Ensures new file names follow project conventions

## Supported Naming Conventions

- `camelCase`: fileName.ts
- `snake_case`: file_name.ts
- `kebab-case`: file-name.ts
- `PascalCase`: FileName.ts
- `UPPER_SNAKE_CASE`: FILE_NAME.ts

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd renamer

# Install dependencies
bun install
```

## Configuration

Create a `naming.config` file in your project root:

```ini
[naming]
convention=camelCase
files=*.ts,*.js
folders=kebab-case
exceptions=index,main,app
```

### Configuration Options

- `convention`: Primary naming convention (camelCase, snake_case, kebab-case, PascalCase, UPPER_SNAKE_CASE)
- `files`: File patterns to apply the convention to
- `folders`: Naming convention for directories
- `exceptions`: Files that don't need to follow the convention

## Usage

### Initialize Project
```bash
renamer init
```

### Set Naming Convention
```bash
renamer set-convention camelCase
```

### Watch for New Files
```bash
renamer watch
```

### Validate Existing Files
```bash
renamer validate
```

## Development

### Prerequisites
- [Bun](https://bun.sh/) runtime
- TypeScript

### Setup
```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build the project
bun run build

# Run tests
bun test

# Lint code
bun run lint

# Type check
bun run typecheck
```

### Project Structure
```
renamer/
├── src/
│   ├── config/          # Configuration management
│   ├── core/           # Core naming logic
│   ├── cli/            # CLI commands
│   └── index.ts        # Main entry point
├── tests/              # Test files
├── naming.config       # Example configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
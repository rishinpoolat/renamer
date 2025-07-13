# Renamer

🚀 **Intelligent file and code naming suggestions based on project-specific naming conventions.** 

A TypeScript/Bun CLI tool that automatically detects, suggests, and validates naming patterns for both files and code. Analyzes variables, functions, components, constants, and more!

## ✨ Features

### File Operations
- 🎯 **Smart Convention Detection**: Automatically detects naming patterns from existing files
- 🔄 **Interactive Renaming**: Ask yes/no for each file individually
- 🚫 **Smart Exclusions**: Automatically skips config files, images, and declaration files
- 👀 **File Watcher**: Monitor for new files and suggest names in real-time

### Code Operations ⭐ **NEW**
- 💻 **Code Analysis**: Analyze variables, functions, components, constants in your codebase
- ⚛️ **React Component Detection**: Automatically identifies React components
- 🔍 **AST-Based Parsing**: Deep code analysis using Babel parser
- ✅ **Code Validation**: Validate naming conventions with detailed suggestions

### General
- ⚙️ **Flexible Configuration**: Store both file and code naming preferences
- 🖥️ **CLI Interface**: Comprehensive command-line tool
- 📊 **Project Analysis**: Analyze naming consistency across files and code
- 🎨 **Visual Feedback**: Clear violation reports with suggestions

## 🎨 Supported Naming Conventions

### File/Folder Conventions
- `camelCase`: fileName.ts
- `snake_case`: file_name.ts
- `kebab-case`: file-name.ts
- `PascalCase`: FileName.ts
- `UPPER_SNAKE_CASE`: FILE_NAME.ts

### Code Conventions
- **Variables**: `camelCase` (totalPrice, userName)
- **Functions**: `camelCase` (calculateShipping, processPayment)
- **Components**: `PascalCase` (UserCard, ProductList)
- **Constants**: `UPPER_SNAKE_CASE` (MAX_RETRY_COUNT, API_URL)
- **Classes**: `PascalCase` (PaymentProcessor, UserManager)
- **Interfaces**: `PascalCase` (UserProfile, ApiResponse)
- **Types**: `PascalCase` (PaymentStatus, OrderType)
- **Enums**: `PascalCase` (OrderStatus, UserRole)

## 📦 Installation

```bash
npm install -g smart-renamer
# or
bun install -g smart-renamer
```

## 🚀 Quick Start

```bash
# Initialize in your project (now includes code conventions!)
cd your-project
renamer init

# Analyze everything - files AND code patterns
renamer analyze

# Rename files interactively
renamer rename

# Validate code naming conventions
renamer validate-code --fix
```

## 📋 Commands

### 🎯 Core Commands

#### `renamer analyze` ⭐ **Enhanced**
Analyze both file and code naming patterns:
```bash
# Analyze everything (files + code)
renamer analyze

# Analyze only code naming patterns  
renamer analyze --code-only

# Analyze only file naming patterns
renamer analyze --files-only

# Analyze specific file patterns
renamer analyze --patterns="src/**/*.ts,tests/*.ts"
```

**Example Output:**
```bash
📊 Project Analysis

📁 File Naming Analysis
════════════════════════════════════════
📁 Total files: 45
🎯 Most common convention: kebab-case
📈 File consistency: 87.3%

💻 Code Naming Analysis  
════════════════════════════════════════
💻 Total identifiers: 342
📈 Code consistency: 94.2%
🎯 Violations found: 8

📋 Code convention breakdown:
   Variables (245 total):
   ✅ camelCase            231 (94.3%)
      snake_case            14 (5.7%)
   
   Functions (58 total):
   ✅ camelCase             58 (100.0%)
   
   Components (23 total):
   ✅ PascalCase            23 (100.0%)

🎯 Recommendations
════════════════════════════════════════
💻 Code naming could be improved:
   • Run `renamer validate-code --fix` to see code suggestions
```

#### `renamer init`
Initialize with both file and code conventions:
```bash
renamer init
# Now asks about code conventions too!
# - Variables: camelCase, snake_case, etc.
# - Functions: camelCase, snake_case, etc.  
# - Components: PascalCase (recommended)
# - Constants: UPPER_SNAKE_CASE, etc.
```

### 📁 File Operations

#### `renamer rename` 
Interactive file renaming:
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

#### `renamer validate`
Validate file names:
```bash
# Check all files
renamer validate

# Show suggested fixes
renamer validate --fix
```

### 💻 Code Operations ⭐ **NEW**

#### `renamer validate-code`
Validate code naming conventions:
```bash
# Check code conventions
renamer validate-code

# Show detailed suggestions for violations
renamer validate-code --fix

# Check specific file patterns
renamer validate-code --patterns="src/**/*.ts"
```

**Example Output:**
```bash
🔍 Validating code conventions...

❌ Found 3 naming violations:

📁 src/components/user-card.tsx:
   Line 15: variable "user_name" should be "userName"
   💡 Alternatives: PascalCase: UserName, kebab-case: user-name

📁 src/utils/payment.ts:
   Line 8: function "process_payment" should be "processPayment"
   💡 Alternatives: PascalCase: ProcessPayment

📊 Total: 3 violations in 2 files
```

#### `renamer analyze-code`
Detailed code analysis:
```bash
renamer analyze-code
```

### 🔧 Other Commands

#### `renamer set-convention <convention>`
```bash
renamer set-convention kebab-case
```

#### `renamer suggest <filename>`
```bash
renamer suggest "MyFileName.ts"
```

#### `renamer watch`
```bash
renamer watch
```

## ⚙️ Configuration

Create a `naming.config` file in your project root:

```ini
[naming]
convention=kebab-case
files=*.ts,*.js
folders=kebab-case
exceptions=index,main,app

[code]
variables=camelCase
functions=camelCase
components=PascalCase
constants=UPPER_SNAKE_CASE
classes=PascalCase
interfaces=PascalCase
types=PascalCase
enums=PascalCase
```

### Configuration Options

#### File Settings
- `convention`: Primary file naming convention 
- `files`: File patterns to apply the convention to
- `folders`: Naming convention for directories
- `exceptions`: Files that don't need to follow the convention

#### Code Settings ⭐ **NEW**
- `variables`: Variable naming convention
- `functions`: Function naming convention  
- `components`: React component naming convention
- `constants`: Constant naming convention
- `classes`: Class naming convention
- `interfaces`: Interface naming convention
- `types`: Type alias naming convention
- `enums`: Enum naming convention

## 🚫 Smart Exclusions

The tool automatically skips these file types:

### **Automatically Excluded:**
- **Config files**: Any file containing "config" (`next.config.mjs`, `webpack.config.js`)
- **Image files**: `.jpg`, `.png`, `.svg`, `.gif`, etc.
- **Markdown files**: `.md`, `.markdown`
- **Declaration files (all languages)**:
  - TypeScript: `.d.ts`, `.d.mts`, `.d.cts` (like `next-env.d.ts`, `types.d.ts`)
  - C/C++: `.h`, `.hpp`, `.hxx` (header files)
  - Python: `.pyi` (stub files)
  - And more: `.hi`, `.rbi`, `.rei`, `.mli`, `.sig`, `.fsi`, `.spec`, `.def`
- **System files**: `package.json`, `tsconfig.json`, `.gitignore`, etc.
- **Lock files**: `package-lock.json`, `yarn.lock`, `bun.lockb`

## 📖 Usage Examples

### Typical Workflow
```bash
# 1. Initialize in your project (includes code conventions)
cd my-react-app
renamer init

# 2. Set up both file and code conventions
# Choose kebab-case for files, camelCase for variables, PascalCase for components

# 3. Analyze everything 
renamer analyze
# Shows both file and code naming patterns

# 4. Fix file naming
renamer rename

# 5. Fix code naming  
renamer validate-code --fix
# Shows exactly which variables/functions need renaming

# 6. Set up file watching for new files
renamer watch
```

### Code Analysis Example
```bash
$ renamer validate-code --fix

🔍 Validating code conventions...

📝 Variables: camelCase
🔧 Functions: camelCase  
⚛️  Components: PascalCase
📊 Constants: UPPER_SNAKE_CASE

❌ Found 5 naming violations:

📁 src/components/user-profile.tsx:
   Line 12: variable "user_data" should be "userData"
   Line 25: function "render_avatar" should be "renderAvatar"  
   💡 Alternatives: PascalCase: RenderAvatar

📁 src/utils/api-client.ts:
   Line 8: constant "api_url" should be "API_URL"
   Line 15: function "make_request" should be "makeRequest"

📋 Violation Summary:
   variable: 2 violations
   function: 2 violations  
   constant: 1 violations

📊 Total: 5 violations in 2 files

💡 Use --fix to see suggested alternatives
```

## 🎯 Why Use Renamer?

- **Consistency**: Maintain consistent naming across files AND code
- **Team Standards**: Enforce team naming conventions for everything
- **Code Quality**: Improve codebase readability and maintainability
- **React Support**: Smart detection of React components
- **Refactoring**: Easily migrate from one naming style to another
- **CI/CD Integration**: Use in pipelines to ensure naming standards

## 🛠️ Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **AST Parser**: Babel Parser (for code analysis)
- **CLI**: Commander.js
- **File Watching**: Chokidar
- **Interactive Prompts**: Inquirer.js

## 📋 Package Update Instructions

To update your published package with the new code-level functionality:

### 1. Update Version
```bash
# Already done - version is now 1.1.0
npm version patch  # or minor/major
```

### 2. Build and Test
```bash
bun run build
bun test
bun run check  # Test the new analyze command
```

### 3. Publish to NPM
```bash
# Login if needed
npm login

# Publish the updated package
npm publish
```

### 4. Verify Installation
```bash
# Test global installation
npm install -g smart-renamer@latest

# Test the new features
renamer --version  # Should show 1.1.0
renamer analyze --help  # Should show new options
```

### 5. Update Documentation
The README is now updated with:
- ✅ Code-level analysis features
- ✅ Enhanced `renamer analyze` command  
- ✅ New configuration options
- ✅ Code validation examples
- ✅ Complete usage workflows

Your package now offers **comprehensive naming convention management** for both files and code! 🚀

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for developers who care about consistent naming conventions in files AND code.**
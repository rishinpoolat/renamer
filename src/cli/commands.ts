import { Command } from 'commander';
import { ConfigManager } from '../config/config-manager';
import { NamingValidator } from '../core/naming-validator';
import { SuggestionEngine } from '../core/suggestion-engine';
import { FileWatcher } from '../core/file-watcher';
import { NamingConvention } from '../types';
import inquirer from 'inquirer';
import { renameSync } from 'fs';
import { dirname, join } from 'path';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('renamer')
    .description('Intelligent file naming suggestions based on project conventions')
    .version('1.0.0');

  program
    .command('init')
    .description('Initialize naming convention for the current project')
    .action(initCommand);

  program
    .command('set-convention <convention>')
    .description('Set the naming convention for the project')
    .action(setConventionCommand);

  program
    .command('watch')
    .description('Monitor for new files and suggest names')
    .option('-p, --patterns <patterns>', 'File patterns to watch (comma-separated)', '**/*')
    .action(watchCommand);

  program
    .command('validate')
    .description('Validate existing file names against the project convention')
    .option('-f, --fix', 'Show suggested fixes for invalid names')
    .action(validateCommand);

  program
    .command('suggest <filename>')
    .description('Get naming suggestions for a specific file')
    .action(suggestCommand);

  program
    .command('analyze')
    .description('Analyze project structure and naming patterns')
    .action(analyzeCommand);

  program
    .command('rename')
    .description('Rename files to follow the project naming convention')
    .option('-d, --dry-run', 'Show what would be renamed without actually renaming')
    .option('-f, --force', 'Rename all files without individual prompts')
    .option('-i, --interactive', 'Ask yes/no for each file individually (default)')
    .option('--keep <files>', 'Comma-separated list of files to keep unchanged')
    .action(renameCommand);

  return program;
}

async function initCommand(): Promise<void> {
  console.log('🚀 Initializing Renamer for your project...\n');

  const configManager = new ConfigManager();
  
  if (configManager.configExists()) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'naming.config already exists. Do you want to overwrite it?',
      default: false
    }]);

    if (!overwrite) {
      console.log('✅ Keeping existing configuration.');
      return;
    }
  }

  const suggestionEngine = new SuggestionEngine();
  const detectedConvention = suggestionEngine.detectProjectConvention();

  const questions = [
    {
      type: 'list',
      name: 'convention',
      message: 'Choose your preferred naming convention:',
      choices: [
        'camelCase',
        'snake_case',
        'kebab-case', 
        'PascalCase',
        'UPPER_SNAKE_CASE'
      ],
      default: detectedConvention || 'camelCase'
    },
    {
      type: 'input',
      name: 'files',
      message: 'File patterns to apply convention to:',
      default: '*.ts,*.js'
    },
    {
      type: 'list',
      name: 'folders',
      message: 'Folder naming convention:',
      choices: [
        'camelCase',
        'snake_case', 
        'kebab-case',
        'PascalCase',
        'UPPER_SNAKE_CASE'
      ],
      default: 'kebab-case'
    },
    {
      type: 'input',
      name: 'exceptions',
      message: 'Files to exclude from convention (comma-separated):',
      default: 'index,main,app'
    }
  ];

  const answers = await inquirer.prompt(questions);

  const config = {
    convention: answers.convention as NamingConvention,
    files: answers.files.split(',').map((s: string) => s.trim()),
    folders: answers.folders as NamingConvention,
    exceptions: answers.exceptions.split(',').map((s: string) => s.trim()).filter(Boolean)
  };

  configManager.saveConfig(config);
  
  console.log('\n✅ Configuration saved to naming.config');
  console.log(`📝 Primary convention: ${config.convention}`);
  console.log(`📁 Folder convention: ${config.folders}`);
  
  if (detectedConvention && detectedConvention !== config.convention) {
    console.log(`\n💡 Note: Detected '${detectedConvention}' in existing files, but you chose '${config.convention}'`);
  }
}

async function setConventionCommand(convention: string): Promise<void> {
  const validConventions: string[] = ['camelCase', 'snake_case', 'kebab-case', 'PascalCase', 'UPPER_SNAKE_CASE'];
  
  if (!validConventions.includes(convention)) {
    console.error(`❌ Invalid convention '${convention}'. Valid options: ${validConventions.join(', ')}`);
    process.exit(1);
  }

  const configManager = new ConfigManager();
  const config = configManager.loadConfig();
  config.convention = convention as NamingConvention;
  
  configManager.saveConfig(config);
  console.log(`✅ Convention set to '${convention}'`);
}

async function watchCommand(options: { patterns: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();
  const suggestionEngine = new SuggestionEngine();
  
  const patterns = options.patterns.split(',').map(p => p.trim());
  const watcher = new FileWatcher(process.cwd(), patterns);

  console.log(`👀 Watching for new files with convention: ${config.convention}`);
  console.log(`📂 Patterns: ${patterns.join(', ')}\n`);

  watcher.on('fileAdded', (fileInfo) => {
    const suggestion = suggestionEngine.suggestName(
      fileInfo.name, 
      config.convention, 
      config.exceptions
    );

    if (suggestion.original !== suggestion.suggested) {
      console.log(`\n📝 New file detected: ${fileInfo.name}`);
      console.log(`💡 Suggested name: ${suggestion.suggested}`);
      console.log(`🎯 Convention: ${suggestion.convention}`);
      console.log(`📊 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
    }
  });

  watcher.on('error', (error) => {
    console.error('❌ File watcher error:', error);
  });

  watcher.start();

  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping file watcher...');
    watcher.stop();
    process.exit(0);
  });
}

async function validateCommand(options: { fix: boolean }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();
  const suggestionEngine = new SuggestionEngine();
  
  console.log(`🔍 Validating files against '${config.convention}' convention...\n`);

  const files = suggestionEngine['getAllProjectFiles']();
  const invalidFiles: Array<{ name: string; suggested: string; path: string }> = [];

  for (const file of files) {
    if (file.isDirectory) continue;

    const validation = NamingValidator.validateName(
      file.name, 
      config.convention, 
      config.exceptions
    );

    if (!validation.isValid && validation.expectedName) {
      invalidFiles.push({
        name: file.name,
        suggested: validation.expectedName,
        path: file.path
      });
      
      console.log(`❌ ${file.name}`);
      console.log(`   💡 Should be: ${validation.expectedName}`);
      console.log(`   📍 Path: ${file.path}\n`);
    }
  }

  if (invalidFiles.length === 0) {
    console.log('✅ All files follow the naming convention!');
  } else {
    console.log(`\n📊 Found ${invalidFiles.length} files that don't follow the convention.`);
    
    if (options.fix) {
      console.log('\n🔧 Suggested fixes:');
      for (const file of invalidFiles) {
        console.log(`mv "${file.name}" "${file.suggested}"`);
      }
    }
  }
}

async function suggestCommand(filename: string): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();
  const suggestionEngine = new SuggestionEngine();

  console.log(`💭 Generating suggestions for: ${filename}\n`);

  const suggestions = suggestionEngine.suggestMultipleNames(
    filename, 
    config.convention, 
    config.exceptions
  );

  for (const suggestion of suggestions) {
    const icon = suggestion.convention === config.convention ? '⭐' : '  ';
    console.log(`${icon} ${suggestion.convention.padEnd(20)} ${suggestion.suggested.padEnd(30)} (${(suggestion.confidence * 100).toFixed(1)}%)`);
  }
}

async function analyzeCommand(): Promise<void> {
  const suggestionEngine = new SuggestionEngine();
  const analysis = suggestionEngine.analyzeProjectStructure();

  console.log('📊 Project Analysis\n');
  console.log(`📁 Total files: ${analysis.totalFiles}`);
  console.log(`🎯 Most common convention: ${analysis.mostCommon || 'None detected'}`);
  console.log(`📈 Consistency: ${(analysis.consistency * 100).toFixed(1)}%\n`);

  console.log('📋 Convention breakdown:');
  for (const [convention, count] of Object.entries(analysis.conventions)) {
    const percentage = analysis.totalFiles > 0 ? (count / analysis.totalFiles * 100).toFixed(1) : '0.0';
    console.log(`   ${convention.padEnd(20)} ${count.toString().padStart(3)} files (${percentage}%)`);
  }
}

async function renameCommand(options: { dryRun?: boolean; force?: boolean; interactive?: boolean; keep?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.loadConfig();
  const suggestionEngine = new SuggestionEngine();
  
  // Parse keep list
  const keepFiles = options.keep ? options.keep.split(',').map(f => f.trim()) : [];
  
  // Default exclusions - system files, config files, and common files
  const defaultExclusions = [
    'package.json', 'tsconfig.json', 'bun.lockb', 'naming.config', 
    'package-lock.json', 'yarn.lock', '.gitignore', 'LICENSE',
    // Config files
    '.eslintrc.js', '.eslintrc.json', '.prettierrc', '.prettierrc.json',
    'babel.config.js', 'webpack.config.js', 'vite.config.js', 'rollup.config.js',
    'jest.config.js', 'vitest.config.js', '.env.example', 'Dockerfile',
    'docker-compose.yml', 'docker-compose.yaml'
  ];

  // File extensions to exclude by default
  const excludedExtensions = [
    // Image files
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff',
    // Markdown files
    '.md', '.markdown',
    // Declaration files (all languages)
    '.d.ts', '.d.mts', '.d.cts',  // TypeScript declarations
    '.h', '.hpp', '.hxx',         // C/C++ headers
    '.hi',                        // Haskell interface files
    '.pyi',                       // Python stub files
    '.rbi',                       // Ruby interface files
    '.rei',                       // ReasonML interface files
    '.mli',                       // OCaml interface files
    '.sig',                       // Standard ML signature files
    '.fsi',                       // F# signature files
    '.spec',                      // RPM spec files
    '.def',                       // Definition files (various languages)
    // Config file extensions
    '.config.js', '.config.ts', '.config.json', '.yml', '.yaml', '.toml', '.ini'
  ];
  
  console.log(`🔄 Finding files to rename to '${config.convention}' convention...\n`);

  const files = suggestionEngine['getAllProjectFiles']();
  const filesToRename: Array<{ oldPath: string; newPath: string; oldName: string; newName: string }> = [];

  for (const file of files) {
    if (file.isDirectory) continue;

    // Skip files that should be ignored
    if (file.name.startsWith('.') && file.name !== '.gitignore') continue;
    if (defaultExclusions.includes(file.name)) continue;
    if (keepFiles.includes(file.name)) continue;
    
    // Check if file extension should be excluded
    const fileExtension = file.extension.toLowerCase();
    const hasExcludedExtension = excludedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    );
    
    if (hasExcludedExtension) {
      const fileType = fileExtension.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|tiff)$/i) ? 'image' :
                       fileExtension.match(/\.(md|markdown)$/i) ? 'markdown' :
                       file.name.match(/\.d\.(ts|mts|cts)$/i) ? 'TypeScript declaration' :
                       fileExtension.match(/\.(h|hpp|hxx)$/i) ? 'C/C++ header' :
                       fileExtension.match(/\.(hi|pyi|rbi|rei|mli|sig|fsi|spec|def)$/i) ? 'declaration' : 'config';
      console.log(`📄 Skipping ${file.name} (${fileType} files excluded by default)`);
      continue;
    }
    
    // Skip files containing 'config' in the filename
    if (file.name.toLowerCase().includes('config')) {
      console.log(`📄 Skipping ${file.name} (config files excluded by default)`);
      continue;
    }

    const validation = NamingValidator.validateName(
      file.name, 
      config.convention, 
      config.exceptions
    );

    if (!validation.isValid && validation.expectedName) {
      const newPath = join(dirname(file.path), validation.expectedName);
      filesToRename.push({
        oldPath: file.path,
        newPath,
        oldName: file.name,
        newName: validation.expectedName
      });
    }
  }

  if (filesToRename.length === 0) {
    console.log('✅ All files already follow the naming convention!');
    return;
  }

  if (options.dryRun) {
    console.log(`📝 Would rename ${filesToRename.length} files:\n`);
    for (const file of filesToRename) {
      console.log(`  ${file.oldName} → ${file.newName}`);
    }
    console.log('\n🔍 Dry run complete. No files were actually renamed.');
    return;
  }

  // Interactive mode (default) - ask for each file individually
  if (!options.force) {
    console.log(`📝 Found ${filesToRename.length} files that can be renamed:\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const file of filesToRename) {
      const { shouldRename } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldRename',
        message: `Rename "${file.oldName}" to "${file.newName}"?`,
        default: true
      }]);

      if (shouldRename) {
        try {
          renameSync(file.oldPath, file.newPath);
          console.log(`✅ ${file.oldName} → ${file.newName}`);
          successCount++;
        } catch (error) {
          console.log(`❌ Failed to rename ${file.oldName}: ${error}`);
          errorCount++;
        }
      } else {
        console.log(`⏭️  Skipped ${file.oldName}`);
        skippedCount++;
      }
      console.log(''); // Empty line for readability
    }

    console.log(`📊 Completed: ${successCount} renamed, ${skippedCount} skipped, ${errorCount} failed`);
    return;
  }

  // Force mode - rename all without asking
  console.log(`🔄 Renaming ${filesToRename.length} files...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToRename) {
    try {
      renameSync(file.oldPath, file.newPath);
      console.log(`✅ ${file.oldName} → ${file.newName}`);
      successCount++;
    } catch (error) {
      console.log(`❌ Failed to rename ${file.oldName}: ${error}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Completed: ${successCount} renamed, ${errorCount} failed`);
}
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { NamingValidator } from './naming-validator';
import { NamingConvention, SuggestionResult, FileInfo } from '../types';

export class SuggestionEngine {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  suggestName(filename: string, convention: NamingConvention, exceptions: string[] = []): SuggestionResult {
    const baseName = this.getBaseName(filename);
    const extension = extname(filename);

    if (exceptions.includes(baseName.toLowerCase())) {
      return {
        original: filename,
        suggested: filename,
        convention,
        confidence: 1.0
      };
    }

    const suggestedBaseName = NamingValidator.convertToConvention(baseName, convention);
    const suggestedFilename = suggestedBaseName + extension;

    const confidence = this.calculateConfidence(filename, suggestedFilename, convention);

    return {
      original: filename,
      suggested: suggestedFilename,
      convention,
      confidence
    };
  }

  suggestMultipleNames(filename: string, primaryConvention: NamingConvention, exceptions: string[] = []): SuggestionResult[] {
    const conventions: NamingConvention[] = ['camelCase', 'snake_case', 'kebab-case', 'PascalCase', 'UPPER_SNAKE_CASE'];
    
    return conventions.map(convention => {
      const suggestion = this.suggestName(filename, convention, exceptions);
      
      if (convention === primaryConvention) {
        suggestion.confidence = Math.min(suggestion.confidence + 0.2, 1.0);
      }
      
      return suggestion;
    }).sort((a, b) => b.confidence - a.confidence);
  }

  detectProjectConvention(): NamingConvention | null {
    const files = this.getAllProjectFiles();
    const filenames = files
      .filter(file => !file.isDirectory)
      .map(file => file.name);
    
    return NamingValidator.detectConvention(filenames);
  }

  analyzeProjectStructure(): {
    totalFiles: number;
    conventions: Record<NamingConvention, number>;
    mostCommon: NamingConvention | null;
    consistency: number;
  } {
    const files = this.getAllProjectFiles();
    const filenames = files
      .filter(file => !file.isDirectory)
      .map(file => file.name);

    const conventions: Record<NamingConvention, number> = {
      'camelCase': 0,
      'snake_case': 0,
      'kebab-case': 0,
      'PascalCase': 0,
      'UPPER_SNAKE_CASE': 0
    };

    for (const filename of filenames) {
      const baseName = this.getBaseName(filename);
      for (const [convention, pattern] of Object.entries(NamingValidator['CONVENTION_PATTERNS'])) {
        if (pattern.test(baseName)) {
          conventions[convention as NamingConvention]++;
        }
      }
    }

    const totalFiles = filenames.length;
    const maxCount = Math.max(...Object.values(conventions));
    const mostCommon = maxCount > 0 
      ? Object.entries(conventions).find(([, count]) => count === maxCount)?.[0] as NamingConvention || null
      : null;

    const consistency = totalFiles > 0 ? (maxCount / totalFiles) : 0;

    return {
      totalFiles,
      conventions,
      mostCommon,
      consistency
    };
  }

  private getAllProjectFiles(dir: string = this.projectRoot, maxDepth: number = 3, currentDepth: number = 0): FileInfo[] {
    if (currentDepth >= maxDepth) return [];

    const files: FileInfo[] = [];
    
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        if (this.shouldIgnore(entry)) continue;
        
        const fullPath = join(dir, entry);
        const stats = statSync(fullPath);
        
        const fileInfo: FileInfo = {
          name: entry,
          path: fullPath,
          extension: extname(entry),
          isDirectory: stats.isDirectory()
        };

        files.push(fileInfo);

        if (stats.isDirectory()) {
          files.push(...this.getAllProjectFiles(fullPath, maxDepth, currentDepth + 1));
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}:`, error);
    }

    return files;
  }

  private shouldIgnore(filename: string): boolean {
    const ignorePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.DS_Store',
      'Thumbs.db',
      'CLAUDE.md'
    ];

    return ignorePatterns.some(pattern => 
      filename === pattern || filename.startsWith('.') && filename !== '.gitignore'
    );
  }

  private getBaseName(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  }

  private calculateConfidence(original: string, suggested: string, convention: NamingConvention): number {
    if (original === suggested) return 1.0;

    const originalBase = this.getBaseName(original);
    const suggestedBase = this.getBaseName(suggested);

    let confidence = 0.5;

    const words1 = this.extractWords(originalBase);
    const words2 = this.extractWords(suggestedBase);
    
    if (words1.join('').toLowerCase() === words2.join('').toLowerCase()) {
      confidence += 0.3;
    }

    const pattern = NamingValidator['CONVENTION_PATTERNS'][convention];
    if (pattern && pattern.test(suggestedBase)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private extractWords(name: string): string[] {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
}
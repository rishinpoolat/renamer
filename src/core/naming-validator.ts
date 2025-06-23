import { NamingConvention, ValidationResult } from '../types';

export class NamingValidator {
  private static readonly CONVENTION_PATTERNS: Record<NamingConvention, RegExp> = {
    'camelCase': /^[a-z][a-zA-Z0-9]*$/,
    'snake_case': /^[a-z][a-z0-9_]*$/,
    'kebab-case': /^[a-z][a-z0-9-]*$/,
    'PascalCase': /^[A-Z][a-zA-Z0-9]*$/,
    'UPPER_SNAKE_CASE': /^[A-Z][A-Z0-9_]*$/
  };

  static validateName(name: string, convention: NamingConvention, exceptions: string[] = []): ValidationResult {
    const baseName = this.getBaseName(name);
    
    if (exceptions.includes(baseName.toLowerCase())) {
      return {
        isValid: true,
        convention,
        message: `File '${name}' is in the exceptions list`
      };
    }

    const pattern = this.CONVENTION_PATTERNS[convention];
    const isValid = pattern.test(baseName);

    if (isValid) {
      return {
        isValid: true,
        convention,
        message: `File '${name}' follows ${convention} convention`
      };
    }

    const expectedName = this.convertToConvention(baseName, convention);
    return {
      isValid: false,
      expectedName: expectedName + this.getExtension(name),
      convention,
      message: `File '${name}' should be '${expectedName + this.getExtension(name)}' to follow ${convention} convention`
    };
  }

  static convertToConvention(name: string, convention: NamingConvention): string {
    const baseName = this.getBaseName(name);
    const words = this.extractWords(baseName);

    switch (convention) {
      case 'camelCase':
        return words[0]?.toLowerCase() + words.slice(1).map(this.capitalize).join('');
      case 'snake_case':
        return words.map(w => w.toLowerCase()).join('_');
      case 'kebab-case':
        return words.map(w => w.toLowerCase()).join('-');
      case 'PascalCase':
        return words.map(this.capitalize).join('');
      case 'UPPER_SNAKE_CASE':
        return words.map(w => w.toUpperCase()).join('_');
      default:
        return baseName;
    }
  }

  static detectConvention(names: string[]): NamingConvention | null {
    const scores: Record<NamingConvention, number> = {
      'camelCase': 0,
      'snake_case': 0,
      'kebab-case': 0,
      'PascalCase': 0,
      'UPPER_SNAKE_CASE': 0
    };

    for (const name of names) {
      const baseName = this.getBaseName(name);
      
      for (const [convention, pattern] of Object.entries(this.CONVENTION_PATTERNS)) {
        if (pattern.test(baseName)) {
          scores[convention as NamingConvention]++;
        }
      }
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return null;

    const detectedConvention = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
    return detectedConvention as NamingConvention || null;
  }

  private static getBaseName(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  }

  private static getExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  }

  private static extractWords(name: string): string[] {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private static capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
}
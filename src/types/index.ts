export type NamingConvention = 
  | 'camelCase'
  | 'snake_case'
  | 'kebab-case'
  | 'PascalCase'
  | 'UPPER_SNAKE_CASE';

export interface NamingConfig {
  convention: NamingConvention;
  files: string[];
  folders?: NamingConvention;
  exceptions?: string[];
}

export interface FileInfo {
  name: string;
  path: string;
  extension: string;
  isDirectory: boolean;
}

export interface SuggestionResult {
  original: string;
  suggested: string;
  convention: NamingConvention;
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  expectedName?: string;
  convention: NamingConvention;
  message: string;
}
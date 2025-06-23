import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NamingConfig, NamingConvention } from '../types';

export class ConfigManager {
  private configPath: string;
  private defaultConfig: NamingConfig = {
    convention: 'camelCase',
    files: ['*.ts', '*.js'],
    folders: 'kebab-case',
    exceptions: ['index', 'main', 'app']
  };

  constructor(projectRoot: string = process.cwd()) {
    this.configPath = join(projectRoot, 'naming.config');
  }

  loadConfig(): NamingConfig {
    if (!existsSync(this.configPath)) {
      return this.defaultConfig;
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      return this.parseConfig(content);
    } catch (error) {
      console.warn('Failed to load naming.config, using defaults:', error);
      return this.defaultConfig;
    }
  }

  saveConfig(config: NamingConfig): void {
    try {
      const content = this.stringifyConfig(config);
      writeFileSync(this.configPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save naming.config: ${error}`);
    }
  }

  private parseConfig(content: string): NamingConfig {
    const config: Partial<NamingConfig> = {};
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        continue;
      }

      if (trimmed.includes('=') && currentSection === 'naming') {
        const [key, value] = trimmed.split('=').map(s => s.trim());
        
        switch (key) {
          case 'convention':
            if (value && this.isValidConvention(value)) {
              config.convention = value as NamingConvention;
            }
            break;
          case 'files':
            if (value) {
              config.files = value.split(',').map(s => s.trim());
            }
            break;
          case 'folders':
            if (value && this.isValidConvention(value)) {
              config.folders = value as NamingConvention;
            }
            break;
          case 'exceptions':
            if (value) {
              config.exceptions = value.split(',').map(s => s.trim());
            }
            break;
        }
      }
    }

    return { ...this.defaultConfig, ...config };
  }

  private stringifyConfig(config: NamingConfig): string {
    return `[naming]
convention=${config.convention}
files=${config.files.join(',')}
folders=${config.folders || 'kebab-case'}
exceptions=${config.exceptions?.join(',') || ''}
`;
  }

  private isValidConvention(value: string): boolean {
    const validConventions: NamingConvention[] = [
      'camelCase', 'snake_case', 'kebab-case', 'PascalCase', 'UPPER_SNAKE_CASE'
    ];
    return validConventions.includes(value as NamingConvention);
  }

  configExists(): boolean {
    return existsSync(this.configPath);
  }

  createDefaultConfig(): void {
    this.saveConfig(this.defaultConfig);
  }
}
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NamingConfig, NamingConvention, CodeConventions } from '../types';

export class ConfigManager {
  private configPath: string;
  private defaultConfig: NamingConfig = {
    convention: 'camelCase',
    files: ['*.ts', '*.js'],
    folders: 'kebab-case',
    exceptions: ['index', 'main', 'app'],
    code: {
      variables: 'camelCase',
      functions: 'camelCase',
      components: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
      classes: 'PascalCase',
      interfaces: 'PascalCase',
      types: 'PascalCase',
      enums: 'PascalCase'
    }
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
    const codeConfig: Partial<CodeConventions> = {};
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        continue;
      }

      if (!trimmed.includes('=')) continue;

      const [key, value] = trimmed.split('=').map(s => s.trim());

      if (currentSection === 'naming') {
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
      } else if (currentSection === 'code') {
        const validCodeKeys: (keyof CodeConventions)[] = [
          'variables', 'functions', 'components', 'constants',
          'classes', 'interfaces', 'types', 'enums'
        ];
        
        if (validCodeKeys.includes(key as keyof CodeConventions) && 
            value && this.isValidConvention(value)) {
          codeConfig[key as keyof CodeConventions] = value as NamingConvention;
        }
      }
    }

    if (Object.keys(codeConfig).length > 0) {
      config.code = { ...this.defaultConfig.code!, ...codeConfig };
    }

    return { ...this.defaultConfig, ...config };
  }

  private stringifyConfig(config: NamingConfig): string {
    let content = `[naming]
convention=${config.convention}
files=${config.files.join(',')}
folders=${config.folders || 'kebab-case'}
exceptions=${config.exceptions?.join(',') || ''}
`;

    if (config.code) {
      content += `
[code]
variables=${config.code.variables}
functions=${config.code.functions}
components=${config.code.components}
constants=${config.code.constants}
classes=${config.code.classes}
interfaces=${config.code.interfaces}
types=${config.code.types}
enums=${config.code.enums}
`;
    }

    return content;
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
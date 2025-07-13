import { CodeIdentifier } from './ast-analyzer';
import { NamingConvention } from '../types';

export interface CodeConventionConfig {
  variables: NamingConvention;
  functions: NamingConvention;
  components: NamingConvention;
  constants: NamingConvention;
  classes: NamingConvention;
  interfaces: NamingConvention;
  types: NamingConvention;
  enums: NamingConvention;
}

export interface CodeValidationResult {
  identifier: CodeIdentifier;
  isValid: boolean;
  expectedConvention: NamingConvention;
  suggestedName?: string;
  violation: string;
}

export interface CodeValidationSummary {
  totalChecked: number;
  totalViolations: number;
  violationsByType: { [key: string]: number };
  violations: CodeValidationResult[];
}

export class CodeValidator {
  private convertToCamelCase(name: string): string {
    return name
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  private convertToPascalCase(name: string): string {
    return name
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[a-z]/, char => char.toUpperCase());
  }

  private convertToSnakeCase(name: string): string {
    return name
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]+/g, '_')
      .replace(/^_/, '')
      .toLowerCase();
  }

  private convertToKebabCase(name: string): string {
    return name
      .replace(/([A-Z])/g, '-$1')
      .replace(/[_\s]+/g, '-')
      .replace(/^-/, '')
      .toLowerCase();
  }

  private convertToConstantCase(name: string): string {
    return name
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]+/g, '_')
      .replace(/^_/, '')
      .toUpperCase();
  }

  private convertToConvention(name: string, convention: NamingConvention): string {
    switch (convention) {
      case 'camelCase':
        return this.convertToCamelCase(name);
      case 'PascalCase':
        return this.convertToPascalCase(name);
      case 'snake_case':
        return this.convertToSnakeCase(name);
      case 'kebab-case':
        return this.convertToKebabCase(name);
      case 'UPPER_SNAKE_CASE':
        return this.convertToConstantCase(name);
      default:
        return name;
    }
  }

  private validateConvention(name: string, convention: NamingConvention): boolean {
    switch (convention) {
      case 'camelCase':
        return /^[a-z][a-zA-Z0-9]*$/.test(name);
      case 'PascalCase':
        return /^[A-Z][a-zA-Z0-9]*$/.test(name);
      case 'snake_case':
        return /^[a-z][a-z0-9_]*$/.test(name);
      case 'kebab-case':
        return /^[a-z][a-z0-9-]*$/.test(name);
      case 'UPPER_SNAKE_CASE':
        return /^[A-Z][A-Z0-9_]*$/.test(name);
      default:
        return true;
    }
  }

  private getExpectedConvention(identifier: CodeIdentifier, config: CodeConventionConfig): NamingConvention {
    // React components should always be PascalCase regardless of function convention
    if (identifier.isReactComponent) {
      return 'PascalCase';
    }

    switch (identifier.type) {
      case 'variable':
        return config.variables;
      case 'function':
        return config.functions;
      case 'class':
        return config.classes;
      case 'constant':
        return config.constants;
      case 'interface':
        return config.interfaces;
      case 'type':
        return config.types;
      case 'enum':
        return config.enums;
      default:
        return config.variables;
    }
  }

  validateIdentifier(identifier: CodeIdentifier, config: CodeConventionConfig): CodeValidationResult {
    const expectedConvention = this.getExpectedConvention(identifier, config);
    const isValid = this.validateConvention(identifier.name, expectedConvention);
    
    let violation = '';
    let suggestedName: string | undefined;

    if (!isValid) {
      suggestedName = this.convertToConvention(identifier.name, expectedConvention);
      
      if (identifier.isReactComponent) {
        violation = `React component "${identifier.name}" should use PascalCase`;
      } else {
        violation = `${identifier.type} "${identifier.name}" should use ${expectedConvention}`;
      }
    }

    return {
      identifier,
      isValid,
      expectedConvention,
      suggestedName,
      violation
    };
  }

  validateIdentifiers(identifiers: CodeIdentifier[], config: CodeConventionConfig): CodeValidationSummary {
    const violations: CodeValidationResult[] = [];
    const violationsByType: { [key: string]: number } = {};

    for (const identifier of identifiers) {
      const result = this.validateIdentifier(identifier, config);
      
      if (!result.isValid) {
        violations.push(result);
        
        const key = identifier.isReactComponent ? 'React Components' : identifier.type;
        violationsByType[key] = (violationsByType[key] || 0) + 1;
      }
    }

    return {
      totalChecked: identifiers.length,
      totalViolations: violations.length,
      violationsByType,
      violations
    };
  }

  // Suggest fixes for common naming issues
  suggestFixes(identifier: CodeIdentifier, config: CodeConventionConfig): string[] {
    const suggestions: string[] = [];
    const expectedConvention = this.getExpectedConvention(identifier, config);
    
    // Generate suggestions for different conventions
    const conventions: NamingConvention[] = ['camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'UPPER_SNAKE_CASE'];
    
    for (const convention of conventions) {
      if (convention !== expectedConvention) {
        const converted = this.convertToConvention(identifier.name, convention);
        if (converted !== identifier.name) {
          suggestions.push(`${convention}: ${converted}`);
        }
      }
    }

    return suggestions;
  }

  // Get default configuration based on your preferences
  getDefaultCodeConfig(): CodeConventionConfig {
    return {
      variables: 'camelCase',
      functions: 'camelCase',
      components: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
      classes: 'PascalCase',
      interfaces: 'PascalCase',
      types: 'PascalCase',
      enums: 'PascalCase'
    };
  }
}
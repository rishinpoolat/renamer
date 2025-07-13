import { parse as babelParse } from '@babel/parser';
import { readFileSync } from 'fs';

export interface CodeIdentifier {
  name: string;
  type: 'variable' | 'function' | 'class' | 'constant' | 'interface' | 'type' | 'enum';
  line: number;
  column: number;
  filePath: string;
  scope: 'global' | 'local' | 'class' | 'function';
  isExported: boolean;
  isReactComponent?: boolean;
}

export interface CodeAnalysisResult {
  identifiers: CodeIdentifier[];
  conventions: {
    variables: { [convention: string]: number };
    functions: { [convention: string]: number };
    classes: { [convention: string]: number };
    constants: { [convention: string]: number };
  };
  totalIdentifiers: number;
  consistencyScore: number;
}

export class ASTAnalyzer {
  private detectNamingConvention(name: string): string {
    if (/^[A-Z][A-Z0-9_]*$/.test(name)) return 'CONSTANT_CASE';
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camelCase';
    if (/^[a-z][a-z0-9_]*$/.test(name)) return 'snake_case';
    if (/^[a-z][a-z0-9-]*$/.test(name)) return 'kebab-case';
    return 'mixed';
  }

  private isReactComponent(name: string, node: any): boolean {
    if (!/^[A-Z]/.test(name)) return false;
    
    if (!node) return false;
    
    // Check if it's a function that returns JSX
    if (node.type === 'ArrowFunctionExpression' || 
        node.type === 'FunctionExpression' || 
        node.type === 'FunctionDeclaration') {
      return true; // Simple heuristic - any capitalized function could be a component
    }
    
    return false;
  }

  private isConstant(name: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(name);
  }

  private extractIdentifiersFromNode(node: any, identifiers: CodeIdentifier[], filePath: string): void {
    if (!node || typeof node !== 'object') return;

    // Handle variable declarations
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations || []) {
        if (declarator.id && declarator.id.name) {
          const name = declarator.id.name;
          const isConst = this.isConstant(name);
          
          identifiers.push({
            name,
            type: isConst ? 'constant' : 'variable',
            line: declarator.loc?.start?.line || 0,
            column: declarator.loc?.start?.column || 0,
            filePath,
            scope: 'global',
            isExported: this.checkIfExported(node),
            isReactComponent: !isConst ? this.isReactComponent(name, declarator.init) : false
          });
        }
      }
    }

    // Handle function declarations
    if (node.type === 'FunctionDeclaration' && node.id && node.id.name) {
      const name = node.id.name;
      identifiers.push({
        name,
        type: 'function',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported: this.checkIfExported(node),
        isReactComponent: this.isReactComponent(name, node)
      });
    }

    // Handle class declarations
    if (node.type === 'ClassDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'class',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported: this.checkIfExported(node)
      });
    }

    // Handle TypeScript interface declarations
    if (node.type === 'TSInterfaceDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'interface',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported: this.checkIfExported(node)
      });
    }

    // Handle TypeScript type alias declarations
    if (node.type === 'TSTypeAliasDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'type',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported: this.checkIfExported(node)
      });
    }

    // Handle TypeScript enum declarations
    if (node.type === 'TSEnumDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'enum',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported: this.checkIfExported(node)
      });
    }

    // Handle export declarations
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        // Mark declarations as exported
        this.extractExportedIdentifiers(node.declaration, identifiers, filePath, true);
        return;
      }
      // Handle export { name } syntax
      if (node.specifiers) {
        for (const specifier of node.specifiers) {
          if (specifier.exported && specifier.exported.name) {
            // This is for re-exports, we'll skip for now
          }
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
      this.extractExportedIdentifiers(node.declaration, identifiers, filePath, true);
      return;
    }

    // Recursively traverse child nodes
    for (const key in node) {
      if (key !== 'parent' && key !== 'loc' && key !== 'range' && key !== '_parent') {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(c => {
            if (c && typeof c === 'object') {
              this.extractIdentifiersFromNode(c, identifiers, filePath);
            }
          });
        } else if (child && typeof child === 'object') {
          this.extractIdentifiersFromNode(child, identifiers, filePath);
        }
      }
    }
  }

  private checkIfExported(_node: any): boolean {
    // Check if this node is inside an export declaration
    return false; // Will be properly set for exported nodes in the extraction logic
  }

  private extractExportedIdentifiers(node: any, identifiers: CodeIdentifier[], filePath: string, isExported: boolean): void {
    if (!node || typeof node !== 'object') return;

    // Handle variable declarations
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations || []) {
        if (declarator.id && declarator.id.name) {
          const name = declarator.id.name;
          const isConst = this.isConstant(name);
          
          identifiers.push({
            name,
            type: isConst ? 'constant' : 'variable',
            line: declarator.loc?.start?.line || 0,
            column: declarator.loc?.start?.column || 0,
            filePath,
            scope: 'global',
            isExported,
            isReactComponent: !isConst ? this.isReactComponent(name, declarator.init) : false
          });
        }
      }
      return;
    }

    // Handle function declarations
    if (node.type === 'FunctionDeclaration' && node.id && node.id.name) {
      const name = node.id.name;
      identifiers.push({
        name,
        type: 'function',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported,
        isReactComponent: this.isReactComponent(name, node)
      });
      return;
    }

    // Handle class declarations
    if (node.type === 'ClassDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'class',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported
      });
      return;
    }

    // Handle other TypeScript declarations...
    if (node.type === 'TSInterfaceDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'interface',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported
      });
      return;
    }

    if (node.type === 'TSTypeAliasDeclaration' && node.id && node.id.name) {
      identifiers.push({
        name: node.id.name,
        type: 'type',
        line: node.loc?.start?.line || 0,
        column: node.loc?.start?.column || 0,
        filePath,
        scope: 'global',
        isExported
      });
      return;
    }
  }

  analyzeFile(filePath: string): CodeIdentifier[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      const ast = babelParse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      });

      const identifiers: CodeIdentifier[] = [];
      this.extractIdentifiersFromNode(ast, identifiers, filePath);
      
      return identifiers;
    } catch (error) {
      console.warn(`Warning: Could not analyze ${filePath}: ${error}`);
      return [];
    }
  }

  analyzeProject(rootPath: string, patterns: string[] = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']): CodeAnalysisResult {
    const { glob } = require('glob');
    const { join } = require('path');
    
    const allIdentifiers: CodeIdentifier[] = [];
    const conventions = {
      variables: {} as { [key: string]: number },
      functions: {} as { [key: string]: number },
      classes: {} as { [key: string]: number },
      constants: {} as { [key: string]: number }
    };

    // Find all matching files
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, { 
        cwd: rootPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.d.ts']
      });
      files.push(...matches.map((f: string) => join(rootPath, f)));
    }

    // Analyze each file
    for (const filePath of files) {
      const identifiers = this.analyzeFile(filePath);
      allIdentifiers.push(...identifiers);

      // Count conventions
      for (const identifier of identifiers) {
        const convention = this.detectNamingConvention(identifier.name);
        const category = identifier.type === 'constant' ? 'constants' :
                        identifier.type === 'class' ? 'classes' :
                        identifier.type === 'function' ? 'functions' : 'variables';
        
        if (!conventions[category][convention]) {
          conventions[category][convention] = 0;
        }
        conventions[category][convention]++;
      }
    }

    // Calculate consistency score
    const totalByCategory = {
      variables: Object.values(conventions.variables).reduce((a, b) => a + b, 0),
      functions: Object.values(conventions.functions).reduce((a, b) => a + b, 0),
      classes: Object.values(conventions.classes).reduce((a, b) => a + b, 0),
      constants: Object.values(conventions.constants).reduce((a, b) => a + b, 0)
    };

    let consistencyScore = 0;
    let totalCategories = 0;

    for (const [category, total] of Object.entries(totalByCategory)) {
      if (total > 0) {
        const categoryConventions = conventions[category as keyof typeof conventions];
        const maxCount = Math.max(...Object.values(categoryConventions));
        consistencyScore += maxCount / total;
        totalCategories++;
      }
    }

    consistencyScore = totalCategories > 0 ? consistencyScore / totalCategories : 0;

    return {
      identifiers: allIdentifiers,
      conventions,
      totalIdentifiers: allIdentifiers.length,
      consistencyScore
    };
  }
}
import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { basename, extname } from 'path';
import { FileInfo } from '../types';

export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private watchPath: string;
  private filePatterns: string[];

  constructor(watchPath: string = process.cwd(), filePatterns: string[] = ['**/*']) {
    super();
    this.watchPath = watchPath;
    this.filePatterns = filePatterns;
  }

  start(): void {
    if (this.watcher) {
      console.warn('File watcher is already running');
      return;
    }

    this.watcher = chokidar.watch(this.filePatterns, {
      cwd: this.watchPath,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/.*',
        '**/CLAUDE.md'
      ],
      ignoreInitial: true,
      persistent: true
    });

    this.watcher
      .on('add', (path) => this.handleFileEvent('add', path))
      .on('addDir', (path) => this.handleFileEvent('addDir', path))
      .on('change', (path) => this.handleFileEvent('change', path))
      .on('unlink', (path) => this.handleFileEvent('unlink', path))
      .on('unlinkDir', (path) => this.handleFileEvent('unlinkDir', path))
      .on('error', (error) => this.emit('error', error))
      .on('ready', () => {
        console.log('File watcher is ready and monitoring for changes...');
        this.emit('ready');
      });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('File watcher stopped');
      this.emit('stopped');
    }
  }

  isWatching(): boolean {
    return this.watcher !== null;
  }

  private handleFileEvent(event: string, filePath: string): void {
    const fileInfo: FileInfo = {
      name: basename(filePath),
      path: filePath,
      extension: extname(filePath),
      isDirectory: event === 'addDir' || event === 'unlinkDir'
    };

    this.emit('fileEvent', {
      event,
      fileInfo,
      timestamp: new Date()
    });

    switch (event) {
      case 'add':
        this.emit('fileAdded', fileInfo);
        break;
      case 'addDir':
        this.emit('directoryAdded', fileInfo);
        break;
      case 'change':
        this.emit('fileChanged', fileInfo);
        break;
      case 'unlink':
        this.emit('fileRemoved', fileInfo);
        break;
      case 'unlinkDir':
        this.emit('directoryRemoved', fileInfo);
        break;
    }
  }

  setFilePatterns(patterns: string[]): void {
    this.filePatterns = patterns;
    if (this.watcher) {
      this.stop();
      this.start();
    }
  }

  getWatchedPaths(): string[] {
    if (!this.watcher) return [];
    return this.watcher.getWatched() as any;
  }
}
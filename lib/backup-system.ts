// Automated Backup and Recovery System for EXAMSPHERE
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

interface BackupConfig {
  schedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    time?: string; // "02:00" format
  };
  retention: {
    daily: number; // Keep X daily backups
    weekly: number; // Keep X weekly backups
    monthly: number; // Keep X monthly backups
  };
  storage: {
    local: {
      enabled: boolean;
      path: string;
    };
    cloud: {
      enabled: boolean;
      provider: 'aws' | 'gcp' | 'azure';
      bucket?: string;
      region?: string;
    };
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotation: boolean;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'bzip2' | 'lz4';
  };
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'manual';
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export class BackupManager {
  private config: BackupConfig;
  private backupHistory: BackupMetadata[] = [];
  
  constructor(config: BackupConfig) {
    this.config = config;
    this.loadBackupHistory();
  }

  // Schedule automatic backups
  scheduleBackups(): void {
    // Daily backup
    if (this.config.schedule.daily) {
      this.scheduleTask('daily', this.config.schedule.time || '02:00');
    }

    // Weekly backup (Sundays)
    if (this.config.schedule.weekly) {
      this.scheduleTask('weekly', this.config.schedule.time || '03:00');
    }

    // Monthly backup (1st of month)
    if (this.config.schedule.monthly) {
      this.scheduleTask('monthly', this.config.schedule.time || '04:00');
    }
  }

  private scheduleTask(type: string, time: string): void {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const msUntilExecution = scheduledTime.getTime() - now.getTime();

    setTimeout(async () => {
      await this.performBackup(type as 'daily' | 'weekly' | 'monthly');
      
      // Reschedule for next occurrence
      if (type === 'daily') {
        setTimeout(() => this.scheduleTask(type, time), 24 * 60 * 60 * 1000);
      } else if (type === 'weekly') {
        setTimeout(() => this.scheduleTask(type, time), 7 * 24 * 60 * 60 * 1000);
      } else if (type === 'monthly') {
        const nextMonth = new Date(scheduledTime);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const msUntilNextMonth = nextMonth.getTime() - Date.now();
        setTimeout(() => this.scheduleTask(type, time), msUntilNextMonth);
      }
    }, msUntilExecution);

    console.log(`[Backup] Scheduled ${type} backup for ${scheduledTime.toISOString()}`);
  }

  // Perform backup operation
  async performBackup(type: 'daily' | 'weekly' | 'monthly' | 'manual'): Promise<BackupMetadata> {
    const backupId = crypto.randomUUID();
    const startTime = Date.now();
    
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type,
      size: 0,
      checksum: '',
      encrypted: this.config.encryption.enabled,
      compressed: this.config.compression.enabled,
      status: 'pending'
    };

    try {
      console.log(`[Backup] Starting ${type} backup (ID: ${backupId})`);
      metadata.status = 'in_progress';
      this.updateBackupHistory(metadata);

      // Create backup directory
      const backupDir = this.getBackupDirectory(type, metadata.timestamp);
      await fs.mkdir(backupDir, { recursive: true });

      // Database backup
      await this.backupDatabase(backupDir);

      // File system backup
      await this.backupFiles(backupDir);

      // Application configuration backup
      await this.backupConfiguration(backupDir);

      // Calculate size and checksum
      const stats = await this.calculateBackupStats(backupDir);
      metadata.size = stats.size;
      metadata.checksum = stats.checksum;

      // Compress if enabled
      if (this.config.compression.enabled) {
        await this.compressBackup(backupDir);
      }

      // Encrypt if enabled
      if (this.config.encryption.enabled) {
        await this.encryptBackup(backupDir);
      }

      // Upload to cloud storage if enabled
      if (this.config.storage.cloud.enabled) {
        await this.uploadToCloud(backupDir);
      }

      metadata.status = 'completed';
      metadata.duration = Date.now() - startTime;

      console.log(`[Backup] Completed ${type} backup in ${metadata.duration}ms`);

      // Clean up old backups
      if (type !== 'manual') {
        await this.cleanupOldBackups(type);
      }

    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`[Backup] Failed ${type} backup:`, error);
    } finally {
      this.updateBackupHistory(metadata);
    }

    return metadata;
  }

  private async backupDatabase(backupDir: string): Promise<void> {
    const dbBackupPath = path.join(backupDir, 'database.sql');
    
    try {
      // MySQL backup - Refactored for MySQL - Author: Sanket
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        // Parse mysql://user:pass@host:port/db URL if needed, or use the URL directly if supported by the client
        execSync(`mysqldump "${dbUrl}" > "${dbBackupPath}"`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('[Backup] Database backup failed:', error);
      throw error;
    }
  }

  private async backupFiles(backupDir: string): Promise<void> {
    const filesToBackup = [
      'public/uploads',
      'public/courses',
      'public/avatars',
      '.env.local',
      'prisma/schema.prisma'
    ];

    for (const file of filesToBackup) {
      const sourcePath = path.join(process.cwd(), file);
      const targetPath = path.join(backupDir, 'files', file);
      
      try {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Check if source exists
        try {
          await fs.access(sourcePath);
          
          // Copy directory or file
          if ((await fs.stat(sourcePath)).isDirectory()) {
            execSync(`cp -r "${sourcePath}" "${path.dirname(targetPath)}"`, { stdio: 'inherit' });
          } else {
            await fs.copyFile(sourcePath, targetPath);
          }
        } catch (accessError) {
          console.warn(`[Backup] Skipping ${file} (not found)`);
        }
      } catch (error) {
        console.error(`[Backup] Failed to backup ${file}:`, error);
      }
    }
  }

  private async backupConfiguration(backupDir: string): Promise<void> {
    const config = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      backupConfig: this.config,
      packageInfo: await this.getPackageInfo()
    };

    const configPath = path.join(backupDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  private async getPackageInfo(): Promise<any> {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      return JSON.parse(packageContent);
    } catch (error) {
      return null;
    }
  }

  private async calculateBackupStats(backupDir: string): Promise<{ size: number; checksum: string }> {
    let totalSize = 0;
    const hash = crypto.createHash('sha256');

    const calculateDirSize = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await calculateDirSize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          
          const fileContent = await fs.readFile(fullPath);
          hash.update(fileContent);
        }
      }
    };

    await calculateDirSize(backupDir);
    
    return {
      size: totalSize,
      checksum: hash.digest('hex')
    };
  }

  private async compressBackup(backupDir: string): Promise<void> {
    const algorithm = this.config.compression.algorithm;
    const archiveName = `backup.tar.${algorithm === 'gzip' ? 'gz' : algorithm === 'bzip2' ? 'bz2' : 'lz4'}`;
    const archivePath = path.join(path.dirname(backupDir), archiveName);

    let compressCmd: string;
    switch (algorithm) {
      case 'gzip':
        compressCmd = `tar -czf "${archivePath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`;
        break;
      case 'bzip2':
        compressCmd = `tar -cjf "${archivePath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`;
        break;
      case 'lz4':
        compressCmd = `tar -cf - -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}" | lz4 - "${archivePath}"`;
        break;
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }

    execSync(compressCmd, { stdio: 'inherit' });
    
    // Remove uncompressed directory
    execSync(`rm -rf "${backupDir}"`, { stdio: 'inherit' });
  }

  private async encryptBackup(backupDir: string): Promise<void> {
    const algorithm = this.config.encryption.algorithm;
    const key = await this.getEncryptionKey();
    
    // Implement encryption logic based on algorithm
    // This is a simplified example
    console.log(`[Backup] Encrypting backup with ${algorithm}`);
  }

  private async getEncryptionKey(): Promise<Buffer> {
    const keyPath = path.join(process.cwd(), '.backup-key');
    
    try {
      return await fs.readFile(keyPath);
    } catch (error) {
      // Generate new key if doesn't exist
      const key = crypto.randomBytes(32);
      await fs.writeFile(keyPath, key, { mode: 0o600 });
      return key;
    }
  }

  private async uploadToCloud(backupDir: string): Promise<void> {
    // Implement cloud upload based on provider
    console.log(`[Backup] Uploading to ${this.config.storage.cloud.provider}`);
    
    // This would integrate with AWS S3, Google Cloud Storage, or Azure Blob Storage
    // Implementation depends on the chosen cloud provider
  }

  private getBackupDirectory(type: string, timestamp: Date): string {
    const dateString = timestamp.toISOString().split('T')[0];
    const timeString = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupName = `${type}_${dateString}_${timeString}`;
    
    return path.join(this.config.storage.local.path, backupName);
  }

  private async cleanupOldBackups(type: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const retention = this.config.retention[type];
    const backupsOfType = this.backupHistory
      .filter(backup => backup.type === type && backup.status === 'completed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (backupsOfType.length > retention) {
      const backupsToDelete = backupsOfType.slice(retention);
      
      for (const backup of backupsToDelete) {
        try {
          await this.deleteBackup(backup);
          this.backupHistory = this.backupHistory.filter(b => b.id !== backup.id);
        } catch (error) {
          console.error(`[Backup] Failed to delete old backup ${backup.id}:`, error);
        }
      }
    }
  }

  private async deleteBackup(backup: BackupMetadata): Promise<void> {
    const backupDir = this.getBackupDirectory(backup.type, backup.timestamp);
    
    try {
      await fs.rm(backupDir, { recursive: true, force: true });
      console.log(`[Backup] Deleted old backup: ${backup.id}`);
    } catch (error) {
      console.error(`[Backup] Failed to delete backup directory ${backupDir}:`, error);
    }
  }

  // Recovery operations
  async listBackups(): Promise<BackupMetadata[]> {
    return this.backupHistory
      .filter(backup => backup.status === 'completed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.backupHistory.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup ${backupId} is not completed`);
    }

    console.log(`[Recovery] Starting restore from backup ${backupId}`);

    try {
      const backupDir = this.getBackupDirectory(backup.type, backup.timestamp);
      
      // Decrypt if encrypted
      if (backup.encrypted) {
        await this.decryptBackup(backupDir);
      }

      // Decompress if compressed
      if (backup.compressed) {
        await this.decompressBackup(backupDir);
      }

      // Verify backup integrity
      await this.verifyBackupIntegrity(backupDir, backup.checksum);

      // Restore database
      await this.restoreDatabase(backupDir);

      // Restore files
      await this.restoreFiles(backupDir);

      console.log(`[Recovery] Successfully restored from backup ${backupId}`);

    } catch (error) {
      console.error(`[Recovery] Failed to restore from backup ${backupId}:`, error);
      throw error;
    }
  }

  private async decryptBackup(backupDir: string): Promise<void> {
    // Implement decryption logic
    console.log('[Recovery] Decrypting backup...');
  }

  private async decompressBackup(backupDir: string): Promise<void> {
    // Implement decompression logic
    console.log('[Recovery] Decompressing backup...');
  }

  private async verifyBackupIntegrity(backupDir: string, expectedChecksum: string): Promise<void> {
    const stats = await this.calculateBackupStats(backupDir);
    
    if (stats.checksum !== expectedChecksum) {
      throw new Error('Backup integrity check failed: checksum mismatch');
    }

    console.log('[Recovery] Backup integrity verified');
  }

  private async restoreDatabase(backupDir: string): Promise<void> {
    const dbBackupPath = path.join(backupDir, 'database.sql');
    
    try {
      // MySQL restore - Refactored for MySQL - Author: Sanket
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        execSync(`mysql "${dbUrl}" < "${dbBackupPath}"`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('[Recovery] Database restore failed:', error);
      throw error;
    }
  }

  private async restoreFiles(backupDir: string): Promise<void> {
    const filesBackupDir = path.join(backupDir, 'files');
    
    try {
      // Copy files back to their original locations
      execSync(`cp -r "${filesBackupDir}"/* "${process.cwd()}/"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('[Recovery] File restore failed:', error);
      throw error;
    }
  }

  // Backup history management
  private async loadBackupHistory(): Promise<void> {
    const historyPath = path.join(this.config.storage.local.path, 'backup-history.json');
    
    try {
      const historyContent = await fs.readFile(historyPath, 'utf-8');
      this.backupHistory = JSON.parse(historyContent);
    } catch (error) {
      this.backupHistory = [];
    }
  }

  private async updateBackupHistory(metadata: BackupMetadata): Promise<void> {
    const existingIndex = this.backupHistory.findIndex(b => b.id === metadata.id);
    
    if (existingIndex >= 0) {
      this.backupHistory[existingIndex] = metadata;
    } else {
      this.backupHistory.push(metadata);
    }

    await this.saveBackupHistory();
  }

  private async saveBackupHistory(): Promise<void> {
    const historyPath = path.join(this.config.storage.local.path, 'backup-history.json');
    
    try {
      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(historyPath, JSON.stringify(this.backupHistory, null, 2));
    } catch (error) {
      console.error('[Backup] Failed to save backup history:', error);
    }
  }

  // Health monitoring
  async getBackupHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    lastBackup?: Date;
    issues: string[];
  }> {
    const issues: string[] = [];
    const lastSuccessfulBackup = this.backupHistory
      .filter(b => b.status === 'completed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    // Check if recent backup exists
    const now = Date.now();
    const daysSinceLastBackup = lastSuccessfulBackup 
      ? (now - lastSuccessfulBackup.timestamp.getTime()) / (24 * 60 * 60 * 1000)
      : Infinity;

    if (daysSinceLastBackup > 7) {
      issues.push('No successful backup in over 7 days');
    } else if (daysSinceLastBackup > 3) {
      issues.push('No successful backup in over 3 days');
    }

    // Check for recent failures
    const recentFailures = this.backupHistory
      .filter(b => b.status === 'failed' && (now - b.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000)
      .length;

    if (recentFailures > 3) {
      issues.push(`${recentFailures} failed backups in the last 7 days`);
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (daysSinceLastBackup > 7 || recentFailures > 5) {
      status = 'critical';
    } else if (daysSinceLastBackup > 3 || recentFailures > 2) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    return {
      status,
      lastBackup: lastSuccessfulBackup?.timestamp,
      issues
    };
  }
}
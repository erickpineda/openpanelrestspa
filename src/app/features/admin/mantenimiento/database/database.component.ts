import { Component } from '@angular/core';

@Component({
  selector: 'app-mantenimiento-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
  standalone: false,
})
export class DatabaseComponent {
  status = 'OK';
  optimizeRunning = false;
  backupRunning = false;
  runOptimize(): void {
    this.optimizeRunning = true;
    setTimeout(() => {
      this.optimizeRunning = false;
    }, 1200);
  }
  runBackup(): void {
    this.backupRunning = true;
    setTimeout(() => {
      this.backupRunning = false;
    }, 1500);
  }
}

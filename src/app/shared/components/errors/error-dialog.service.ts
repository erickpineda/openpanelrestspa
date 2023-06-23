import { Injectable, NgModule } from '@angular/core';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';

@Injectable()
export class ErrorDialogService {
  private opened = false;

  constructor() {}

  openDialog(message: string, status?: number): void {
    if (!this.opened) {
      
    }
  }
}
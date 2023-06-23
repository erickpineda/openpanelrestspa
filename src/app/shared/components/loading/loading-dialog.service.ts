import { Injectable } from '@angular/core';

@Injectable()
export class LoadingDialogService {
  openDialog() {
    throw new Error('Method not implemented.');
  }
  hideDialog() {
    throw new Error('Method not implemented.');
  }
  private opened = false;

  constructor() {}

}
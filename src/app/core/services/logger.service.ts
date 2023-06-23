import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  log(error: any) {
    console.log(error.message);
  }
} 

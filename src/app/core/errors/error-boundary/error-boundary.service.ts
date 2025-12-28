// core/errors/error-boundary/error-boundary.service.ts

/*
ARQUITECTURA CORRECTA
┌─────────────────┐     ┌───────────────────┐   ┌──────────────────┐
│   COMPONENTE    │ ──▶│   ERROR BOUNDARY │ ──▶│ ERROR BOUNDARY   │
│                 │     │    (Componente)   │   │    SERVICE       │
└─────────────────┘     └───────────────────┘   └──────────────────┘
         │                         │
         ▼                         │
┌─────────────────┐                │
│    SERVICIO     │                │
│                 │                │
└─────────────────┘                │
         │                         │
         ▼                         │
┌─────────────────┐                │
│  HTTP CALL      │ ───────────────┘
└─────────────────┘        (El servicio NO usa ErrorBoundaryService)
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│ ERROR INTERCEPTOR│ ──▶ │ GLOBAL ERROR     │
│                  │      │   HANDLER        │
└──────────────────┘      └──────────────────┘
*/

import { Injectable, Injector } from '@angular/core';
import { ErrorBoundaryComponent } from '../../../shared/components/errors/error-boundary/error-boundary.component';

@Injectable({
  providedIn: 'root',
})
export class ErrorBoundaryService {
  private boundaries = new Map<string, ErrorBoundaryComponent>();

  registerBoundary(id: string, boundary: ErrorBoundaryComponent): void {
    this.boundaries.set(id, boundary);
  }

  unregisterBoundary(id: string): void {
    this.boundaries.delete(id);
  }

  reportErrorToBoundary(boundaryId: string, error: any, componentName: string = ''): void {
    const boundary = this.boundaries.get(boundaryId);
    if (boundary) {
      boundary.captureError(error, componentName);
    } else {
      console.warn(`Error Boundary no encontrado: ${boundaryId}`);
    }
  }

  getBoundary(boundaryId: string): ErrorBoundaryComponent | undefined {
    return this.boundaries.get(boundaryId);
  }
}

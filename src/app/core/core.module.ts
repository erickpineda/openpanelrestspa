import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Servicios
import { AuthService } from './services/auth/auth.service';
import { TokenStorageService } from './services/auth/token-storage.service';
import { LoadingService } from './services/ui/loading.service';
import { TemporaryStorageService } from './services/ui/temporary-storage.service';
import { SessionManagerService } from './services/auth/session-manager.service';
import { UnsavedWorkService } from './services/utils/unsaved-work.service';
import { SearchUtilService } from './services/utils/search-util.service';
import { EntradaService } from './services/data/entrada.service';
import { UsuarioService } from './services/data/usuario.service';

// Interceptors
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { ErrorInterceptor } from './interceptor/error.interceptor';
import { NetworkInterceptor } from './interceptor/network.interceptor';
import { GlobalErrorHandlerService } from './errors/global-error/global-error-handler.service';
import { LoggerService } from './services/logger.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  exports: [],
  providers: [
    // Servicios singleton
    GlobalErrorHandlerService,
    AuthService,
    TokenStorageService,
    LoadingService,
    TemporaryStorageService,
    SessionManagerService,
    UnsavedWorkService,
    SearchUtilService,
    EntradaService,
    UsuarioService,
    LoggerService,
    
    // Interceptors
    // ✅ SOLO interceptors (los servicios ahora usan providedIn: 'root')
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NetworkInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor() {
  }
}
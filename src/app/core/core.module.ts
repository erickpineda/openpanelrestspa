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
import { TimeoutInterceptor } from './interceptor/timeout.interceptor';
import { ErrorBoundaryService } from './errors/error-boundary/error-boundary.service';
import { RouterModule } from '@angular/router';

import { LanguageInterceptor } from './interceptor/language.interceptor';
import { DateInterceptor } from './interceptor/date.interceptor';
import { LanguageService } from './services/language.service';

import { TranslationService } from './services/translation.service';
import { UnsavedWorkModalComponent } from './features/unsaved-work-modal.component';
import { SessionExpiredComponent } from './features/session-expired.component';
import { ModalModule, ButtonModule, AlertModule } from '@coreui/angular';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@NgModule({
  imports: [CommonModule, RouterModule, ModalModule, ButtonModule, AlertModule, TranslatePipe],
  declarations: [
    UnsavedWorkModalComponent,
    SessionExpiredComponent,
  ],
  exports: [
    UnsavedWorkModalComponent,
    SessionExpiredComponent,
  ],
  providers: [
    // Servicios singleton
    GlobalErrorHandlerService,
    ErrorBoundaryService,
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
    LanguageService,
    TranslationService,

    // Interceptors en orden de ejecución
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeoutInterceptor, // 1º: Timeouts específicos
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LanguageInterceptor, // 2º: Idioma (antes de auth para que auth también pueda llevarlo si es necesario)
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DateInterceptor, // Formateo de fechas para el backend
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor, // 3º: Autenticación
      multi: true,
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: NetworkInterceptor, // 3º: Loading y manejo de errores
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor, // 4º: Manejo global de errores
      multi: true,
    },
  ],
})
export class CoreModule {
  constructor() {}
}

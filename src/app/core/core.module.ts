import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

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

import { GlobalErrorHandlerService } from './errors/global-error/global-error-handler.service';
import { LoggerService } from './services/logger.service';
import { ErrorBoundaryService } from './errors/error-boundary/error-boundary.service';
import { RouterModule } from '@angular/router';

import { LanguageService } from './services/language.service';

import { TranslationService } from './services/translation.service';
import { UnsavedWorkModalComponent } from './features/unsaved-work-modal.component';
import { SessionExpiredComponent } from './features/session-expired.component';
import { ModalModule, ButtonModule, AlertModule } from '@coreui/angular';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@NgModule({
  imports: [CommonModule, RouterModule, ModalModule, ButtonModule, AlertModule, TranslatePipe],
  declarations: [UnsavedWorkModalComponent, SessionExpiredComponent],
  exports: [UnsavedWorkModalComponent, SessionExpiredComponent],
  providers: [
    // Servicios singleton
    GlobalErrorHandlerService,
    ErrorBoundaryService,
    AuthService,
    TokenStorageService,
    LoadingService,
    TemporaryStorageService,
    // SessionManagerService, // Provided in root
    UnsavedWorkService,
    SearchUtilService,
    EntradaService,
    UsuarioService,
    LoggerService,
    LanguageService,
    TranslationService
  ],
})
export class CoreModule {
  constructor() {}
}

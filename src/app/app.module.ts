import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './core/core.module';
import { GlobalErrorComponent } from './core/errors/global-error/global-error.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { GlobalErrorHandlerService } from './core/errors/global-error/global-error-handler.service';
import { CustomPreloadingStrategyService } from './core/preloading/custom-preloading-strategy.service';
import { DatePipe } from '@angular/common';
import { ErrorInterceptor } from './core/interceptor/error.interceptor';
import { ToastsContainerComponent } from './core/op-toast/toasts-container.component';
import { ModalModule, ToastModule } from '@coreui/angular';
import { UnsavedWorkDirective } from './core/directives/unsaved-work.directive';
import { SessionExpiredComponent } from './core/features/session-expired.component';
import { UnsavedWorkModalComponent } from './core/features/unsaved-work-modal.component';
import { SessionManagerService } from './core/services/session-manager.service';
import { UnsavedWorkService } from './core/services/unsaved-work.service';

@NgModule({
  declarations: [
    AppComponent,
    GlobalErrorComponent,
    ToastsContainerComponent,
    SessionExpiredComponent,
    UnsavedWorkModalComponent,
    UnsavedWorkDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    CoreModule,
    ToastModule,
    ModalModule
  ],
  providers: [
    DatePipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
    CustomPreloadingStrategyService,
    SessionManagerService,
    UnsavedWorkService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { ErrorHandler, NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './core/core.module';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { CustomPreloadingStrategyService } from './core/preloading/custom-preloading-strategy.service';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ModalModule, ToastModule } from '@coreui/angular';
import { UnsavedWorkDirective } from './core/directives/unsaved-work.directive';
import { SessionExpiredComponent } from './core/features/session-expired.component';
import { UnsavedWorkModalComponent } from './core/features/unsaved-work-modal.component';
import { GlobalNotificationsComponent } from './shared/components/global-notifications/global-notifications.component';
import { SharedOPModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    SessionExpiredComponent,
    UnsavedWorkModalComponent,
    UnsavedWorkDirective,
    GlobalNotificationsComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CoreModule, // ✅ Solo servicios globales
    SharedOPModule, // ✅ Componentes compartidos
    ToastModule,
    ModalModule,
  ],
  providers: [
    DatePipe,
    CustomPreloadingStrategyService,
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
registerLocaleData(localeEs);

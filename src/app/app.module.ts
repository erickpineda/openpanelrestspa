import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './core/core.module';
import { GlobalErrorComponent } from './core/errors/global-error/global-error.component';
import { HttpClientModule } from '@angular/common/http';
import { CustomPreloadingStrategyService } from './core/preloading/custom-preloading-strategy.service';
import { DatePipe } from '@angular/common';
import { ModalModule, ToastModule } from '@coreui/angular';
import { UnsavedWorkDirective } from './core/directives/unsaved-work.directive';
import { SessionExpiredComponent } from './core/features/session-expired.component';
import { UnsavedWorkModalComponent } from './core/features/unsaved-work-modal.component';
import { GlobalNotificationsComponent } from './shared/components/global-notifications/global-notifications.component';
import { SharedOPModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    GlobalErrorComponent,
    SessionExpiredComponent,
    UnsavedWorkModalComponent,
    UnsavedWorkDirective,
    GlobalNotificationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    CoreModule, // ✅ Solo servicios globales
    SharedOPModule, // ✅ Componentes compartidos
    ToastModule,
    ModalModule
  ],
  providers: [
    DatePipe,
    CustomPreloadingStrategyService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

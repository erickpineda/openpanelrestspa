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

@NgModule({
  declarations: [
    AppComponent,
    GlobalErrorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    CoreModule
  ],
  providers: [
    GlobalErrorHandlerService,
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
    CustomPreloadingStrategyService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

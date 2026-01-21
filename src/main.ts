import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const startTime = performance.now();

platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    applicationProviders: [provideZoneChangeDetection()],
  })
  .then(() => {
    const endTime = performance.now();
    console.log(`🚀 Application bootstrapped in ${(endTime - startTime).toFixed(2)}ms`);
  })
  .catch((err: any) => console.error(err));

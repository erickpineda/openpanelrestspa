import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GlobalErrorComponent } from './core/errors/global-error/global-error.component';
import { NotFoundComponent } from './core/errors/not-found/not-found.component';
import { CustomPreloadingStrategyService } from './core/preloading/custom-preloading-strategy.service';

const routes: Routes = [
  { path: '', data: { preload: true, delay:1000 }, loadChildren: () => import('./public/public.module').then(m => m.PublicModule) },
  { path: 'admin', data: { preload: true, delay:3000 }, loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
  { path: 'error', component: GlobalErrorComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true,
    preloadingStrategy: CustomPreloadingStrategyService,
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

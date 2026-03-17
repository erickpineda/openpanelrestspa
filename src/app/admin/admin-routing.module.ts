// admin-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AuthGuard } from '../core/_helpers/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard], // protección del padre
    canActivateChild: [AuthGuard], // protección de hijos
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/admin/dashboard/dashboard.module').then(
            (m) => m.DashboardFeatureModule
          ),
        data: { preload: true, delay: 1000, title: 'MENU.DASHBOARD' },
      },
      {
        path: 'control',
        loadChildren: () => import('./base/base.module').then((m) => m.BaseModule),
        data: { preload: true, delay: 1000, title: 'MENU.CONTROL_PANEL' },
        canLoad: [AuthGuard], // evita la carga del módulo si no estamos autenticados
      },
      {
        path: 'contenido',
        redirectTo: 'control/contenido',
        pathMatch: 'prefix',
      },
      {
        path: 'gestion',
        redirectTo: 'control/gestion',
        pathMatch: 'prefix',
      },
      {
        path: 'configuracion',
        redirectTo: 'control/configuracion',
        pathMatch: 'prefix',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}

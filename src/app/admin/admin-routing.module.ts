import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './base/dashboard/dashboard.component';
import { AuthGuard } from '../core/_helpers/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard], // 🔐 Protección aquí
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { preload: true, delay: 1000 }
      },
      {
        path: 'control',
        loadChildren: () => import('./base/base.module').then(m => m.BaseModule),
        data: { preload: true, delay: 1000 }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
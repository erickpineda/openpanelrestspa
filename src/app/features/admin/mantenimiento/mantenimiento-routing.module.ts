import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogsComponent } from './logs/logs.component';
import { DatabaseComponent } from './database/database.component';
import { DevToolsComponent } from './dev-tools/dev-tools.component';
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: 'logs',
    component: LogsComponent,
    data: { roles: [UserRole.MANTENIMIENTO, UserRole.DESARROLLADOR, UserRole.PROPIETARIO] },
  },
  {
    path: 'database',
    component: DatabaseComponent,
    data: { roles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO] },
  },
  {
    path: 'dev-tools',
    component: DevToolsComponent,
    data: { roles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO] },
  },
  { path: '', redirectTo: 'logs', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MantenimientoFeatureRoutingModule {}

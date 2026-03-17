import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogsComponent } from './logs/logs.component';
import { DatabaseComponent } from './database/database.component';
import { DevToolsComponent } from './dev-tools/dev-tools.component';

const routes: Routes = [
  { path: 'logs', component: LogsComponent },
  { path: 'database', component: DatabaseComponent },
  { path: 'dev-tools', component: DevToolsComponent },
  { path: '', redirectTo: 'logs', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MantenimientoFeatureRoutingModule {}

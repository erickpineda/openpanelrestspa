import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TemasComponent } from './temas/temas.component';
import { AjustesComponent } from './ajustes/ajustes.component';
import { TemaStudioComponent } from './temas/studio/tema-studio.component';

const routes: Routes = [
  { path: 'temas/:slug', component: TemaStudioComponent, data: { title: 'ADMIN.THEMES.STUDIO.TITLE' } },
  { path: 'temas', component: TemasComponent, pathMatch: 'full', data: { title: 'MENU.THEMES' } },
  { path: 'ajustes', component: AjustesComponent, data: { title: 'MENU.SETTINGS' } },
  { path: '', redirectTo: 'temas', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfiguracionFeatureRoutingModule {}

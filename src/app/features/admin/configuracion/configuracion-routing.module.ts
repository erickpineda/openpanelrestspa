import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TemasComponent } from './temas/temas.component';
import { AjustesComponent } from './ajustes/ajustes.component';
import { TemaStudioComponent } from './temas/studio/tema-studio.component';

const routes: Routes = [
  { path: 'temas/:slug', component: TemaStudioComponent },
  { path: 'temas', component: TemasComponent, pathMatch: 'full' },
  { path: 'ajustes', component: AjustesComponent },
  { path: '', redirectTo: 'temas', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfiguracionFeatureRoutingModule {}

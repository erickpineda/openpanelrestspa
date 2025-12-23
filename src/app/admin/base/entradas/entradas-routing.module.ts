import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoEntradasComponent } from './listado-entradas.component';
import { CrearEntradaComponent } from './crear/crear-entrada.component';
import { EditarEntradaComponent } from './editar/editar-entrada.component';
import { EntradaFormComponent } from './entrada-form/entrada-form.component';
import { PreviaEntradaComponent } from './previa/preview-entrada.component';
import { TemporaryEntriesManagerComponent } from '../../../shared/components/temporary-entries-manager/temporary-entries-manager.component';

const routes: Routes = [
  { path: '', component: ListadoEntradasComponent },
  { path: 'crear', component: CrearEntradaComponent },
  { path: 'editar/:idEntrada', component: EditarEntradaComponent },
  { path: 'entradas-temporales', component: TemporaryEntriesManagerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntradasRoutingModule {}

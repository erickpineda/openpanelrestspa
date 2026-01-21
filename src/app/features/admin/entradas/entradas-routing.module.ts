import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoEntradasComponent } from './listado-entradas.component';
import { CrearEntradaComponent } from './crear/crear-entrada.component';
import { EditarEntradaComponent } from './editar/editar-entrada.component';
import { TemporaryEntriesManagerComponent } from './entradas-temporales/temporary-entries-manager.component';

const routes: Routes = [
  { path: '', component: ListadoEntradasComponent },
  { path: 'crear', component: CrearEntradaComponent, data: { title: 'MENU.CREATE_ENTRY' } },
  {
    path: 'editar/:idEntrada',
    component: EditarEntradaComponent,
    data: { title: 'MENU.EDIT_ENTRY' },
  },
  {
    path: 'entradas-temporales',
    component: TemporaryEntriesManagerComponent,
    data: { title: 'MENU.TEMP_ENTRIES' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntradasRoutingModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EtiquetasRoutingModule } from './etiquetas-routing.module';
import { EtiquetasListComponent } from './listado-etiquetas.component';
import { EtiquetaFormComponent } from './etiqueta-form/etiqueta-form.component';
import { SearchToolbarBasicComponent } from './components/search-toolbar-basic/search-toolbar-basic.component';
import { CrearEtiquetaComponent } from './crear/crear-etiqueta.component';
import { EditarEtiquetaComponent } from './editar/editar-etiqueta.component';
import { EliminarEtiquetaComponent } from './eliminar/eliminar-etiqueta.component';
import { SharedOPModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [
    EtiquetasListComponent,
    EtiquetaFormComponent,
    SearchToolbarBasicComponent,
    CrearEtiquetaComponent,
    EditarEtiquetaComponent,
    EliminarEtiquetaComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedOPModule, EtiquetasRoutingModule],
})
export class EtiquetasModule {}

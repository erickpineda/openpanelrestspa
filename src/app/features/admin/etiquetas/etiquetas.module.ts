import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { EtiquetasFeatureRoutingModule } from './etiquetas-routing.module';
import { EtiquetasListComponent } from './listado-etiquetas.component';
import { EtiquetaFormComponent } from './etiqueta-form/etiqueta-form.component';
import { SearchToolbarBasicComponent } from './components/search-toolbar-basic/search-toolbar-basic.component';
import { CrearEtiquetaComponent } from './crear/crear-etiqueta.component';
import { EditarEtiquetaComponent } from './editar/editar-etiqueta.component';
import { EliminarEtiquetaComponent } from './eliminar/eliminar-etiqueta.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    EtiquetasFeatureRoutingModule,
  ],
  declarations: [
    EtiquetasListComponent,
    EtiquetaFormComponent,
    SearchToolbarBasicComponent,
    CrearEtiquetaComponent,
    EditarEtiquetaComponent,
    EliminarEtiquetaComponent,
  ],
})
export class EtiquetasFeatureModule {}

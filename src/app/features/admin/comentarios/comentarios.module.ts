import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { SharedSearchModule } from '@shared/search/search.module';
import { ComentariosRoutingModule } from './comentarios-routing.module';
import { ComentariosFilterComponent, ComentariosTableComponent } from './components';
import { ListadoComentariosComponent } from './listado-comentarios.component';
import { ComentarioFormComponent } from './comentario-form/comentario-form.component';
import { CrearComentarioComponent } from './crear/crear-comentario.component';
import { EditarComentarioComponent } from './editar/editar-comentario.component';

@NgModule({
  declarations: [
    ListadoComentariosComponent,
    ComentariosFilterComponent,
    ComentariosTableComponent,
    ComentarioFormComponent,
    CrearComentarioComponent,
    EditarComentarioComponent,
  ],
  imports: [
    CommonModule,
    SharedOPModule,
    SharedCoreUiModule,
    ComentariosRoutingModule,
    SharedWidgetsModule,
    SharedSearchModule,
  ],
})
export class ComentariosFeatureModule {}

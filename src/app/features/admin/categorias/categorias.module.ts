import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { CategoriasRoutingModule } from './categorias-routing.module';
import { ListadoCategoriasComponent } from './listado-categorias.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoriaFormComponent } from './categoria-form/categoria-form.component';
import { CrearCategoriaComponent } from './crear/crear-categoria.component';
import { EditarCategoriaComponent } from './editar/editar-categoria.component';

@NgModule({
  declarations: [
    ListadoCategoriasComponent,
    CategoriaFormComponent,
    CrearCategoriaComponent,
    EditarCategoriaComponent,
  ],
  imports: [
    CommonModule,
    SharedOPModule,
    SharedCoreUiModule,
    CategoriasRoutingModule,
    SharedWidgetsModule,
    ReactiveFormsModule,
  ],
})
export class CategoriasFeatureModule {}

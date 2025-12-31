import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BaseRoutingModule } from './base-routing.module';
import { BaseComponent } from './base.component';
import { BaseIndexComponent } from './base-index.component';

// Componentes específicos de Base
// Entradas moved to lazy EntradasModule
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearComentarioComponent } from './comentarios/crear/crear-comentario.component';
import { EditarComentarioComponent } from './comentarios/editar/editar-comentario.component';
import { ComentarioFormComponent } from './comentarios/comentario-form/comentario-form.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
import { CrearCategoriaComponent } from './categorias/crear/crear-categoria.component';
import { EditarCategoriaComponent } from './categorias/editar/editar-categoria.component';
import { CategoriaFormComponent } from './categorias/categoria-form/categoria-form.component';
// Entradas components are now lazy in EntradasModule; CKEditor moved there
import { SharedOPModule } from '../../shared/shared.module';
import { SharedCoreUiModule } from '../../shared/shared-coreui.module';

@NgModule({
  imports: [
    BaseRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // ✅ Shared Module (contiene componentes compartidos)
    SharedOPModule,
    SharedCoreUiModule,
  ],
  declarations: [
    // ✅ Solo componentes específicos de Base
    BaseComponent,
    BaseIndexComponent,
    // Entradas components declared in EntradasModule (lazy)
    ListadoComentariosComponent,
    CrearComentarioComponent,
    EditarComentarioComponent,
    ComentarioFormComponent,
    ListadoCategoriasComponent,
    CrearCategoriaComponent,
    EditarCategoriaComponent,
    CategoriaFormComponent,
  ],
})
export class BaseModule {}

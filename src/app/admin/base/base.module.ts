import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { BaseRoutingModule } from './base-routing.module';
import { BaseComponent } from './base.component';

// Componentes específicos de Base
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
import { CrearEditarCategoria } from './categorias/crear-editar/crear-editar-categoria.component';
import { CrearEntradaComponent } from './entradas/crear/crear-entrada.component';
import { EditarEntradaComponent } from './entradas/editar/editar-entrada.component';
import { EntradaFormComponent } from './entradas/entrada-form/entrada-form.component';
import { PreviaEntradaComponent } from './entradas/previa/preview-entrada.component';

// Módulos externos
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SharedOPModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    BaseRoutingModule,
    CommonModule,
    ReactiveFormsModule,

    // ✅ Shared Module (contiene componentes compartidos)
    SharedOPModule,

    // Módulos específicos de Base
    CKEditorModule,
  ],
  declarations: [
    // ✅ Solo componentes específicos de Base
    BaseComponent,
    ListadoEntradasComponent,
    EntradaFormComponent,
    CrearEntradaComponent,
    EditarEntradaComponent,
    ListadoComentariosComponent,
    CrearEditarComentario,
    ListadoCategoriasComponent,
    CrearEditarCategoria,
    PreviaEntradaComponent,
  ],
})
export class BaseModule {}

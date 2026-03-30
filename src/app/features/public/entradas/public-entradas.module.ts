import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListadoEntradasPublicComponent } from './containers/listado-entradas-public/listado-entradas-public.component';
import { DetalleEntradaPublicComponent } from './containers/detalle-entrada-public/detalle-entrada-public.component';
import { SharedOPModule } from '@app/shared/shared.module';
import { SharedCoreUiModule } from '@app/shared/shared-coreui.module';
import { SharedSearchModule } from '@shared/search/search.module';
import { PublicBookmarksService } from './services/public-bookmarks.service';
import { PublicVotesService } from './services/public-votes.service';
import { PublicHistoryService } from './services/public-history.service';
import { ComentariosPublicComponent } from '../comentarios/components/comentarios-public.component';

const routes: Routes = [
  { path: '', component: ListadoEntradasPublicComponent },
  { path: ':slug', component: DetalleEntradaPublicComponent },
];

@NgModule({
  declarations: [
    ListadoEntradasPublicComponent
  ],
  imports: [
    CommonModule, 
    RouterModule.forChild(routes), 
    SharedOPModule, 
    SharedCoreUiModule, 
    SharedSearchModule,
    ComentariosPublicComponent,
    DetalleEntradaPublicComponent
  ],
  providers: [
    PublicBookmarksService,
    PublicVotesService,
    PublicHistoryService
  ]
})
export class PublicEntradasModule {}

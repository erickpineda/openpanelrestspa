import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from 'src/app/shared/shared.module';
import { MediaSharedModule } from './media-shared.module';
import { ContenidoFeatureRoutingModule } from './contenido-routing.module';
import { ArchivosComponent } from './archivos/archivos.component';
import { SharedCoreUiModule } from 'src/app/shared/shared-coreui.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedOPModule,
    MediaSharedModule,
    SharedCoreUiModule,
    ContenidoFeatureRoutingModule,
  ],
  declarations: [ArchivosComponent],
})
export class ContenidoFeatureModule {}

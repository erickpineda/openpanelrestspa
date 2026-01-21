import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedOPModule } from '../../../shared/shared.module';
import { SharedWidgetsModule } from '../../../shared/shared-widgets.module';
import { ImagenesComponent } from './imagenes/imagenes.component';

@NgModule({
  declarations: [ImagenesComponent],
  imports: [CommonModule, FormsModule, SharedOPModule, SharedWidgetsModule],
  exports: [ImagenesComponent],
})
export class MediaSharedModule {}

import { NgModule } from '@angular/core';
import { EntradasSharedModule as OriginalEntradasSharedModule } from '@app/admin/base/entradas/entradas-shared.module';

@NgModule({
  imports: [OriginalEntradasSharedModule],
  exports: [OriginalEntradasSharedModule],
})
export class EntradasSharedModule {}

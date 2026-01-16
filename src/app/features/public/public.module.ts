import { NgModule } from '@angular/core';
import { PublicModule as OriginalPublicModule } from '@app/public/public.module';

@NgModule({
  imports: [OriginalPublicModule],
})
export class PublicFeatureModule {}

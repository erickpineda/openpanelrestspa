import { NgModule } from '@angular/core';
import { AdminModule as OriginalAdminModule } from '@app/admin/admin.module';

@NgModule({
  imports: [OriginalAdminModule],
})
export class AdminFeatureModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionRoutingModule } from './gestion-routing.module';
import { UsuariosListComponent } from './usuarios/usuarios-list.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';
import { SharedOPModule } from '../../../shared/shared.module';
import { CardModule, ModalModule, SpinnerModule, BadgeModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

@NgModule({
  declarations: [UsuariosListComponent, MiPerfilComponent, ChangePasswordComponent],
  imports: [
    CommonModule,
    GestionRoutingModule, 
    SharedOPModule,
    CardModule,
    IconModule,
    ModalModule,
    SpinnerModule,
    FormsModule,
    BadgeModule
  ]
})
export class GestionModule {}

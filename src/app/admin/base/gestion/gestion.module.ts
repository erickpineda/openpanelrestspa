import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionRoutingModule } from './gestion-routing.module';
import { UsuariosListComponent } from './usuarios/usuarios-list.component';
import { RolesListComponent } from './roles/roles-list.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';
import { SharedOPModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [UsuariosListComponent, RolesListComponent, MiPerfilComponent, ChangePasswordComponent],
  imports: [
    CommonModule,
    GestionRoutingModule, 
    SharedOPModule,
  ]
})
export class GestionModule {}

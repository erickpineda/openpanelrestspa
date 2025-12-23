import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionRoutingModule } from './gestion-routing.module';
import { UsuariosListComponent } from './usuarios/listado-usuarios.component';
import { RolesListComponent } from './roles/listado-roles.component';
import { PrivilegiosListComponent } from './privilegios/listado-privilegios.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';
import { SharedOPModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [
    UsuariosListComponent,
    RolesListComponent,
    PrivilegiosListComponent,
    MiPerfilComponent,
    ChangePasswordComponent,
  ],
  imports: [CommonModule, GestionRoutingModule, SharedOPModule],
})
export class GestionModule {}

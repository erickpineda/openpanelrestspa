import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios/listado-usuarios.component';
import { RolesListComponent } from './roles/listado-roles.component';
import { PrivilegiosListComponent } from './privilegios/listado-privilegios.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';

const routes: Routes = [
  { path: 'usuarios', component: UsuariosListComponent },
  { path: 'roles', component: RolesListComponent },
  { path: 'privilegios', component: PrivilegiosListComponent },
  { path: 'miperfil', component: MiPerfilComponent },
  { path: 'changepassword', component: ChangePasswordComponent },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestionRoutingModule {}

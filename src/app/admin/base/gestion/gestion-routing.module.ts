import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios/listado-usuarios.component';
import { RolesListComponent } from './roles/listado-roles.component';
import { PrivilegiosListComponent } from './privilegios/listado-privilegios.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';

const routes: Routes = [
  { path: 'usuarios', component: UsuariosListComponent, data: { title: 'MENU.USERS' } },
  { path: 'roles', component: RolesListComponent, data: { title: 'MENU.ROLES' } },
  { path: 'privilegios', component: PrivilegiosListComponent, data: { title: 'MENU.PRIVILEGES' } },
  { path: 'miperfil', component: MiPerfilComponent, data: { title: 'MENU.MY_PROFILE' } },
  { path: 'changepassword', component: ChangePasswordComponent, data: { title: 'MENU.CHANGE_PASSWORD' } },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestionRoutingModule {}

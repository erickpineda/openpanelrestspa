import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios/usuarios-list.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';

const routes: Routes = [
  { path: 'usuarios', component: UsuariosListComponent },
  { path: 'miperfil', component: MiPerfilComponent },
  { path: 'changepassword', component: ChangePasswordComponent },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionRoutingModule {}

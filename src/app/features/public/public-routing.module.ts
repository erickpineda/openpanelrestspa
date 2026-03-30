import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/containers/about.component';
import { ContactComponent } from './contact/containers/contact.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterPublicComponent } from './auth/containers/register-public/register-public.component';
import { PerfilPublicComponent } from './auth/containers/perfil-public/perfil-public.component';
import { ForgotPasswordPublicComponent } from './auth/containers/forgot-password-public/forgot-password-public.component';
import { PublicAuthGuard } from './auth/services/public-auth.guard';
import { NoAuthGuard } from './auth/services/no-auth.guard';
import { PublicComponent } from './public.component';
import { SessionExpiredComponent } from '../../core/features/session-expired.component';

const routes: Routes = [
  {
    path: '',
    component: PublicComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
      { path: 'recuperar', component: ForgotPasswordPublicComponent, canActivate: [NoAuthGuard] },
      { path: 'registro', component: RegisterPublicComponent, canActivate: [NoAuthGuard] },
      { path: 'perfil', redirectTo: 'mi-espacio', pathMatch: 'full' },
      { path: 'guardados', redirectTo: 'mi-espacio', pathMatch: 'full' },
      { path: 'mi-espacio', component: PerfilPublicComponent, canActivate: [PublicAuthGuard] },
      { path: 'session-expired', component: SessionExpiredComponent },
      {
        path: 'entradas',
        loadChildren: () =>
          import('./entradas/public-entradas.module').then((m) => m.PublicEntradasModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}

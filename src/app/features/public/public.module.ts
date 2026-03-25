import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';
import { AboutComponent } from './about/containers/about.component';
import { ContactComponent } from './contact/containers/contact.component';
import { FooterPublicComponent } from './footer-public/footer-public.component';
import { HeaderPublicComponent } from './header-public/header-public.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterPublicComponent } from './auth/containers/register-public/register-public.component';
import { PerfilPublicComponent } from './auth/containers/perfil-public/perfil-public.component';
import { ForgotPasswordPublicComponent } from './auth/containers/forgot-password-public/forgot-password-public.component';
import { NavBarPublicComponent } from './nav-bar-public/nav-bar-public.component';
import { IconModule } from '@coreui/icons-angular';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { CoreModule } from '@app/core/core.module';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { NavbarModule, CollapseModule, NavModule, ButtonModule, GridModule, CardModule, FormModule, AlertModule, SpinnerModule } from '@coreui/angular';

@NgModule({
  declarations: [
    PublicComponent,
    HomeComponent,
    LoginComponent,
    RegisterPublicComponent,
    ForgotPasswordPublicComponent,
    PerfilPublicComponent,
    HeaderPublicComponent,
    FooterPublicComponent,
    AboutComponent,
    NavBarPublicComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PublicRoutingModule,
    CoreModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    IconModule,
    NavbarModule,
    CollapseModule,
    NavModule,
    ButtonModule,
    GridModule,
    CardModule,
    FormModule,
    AlertModule,
    SpinnerModule,
    ContactComponent,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class PublicFeatureModule {}

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
import { NavBarPublicComponent } from './nav-bar-public/nav-bar-public.component';
import { IconModule } from '@coreui/icons-angular';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { CoreModule } from '@app/core/core.module';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

@NgModule({
  declarations: [
    PublicComponent,
    HomeComponent,
    LoginComponent,
    HeaderPublicComponent,
    FooterPublicComponent,
    AboutComponent,
    ContactComponent,
    NavBarPublicComponent,
  ],
  imports: [
    RouterModule,
    PublicRoutingModule,
    CoreModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    IconModule,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class PublicFeatureModule {}

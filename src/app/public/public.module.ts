import { NgModule } from '@angular/core';

import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';

// Componentes específicos de Public
import { AboutComponent } from './about/containers/about.component';
import { ContactComponent } from './contact/containers/contact.component';
import { FooterPublicComponent } from './footer-public/footer-public.component';
import { HeaderPublicComponent } from './header-public/header-public.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { NavBarPublicComponent } from './nav-bar-public/nav-bar-public.component';

// Módulos externos
import { IconModule } from '@coreui/icons-angular';
import { SharedOPModule } from '../shared/shared.module';
import { SharedCoreUiModule } from '../shared/shared-coreui.module';
import { CoreModule } from '../core/core.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    HttpClientModule,
    PublicRoutingModule,

    CoreModule,
    // ✅ Shared Module
    SharedOPModule,
    SharedCoreUiModule,

    // Módulos específicos de Public
    IconModule,
  ],
  declarations: [
    // ✅ Solo componentes específicos de Public
    PublicComponent,
    HomeComponent,
    LoginComponent,
    HeaderPublicComponent,
    FooterPublicComponent,
    AboutComponent,
    ContactComponent,
    NavBarPublicComponent,
  ],
})
export class PublicModule {}

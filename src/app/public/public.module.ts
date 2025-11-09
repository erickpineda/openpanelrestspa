import { NgModule } from "@angular/core";
import { authInterceptorProviders } from "../core/interceptor/auth.interceptor";
import { AuthService } from "../core/services/auth.service";
import { PublicService } from "../core/services/public.service";
import { TokenStorageService } from "../core/services/token-storage.service";
import { UsuarioService } from "../core/services/usuario.service";
import { SharedOPModule } from "../shared/shared.module";
import { AboutComponent } from "./about/containers/about.component";
import { ContactComponent } from "./contact/containers/contact.component";
import { FooterPublicComponent } from "./footer-public/footer-public.component";
import { HeaderPublicComponent } from "./header-public/header-public.component";
import { HomeComponent } from "./home/home.component";
import { LoginComponent } from "./login/login.component";
import { NavBarPublicComponent } from "./nav-bar-public/nav-bar-public.component";
import { PublicRoutingModule } from "./public-routing.module";
import { PublicComponent } from "./public.component";

import { IconModule } from '@coreui/icons-angular';

import {
    AlertModule,
    AvatarModule,
    BadgeModule,
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    FooterModule,
    FormModule,
    GridModule,
    HeaderModule,
    ListGroupModule,
    NavbarModule,
    NavModule,
    PaginationModule,
    ProgressModule,
    SidebarModule,
    SpinnerModule,
    TabsModule,
    UtilitiesModule,
} from '@coreui/angular';
import { EntradaService } from "../core/services/entrada.service";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NetworkInterceptor } from "../core/interceptor/network.interceptor";
import { DatePipe } from "@angular/common";

@NgModule({
    imports: [
        HttpClientModule,
        PublicRoutingModule,
        SharedOPModule,
        AlertModule,
        AvatarModule,
        BadgeModule,
        BreadcrumbModule,
        ButtonGroupModule,
        ButtonModule,
        CardModule,
        DropdownModule,
        FooterModule,
        FormModule,
        GridModule,
        HeaderModule,
        IconModule,
        ListGroupModule,
        NavModule,
        NavbarModule,
        ProgressModule,
        SidebarModule,
        SpinnerModule,
        TabsModule,
        UtilitiesModule,
        PaginationModule
    ],
    declarations: [
        PublicComponent,
        HomeComponent,
        LoginComponent,
        HeaderPublicComponent,
        FooterPublicComponent,
        AboutComponent,
        ContactComponent,
        NavBarPublicComponent
    ],
    exports: [],
    providers: [
        PublicService,
        AuthService,
        TokenStorageService,
        UsuarioService,
        EntradaService,
        authInterceptorProviders,
        { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
        DatePipe
    ]
})

export class PublicModule {
    constructor() { }
}


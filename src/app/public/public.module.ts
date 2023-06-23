/*import { NgModule } from "@angular/core";
import { authInterceptorProviders } from "../core/interceptor/auth.interceptor";
import { AuthService } from "../core/services/auth.service";
import { PublicService } from "../core/services/public.service";
import { TokenStorageService } from "../core/services/token-storage.service";
import { UserService } from "../core/services/user.service";
import { SharedModule } from "../core/shared/shared.module";
import { AboutComponent } from "./about/containers/about.component";
import { ContactComponent } from "./contact/containers/contact.component";
import { FooterPublicComponent } from "./footer-public/containers/footer-public.component";
import { HeaderPublicComponent } from "./header-public/containers/header-public.component";
import { HomeComponent } from "./home/containers/home.component";
import { LoginComponent } from "./login/containers/login.component";
import { NavBarPublicComponent } from "./nav-bar-public/containers/nav-bar-public.component";
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
    NavModule,
    ProgressModule,
    SidebarModule,
    TabsModule,
    UtilitiesModule,
  } from '@coreui/angular';
import { EntradaService } from "../core/services/entrada.service";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ErrorIntercept } from "../core/interceptor/error.interceptor";

@NgModule({
    imports: [
        HttpClientModule,
        PublicRoutingModule,
        SharedModule,
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
    ProgressModule,
    SidebarModule,
    TabsModule,
    UtilitiesModule,
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
        UserService,
        EntradaService,
        authInterceptorProviders,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorIntercept,
            multi: true
          }
    ]
})

export class PublicModule {
    constructor() {}
}*/

import { NgModule } from "@angular/core";
import { authInterceptorProviders } from "../core/interceptor/auth.interceptor";
import { AuthService } from "../core/services/auth.service";
import { PublicService } from "../core/services/public.service";
import { TokenStorageService } from "../core/services/token-storage.service";
import { UserService } from "../core/services/user.service";
import { SharedOPModule } from "../shared/shared.module";
import { AboutComponent } from "./about/containers/about.component";
import { ContactComponent } from "./contact/containers/contact.component";
import { FooterPublicComponent } from "./footer-public/containers/footer-public.component";
import { HeaderPublicComponent } from "./header-public/containers/header-public.component";
import { HomeComponent } from "./home/containers/home.component";
import { LoginComponent } from "./login/containers/login.component";
import { NavBarPublicComponent } from "./nav-bar-public/containers/nav-bar-public.component";
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
    NavModule,
    ProgressModule,
    SidebarModule,
    SpinnerModule,
    TabsModule,
    UtilitiesModule,
  } from '@coreui/angular';
import { EntradaService } from "../core/services/entrada.service";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NetworkInterceptor } from "../core/interceptor/network.interceptor";

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
    ProgressModule,
    SidebarModule,
    SpinnerModule,
    TabsModule,
    UtilitiesModule,
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
        UserService,
        EntradaService,
        authInterceptorProviders,
        { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
        
    ]
})

export class PublicModule {
    constructor() {}
}


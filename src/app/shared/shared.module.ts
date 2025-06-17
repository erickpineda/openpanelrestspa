import { ErrorHandler, NgModule } from "@angular/core";

import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, ModalModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, SpinnerModule, TableModule, TabsModule, ToastModule, UtilitiesModule } from '@coreui/angular';

import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from "@angular/router";

import { FormsModule } from "@angular/forms";
import { CommonModule, DatePipe } from "@angular/common";
import { NotFoundComponent } from "../core/errors/not-found/not-found.component";
import { BuscadorAvanzadoComponent } from "./components/buscador-avanzado/buscador-avanzado.component";

@NgModule({
    imports: [
        HttpClientModule,
        RouterModule,
        CommonModule,
        
        FormsModule,
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
        ModalModule,
        NavModule,
        PaginationModule, 
        ProgressModule, 
        SharedModule, 
        SidebarModule, 
        SpinnerModule, 
        TableModule, 
        TabsModule, 
        ToastModule, 
        UtilitiesModule
    ],
    declarations: [
        NotFoundComponent,
        BuscadorAvanzadoComponent
    ],
    exports: [
        HttpClientModule,
        RouterModule,
        CommonModule,
        NotFoundComponent,
        FormsModule,
        BuscadorAvanzadoComponent
    ],
    providers: [
    ]
})

export class SharedOPModule {
    constructor() { }
}

import { NgModule } from "@angular/core";
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from "./about/containers/about.component";
import { ContactComponent } from "./contact/containers/contact.component";
import { HomeComponent } from "./home/containers/home.component";
import { LoginComponent } from "./login/containers/login.component";
import { PublicComponent } from "./public.component";

const routes: Routes = [
    {
        path: '', component: PublicComponent, children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomeComponent },
            { path: 'about', component: AboutComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'login', component: LoginComponent }
        ]
    }
];


@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})

export class PublicRoutingModule {
    constructor() { }
}

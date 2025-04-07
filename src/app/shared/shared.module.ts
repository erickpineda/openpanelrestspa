import { ErrorHandler, NgModule } from "@angular/core";

import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from "@angular/router";

import { FormsModule } from "@angular/forms";
import { CommonModule, DatePipe } from "@angular/common";
import { NotFoundComponent } from "../core/errors/not-found/not-found.component";

@NgModule({
    imports: [
        HttpClientModule,
        RouterModule,
        CommonModule,
        FormsModule,
    ],
    declarations: [
        NotFoundComponent
    ],
    exports: [
        HttpClientModule,
        RouterModule,
        CommonModule,
        NotFoundComponent,
        FormsModule
    ],
    providers: [
    ]
})

export class SharedOPModule {
    constructor() { }
}

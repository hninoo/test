import {NgModule} from '@angular/core';

import {p404Component} from './404.component';
import {p500Component} from './500.component';
import {RegisterComponent} from './register.component';

import {PagesRoutingModule} from './pages-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
    imports: [PagesRoutingModule, FormsModule, ReactiveFormsModule],
    declarations: [
        p404Component,
        p500Component,
        RegisterComponent,
    ]
})
export class PagesModule {
}

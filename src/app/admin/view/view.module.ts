import {NgModule, PipeTransform, Pipe} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser'
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';
import {ModalModule} from 'ngx-bootstrap/modal';

import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';

import {ViewComponent} from './view.component';
import {ViewRoutingModule} from './view-routing.module';
import {Nl2BrPipeModule} from 'nl2br-pipe';

import { MatChipsModule } from '@angular/material/chips';
import {FormsModule} from '@angular/forms';
import {LaddaModule} from 'angular2-ladda';
import {AdminModule} from '../admin.module';
import {AdminSharedModule} from '../admin-shared.module';

@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitized: DomSanitizer) {
    }

    transform(value) {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }
}

@NgModule({
    imports: [
        Nl2BrPipeModule,
        CommonModule,
        FroalaEditorModule,
        FroalaViewModule,
        ToastrModule,
        ViewRoutingModule,
        ModalModule,
        FormsModule,
        LaddaModule,
        AdminModule,
        AdminSharedModule
    ],
    declarations: [
        ViewComponent,
        SafeHtmlPipe
    ]
})
export class ViewModule {
}

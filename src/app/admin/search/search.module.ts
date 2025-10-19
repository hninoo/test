import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser'
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {ModalModule} from 'ngx-bootstrap/modal';
import {LaddaModule} from 'angular2-ladda';
import {ToastrModule} from 'ngx-toastr';
import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';

import {OWL_DATE_TIME_LOCALE, OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';

import {SearchComponent} from './search.component';
import {SearchRoutingModule} from './search-routing.module';
import {NgSelectModule} from '@ng-select/ng-select';
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
    providers: [
        {provide: OWL_DATE_TIME_LOCALE, useValue: 'ja'},
    ],
    imports: [
        CommonModule,
        FormsModule,
        ModalModule,
        LaddaModule,
        ToastrModule,
        FroalaEditorModule,
        FroalaViewModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,

        SearchRoutingModule,
        NgSelectModule,
        AdminSharedModule
    ],
    declarations: [
        SearchComponent,
        SafeHtmlPipe
    ]
})
export class SearchModule {
}

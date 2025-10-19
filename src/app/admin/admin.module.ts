import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import {ModalModule} from 'ngx-bootstrap/modal';
import {ToastrModule} from 'ngx-toastr';
import {LaddaModule} from 'angular2-ladda';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {AdminRoutingModule} from './admin-routing.module';
import {DomSanitizer} from '@angular/platform-browser';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';
import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';
import {NgSelectModule} from '@ng-select/ng-select';
import {BsDropdownModule} from 'ngx-bootstrap';
import {AdminSharedModule} from './admin-shared.module';
import {PublicFormService} from '../services/public-form-service';



@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitized: DomSanitizer) {
    }

    transform(value) {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }
}

@Pipe({name: 'keys', pure: false})
export class KeysPipe implements PipeTransform {
    transform(value: any, args: any[] = null): any {
        return Object.keys(value)// .map(key => value[key]);
    }
}


@NgModule({
    imports: [
        CommonModule,
        ModalModule,
        DragDropModule,
        ToastrModule,
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        LaddaModule.forRoot({
            style: 'slide-up',
            spinnerSize: 25,
            spinnerColor: '#fff',
            spinnerLines: 12
        }),

        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        AdminRoutingModule,
        FroalaEditorModule,
        FroalaViewModule,
        NgSelectModule,
        AdminSharedModule,
        BsDropdownModule,
        PublicFormService
    ],
    exports: [
    ],
    declarations: [
        KeysPipe,
        SafeHtmlPipe,
    ]
})
export class AdminModule {
}

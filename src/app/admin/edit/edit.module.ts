import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser'
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';

import {ModalModule} from 'ngx-bootstrap/modal';
import {LaddaModule} from 'angular2-ladda';
import {ToastrModule} from 'ngx-toastr';
import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';
import {NgxFileDropModule} from 'ngx-file-drop';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

// import {DateTimePickerModule} from 'ng-pick-datetime';
import {OWL_DATE_TIME_LOCALE, OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';

import {EditRoutingModule} from './edit-routing.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {AdminSharedModule} from '../admin-shared.module';
import {MentionModule} from 'kl-angular-mentions';


@NgModule({
    providers: [
        {provide: OWL_DATE_TIME_LOCALE, useValue: 'ja'},
    ],
    imports: [
        CommonModule,
        FormsModule, ReactiveFormsModule,
        ModalModule,
        LaddaModule,
        ToastrModule,
        FroalaEditorModule,
        FroalaViewModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatChipsModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        NgxFileDropModule,
        MentionModule,
        EditRoutingModule,
        NgSelectModule,
        NgbModule,
        DragDropModule,
        AdminSharedModule
    ],
    exports: [
    ],
    declarations: [

    ]
})
export class EditModule {
}

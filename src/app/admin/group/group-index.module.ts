import {NgModule, PipeTransform, Pipe} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser'
import {CommonModule} from '@angular/common';

import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';

import {GroupIndexComponent} from './group-index.component';
import {GroupRoutingModule} from './group-routing.module';
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
        AdminSharedModule,
        CommonModule,
        FroalaEditorModule,
        FroalaViewModule,

        GroupRoutingModule
    ],
    declarations: [
        GroupIndexComponent,
        SafeHtmlPipe
    ]
})
export class GroupIndexModule {
}

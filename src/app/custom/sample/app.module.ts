import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ModalModule} from 'ngx-bootstrap/modal';
import {LaddaModule} from 'angular2-ladda';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {RoutingModule} from './routing.module';
import {DomSanitizer} from '@angular/platform-browser';

//pages
import {ReportComponent} from './report.component';


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
        NgbModule,
        LaddaModule.forRoot({
            style: 'slide-up',
            spinnerSize: 25,
            spinnerColor: '#20a8d8',
            spinnerLines: 12
        }),
        RoutingModule
    ],
    declarations: [KeysPipe, SafeHtmlPipe, ReportComponent]
})
export class AppModule {
}

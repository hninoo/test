import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ChartsModule} from 'ng2-charts';
import {ModalModule} from 'ngx-bootstrap/modal';

import {DashboardComponent} from './dashboard.component';
import { DashboardChartComponent } from 'app/charts/dashboard-chart.component';
import {DashboardRoutingModule} from './dashboard-routing.module';
import {ChartsComponent} from '../charts/charts.component';
import {ToastrModule} from 'ngx-toastr';
import {FileStorageComponent} from '../admin/view/file-storage.component';
import {CloudChartsModule} from '../charts/cloud-charts-module'
import {AdminSharedModule} from '../admin/admin-shared.module';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';
import {AdminModule} from '../admin/admin.module';
import {BsDropdownModule, TabsModule} from 'ngx-bootstrap';
import {NgbNavModule} from '@ng-bootstrap/ng-bootstrap';
import {LaddaModule} from 'angular2-ladda';

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
        FormsModule,
        DashboardRoutingModule,
        ChartsModule,
        ModalModule,
        ToastrModule,
        CloudChartsModule,
        CollapseModule.forRoot(),
        FroalaEditorModule,
        FroalaViewModule,
        AdminModule,
        DragDropModule,
        TabsModule,
        NgbNavModule,
        BsDropdownModule,
        LaddaModule
    ],
    declarations: [
        DashboardComponent,
        ChartsComponent,
        SafeHtmlPipe,
        FileStorageComponent,
        DashboardChartComponent,
    ]
})
export class DashboardModule {
}

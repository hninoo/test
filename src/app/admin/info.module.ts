import {NgModule} from '@angular/core';

import {StorageChartsComponent} from '../charts/storage-charts/storage-charts.component';
import {InfoComponent} from './info.component';
import {InfoRoutingModule} from './info-routing.module';
import {UserChartsComponent} from '../charts/user-charts/user-charts.component';
import {LoginUserChartsComponent} from '../charts/login-user-charts/login-user-charts.component';
import {TableNumChartsComponent} from '../charts/table-num-charts/table-num-charts.component';
import { ApiLogChartsComponent } from 'app/charts/api-log-charts/api-log-charts.component';
import {NotificationCountChartsComponent} from '../charts/notification-count-charts/notification-count-charts.component';
import {CommonModule} from '@angular/common';

@NgModule({
    imports: [
        InfoRoutingModule,
        CommonModule
    ],
    declarations: [
        StorageChartsComponent,
        UserChartsComponent,
        LoginUserChartsComponent,
        InfoComponent,
        TableNumChartsComponent,
        ApiLogChartsComponent,
        NotificationCountChartsComponent
    ]
})
export class InfoModule {
}

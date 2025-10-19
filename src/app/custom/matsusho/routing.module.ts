import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ReportComponent} from './report.component';
import {Report2Component} from './report2.component';

const routes: Routes = [
    {
        path: 'report',
        component: ReportComponent
    },

    {
        path: 'report2',
        component: Report2Component
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RoutingModule {
}

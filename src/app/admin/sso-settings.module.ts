import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';
import {SsoSettingsComponent} from './components/sso-settings.component';
import {AdminSharedModule} from './admin-shared.module';

const routes: Routes = [
    {
        path: '',
        component: SsoSettingsComponent
    }
];

@NgModule({
    declarations: [
        SsoSettingsComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        AdminSharedModule,
        RouterModule.forChild(routes)
    ],
    exports: [
        SsoSettingsComponent
    ]
})
export class SsoSettingsModule {
}

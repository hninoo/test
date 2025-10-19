import {NgModule, Pipe, PipeTransform} from '@angular/core';
import {BrowserModule, DomSanitizer} from '@angular/platform-browser'
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LocationStrategy, PathLocationStrategy} from '@angular/common';
// import {DragDropModule} from '@angular/cdk/drag-drop';

import {AppComponent} from './app.component';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {NAV_DROPDOWN_DIRECTIVES} from './shared/nav-dropdown.directive';

import {ChartsModule} from 'ng2-charts';

import {SIDEBAR_TOGGLE_DIRECTIVES} from './shared/sidebar.directive';
import {AsideToggleDirective} from './shared/aside.directive';
import {BreadcrumbsComponent} from './shared/breadcrumb.component';

import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';

import {AppAsideComponent} from './components/app-aside/app-aside.component';
import {NavMenusComponent} from './components/nav-menus/nav-menus.component';

// Routing Module
import {AppRoutingModule} from './app.routing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// Layouts
import {FullLayoutComponent} from './layouts/full-layout.component';
import {SimpleLayoutComponent} from './layouts/simple-layout.component';

// iframe
import {IframeFormComponent} from './layouts/iframe-form.component';

// pages
import {LoginComponent} from './components/login.component';
import {LoginBaseComponent} from './components/login-base.component';
import {ResetComponent} from './reset/reset.component';

// modules
import {ModalModule} from 'ngx-bootstrap/modal';
import { ToastrModule } from 'ngx-toastr';

import {LaddaModule} from 'angular2-ladda';
import {LightboxModule} from 'ngx-lightbox';

// charts
// HttpClientModuleをインポート
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {Connect} from './services/connect';
import {User} from './services/user';
import {SharedService} from './services/shared';
import {CL} from './services/check-license';
import {HttpApiInterceptor} from './services/http-api-intercepter';
import {CanDeactivateGuard} from './shared/guards/can-deactivate-guard.service';
import {FormFieldFileDeleteModalComponent} from './admin/edit/forms-field.component';
import {TwoFactorComponent} from './two-factor/two-factor.component';
import {CommentLogBlockComponent} from './components/app-aside/comment-log-block.component';
import {UpdateLogBlockComponent} from './components/app-aside/update-log-block.component';
import {EditModule} from './admin/edit/edit.module';

// comment mentions
import {MentionModule} from 'kl-angular-mentions';
import { SortingService } from './services/utils/sorting-service';
import { GroupService } from './services/utils/group-service';
import { OrientationChangeService } from './services/utils/orientation-handler-service';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {AdminModule} from './admin/admin.module';
import { DynamicOverFlowService } from './services/utils/dynamic-overflow';
import {PaymentPageComponent} from './payment-page/payment-page.component';
import {CreateClientComponent} from './manage/create-client.component';
import {UpdateClientComponent} from './manage/update-client.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {AdminSharedModule} from './admin/admin-shared.module';
import {FlowComponent} from './flow/flow.component';
import {TriggerBlockComponent} from './flow/trigger-block/trigger-block.component';
import {TriggerEditModalComponent} from './flow/trigger-edit-modal/trigger-edit-modal.component';
import {EmailNotiEditModalComponent} from './flow/email-noti-edit-modal/email-noti-edit-modal.component';
import {EmailNotiBlockComponent} from './flow/email-noti-block/email-noti-block.component';
import {CopyBlockComponent} from './flow/copy-block/copy-block.component';
import {FilterBlockComponent} from './flow/filter-block/filter-block.component';
import {FilterBlockEditModalComponent} from './flow/filter-block-edit-modal/filter-block-edit-modal.component';
import {CopyBlockEditModalComponent} from './flow/copy-block-edit-modal/copy-block-edit-modal.component';
import {ApicallEditModalComponent} from './flow/apicall-edit-modal/apicall-edit-modal.component';
import {ApicallBlockComponent} from './flow/apicall-block/apicall-block.component';
import {SleepBlockComponent} from './flow/sleep-block/sleep-block.component';
import {SleepEditModalComponent} from './flow/sleep-edit-modal/sleep-edit-modal.component';
import {BlockBaseComponent} from './flow/block-base/block-base.component';
import {BlockModalBaseComponent} from './flow/block-modal-base/block-modal-base.component';
import {UpdateBlockComponent} from './flow/update-block/update-block.component';
import {UpdateEditModalComponent} from './flow/update-edit-modal/update-edit-modal.component';
import {CreateBlockComponent} from './flow/create-block/create-block.component';
import {CreateEditModalComponent} from './flow/create-edit-modal/create-edit-modal.component';
import {DeleteBlockComponent} from './flow/delete-block/delete-block.component';
import {DeleteEditModalComponent} from './flow/delete-edit-modal/delete-edit-modal.component';
import {SlackNotiBlockComponent} from './flow/slack-noti-block/slack-noti-block.component';
import {SlackNotiEditModalComponent} from './flow/slack-noti-edit-modal/slack-noti-edit-modal.component';
import {CopyOtherTableBlockComponent} from './flow/copy-other-table-block/copy-other-table-block.component';
import {CopyOtherTableBlockEditModalComponent} from './flow/copy-other-table-block-edit-modal/copy-other-table-block-edit-modal.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {MaintenanceComponent} from './maintenance/maintenance.component';
import {CertComponent} from './maintenance/cert.component';
import {ProgressBarComponent} from './admin/progress-bar.component';

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
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        BsDropdownModule.forRoot(),
        TabsModule.forRoot(),
        ChartsModule,
        ModalModule,
        ToastrModule.forRoot(),
        // DragDropModule,

        // add
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        LaddaModule,
        EditModule,
        MentionModule,
        LightboxModule,
        AdminModule,
        MatCheckboxModule,
        MatAutocompleteModule,
        AdminSharedModule,
        NgSelectModule,
        DragDropModule
    ],
    declarations: [
        AppComponent,
        FullLayoutComponent,
        SimpleLayoutComponent,
        IframeFormComponent,
        NAV_DROPDOWN_DIRECTIVES,
        BreadcrumbsComponent,
        SIDEBAR_TOGGLE_DIRECTIVES,
        AsideToggleDirective,
        SafeHtmlPipe,


        // add
        LoginComponent,
        LoginBaseComponent,
        FormFieldFileDeleteModalComponent,
        AppAsideComponent,
        TwoFactorComponent,
        CommentLogBlockComponent,
        UpdateLogBlockComponent,
        ResetComponent,
        PaymentPageComponent,
        CreateClientComponent,
        UpdateClientComponent,
        NavMenusComponent,
        FlowComponent,
        TriggerBlockComponent,
        TriggerEditModalComponent,
        EmailNotiEditModalComponent,
        EmailNotiBlockComponent,
        CopyBlockComponent,
        FilterBlockComponent,
        FilterBlockEditModalComponent,
        CopyBlockEditModalComponent,
        ApicallEditModalComponent,
        ApicallBlockComponent,
        SleepBlockComponent,
        SleepEditModalComponent,
        BlockBaseComponent,
        BlockModalBaseComponent,
        UpdateBlockComponent,
        UpdateEditModalComponent,
        CreateBlockComponent,
        CreateEditModalComponent,
        DeleteBlockComponent,
        DeleteEditModalComponent,
        SlackNotiBlockComponent,
        SlackNotiEditModalComponent,
        CopyOtherTableBlockComponent,
        CopyOtherTableBlockEditModalComponent,
        MaintenanceComponent,
        CertComponent,
        ProgressBarComponent
    ],
    entryComponents: [
        FormFieldFileDeleteModalComponent
    ],
    providers: [{
        provide: LocationStrategy,
        useClass: PathLocationStrategy
    }, Connect, User, SharedService, CL, SortingService, GroupService, OrientationChangeService, DynamicOverFlowService, {
        provide: HTTP_INTERCEPTORS,
        useClass: HttpApiInterceptor,
        // 必須：HTTP_INTERCEPTORSが配列であることを示す
        multi: true
    },
        CanDeactivateGuard

    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}

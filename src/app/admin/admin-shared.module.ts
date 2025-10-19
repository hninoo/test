import {NgModule, Pipe, PipeTransform, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbModule, NgbTooltipModule, NgbModalModule, NgbCollapseModule} from '@ng-bootstrap/ng-bootstrap';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {ConditionModalComponent} from './edit/grant/condition-modal.component';
import {ConditionsFormComponent} from './edit/field/conditions-form.component';
import {ConditionFormComponent} from './edit/field/condition-form.component';
import {Nl2BrPipeModule} from 'nl2br-pipe';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';
import {NgSelectModule} from '@ng-select/ng-select';
import {SearchFieldComponent} from './edit/field/search-field.component';
import {UserFieldComponent} from './edit/field/user-field.component';
import {DivisionFieldComponent} from './edit/field/division-field.component';
import {WorkflowSettingComponent} from './workflow/workflow-setting.component';
import {WorkflowModalComponent} from './edit/workflow-modal.component';
import {FieldSelectDragdropComponent} from '../components/field-select/field-select-dragdrop.component';
import {FieldSelectComponent} from './field-select/field-select.component';
import {PositionFieldComponent} from './edit/field/position-field.component';
import {IndexWorkflowModalComponent} from '../components/modal/index-workflow-modal.component';
import {EditAllModalComponent} from './edit/edit-all-modal.component';
import {DynamicDataViewComponent} from './dynamic-data-view.component';
import {MemoComponent} from '../components/memo/memo.component';
import {GoogleMapComponent} from '../components/google-map/google-map.component';
import {GoogleFilterPulldownComponent} from '../components/google-map/google-filter-pulldown.component';
import {GoogleMapViewComponent} from '../components/google-map/google-map-view.component';
import {FroalaEditorModule, FroalaViewModule} from 'angular-froala-wysiwyg';
import {CustomFilterPulldownComponent} from './custom-filter-pulldown';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule, TabsModule} from 'ngx-bootstrap';
import {LaddaModule} from 'angular2-ladda';
import {NgImageFullscreenViewModule} from 'ng-image-fullscreen-view';
import {SelectFieldComponent} from '../components/select-field/select-field.component';
import {SelectFieldAndValueComponent} from '../components/select-field-and-value/select-field-and-value.component';
import {SortParamsFormComponent} from '../components/custom-form/sort-params-form.component';
import {DebugModeOnDirective} from 'app/debug-mode-on.directive';
import {ConfirmModalComponent} from '../components/modal/confirm-modal.component';
import {ChatgptModalComponent} from '../components/modal/chatgpt-modal.component';
import {AnalyticsModalComponent} from '../components/modal/analytics-modal.component';
import {GrantGroupFormComponent} from '../components/custom-form/grant-group-form.component';
import {DirectoryTreeComponent} from '../components/directory-tree/directory-tree.component';
import {BreadcrumbsComponent} from '../components/breadcrumbs/breadcrumbs.component';
import {EditComponent} from './edit/edit.component';
import {CommentModalComponent} from './edit/comment-modal.component';
import {FormsComponent} from './edit/forms.component';
import { ChildFormsComponent } from './edit/child-forms.component';
import {FormsFieldComponent} from './edit/forms-field.component';
import {FormsImageComponent} from './edit/forms-image.component';
import {DatasetFormComponent} from './edit/dataset-form.component';
import {DatasetFieldOneComponent} from './edit/dataset-field-one.component';
import {LookupModalComponent} from './edit/lookup-modal.component';
import {ChatBotComponent} from '../components/chat-bot/chat-bot.component';
// NgbCollapseModule is already imported at the top
import {GrantComponent} from './edit/grant/grant.component';
import {InputNumberDirective} from '../shared/InputNumberDirective';
import {DoubleScrollbarDirective} from '../directive/double-scrollbar.directive';
import {DomSanitizer} from '@angular/platform-browser';
import {ModuleDragAndDropDirective} from 'app/shared/module-drag-and-drop.directive';
import {MentionModule} from 'kl-angular-mentions';
import { TextareaAutoresizeDirective } from 'app/textarea-autoresize.directive';
import {AdminComponent} from './admin.component';
import {FullCalendarModule} from '@fullcalendar/angular';
import {MatChipsModule} from '@angular/material/chips';
import {ChartsModalComponent} from '../charts/charts-modal.component';
import {MatMenuModule} from '@angular/material/menu';
import {ResizeColumnDirective} from 'app/resize-column.directive';


import {NgxPaginationModule} from 'ngx-pagination';
import {ConditionExplainComponent} from '../components/condition-explain/condition-explain.component';
import {CertificateManagementComponent} from './components/certificate-management.component';

//list page
import {SearchparamComponent} from './searchparam.component';
import {DatasetTableRowComponent} from './dataset-table-row.component';
import {DatasetTableCellComponent} from './dataset-table-cell.component';
import {FormFieldEditModalComponent} from './form-field-edit-modal.component';
import {TsvImportComponent} from '../tsv-import/tsv-import.component';
import {JsonImportComponent} from '../json-import/json-import.component';
import {AdminTableComponent} from './admin-table.component';
import {AdminTreeComponent} from './admin-tree.component';
import {AdminCalendarViewComponent} from './admin-calendar-view.component';
import {LedgerImportComponent} from '../ledger-import/ledger-import.component';
import {ViewModalComponent} from './view-modal.component';
import {ViewContentComponent} from './view/view-content.component';
import {ViewTableComponent} from './view/table.component';
import {ViewTableListComponent} from './view/table-list.component';
import {ViewImageListComponent} from './view/image-list.component';
import {ViewChipListComponent} from './view/chip-list.component';
import {RelationTableComponent} from './view/relation-table.component';

import {PhaseStatusComponent} from './view/phase-status.component';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {RouterModule} from '@angular/router';
import {CloudChartsModule} from '../charts/cloud-charts-module';
import { GoogleCalendarComponent } from '../google-calendar/google-calendar.component';
import { DecimalSeparatorDirective } from '../decimal-separator.directive';


@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitized: DomSanitizer) {
    }

    transform(value) {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }
}

FullCalendarModule.registerPlugins([
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin
]);

@NgModule({
    declarations: [
        ConditionFormComponent,
        ConditionsFormComponent,
        ConditionModalComponent,
        SearchFieldComponent,
        UserFieldComponent,
        DivisionFieldComponent,
        WorkflowSettingComponent,
        PositionFieldComponent,
        DynamicDataViewComponent,
        CustomFilterPulldownComponent,
        IndexWorkflowModalComponent,
        FieldSelectDragdropComponent,
        FieldSelectComponent,
        SelectFieldComponent,
        SelectFieldAndValueComponent,
        SortParamsFormComponent,
        ConfirmModalComponent,
        ChatgptModalComponent,
        AnalyticsModalComponent,
        GoogleCalendarComponent,
        DebugModeOnDirective,
        GrantGroupFormComponent,
        DirectoryTreeComponent,
        BreadcrumbsComponent,
        EditComponent,
        AdminComponent,
        WorkflowModalComponent,
        EditAllModalComponent,
        MemoComponent,
        GoogleMapComponent,
        GoogleFilterPulldownComponent,
        GoogleMapViewComponent,
        TextareaAutoresizeDirective,
        CommentModalComponent,
        LookupModalComponent,
        FormsComponent,
        ChildFormsComponent,
        FormsFieldComponent,
        FormsImageComponent,
        DatasetFormComponent,
        DatasetFieldOneComponent,
        GrantComponent,
        InputNumberDirective,
        DoubleScrollbarDirective,
        SafeHtmlPipe,
        ModuleDragAndDropDirective,

        //list
        SearchparamComponent,
        DatasetTableRowComponent,
        DatasetTableCellComponent,
        FormFieldEditModalComponent,
        TsvImportComponent,
        JsonImportComponent,
        LedgerImportComponent,
        AdminTableComponent,
        AdminTreeComponent,
        AdminCalendarViewComponent,
        ViewTableComponent,
        ViewTableListComponent,
        ViewContentComponent,
        ViewChipListComponent,
        PhaseStatusComponent,
        ViewImageListComponent,
        ViewModalComponent,
        ChartsModalComponent,
        ResizeColumnDirective,
        RelationTableComponent,
        ConditionExplainComponent,
        DecimalSeparatorDirective,
        CertificateManagementComponent,
        ChatBotComponent

    ],

    exports: [
        Nl2BrPipeModule,
        ProgressbarModule,
        NgbTooltipModule,
        ReactiveFormsModule,
        ConditionFormComponent,
        ConditionsFormComponent,
        SearchFieldComponent,
        UserFieldComponent,
        DivisionFieldComponent,
        WorkflowSettingComponent,
        DynamicDataViewComponent,
        CustomFilterPulldownComponent,
        IndexWorkflowModalComponent,
        FieldSelectDragdropComponent,
        FieldSelectComponent,
        MemoComponent,
        GoogleMapComponent,
        GoogleFilterPulldownComponent,
        GoogleMapViewComponent,
        SelectFieldComponent,
        SelectFieldAndValueComponent,
        SortParamsFormComponent,
        ConfirmModalComponent,
        ChatgptModalComponent,
        AnalyticsModalComponent,
        DebugModeOnDirective,
        GrantGroupFormComponent,
        DirectoryTreeComponent,
        BreadcrumbsComponent,
        EditComponent,
        AdminComponent,
        CommentModalComponent,
        LookupModalComponent,
        FormsComponent,
        ChildFormsComponent,
        FormsFieldComponent,
        FormsImageComponent,
        DatasetFormComponent,
        DatasetFieldOneComponent,
        GrantComponent,
        WorkflowModalComponent,
        EditAllModalComponent,
        InputNumberDirective,
        ModuleDragAndDropDirective,
        //list
        ViewTableComponent,
        ViewTableListComponent,
        ViewImageListComponent,
        ViewContentComponent,
        ViewChipListComponent,
        PhaseStatusComponent,
        ViewModalComponent,
        AdminTableComponent,
        AdminTreeComponent,
        AdminCalendarViewComponent,
        ChartsModalComponent,
        ResizeColumnDirective,
        TsvImportComponent,
        JsonImportComponent,
        RelationTableComponent,
        ConditionExplainComponent,
        DecimalSeparatorDirective,
        CertificateManagementComponent,
        ChatBotComponent

    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        NgbTooltipModule,
        NgbModalModule,
        NgbCollapseModule,
        DragDropModule,
        Nl2BrPipeModule,
        ProgressbarModule.forRoot(),
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        NgSelectModule,
        FroalaViewModule,
        FroalaEditorModule,
        BsDropdownModule.forRoot(),
        ModalModule.forRoot(),
        LaddaModule.forRoot({
            style: 'slide-up',
            spinnerSize: 25,
            spinnerColor: '#fff',
            spinnerLines: 12
        }),
        MentionModule,
        FullCalendarModule,
        MatChipsModule,
        MatMenuModule,
        NgxPaginationModule,
        RouterModule,
        TabsModule,
        CloudChartsModule,
        NgImageFullscreenViewModule
    ],
    providers: [DatePipe]
})
export class AdminSharedModule {
}

import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { Conditions } from '../../../class/Conditions';
import { Condition } from '../../../class/Condition';
import { TableInfo } from '../../../class/TableInfo';
import { SharedService } from '../../../services/shared';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ConditionModalComponent} from './condition-modal.component';
import {Data} from '../../../class/Data';


@Component({
    selector: 'grant-check',
    templateUrl: './grant.component.html',
})

export class GrantComponent implements OnInit {
    @ViewChild('detailCard') detailCard: ElementRef;
    @ViewChild('tableManagementModal') tableManagementModal: any;

    showConditionForms: {[key: string]: boolean} = {
        'view': false,
        'edit': false,
        'add': false,
        'delete': false
    };

    @Input('data') data: Data;
    hasCondition(type: string): boolean {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        return this.grant_value[key] && Array.isArray(this.grant_value[key]) && this.grant_value[key].length > 0;
    }
    @Input('grant_json') grant_json: string;
    @Input('table') table: string;
    @Input('view_grant_force_true') view_grant_force_true: boolean = true;
    @Input('is_show_table_grant') is_show_table_grant: boolean = true;
    @Output() valueChanged: EventEmitter<{ grant_value: string }> = new EventEmitter();

    public permissions = [
        { key: 'view', label: '閲覧', tooltip: 'データの閲覧を許可します' },
        { key: 'edit', label: '編集', tooltip: 'データの編集を許可します' },
        { key: 'add', label: '追加', tooltip: '新規データの追加を許可します' },
        { key: 'delete', label: '削除', tooltip: 'データの削除を許可します' },
        { key: 'summarize', label: '集計', tooltip: 'データの集計機能の利用を許可します' },
        { key: 'duplicate', label: '複製', tooltip: '既存データの複製を許可します' },
        { key: 'update_all', label: '一括編集', tooltip: '複数データの一括編集を許可します' }
    ];

    public restrictions = [
        {
            key: 'only_one',
            label: '1データのみ登録可能',
            tooltip: '1つのデータのみ登録を許可します',
            description: '1データのみの登録に制限'
        },
        {
            key: 'disable_csv_dl',
            label: 'CSVダウンロード不可',
            tooltip: 'CSVでのデータダウンロードを制限します',
            description: 'CSVダウンロードの制限'
        },
        {
            key: 'disable_csv_up',
            label: 'CSVアップロード不可',
            tooltip: 'CSVでのデータアップロードを制限します',
            description: 'CSVアップロードの制限'
        },
        {
            key: 'disable_zip_up',
            label: 'ZIPアップロード不可',
            tooltip: 'ZIPでのデータアップロードを制限します',
            description: 'ZIPアップロードの制限'
        }
    ];

    public grantGroups: Array<{
        id: number;
        name: string;
        type: 'user' | 'group';
        permissions: { [key: string]: boolean };
    }> = [];

    public grant_value: {
        view?: boolean;
        edit?: boolean;
        summarize?: boolean;
        add?: boolean;
        delete?: boolean;
        duplicate?: boolean;
        condition_a?: any;
        edit_condition_a?: any;
        extend_table_hide_fields?: { admin?: Array<{ field: string }> };
        extend_table_no_edit_fields?: { admin?: Array<{ field: string }> };
        [key: string]: any;
    } = {};
    public table_info: TableInfo;
    public admin_table_hide_fields: Array<{ field: string }> = [];
    public admin_table_no_edit_fields: Array<{ field: string }> = [];

    // フィールド管理設定用の別配列を追加
    public admin_field_management_hide_fields: Array<string> = [];
    public admin_field_management_no_edit_fields: Array<string> = [];

    //ユーザーテーブル用

    scrollToDetail(): void {
        this.detailCard.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }


    constructor(
        public _share: SharedService,
        private modalService: NgbModal
    ) {}

    toggleConditionForm(type: 'view' | 'edit' | 'add' | 'delete'): void {
        this.showConditionForms[type] = !this.showConditionForms[type];
    }

    getConditionJson(type: 'view' | 'edit' | 'add' | 'delete'): any {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        let existingConditions = this.grant_value[key];

        if (typeof existingConditions === 'string') {
            try {
                existingConditions = JSON.parse(existingConditions);
            } catch (e) {
                console.error(`Failed to parse conditions for ${type}:`, e);
                existingConditions = [];
            }
        }

        if (!Array.isArray(existingConditions)) {
            if (existingConditions && typeof existingConditions === 'object') {
                existingConditions = [existingConditions];
            } else {
                existingConditions = [];
            }
        }

        const conditions = new Conditions(existingConditions);
        return conditions.getSearchParamJson();
    }

    // getConditionTitle method removed as it's no longer needed

    onConditionsChanged(event: any, type: 'view' | 'edit' | 'add' | 'delete'): void {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;

        // Handle the event from conditions-form component
        if (event && event.conditions) {
            const conditionArray = event.conditions.getSearchParam();
            if (Array.isArray(conditionArray)) {
                this.grant_value[key] = conditionArray;
            } else if (conditionArray && typeof conditionArray === 'object') {
                this.grant_value[key] = [conditionArray];
            } else {
                this.grant_value[key] = [];
            }
        } else if (event && event.condition_json) {
            if (Array.isArray(event.condition_json)) {
                this.grant_value[key] = event.condition_json;
            } else if (event.condition_json && typeof event.condition_json === 'object') {
                this.grant_value[key] = [event.condition_json];
            } else {
                this.grant_value[key] = [];
            }
        } else {
            this.grant_value[key] = [];
        }

        this.onChangeGrant();
    }



    ngOnInit(): void {
        this.grant_value = {}
        try {
            let _grant_value = JSON.parse(this.grant_json)
            if (_grant_value) {
                this.grant_value = _grant_value;
            }
        } catch (e) {
            //default
            this.grant_value = {'view': true, 'edit': true, 'summarize': true, 'add': true, 'delete': true};
        }
        // CSVダウンロード・アップロード関連のキーが存在しない場合はデフォルト値を設定
        if (this.grant_value['disable_csv_dl'] === undefined) {
            this.grant_value['disable_csv_dl'] = false;
        }
        if (this.grant_value['disable_csv_up'] === undefined) {
            this.grant_value['disable_csv_up'] = false;
        }

        // Initialize conditions for each permission type
        const permissionTypes = ['view', 'edit', 'add', 'delete', 'summarize', 'duplicate', 'update_all'];
        permissionTypes.forEach(type => {
            const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;

            // Ensure the key exists
            if (!this.grant_value[key]) {
                this.grant_value[key] = [];
                return;
            }

            // Parse string conditions if needed
            if (typeof this.grant_value[key] === 'string') {
                try {
                    this.grant_value[key] = JSON.parse(this.grant_value[key]);
                } catch (e) {
                    console.error(`Failed to parse conditions for ${type}:`, e);
                    this.grant_value[key] = [];
                    return;
                }
            }

            // Ensure we have an array
            if (!Array.isArray(this.grant_value[key])) {
                if (typeof this.grant_value[key] === 'object') {
                    // Convert single object to array
                    this.grant_value[key] = [this.grant_value[key]];
                } else {
                    this.grant_value[key] = [];
                }
                return;
            }

            // Initialize conditions and store as array
            try {
                const conditions = new Conditions(this.grant_value[key]);
                // Store as array instead of JSON string
                this.grant_value[key] = conditions.getSearchParam();
            } catch (e) {
                console.error(`Failed to initialize conditions for ${type}:`, e);
                this.grant_value[key] = [];
            }
        });
        if (this.grant_value['extend_table_hide_fields']) {
            if (this.grant_value['extend_table_hide_fields']['admin']) {
                // 既存のデータをデフォルト項目設定として初期化（後で分離ロジックを追加する場合）
                this.admin_table_hide_fields = this.grant_value['extend_table_hide_fields']['admin'];
                // フィールド管理設定は空で初期化
                this.admin_field_management_hide_fields = [];
            }
        }

        if (this.grant_value['extend_table_no_edit_fields']) {
            if (this.grant_value['extend_table_no_edit_fields']['admin']) {
                // 既存のデータをデフォルト項目設定として初期化（後で分離ロジックを追加する場合）
                this.admin_table_no_edit_fields = this.grant_value['extend_table_no_edit_fields']['admin'];
                // フィールド管理設定は空で初期化
                this.admin_field_management_no_edit_fields = [];
            }
        }

        if (this.data.raw_data['hide_fields']) {
            this.grant_value.hide_fields = this.data.raw_data['hide_fields'];
        }
        if (this.data.raw_data['only_view_fields']) {
            this.grant_value.only_view_fields = this.data.raw_data['only_view_fields'];
        }

        if (this.is_show_table_grant) {
            this._share.getTableInfo(this.table).subscribe(_table_info => {
                this.table_info = _table_info

            })

        }
        if (this.view_grant_force_true) {
            this.grant_value['view'] = true;
        }

        const conditionTypes = ['view', 'edit', 'add', 'delete'];
        for (const type of conditionTypes) {
            if (this.hasCondition(type)) {
                this.showConditionForms[type] = true;
            }
        }

        this.onChangeGrant()
    }

    public async onChangeGrant(): Promise<void> {
        if (this.table_info && this.table_info.table === 'admin') {
            // 既存のオブジェクトを保持し、adminプロパティのみ更新
            if (!this.grant_value['extend_table_hide_fields']) {
                this.grant_value['extend_table_hide_fields'] = {};
            }

            // フィールド管理設定とデフォルト項目設定をマージ
            const mergedHideFields = [
                ...this.admin_table_hide_fields, // デフォルト項目設定
                ...this.admin_field_management_hide_fields.map(field => ({ field })) // フィールド管理設定
            ];
            this.grant_value['extend_table_hide_fields']['admin'] = mergedHideFields;

            if (!this.grant_value['extend_table_no_edit_fields']) {
                this.grant_value['extend_table_no_edit_fields'] = {};
            }

            // フィールド管理設定とデフォルト項目設定をマージ
            const mergedNoEditFields = [
                ...this.admin_table_no_edit_fields, // デフォルト項目設定
                ...this.admin_field_management_no_edit_fields.map(field => ({ field })) // フィールド管理設定
            ];
            this.grant_value['extend_table_no_edit_fields']['admin'] = mergedNoEditFields;
        }

        // 1データのみ登録可能の場合の自動設定
        if (this.grant_value['only_one']) {
            this.grant_value['edit'] = true;
            this.grant_value['add'] = false;
            this.grant_value['delete'] = false;
            this.grant_value['summarize'] = false;
            this.grant_value['duplicate'] = false;
            this.grant_value['update_all'] = false;
            this.grant_value['disable_csv_dl'] = true;
            this.grant_value['disable_csv_up'] = true;
            this.grant_value['disable_zip_up'] = true;
        }

        // 追加権限がない場合は複製権限も無効化
        if (!this.grant_value['add']) {
            this.grant_value['duplicate'] = false;
        }

        // CSVダウンロード・アップロード関連のキーが存在しない場合はデフォルト値を設定
        if (this.grant_value['disable_csv_dl'] === undefined) {
            this.grant_value['disable_csv_dl'] = false;
        }
        if (this.grant_value['disable_csv_up'] === undefined) {
            this.grant_value['disable_csv_up'] = false;
        }

        // Ensure all condition arrays are actually arrays before stringifying
        const permissionTypes = ['view', 'edit', 'add', 'delete', 'summarize', 'duplicate', 'update_all'];
        permissionTypes.forEach(type => {
            const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
            if (!this.grant_value[key]) {
                this.grant_value[key] = [];
            } else if (typeof this.grant_value[key] === 'string') {
                try {
                    this.grant_value[key] = JSON.parse(this.grant_value[key]);
                } catch (e) {
                    console.error(`Failed to parse conditions for ${type}:`, e);
                    this.grant_value[key] = [];
                }
            }

            // Ensure array format
            if (!Array.isArray(this.grant_value[key])) {
                if (this.grant_value[key] && typeof this.grant_value[key] === 'object') {
                    this.grant_value[key] = [this.grant_value[key]];
                } else {
                    this.grant_value[key] = [];
                }
            }
        });

        if (this.data) {
            if (this.grant_value.hide_fields) {
                this.data.setMultiData('hide_fields', this.grant_value.hide_fields);
            }
            if (this.grant_value.only_view_fields) {
                this.data.setMultiData('only_view_fields', this.grant_value.only_view_fields);
            }
        }

        this.valueChanged.emit({
            'grant_value': JSON.stringify(this.grant_value)
        });

    }

    isCheckGrant(value: string): boolean {
        if (value === 'view') {
            if (this.view_grant_force_true) {
                return true;
            }
        }
        return this.grant_value[value] === true;
    }

    getConditionsByType(type: string): Conditions {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        let conditionData = this.grant_value[key];

        // Handle string format
        if (typeof conditionData === 'string') {
            try {
                conditionData = JSON.parse(conditionData);
            } catch (e) {
                console.error(`Failed to parse conditions for ${type}:`, e);
                conditionData = [];
            }
        }

        // Ensure array format
        if (!Array.isArray(conditionData)) {
            conditionData = conditionData ? [conditionData] : [];
        }

        return new Conditions(conditionData);
    }

    addGrantCondition(type: string) {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        if (!this.grant_value[key]) {
            this.grant_value[key] = [];
        }
        const conditions = new Conditions(this.grant_value[key]);
        conditions.addCondition();
        this.grant_value[key] = conditions.getSearchParamJson();
        this.onChangeGrant();
    }

    delGrantCondition(i: number, type: string) {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        const conditions = new Conditions(this.grant_value[key] || []);
        conditions.deleteCondition(i);
        this.grant_value[key] = conditions.getSearchParamJson();
        this.onChangeGrant();
    }

    onGrantConditionChange(cond_index: number, $event: any, type: string): void {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        const conditions = new Conditions(this.grant_value[key] || []);
        if ($event && $event.condition) {
            conditions.replaceCondition($event.index, $event.condition);
            this.grant_value[key] = conditions.getSearchParamJson();
            this.onChangeGrant();
        }
    }

    addAdminTableHideField() {
        this.admin_table_hide_fields.push({
            'field': 'id'
        })
    }

    addAdminTableNoEditField() {
        this.admin_table_no_edit_fields.push({
            'field': 'id'
        })
    }

    delAdminTableHideField(i) {
        this.admin_table_hide_fields.splice(i, 1)
        this.onChangeGrant();

    }

    delAdminTableNoEditField(i) {
        this.admin_table_no_edit_fields.splice(i, 1)
        this.onChangeGrant();

    }

    drop(event: { previousIndex: number; currentIndex: number }, type: string) {
        const key = type === 'view' ? 'condition_a' : `${type}_condition_a`;
        if (!this.grant_value[key]) {
            this.grant_value[key] = [];
            return;
        }

        // Create new conditions instance with existing data
        const conditions = new Conditions(this.grant_value[key]);
        const conditionArray = conditions.getSearchParam();
        moveItemInArray(conditionArray, event.previousIndex, event.currentIndex);
        conditions.setByParamAry(conditionArray, true);
        this.grant_value[key] = conditions.getSearchParamJson();
        this.onChangeGrant();
    }

    showForDfault(field: any): boolean {
        return field.Field!=='id' && !field.Field.startsWith('field__') && field.Field != 'google_calendar' && field.Field != 'current_at';
    }

    getPermissionDisabled(key: string): boolean {
        if (key === 'view') {
            return this.view_grant_force_true;
        }
        if (key === 'edit' || key === 'add' || key === 'delete' || key === 'summarize') {
            return !this.isCheckGrant('view') || this.isCheckGrant('only_one');
        }
        if (key === 'duplicate') {
            return !this.isCheckGrant('add') || this.isCheckGrant('only_one');
        }
        if (key === 'update_all') {
            return !this.isCheckGrant('edit') || this.isCheckGrant('only_one');
        }
        return false;
    }

    getRestrictionDisabled(key: string): boolean {
        return !this.isCheckGrant('view') ||
               (key !== 'only_one' && this.isCheckGrant('only_one'));
    }

    getGroupPermissionDisabled(group: any, key: string): boolean {
        return this.getPermissionDisabled(key);
    }

    onGroupPermissionChange(group: any, key: string): void {
        this.onChangeGrant();
    }


    openTableManagement(): void {
        this.tableManagementModal.show();
    }

    applyTableManagement(): void {
        this.onChangeGrant();
        this.tableManagementModal.hide();
    }

    onChangeGrantFromModal(event: any) {
        console.log('モーダルから権限設定が変更されました:', event);
        if (event && event.field_name === 'hide_fields') {
            this.grant_value.hide_fields = event.value || [];
            // this.admin_table_hide_fields = event.value || [];
            this.data.raw_data['hide_fields'] = event.value || [];
            // const child_data:Data = this.data.child_data_by_table['dataset_grant'];
            this.data.setMultiData('hide_fields', event.value)
        } else if (event && event.field_name === 'only_view_fields') {
            this.grant_value.only_view_fields = event.value || [];
            // this.admin_table_no_edit_fields = event.value || [];
            this.data.raw_data['only_view_fields'] = event.value || [];
            this.data.setMultiData('only_view_fields', event.value)
        }
        this.onChangeGrant();
    }


}

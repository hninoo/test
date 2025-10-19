import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, Renderer2, SimpleChanges,OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router'
import ToastrService from '../toastr-service-wrapper.service';

import {SharedService} from 'app/services/shared';
import {Connect} from 'app/services/connect';
import {TableInfo} from '../class/TableInfo';
import {Data} from '../class/Data';
import {CrossTableHeader} from '../class/CrossTableHeader';
import {SelectOptionItemsFilter} from '../class/SelectOptionItemsFilter';
import * as cloneDeep from 'lodash/cloneDeep';
import {Forms} from '../class/Forms';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: '[dataset-table-row]',
    templateUrl: './dataset-table-row.component.html',
    styleUrls: ['./dataset-table-row.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DatasetTableRowComponent implements OnChanges, OnInit {
    @Input() data: Data;
    @Input() view_fields: Array<any>;
    @Input() is_setting: boolean;
    @Input() child_a: Array<any>;

    @Input() showCheckbox: boolean;
    @Input() movable: boolean;
    @Input() isSummarizeMode: boolean;
    @Input() chart_params;
    @Input() showCRUDControls: boolean;
    //@Input() onDelete: Function;
    @Input() reload: Function;
    @Input() selectedCellId: number;
    @Input() setSelectedCellId: Function;
    @Input() showFormEditModal: Function;
    @Input() closeFormEditModal: Function;
    @Input() required_fields = [];
    @Input() table_info: TableInfo;
    @Input() data_index: number;
    @Input() isEditModalShown: boolean;
    @Input() isEditMode: boolean;

    @Input() is_relation_table: boolean = false;

    @Input() disable_float_management_buttons: boolean = false;
    @Input() stored_width_setting: [];

    @Input() stored_fields: [];
    @Input() dataset: '';
    @Input() customFilter: any = null; // カスタムフィルター（summary_a取得用）
    @Input() crossTableHeader: CrossTableHeader;
    @Input() workflow_cell_left: 0;

    @Input() embedMode: boolean = false;
    @Input() viewDataMode: boolean = false;

    @Output() onCheckboxChange: EventEmitter<Object> = new EventEmitter();
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() onUpDown: EventEmitter<Object> = new EventEmitter();
    @Output() dataSaved: EventEmitter<Object> = new EventEmitter();
    @Output() onFormatViewData: EventEmitter<Object> = new EventEmitter();
    // @Output() modalOpen: EventEmitter<any> = new EventEmitter();
    @Output() onDelete: EventEmitter<Object> = new EventEmitter();
    @Output() openBranConProsessTransModal: EventEmitter<Object> = new EventEmitter();
    @Output() onOpenUnlockModal: EventEmitter<Object> = new EventEmitter();
    @Output() ctrlClickEvent: EventEmitter<any> = new EventEmitter();
    @Output() onDblClick: EventEmitter<any> = new EventEmitter();
    @Output() onSelectData: EventEmitter<any> = new EventEmitter();
    @Output() onForceLogout: EventEmitter<any> = new EventEmitter();
    @Output() onManagementButtonClick: EventEmitter<any> = new EventEmitter();

    public update$ = new BehaviorSubject({last_changed: null});

    public editingData: Data;
    public table: string;
    public primary_key: string = 'id'
    private toasterService: ToastrService;
    private _connect: Connect;
    public required_data_errors: Array<any> = [];
    private has_required_errors: boolean = false;
    private editMode: boolean = false;
    public cellIds = {};
    private is_new_obj: boolean = false;
    public downloading: Object = {};
    public is_viewable_detail: boolean = true;
    public viewdata: Object;
    public table_type = null;

    public selectOptionItemsFilter: SelectOptionItemsFilter;

    public rowForms: Forms;

    constructor(private _router: Router, private _share: SharedService, toasterService: ToastrService, _connect: Connect, private el: ElementRef, private _renderer: Renderer2) {
        this.toasterService = toasterService;
        this._connect = _connect;
    }


    getType(field_name) {
        if (this.table_info.forms.byFieldName(field_name) === undefined) {
            return '';
        }
        return this.table_info.forms.byFieldName(field_name).type || '';
    }

    validate = () => {
        let errors = [];
        this.view_fields.forEach(field => {
            if (this.table_info.forms.byFieldName(field.Field).required && !!!this.data.raw_data[field.Field] && this.data.raw_data[field.Field] !== 0) {
                errors.push(field.Field);
            }
        });
        this.has_required_errors = errors.length > 0;
        this.required_data_errors = errors;
    }


    ngOnInit() {
        this.editingData = cloneDeep(this.data)
        this.table_type = this.table_info.menu.table_type;

    }

    ngOnChanges(changes: SimpleChanges): void {
        this.table = this.table_info.table
        // this.fixedDataset = this.fixed_field_dataset == location.pathname.split('/admin/')[1];
        this.is_viewable_detail = this.table_info.grant.detail && this.data['raw_data']['id'] > 0;

        if (this.selectedCellId === null) {
            return
        }
        this.editMode = Object.keys(this.cellIds).map((cid) => this.cellIds[cid]).indexOf(this.selectedCellId) > -1;
        this.is_new_obj = this.data.raw_data[this.primary_key] < 1;
        if (this.editMode || this.is_new_obj) {
            this.validate();
        }
        if (this.view_fields) {
            this.view_fields.forEach(field => {
                this.cellIds[field.Field] = this.data.raw_data[this.primary_key] + '_' + field.Field;
            });
        }
        if (changes.data) {
            this.selectOptionItemsFilter = this.table_info.getSelectItemOptionsFilter(this.data)
        }
        this.rowForms = cloneDeep(this.table_info.forms);
    }

    goToEdit(event) {
        if (event && (event.ctrlKey || event.metaKey)) {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`${this._share.getAdminTable()}/${this.table}/edit/${this.data.raw_data[this.primary_key]}`])
            );
            window.open(url, '_blank')
            return;
        }
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', this.data.raw_data[this.primary_key]], {
            queryParams: { 'return_url': this.isEncoded(this._router.url) ? this._router.url : encodeURIComponent(this._router.url) }

        });
    }

    /**
     * 指定されたURLがエンコード済みかどうかを判断する
     */
    private isEncoded(url: string): boolean {
        return decodeURIComponent(url) !== url;
    }

    toComment() {
        const params = {};
        params['comment_open']=true;
        this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.data.raw_data[this.primary_key], params]);
    }

    view(event) {
        if (this.embedMode) {
            this.onDblClick.emit({
                id: this.data.raw_data['id']
            })
            return;
        }
        if (event && (event.ctrlKey || event.metaKey)) {
            const url = this._router.serializeUrl(
                this._router.createUrlTree([`${this._share.getAdminTable()}/${this.table}/view/${this.data.raw_data[this.primary_key]}`])
            );
            window.open(url, '_blank')
        } else {
            this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.data.raw_data[this.primary_key]]);
            //fixed scroll top error when go from list page to detail page
            document.querySelector('.app-body').scrollTop = 0;
        }
    }


    extendDataClicked(extend_data) {
        if (extend_data['link'] !== undefined) {
            this._router.navigate(extend_data['link'].split('/'));
        }
    }


    download_file(url, data, field, no_action_log = false) {
        this.downloading[field] = true;

        this._share.download_file(url, () => {
            this.downloading[field] = false;
        }, no_action_log);
    }

   onValueChanged($event) {
        console.log($event)
        let hash = {}
        hash[$event['form'].field['Field']] = $event.value
        this.editingData.setRawData(hash)
        console.log(this.editingData)
        this.selectOptionItemsFilter = this.table_info.getSelectItemOptionsFilter(this.editingData)

        // Handle multi-value select components
        if ($event['form'] && $event['form'].is_multi_value_mode) {
            // Clear existing child data and add new child data for the selected values
            const fieldName = $event['form'].field['Field'];
            const childTable = this.table_info.table + '_' + fieldName + '_multi';

            // Convert string to array if needed
            let values = $event.value;
            if (typeof values === 'string') {
                values = values.split(',').map(v => v.trim()).filter(v => v !== '');
            }

            values.forEach((value, index) => {
                this.data.setChildData(
                    this.data.getChildTableInfoByTable(childTable),
                    {
                        'value': value,
                        'tmp_year': $event.tmp_year,
                        'tmp_month': $event.tmp_month
                    },
                    index
                );
            });
        }

       this.valueChanged.emit($event);
        this.table_info.reflectRequiredShowCondition($event['form'].field['Field'], this._share, this._connect, this.rowForms, this.data, !!this.data.raw_data['id'] ? 'edit' : 'add', undefined, undefined, undefined, undefined, undefined, 'table_row').subscribe(res => {
            if (res.status === 'warning') {
                this.toasterService.warning(res.message);
            }
            this.update$.next({last_changed: this.data.last_dirty_changed ? this.data.last_dirty_changed.toString() : null});
        })
    }

    onFormatViewDataRow($event) {
        if (!['image', 'file'].includes($event.field.Type)) {
            let formData = new FormData();
            if ($event.raw_data == null) {
                formData.append($event.field.Field, '');
            } else {
                formData.append($event.field.Field, $event.raw_data);
            }
            this._connect.postUpload(`/admin/format/data/${this.table}`, formData).subscribe((jsonData) => {
                this.data.view_data[$event.field.Field] = jsonData['view_data'][$event.field.Field]
            });
        }
    }


    getSummarizeType(field_name) {
        if (field_name.match(/^y/)) {
            return 'number';
        }
        return 'text'
    }

    up(data) {
        this._connect.post('/admin/order/' + this.table + '/' + data.raw_data[this.table_info.primary_key] + '/up', {}).subscribe(
            (jsonData) => {
                this.onUpDown.emit('up');

            },
        );
    }

    down(data) {
        this._connect.post('/admin/order/' + this.table + '/' + data.raw_data[this.table_info.primary_key] + '/down', {}).subscribe(
            (jsonData) => {
                this.onUpDown.emit('up');
            },
        );
    }

    checkboxChange($event) {
        this.onCheckboxChange.emit()
    }


    private isPlainByFieldCache = {}

    isPlainData(field): boolean {
        if (field['Field'] == 'x1') {
            return false;
        }
        if (!this.isPlainByFieldCache[field['Field']]) {
            this.isPlainByFieldCache[field['Field']] = !['textarea', 'image', 'thumbnail', 'file', 'url', 'number', 'richtext', 'select_other_table', 'calc'].includes(this.getDataType(field))
        }
        return this.isPlainByFieldCache[field['Field']]
    }

    private dataTypeByFieldCache = {}

    /**
     * 20240510 Kanazawa 追加 計算フィールドの条件を追加するに当たって関数化
     * byFieldNameからデータ取得
     */
    getdataTypeByFieldCacheFromByFieldName(fieldName: string) {
        // 計算フィールドのemail,urlの場合のみ、calc_result_typeからdatatypeを設定
        // 計算フィールドに個別に設定しなくてもなんとなく動いたが、文字列フィールドのurl,emailと同じ状態、挙動にするためにロジック追加
        if (this.table_info.forms.byFieldName(fieldName).original_type === 'calc'
            && ['email', 'url'].includes(this.table_info.forms.byFieldName(fieldName).custom_field['calc_result_type'])) {
            return this.table_info.forms.byFieldName(fieldName).custom_field['calc_result_type'];
        }
        return this.table_info.forms.byFieldName(fieldName).original_type;
    }

    getDataType(field: Object): string {
        if (!this.dataTypeByFieldCache[field['Field']]) {
            this.dataTypeByFieldCache[field['Field']] = this.table_info.forms.byFieldName(field['Field']) != undefined
                ? this.getdataTypeByFieldCacheFromByFieldName(field['Field'])
                : (this.isSummarizeMode ? this.getSummarizeType(field['Field']) : null);
        }
        return this.dataTypeByFieldCache[field['Field']]
    }

    openUnlockModal() {
        this.onOpenUnlockModal.emit({
            'data': this.data
        });
    }


    getCellStyle(field_name: string, simple_view_mode: boolean = false): Object {
        let style = {};
        if (simple_view_mode) {
            style = this.table_info.forms.byFieldName(field_name) != undefined ? this.table_info.forms.byFieldName(field_name).getCellStyle() : {};
        }

        if (this.data.col_style_by_field && this.data.col_style_by_field[field_name]) {
            style = Object.assign(style, this.data.col_style_by_field[field_name])
        }
        let pathname = location.pathname.replace(/;[\S]*/gm,'');
        let dataset_id = pathname.split('/admin/')[1]; 
        if(this.stored_width_setting && this.stored_width_setting[dataset_id]) {
            this.stored_width_setting[dataset_id].map(setting => {
                if (setting['field'] == field_name) {
                    style = Object.assign(style, {'width': setting['current_width'], 'text-overflow': 'ellipsis'})
                }}
            )
        }
        if(this.stored_fields.length != 0) {
            this.stored_fields.map((x,i)=> {
                if(Object.keys(x)[0] == field_name) {
                    style = Object.assign({},style, {'left':`${x[field_name]}px`, 'position': 'sticky', 'z-index': 2})
                }
                if( Object.keys(x)[0] == field_name && style['backgroundColor'] == undefined ){
                    style = Object.assign({},style,{'background':'white'});
                }
            })
        }
        if (style['width'] !== undefined) {
            style = Object.assign(style, {'overflow': 'hidden', 'white-space': 'normal'})
        }

        return cloneDeep(style);
    }


    crlClickEventRow($event) {
        this.ctrlClickEvent.emit($event);
    }

    check_grant_permission(data) {
        this._connect.post('/api/admin/addpermissionview/' + data.raw_data['id'], {}).subscribe(_data => {
            this._share.loadAdminDatas().then(() => {
                window.location.reload()
            });
        })
    }

    forceLogout(id) {
        this.onForceLogout.emit({
            admin_id: id
        })

    }

    openTableManagement(event: Event): void {
        console.log('テーブル行の管理ボタンがクリックされました', this.data);
        this.onManagementButtonClick.emit({data: this.data, event: event});
    }

}

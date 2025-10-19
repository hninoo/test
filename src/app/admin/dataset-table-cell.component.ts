import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {TableInfo} from '../class/TableInfo';
import {SharedService} from '../services/shared';
import ToastrService from '../toastr-service-wrapper.service';
import {Data} from '../class/Data';
import {Connect} from 'app/services/connect';
import {Form} from '../class/Form';
import {SelectOptionItemsFilter} from '../class/SelectOptionItemsFilter';
import {Observable} from 'rxjs/Observable';
import {FormEditData} from '../class/FormEditData';
import {CrossTableHeader} from '../class/CrossTableHeader';


@Component({
    selector: '[dataset-table-cell]',
    templateUrl: './dataset-table-cell.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DatasetTableCellComponent implements OnInit, OnChanges {

    @Input() form: Form;
    @Input() field;
    @Input() grant_menu_a: Array<any>;
    @Input() selectChange;
    @Input() cellId: string;
    @Input() dataType: string;
    @Input() data: Data;
    @Input() selectedCellId;
    @Input() primary_key: number;
    @Input() showFormEditModal: Function;
    @Input() loading = false;
    @Input() table_info: TableInfo;
    @Input() data_index: number;
    @Input() child_a: Array<any>;
    @Input() isEditMode: boolean;
    @Input() crossTableHeader: CrossTableHeader;

    @Input() selectOptionItemsFilter: SelectOptionItemsFilter;


    @Input() update: Observable<any>;

    @Input() embedMode: boolean = false;
    @Input() viewDataMode: boolean = false;
    @Input() customFilter: any = null; // カスタムフィルター（summary_a取得用）

    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() onFormatViewData: EventEmitter<Object> = new EventEmitter();
    @Output() ctrlClickEvent: EventEmitter<any> = new EventEmitter();

    private toasterService: ToastrService;
    private connect;

    public isShowEditIcon: boolean = false;
    public isShowEditForm: boolean = false;
    public isCtrlClickAllow: boolean = false;

    constructor(public _share: SharedService, toasterService: ToastrService, connect: Connect, private cd: ChangeDetectorRef) {
        this.toasterService = toasterService;
        this.connect = connect;
    }


    ngOnInit() {
        if (this.update) {
            this.update.subscribe(value => {
                this.cd.markForCheck();
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // 編集不可フィールドのリスト
        const nonEditableFields = ['id', 'updated', 'created', 'admin_id', 'updated_admin_id'];

        // Allow all fields to be editable directly in the cell
        this.isCtrlClickAllow = (!!!this.field['fixed_value'] && this.form) &&
            (this.dataType !== 'calc' || (this.dataType === 'calc' && this.form.is_calc_auto_reload_off)) &&
                               (!nonEditableFields.includes(this.field.Field) && this.data.isEditable())

        // 子テーブルの場合は編集モードの時のみアイコンを表示
        const isChildTable = this.table_info && this.table_info.is_child_form;
        this.isShowEditIcon = this.isCtrlClickAllow &&
        ((isChildTable && this.isEditMode) || (!isChildTable && (this.cellId == this.selectedCellId || this.isEditMode))) &&
        this.form && this.form.is_show_by_condition &&
        this.table_info && this.table_info.grant && this.table_info.grant.isEditableField(this.field.Field) ? true : false

        // Show edit icon for all fields except richtext and textarea in edit mode
        this.isShowEditIcon = this.isShowEditIcon &&
            (['richtext', 'textarea'].indexOf(this.form.original_type) == -1 ||
                             this.isEditMode)

        // 最終更新者フィールド（updated_admin_id）は編集モードでも編集不可
        if (this.field.Field === 'updated_admin_id') {
            this.isShowEditIcon = false;
            this.isCtrlClickAllow = false;
        }
    }

    isTemporaryAddData() {
        let m = this.cellId.match(/^(\-?\d+)_/)
        if (!m) {
            return false;
        }
        return parseInt(m[1]) < 1;
    }


    onValueChange($event) {
        // this.data.raw_data[$event.field_name] = $event.value;
      
        const updHash = {}
        updHash[$event.field_name] = $event.value
        this.data.setRawData(updHash)

        // Handle multi-value select components when is_child=true
        if (this.form && this.form.is_multi_value_mode) {
            const fieldName = this.field['Field'];
            const childTable = this.table_info.table + '_' + fieldName + '_multi';

            this.data.resetChildData(childTable)
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

        this.onFormatViewData.emit({
            data_index: this.data_index,
            field: this.field,
            form: this.form,
            raw_data: this.data.raw_data[this.field.Field]
        });
        this.valueChanged.emit({
            'data_index': this.data_index,
            'field': this.field,
            'form': this.form,
            'child_a': this.child_a,
            'value': this.data.raw_data[this.field.Field],
            'child_table': this.form.is_multi_value_mode ? this.table_info.table + '_' + this.field['Field'] + '_multi' : null
        })
    }
    
    getImageThumbnail(field_name) {
        if (this.data.raw_data['__images'] != undefined) {
            return this.data.raw_data['__images'][field_name];
        }
        return null;
    }


    isAutoFillField(): boolean {
        if((this.dataType === 'calc' && this.form.is_calc_auto_reload_off)) {
            return false;
        }

        return this.table_info.copyto_fields.indexOf(this.field['Field']) >= 0 || this.form.isAutoFillField
    }


    @HostListener('click', ['$event'])
    onClick($event) {
        if (this.isEditMode && ['richtext', 'textarea'].includes(this.dataType)) {
            // richtext と textarea のみモーダルを使用
            let formEditData: FormEditData = new FormEditData();
            formEditData.setByHash({
                is_setting: !this.table_info.grant.edit,
                data: this.data,
                field: this.field,
                form: this.form,
                table_info: this.table_info,
                grant_menu_a: this.grant_menu_a,
                data_index: this.data_index,
                selectChange: this.selectChange,
            })
            this.showFormEditModal(formEditData, this.data.raw_data['id']);
        } else {
            if (this.isShowEditIcon || (this.isEditMode && this.form.is_multi_value_mode && !this.isAutoFillField())) {
                //ダブルクリックで編集モード
                this.isShowEditForm = true;
            }
        }

        if(!this.isEditMode) {
            return;
            if($event.ctrlKey || $event.metaKey) {
                if(this.isCtrlClickAllow) {
                    if(['richtext', 'textarea'].includes(this.dataType)) {
                        let formEditData = {
                            is_setting: !this.table_info.grant.edit,
                            data: this.data,
                            field: this.field,
                            form: this.form,
                            table_info: this.table_info,
                            grant_menu_a: this.grant_menu_a,
                            data_index: this.data_index,
                            selectChange: this.selectChange,
                        };
                        this.showFormEditModal(formEditData, this.data.raw_data['id']);
                    }
                    this.isShowEditForm = true;
                    this.ctrlClickEvent.emit($event);
                }
            }
        }
    }

    private zip_downloading: boolean = false;

    zip_download() {
        this.zip_downloading = true;
        var form_array = this.table_info.forms.getArray();
        var field_name_array: string[] = [];
        // get forms when original_type is file and multiple_value_mode is true
        for (var i = 0; i < form_array.length; i++) {
            if (form_array[i].is_multi_value_mode == true && form_array[i].original_type === 'file') {
                field_name_array.push(form_array[i]['field']['Field']);
            }
        }
        let form = this.form;
        let file_ids: Array<number> = this.data.raw_data[form.field['Field']];

        this._share.download_file(this.connect.getApiUrl() + '/admin/files/download-zip?file_ids=' + (file_ids).join(','), () => {

            this.zip_downloading = false;
        }, true, this.table_info.getLabel() + '_' + this.form.label + '_' + this.data.raw_data['id'] + '.zip');
    }


}

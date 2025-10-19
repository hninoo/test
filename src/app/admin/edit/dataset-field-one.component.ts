import {Comment} from './../../class/Comment';
import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';
import ToastrService from '../../toastr-service-wrapper.service';
import {Data} from '../../class/Data';
import {Component, Input, KeyValueDiffers, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import {EditComponent} from './edit.component';
import {Form} from '../../class/Form';
import {Forms} from '../../class/Forms';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import * as cloneDeep from 'lodash/cloneDeep';
import {Condition} from '../../class/Condition';
import {Observable} from 'rxjs/Observable';
import {v4 as uuidv4} from 'uuid';
import {SimpleTableInfo} from '../../class/SimpleTableInfo';
import {SortParam} from '../../class/Filter/SortParam';
import {ChangeDetectorRef} from '@angular/core';

// Add interface for type checking
interface AutoIdResetResponse {
    error?: string;
    success?: boolean;
}

@Component({
    selector: 'dataset-field-one',
    templateUrl: './dataset-field-one.component.html',
})

export class DatasetFieldOneComponent implements OnInit, OnChanges {
    @Input() data: Data;
    @Input() type: string;
    @Input() parent: EditComponent;
    @Input() mode: string;
    @Input() field_name: string;
    @Input() is_child_table: boolean = false;
    @Input() auto_complete_values: Array<any>;
    @Input() system_table_info: TableInfo = null;
    @Input() is_workflow: Array<any>;


    public previousData: Data;

    public isTableSettingOptionCollapsed = true;
    private toasterService: ToastrService;


    private dummy_field: Object = {};
    private dummy_form: Object = {};
    /**
     * Table定義用
     */

        //lookup用
    public copy_from_field_a: Array<any> = [];
    public can_copy_fields_by_from: Object = {}

    //display condition　用
    public display_condition_from_field_a: Array<any> = [];
    public can_compare_form_a_by_field_name: Object = {}


    //relation用
    public relation_fields: Array<any>;
    public item_table_fields: Array<any>;
    public relation_forms: Forms;
    public relation_all_fields: Array<any> = [];
    public field: {};

    // 関連テーブル表示条件の子テーブルの項目を入れる
    public child_table_fields: Array<any> = [];

    public is_show_old_editable: boolean = false;

    public select_other_table_select_tables: Array<SimpleTableInfo> = [];

    public table_grant_a: Array<any> = [];

    // 20240529 Kanazawa 追加 セレクトボックス用の0時~23時までの時間取得
    public selectStartHours: Array<number> = [...Array(24)].map((_, i) => i).map((i) => i );

    public selectEndHours: Array<number> = [...Array(25)].map((_, i) => i).map((i) => i );
    
    public itemData: any = { fields: [] };

    constructor(private _connect: Connect, 
                toasterService: ToastrService, 
                private differs: KeyValueDiffers, 
                public _share: SharedService,
                private changeDetectorRef: ChangeDetectorRef) {
        this.toasterService = toasterService;
    }
    
    /**
     * ToastrService へのアクセサ
     */
    get toastr(): ToastrService {
        return this.toasterService;
    }

    reset() {


        this.isTableSettingOptionCollapsed = true;
        this.previousData = cloneDeep(this.data)
        this.relation_fields = []
        this.item_table_fields = []
        this.relation_forms = cloneDeep(this.parent.converted_forms);

        console.log(this.parent.converted_fields)
        this.parent.converted_fields.forEach(fields => {
            //2次元配列のため。
            fields.forEach(field => {
                if (this.canSetRelationShowCondition(field)) {
                    this.relation_fields.push(field)
                }

                if (!this.parent.converted_forms.byFieldName(field.Field).is_multi_value_mode && this.parent.converted_forms.byFieldName(field.Field).type != 'relation_table') {
                    this.relation_all_fields.push(field)
                }

            })
        })

        this.relation_fields.unshift({
            'Field': 'id',
            'Comment': 'ID'
        })
        console.log('relation_fields')
        console.log(this.relation_fields)

        this.relation_forms.add('id', new Form({'type': 'number'}))


        if (this.data.raw_data['option']['relation-fields']) {
            //relation table
            this.data.raw_data['option']['relation-fields'].forEach(relation_field => {
                this.relationToSelected(relation_field)
            })
            this.loadRelationTable(true)
        }


        this.setDummyFieldAndForm();

        if (this.data.raw_data['option']['item-table']) {
            //他データセット参照の場合は、関連するテーブルを事前にロードしておく
            this._connect.post('/admin/table/grant/' + this.data.raw_data['option']['item-table'], {}).subscribe(
                (data) => {
                    if (data.view_grant == false) return
                    this._share.cacheRelatedTables([this.data.raw_data['option']['item-table']]).subscribe(() => {
                    }, () => {
                    }, () => {
                        console.log('COMPLETE ')
                        this.setCopyFromFields();
                        this.setDisplayConditionFromFields();
                        this.setItemTableFields();
                        this.setDummyFieldAndForm();
                        this.loadRelationTable()
                    })
                }
            )


            if (this.data.raw_data['option']['sort_params']) {
                this.data.sort_params = this.data.raw_data['option']['sort_params'].map(hash => new SortParam(hash['field'], hash['asc_desc']))

            }
        }

        if (this.data.raw_data['type'] === 'image') {
            if( ! this.data.raw_data['option']['limit_image_size'] ) {
                this.data.raw_data['option']['limit_image_size'] = 1;
            }
        }

        if (this.data.raw_data['type'] === 'calc') {
            let option = this.data.getRawData('option');
            if (!option['calc_result_type']) {
                option['calc_result_type'] = 'number';
                this.data.setRawData({'option': option});
            }
        } else if (this.data.raw_data['type'] === 'fixed_html') {
            this.data.setRawData({name: 'fixed_html_' + uuidv4()});
        }


        this.select_other_table_select_tables = this._share.exist_table_a.filter(t => {
            return t.table !== 'dataset__' + this.parent.data.raw_data['id']
        })

        if (this.data.raw_data['option']['relation-fields']) {
            this.data.raw_data['option']['relation-fields'].forEach(relation_field => {
                if (relation_field['from'] && !this.child_table_fields[relation_field['from']]) {
                    this.showChildField(relation_field);
                }
            });
        }
    }

    canSetRelationShowCondition(field) {
        if(['fixed_html', 'file', 'image', 'url', 'textarea', 'richtext'].includes(this.parent.converted_forms.byFieldName(field.Field).type)) {
            return false
        }
        if(this.parent.converted_forms.byFieldName(field.Field).is_multi_value_mode) {
            return false
        }
        return true
    }

    ngOnInit() {
        // Add default horizontal for layout option, purpose for non-exist option layout
        if(['checkbox', 'radio'].indexOf(this.type) >= 0 && !this.data.raw_data['option']['layout']){
            this.data.raw_data['option']['layout'] = 'horizontal'
        }
        console.log('NGINIT')
        this.currentEditableEle = document.getElementById('CommentExpression');

        if (this.data.raw_data['option']['minutes_interval'] == null) {
            this.data.raw_data['option']['minutes_interval'] = '1';
        }

    }

    ngAfterViewInit(){
        this.currentEditableEle = document.getElementById('CommentExpression');
        this.replaceCurrentEditableHTML()
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('NGCHANGE')
        this.reset();
        this.is_show_old_editable = !this.data.raw_data['option']['editable'];
        this.currentEditableEle = document.getElementById('CommentExpression');
        this.replaceCurrentEditableHTML();
        
        // Initialize copy fields and item table fields for new/temporary fields
        // This ensures proper field relationships are established when dealing with dummy/temporary field IDs
        if (this.data.raw_data['dummy_id']) {
            this.setCopyFromFields();
            this.setItemTableFields();
        }
    }

    getTableName() {
        return 'dataset__' + this.parent.data.raw_data['id']
    }

    onChangeConditionJson($event, key: string) {
        console.log($event)
        let hash = {}
        //if is string
        if (typeof $event.condition_json !== 'string') {
            hash[key] = JSON.stringify($event.condition_json, null, 2)
        } else {
            hash[key] = $event.condition_json
        }
        this.data.setRawData(hash)

    }

    loadRelationTable( init = false ) {
        this._share.getTableInfo(this.data.raw_data['option']['item-table']).subscribe(_table_info => {
            this.selected_relationtable = _table_info
            if (init) {
                //relation table
                this.data.raw_data['option']['relation-fields'].forEach(relation_field => {
                    this.relationFromSelected(relation_field)
                })
            }
        })

    }

    /*
    setDataValueFromDummyValue(force = false) {
        return;
        if (!this.data.raw_data['__default_value'] || force) {
            this.data.raw_data['__default_value'] = this.data.raw_data['option']['default'];
        }
        if (!this.data.raw_data['__fixed_value'] || force) {
            this.data.raw_data['__fixed_value'] = this.data.raw_data['option']['value'];
        }

        this.setDummyFieldAndForm();
    }
     */


    public resetAutoId() {
        if (!confirm('自動採番のカウンターをリセットしますか？\nリセット後は1から採番が開始されます。')) {
            return;
        }

        const dataset_id = this.parent.data.raw_data['id'];
        const field_id = this.data.raw_data['id'];

        this._connect.post('/admin/table/reset-auto-id', {
            dataset_id: dataset_id,
            field_id: field_id
        }).subscribe(
            (response: any) => {
                if (response && response.error) {
                    this.toasterService.error(response.error);
                    return;
                }
                this.toasterService.success('カウンターをリセットしました');
            },
            (error) => {
                this.toasterService.error('エラーが発生しました');
            }
        );
    }

    setForceOptions() {


    }

    onSelectOtherTable(data: Data, $event) {
        data.raw_data['option']['label-fields'] = ['id'];
        this._share.loadTableFields(data.raw_data['option']['item-table'])
        //this.loadTableFields(data['option']['item-table']);
        if (this.isDivisionOrAdminTable()) {
            this.data.raw_data['option']['is_child_form'] = null;
        }
        this.setCopyFromFields()
        this.setDisplayConditionFromFields();
        this.setDummyFieldAndForm()
        this.setItemTableFields();
    }

    /*
    private isRelationField(){
        return this.type === 'relation_table'
    }
     */

    onSelectRelationTable(data: Data, $event) {
        //this._share.loadTableFields(data.raw_data['option']['item-table'])
        this.loadRelationTable()
    }

    isDivisionOrAdminTable() {
        return ['admin', 'division'].indexOf(this.data.raw_data['option']['item-table']) >= 0;
    }


    getTablenameFromTable(table) {
        for (const key of Object.keys(this._share.exist_table_a)) {
            const exist_table: TableInfo = this._share.exist_table_a[key];
            if (exist_table.table === table) {
                return exist_table.getLabel()
            }
        }

        return null;
    }

    setType(type: string) {
        this.type = type

        this.clearValue();
        this.setDummyFieldAndForm()

    }

    setMinutesInterval(minutes_interval) {
        this.clearValue();
        this.setDummyFieldAndForm()
    }

    setDummyFieldAndForm() {
        this._connect.post('/admin/get-dummy-form', {
            'type': this.type,
            'custom_field': this.data.raw_data['option']
        }).subscribe((result) => {
            this.dummy_field = result['form']['field'];
            this.dummy_form = result['form'];
        });

        if (this.data.raw_data['option']['relation-fields']) {
            this.data.raw_data['option']['relation-fields'].forEach((copy_field) => {
                if (copy_field['to']) {
                    this.relationToSelected(copy_field)
                }
            })
        }

        if (this.data.raw_data['option']['copy-fields']) {
            if (this.table_grant_a.indexOf(this.data.raw_data['option']['item-table']) === -1) {
                this._connect.post('/admin/table/grant/' + this.data.raw_data['option']['item-table'], {}).subscribe(
                    (data) => {
                        if (data.view_grant == false) return;
                        this.table_grant_a.push(this.data.raw_data['option']['item-table']);
                        this.data.raw_data['option']['copy-fields'].forEach((copy_field) => {
                            if (copy_field['from']) {
                                this.copyFromSelected(copy_field);
                            }
                        });
                    }
                );
            } else {
                this.data.raw_data['option']['copy-fields'].forEach((copy_field) => {
                    if (copy_field['from']) {
                        this.copyFromSelected(copy_field);
                    }
                });
            }
        }

        if (this.data.raw_data['option']['display-condition-fields']) {
            this.data.raw_data['option']['display-condition-fields'].forEach((copy_field) => {
                if (copy_field['select_other_table_field']) {
                    this.displayFieldSelectOtherTableFieldSelected(copy_field)
                }
            })
        }
        if(this.type == "time"){
            const interval = this.data.raw_data['option']['minutes_interval'];
            if (interval === undefined || interval === "" || isNaN(Number(interval))) {
                this.data.raw_data['option']['minutes_interval'] = "1";
            }
        }
    }

    getField(field_name) {
        const field = {...this.dummy_field};
        field['Field'] = field_name;
        return field;
    }

    getForm(field_name) {
        const form = new Form(this.dummy_form, null, this.data.raw_data['type']);
        form.is_dummy_form = true;
        form.field = this.getField(field_name);
        return form;
    }

    clearOptionValue(key) {
        delete this.data.raw_data['option'][key];
    }

    clearValue(key = 'value') {
        delete this.data.raw_data['option'][key]
    }

    onChange($event) {
        let value = $event.value
        if (this.type == 'number' && value !== '') {
            value = Number(value)
        }
        if ($event.field_name == '__default_value') {
            if (this.data.raw_data['type'] === 'year_month') {
                // For 'year_month' type fields
                if (value || $event.tmp_year && $event.tmp_year.toString().length == 4) {
                    this.data.raw_data['option']['default'] = value ? value : $event.tmp_year;
                }
                if('tmp_year' in $event && $event.tmp_year === null) {
                    this.data.raw_data['option']['default'] = null;
                }
            } else {
                // For other types of fields
                this.data.raw_data['option']['default'] = value;
            }

        } else if ($event.field_name == '__fixed_value') {
            this.data.raw_data['option']['value'] = value;

        } else if($event.field_name == '__child_default_value'){
            this.data.raw_data['option']['child_default_condition'][$event.data_index].value = $event.value
        } else {
            this.data.raw_data[$event.field_name] = value;
        }
        console.log(this.data, 'how are you')
    }


    isAdd() {
        return !this.data.raw_data['id'];
    }

    showChildField(relation_field) {
        relation_field['use_child_field'] = true;
        this._connect.post('/admin/get/child/field/' + relation_field['from'], {}).subscribe(
            (data) => {
                this.child_table_fields[relation_field['from']] = data['fields']
            }
        )
    }


    addCopyField(): void {
        if (!this.data.raw_data['option']['copy-fields']) {
            this.data.raw_data['option']['copy-fields'] = [];
        }
        this.data.raw_data['option']['copy-fields'].push({'from': '', 'to': '', 'is_auto_reflect': true})
    }

    addCopyToRelationField(): void {
        if (this.data.raw_data['option']['copy_to_relation_fields'] === undefined) {
            this.data.raw_data['option']['copy_to_relation_fields'] = [];
        }
        this.data.raw_data['option']['copy_to_relation_fields'].push({
            'from': '',
            'to': ''
        });
    }

    addDisplayConditionField(): void {
        if (!this.data.raw_data['option']['display-condition-fields']) {
            this.data.raw_data['option']['display-condition-fields'] = [];
        }
        this.data.raw_data['option']['display-condition-fields'].push({'select_other_table_field': '', 'compare_field': '', 'type': 'eq'})
    }

    addRelationField(): void {
        if (!this.data.raw_data['option']['relation-fields']) {
            this.data.raw_data['option']['relation-fields'] = [];
        }
        this.data.raw_data['option']['relation-fields'].push({ 'from': '', 'to': '', 'condition': 'eq' })
    }

    setCopyFromFields(): void {

        this.copy_from_field_a = []
        if (!this.data.raw_data['option']['item-table']) {
            return;
        }
        this._share.getTableInfo(this.data.raw_data['option']['item-table']).subscribe(table_info => {
            if (table_info) {
                const no_copy_fields = ['google_calendar', 'current_at']
                console.log('copy from set')
                const forms: Array<Form> = table_info.forms.getArray();
                this.copy_from_field_a = forms.filter((form: Form) => form.original_type !== 'fixed_html' && !no_copy_fields.includes(form.field['Field'])).map((form: Form) => form.field)
            }
        })
    }

    setDisplayConditionFromFields(): void {

        this.display_condition_from_field_a = []
        if (!this.data.raw_data['option']['item-table']) {
            return;
        }
        this._share.getTableInfo(this.data.raw_data['option']['item-table']).subscribe(table_info => {
            if (table_info) {
                console.log('display condition')
                const forms: Array<Form> = table_info.forms.getArray();
                this.display_condition_from_field_a = forms.filter((form) => {
                    return form.original_type === 'select_other_table';
                }).map((form: Form) => {
                    return form.field
                })
            }
        })
    }


    public table_grant_checked = false;
    getItemTableFields() {

        if (!this.table_grant_checked) {
            this.table_grant_checked = true;
            this._connect.post('/admin/table/grant/' + this.data.raw_data['option']['item-table'], {}).subscribe(
                (data) => {
                    if (data.view_grant == false) return;
                    this.setItemTableFields();
                    return this.item_table_fields;
                }
            )
        }
    }

    setItemTableFields(): void {

        if (!this.data.raw_data['option']['item-table']) {
            return;
        }
        this._share.getTableInfo(this.data.raw_data['option']['item-table']).subscribe(table_info => {
            if (table_info) {
                const forms: Array<Form> = table_info.forms.getArray();
                this.item_table_fields = forms.filter((form) => {
                    return form.original_type !== 'fixed_html';
                }).map((form: Form) => {
                    let field = form.field;
                    field['is_child_form'] = form.is_child_form;
                    return field
                })

            }
        })
    }


    //ルックアップ
    public copyFromSelected(copy_field) {
        if (this.table_grant_a.indexOf(this.data.raw_data['option']['item-table']) === -1) {
            console.log('copy from set')
            this._connect.post('/admin/table/grant/' + this.data.raw_data['option']['item-table'], {}).subscribe(
                (data) => {
                    if (data.view_grant == false) return;
                    this.table_grant_a.push(this.data.raw_data['option']['item-table']);
                    this.getFormAndCheckSame(copy_field);
                }
            )
        } else {
            console.log('copy from set:check same')
            this.getFormAndCheckSame(copy_field);
        }
    }

    getFilteredToOptions(currentField) {
        const selectedToValues = this.data.raw_data['option']['copy-fields']
          .filter(f => f !== currentField && f.to)
          .map(f => f.to);
      
        return this.can_copy_fields_by_from[currentField.from]?.filter(option => !selectedToValues.includes(option.value)) || [];
    }

    private getFormAndCheckSame(copy_field) {
        this._share.getForm(this.data.raw_data['option']['item-table'], copy_field['from']).subscribe(_form => {
            copy_field['from_form'] = _form;
            this.can_copy_fields_by_from[copy_field['from']] = []
            this.checkSame(_form, copy_field['from'], copy_field['to']);
        })
    }

    public checkSame(_form, from_field, current_to_field: string = null) {
        this.parent.converted_forms.getArray().forEach(_form2 => {
            if (_form2.type == 'select_other_table' && current_to_field != _form2.field_name) {
                return true;
            }
            this._share.isSameType(_form, _form2, true).subscribe(_is_same => {
                if (_is_same) {
                    this.can_copy_fields_by_from[from_field].push({
                        'label': _form2.label,
                        'value': _form2.getFieldNameOrTmpUniqueKey()
                    })
                }
            })
        })
        console.log("can_copy_fields_by_from :",this.can_copy_fields_by_from)
    }

    public getSelectOtherTableFields() {

    }


    //表示フィールド
    public displayFieldSelectOtherTableFieldSelected(copy_field) {
        console.log(copy_field)
        this._connect.post('/admin/table/grant/' + this.data.raw_data['option']['item-table'], {}).subscribe(
            (data) => {
                if (data.view_grant == false) return
                this._share.getForm(this.data.raw_data['option']['item-table'], copy_field['select_other_table_field']).subscribe(_form => {
                    if (!_form) {
                        return;
                    }
                    console.log('BASE:' + _form.type)
                    console.log(_form)
                    this.can_compare_form_a_by_field_name[copy_field['select_other_table_field']] = []


                    this.parent.converted_forms.getArray().forEach(_form2 => {
                        this._share.isSameType(_form, _form2, true).subscribe(_is_same => {
                            console.log('COMPARE:' + _form2.type)
                            console.log(_form2)
                            if (_is_same) {
                                this.can_compare_form_a_by_field_name[copy_field['select_other_table_field']].push({
                                    'label': _form2.label,
                                    'value': _form2.getFieldNameOrTmpUniqueKey()
                                })
                            }
                        })
                    })

                })
            }
        )
    }


    //関連テーブル
    public relationToSelected(relation_field): void {
        let _to_form: Form = this.relation_forms.byFieldName(relation_field['to']);
        if (!_to_form) {
            console.log('FORM NOT FOUND')
            debugger;
        }
        if (relation_field['use_custom_value_for_to'] && !relation_field['to_condition']){
            relation_field['to_condition'] = 'gt'
        }
        let _to_type = this.getRelationCompareType(_to_form);
        if (_to_type != relation_field['to_type'] && relation_field['use_custom_value_for_from']){
            relation_field['from'] = '';
        }
        relation_field['to_type'] = _to_type;
        relation_field['to_form'] = _to_form;

    }

    onRelativeCustomChange($event, relation_field) {
        let value = $event.value
        relation_field[$event.field_name] = value
        console.log('how are you', this.data, $event, relation_field)
    }

    public relationFromSelected(relation_field): void {

        if (!this.selected_relationtable) {
            console.log('selected_relationtable TABLE NOT FOUND')
            debugger;
        }
        let _from_form: Form = this.selected_relationtable.forms.byFieldName(relation_field['from']);
        if (!_from_form) {
            console.log('FORM NOT FOUND')
            debugger;
        }
        if (relation_field['use_custom_value_for_from'] && !relation_field['from_condition']) {
            relation_field['from_condition'] = 'lt'
        }
        relation_field['from_type'] = this.getRelationCompareType(_from_form);
        relation_field['from_form'] = _from_form;

    }

    getRelationCompareType(form: Form) {
        if (!form) {
            return null;
        }
        let field_type = form.type;
        if (!!form.original_type) {
            field_type = form.original_type;
        }


        if (field_type == 'number') {
            return 'number'
        }
        if (field_type == 'calc') {
            // data以外の場合も条件分岐する依頼がくるかも
            if(form['calc_result_type'] == 'date') {
                return 'date'
            } else if(form['calc_result_type'] == 'text') {
                return 'text'
            } else {
                return 'number'
            }
        }
        if (['select', 'radio'].indexOf(field_type) >= 0) {
            return 'text'
        }

        if (field_type == 'select_other_table') {
            return 'number'
        }

        return field_type;
    }

    isSameTypeForRelationTable(_form, relation_field) {
        let _from_type = this.getRelationCompareType(_form)
        if (!_from_type || !relation_field['to_type']) {
            return false;
        }

        if(_form.is_multi_value_mode || relation_field['to_form'].is_multi_value_mode) {
            return false
        }

        if(_from_type == 'text') {
            return _from_type === relation_field['to_type'] || relation_field['to_form'].type == 'select_other_table';
        }

        if(_from_type == 'number' && _form.type == 'select') {
            return _from_type === relation_field['to_type'] || relation_field['to_type'] == 'text';
        }

        return _from_type === relation_field['to_type'] //&& _form['is_multi_value_mode'] == relation_field['to_form']['is_multi_value_mode']
    }

    isTmpField(field): boolean {
        return field && field['Field'] && field['Field'].match(/^dummy/)
    }

    delCopyField(i): void {
        this.data.raw_data['option']['copy-fields'].splice(i, 1);
    }

    delDisplayConditionField(i): void {
        this.data.raw_data['option']['display-condition-fields'].splice(i, 1);
    }

    delRelationField(i): void {
        this.data.raw_data['option']['relation-fields'].splice(i, 1);
    }

    addSummaryParam() {
        if (!this.data.raw_data['option']['summary_params']) {
            this.data.raw_data['option']['summary_params'] = [];
        }
        this.data.raw_data['option']['summary_params'].push({'key': '', 'value': ''});
    }


    delSummaryParam(i) {
        this.data.raw_data['option']['summary_params'].splice(i, 1);
    }


    public selected_relationtable: TableInfo = null;

    getSelectedRelationTableForms(): Array<Form> {
        /*
        let table_info: TableInfo = this._share.getTableInfoByTableName(this.data.raw_data['option']['item-table']);
         */
        if (!this.selected_relationtable) {
            return [];
        }
        return this.selected_relationtable.forms.getArray().filter((form: Form) => {
            if (form.original_type != 'fixed_html') {
                return true;//!form.is_multi_value_mode;
            }
        });
    }

    addOptionValue(key: string, val = {}) {
        if (!this.data.raw_data['option'][key]) {
            this.data.raw_data['option'][key] = [];
        }
        this.data.raw_data['option'][key].push(val)

    }

    delOptionValue(key: string, i: number) {
        this.data.raw_data['option'][key].splice(i, 1);
    }

    addRelationTableCondition() {
        this.data.conditions.addCondition()
        //this.addOptionValue('condition_a');
    }

    addDefaultCondition() {
        if (!this.data.raw_data['option']['child_default_condition']) {
            this.data.raw_data['option']['child_default_condition'] = [{'condition': '', 'index': 0, 'value': ''}];
        } else {
            this.data.raw_data['option']['child_default_condition'].push({'condition': '', 'index': 0, 'value': ''});
        }
    }

    deleteDefaultCondition(i: number) {
        this.data.raw_data['option']['child_default_condition'].splice(i, 1);
    }

    dropRelationTableCondition(event) {
        moveItemInArray(this.data.raw_data['option']['condition_a'], event.previousIndex, event.currentIndex);
    }

    dropRelationTableShowField(event){
        moveItemInArray(this.data.raw_data['option']['relation_table_show_fields'], event.previousIndex, event.currentIndex);
    }

    delRelationTableCondition(i: number) {
        this.data.conditions.deleteCondition(i);
        this.data.raw_data['option']['condition_a'] = this.data.conditions.condition_a.map(c => c.toArray())
    }

    delCopyToRelationField(i): void {
        this.data.raw_data['option']['copy_to_relation_fields'].splice(i, 1);
    }

    onRelationTableConditionChanged(cond_index: number, $event): void {
        let condition: Condition = $event.condition;
        if (!this.data.raw_data['option']['condition_a']) {
            this.data.raw_data['option']['condition_a'] = [];
        }
        this.data.raw_data['option']['condition_a'][cond_index] = condition.toArray();
    }

    addRelationTableViewField() {
        this.addOptionValue('relation_table_show_fields');
    }

    delRelationTableViewField(i: number) {
        this.data.raw_data['option']['relation_table_show_fields'].splice(i, 1);

    }

    onUniqueCheckChange($event) {
        let checked = $event.target.checked ? 'true' : 'false';
        this.data.raw_data['is_unique'] = checked;
        //固定値は不可
        delete this.data.raw_data['option']['value'];
    }

    /**
     * 項目が変更された時
     */
    changeSwitchNum() {
        if (this.data.raw_data['option']['switch_num'] == 'integer') {
            delete this.data.raw_data['option']['decimal_places'];
        } else {
            this.data.raw_data['option']['decimal_places'] = 1;
        }
    }

    /**
     * 20240510 Kanazawa 追加
     * 計算値の種類が変更された時のイベント処理
     */
    onChangeCalcResultType() {
        this.resetCalcOptions();
    }

    /**
     * 20240510 Kanazawa 追加
     * 計算値の種類のオプションデータをクリア
     */
    resetCalcOptions() {
        // 数値の形式 選択項目はデフォルト値に戻す
        this.data.raw_data['option']['switch_num'] = 'integer';
        // 桁数　changeSwitchNum()の仕様に則ってdeleteしている
        delete this.data.raw_data['option']['decimal_places'];
        // 桁区切り
        delete this.data.raw_data['option']['num_separator'];
        // 値の重複
        delete this.data.raw_data['is_unique'];
        // 単位記号表示
        delete this.data.raw_data['option']['num_unit'];
        delete this.data.raw_data['option']['num_unit_order'];
        // フォーマット
        delete this.data.raw_data['option']['is_use_date_format'];
        delete this.data.raw_data['option']['date-format'];
    }

    onConditionChanged(cond_index: number = null, $event = null) {

        if (cond_index === null) {
            this.data.raw_data['option']['condition_a'] = this.data.conditions.condition_a.map(c => c.toArray())
            return;
        }

        let condition: Condition = $event.condition;
        if (!this.data.raw_data['option']['condition_a']) {
            this.data.raw_data['option']['condition_a'] = [];
        }
        this.data.raw_data['option']['condition_a'][cond_index] = condition.toArray();

    }

    changeSetStyle(list_or_detail) {
        console.log(this.data.raw_data['option']['set_' + list_or_detail + '_style'])
        if (this.data.raw_data['option']['set_' + list_or_detail + '_style']) {
            if (Object.keys(this.data.raw_data['option']).indexOf(list_or_detail + '_style') == -1) {
                this.data.raw_data['option'][list_or_detail + '_style'] = {
                    'fontSize.px': 14,
                    'color': '#000',
                    'fontWeight': 'normal',
                    'text-align': 'left'
                }
            }
        }

    }


    changeTextType() {
        if (this.data.raw_data['type'] === 'url') {
            //urlの場合は重複機能無し。（TEXTのため）

            this.data.raw_data['is_unique'] = 'false'
            delete this.data.raw_data['option']['index']

        }
    }

    onChangeChildForm() {
        this.data.raw_data['option']['show-list'] = !this.data.raw_data['option']['is_child_form']
        if (this.data.raw_data['option']['is_child_form']) {
            this.data.raw_data['option']['required'] = false
        }
    }


    onChangeSortParams($event) {
        this.data.sort_params = $event.value
        this.data.raw_data['option']['sort_params'] = $event.value.map(s => s.toArray())
    }

    mentionSelect(event) {
        return '{' + event.Comment + '}';
    }

    public currentEditableEle;
    public mentionItemSelected :boolean = false;

    handleNextWeekDay(input) {
        const nextWeekDayRegex = /nextWeekDay\(([^\)]+)\)/i;
        const isMatchNextWeekDay = input.match(nextWeekDayRegex);

        if (isMatchNextWeekDay && isMatchNextWeekDay[1] ){
            // Force to set calc_result_type to date if nextWeekDay function is used
            this.data.raw_data['option']['calc_result_type'] = "date";
        }

        return input;

    }

    handleContentEditableChange (event){
        this.currentEditableEle = event.target;
        return this.handleNextWeekDay(this.currentEditableEle.innerText.replace(/\u00a0/g, ''));
    }

    handleContentEditableOnPaste (event){
        this.currentEditableEle = event.target;
        setTimeout(()=>{
            this.mentionItemSelected=true;
            this.handelMentionSelectClose();
        },500)
    }
    handleContentEditableFocus (event){
        this.currentEditableEle = event.target;
        let innerHTML = this.currentEditableEle.innerHTML;
        if (this.currentEditableEle.lastElementChild && !this.currentEditableEle.lastElementChild.classList.contains('auto-cursor')) {
            this.currentEditableEle.innerHTML = `${innerHTML}<span class='auto-cursor'></span>`;
        }
    }
    handelMentionItemSelected(event){
        console.log(event);
        this.mentionItemSelected = true;
    }
    handelMentionSelectClose (){

        if (!this.mentionItemSelected) return this.currentEditableEle.innerText.replace(/\u00a0/g, ' ');
        this.mentionItemSelected = false;
        let innerText = this.currentEditableEle.innerText.replace(/\{[\w|\p{L}]*@/ugi, '').replace(/@\{/gi, '{')//.replaceAll(/<\/?span[^>]*>/gi, '');
        this.currentEditableEle.innerHTML = this.handleFormatEditableContent(innerText);
        let sel = window.getSelection();
        sel.selectAllChildren(this.currentEditableEle.lastChild);
        sel.collapseToEnd();
        return this.currentEditableEle.innerText.replace(/\u00a0/g,' ');
    }

    handleFormatEditableContent (val = "{ID}") {
        //added :: for SUM({明細::金額})
        //added \w for any English word
        //added \p{L} for any Unicode word
        val = val.replace(/\{[\w|\p{L}|::]+\}/gmu,(matches)=>{
            console.log(matches)
            return `<div class="tag" contenteditable='false'>${matches}</div>`;
        })
        //added auto-cursor node for selection
        val    += `<span class='auto-cursor'></span>`;
        return val;
    }

    replaceCurrentEditableHTML() {
        if (this.currentEditableEle) {
            this.currentEditableEle.innerHTML = this.handleFormatEditableContent(this.data.raw_data['option']['expression'])
        } else if (this.type == 'calc'){
            setTimeout(()=>{
                this.currentEditableEle = document.getElementById('CommentExpression');
                if(this.currentEditableEle)this.currentEditableEle.innerHTML = this.handleFormatEditableContent(this.data.raw_data['option']['expression'])
            },500)
        }
    }



    onAutoReflectChange(event: Event, index: number) {
        // チェックを外す時
        if (this.data.raw_data['option']['copy-fields'][index]['is_auto_reflect']) {
            if (!confirm('自動反映を消す場合、データも空になるため新たにデータを入れる必要があります。よろしいですか？')) {
                event.preventDefault();
            } else {
              this.data.raw_data['option']['copy-fields'][index]['is_auto_reflect'] = true;
            }
        }else {
            this.data.raw_data['option']['copy-fields'][index]['is_auto_reflect']= true;
        }
    }

    isLabelFields(){
        if (this.data.raw_data['option']['item-table'] === 'admin') {
            return this.item_table_fields.filter(field => field.Field !== 'google_calendar' && field.Field !== 'current_at' && field.Field !== 'division_ids');
        }
        return this.item_table_fields.filter(field => !field.is_child_form);
    }

    public copyToRelationFromSelected(copy_field): void {
        if (copy_field['from']) {
            const from_field = copy_field['from'];
            // 選択されたフィールドのタイプを取得
            const field = this.relation_fields.find(f => f.Field === from_field);
            if (field) {
                copy_field['from_type'] = field.Type;
            }
        }
    }

    /**
     * AIからのフィールド編集結果を処理
     * Process field edit results from AI
     * @param data AIからの応答データ
     */
    /**
     * AIからのフィールド編集結果を処理
     * Process field edit results from AI
     * @param data AIからの応答データ
     */
    handleFieldEditFromAi(data: any): void {
        console.log('handleFieldEditFromAi called with data:', JSON.stringify(data, null, 2));
        
        if (!data || !data.data || !data.data.fields) {
            this.toastr.error('AIからの応答形式が不正です');
            return;
        }
        
        const fields = data.data.fields;
        let processedCount = 0;
        
        console.log('Processing fields:', JSON.stringify(fields, null, 2));
        console.log('Current itemData.fields:', JSON.stringify(this.itemData.fields, null, 2));
        
        for (const field of fields) {
            if (field.type === 'create') {
                const x = field.field_hash.edit_component_x_order || 1;
                const y = field.field_hash.edit_component_y_order || this.getMaxYOrder() + 1;
                
                this.resolveCoordinateCollision(x, y);
                
                field.field_hash.edit_component_x_order = x;
                field.field_hash.edit_component_y_order = y;
                
                console.log(`Adding field with type: ${field.field_hash.type}, name: ${field.field_hash.name}`);
                
                const fieldCopy = JSON.parse(JSON.stringify(field.field_hash));
                this.itemData.fields.push(fieldCopy);
                
                const datasetFields = this.data.getChildDataAry('dataset_field');
                if (datasetFields) {
                    const childTableInfo = this.data.getChildTableInfoByTable('dataset_field');
                    if (childTableInfo) {
                        this.data.setChildData(childTableInfo, fieldCopy);
                        console.log('Added new field to dataset_field array');
                    } else {
                        console.log('Warning: dataset_field table info not found');
                    }
                } else {
                    console.log('Warning: dataset_field array not accessible');
                }
                
                processedCount++;
            } else if (field.type === 'update') {
                const index = this.itemData.fields.findIndex(f => f.id === field.field_hash.id);
                if (index !== -1) {
                    const originalType = this.itemData.fields[index].type;
                    if (field.field_hash.type !== originalType) {
                        this.toastr.error(`フィールドタイプの変更はできません: ${originalType} → ${field.field_hash.type}`);
                        field.field_hash.type = originalType;
                    }
                    
                    if (field.field_hash.edit_component_x_order !== this.itemData.fields[index].edit_component_x_order ||
                        field.field_hash.edit_component_y_order !== this.itemData.fields[index].edit_component_y_order) {
                        this.resolveCoordinateCollision(
                            field.field_hash.edit_component_x_order, 
                            field.field_hash.edit_component_y_order
                        );
                    }
                    
                    const updatedField = {
                        ...JSON.parse(JSON.stringify(this.itemData.fields[index])),
                        ...JSON.parse(JSON.stringify(field.field_hash))
                    };
                    
                    console.log(`Updating field with type: ${updatedField.type}, name: ${updatedField.name}`);
                    this.itemData.fields[index] = updatedField;
                    
                    const datasetFields = this.data.getChildDataAry('dataset_field');
                    if (datasetFields && datasetFields.length > 0) {
                        const childIndex = datasetFields.findIndex(f => f.raw_data['id'] === field.field_hash.id);
                        if (childIndex !== -1) {
                            const childTableInfo = this.data.getChildTableInfoByTable('dataset_field');
                            if (childTableInfo) {
                                this.data.setChildData(childTableInfo, updatedField, childIndex);
                                console.log('Updated existing field in dataset_field array');
                            }
                        }
                    }
                    
                    processedCount++;
                } else {
                    this.toastr.error(`更新対象のフィールドが見つかりません: ${field.field_hash.id}`);
                }
            }
        }
        
        console.log('After processing, itemData.fields:', JSON.stringify(this.itemData.fields, null, 2));
        const datasetFields = this.data.getChildDataAry('dataset_field');
        if (datasetFields && datasetFields.length > 0) {
            console.log('After processing, dataset_field array:', datasetFields);
        }
        
        if (processedCount > 0) {
            this.toastr.success(`${processedCount}個のフィールドを処理しました`);
        }
        
        this.changeDetectorRef.detectChanges();
    }

    /**
     * 新規データセット作成ページかどうかを判定
     * Determine if this is the new dataset creation page
     * @returns {boolean} 新規データセット作成ページの場合はtrue
     */
    isNewDatasetPage(): boolean {
        const url = window.location.pathname;
        return url.includes('/admin/dataset/edit/new');
    }
    
    /**
     * 現在の最大y座標を取得
     * Get the maximum y coordinate of existing fields
     * @returns {number} 最大y座標
     */
    private getMaxYOrder(): number {
        if (!this.itemData || !this.itemData.fields || this.itemData.fields.length === 0) {
            return 0;
        }
        
        return Math.max(...this.itemData.fields.map(field => 
            field.edit_component_y_order ? parseInt(field.edit_component_y_order) : 0
        ));
    }
    
    /**
     * 座標の衝突を解決する
     * Resolve coordinate collision by shifting existing fields
     * @param x x座標
     * @param y y座標
     */
    private resolveCoordinateCollision(x: number, y: number): void {
        const collidingFields = this.itemData.fields.filter(field => 
            field.edit_component_x_order == x && field.edit_component_y_order == y
        );
        
        if (collidingFields.length > 0) {
            for (const field of collidingFields) {
                field.edit_component_x_order = parseInt(field.edit_component_x_order) + 1;
                
                if (field.edit_component_x_order >= 5) {
                    field.edit_component_y_order = parseInt(field.edit_component_y_order) + 1;
                    field.edit_component_x_order = 1;
                    
                    this.resolveCoordinateCollision(1, field.edit_component_y_order);
                } else {
                    this.resolveCoordinateCollision(field.edit_component_x_order, field.edit_component_y_order);
                }
            }
        }
    }
}

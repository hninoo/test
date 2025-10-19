import {Objectable} from './Objectable';
import {Form} from './Form';
import {CustomFilter} from './Filter/CustomFilter';
import {SharedService} from '../services/shared';
import {Observable} from 'rxjs/Observable';
import * as cloneDeep from 'lodash/cloneDeep';
import {TableInfo} from './TableInfo';
import {Connect} from '../services/connect';

export class Condition extends Objectable {
    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }

    get select_condition(): string {
        return this._select_condition;
    }

    set select_condition(value: string) {
        this._select_condition = value;
    }

    get id(): string {
        return this._id;
    }


    private _type: string = 'field'; //field or select
    private _select_condition: string = ''; //in_creator_division,in_creator_division_include_parent

    private _id: string = null;
    private _and_or: string = 'and';
    private _condition: string; //inc / notinc / etc...
    private _value: string;
    private _field: string = null;
    private _use_variable: boolean = false;
    private _use_dynamic_condition_value: boolean = false;
    private _date_relative_value: boolean = false;
    private _priority_date_relative_value: boolean = false;
    private _list_date_time_search_with_no_time: boolean = false;
    private _sub_fields: Array<{ field: string, table: string }> = [];


    //他のテーブルに含まれる時用の、テーブル選択
    private _inc_table: string = null;
    private _inc_field: string = null;
    //他のテーブルに含まれる時用の、フィルタ
    private _inc_filter_id: number = null;


    private _variable_id: number = null;
    private _view_value: string = null;
    static readonly DATE_CURRENT: string = 'current';

    public error_message: string = null;


    //NEED EXTRA LOAD
    private _target_table_info: TableInfo = null;
    private _target_form: Form = null;
    private _field_label: string = null;

    constructor(condition: string, field: string, value: string, and_or: string = 'and', use_variable: boolean = false, inc_table: string = null, inc_field: string = null, inc_filter_id: number = null, list_date_time_search_with_no_time: boolean = true, use_dynamic_condition_value: boolean = null, date_relative_value: boolean = false, priority_date_relative_value: boolean = false) {
        super();
        this._id = this.getId()
        this._condition = condition;
        this._value = value;
        this._and_or = and_or;
        this._field = field;

        this._inc_table = inc_table
        this._inc_field = inc_field
        this._inc_filter_id = inc_filter_id

        this._use_variable = use_variable
        this._use_dynamic_condition_value = use_dynamic_condition_value
        this._date_relative_value = date_relative_value
        this._priority_date_relative_value = priority_date_relative_value
        if (use_variable) {
            this.value = null;
            this._variable_id = parseInt(value);
        }
        this._list_date_time_search_with_no_time = list_date_time_search_with_no_time
    }

    clone_by(from_condition: Condition) {
        for (const key of Object.keys(from_condition)) {
            this[key] = from_condition[key]
        }
    }

    setSelectCondition(select_condition: string) {
        this.field = null;
        this.condition = null;
        this.type = 'select'
        this.select_condition = select_condition
    }

    validate(): boolean {
        if (!this.condition) {
            this.error_message = '含む・含まない等の条件を指定してください'
            return false;
        }

        if (this.use_variable) {
            if (!this.variable_id) {
                this.error_message = '変数を設定して下さい'
                return false;
            }
        } else if (this.isIncludeTableOrNotInclude()) {
            if (this.inc_table != null) {
                if (!this.inc_field) {
                    this.error_message = 'テーブルの項目を指定して下さい'
                    return false;
                }
            }

        } else if (this.condition !== 'null' && this.condition !== 'not_null' && !this.isTermConditionValue()) {
            if (this.value == '' || this.value == null) {
                this.error_message = '条件の値を設定してください'
                return false;
            }
        }

        return true;
    }

    toArray() {
        let hash = {};
        hash['field'] = this.field;
        hash['value'] = this.value;
        hash['condition'] = this.condition;
        hash['and_or'] = this.and_or;
        hash['type'] = this.type;
        hash['select_condition'] = this.select_condition;
        hash['use_dynamic_condition_value'] = this.use_dynamic_condition_value;
        hash['date_relative_value']        = this.date_relative_value;
        hash['inc_table'] = this.inc_table;
        hash['inc_field'] = this.inc_field;
        hash['inc_filter_id'] = this.inc_filter_id;
        hash['subfield_a'] = this._sub_fields
        return hash;
    }

    set and_or(value: string) {
        this._and_or = value;
    }

    set condition(value: string) {
        if (value === 'null') {
            this.value = null;
        }
        this._condition = value;
    }

    set value(value: string) {
        this._value = value;
    }

    set field(value: string) {
        this._field = value;
    }

    get field(): string {
        return this._field;
    }


    get and_or(): string {
        return this._and_or;
    }

    get condition(): string {
        return this._condition;
    }

    get value(): string {
        return this._value;
    }


    get use_variable(): boolean {
        return this._use_variable;
    }

    set use_variable(value: boolean) {
        this._use_variable = value;
    }

    get use_dynamic_condition_value(): boolean {
        return this._use_dynamic_condition_value;
    }

    set use_dynamic_condition_value(value: boolean) {
        this._use_dynamic_condition_value = value;
    }

    get date_relative_value(): boolean {
        return this._date_relative_value;
    }

    set date_relative_value(value: boolean) {
        this._date_relative_value = value;
    }
    get priority_date_relative_value(): boolean {
        return this._priority_date_relative_value;
    }

    set priority_date_relative_value(value: boolean) {
        this._priority_date_relative_value = value;
    }

    get list_date_time_search_with_no_time(): boolean {
        return this._list_date_time_search_with_no_time;
    }

    set list_date_time_search_with_no_time(value: boolean) {
        this._list_date_time_search_with_no_time = value;
    }

    get variable_id(): number {
        return this._variable_id;
    }

    set variable_id(value: number) {
        this._variable_id = value;
    }


    get inc_table(): string {
        return this._inc_table;
    }

    set inc_table(value: string) {
        this._inc_table = value;
    }

    get inc_filter_id(): number {
        return this._inc_filter_id;
    }

    set inc_filter_id(value: number) {
        this._inc_filter_id = value;
    }

    get inc_field(): string {
        return this._inc_field;
    }

    set inc_field(value: string) {
        this._inc_field = value;
    }

    get sub_fields(): Array<{ field: string; table: string }> {
        return this._sub_fields;
    }


    get view_value(): string {
        return this._view_value;
    }

    set sub_fields(value: Array<{ field: string; table: string }>) {
        this._sub_fields = value;
    }

    //need load form

    get target_form(): Form {
        return this._target_form;
    }


    set target_form(value: Form) {
        this._target_form = value;
    }

    get target_table_info(): TableInfo {
        return this._target_table_info;
    }

    get field_label(): string {
        return this._field_label;
    }

    loadExtraDetail(table_info: TableInfo, _share: SharedService, _connect: Connect) {
        this.loadConditionFieldLabel(table_info, _share)
        this.loadTargetTableInfoAndForm(table_info, _share, _connect);
    }


    private loadTargetTableInfoAndForm(table_info: TableInfo, _share: SharedService, _connect: Connect) {
        let condition = this;

        this._target_table_info = table_info;

        if (condition.sub_fields.length > 0) {
            _share.getTableInfo(condition.sub_fields[condition.sub_fields.length - 1]['table']).subscribe(_table_info => {
                let _field = condition.sub_fields[condition.sub_fields.length - 1]['field']
                if (_field == 'workflow_status') {
                    this._target_form = this.getDummyForm()
                    this.loadViewValue(null, null, _connect)
                    console.log('TARGET')
                    console.log(this._target_form)
                    return;
                }
                let _form = _table_info.forms.byFieldName(_field)
                if (_form.item_table) {
                    this.loadViewValue(_form, _table_info, _connect)
                    _share.getTableInfo(_form.item_table).subscribe(_sub_table_info => {
                        this._target_table_info = _sub_table_info
                        this._target_form = _sub_table_info.forms.byFieldName(_form.item_field_name_for_view);
                        console.log(this._target_form)
                    })
                }
            })

        } else if (condition.field.match(/\./)) {
            let table_field = condition.field.split('.')
            let _field = table_field[1]
            _share.getTableInfo(table_field[0]).subscribe(_table_info => {
                this._target_table_info = _table_info
                this._target_form = _table_info.forms.byFieldName(_field)
                this.loadViewValue(this._target_form, this.target_table_info, _connect)

            })

        } else {
            this._target_form = condition.getForm(table_info);
            this.loadViewValue(this._target_form, this.target_table_info, _connect)
        }
    };

    private loadConditionFieldLabel(table_info: TableInfo, _share: SharedService): Observable<string> {
        let condition = this;
        if (condition.isAllField()) {
            this._field_label = 'いずれかの項目'
            return;
        }
        if (condition.isWorkflowStateField()) {
            this._field_label = 'ワークフロー状態'
            return;
        }


        let form = condition.getForm(table_info);
        if (!form) {
            this._field_label = 'ERROR:存在しない項目'
            return;
        }


        if (condition.sub_fields.length > 0) {
            let label = form.label;
            condition.sub_fields.forEach(subfield => {
                _share.getTableInfo(subfield['table']).subscribe(_table_info => {
                    label += 'の' + _table_info.forms.byFieldName(subfield['field']).label
                    this._field_label = label
                })

                this._field_label = label
            })

            return;
        } else {
            this._field_label = form.label
        }

    }


    isIncludeOrNotInclude() {
        return this.condition == 'inc' || this.condition == 'notinc'
    }

    isIncludeTableOrNotInclude() {
        return this.condition == 'include_other_table' || this.condition == 'not_include_other_table'
    }

    isAllField() {
        return this.getLastField() == '_all'

    }

    isWorkflowStateField() {
        return this.getLastField() === 'workflow_status';
    }

    getLastField(): string {
        if (this._sub_fields.length > 0) {
            return this._sub_fields[this._sub_fields.length - 1].field
        }
        return this.field

    }

    isSystemField() {
        return ['created', 'updated', 'id', 'admin_id'].indexOf(this.field) >= 0;
    }

    isSummarizeField() {
        return this.getLastField() && this.getLastField().match(/^y\d+$/);
    }

    isTermConditionValue(): boolean {
        let term_a = ['today',
            'yesterday',
            'tomorrow',
            'this_week',
            'last_week',
            'next_week',
            'this_month',
            'last_month',
            'next_month',
            'this_year',
            'last_year',
            'next_year'
        ]

        return term_a.indexOf(this.condition) >= 0;

    }

    public getDummyForm(): Form {
        let form = new Form({});
        if (this.isWorkflowStateField()) {
            form.createDummyForm(this.getLastField(), 'select')
            form.option = [
                {'value': 'draft', 'label': '下書き'},
                {'value': 'applying', 'label': '申請中'},
                {'value': 'assigned', 'label': '申請中(要確認)'},
                {'value': 'done', 'label': '承認済み'},
                {'value': 'rejected', 'label': '否認'},
                {'value': 'withdraw', 'label': '取り下げ'},
            ];

        } else if (this.isSummarizeField()) {
            form.createDummyForm(this.getLastField(), 'number')

        } else {
            form.createDummyForm(this.getLastField(), 'text')
        }
        return form;

    }

    public getWorkflowJaByValue(value_a): string {
        let hash_a = [
            {'value': 'draft', 'label': '下書き'},
            {'value': 'applying', 'label': '申請中'},
            {'value': 'assigned', 'label': '申請中(要確認)'},
            {'value': 'done', 'label': '承認済み'},
            {'value': 'rejected', 'label': '否認'},
            {'value': 'withdraw', 'label': '取り下げ'},
        ];
        if (!Array.isArray(value_a) && value_a) {
            value_a = [value_a]
        }

        let val_str_ja_a: Array<string> = [];
        value_a.forEach(value => {
            hash_a.forEach(hash => {
                if (hash['value'] === value) {
                    val_str_ja_a.push(hash['label'])
                }

            })
        })

        return val_str_ja_a.join(',');

    }

    public getIncTableFilter(_share: SharedService): Observable<CustomFilter> {


        if (this.isIncludeTableOrNotInclude()) {
            if (this.inc_filter_id) {
                return _share.getTableInfo(this.inc_table).map(table_info => {
                    let filter: CustomFilter = null;
                    if (table_info) {
                        filter = table_info.getFilterById(this.inc_filter_id)
                    }
                    return filter;
                })
            }
        }

        const observer: Observable<CustomFilter> = new Observable((observer) => {
            observer.next(null);
            return {
                unsubscribe() {
                }
            };
        });
        return observer;
    }

    public addSubField(table: string, field: string = 'id') {
        this.sub_fields.push({table: table, field: field})

    }

    public deleteSubField(index: number) {
        //以降全て削除
        this.sub_fields.splice(index, 10000);
    }

    public getCopy() {
        let condition: Condition = cloneDeep(this)
        condition.sub_fields = this.sub_fields
        return condition
    }


    private getTargetTableInfo(table_info: TableInfo): TableInfo {
        if (this.field && this.field.match(/\./)) {
            let child_table_name = this.field.split('.')[0];
            let child_table_info: TableInfo = table_info.getChildTableInfo(child_table_name)
            return child_table_info;
        }
        return table_info;
    }


    private getTargetField() {
        if (this.field && this.field.match(/\./)) {
            return this.field.split('.')[1];
        }
        return this.field;
    }

    public getChildTableName(): string {
        if (!this.isUseChildFormField()) {
            return null;
        }
        let table_field_a = this._field.split('.');
        return table_field_a[0];
    }

    public getForm(table_info: TableInfo) {
        if (!this.getTargetTableInfo(table_info)) {
            return null;
        }
        return this.getTargetTableInfo(table_info).forms.byFieldName(this.getTargetField())
    }

    private loadViewValue(form, table_info: TableInfo, _connect: Connect, value = null): boolean {

        if (!form || ['inc', 'notinc'].indexOf(this.condition) >= 0) {
            if (this.getLastField() == 'workflow_status') {
                this._view_value = this.getWorkflowJaByValue(this.value)
            } else {
                this._view_value = this.value
            }
        } else {

            form.getViewValueForSearch(table_info, _connect, this.value).subscribe(value => {
                this._view_value = value
            });
        }

        return true;

    }

    public isUseChildFormField() {
        return this._field && this._field.match(/\./)
    }

    public getSameTypeForms(table_info: TableInfo, form: Form, _share: SharedService) {
        let list = [];
        table_info.forms.getArray().forEach(_form => {
            form.isSameType(_share, _form).subscribe(flg => {
                if (flg && form.field_name != _form.field_name) {
                    list.push(_form)
                }
            })
        })

        return list;

    }

}

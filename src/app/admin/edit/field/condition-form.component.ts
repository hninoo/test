import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import ToastrService from '../../../toastr-service-wrapper.service';
import {SharedService} from '../../../services/shared';
import {Connect} from '../../../services/connect';
import {ActivatedRoute} from '@angular/router'
import {TableInfo} from '../../../class/TableInfo';
import {Form} from '../../../class/Form';
import {Condition} from '../../../class/Condition';
import {Variable} from '../../../class/Filter/Variable';
import {Observable} from 'rxjs/Observable';
import {CustomFilter} from '../../../class/Filter/CustomFilter';


@Component({
    selector: 'condition-form',
    templateUrl: './condition-form.component.html',
})

export class ConditionFormComponent implements OnInit, OnChanges {
    @Input() table_info: TableInfo = null;

    @Input() table: string;
    @Input() condition_type: string = 'condition';
    @Input() index: number;
    @Input() default_condition: Condition;

    @Input() is_grant_condition_form: boolean = false;
    @Input() grant_permission_type: string = ''; // 権限タイプ（view, edit, add, delete）

    @Input() show_admin_or_division_select = false;
    @Input() show_admin_division_and_fields = false;
    @Input() no_workflow_select = false;
    @Input() use_variable: boolean = false
    @Input() variables: Array<Variable> = [];

    @Input() filter: CustomFilter = null;
    @Input() ignore_type_a: Array<string> = [];
    @Input() ignore_field_name_a: Array<string> = [];

    //arbitrary
    @Input() compare_target_table_info: TableInfo = null
    @Input() target_form_a: Array<Form> = null
    @Input() id_prefix: string = '';

    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Input() disabled: boolean = false;

    //public table_info: TableInfo = null;
    public condition: Condition;
    public condition_subtableinfo_by_table: Object = {}

    private field: {} = {};
    private form: Form;
    private field_name_a: Array<string> = [];

    public loggedin_admin_id_value: string = 'loggedin_admin_id'
    public loggedin_admin_division_id_value: string = 'loggedin_admin_division_id'
    public loggedin_admin_position_id_value: string = 'loggedin_admin_position_id'

    private toasterService: ToastrService;

    private loadInfoInterval = null;

    public p_garget_form_a: Array<Form> = null

    constructor(toasterService: ToastrService, private _share: SharedService, private _connect: Connect, private _route: ActivatedRoute) {
        this.toasterService = toasterService;
    }

    private is_admin_or_division_select() {
        return [this.loggedin_admin_id_value, this.loggedin_admin_division_id_value, this.loggedin_admin_position_id_value].indexOf(this.condition.field) >= 0;

    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('ngChange Condition Form')
        console.log(this.default_condition.type)
        this.ignore_type_a.push('fixed_html');
        if (!this.condition) {
            //this.condition = cloneDeep(this.default_condition);
            if (this.default_condition) {
                this.condition = this.default_condition.getCopy()
            } else {
                this.condition = new Condition('eq', 'id', '1')

            }
        }
        if (changes.table) {
            this.loadTableInfo(true)
        }

        if (this.condition.inc_table && (!this.selected_inc_table || this.selected_inc_table.table != this.condition.inc_table)) {
            this.loadIncTableInfo()
        }
        if (!this.p_garget_form_a && this.target_form_a) {
            this.p_garget_form_a = this.target_form_a
        }

        for (let field of this.getFields(this.table_info)) {
            this.field_name_a.push(field['Field'])
        }

        this.reloadSubtableInfo()
    }

    ngOnInit() {
        console.log('ngINit Condition Form')
        if (this.table_info == null) {
            this.loadTableInfo()
        } else {
            this.setParamByTableInfo(false)
        }
    }

    ngOnDestroy() {
        clearInterval(this.loadInfoInterval)
    }

    isUseTargetForm() {
        return this.target_form_a && this.target_form_a.length > 0
    }

    is_use_p_garget_form_a() {
        return this.p_garget_form_a && this.p_garget_form_a.length > 0
    }

    setDefaultValue() {
        //日付の場合等は、現在時刻をデフォルトにする
        if (this.condition.value === null || this.condition.value == '') {
            const now = new Date();
            if (this.form.original_type === 'boolean') {
                this.condition.value = 'false'
            } else if (['date', 'datetime', 'time'].includes(this.form['type'])){
               this.condition.value = this._share.getDateTimeStringByDate(now, this.form['type']);
            } else {
                return;
            }
            this.onChange();
        }
    }

    private loadTableInfo(fromOnChange = false) {
        if (this.table_info && this.table_info.table == this.table) {
            return;
        }
        this._share.getTableInfo(this.table).subscribe(table_info => {
            this.table_info = table_info;
            if (!this.table_info) {
                console.log('TABLE INFO NOT FOUND')
            }
            this.setParamByTableInfo(fromOnChange)
        })
    }

    private setParamByTableInfo(onchange = false) {
        if (!this.table_info) {
            return;
        }
        if (!this.default_condition) {
            this.condition.field = this.table_info.fields[0].Field;
        }
        if (this.default_condition) {
            this.condition = this.default_condition.getCopy()
        }
        this.setForm(onchange, 1000, false);
        if (!onchange) {
            this.setDefaultValue()
        }
    }

    onChangeValue($event) {
        this.condition.value = $event.value;
        if ($event.form.original_type === 'datetime') {
            this.condition.list_date_time_search_with_no_time = $event.list_date_time_search_with_no_time
        }
        this.condition.date_relative_value = $event?.date_relative_value
        this.condition.priority_date_relative_value = $event?.priority_date_relative_value
        this.onChange()
    }

    changeSetTimeFlg($event) {
        this.onChangeValue($event);
    }

    onChange() {
        this.valueChanged.emit({
            'index': this.index,
            'condition': this.condition
        });
    }

    onChangeTargetFormSelect(selected_form: Form) {
        this.condition.value = selected_form.field['Field']
        this.onChange()
    }

    /**
     * Handles dynamic condition value flag changes
     * Clears field__xxx pattern values when use_dynamic_condition_value becomes false
     * This prevents leftover reference values when dynamic conditions are disabled
     */
    onChangeDynamicConditionValue($event: Event, condition: Condition) {
        // Replace field__xxx pattern with empty string when use_dynamic_condition_value is false
        if (!condition.use_dynamic_condition_value && condition.value) {
            const valueStr = condition.value.toString();
            if (valueStr.indexOf('field__') === 0 || ['updated_admin_id', 'id', 'admin_id'].includes(valueStr)) {
                condition.value = '';
            }
        }
        
        this.onChange();
    }

    showEqual(condition: Condition) {
        if (this.is_admin_or_division_select()) {
            return true;
        }

        if (condition.isAllField()) {
            return false;
        }


        return ['file', 'textarea', 'richtext'].indexOf(this.form['type']) == -1;
    }

    showEmpty(condition: Condition) {
        if (condition.isWorkflowStateField()) {
            return false;
        }
        if (condition.isSystemField()) {
            return false;
        }
        return true;

    }

    showIncludesCon(condition: Condition) {
        if (this.is_admin_or_division_select()) {
            return true;
        }
        if (condition.isWorkflowStateField()) {
            return false;
        }
        if (condition.isAllField()) {
            return true;
        }
        return ['text', 'richtext', 'textarea', 'file', 'email', 'url', 'select_other_table', 'select', 'auto-id'].indexOf(this.form['type']) != -1;
    }

    showGreaterThan(condition: Condition) {
        if (this.is_admin_or_division_select()) {
            //admin_id or division
            return false;
        }
        if (condition.isWorkflowStateField()) {
            return false;
        }
        if (condition.isAllField()) {
            return false;
        }
        return ['number', 'date', 'datetime', 'time', 'calc', 'year_month'].indexOf(this.form['type']) != -1;
    }

    showSelectDate(condition: Condition) {
        if (this.isUseTargetForm()) {
            return false;
        }
        if (this.is_admin_or_division_select()) {
            //admin_id or division
            return false;
        }
        if (condition.isWorkflowStateField()) {
            return false;
        }
        if (condition.isAllField()) {
            return false;
        }
        return ['date', 'datetime', 'time'].indexOf(this.form['type']) != -1;
    }


    setForm(onchange = false, subfield_index = -1, clear_value: boolean = true) {
        //選択された項目以下の選択は全て削除
        this.condition.deleteSubField(subfield_index + 1)

        if (!this.condition.condition) {
            if (this.condition.isAllField()) {
                this.condition.condition = 'inc';
                return;
            }
            if (this.condition.isWorkflowStateField()) {
                this.condition.condition = 'eq';
                return;
            }
        }
        if (this.condition.isAllField() || this.condition.isWorkflowStateField() || this.condition.isSummarizeField()) {
            this.form = this.condition.getDummyForm();
            console.log(this.form)
            return;
        }
        this.getLastSelectedForm().subscribe(_form => {
            let pre_condition: Condition = this.condition.getCopy()
            this.form = _form
            if (this.form) {
                this.field = this.form['field'];
            } else {
                this.field = null;
            }

            if (!this.condition.condition && this.condition.type != 'select') {
                if (this.showEqual(this.condition)) {
                    this.condition.condition = 'eq';
                } else if (this.showIncludesCon(this.condition)) {
                    this.condition.condition = 'inc';
                } else if (this.showGreaterThan(this.condition)) {
                    this.condition.condition = 'gt';
                }
            }
            if (clear_value) {
                this.condition.value = '';
            }
            if ( this.condition_type != 'timing_condition' && (!onchange || !this.condition.value)) {
                this.setDefaultValue()
            }
            if (JSON.stringify(pre_condition) != JSON.stringify(this.condition)) {
                console.log(JSON.stringify(pre_condition))
                console.log(JSON.stringify(this.condition))
                this.onChange()
            }
        })

        if (this.isUseTargetForm()) {
            this.setSametypeTargetForms()
        }
    }

    getFields(table_info) {
        if (!table_info) {
            return [];
        }
        if (this.condition_type == 'condition') {
            return table_info.fields.filter((field) => {
                return this.ignore_type_a.indexOf(table_info.forms.byFieldName(field.Field).type) == -1 && this.ignore_field_name_a.indexOf(field.Field) == -1;
            })
        } else {
            return table_info.fields.filter((field) => {
                return ['date', 'datetime'].indexOf(table_info.forms.byFieldName(field.Field).type) != -1;
            })
        }


    }

    LoogedinAdminValueChanged($event) {
        this.condition.value = $event.admin_id;
        this.onChange();
    }

    LoogedinDivisionValueChanged($event) {
        this.condition.value = $event.division_id;
        this.onChange();
    }

    LoggedinPositionValueChanged($event) {
        console.log('aa', $event);
        this.condition.value = $event.position_id;
        this.onChange();
    }

    isConditionField(table_info: TableInfo, field: Object) {
        if (!table_info.forms.byFieldName(field['Field']) || !table_info.forms.byFieldName(field['Field']).label) {
            return false;
        }
        return ['image'].indexOf(table_info.forms.byFieldName(field['Field'])['type']) == -1 && field['Field'] != 'password';
    }

    isNofield() {
        return this.condition.field != 'id' && !this.field_name_a.includes(this.condition.field) && !this.includeChildTabelField();
    }


    includeChildTabelField() {
        if (!this.table_info || !this.table_info.child_a) {
            return false;
        }

        for (let child of this.table_info.child_a) {
            if (!this.condition || !this.condition.field) continue;
            if (!child || !child.table) continue;

            const checkConditionField = this.condition.field.replace(child.table + '.', '');
            const fields = this.getFields(child);

            if (!fields || !fields.length) continue;

            for (let i = 0; i < fields.length; i++) {
                if (fields[i] && fields[i].Field === checkConditionField) {
                    return true;
                }
            }
        }
        return false;
    }


    //subfield

    getLastSelectedForm(): Observable<Form> {

        const observer: Observable<Form> = new Observable((observer) => {
            if (this.condition.sub_fields.length == 0) {
                let form = this.condition.getForm(this.table_info);
                if (!form) {
                    form = new Form({'tyoe': 'text'});
                }
                observer.next(form)
            } else {
                let sub_field = this.condition.sub_fields[this.condition.sub_fields.length - 1];
                this._share.getTableInfo(sub_field.table).subscribe(table_info => {
                    let form = table_info.forms.byFieldName(sub_field.field);
                    observer.next(form)
                })
            }

            return {
                unsubscribe() {
                }
            };
        });
        return observer;
    }

    resetValue() {
        this.condition.value = '';
    }

    addSubField() {
        this.form = null;
        this.resetValue()

        this.getLastSelectedForm().subscribe(form => {
            this.condition.addSubField(form.item_table)
            this.reloadSubtableInfo()
            this.setForm(true, this.condition.sub_fields.length - 1)
        })


    }


    deleteSubField(i: number) {
        this.resetValue()
        this.condition.deleteSubField(i)
        this.reloadSubtableInfo()
        this.setForm(true, this.condition.sub_fields.length - 1)

    }

    getSearchFieldTableInfo() {


        const observer: Observable<TableInfo> = new Observable((observer) => {
            if (this.condition.sub_fields.length == 0) {
                //１階層目のみ可能
                if (this.condition.isUseChildFormField()) {
                    this._share.getTableInfo(this.condition.getChildTableName()).subscribe(_table_info => {
                        observer.next(_table_info)
                    })
                } else {
                    observer.next(this.table_info);
                }
            } else {

                let subfield = this.condition.sub_fields[this.condition.sub_fields.length - 1];
                observer.next(this.condition_subtableinfo_by_table[subfield.table]);
            }

            return {
                unsubscribe() {
                }
            };
        });
        return observer;
    }

    getSearchForm(): Form {
        return this.form
    }

    getMinNum(): number {
        if (this.isTimingCondition()) {
            return 0;
        }
        if (this.condition.field == 'id') {
            return 1;
        }
        return -Number.MAX_SAFE_INTEGER;
    }

    isTimingCondition() {
        return this.condition_type == 'timing_condition'
    }

    getUserAddedValues() {
        return [
            {value: '{{admin.id}}', label: 'ログインユーザー'}
        ]
    }

    private reloadSubtableInfo() {
        this.condition_subtableinfo_by_table = [];
        if (this.condition && this.condition.sub_fields) {
            this.condition.sub_fields.forEach(obj => {
                if (obj && obj.table) {
                    this._share.getTableInfo(obj.table).subscribe(table_info => {
                        if (table_info) {
                            this.condition_subtableinfo_by_table[table_info.table] = table_info
                        }
                    })
                }
            })
        }
    }

    public isIncludeOtherTable() {
        return ['include_other_table', 'not_include_other_table'].indexOf(this.condition?.condition) >= 0
    }


    public selected_inc_table: TableInfo = null;

    public onSelectTable($event) {
        this.selected_inc_table = null
        this.incTableSelectableFields = []
        this.condition.inc_field = '';
        this.condition.inc_filter_id = null;

        this.loadIncTableInfo()
    }


    public incTableSelectableFields: Array<Object> = []

    public loadInctableSelectableFields() {
        let form_a = this.selected_inc_table.forms.getArray().filter(f => {
            return f.original_type === 'select_other_table' && f.item_table === this.table_info.table

        })

        this.incTableSelectableFields = form_a.map(f => {
            return f.field
        })

    }

    private loadIncTableInfo() {
        this._connect.get('/admin/table/info/' + this.condition.inc_table).subscribe(async (data) => {
            this.selected_inc_table = new TableInfo(data);
            this.loadInctableSelectableFields()
        });

    }

    private setSametypeTargetForms() {
        this.p_garget_form_a = []
        if (!this.target_form_a) {
            return;
        }
        this.target_form_a.forEach(_form => {
            this.form.isSameType(this._share, _form).subscribe(flg => {
                if (flg) {
                    this.p_garget_form_a.push(_form)
                }
            })
        })

    }

    showUseDynamicConditionValue() {
        if (!this.condition) {
            return false;
        }

        return !this.condition.use_variable &&
            !this.isIncludeOtherTable() &&
            this.condition.condition !== 'null' &&
            this.condition.condition !== 'not_null' &&
            this.condition.condition &&
               this.form;
    }

}

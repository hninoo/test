import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Connect} from '../../../services/connect';
import {SharedService} from '../../../services/shared';
import {Form} from '../../../class/Form';
import {Condition} from '../../../class/Condition';
import {TableInfo} from '../../../class/TableInfo';


@Component({
    selector: 'search-field',
    templateUrl: './search-field.component.html',
    styleUrls:['./search-field.component.css'],
})

export class SearchFieldComponent implements OnInit, OnChanges {
    @Input() table_info: TableInfo = null;
    @Input() form: Form = null;
    @Input() is_timing_condition: boolean = false;
    @Input() force_use_textfield: boolean = false;
    @Input() min_num: number = -Number.MAX_SAFE_INTEGER;
    //not use multiple select but use single select
    @Input() simple_form_flg: boolean = false;
    @Input() value: string | Array<string> = null;
    @Input() placeholder: string = null;
    @Input() id_prefix: string = '';

    @Input() ignore_change: boolean = false;

    @Input() condition: Condition = null;
    @Input() disabled: boolean = false;

    @Output() valueChange: EventEmitter<Object> = new EventEmitter();
    @Output() changeSetTimeFlg: EventEmitter<Object> = new EventEmitter();

    public ADMIN_ID_TYPE_LOGGEDIN_ID: string = '{{admin.id}}';

    public admin_id_type: string = '';
    public formType: string;
    public force_use_select: boolean;
    public set_time_flg_by_field: Object = {};
    public date_value: Date = null;
    public field: Object = null;
    //year_month
    public year: number;
    public month: number;

    private options_include_own: Array<any> = [];

    public is_check_current_date: boolean = false;
    public select_date_btn: boolean = false;
    public priority_date_relative_value: boolean = false;
    public fiscal_year: boolean = false;


    private select_date_option: object = {
        'is_str': false,
        'is_number_form': false,
        'value': '0 date',
        'num': 0,
        'type': 'date',
        'unit': '日',
    }

    public id: string = null;


    constructor(private _share: SharedService, private _connect: Connect, private _route: ActivatedRoute) {
    }


    getId() {
        let id = this.id_prefix + this.form.field['Field']
        return id

    }

    ngOnInit() {
        if (this.form) {
            this.formType = this.form.type;
        }
        //force_use_select only used for condition.field == notification_table.table and notification_reminder.table
        if (!this.form && ['notification_table.table', 'notification_reminder.table'].indexOf(this.condition.field) >= 0) {
            this.force_use_select = true;
        }

        this.id = this._share.uniqid()
        this.onInputChanged();

        if (this.value && this.enableSelectDate(this.value.toString())) {
            this.select_date_btn = true;
            this.selectDateOptionChanged(this.value.toString());
        }

        if (this.table_info.table === 'admin') {
            if (this.value === this.ADMIN_ID_TYPE_LOGGEDIN_ID) {
                this.admin_id_type = this.ADMIN_ID_TYPE_LOGGEDIN_ID
            }

        }

        this.force_use_textfield = this.force_use_textfield || ['inc', 'notinc'].indexOf(this.condition?.condition) >= 0;
        this.set_time_flg_by_field[this.field['Field']] = !this.condition?.list_date_time_search_with_no_time


        if (this.form['type'] === 'datetime' && !this.isTimingCondition()) {
            this.value = this._share.getDateTimeStringByDate(this.value, this.form['type']);
        }
        
        this.priority_date_relative_value = this.condition?.priority_date_relative_value || false;

 
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.ignore_change) {
            return;
        }
        if(this.form) this.formType = this.form.type
        console.log(this.table_info)
        this.onInputChanged();
    }

    onInputChanged() {
        let is_include_own_user_select = this.form?.original_type == 'select_other_table' && this.form?.item_table == 'admin'
        this.field = this.form?.field;
        if (!this.field && !this.force_use_select) {
            console.log('no field', 'test');
            return;
        }

        if (this.force_use_select) {
            let options = [];
            this._share.exist_table_a.map(table => {
                options.push({
                    value: table.table,
                    label: table.view_label,
                    view_label: table.view_label
                })
            })
            this.options_include_own = options;
            if (!this.value) {
                this.value = [];
            } else if (!Array.isArray(this.value)) {
                this.value = [this.value];
            }
            return
        }

        if (this.form.field['Field'] == 'workflow_status') {
            this.options_include_own = this.form.option;
            console.log('no workflow', 'test');
            return
        }

        if (!this.table_info) {
            return;
        }

        console.log(this.form.original_type)

        this.form.getSelectOptions(this.table_info, this._connect).subscribe(option_items => {
            let options = option_items
            if (options && options.length > 0 && options[0]['value'] != '{{admin.id}}' && is_include_own_user_select && (this.field['Field'] == 'admin_id' || (this.form.original_type == 'select_other_table' && this.form.item_table === 'admin'))) {
                options.unshift({
                    value: '{{admin.id}}',
                    label: 'ログインユーザー',
                    view_label: 'ログインユーザー',
                })
            }
            if (options && (this.field['Field'] == 'division_id' || (this.form.original_type == 'select_other_table' && this.form.item_table === 'division'))) {
                if (options.filter(e => e.value == '{{division.id}}').length == 0) {
                    options.unshift({
                        value: '{{division.id}}',
                        label: 'ログインユーザーの組織',
                        view_label: 'ログインユーザーの組織',
                    })
                }
            }


            this.options_include_own = options;
        });

        if (this.isDateTimeType()) {
            if (!this.value) {
                this.select_date_btn = false
                this.selectBtnChanged('')

            } else if (this.value == Condition.DATE_CURRENT) {
                this.is_check_current_date = true
            } else {
                this.date_value = new Date(this.value.toString());
            }


            if (this.formType != 'time' && this.value && this.date_value?.toString() == 'Invalid Date'){
                this.select_date_btn = true;
                this.selectDateOptionChanged( this.value.toString() );
            }

            if(this.form.type === 'year_month') {
                if (this.value) {
                    this.setYearMonth()
                }
            }
        } else if (this.isUseNgSelect()) {
            if (!this.value) {
                this.value = [];
            } else if (!Array.isArray(this.value)) {
                this.value = [this.value];
            }
        } 
        // else if (this.form.type === 'year_month') {
        //     if (this.value) {
        //         this.setYearMonth()
        //     }
        // }

    }

    setYearMonth() {
        let value: String = String(this.value);
        const d = new Date(Date.parse(value.toString()));
        this.year = d.getFullYear()
        this.month = d.getMonth() + 1
    }

    /*
    showBeforeDay() {
        return ['date', 'datetime'].indexOf(this.form['type']) != -1;
    }
     */


    isInputFieldCondition() {
        if (!this.form && !this.force_use_select) {
            //allの場合
            return true;
        }
        if(this.force_use_select)return false;
        return ['text', 'email', 'url', 'file', 'textarea', 'richtext', 'auto-id'].indexOf(this.form['type']) >= 0;
    }

    yearMonthChagned() {
        if (this.year && this.month) {
            let _dt = new Date();
            _dt.setFullYear(this.year)
            _dt.setDate(1)
            _dt.setMonth(this.month - 1)

            this.date_value = _dt;
            this.datetimeValueChanged()
        }


    }


    datetimeValueChanged() {

        if (!!this.date_value && !this.is_check_current_date) {
            const value = this._share.getDateTimeStringByDate(this.date_value, this.form['type']);
            if (this.value !== value) {
                this.value = value;
            }
        }
        if (this.value) this.changed();
    }

    changed($event = null) {
        if ($event) {
            this.value = $event.target.value;
        }
        // if (this.formType == 'year_month' && this.value && !this.select_date_btn){
        //     let dt_str = `${this.value}`;
        //     let _dt = new Date(dt_str);
        //     this.year = _dt.getFullYear();
        //     this.month = _dt.getMonth() + 1;
        // }
        this.valueChange.emit({
            'form': this.form,
            'condition': this.condition,
            'field': this.form?.field['Field'],
            'value': this.value,
            'is_inc': this.isInputFieldCondition(),
            'list_date_time_search_with_no_time': this.formType == 'datetime' && !this.set_time_flg_by_field[this.form?.field['Field']] && !this.select_date_btn,
            'date_relative_value' : this.select_date_btn,
            'priority_date_relative_value': this.priority_date_relative_value,
        });
    }

    changedSetTimeFlg() {
        this.changeSetTimeFlg.emit({
            'form': this.form,
            'field': this.form?.field['Field'],
            'value': this.value,
            'is_inc': this.isInputFieldCondition(),
            'list_date_time_search_with_no_time': this.formType == 'datetime' && !this.set_time_flg_by_field[this.form?.field['Field']],
        });

        // Propagate changes to CustomFilter
        if (this.value) this.changed();
    }

    changeUseTime(flg) {
        if (flg) {
            this.value = this.date_value.toISOString().slice(0, 10) + ' 00:00:00';
        } else {
            this.value = this.date_value.toISOString().slice(0, 10);
        }

        this.changed()
    }

    isDateTimeType() {
        let form = this.form;
        return form['type'] == 'datetime' || form['type'] == 'date' || form['type'] == 'time' || form['type'] == 'year_month';

    }

    isTimingCondition() {
        return this.is_timing_condition;
    }

    isDynamicConditionValue() {
        return this.condition && this.condition.use_dynamic_condition_value;
    }


    clearDateValue() {
        this.value = null;
        this.date_value = null;
        this.changed();
    }

    currentDateCheckChanged() {
        if (this.is_check_current_date) {
            this.value = Condition.DATE_CURRENT;
        } else {
            const value = this._share.getDateTimeStringByDate(new Date(), this.form['type']);
            this.value = value;
            this.date_value = new Date(this.value.toString());
        }
        this.changed()
    }

    isUseNgSelect() {
        if(this.force_use_select) return true;
        return ['select', 'select_other_table', 'multi-select', 'checkbox', 'radio', 'table'].indexOf(this.form['type']) >= 0 && !this.force_use_textfield
    }

    isDaysEnabled() {
        let list: Array<string> = [
            'date_ago',
            'date_later',
            'week_ago',
            'week_later',
            'month_ago',
            'month_later',
            'year_ago',
            'year_later'
        ]
        return this.condition && list.includes(this.condition.condition)
    }
    // 検索条件が今日、昨日、明日、今週、先週、来週、今月、先月、来月、今年、去年、来年のときfalseを返す。
    isDaysShow() {
        let list: Array<string> = [
            'today',
            'yesterday',
            'tomorrow',
            'this_week',
            'last_week',
            'next_week',
            'this_month',
            'last_month',
            "next_month",
            "this_year",
            "last_year",
            "next_year",
        ]
        if (this.condition && list.includes(this.condition.condition)) {
            this.value = 'dummy';
            this.changed();
            return true;
        }
        return false;
    }

    selectButtonLeftChanged() {
        this.select_date_option['num'] --;
        let value = `${this.select_date_option["num"]} ${this.select_date_option["type"]}`;
        if ( this.fiscal_year ) value += ' fy';
        this.selectDateOptionChanged(value);
        this.changed()
    }

    selectButtonRightChanged() {
        this.select_date_option['num'] ++;
        let value = `${this.select_date_option["num"]} ${this.select_date_option["type"]}`;
        if (this.fiscal_year) value += ' fy';
        this.selectDateOptionChanged(value);
        this.changed()
    }

    enableSelectDate(value) {
        let anser: boolean = false;
        this.table_info.fields.forEach(val => {
            if (this.condition?.field == val.Field && (val.Type == 'date' || val.Type == 'datetime')) {
                let type: string = '';
                type = value.split(' ', 2)[1];
                let list = ['date', 'week', 'month', 'year'];
                anser = list.includes(type);
            }
        })
        return anser;
    }

    selectDateOptionChanged(value: string) {
        let num, type;

        [num, type] = value?.split(' ', 2);
        // check the type is in the list
        let list = ['date', 'week', 'month', 'year'];
        if (num && type  && !list.includes(type)) {
            // value = `${num} date`;
            type = 'date';
        }

        this.select_date_option['value'] = value;
        this.select_date_option['num'] = num;
        this.select_date_option['type'] = type;
        if (type == 'date') {
            this.select_date_option['unit'] = '日';
        } else if (type == 'week') {
            this.select_date_option['unit'] = '週間';
        } else if (type == 'month') {
            this.select_date_option['unit'] = '月';
        } else if (type == 'year') {
            // check if the value is included fy text
            if (this.value?.toString().indexOf('fy') != -1) {
                this.fiscal_year = true;
                this.select_date_option['unit'] = '期';
            } else {
                this.select_date_option['unit'] = '年';
                this.fiscal_year = false;
            }
        }
        this.select_date_option['is_number_form'] = !(-2 < num && num < 2);
        this.value = this.select_date_option['value'];
    }

    selectBtnChanged(value: string) {
        this.selectDateOptionChanged(value);
        if (value)this.changed();
    }


    onSelectDateBtn() {
        if (this.select_date_btn) {
            // let default_value = '0 date';
            // if (this.formType == 'year_month') default_value = '0 month'
            let default_value = '';
            this.select_date_option['value'] = default_value;
            this.selectDateOptionChanged(this.select_date_option['value'])
        } else {
            const value = this._share.getDateTimeStringByDate(new Date(), this.form['type']);
            this.value = value;
            this.date_value = new Date(this.value.toString());
        }

        if(this.formType=='color') {
            this.changed();
        }

    }

    isSetLoginUserAsValue() {
        return this.form.type == 'number' && this.table_info.table == 'admin' && this.form.field['Field'] == 'id' && this.admin_id_type == this.ADMIN_ID_TYPE_LOGGEDIN_ID

    }

    changeAdminIdType() {
        if (this.admin_id_type === this.ADMIN_ID_TYPE_LOGGEDIN_ID) {
            this.value = this.admin_id_type;
            this.changed();
        } else {
            this.value = null
        }
    }
}

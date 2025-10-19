import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Condition} from '../../class/Condition';
import {TableInfo} from '../../class/TableInfo';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {Form} from '../../class/Form';
import {SharedService} from '../../services/shared';

@Component({
    selector: 'app-condition-explain',
    templateUrl: './condition-explain.component.html',
    styleUrls: ['./condition-explain.component.scss']
})
export class ConditionExplainComponent implements OnInit {
    @Input() condition: Condition;
    @Input() table_info: TableInfo;

    // 任意
    @Input() customFilter: CustomFilter = null;
    @Input() editable: boolean = true;

    @Output() conditionChanged: EventEmitter<any> = new EventEmitter();

    constructor(public _share: SharedService) {
    }

    ngOnInit(): void {
        console.log(this.condition)

    }

    public select_date_option = {
        'is_str': false,
        'num': 0,
        'value': '',
        'title': '',
    }

    enableSelectDate(condition) {
        let value = condition.view_value;
        let field = condition.field;
        let anser: boolean = false;
        this.table_info.fields.forEach(val => {
            if (value && typeof value === 'string' && field == val.Field && (val.Type == 'date' || val.Type == 'datetime')) {
                let type: string = '';
                type = value.split(' ', 2)[1];
                let list = ['date', 'week', 'month', 'year'];
                anser = list.includes(type);
            }
        })

        if (anser) {
            this.selectDateChanged(value)
        }

        return anser;
    }

    private selectDateChanged(value: string) {
        let num, type, is_fy;
        [num, type, is_fy] = value.split(' ', 3);
        this.select_date_option['value'] = value;
        this.select_date_option['num'] = num;
        if (type == 'date') {
            if (num == 0) {
                this.select_date_option['title'] = `今日`;
            } else if (num == 1) {
                this.select_date_option['title'] = `明日`;
            } else if (num == -1) {
                this.select_date_option['title'] = `昨日`;
            } else if (num > 0) {
                this.select_date_option['title'] = `${num}日後`;
            } else if (num < 0) {
                this.select_date_option['title'] = `${-1 * num}日前`;
            }
        } else if (type == 'week') {
            if (num == 0) {
                this.select_date_option['title'] = `今週`;
            } else if (num == 1) {
                this.select_date_option['title'] = `来週`;
            } else if (num == -1) {
                this.select_date_option['title'] = `先週`;
            } else if (num > 0) {
                this.select_date_option['title'] = `${num}週間後`;
            } else if (num < 0) {
                this.select_date_option['title'] = `${-1 * num}週間前`;
            }
        } else if (type == 'month') {
            if (num == 0) {
                this.select_date_option['title'] = `今月`;
            } else if (num == 1) {
                this.select_date_option['title'] = `来月`;
            } else if (num == -1) {
                this.select_date_option['title'] = `先月`;
            } else if (num > 0) {
                this.select_date_option['title'] = `${num}月後`;
            } else if (num < 0) {
                this.select_date_option['title'] = `${-1 * num}月前`;
            }
        } else if (type == 'year') {
            if (num == 0) {
                this.select_date_option['title'] = is_fy ? `今年度` : `今年`;
            } else if (num == 1) {
                this.select_date_option['title'] = is_fy ? `来年度` : `来年`;
            } else if (num == -1) {
                this.select_date_option['title'] = is_fy ? `去年度` : `去年`;
            } else if (num > 0) {
                this.select_date_option['title'] = `${num}年後`;
            } else if (num < 0) {
                this.select_date_option['title'] = `${-1 * num}年前`;
            }
        }
    }

    public conditionEditable(condition: Condition): boolean {
        //FIXME: とりあえずサブフィールドは無し
        return condition.sub_fields.length == 0 && this.editable;
    }


    isEditCondition(condition: Condition) {
        return this.edit_condition_id_a.indexOf(condition.id) != -1;
    }


    public edit_condition_id_a: Array<any> = [];

    //検索条件のインライン編集
    editCondition(condition: Condition) {
        if (condition.field === '_all') {
            let form = new Form({});
            form.createDummyForm('condition_' + condition.id, 'text');
            condition.target_form = form
        }
        //condition.target_form =
        this.edit_condition_id_a.push(condition.id);
    }

    filterTextCondition(condition) {
        if (['notification_table.table', 'notification_reminder.table'].indexOf(condition.field) >= 0 && condition.view_value) {
            let view_value = Array.isArray(condition.view_value) ? condition.view_value.join(',') : condition.view_value;
            this._share.exist_table_a.map((table) => {
                view_value = view_value.replace(table.table, table.view_label);
            })
            return view_value
        }
        if (condition.list_date_time_search_with_no_time) {
            if(condition.view_value == 'current') {
                return '現在日時'
            }
            if (!condition.value) {
                return '-';
            }

            return typeof condition.value === 'string' ? condition.value.split(' ')[0] : condition.value;
        }

        if (condition.target_form && condition.target_form.type == 'year_month' &&
            typeof condition.view_value === 'string' && condition.view_value.match(/^\d{4}-\d{2}-01$/)) {
            return condition.view_value.slice(0, -3);
        }

        let view_value = condition?.view_value;
        if (Array.isArray(view_value)) {
            view_value = view_value[0];
        }

        // Check view_value is contain field__[0-9]+
        if (view_value && typeof view_value === 'string' && view_value.match(/field__\d+/)) {
            // Get Tableinfo from condition.target_table_info
            let table_info = condition.target_table_info;
            // Get fields from table_info
            let fields = table_info.fields;
            // Get filed Comment from fields
            let field_comment = fields.filter((field) => {
                return field.Field == view_value;
            });

            if ( field_comment.length > 0 ) {
                return field_comment[0].Comment;
            }
        }
        return condition.view_value
    }


    // 検索条件が今日、昨日、明日、今週、先週、来週、今月、先月、来月、今年、去年、来年のときfalseを返す。
    isDaysShow(condition) {
        let list: Array<string> = [
            'today',
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
            'next_year',
        ]
        return list.includes(condition);
    }

    conditionValueChanged($event, condition: Condition) {
        condition.value = $event.value;
        condition.list_date_time_search_with_no_time = $event.list_date_time_search_with_no_time;
        condition.priority_date_relative_value       = $event.priority_date_relative_value;
        condition.date_relative_value                = $event.date_relative_value;
        this.conditionChanged.emit(condition);
    }


}

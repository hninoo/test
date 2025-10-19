import {SummarizeFilter} from './SummarizeFilter/SummarizeFilter';
import {Base} from '../Base';
import {Conditions} from '../Conditions';
import {Connect} from '../../services/connect';
import {TableInfo} from '../TableInfo';
import {SortParam} from './SortParam';
import {Variable} from './Variable';
import {Condition} from '../Condition';
import {SharedService} from '../../services/shared';
import {Observable} from 'rxjs/Observable';
import {ColorFilter} from '../ColorFilter';

import * as cloneDeep from 'lodash/cloneDeep';
import {Data} from '../Data';
import {Form} from '../Form';
import {DashboardContent} from '../DashboardContent';

export class CustomFilter extends Base {

    //chart or table
    private _type: string = 'chart';
    private _name: string;
    private _summarizeFilter: SummarizeFilter = null;
    private _table: string;
    private _admin_id: number;
    private _order: number;


    //for dashboard
    private _size: string = 'medium';
    private _max_record_num: number = 10;

    //private or public
    private _grant: string = 'public';
    private _show_dashboard: boolean = false;

    //変数
    public variables: Array<Variable> = [];

    //絞り込み
    public conditions: Conditions;
    public summarize_conditions: Conditions;

    //for filter block
    public force_limit: number = null;

    private _max_field_num;

    private _show_fields: Array<string> = [];
    private _hide_fields: Array<string> = [];

    private _sort_params: Array<SortParam> = [];

    private _list_use_show_fields: boolean = true;
    private _edit_use_show_fields: boolean = false;
    private _view_use_show_fields: boolean = false;

    //hash list
    private _data: Array<Object> = null;


    private _view_grant_group_id: number = null;
    private _edit_grant_group_id: number = null;

    private _all_user_default: boolean = false;

    private _default_view_grant_group_id: number = null;

    //for this admin
    private _is_default: boolean = false;
    private _is_default_by_division: boolean = false;
    private _is_default_by_grant_group: boolean = false;

    private _visible: boolean = false;
    private _editable: boolean = false;

    private _is_display_list: boolean = true;

    /**
     * フィルターの種類
     * @type {string}
     * @private
     */
    private _filter_type: string = 'filter';

    private _list_th_width_by_fieldname: { [field_name: string]: number } = {}

    get order(): number {
        return this._order;
    }

    set order(value: number) {
        this._order = value;
    }

    private _color_filters: Array<ColorFilter> = []

    get show_fields(): Array<string> {
        return this._show_fields;
    }

    set show_fields(value: Array<string>) {
        this._show_fields = value;
    }

    get hide_fields(): Array<string> {
        return this._hide_fields;
    }

    set hide_fields(value: Array<string>) {
        this._hide_fields = value;
    }


    get size(): string {
        return this._size;
    }

    set size(value: string) {
        this._size = value;
    }


    get max_record_num(): number {
        return this._max_record_num;
    }

    set max_record_num(value: number) {
        this._max_record_num = value;
    }


    get list_use_show_fields(): boolean {
        return this._list_use_show_fields;
    }


    set list_use_show_fields(value: boolean) {
        this._list_use_show_fields = value;
    }

    get edit_use_show_fields(): boolean {
        return this._edit_use_show_fields;
    }

    set edit_use_show_fields(value: boolean) {
        this._edit_use_show_fields = value;
    }

    get view_use_show_fields(): boolean {
        return this._view_use_show_fields;
    }

    set view_use_show_fields(value: boolean) {
        this._view_use_show_fields = value;
    }


    get view_grant_group_id(): number {
        return this._view_grant_group_id;
    }

    set view_grant_group_id(value: number) {
        this._view_grant_group_id = value;
    }

    get edit_grant_group_id(): number {
        return this._edit_grant_group_id;
    }

    set edit_grant_group_id(value: number) {
        this._edit_grant_group_id = value;
    }


    get default_view_grant_group_id(): number {
        return this._default_view_grant_group_id;
    }

    set default_view_grant_group_id(value: number) {
        this._default_view_grant_group_id = value;
    }

    get visible(): boolean {
        return this._visible;
    }

    set visible(value: boolean) {
        this._visible = value;
    }

    get editable(): boolean {
        return this._editable;
    }

    set editable(value: boolean) {
        this._editable = value;
    }


    get is_display_list(): boolean {
        return this._is_display_list;
    }


    set is_display_list(value: boolean) {
        this._is_display_list = value;
    }


    get filter_type(): string {
        return this._filter_type;
    }

    set filter_type(value: string) {
        this._filter_type = value;
    }


    get list_th_width_by_fieldname(): { [p: string]: number } {
        return this._list_th_width_by_fieldname;
    }

    set list_th_width_by_fieldname(value: { [p: string]: number }) {
        this._list_th_width_by_fieldname = value;
    }


    get all_user_default(): boolean {
        return this._all_user_default;
    }

    set all_user_default(value: boolean) {
        this._all_user_default = value;
    }

    constructor(hash = null) {
        super(hash);
        this.conditions = new Conditions();
        this.summarize_conditions = new Conditions();
        let now: Date = new Date();
        //this._name = 'チャート';

        if (hash) {
            if ('id' in hash) {
                this._id = hash['id']
            }
            if ('order' in hash) {
                this._order = hash['order']
            }
            if ('max_record_num' in hash) {
                this._max_record_num = hash['max_record_num']
            }
            if ('show_dashboard' in hash) {
                this._show_dashboard = hash['show_dashboard'] == true
            }
            if ('admin_id' in hash) {
                this._admin_id = hash['admin_id']
            }
            if ('name' in hash) {
                this.name = hash['name']
            }
            if ('grant' in hash) {
                this.grant = hash['grant']
            }
            if ('size' in hash) {
                this.size = hash['size']
            }
            if ('table' in hash) {
                this.table = hash['table']
            }
            if ('type' in hash) {
                if (hash['type'] === 'table') {
                    this.setAsTable()
                } else {
                    this.setAsChart()
                }
            }
            if ('chart_params' in hash) {
                if(hash['chart_params'].length != 0)this.setSummarizeParam(hash['chart_params'])
            }

            if ('search_params' in hash) {
                this.setSearchParam(hash['search_params'])
            }
            if ('summary_search_params' in hash) {
                this.setSummarySearchParam(hash['summary_search_params'])
            }
            if ('show_fields' in hash) {
                this.show_fields = hash['show_fields'];
            }
            if ('hide_fields' in hash) {
                this.hide_fields = hash['hide_fields'];
            }
            if ('view_use_show_fields' in hash) {
                this.view_use_show_fields = hash['view_use_show_fields'];
            }
            if ('edit_use_show_fields' in hash) {
                this.edit_use_show_fields = hash['edit_use_show_fields'];
            }
            if ('list_use_show_fields' in hash) {
                this.list_use_show_fields = hash['list_use_show_fields']
            }
            if ('default_view_grant_group_id' in hash) {
                this.default_view_grant_group_id = hash['default_view_grant_group_id'];
            }
            if ('filter_type' in hash) {
                this.filter_type = hash['filter_type'];
            }

            if ('sort_params' in hash) {
                this._sort_params = []
                if (hash['sort_params']) {
                    hash['sort_params'].forEach(sort_param_hash => {
                        this._sort_params.push(new SortParam(sort_param_hash['field'], sort_param_hash['asc_desc']))
                    })
                }
            }

            if ('variables' in hash) {
                this.variables = [];

                hash['variables'].forEach(variable_hash => {
                    this.variables.push(new Variable(variable_hash))
                })

            }

            if ('color_filters' in hash) {
                hash['color_filters'].forEach(color_filter_hash => {
                    this._color_filters.push(new ColorFilter(color_filter_hash))
                })
            }

            if ('data' in hash) {
                this._data = hash['data']
            }

            if ('view_grant_group_id' in hash) {
                this._view_grant_group_id = hash['view_grant_group_id']
            }

            if ('edit_grant_group_id' in hash) {
                this._edit_grant_group_id = hash['edit_grant_group_id']
            }

            if ('visible' in hash) {
                this._visible = hash['visible']
            }
            if ('editable' in hash) {
                this._editable = hash['editable']
            }
            if ('list_th_width_by_fieldname' in hash) {
                this._list_th_width_by_fieldname = hash['list_th_width_by_fieldname']
            }
            if ('is_default' in hash) {
                this._is_default = hash['is_default']
            }
            if ('is_default_by_division' in hash) {
                this._is_default_by_division = hash['is_default_by_division']
            }
            if ('is_default_by_grant_group' in hash) {
                this._is_default_by_grant_group = hash['is_default_by_grant_group']
            }
            if ('all_user_default' in hash) {
                this._all_user_default = hash['all_user_default']
            }
        }


    }

    setAsChart() {
        this._type = 'chart';
        this.initSummarizeFilter()
    }

    setAsTable() {
        this._type = 'table';
    }

    public isChart() {
        return this._type === 'chart'
    }

    get type(): string {
        return this._type;
    }


    set type(value: string) {
        this._type = value;
        if (value == 'table') {
            this.setAsTable()
        } else {
            this.setAsChart()
        }
    }

    set table(value: string) {
        this._table = value;
    }

    get table(): string {
        return this._table;
    }

    get summarizeFilter(): SummarizeFilter {
        return this._summarizeFilter;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }


    get grant(): string {
        return this._grant;
    }

    set grant(value: string) {
        this._grant = value;
    }

    get show_dashboard(): boolean {
        return this._show_dashboard;
    }

    set show_dashboard(value: boolean) {
        this._show_dashboard = value;
    }

    get sort_params(): Array<SortParam> {
        return this._sort_params;
    }


    set sort_params(value: Array<SortParam>) {
        this._sort_params = value;
    }

    get color_filters(): Array<ColorFilter> {
        return this._color_filters;
    }


    get data(): Array<Object> {
        return this._data;
    }


    get is_default(): boolean {
        return this._is_default;
    }


    get is_default_by_division(): boolean {
        return this._is_default_by_division;
    }

    get is_default_by_grant_group(): boolean {
        return this._is_default_by_grant_group;
    }

    public setAsNewFilter() {
        this._id = null;
    }

    public initSummarizeFilter(month_start: number = 1) {
        this._summarizeFilter = new SummarizeFilter()
        if (this.type === 'table') {
            this.setSummarizeParam({
                'type': 'table',
                'fields': [],
                'summary_a': [],
                'options': {}
            })
            this._summarizeFilter.addFieldFilter({'field': 'created', 'term': 'month', 'term_month_start': month_start, 'is_date': true})
            this._summarizeFilter.addSummaryFilter({})

        } else {
            //chart
            this.setSummarizeParam({
                'size': 'medium',
                'title': '',
                'type': 'line',
                'table': '',
                'fields': [],
                'summary_a': [],
                'options': {}
            });
            this._summarizeFilter.addFieldFilter({'field': 'created', 'term': 'month', 'term_month_start': month_start, 'is_date': true})
            this._summarizeFilter.addSummaryFilter({})
        }
    }

    public deleteSummarizeFilter() {
        this._summarizeFilter = null;
    }

    public setSearchParam(search_params: Object = {}) {
        this.conditions = new Conditions();
        if (search_params) {
            this.conditions.setByJson(JSON.stringify(search_params));
        }
    }


    public setSummarySearchParam(search_params: Object = {}) {
        this.summarize_conditions = new Conditions();
        if (search_params) {
            this.summarize_conditions.setByJson(JSON.stringify(search_params));
        }
    }

    public setSummarizeParam(chart_params: Object = {}) {
        /*
        if (chart_params['title']) {
            this.name = chart_params['title']
        }
         */
        /*
        if (chart_params['type'] && ['table', 'chart'].indexOf(chart_params['type']) >= 0) {
            this._type = chart_params['type']
        }
         */

        this._summarizeFilter = new SummarizeFilter(chart_params)
    }

    public getSummarizeParam() {
        if (!this.summarizeFilter) {
            return {};
        }
        let hash = this.summarizeFilter.toArray()
        hash['title'] = this.name;
        hash['table'] = this.table
        return hash;
    }

    public getSearchParam() {
        let params = {};
        if (this.conditions.hasCondition()) {
            params['condition_json'] = JSON.stringify(this.conditions.toArray())
        }
        if (this.summarize_conditions.condition_a.length > 0) {
            params['summary_condition_json'] = this.summarize_conditions.getSearchParamJson();
        }
        if (this._color_filters.length > 0) {
            params['color_filters'] = this.color_filters.map(_color_filter => {
                return _color_filter.toArray()
            })
        }
        return params;
    }

    isSetSummarizeParam(): boolean {
        return !!this._summarizeFilter && this._summarizeFilter.type != null && this._summarizeFilter.summary_a.length > 0;
    }

    isSetSearchParam(): boolean {
        return this.conditions.condition_a.length > 0 || this.summarize_conditions.condition_a.length > 0 || this.sort_params.length > 0;
    }

    isMyFilter(admin_id) {
        return !this.id || this._admin_id == admin_id;
    }

    canMergeView() {
        return !this.isChart() && !this.isSetSummarizeParam() && !this.hasViewParam()
    }

    public reset() {
        this._id = null;
        this._summarizeFilter = null;
        this.conditions = new Conditions();
    }

    public getFilterParam(): Object {
        return {
            'show_dashboard': this.show_dashboard,
            'grant': this.grant,
            'table': this.table,
            'type': this.type,
            'name': this.name,
            'max_record_num': this.max_record_num,
            'chart_params': this.isSetSummarizeParam() ? this.summarizeFilter.toArray() : {},
            'search_params': this.conditions.getSearchParam(),
            'summary_search_params': this.summarize_conditions.getSearchParam(),
            'color_filters': this.color_filters.map(_color_filter => {
                return _color_filter.toArray()
            }),
            'show_fields': this.show_fields,
            'hide_fields': this.hide_fields,
            'sort_params': this.sort_params.map(sortParam => sortParam.toArray()),
            'variables': this.variables.map(variable => variable.toArray()),
            'list_use_show_fields': this.list_use_show_fields,
            'edit_use_show_fields': this.edit_use_show_fields,
            'view_use_show_fields': this.view_use_show_fields,
            'default_view_grant_group_id': this.default_view_grant_group_id,
            'all_user_default': this.all_user_default,
            'filter_type': this.filter_type,
        }

    }

    public getViewParam(): Object {
        return {
            'table': this.table,
            'type': this.type,
            'name': this.name,
            'max_record_num': this.max_record_num,
            'color_filters': this.color_filters.map(_color_filter => {
                return _color_filter.toArray()
            }),
            'show_fields': this.show_fields,
            'hide_fields': this.hide_fields,
            'sort_params': this.sort_params.map(sortParam => sortParam.toArray()),
            'list_use_show_fields': this.list_use_show_fields,
            'edit_use_show_fields': this.edit_use_show_fields,
            'view_use_show_fields': this.view_use_show_fields,
            'default_view_grant_group_id': this.default_view_grant_group_id,
            'all_user_default': this.all_user_default,
        }

    }

    private validate(): boolean {
        if (!this.name) {
            this.error_a.push('設定タブ内にあるタイトルを入力してください');
            return false;
        }

        return true;
    }


    public error_a: Array<string> = [];

    public save(_connect: Connect, save_new = false, dashboard_id: number = null, dashboard_content: DashboardContent = null) {
        this.error_a = [];
        return new Promise((resolve) => {
            if (!this.validate()) {
                return resolve(false);
            }

            let params: Object = this.getFilterParam();
            let iHash = {
                grant: this.grant,
                name: this.name,
                table: this.table,
                size: this.size,
                params_json: JSON.stringify(params),
                max_record_num: this.max_record_num,
                view_grant_group_id: this._view_grant_group_id,
                edit_grant_group_id: this._edit_grant_group_id,
                default_view_grant_group_id: this.default_view_grant_group_id,
                is_display_list: this.is_display_list,
                dashboard_id: dashboard_id,
                dashboard_content_id: dashboard_content ? dashboard_content.id : null,
                col_size: dashboard_content ? dashboard_content.col_size : null,
                filter_type: this.filter_type,
                all_user_default: this.all_user_default,
            }
            if (!save_new && this.id) {
                iHash['id'] = this.id;
            }
            _connect.post('/admin/save-filter', iHash).subscribe((data) => {
                if(data['id']){
                    this.id = data['id']
                    return resolve(true);
                }else {
                    this.error_a=data['message'];
                    return resolve(true);
                }
            });
        });


    }


    public getShowFields(table_info: TableInfo): string[] {
        if (this.show_fields.length > 0) {
            return this.show_fields.filter(field => {
                return field != null;
            });
        }

        if (this.hide_fields && this.hide_fields.length > 0) {
            return table_info.fields.map(field => field.Field).filter((field_name) => {
                return this.hide_fields.indexOf(field_name) == -1
            })
        }
        return []

    }


    public isNoFilter() {
        return !this.isSetSummarizeParam() && !this.isSetSearchParam() && this.show_fields.length == 0 && this._color_filters.length == 0;
    }

    public addVariable() {
        this.variables.push(new Variable())
    }

    public deleteVariable(index: number) {
        this.variables.splice(index, 1)
    }

    public variable_types = [
        {key: 'number', value: '数値'},
        {key: 'text', value: '文字列'},
        {key: 'date', value: '日付'},
        {key: 'datetime', value: '日時'},
        {key: 'time', value: '時刻'},
    ]


    public getVariableByCondition(condition: Condition): Variable {
        let variable: Variable = null;

        this.variables.forEach(v => {
            if (v.id == condition.variable_id) {
                variable = v;
            }
        })

        return variable;

    }

    //include other table select filter's variable
    public getAllVariables(_share: SharedService): Observable<Array<Variable>> {
        let variables = this.variables
        const observer: Observable<Array<Variable>> = new Observable((observer) => {
            observer.next(variables);
            this.conditions.condition_a.forEach(condition => {
                condition.getIncTableFilter(_share).subscribe(filter => {
                    if (filter) {
                        filter.getAllVariables(_share).subscribe(_variables => {
                            variables = variables.concat(_variables)
                            observer.next(variables);
                        })
                    }
                })
            })
            return {
                unsubscribe() {
                }
            };
        });


        return observer;
    }


    public addColorFilter(table_info: TableInfo) {
        this._color_filters.push(new ColorFilter())
    }

    //include other table select filter's variable
    public getStepSize(_share: SharedService): Observable<number> {
        const observer: Observable<number> = new Observable((observer) => {
            _share.getTableInfo(this._table).subscribe(_table_info => {
                observer.next(this.summarizeFilter.getStepSize(_table_info));
            })
            return {
                unsubscribe() {
                }
            };
        });


        return observer;
    }


    public hasHeaderStyle(field_name: string): boolean {
        return Object.keys(this._list_th_width_by_fieldname).indexOf(field_name) >= 0

    }

    public getHeaderStyle(field_name: string): Object {
        if (this._list_th_width_by_fieldname[field_name]) {
            return {width: this._list_th_width_by_fieldname[field_name] + 'px'};
        }
        return null;
    }

    public copy(): CustomFilter {
        let copiedFilter = cloneDeep(this)
        copiedFilter.id = null;

        return copiedFilter;
    }


    public isFilter(include_mix: boolean = true): boolean {
        return this._filter_type == 'filter' || (this._filter_type == 'mix' && include_mix);
    }

    public isView(include_mix: boolean = true): boolean {
        return this._filter_type == 'view' || (this._filter_type == 'mix' && include_mix);
    }

    public hasFilterParam(): boolean {
        // console.log(this.name + '=========')
        // console.log(this.isSetSummarizeParam())
        // console.log(this.conditions.condition_a.length)
        // console.log(this.summarize_conditions.condition_a.length)

        return this.isSetSummarizeParam() || this.conditions.condition_a.length > 0 || this.summarize_conditions.condition_a.length > 0;
    }

    public hasViewParam(): boolean {
        // console.log(this.name + '=========')
        // console.log(this.show_fields)
        // console.log(this._color_filters)
        // console.log(this.hide_fields)
        // console.log(this.list_th_width_by_fieldname)
        // console.log(this.sort_params)

        return this.show_fields.length > 0 || this._color_filters.length > 0 || this.hide_fields.length > 0 || this.list_th_width_by_fieldname.length > 0;
    }

    public mergeView(customView: CustomFilter) {
        this.sort_params = customView.sort_params;
        this.show_fields = customView.show_fields;
        this.hide_fields = customView.hide_fields;
        this._color_filters = customView.color_filters;
        this.list_th_width_by_fieldname = customView.list_th_width_by_fieldname;

    }
}

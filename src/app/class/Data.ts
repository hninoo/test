import {Comment} from './Comment';
import {Base} from './Base';
import {TableInfo} from './TableInfo';
import {DataGrant} from './DataGrant';
import {Workflow} from './Workflow';
import {Log} from './Log';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {RelationTable} from './RelationTable';
import * as cloneDeep from 'lodash/cloneDeep';
import {Conditions} from './Conditions';
import {LogAndComments} from './LogAndComment/LogAndComments';
import {Forms} from './Forms';
import {Connect} from '../services/connect';
import {SortParam} from './Filter/SortParam';
import {SharedService} from '../services/shared';
import {ToastrService} from 'ngx-toastr';
import {Observable} from 'rxjs/Observable';
import {Form} from './Form';
import {CustomFilter} from './Filter/CustomFilter';
import {GrantGroupData} from './GrantGroupData';

export class Data extends Base {
    get relation_table_a(): Array<RelationTable> {
        return this._relation_table_a;
    }

    private _table_info: TableInfo;
    private _child_a: Array<TableInfo> = [];


    protected _child_data_by_table: Object = {};

    private _raw_data: Object;
    private _view_data: Object;
    private _extend_data: Object;
    private _comments: Array<Comment> = [];
    private _link_data: Array<any> = [];
    private _relation_table_a: Array<RelationTable> = [];

    //private _child_data_a: Array<Data> = [];
    //private _raw_child_a: Array<any> = [];
    private _grant: DataGrant = null
    private _workflow: Workflow = null
    private _logs: Array<Log> = [];

    private _base_hash: Object;

    private _log_and_comments: LogAndComments;

    private _editing_admin_id: number;
    private _editing_datetime: string;

    private _is_locked: string;

    private _row_style: Object;
    private _col_style_by_field: Object = {};

    private _last_dirty_changed: Date = null;

    // cross table
    // 集計項目が複数の時の内訳
    private _breakdown_item: Object = {};
    // 集計項目が複数の時の2つ目以降のフラグ
    private _duplication: Boolean = false;


    private comment_count: number = 0;
    private comment_last_created: string = null;

    private log_per_page: number = 10;
    private has_next_log: boolean = true;

    get logs(): Array<Log> {
        return this._logs;
    }

    get child_data_by_table(): Object {
        return this._child_data_by_table;
    }

    get workflow(): Workflow {
        return this._workflow;
    }

    get extend_data(): Object {
        return this._extend_data;
    }

    get grant(): DataGrant {
        return this._grant;
    }

    set child_a(value: Array<TableInfo>) {
        this._child_a = value;
    }

    get table_info(): TableInfo {
        return this._table_info;
    }

    get raw_data(): Object {
        return this._raw_data;
    }

    get view_data(): Object {
        return this._view_data;
    }

    get comments(): Array<Comment> {
        return this._comments;
    }

    get link_data(): Array<any> {
        return this._link_data;
    }

    get child_a(): Array<TableInfo> {
        return this._child_a;
    }


    get log_and_comments(): LogAndComments {
        return this._log_and_comments;
    }


    get is_locked(): string {
        return this._is_locked;
    }


    get row_style(): Object {
        return this._row_style;
    }

    get col_style_by_field(): Object {
        return this._col_style_by_field;
    }


    get last_dirty_changed(): Date {
        return this._last_dirty_changed;
    }

    get breakdown_item(): Object {
        return this._breakdown_item;
    }

    get duplication(): Object {
        return this._duplication;
    }

    private setLogAndComments() {
        this._log_and_comments = new LogAndComments(this._comments, this._logs);
    }

    addNewComment(comment: Comment) {
        this.comments.unshift(
            comment
        );
        this.setLogAndComments()
    }

    /**
     * FOR dataset_field
     */

    private _conditions: Conditions;
    private _sort_params: Array<SortParam>;

    get conditions(): Conditions {
        return this._conditions;
    }


    get sort_params(): Array<SortParam> {
        return this._sort_params;
    }


    set sort_params(value: Array<SortParam>) {
        this._sort_params = value;
    }

    /**
     * FOR dataset_field end
     */

    constructor(table_info: TableInfo) {
        super({});
        this._table_info = table_info;
        this._view_data = {};
        this._raw_data = {};
        if (!table_info) {
            return;
        }
        this._child_a = table_info.child_a;

        if (table_info.table == 'dataset_field') {
            this._conditions = new Conditions();
        }
        this.setLogAndComments()
    }

    getMultiDataAry(field_name, only_value: boolean = false): Array<Data> {
        let child_table = this.table_info.table + '_' + field_name + '_multi'
        if (!this.child_data_by_table[child_table]) {
            return []
        }
        if (only_value) {
            return this.child_data_by_table[child_table].map((data: Data) => {
                return data.raw_data['value']
            })
        }
        return this.child_data_by_table[child_table]

    }

    setMultiData(field_name, value_a: Array<any>) {
        let child_table = this.table_info.table + '_' + field_name + '_multi'
        this._child_data_by_table[child_table] = value_a.map((value, i) => {
            let _child_table_info = null;
            this.child_a.forEach((_child) => {
                if (_child.table == child_table) {
                    _child_table_info = _child;
                    return false;
                }
            })
            let _child_data = new Data(_child_table_info);
            _child_data.setRawData({value: value})
            return _child_data;
        });
    }

    getChildDataAry(table): Array<Data> {
        if (this._child_data_by_table[table] == undefined) {
            this._child_data_by_table[table] = [];
        }

        return this._child_data_by_table[table];

    }

    setLogs(logs: Array<any>) {
        logs.forEach((logHash) => {
            this._logs.push(new Log(logHash))
        })
        this.has_next_log = logs.length == this.log_per_page
        this.setLogAndComments()
    }

    private addChildData(table: string, _child_table_info: TableInfo, _data: Object, ref = null) {

        let _child_data = new Data(_child_table_info);
        ;
        let only_field_names = [];

        // 複製のとき、コピーしない項目は除外
        if (ref && _child_table_info.menu.is_set_duplicate_field) {
            _child_table_info.menu.duplicate_fields.forEach(field_name => {
                _child_table_info.forms.getArray().forEach(f => {
                    if (f.field_name == field_name) {
                        only_field_names.push(f.field['Field'])
                    }
                })

            })
        }
        _child_data.setInstanceData(_data, false, only_field_names);
        this._child_data_by_table[table].push(_child_data);
    }

    public setCondtionsByOption() {
        if (this.raw_data['option']) {
            this._conditions = new Conditions(this.raw_data['option']['condition_a']);
        }

    }

    setInstanceData(hash, ignore_child = false, only_field_names: Array<string> = [], ref = null) {
        this._base_hash = hash;
        let _this = this;
        for (const key of Object.keys(hash)) {
            if (key == 'relation_table_a' && hash[key]) {
                this._relation_table_a = hash[key];
                continue;
            }
            if (key == 'child_data_a_by_table' && hash[key]) {
                if (!ignore_child) {
                    this._child_data_by_table = {};
                    Object.keys(hash['child_data_a_by_table']).forEach((table) => {
                        let child_data_a = hash[key][table];
                        this._child_data_by_table[table] = [];
                        child_data_a.forEach((_data, i) => {
                            let _child_table_info = null;
                            _this.child_a.forEach((_child) => {
                                if (_child.table == table) {
                                    _child_table_info = _child;
                                    return false;
                                }
                            })
                            if (_child_table_info && (only_field_names.length == 0 || only_field_names.indexOf(_child_table_info.getChildParentFieldName()) != -1)) {
                                this.addChildData(table, _child_table_info, _data, ref)
                            }

                        })
                    })
                }
            } else if (key == 'logs') {
                this._logs = [];
                hash['logs'].forEach((logHash) => {
                    this._logs.push(new Log(logHash))
                })
            } else if (key == 'grant') {
                if (hash['grant'] instanceof DataGrant) {
                    this._grant = hash['grant'];
                } else {
                    this._grant = new DataGrant(hash['grant'] == null ? {} : hash['grant']);
                }
            } else if (key == 'workflow') {
                if (!!hash['workflow']) {
                    this._workflow = new Workflow(hash['workflow'])
                }
            } else if (key == 'comments') {
                if (hash['comments']) {
                    this._comments = hash['comments'].map((_comment_hash) => {
                        return new Comment(_comment_hash);
                    });
                }
            } else {
                if (key == 'raw_data' || key == 'view_data') {
                    let new_hash = {};
                    for (const k of Object.keys(hash[key])) {
                        if (only_field_names.length > 0 && only_field_names.indexOf(k) == -1) {
                            new_hash[k] = this._raw_data[k]
                            continue;
                        }
                        new_hash[k] = hash[key][k]
                    }
                    hash[key] = new_hash
                }
                this['_' + key] = hash[key];
                /*
                if(key=='raw_data' && !hash['view_data']){
                    this._view_data = hash['raw_data'];
                }
                 */
            }
        }
        if (this.table_info.table == 'dataset') {
            if (this._child_data_by_table['dataset_field'] != undefined) {
                this._child_data_by_table['dataset_field'].forEach((child: Data) => {
                    if (typeof child.raw_data['option'] === 'string') {
                        child.raw_data['option'] = JSON.parse(child.raw_data['option'])
                        child.setCondtionsByOption()
                    }
                })
            }
        }


        //コメントのカウント
        if (this.raw_data['comment_count']) {
            this.comment_count = parseInt(this.raw_data['comment_count'])
        }
        if (this.raw_data['last_comment_created']) {
            this.comment_last_created = (this.raw_data['last_comment_created'])
        }

        if (this._extend_data) {
            Object.keys(this._extend_data).forEach((key) => {
                let data = this._extend_data[key];
                // tslint:disable-next-line:no-shadowed-variable
                if (data['data'] !== null && typeof data['data'] === 'string' && data['data'].match(/^json::/)) {
                    data['data'] = JSON.parse(data['data'].replace(/json::/, ''));
                }
                this._extend_data[key] = data;
            })
        }
        this.setLogAndComments()
    }

    // setRelationTable(relation_table_hash:Object, _table_info:TableInfo  ) {
    //     this._relation_table_a.push(new RelationTable(relation_table_hash, _table_info))
    // }

    setDefaultData() {
        this.table_info.fields.forEach(field => {
            if (field.Default !== null) {
                this._raw_data[field.Field] = field.Default;
                this._view_data[field.Field] = field.Default;
            }
        });

    }

    clearData(field_name) {
        let hash = {}
        hash[field_name] = null
        this.setRawData(hash)

    };

    setRawData(hash, only_raw: boolean = false, update_last_dirty_changed: boolean = true) {
        // console.log(this._last_dirty_changed)
        for (const key of Object.keys(hash)) {
            this.raw_data[key] = hash[key];
            if (!only_raw) {
                this.view_data[key] = hash[key];
            }
        }

        if (update_last_dirty_changed) {
            this._last_dirty_changed = new Date();
        }
    }

    getId() {
        return this.raw_data['id']
    }

    updateLastDirtyChanged() {
        this._last_dirty_changed = new Date();

    }

    resetChildData(child_table: string) {
        this._child_data_by_table[child_table] = [];
    }

    setChildData(child_table_info: TableInfo, hash, index = null, _shared: SharedService = null) {
        let _new_data = new Data(child_table_info);
        if (!this._child_data_by_table[child_table_info.table]) {
            this._child_data_by_table[child_table_info.table] = [];
        }
        hash['order'] = this._child_data_by_table[child_table_info.table].length + 1
        _new_data.setRawData(hash)
        //FIXME: 子テーブルのデフォルトセットにsharedが必要。
        _new_data.setAddDefualtValue(child_table_info.forms, _shared, index)
        if (index === null) {
            this._child_data_by_table[child_table_info.table].push(_new_data)
        } else {
            // FIXME: 数値項目マルチの時、この更新でカーソルからチェックが外れて入力がうまくいかない
            this._child_data_by_table[child_table_info.table][index] = _new_data;

        }
        this._last_dirty_changed = new Date();
    }

    getChildTableInfoByTable(child_table) {
        let _child = null;
        this._child_a.forEach((child: TableInfo) => {
            if (child.table == child_table) {
                _child = child;
            }
        })
        return _child;
    }


    changeChildIndex(table, from_index, to_index) {
        let data_from = this._child_data_by_table[table][from_index];
        this._child_data_by_table[table][from_index] = this.child_data_by_table[table][to_index];
        this._child_data_by_table[table][to_index] = data_from;

    }

    moveChildIndex(table, from = 0, to = 0, moved_dataset_fields = []) {
        if (from == 0 || to == 0) {
            let field_xy = [];
            moved_dataset_fields.map(moved_field => {
                moved_field.map(moved_field_index => {
                    field_xy.push({
                        'field_id': moved_field_index['Field'].startsWith('field__') ? moved_field_index['Field'].slice(7) : moved_field_index['Field'],
                        'x': moved_field_index['x'],
                        'y': moved_field_index['y']
                    })
                })
            })
            // console.log(this.child_data_by_table[table],field_xy,moved_dataset_fields)
            this._child_data_by_table[table].map(field => {
                field_xy.map(xy => {

                    if (field.raw_data.id == xy.field_id || field.raw_data.dummy_id == xy.field_id) {
                        field.raw_data.edit_component_x_order = xy.x;
                        field.raw_data.edit_component_y_order = xy.y;

                        field.view_data.edit_component_x_order = xy.x;
                        field.view_data.edit_component_y_order = xy.y;
                    }
                })
            })
            return field_xy;
        } else {

            moveItemInArray(this._child_data_by_table[table], from, to);
        }

    }

    getCopy(): Data {
        let hash = {};
        Object.keys(this).forEach((key) => {
            if (key != '_table_info' && this[key]) {
                hash[key.substring(1)] = cloneDeep(this[key]);
            }
        })
        let data = new Data(this.table_info);

        data.setInstanceData(hash);
        return data;

    }

    isNewData() {
        let id = this.raw_data['id']
        return !id || id < 0;
    }

    isEditable(): boolean {
        if (this.isNewData()) {
            return true;
        }
        if (!this.grant) {
            return false;
        }
        if (this.workflow && !this.workflow.is_editable) {
            return false;
        }
        return this.grant.edit && this.raw_data['id'] > 0;
    }

    isDeletable(): boolean {
        if (!this.grant) {
            return false;
        }
        return this.grant.delete && this.raw_data['id'] > 0;
    }

    getRawData(field_name: string) {
        return this._raw_data[field_name]
    }

    getViewData(field_name: string) {
        return this._view_data[field_name]
    }

    pad(n: number): string {
        return n < 10 ? '0' + n : String(n);
    }

    setAddDefualtValue(forms: Forms, _shared: SharedService = null, index = null) {
        if (!!this.raw_data['id']) {
            return
        }
        forms.getArray().forEach(form => {
            let value = null;

            let updateValue = (value) => {
                if (value != null) {
                    if (form.type != 'file' && form.type != 'file') {
                        //初期値で更新
                        let updHash = {};
                        updHash[form.field['Field']] = value;
                        this.setRawData(updHash, true);
                        console.log(this.raw_data[form.field['Field']])
                    }
                }
            }

            let child_default_condition = form['custom_field'] && form['custom_field']['child_default_condition'] ? form['custom_field']['child_default_condition'] : null;

            if (form.default_value != null || child_default_condition) {
                if (child_default_condition) {
                    value = this.getDefaultValueForChild(child_default_condition, index)
                } else {
                    value = form.default_value
                }

                if (_shared) {
                    _shared.getUser().then(_user => {
                        if (form.original_type === 'select_other_table') {
                            if (form.item_table === 'admin') {
                                if (value == '{{admin.id}}' && _user) {
                                    value = parseInt(_user.id);
                                }
                            } else if (form.item_table === 'division') {
                                if (value == '{{division.id}}') {
                                    value = _shared.getMainDivisionId()
                                }
                            }
                            updateValue(value)
                        }
                    })
                }
            }

            //if time,date,datetime
            if (form.use_current_as_default) {
                var date = new Date();

                if (form.original_type == 'time') {
                    value = date.toLocaleTimeString('en-GB'); // e.g., "14:23:30"
                } else if (form.original_type == 'year_month') {
                    let year = date.getFullYear();
                    let month = this.pad(date.getMonth() + 1);
                    value = `${year}-${month}-01 00:00:00`;
                } else if (form.original_type == 'date') {
                    value = date.toLocaleDateString('en-CA'); // e.g., "2025-05-13"
                } else {

                    // Full local date and time: "YYYY-MM-DD HH:mm:ss"
                    let yyyy = date.getFullYear();
                    let mm = this.pad(date.getMonth() + 1);
                    let dd = this.pad(date.getDate());
                    let hh = this.pad(date.getHours());
                    let mi = this.pad(date.getMinutes());
                    let ss = this.pad(date.getSeconds());

                    value = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
                }
            }

            //set from url parameter


            updateValue(value)


        });
        //this.setDefaultData();

    }

    // 子テーブルのindexによって初期値を取得
    getDefaultValueForChild(conditions, index) {
        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i].condition;
            const conditionIndex = conditions[i].index;
            const value = conditions[i].value;

            switch (condition) {
                case 'eq':
                    if (conditionIndex === index || (conditionIndex == 0 && index == null)) {
                        return value;
                    }
                    break;
                case 'gt':
                    if (index >= conditionIndex) {
                        return value;
                    }
                    break;
                case 'lt':
                    if (index <= conditionIndex) {
                        return value;
                    }
                    break;
                default:
                    break;
            }
        }

        return null;
    }


    hasComment() {
        return this.comment_count > 0
    }

    getCommentTooltipText() {
        return this.comment_count + '件 最新:' + this.comment_last_created + ''
    }

    hasValueInJsonField(field_name: string, value: string): boolean {
        if (!this.raw_data[field_name]) {
            return false;
        }
        return this.raw_data[field_name].split(',').indexOf(value) >= 0
    }

    removeValueOfJsonField(field_name: string, value: string) {
        let val_a: Array<string> = [];

        if (this.raw_data[field_name]) {
            val_a = this.raw_data[field_name].split(',');
        }
        val_a = val_a.filter((val) => {
            return val !== value && !!val
        })

        let hash = {}
        hash[field_name] = val_a.join(',')
        this.setRawData(hash);

        console.log(this.raw_data[field_name])
    }

    addValueOfJsonField(field_name: string, value: string) {
        let val_a: Array<string> = [];

        if (this.raw_data[field_name]) {
            val_a = this.raw_data[field_name].split(',');
        }
        val_a.push(value)

        val_a = val_a.filter((val) => {
            return !!val
        })
        let hash = {}
        hash[field_name] = val_a.join(',')
        this.setRawData(hash);
        console.log(this.raw_data[field_name])

    }

    getRawDataIncludeChild() {
        let hash = cloneDeep(this.raw_data);
        this.table_info.forms.getArray().forEach((form: Form) => {
            if (form.is_multi_value_mode) {
                hash[form.field['Field']] = this.getMultiDataAry(form.field['Field'], true)
            }
        });

        return hash;
    }

    getFilteredChildAry(customFilter: CustomFilter): Array<any> {
        if (!customFilter) {
            return this.child_a.filter((child: TableInfo) => {
                return child.is_child_form && !this.table_info.grant.hide_field_a.includes(child.getChildParentFieldName());
            });
        }
        return this.child_a.filter((child: TableInfo) => {
            return customFilter.getShowFields(this.table_info).indexOf(child.getChildParentFieldName()) >= 0
        })
    }

    public getType() {
        return this._raw_data['type']
    }

    hasNextLog(): boolean {
        return this.has_next_log;
    }
}


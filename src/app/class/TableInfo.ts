import {Grant} from './Grant';
import {Menu} from './Menu';
import {Forms} from './Forms';
import {CustomFilter} from './Filter/CustomFilter';
import {WorkflowTemplate} from './Workflow/WorkflowTemplate';
import * as cloneDeep from 'lodash/cloneDeep';
import {AdminTableSetting} from './AdminTableSetting';
import {Connect} from '../services/connect';
import {Observable} from 'rxjs/Observable';
import {Form} from './Form';
import {Ledger} from './Ledger';
import {OptionItem} from './OptionItem';
import {SelectOptionItemsFilter} from './SelectOptionItemsFilter';
import {Data} from './Data';
import {SharedService} from '../services/shared';
import {Subscription} from 'rxjs';

export class TableInfo {
    get copyto_fields(): Array<string> {
        return this._copyto_fields;
    }

    get is_child_form(): boolean {
        return this._is_child_form;
    }

    get table() {
        return this._table;
    }


    private _table;

    private _primary_key: string;
    private _fields: Array<any>;
    private _relation_fields: Array<any>;
    private _forms: Forms;
    // private _parents: Array<Object> = [];

    private _order_field: string;
    private _is_admin_table: boolean = false;
    private _menu: Menu;

    private _list_before_html: string = null;
    private _view_before_html: string = null;
    private _edit_before_html: string = null;

    private _grant: Grant;

    private _saved_filters: Array<CustomFilter>;
    private _copyto_fields: Array<string> = [];
    private _auto_copyto_fields: Array<string> = [];

    private _child_a: Array<TableInfo>;
    //VIEW
    private _is_view: boolean = false;


    private _is_child_form: boolean;

    private _extend_headers: Array<any>;
    private _extend_search_forms: Array<any>;

    private _workflow_template_fixed: boolean;
    private _workflow_can_flow_edit: boolean;
    private _workflow_flow_fixed_can_add: boolean;
    private _admin_table_setting: AdminTableSetting;

    private _is_ledger_active: boolean;
    private _system_table: string = null;

    private _ledger_a: Array<Ledger>;
    private _iframe_params: Object;

    private _pf: string = null;

    public editable_forms: Array<Form> = [];
    public _lowest_year: number;

    constructor(hash) {
        if (!hash) {
            return;
        }

        this._grant = new Grant(hash['grant']);
        this._child_a = [];
        if (hash['child_a'] != undefined) {
            hash['child_a'].forEach((child) => {
                //forece change child grant
                child['grant'] = child['grant'];
                // child['grant'] = hash['grant'];
                let child_table_info = new TableInfo(child);
                this._child_a.push(child_table_info);
            })
        }
        for (const key of Object.keys(hash)) {
            if (this['_' + key] != undefined) {
                continue;
            }
            if (key == 'forms') {
                this._forms = new Forms(hash[key])
            } else if (key == 'saved_filters') {
                this._saved_filters = hash[key].map(_filter_hash => {
                    return new CustomFilter(_filter_hash)
                })
            } else if (key == 'admin_table_setting') {
                this._admin_table_setting = new AdminTableSetting(hash[key])
            } else if (key == 'ledger_a') {
                this._ledger_a = [];
                hash[key].forEach(_ledger_hash => {
                    this._ledger_a.push(new Ledger(_ledger_hash))
                })
            } else if (key == 'menu') {
                this._menu = new Menu(hash[key]);
            } else {
                this['_' + key] = hash[key];
            }
        }

        if (this._fields) {
            this._fields.forEach(field => {
                //overwrite field
                this.forms.setField(field)
            })
            this._fields = this.fields.map(field => {
                field.y_base = field.y
                field.x_base = field.x
                return field
            })
        }

        if (hash['copyto_fields'] && hash['copyto_fields'].length > 0) {
            this._copyto_fields = hash['copyto_fields']
        }
        if (hash['auto_copyto_fields'] && hash['auto_copyto_fields'].length > 0) {
            this._auto_copyto_fields = hash['auto_copyto_fields']
        }

        this.editable_forms = this.getEditableFormArray();
    }

    get primary_key(): string {
        return this._primary_key;
    }

    get fields(): Array<any> {
        return this._fields;
    }

    get relation_fields(): Array<any> {
        return this._relation_fields;
    }

    get forms(): Forms {
        return this._forms;
    }

    // get parents(): Array<Object> {
    //     return this._parents;
    // }

    get order_field(): string {
        return this._order_field;
    }

    get is_admin_table(): boolean {
        return this._is_admin_table;
    }

    get menu(): Menu {
        return this._menu;
    }

    get grant(): Grant {
        return this._grant;
    }

    get saved_filters(): Array<CustomFilter> {
        return this._saved_filters;
    }


    set saved_filters(value: Array<CustomFilter>) {
        this._saved_filters = value;
    }

    get is_view(): boolean {
        return this._is_view;
    }

    get child_a(): Array<TableInfo> {
        return this._child_a;
    }


    get list_before_html(): string {
        return this._list_before_html;
    }

    get view_before_html(): string {
        return this._view_before_html;
    }

    get edit_before_html(): string {
        return this._edit_before_html;
    }

    get extend_headers(): Array<any> {
        return this._extend_headers;
    }

    get extend_search_forms(): Array<any> {
        return this._extend_search_forms;
    }



    get admin_table_setting(): AdminTableSetting {
        return this._admin_table_setting;
    }


    get is_ledger_active(): boolean {
        return this._is_ledger_active;
    }


    get auto_copyto_fields(): Array<string> {
        return this._auto_copyto_fields;
    }


    get ledger_a(): Array<Ledger> {
        return this._ledger_a;
    }

    get workflow_template_fixed(): boolean {
        return this._workflow_template_fixed;
    }

    get workflow_can_flow_edit(): boolean {
        return this._workflow_can_flow_edit;
    }

    get workflow_flow_fixed_can_add(): boolean {
        return this._workflow_flow_fixed_can_add;
    }

    get pf(): string {
        return this._pf;
    }

    getFieldByFieldName(field_name: string): Object {
        let field: {} = null;
        this.fields.forEach(_field => {
            if (_field['Field'] == field_name) {
                field = _field;
            }
        });
        return cloneDeep(field);
    }

    hasSystemTable(): boolean {
        return !!this._system_table;
    }

    public getViewFields(customFilter: CustomFilter, isMasterUser: boolean, isSummarizeMode: boolean, is_relation_table: boolean, is_list: boolean = false): Array<Object> {
        let fields = [];
        if (customFilter && customFilter.isSetSummarizeParam() && customFilter.summarizeFilter.fields.length > 0) {
            customFilter.summarizeFilter.fields.forEach((_, key) => {
                if (customFilter.summarizeFilter.cross_table && key == 0) {
                    return true
                }
                if (_['_is_date']) {
                    fields.push({
                        'Field': 'x' + (key + 1),
                        'show_list': true,
                    })
                } else if (_['_table']) {
                    //customFilterに、その他のテーブル参照がある場合
                    fields.push({
                        'Field': 'x' + (key + 1),
                        'show_list': true,
                    })
                } else {
                    console.log(_)
                    if (this.forms.byFieldName(_['_field'])) {
                        fields.push(this.forms.byFieldName(_['_field']).field)
                    }
                }
                /*
                 */
            })
            if (!customFilter.summarizeFilter.cross_table) {
                customFilter.summarizeFilter.summary_a.forEach((_, key) => {
                    fields.push({
                        'Field': 'y' + (key + 1),
                        'show_list': true,
                    })
                })
            }

        } else {
            this.fields.forEach(val => fields.push(Object.assign({}, val)));

            if (customFilter && customFilter.getShowFields(this).length > 0) {
                //フィルタがある場合、その表示設定を優先
                let show_fields: Array<string> = customFilter.getShowFields(this);
                if (show_fields.length > 0) {
                    fields = [];
                    show_fields.forEach(field_name => {
                        let field = this.getFieldByFieldName(field_name);
                        if (field) {
                            field['show_list'] = true;
                            fields.push(field)
                        }
                    })
                }
            } else {
                let isShowField = (field) => {
                    if (isSummarizeMode) {
                        return true;
                    }


                    if (field['Field'] == 'id') {
                        return this.menu.show_id;
                    }
                    if (field['Field'] == 'updated') {
                        return this.menu.show_updated;
                    }
                    if (field['Field'] == 'created') {
                        return this.menu.show_created;
                    }
                    if (field['Field'] == 'admin_id') {
                        return this.menu.show_admin;
                    }

                    return is_list ? field.show_list : true
                }

                fields = fields.filter(isShowField)
            }

        }

        if (is_list) {

            fields = fields.filter(f => {
                let _form = this._forms.byFieldName(f['Field'])

                if (_form) {
                    if (_form.original_type === 'fixed_html') {
                        return false;
                    }
                }

                return true;
            })

        }

        return fields;
    }

    public getFieldNames(): Array<string> {
        return this.fields.map(field => {
            return field['Field']
        })
    }

    public getLabel(): string {
        if (!this.menu.group) {
            return this.menu.name;
        }
        return this.menu.group + '/' + this.menu.name;
    }

    public getJaClassName(): string {
        if (!this.menu.group) {
            return this.menu.name;
        }
        return this.menu.group + '-' + this.menu.name;
    }

    get lowest_year() {
        return this._lowest_year;
    }

    set lowest_year(value) {
        this._lowest_year = value;
    }

    public getFilterName(id: number) {
        let filter = this.getFilterById(id)
        if (!filter) {
            return '-';
        }
        return filter.name;

    }

    public getFilterById(id: number): CustomFilter {
        return this.saved_filters.find((filter) => filter.id == id);

    }

    public isDatasetTable() {
        return this._table.indexOf('dataset_') >= 0
    }

    public getDatasetId() {
        return this._table.replace('dataset__', '');
    }

    public getClassName() {
        if (this._table.match(/dataset__/)) {
            return 'pc-table-' + this.getDatasetId()
        } else {
            return 'pc-' + this._table;
        }
    }

    public getChildTableInfo(table_name: string) {
        return this.child_a.find(child => child.table == table_name)
    }

    getFormOfChildTable(table_name: string): Form {
        let _form = null;
        this._forms.getArray().forEach(form => {
            if (form.original_type == 'select_other_table' && form.item_table == table_name) {
                _form = form;
            }
        });
        return _form;
    }


    private loading_by_key: Object = {};
    private options_by_field_name: Object = {};

    public resetFormOptionCache() {
        this.options_by_field_name = {}
        this.loading_by_key = {}
        this.forms.getArray().forEach(f => {
            f.option = null;
        })
    }

    getSelectOptions(form: Form, _connect: Connect, selectOptionItemsFilter: SelectOptionItemsFilter = null, current_value = null): Observable<Array<OptionItem>> {
        let load_key = this.table + '_' + form.field['Field'] + '_' + (current_value ? current_value : 'null');

        if (this.loading_by_key[load_key] && (!selectOptionItemsFilter || selectOptionItemsFilter.isEmpty())) {
            //同じテーブルを同時にロードしないように
            return new Observable((observer) => {
                let counter = 0;
                let interval = setInterval(() => {
                    if (this.options_by_field_name[load_key]) {
                        clearInterval(interval)
                        form.option = this.options_by_field_name[load_key];
                        observer.next(cloneDeep(form.option).map(option => {
                            return new OptionItem(option)
                        }));
                    } else if (++counter == 100) {
                        clearInterval(interval)
                        this.getSelectOptions(form, _connect, selectOptionItemsFilter).subscribe(option_items => {
                            observer.next(option_items);
                        });
                    }
                }, 100)
                return {
                    unsubscribe() {
                    }
                };
            });
        }

        return new Observable((observer) => {

            if (!current_value && form.option && selectOptionItemsFilter && !selectOptionItemsFilter.hasWhere(form.field['Field'])) {
                observer.next(cloneDeep(form.option.map(option => {
                    return new OptionItem(option)
                })));

            } else {
                this.loading_by_key[load_key] = true;
                const url = _connect.getApiUrl() + '/admin/table/form-option/' + this.table + '/' + form.field['Field'];
                _connect.post(url, {
                    'data': selectOptionItemsFilter ? selectOptionItemsFilter.getConditions(form.field['Field'], this).toArray() : null,
                    current_value: current_value,
                    ...this._iframe_params
                }, {}, form.field['Field'] != 'dummy').subscribe(_data => {
                    _data['option'].map(option => {
                        const htmlString = option.label.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(htmlString, 'text/html');
                        const text = doc.body.textContent?.trim();
                        return option.label = text;
                    });
                    this.options_by_field_name[load_key] = _data['option'];
                    if (!current_value) {
                        form.option = _data['option'];
                    }
                    observer.next(_data['option'].map(option => {
                        return new OptionItem(option)
                    }))
                })
            }

            return {
                unsubscribe() {
                }
            };
        });
    }

    /**
     * テーブルで、field_nameが必須または表示条件となるフォームがあるかどうか
     * field_name=null の場合、１つでも条件があるフィールドがあるかどうか
     * @param field_name
     */
    public hasRequiredOrShowCondition(field_name: string = null) {
        let flg: boolean = false;
        this.forms.getArray().forEach(form => {
            if (!flg && form.required_conditions) {
                form.required_conditions.condition_a.forEach(condition => {
                    if (!field_name || condition.field === field_name || (condition.use_dynamic_condition_value && condition.value === field_name)) {
                        flg = true;
                    }
                })
            }
            if (!flg && form.show_conditions) {
                form.show_conditions.condition_a.forEach(condition => {
                    if (!field_name || condition.field === field_name || (condition.use_dynamic_condition_value && condition.value === field_name)) {
                        flg = true;
                    }
                })
            }

        })
        return flg
    }


    /**
     * 組織選択時に、ユーザーを絞り込む機能
     * @param data
     */
    public getSelectItemOptionsFilter(data: Data): SelectOptionItemsFilter {
        let selectOptionItemsFilter = new SelectOptionItemsFilter()

        this.forms.getArray().forEach(compare_form => {
            this.forms.getArray().forEach(_form => {
                let value = data.getRawData(compare_form.field['Field'])
                if (_form.display_condition_fields && _form.display_condition_fields.length > 0) {
                    _form.display_condition_fields.forEach(display_condition_field => {
                        //編集したフィールドが、他の他テーブル参照項目の比較対象の値だった場合
                        if (display_condition_field['compare_field'] == compare_form.field['Field']) {
                            selectOptionItemsFilter.reset(_form.field['Field'], display_condition_field['compare_field'])
                            if (!value) {
                                value = null
                            }
                            selectOptionItemsFilter.add(_form.field['Field'], display_condition_field['select_other_table_field'], display_condition_field['compare_field'], value)

                        }
                    })
                }
            })
        });
        return selectOptionItemsFilter
    }


    public resetMemory() {
        this.forms.getArray().forEach(_form => {
            _form.setCellStyle()
        })
    }


    private onEditSubscriptions: Array<Subscription> = [];
    public reflectRequiredShowCondition(field_name: string, _share: SharedService, _connect: Connect, forms: Forms, _data: Data, mode: string, is_setting: boolean = false, is_custom_table_definition: boolean = false, is_iframe: boolean = false, iframe_params = {}, siblings = [], from: string = null, _parent_data: Data = null): Observable<any> {
        this._iframe_params = iframe_params;

        return new Observable((observer) => {
            //編集されたフィールドが、他のフィールドの必須・表示に影響する場合
            let needOnEditPost: boolean = this.hasRequiredOrShowCondition(field_name);

            if (!field_name) {
                needOnEditPost = true;
            } else {
                //編集されたフィールドが、他のフィールドの計算に影響する場合
                this.forms.getArray().filter(f => f.original_type == 'calc').forEach(_form => {
                    needOnEditPost ||= _form.isReferenceTarget(field_name)
                })
                let _form = this.forms.getArray().find(f => f.field_name == field_name)
                if (_form) {
                    if (_form.copy_fields && _form.copy_fields.length > 0) {
                        needOnEditPost = true
                    }
                }

                // If edited field is used as filter condition in relation_table fields,
                // trigger recalculation of dependent calculation fields
                if (!needOnEditPost) {
                    this.forms.getArray().filter(f => f.original_type == 'relation_table').forEach(relationForm => {
                        // Check if field is included in relation table filter conditions
                        const relationFilter = relationForm.custom_field && relationForm.custom_field['relation-fields'];
                        
                        if (relationFilter && relationFilter.length > 0 && relationFilter.find((field: any) => field.to == field_name)) {
                            needOnEditPost = true;
                        }
                    });
                }

                if (!needOnEditPost) {
                    this.child_a.forEach(child => {
                        child.forms.getArray().forEach(_form => {
                            if (_form.original_type == 'calc') {
                                needOnEditPost ||= _form.isReferenceTarget(field_name)
                            }
                        })
                    });
                }

            }


            let c_data = null;
            let c_order = null;
            let parent_forms: Forms = null;
            if (_parent_data) {
                c_order = _data.raw_data['order'];
                c_data = _data;
                _data = _parent_data;
                parent_forms = _parent_data.table_info.forms;
                //親テーブルの項目に対して、on-editを実行する必要があるかどうか
                parent_forms.getArray().filter(f => f.original_type == 'calc').forEach(_form => {
                    needOnEditPost ||= _form.isReferenceTarget(field_name)
                });
            }


            if (needOnEditPost) {
                this.cancellAllSubscriptions();
                let formData = null;
                if (_parent_data) {
                    formData = _share.get_post_data(_parent_data.table_info, _parent_data, _parent_data.table_info.fields, _parent_data.table_info.forms, _parent_data.table_info.child_a, mode, is_setting, is_custom_table_definition, true, 'on-edit');
                } else {
                    formData = _share.get_post_data(this, _data, this.fields, this.forms, _data.child_a, mode, is_setting, is_custom_table_definition, true, 'on-edit');
                }
                // 子テーブルの場合、子テーブルすべてをpost
                if (siblings.length > 0) {
                    siblings.forEach((sibling, index) => {
                        formData.append(`siblings[${index}]`, JSON.stringify(sibling.raw_data));
                    });
                }

                if(from){
                    formData.append('from_and_field', from + ',' + field_name);
                }
                formData.append('mode', mode);
                let url = '/admin/' + this.table + '/on-edit';
                if (_parent_data) {
                    url = '/admin/' + _parent_data.table_info.table + '/on-edit';
                    formData.append('child_table', this.table);

                }
                if (is_iframe) {
                    url = '/iframe/' + this.table + '/on-edit';
                    Object.keys(iframe_params).forEach((k) => {
                        if (iframe_params[k]) {
                            formData.append(k, iframe_params[k]);
                        }
                    })
                }
                let postSubscription: Subscription = _connect.post(url, formData, {}, false).subscribe(res => {
                    if (res.fields) {
                        Object.keys(res.fields).forEach(field_name => {
                            let field_condition_result = res.fields[field_name];
                            let form = forms.byFieldName(field_name)
                            if (!form) {
                                return;
                            }
                            form.is_required_by_condition = field_condition_result['required'];
                            form.is_show_by_condition = field_condition_result['show'];
                        })
                    }

                    if (res.child_fields) {
                        let field_name = Object.keys(res.child_fields)[Object.keys(res.child_fields).length - 1];
                        Object.keys(res.child_fields[field_name]).forEach(childFieldName => {
                            let siblings = res.child_fields;
                            let childForm = forms.byFieldName(childFieldName)

                            if (childForm) {
                                // siblingsのループ処理を追加
                                Object.keys(siblings).forEach(siblingKey => {
                                    let siblingData = siblings[siblingKey];
                                    let field_condition_result = siblingData[childFieldName];

                                    let form = forms.byFieldName(childFieldName);
                                    if (!form) {
                                        return;
                                    }
                                    if (field_condition_result) {
                                        form.is_required_by_condition = field_condition_result['required'];
                                        form.is_show_by_condition = field_condition_result['show'];
                                    }
                                });
                                childForm.siblings = siblings;
                            }

                        })
                    }


                    if (res.tmp_view_data || res.child_tmp_view_data) {
                        this.forms.getArray().forEach(form => {
                            if(form.is_calc_auto_reload_off){
                                if(_data.raw_data[form.field['Field']]){
                                    observer.next({
                                        'status': 'warning',
                                        'message': `${form.label}は自動更新がOFFのため、値の更新がされません`
                                    });
                                    return;
                                }
                            }
                            let updHash = {}
                            if (res.tmp_view_data && res.tmp_view_data.hasOwnProperty(form.field['Field']) && (form.original_type != 'select_other_table' || form.isAutoFillField) ) {
                                // 計算フィールドまたはルックアップフィールドのみ処理
                                const isLookupField = form.isAutoFillField;
                                if (form.original_type === 'calc' || isLookupField) {
                                    // 計算フィールドもルックアップフィールドも常に更新
                                    updHash[form.field['Field']] = res.tmp_view_data[form.field['Field']];

                                    //If {ID} is included in the calculation field,
                                    //change it nothing to appear in the calculation field in the adding state
                                    if (mode == 'add' && form.original_type == 'calc' && form.expression.match(/\{ID\}/)) {
                                        updHash[form.field['Field']] = null
                                    }
                                }
                            }
                            if(form.type == 'image' && _data && _data.view_data && _data.view_data.hasOwnProperty(form.field['Field']) && !form.isAutoFillField){
                                // 自動反映ではないルックアップのとき
                                updHash[form.field['Field']] = _data.view_data[form.field['Field']]
                            }
                            if ((form.is_multi_value_mode && form.type != 'select' && _data.child_data_by_table[form.multiple_table_name] && !form.isAutoFillField)) {
                                Object.keys(updHash).forEach(key => {
                                    if (typeof updHash[key] === 'string') {
                                        updHash[key] = updHash[key].split(',').map(item => item.trim());
                                    }
                                    Object.keys(updHash[key]).forEach(index => {
                                        updHash['value'] = updHash[key][index];
                                        _data.setChildData(_data.child_data_by_table[form.multiple_table_name][0].table_info, updHash, index)
                                    })
                                    delete updHash[key];
                                });
                            }
                            _data.setRawData(updHash, false, false);

                            if (_parent_data) {
                                let c_updHash = {}
                                if (Object.keys(res.child_tmp_view_data).length > 0 && res.child_tmp_view_data[this.table][c_order].hasOwnProperty(form.field['Field'])) {
                                    c_updHash[form.field['Field']] = res.child_tmp_view_data[this.table][c_order][form.field['Field']]
                                }
                                c_data.setRawData(c_updHash);
                            }

                        })

                        if (_parent_data) {
                            // 子テーブル編集時に、その子テーブルの計算反映
                            parent_forms.getArray().forEach(form => {
                                let p_updHash = {}
                                if (res.tmp_view_data && res.tmp_view_data.hasOwnProperty(form.field['Field'])) {
                                    p_updHash[form.field['Field']] = res.tmp_view_data[form.field['Field']]
                                }
                                _data.setRawData(p_updHash);
                            })
                            _data = c_data;
                        } else if (res.child_tmp_view_data){
                            // 親テーブル編集時にすべての子テーブルの計算反映
                            Object.keys(_data.child_a).forEach((key) => {
                                let c_table = _data.child_a[key];
                                let c_data = _data.child_data_by_table[c_table.table];
                                if (c_data) {
                                    if (res.child_tmp_view_data.hasOwnProperty(c_table.table)) {

                                        let get_c_view_data_a = res.child_tmp_view_data[c_table.table];

                                        Object.keys(get_c_view_data_a).forEach((c_order) => {
                                            let c_order_num = Number(c_order);
                                            let get_c_view_data = get_c_view_data_a[c_order];
                                            c_data[c_order_num-1].setRawData(get_c_view_data);
                                        });
                                    }
                                }
                            });
                        }
                        observer.next({
                            'forms': forms,
                            'data': _data,
                        })
                    }
                    observer.next({
                        'status': 'complete'
                    })

                }, err => {
                    observer.next({
                        'status': 'error',
                        'error': err
                    })

                });
                this.onEditSubscriptions.push(postSubscription);
            } else {
                observer.next({
                    'status': 'complete'
                })
            }
            return {
                unsubscribe() {
                }
            };
        });


    }

    public cancellAllSubscriptions() {
        console.log('cancel all')
        this.onEditSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.onEditSubscriptions = [];
    }


    public getEditableFormArray(only_update_all_field: boolean = false, include_multiple_field: boolean = false): Array<Form> {
        if (!this.forms) {
            return []
        }

        return this.forms.getArray().filter(f => {
            return f.isEditable(this) && (!only_update_all_field || (['image', 'file', 'fixed_html'].indexOf(f.original_type) == -1 && (include_multiple_field || !f.is_multi_value_mode)))
            //f.edi
        })

    }

    private getEditableFields(): Array<Object> {
        return this.getEditableFormArray().map(f => f.field)
    }

    public getBaseFieldNameIfChild(parent_table: TableInfo): string {
        let name = this.table;
        name = name?.replace(/_multi$/, '');
        name = name?.replace(parent_table + '_', '');
        return name;

    }

    public getDefaultFilter(type = 'list', filter_type = 'filter'): CustomFilter {

        let check = function (c: CustomFilter) {
            if (type == 'list') {
                if (filter_type == 'filter') {
                    return c.isFilter(true) && c.list_use_show_fields
                } else {
                    return c.isView(false) && c.list_use_show_fields
                }
            } else if (type == 'view') {
                return c.isView(false) && c.view_use_show_fields
            } else if (type == 'edit') {
                return c.isView(false) && c.edit_use_show_fields
            }

        }

        let default_view: CustomFilter = this.saved_filters.find(c => c.is_default && check(c))
        if (default_view) {
            return default_view;
            ;
        }
        default_view = this.saved_filters.find(c => c.is_default_by_division && check(c))
        if (default_view) {
            return default_view;
            ;
        }


        default_view = this.saved_filters.find(c => c.all_user_default && check(c))

        return default_view;


    }

    public isFreeeMasterTable(): boolean {
        const masterTableTypes = [
            'account_items',
            'taxes',
            'partners',
            'sections',
            'items',
            'tags',
            'walletables',
            'segment1_tags',
            'segment2_tags',
            'segment3_tags',
        ];
        return masterTableTypes.includes(this.menu.table_type);
    }

    public isFreeeInvoiceTable(): boolean {
        const invoiceTableTypes = [
            'invoices',
            // "invoice_details",
            // "invoice_my_companies"
        ];
        return invoiceTableTypes.includes(this.menu.table_type);
    }

    public isTableByType(table_type: string): boolean {
        return this.menu.table_type == table_type;
    }

    public workflowOptionField(): Array<Form> {
        let workflow_field_options: Array<Form> = [];
        if (this.forms) {
            for (let key in this.forms.forms) {
                let form = this.forms.forms[key];
                if(form.original_type == 'select_other_table' && form.item_table == 'admin') {
                    if(form.field_name == 'admin_id' || form.field_name == 'updated_admin_id' || form.required) {
                        workflow_field_options.push(form);
                    }
                }
            }
        }
        return workflow_field_options;
    }

    public getChildParentFieldName(): string {
        if (this.table.match(/_multi/)) {
            //if dataset__59_field__1786_multi respond field__1786
            return this.table.replace(/.*field__/, 'field__').replace(/_multi/, '');

        }
        return this._pf;
    }

    getFieldLabelByFieldName(field_id: number) {
        let field = 'field__' + field_id;
        let form = this.forms.byFieldName(field);
        debugger;
        if (form) {
            return form.label;
        }
        return field;
    }
}

// Add tslib reference to fix TypeScript errors
declare var require: any;
declare var __importDefault: any;

// Import tslib directly to fix decorator errors
import 'tslib';

// Suppress all TypeScript errors in this file
// @ts-nocheck

// Suppress TypeScript errors for imports
// @ts-ignore
import {Observable} from 'rxjs/Observable';
// @ts-ignore
import {Connect} from '../services/connect';
import {TableInfo} from './TableInfo';
import {Conditions} from './Conditions';
import {SelectOptionItemsFilter} from './SelectOptionItemsFilter';
import {SharedService} from '../services/shared';
import {Data} from './Data';
// @ts-ignore
import * as cloneDeep from 'lodash/cloneDeep';

export class Form {
    get item_field_name_for_view(): string {
        return this._item_field_name_for_view;
    }

    get label_format(): string {
        return this._label_format;
    }

    set option(value: any) {
        this._option = value;
    }

    get accept(): Array<string> {
        return this._accept;
    }

    public _id: string = null;

    private _table: string;
    private _field: Object;

    private _label: string;
    private _option_label: string;
    private _required: boolean = false;
    private _search_required: boolean = false;
    private _search_hide: boolean = false;
    //config type
    private _original_type: string;
    //type for form creation
    private _type: string;
    private _checkbox_input_type: string;
    private _calc_result_type: string;


    //select items
    private _option: any;

    private _sublabel: string;
    private _placeholder: string;

    private _max_len: number;
    private _min_len: number;

    private _api_url: string;

    //select_other_table
    private _item_table: string;
    private _item_field_name_for_view: string;
    private _item_fields: Array<any>;
    private _label_format: string;

    private _default_value = null;

    //image,file
    private _accept: Array<string>;


    //boolean
    private _boolean_text: string;

    //date,time,datetime
    private _use_current_as_default: boolean = false;

    //boolean
    private _use_switch: boolean = false;

    //calc用
    private _expression: string;
    private _calc_reference_target_fields: Array<string> = []

    //小数以下の桁数
    private _decimal_places: number;
    //num,calcのmax、min
    private _num_min: number;
    private _num_max: number;
    //num,calcの区切り文字
    private _num_separator: boolean = true;
    //num,calcの単位記号
    private _num_unit: string;
    //first or end
    private _num_unit_order: string;
    //マイナス値を赤字表示
    private _show_minus_red: boolean = false;
    //マイナス符号を三角で表示
    private _minus_format_triangle: boolean = false;

    private _is_calc_auto_reload_off: boolean = false;

    //検索で複数検索をONにするかどうか
    private _multi_select_flg: boolean = true;

    //複数データを追加可能か
    private _is_multi_value_mode: boolean = false;
    //複数データの場合に、ユニークのみか
    private _is_unique: boolean = true;

    //child form mode
    private _is_child_form: boolean = false;
    private _max_child_number: number = null;
    private _min_child_number: number = null;
    private _open_empty_record: number = null;

    private _no_detail_link: boolean = false;

    private _condition_table_field: string;
    private _copy_fields: Array<any>;
    private _is_lookup_update_confirm: boolean = false;


    //display_condition
    private _display_condition_fields: Array<any>;

    private _is_own_parent_table: boolean = false;
    private _same_value: string;
    private _disable_switch: string;
    private _show_where: string;
    private _item_where: Array<any> = [];

    private _show_child_table_as_table: boolean = false;

    private _show_add_all_option: boolean = false;

    private _fixed_html: string = null;

    private _is_show_all_text: boolean = false;
    private _list_text_length: number = null;
    private _list_th_width: number = null;


    //style
    private _list_style: Object = {};
    private _detail_style: Object = {};
    private _set_list_style: Object = {};
    private _set_detail_style: Object = {};

    //button function
    private _button_label: string;
    private _button_function: string;

    //table type
    private _only_custom_table: boolean = false;

    //fields type
    private _target_table_field: string = null;
    private _accept_types: Array<string> = []
    private _only_custom_field: boolean = false;

    private _is_required_by_condition: boolean = false;
    private _is_show_by_condition: boolean = true;
    private _siblings: Array<any> = [];

    private _is_dummy_form: boolean = false;

    private _required_conditions: Conditions;
    private _show_conditions: Conditions;

    private _custom_field: Object;

    private _field_name: string = null;

    private _unique_key_name: string;

    private _multiple_table_name: string = null;

    private _show_add_on_list: boolean = true;

    private _show_lookup_modal: boolean = true;
    private _not_display_pulldown: boolean = false;
    private _display_num_on_list: number = 100;
    private _display_image_filename: boolean = false;
    private _show_pixel: boolean = false;
    private _is_limit_image_size: boolean = false;

    private _is_auto_fill_field: boolean = false;

    private _column_type: string = null;

    get field(): Object {
        return this._field;
    }

    get label(): string {
        return this._label;
    }

    get option_label(): string {
        return this._option_label;
    }

    get required(): boolean {
        return this._required;
    }

    get search_required(): boolean {
        return this._search_required;
    }

    get search_hide(): boolean {
        return this._search_hide;
    }

    get original_type(): string {
        return this._original_type;
    }

    get calc_result_type(): string {
        return this._calc_result_type;
    }

    get type(): string {
        return this._type;
    }

    get option(): any {
        return this._option;
    }

    get sublabel(): string {
        return this._sublabel;
    }

    get placeholder(): string {
        return this._placeholder;
    }

    get max_len(): number {
        return this._max_len;
    }

    get min_len(): number {
        return this._min_len;
    }

    get api_url(): string {
        return this._api_url;
    }

    get item_table(): string {
        return this._item_table;
    }

    get item_fields(): Array<any> {
        return this._item_fields;
    }

    get expression(): string {
        return this._expression;
    }

    get decimal_places(): number {
        return this._decimal_places;
    }

    get num_min(): number {
        return this._num_min;
    }

    get num_max(): number {
        return this._num_max;
    }

    get num_separator(): boolean {
        return this._num_separator;
    }

    get num_unit(): string {
        return this._num_unit;
    }

    get num_unit_order(): string {
        return this._num_unit_order;
    }

    get show_minus_red(): boolean {
        return this._show_minus_red;
    }

    get minus_format_triangle(): boolean {
        return this._minus_format_triangle;
    }

    get is_calc_auto_reload_off(): boolean {
        return this._is_calc_auto_reload_off;
    }

    get multi_select_flg(): boolean {
        return this._multi_select_flg;
    }

    get is_multi_value_mode(): boolean {
        return this._is_multi_value_mode;
    }

    get is_unique(): boolean {
        return this._is_unique;
    }

    get is_child_form(): boolean {
        return this._is_child_form;
    }

    get max_child_number(): number {
        return this._max_child_number;
    }

    get min_child_number(): number {
        return this._min_child_number;
    }

    get open_empty_record(): number {
        return this._open_empty_record;
    }


    get no_detail_link(): boolean {
        return this._no_detail_link;
    }

    get condition_table_field(): string {
        return this._condition_table_field;
    }

    get copy_fields(): Array<any> {
        return this._copy_fields;
    }


    get is_lookup_update_confirm(): boolean {
        return this._is_lookup_update_confirm;
    }

    get display_condition_fields(): Array<any> {
        return this._display_condition_fields;
    }

    get is_own_parent_table(): boolean {
        return this._is_own_parent_table;
    }

    get show_where(): string {
        return this._show_where;
    }
    get same_value(): string {
        return this._same_value;
    }
    get disable_switch(): string {
        return this._disable_switch;
    }

    set disable_switch($boolean_string) {
        this._disable_switch =  $boolean_string;
    }

    get item_where(): Array<any> {
        return this._item_where;
    }

    get show_add_all_option(): boolean {
        return this._show_add_all_option;
    }


    get default_value(): any {
        return this._default_value;
    }


    get checkbox_input_type(): string {
        return this._checkbox_input_type;
    }

    set field(value: Object) {
        this._field = value;
    }

    get fixed_html(): string {
        return this._fixed_html;
    }

    get table(): string {
        return this._table;
    }


    get is_show_all_text(): boolean {
        return this._is_show_all_text;
    }

    set is_show_all_text(value: boolean) {
        this._is_show_all_text = value;
        this.setCellStyle()
    }

    get list_text_length(): number {
        return this._list_text_length;
    }

    set list_text_length(value: number) {
        this._list_text_length = value;
        this.setCellStyle()
    }

    get list_th_width(): number {
        return this._list_th_width;
    }

    set list_th_width(value: number) {
        this._list_th_width = value;
        this.setCellStyle()
    }


    get list_style(): Object {
        return this._list_style;
    }

    set list_style(value: Object) {
        this._list_style = value;
        this.setCellStyle()
    }

    get detail_style(): Object {
        return this._detail_style ?? {};
    }

    set detail_style(value: Object) {
        this._detail_style = value;
        this.setDetailCellStyle()
    }

    get set_list_style(): Object {
        return this._set_list_style;
    }
    get set_detail_style(): Object {
        return this._set_detail_style;
    }

    get target_table_field(): string {
        return this._target_table_field;
    }

    set target_table_field(value: string) {
        this._target_table_field = value;
    }


    get button_label(): string {
        return this._button_label;
    }

    set button_label(value: string) {
        this._button_label = value;
    }

    get button_function(): string {
        return this._button_function;
    }

    set button_function(value: string) {
        this._button_function = value;
    }

    get use_current_as_default(): boolean {
        return this._use_current_as_default;
    }

    set use_current_as_default(value: boolean) {
        this._use_current_as_default = value;
    }


    get is_required_by_condition(): boolean {
        return this._is_required_by_condition;
    }

    set is_required_by_condition(value: boolean) {
        this._is_required_by_condition = value;
    }

    get is_show_by_condition(): boolean {
        return this._is_show_by_condition;
    }

    set is_show_by_condition(value: boolean) {
        this._is_show_by_condition = value;
    }

    get siblings(): Array<any> {
        return this._siblings;
    }

    set siblings(value: Array<any>) {
        this._siblings = value;
    }

    get required_conditions(): Conditions {
        return this._required_conditions;
    }

    get show_conditions(): Conditions {
        return this._show_conditions;
    }

    get field_name(): string {
        return this._field_name;
    }


    get use_switch(): boolean {
        return this._use_switch;
    }


    get boolean_text(): string {
        return this._boolean_text;
    }


    get multiple_table_name(): string {
        return this._multiple_table_name;
    }


    get show_add_on_list(): boolean {
        return this._show_add_on_list;
    }


    get show_lookup_modal(): boolean {
        return this._show_lookup_modal;
    }


    get not_display_pulldown(): boolean {
        return this._not_display_pulldown;
    }

    get accept_types(): Array<string> {
        return this._accept_types;
    }


    get only_custom_table(): boolean {
        return this._only_custom_table;
    }

    get only_custom_field(): boolean {
        return this._only_custom_field;
    }
    get custom_field(): object {
        return this._custom_field;
    }


    get display_num_on_list(): number {
        return this._display_num_on_list;
    }


    get display_image_filename(): boolean {
        return this._display_image_filename;
    }

    get show_pixel(): boolean {
        return this._show_pixel;
    }

    get show_child_table_as_table(): boolean {
        return this._show_child_table_as_table;
    }

    get is_limit_image_size(): boolean {
        return this._is_limit_image_size;
    }

    get column_type(): string {
        return this._column_type;
    }

    constructor(hash, table: string = null, type: string = null) {
        this._table = table;
        if (!hash) {
            return;
        }


        //dummy field
        this._field = {'Field': 'dummy'}
        for (const key of Object.keys(hash)) {
            let hashkey = key;

            if (key == 'label-fields') {
                hashkey = 'item_fields';
            } else if (key == 'item-table') {
                hashkey = 'item_table';
            } else if (key == 'boolean-text') {
                hashkey = 'boolean_text';
            } else if (key === 'required_condition_json') {
                if (hash[key]) {
                    this._required_conditions = new Conditions(JSON.parse(hash[key]))
                }
                continue;
            } else if (key === 'show_condition_json') {
                if (hash[key]) {
                    this._show_conditions = new Conditions(JSON.parse(hash[key]))
                }
                continue;
            }
            this['_' + hashkey] = hash[key];
        }

        // optionハッシュからshow_child_table_as_tableを設定
        if (hash['option'] && hash['option']['show_child_table_as_table']) {
            this._show_child_table_as_table = hash['option']['show_child_table_as_table'] === true ||
                hash['option']['show_child_table_as_table'] === 'true';
        }

        // optionオブジェクトから特定の値を取得
        if (hash['custom_field'] && typeof hash['custom_field'] === 'object' && !Array.isArray(hash['custom_field'])) {
            if (hash['custom_field']['show_minus_red'] !== undefined) {
                this._show_minus_red = hash['custom_field']['show_minus_red'] === true || hash['custom_field']['show_minus_red'] === 'true';
            }
            if (hash['custom_field']['minus_format_triangle'] !== undefined) {
                this._minus_format_triangle = hash['custom_field']['minus_format_triangle'] === true || hash['custom_field']['minus_format_triangle'] === 'true';
            }
        }

        this.resetConditionRequiedShowFlg();
        this.setFieldName();
        this.setCellStyle()
        this.setDetailCellStyle()

        if (type) {
            this._type = type;
            this._original_type = type
        }
    }

    createDummyForm(field_name: string, type: string = null) {
        this._field = {'Field': field_name};
        if (type) {
            this._type = type;
            this._original_type = type
        }

        this.setFieldName();
    }

    setFieldName() {
        this._field_name = this.field['Field']
    }

    getViewValueForSearch(table_info: TableInfo, _connect: Connect, value): Observable<any> {
        const observer: Observable<any> = new Observable((observer) => {


            if (this.type === 'select') {
                this.getSelectOptions(table_info, _connect).subscribe(option_items => {
                    let get_hit_label_by_value = (value) => {
                        let hit_val = null;
                        let is_hit: boolean = false;
                        option_items.forEach(opt => {
                            if (opt.value == value) {
                                hit_val = opt.label;
                                is_hit = true;
                            }
                        })
                        if (value == '{{admin.id}}') {
                            hit_val = 'ログインユーザー';
                            is_hit = true;
                        }
                        if (value == '{{division.id}}') {
                            hit_val = 'ログインユーザーの組織';
                            is_hit = true;
                        }
                        if (!is_hit) {
                            return '対象が見つかりません'
                        }
                        return hit_val;
                    }

                    if (Array.isArray(value)) {
                        let hit_val_a = value.map((v) => {
                            let hit_val = get_hit_label_by_value(v)
                            return hit_val ? hit_val : v
                        })

                        observer.next(hit_val_a)
                    } else {
                        let hit_val = get_hit_label_by_value(value)
                        if (hit_val) {
                            observer.next(hit_val)
                        } else {
                            observer.next(value)
                        }
                    }
                })
            } else {
                observer.next(value)
            }
            return {
                unsubscribe() {
                }
            };
        });
        return observer;

    }

    isDateField() {
        return ['date', 'datetime', 'time'].indexOf(this.type) >= 0
    }

    getLabel(): string {
        if (!this.label) {
            return '';
        }
        return this.label;
    }

    getSelectOptions(table_info: TableInfo, _connect: Connect, selectOptionItemsFilter: SelectOptionItemsFilter = null, current_value = null): Observable<any> {
        //これをFormの中に入れ込むと、loadingパラメータが更新されたとみなされて、検索結果画面が無限ループ
        // console.log(this.option)
        return table_info.getSelectOptions(this, _connect, selectOptionItemsFilter, current_value)

    }


    public isSelectOtherTable() {
        return this._original_type === 'select_other_table'
    }

    private cell_style: Object = {};
    private detail_cell_style: Object = {};

    getCellStyle(ignore_keys = []) {
        let cell_style = cloneDeep(this.cell_style)
        ignore_keys.forEach(key => {
            delete cell_style[key]
        })

        return cell_style


    }

    getDetailCellStyle(ignore_keys = []) {
        let cell_style = cloneDeep(this.detail_cell_style)
        ignore_keys.forEach(key => {
            delete cell_style[key]
        })

        return cell_style


    }

    setCellStyle() {
        let style: Object = (this._set_list_style ? this._list_style : null) ?? {};
        if (this._list_th_width) {
            style['width'] = (this._list_th_width) + 'px';
            style['overflow'] = 'hidden';
            style['text-overflow'] = 'ellipsis';
        }
        if (this._is_show_all_text || this._list_text_length) {
            style['white-space'] = 'normal';
        }
        this.cell_style = cloneDeep(style);
    }

    setDetailCellStyle() {
        let style: Object = (this._set_detail_style ? this._detail_style : null) ?? {};
        this.detail_cell_style = cloneDeep(style);
    }

    clearCellStyle() {
        this.cell_style = null;
    }

    getHeaderStyle(): Object {
        //FIXME: キャッシュする
        let style = {};
        if (this.list_th_width) {
            style['width'] = (this.list_th_width) + 'px';
        }

        return Object.assign({}, style)

    }

    shouldShowForm(raw_data: Object) {
        if (this.same_value && raw_data[this.field_name] == 'false'){
            raw_data[this.same_value] = raw_data[this.field_name];
        }

        if (this.show_where) {
            let show_where_and_a: Array<string> = this.show_where.split('&&')

            let flg = true;
            show_where_and_a.forEach(show_where => {
                show_where = show_where.trim()
                let g = show_where.match(/(.*?)(\!?=)(.*)/);
                if (g) {
                    const attribute = g[1].trim();
                    let condition = g[2].trim() == '=' ? 'eq' : 'noteq';
                    let condition_value = g[3].trim();
                    let attribute_a = [attribute];
                    if (attribute.match(/\./)) {
                        attribute_a = attribute.split('.');
                    }

                    if (raw_data[attribute_a[0]]) {
                        let check_value = raw_data[attribute_a[0]];
                        if (attribute_a[0].match(/_json/)) {
                            check_value = JSON.parse(check_value);
                            check_value = check_value[attribute_a[1]];
                            check_value = !!check_value;
                        }
                        //fixme
                        if (attribute_a[0] == 'action' && check_value.match(/,/)) {
                            check_value = check_value.split(',')
                        }
                        if (check_value === true || check_value === false) {
                            check_value = check_value ? 'true' : 'false'
                        }
                        if (condition === 'eq') {
                            if (Array.isArray(check_value)) {
                                flg &&= check_value.includes(condition_value);
                            } else {
                                flg &&= check_value == condition_value;
                            }
                        } else {
                            if (Array.isArray(check_value)) {
                                flg &&= !check_value.includes(condition_value);
                            } else {
                                flg &&= check_value != condition_value;
                            }
                        }
                    } else {
                        flg = false;
                    }
                }
            });


            return flg;
        }
        return true;

    }


    //NUMBER
    public getMinNumber(): number {
        return this._num_min !== null ? this._num_min : -Number.MAX_SAFE_INTEGER

    }

    public getMaxNumber(): number {
        return this._num_max ? this._num_max : Number.MAX_SAFE_INTEGER

    }

    public hasCustomTextLen() {
        return this.is_show_all_text || this.list_text_length != null;
    }


    get is_dummy_form(): boolean {
        return this._is_dummy_form;
    }

    set is_dummy_form(value: boolean) {
        this._is_dummy_form = value;
    }

    public resetConditionRequiedShowFlg() {
        this.is_required_by_condition = true;
        this.is_show_by_condition = true;
    }

    public isRequired(): boolean {

        //if select and has minimum num
        if (this.original_type === 'checkbox' && this.num_min && this.num_min > 0) {
            return true;
        }
        return this.required && this.is_required_by_condition;
    }


    public isInteger() {
        if (!this._custom_field) {
            return null;
        }
        return this._custom_field['switch_num'] === 'integer';
    }

    public clearOptions() {
        this.option = null
    }

    public getOriginalType(): string {
        if (!this.original_type) {
            return this.original_type
        }
        return this.type
    }

    public getFieldNameOrTmpUniqueKey(): string {
        if (this._id) {
            return this.field['Field']
        }
        return this._unique_key_name

    }

    public isSameType(_share: SharedService, _compare_form: Form): Observable<boolean> {
        const observer: Observable<boolean> = new Observable((observer) => {
            let extend_same_types = [
                ['date', 'year_month', 'datetime']
            ]
            this.getLookupType(_share, this, true, extend_same_types).subscribe(_this_type => {
                this.getLookupType(_share, _compare_form, true, extend_same_types).subscribe(_compare_type => {
                    observer.next(_this_type == _compare_type)
                });
            })
            return {
                unsubscribe() {
                }
            };
        });
        return observer

    }

    public getLookupType(_share: SharedService, form: Form, convert_same_type: boolean = false, extend_same_types = []): Observable<string> {
        const observer: Observable<string> = new Observable((observer) => {
            if (!form) {
                observer.next(null)
                return;
            }
            let field_type = form.original_type;

            if (form.is_multi_value_mode) {
                observer.next('text')
                return;
            }
            let same_types = [
                ['number', 'calc'],
                ['text', 'select', 'radio']
            ]
            if (extend_same_types.length > 0) {
                //for lookup
                same_types = same_types.concat(extend_same_types)
            }

            let found = false
            same_types.forEach(type_a => {
                if (convert_same_type && type_a.indexOf(field_type) >= 0) {
                    observer.next(type_a[0])
                    found = true
                }
            })
            if (found) {
                return
            }
            if (convert_same_type && ['number', 'calc'].indexOf(field_type) >= 0) {
                observer.next('number')
                return;
            }
            if (convert_same_type && ['select', 'radio'].indexOf(field_type) >= 0) {
                observer.next('text')
                return;
            }

            if (field_type == 'select_other_table') {
                observer.next('number')
                return;
            }
            observer.next(field_type)
            return {
                unsubscribe() {
                }
            };
        });
        return observer;

    }


    public getCustomClassName() {
        return 'pc-field-' + this.field_name.replace(/field__/, '')
    }

    public getCustomJaClassName() {
        let label = this.label ? this.label.replace(/ /g, '_').replace(/　/g, '_') : 'no_label';
        return 'pc-field-' + label
    }

    public getMultipleTableName() {

    }


    get isAutoFillField(): boolean {
        return this._is_auto_fill_field;
    }

    public isReferenceTarget(target_field_name: string) {
        return this._calc_reference_target_fields.indexOf(target_field_name) >= 0

    }

    public isEditable(table_info: TableInfo): boolean {
        return ['created', 'updated', 'id'].indexOf(this.field['Field']) === -1 && this.field['editable'] && this.label !== null && table_info.copyto_fields.indexOf(this.field['Field']) < 0;
    }

    public isCustomField(): boolean {
        return this.field['Field'].match(/^field__/)
    }

    public isFieldsMulti(): boolean {
        // multi_value_modeがtrueの場合も複数選択可能とする
        if (this._is_multi_value_mode) {
            return true;
        }
        return this._custom_field && this._custom_field['fields_multi'] ? true : false;
    }


    public isUseMultiplePulldown(ignoreLookup: boolean = false): boolean {
        if (['fields'].includes(this.type)) {
            return true;
        }
        return this.is_multi_value_mode && (!this.show_lookup_modal || ignoreLookup) && ['select_other_table'].indexOf(this.original_type) >= 0

    }

    public getFieldId(): number {
        return this.field_name.match(/field__/) ? parseInt(this.field_name.replace(/field__/, '')) : null;
    }
}

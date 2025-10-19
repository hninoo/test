import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, ViewChild, ViewChildren} from '@angular/core';
import {Connect} from 'app/services/connect';
import {TableInfo} from '../class/TableInfo';
import {SharedService} from '../services/shared';
import {Data} from '../class/Data';
import {AdminComponent} from './admin.component';
import ToastrService from '../toastr-service-wrapper.service';
import {Form} from '../class/Form';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {MatMenuTrigger} from '@angular/material/menu'
import {CrossTableHeader} from '../class/CrossTableHeader';
import { Condition } from 'app/class/Condition';

@Component({
    selector: 'admin-table', templateUrl: './admin-table.component.html',
    styleUrls: ['./admin-table.component.css'],
})

export class AdminTableComponent implements OnDestroy, OnInit {

    //required
    @Input() customFilter: CustomFilter;


    //arbitrary
    @Input() parent: Component;
    @Input() adminComponent: AdminComponent;
    @Input() sort_params: Object = {};


    //table_info or table_name is needed
    @Input() table_info: TableInfo;
    @Input() table: string;


    @Input() isSummarizeMode: boolean = false;
    @Input() hide_scroll: boolean = true;
    @Input() isShowManageCol: boolean = false;
    @Input() data_a: Array<Data>;
    @Input() openDeleteModal: Function;
    @Output() openBranConProsessTransModal: EventEmitter<Object> = new EventEmitter();
    @Input() openSetFieldWidthModal: Function;
    @Input() setSelectedCellId: Function;
    @Input() selectedCellId: string;
    @Input() showFormEditModal: Function;
    @Input() closeFormEditModal: Function;
    @Input() isEditModalShown: boolean;
    @Input() isMovable: boolean;
    @Input() onUpDown: Function;
    @Input() onFormatViewData: Function;
    @Input() reload: Function;
    @Input() child_a_by_id: Object;
    @Input() sort: Function;
    @Input() isEditMode: Boolean;
    @Input() current_url: string;
    @Input() view_fields: Array<any> = null;
    @Input() crossTableHeader: CrossTableHeader = null;

    @Input() is_relation_table: boolean = false;
    @Input() disable_float_management_buttons: boolean = false;

    @Input() embedMode: boolean = false;
    @Input() viewDataMode: boolean = false;
    @Input() clear_header_style: boolean = false;

    //Batch Commit
    @Output() onCheckboxChange: EventEmitter<Object> = new EventEmitter();
    @Output() onDuplicateSelectedIndex: EventEmitter<Object> = new EventEmitter();
    @Output() onSelectRow: EventEmitter<Object> = new EventEmitter();
    @Output() onAddToDeleteCommit: EventEmitter<Object> = new EventEmitter();
    @Output() changeSearchValue: EventEmitter<Object> = new EventEmitter();
    @Output() viewModallistEvent: EventEmitter<any> = new EventEmitter();

    @Output() onOpenUnlockModal: EventEmitter<Object> = new EventEmitter();
    @Output() ctrlClickEvent: EventEmitter<any> = new EventEmitter();
    @Output() onSelectData: EventEmitter<any> = new EventEmitter();
    @Output() onConfirmChangeAllFieldWidth: EventEmitter<any> = new EventEmitter();
    @Output() onForceLogout: EventEmitter<any> = new EventEmitter();
    @Output() onCellDataChanged: EventEmitter<any> = new EventEmitter();
    @Output() onTableManagementClick: EventEmitter<Object> = new EventEmitter();
    @Output() onClickTableHeader: EventEmitter<Object> = new EventEmitter();
    // @Output() freezeColCount: EventEmitter<Object> = new EventEmitter();

    public modal_data: Array<any>;
    @ViewChild('deleteModal') deleteModal: any;
    @ViewChild('clFreezeMenuTrigger') clFreezeMenuTrigger: MatMenuTrigger;
    @ViewChildren('fieldTableHeader') fieldTableHeader;
    public contextMenuPosition = {x: '0px', y: '0px'};


    private toasterService: ToastrService;

    private selectedRowIndex = -1;
    public showContext: boolean = false;
    private contextMenuX: Number;
    private contextMenuY: Number;

    public search_value_by_field: Object = {};
    public view: Object;
    public stored_width: [];
    public isShowEditForm: boolean = false;

    // for col_freez
    public rclicked_fields: Array<any>;
    public clFreeze: number;
    public calculated_left: number = 0;
    public iteration: number = 0;
    public stored_cell_left = [];
    public clear_fix: boolean = false;
    public r_clickField: string;
    public only_workflow_col_fix: boolean = false;
    public workflow_col_left = undefined;

    public sending: boolean = false;

    constructor(private _connect: Connect, private _share: SharedService, toasterService: ToastrService, private el: ElementRef, private _renderer: Renderer2, private cdr: ChangeDetectorRef) {
        this.toasterService = toasterService;
    }

    public _data_a: Array<Data>;

    public row_option: Object = {
        'show_check': false,
        'show_CRUD': false
    }

    // cross table
    // 集計項目が内訳にまとめられているか
    public breakdown_flg: boolean = false;

    ngOnInit(): void {
        // console.log('TABLE INIT')
        this.toggleRegisterScrollEvent()

        // カスタムフィルター更新イベントのリスナーを追加
        window.addEventListener('filter-updated', (event: CustomEvent) => {
            const detail = event.detail;
            if (detail && detail.table_name === this.table_info.table) {
                // フィルターが更新されたら再読み込み
                if (this.reload) {
                    this.reload(this.parent);
                } else {
                    // リロード関数がない場合はwindowのイベントを使用
                    if (window['update-admin-table-view']) {
                        window['update-admin-table-view']();
                    }
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        //get all keys of changes
        let keys = Object.keys(changes);
        //clear header style cache
        if (keys.length && keys.includes('clear_header_style')) {
            this.header_style_by_field = {};
        }

        if (keys.length == 1 && keys[0] == 'customFilter' || keys[0] == 'scrollLeft') {
            return;
        }
        if (keys.length && keys.includes('enableStickyTableHeader')){
            this.toggleRegisterScrollEvent()
            if (!this.enableStickyTableHeader){
                this.showingStickyTableHeader = false;
            }
        }

        this.calculated_left = 0;
        this.stored_cell_left = [];
        this.rclicked_fields = [];
        this.stored_width = JSON.parse(localStorage.getItem('width_setting'));
        this.showContext = false

        if (this.table) {
            this._share.getTableInfo(this.table).subscribe(_table_info => {
                this.table_info = _table_info
                if (!this.view_fields || changes.customFilter) {
                    if (!this.is_relation_table) {
                        this.loadViewFieldByTableInfo()
                    }
                }
                this.onLoadInfo();

                if (!this.data_a) {
                    let per_page = 10;
                    per_page = this.customFilter.max_record_num;
                    this._connect.getList(_table_info, 1, per_page, this.customFilter).subscribe(_data => {
                        this.data_a = []
                        _data['data_a'].forEach(_data => {
                            let newdata = new Data(this.table_info);
                            newdata.setInstanceData(_data)
                            this.data_a.push(newdata);
                        })
                    })
                }
            })
        } else if (this.table_info) {
            // console.log("table ",this.table_info)
            if (!this.view_fields || changes.table_info || changes.customFilter || this.customFilter) {
                if (!this.is_relation_table) {
                    this.loadViewFieldByTableInfo()
                }
            }
            this.onLoadInfo();
        }
        if (this.view_fields) {

            this.rclicked_fields = [];
            if (this.customFilter) {
                let filter_left_setting = localStorage.getItem(`fixed-field-name-${this.customFilter.id}`)
                if (filter_left_setting) {
                    this.stored_cell_left = [];
                    this.r_clickField = filter_left_setting;
                    this.confirmColFreeze();
                }
            } else {
                let nofilter_left_settings = localStorage.getItem(`fixed-fields-${this.table_info.table}`)
                if (nofilter_left_settings) {
                    let json_parse_nofilter_setting = JSON.parse(nofilter_left_settings);
                    this.rclicked_fields = json_parse_nofilter_setting;
                    this.only_workflow_col_fix = false;
                    if (json_parse_nofilter_setting.length == 1 && json_parse_nofilter_setting[0].includes('_workflow')) {
                        this.only_workflow_col_fix = true;

                    }
                }
            }
        }

        let breakdown_items = [];
        if (this.crossTableHeader && this.customFilter.summarizeFilter.summary_a.length > 1) {
            this.view_fields = this.view_fields.filter(field => {
                for (let summary of this.customFilter.summarizeFilter.summary_a) {
                    if (field.Field === summary.summary_field) {
                        breakdown_items.push(field);
                        return false;
                    }
                }
                return true;
            });
            if (breakdown_items.length > 0) {
                this.view_fields.push({ Name: '内訳', Field: 'breakdown_item_field' });
                this.breakdown_flg = true;
            }
        }
    }

    isSortable(field){
        if(this.table_info.forms.byFieldName(field.Field)){
            const isMultiMode = this.table_info.forms.byFieldName(field.Field).is_multi_value_mode;
            return (!this.isDashboard() && !this.is_relation_table) && field.Type != 'text' && !isMultiMode;
        }

        // Check if field.Field is start with y[0-9]
        if (field.Field.match(/^y\d+/)) {
            // If it starts with y[0-9], it is sortable
            return true;
        }

        return false;
    }

    sortField(field, header = null, cross_tab = false) {
        this.adminComponent?.sort?.(field, header, cross_tab);
        this.onClickTableHeader.emit({ field, header, cross_tab });
    }

    ngAfterViewChecked() {
        let ele;
        try {
            ele = document.querySelector('.normal-header').querySelectorAll('th');
        } catch (e) {
            return;
        }
        let calculate_left = 0;
        if (this.only_workflow_col_fix) {
            // for only workflow col fix

            let index = this.stored_cell_left.findIndex(x => x == this.r_clickField)
            if (index == -1) {
                this.stored_cell_left = [];
                let cal_left = ele[0].offsetWidth;
                this.stored_cell_left.push({[this.rclicked_fields[0]]: cal_left});
                this.workflow_col_left = cal_left;
                this.r_clickField = this.rclicked_fields[0]

            }
        } else {
            if (this.view_fields && (this.stored_cell_left.length > 0 || this.rclicked_fields.length > 0)) {
                this.view_fields.map((x, i) => {
                    if (!this.table_info.grant.edit || (this.view_fields.length == ele.length)) {
                        if (i > 0) {
                            calculate_left += ele[i - 1].offsetWidth;
                        } else {
                            calculate_left = 0;
                        }
                        this.workflow_col_left = 0;
                    } else {
                        if (this.table_info.menu.is_workflow) {
                            if (i == 0) {
                                this.workflow_col_left = ele[i].offsetWidth;
                                calculate_left += ele[i + 1].offsetWidth + ele[i].offsetWidth
                            } else {
                                calculate_left += ele[i + 1].offsetWidth
                            }
                        } else {
                            calculate_left += ele[i].offsetWidth
                        }
                    }
                    this.rclicked_fields.filter(j => {
                        if (x.Field == j) {
                            let store_index = this.stored_cell_left.findIndex(x => Object.keys(x)[0] == j && x[j] == calculate_left)
                            if (store_index == -1) {
                                this.stored_cell_left.push({[x.Field]: calculate_left})
                            }
                        }
                    })

                })
            } else {
                this.workflow_col_left = 0
                // console.error('no')
            }
        }
        if( this.enableStickyTableHeader ) this.setWidth();
        this.cdr.detectChanges();
    }

    ngOnDestroy(): void {
        this.showingStickyTableHeader           = false;
        this.toggleRegisterScrollEvent()
    }

    @Input() enableStickyTableHeader            = false;
    @Input() showingStickyTableHeader           = false;
    @Input() scrollLeft: boolean                = false;

    public isDisplayStickyHeader: boolean = false;

    setWidth(){
        if (!document.querySelector(".sticky-header") || !this.showingStickyTableHeader) {
            return;
        }
        let normalH = document.querySelector(".normal-header").querySelectorAll('th');
        let stickyH = document.querySelector(".sticky-header").querySelectorAll('th');
        $.each(normalH, (i,e) => {
            let width = e.getBoundingClientRect().width;

            if (e.classList.contains('manage-col-th')) width += 16;

            stickyH[i].style.width      = `${width}px`;
            stickyH[i].style.minWidth   = `${width}px`;

        })
    }

    scrollEventEnd(e) {
        //do something
    }

    scrollEvent(event) {
        if (!document.querySelector('.pc-list-view')) return;
        let tableRect = document.querySelector('.pc-list-view').getBoundingClientRect();
        if ( tableRect.width == 0 && tableRect.height == 0 )return;

        if (tableRect.y < 60) {
            this.showingStickyTableHeader = true;
        } else {
            this.showingStickyTableHeader = false
        }
    }


    toggleRegisterScrollEvent(){
        if (this.enableStickyTableHeader) {
            this._share.callbackOnScroll    = (e) => this.scrollEvent(e);
            this._share.callbackEndScroll   = (e) => this.scrollEventEnd(e);
        }else{
            this._share.callbackOnScroll    = null;
            this._share.callbackEndScroll   = null;
        }
    }

    getTheadStyle(typeClass){
        if (typeClass != 'sticky-header' || !this.showingStickyTableHeader || !this.enableStickyTableHeader)return {};
        return {
            'position': 'fixed',
            'margin-left': `-${this.scrollLeft}px`,
        }

    }

    onLoadInfo() {
        this.row_option['show_checkbox'] = this.table_info.grant.edit && !this.isSummarizeMode && !this.is_relation_table
    }

    loadViewFieldByTableInfo() {
        console.log("table info ",this.table_info);
        this.view_fields = this.table_info.getViewFields(this.customFilter, this._share.isMasterUser(), this.isSummarizeMode, this.is_relation_table, true)
    }

    getLabel(field_name) {
        //console.log('getLabel:');
        //let calcTime = performance.now()
        if (this.table_info.forms.byFieldName(field_name) !== undefined) {
            return this.table_info.forms.byFieldName(field_name).label;
        }

        if (field_name === 'breakdown_item_field') {
            return '内訳';
        }

        let label = '集計';


        if (field_name.match(/y\d+/) && this.customFilter) {
            this.customFilter.summarizeFilter.summary_a.forEach((summary, key) => {
                const y_field = 'y' + (key + 1);
                if (y_field === field_name) {
                    if (summary.label) {
                        label = summary.label;
                    } else if (summary.summary_field_type === 'calc') {
                        label = '集計項目' + (key + 1);
                    } else {
                        let form = this.table_info.forms.byFieldName(summary.summary_field)
                        let field_label: string = '';
                        if (form) {
                            field_label = form.label;
                        }
                        this._share.summary_a.forEach(summary_field => {
                            if (summary_field['value'] === summary.summary_type) {
                                if (summary_field['value'] === 'count') {
                                    label = summary_field['name'];
                                } else {
                                    label = field_label + ' (' + summary_field['name'] + ')';
                                }
                                return false;
                            }
                        })
                    }
                }
            })
            return label;
        }

        let m = field_name.match(/x(\d)+/)
        if (m && this.customFilter) {
            let field_label: string = this.table_info.forms.byFieldName(this.customFilter.summarizeFilter.fields[parseInt(m[1]) - 1].field).label;
            return field_label;
        }

        if (this.customFilter && this.customFilter.isSetSummarizeParam() && this.customFilter.summarizeFilter.fields) {
            this.customFilter.summarizeFilter.fields.forEach((field, key) => {
                if (field_name === 'x' + (key + 1)) {
                    label = field.label
                    //label = field_label_by_field_value[chart_param['field']];
                }
            })
        }
        //if(performance.now() - calcTime > 1)//console.log((performance.now() - calcTime));
        return label
    }


    /**
     * is show field or not
     * @param field
     */
    isShowField(field) {
        if (this.isSummarizeMode) {
            return ['fixed_html'].indexOf(this.table_info.forms.byFieldName(field['Field']).type) == -1;
        }
        if (!this.is_relation_table) {
            if (field['Field'] == 'id') {
                return this.table_info.menu.show_id;
            }
            if (field['Field'] == 'updated') {
                return this.table_info.menu.show_updated;
            }
            if (field['Field'] == 'created') {
                return this.table_info.menu.show_created;
            }
            if (field['Field'] == 'admin_id') {
                return this.table_info.menu.show_admin;
            }
        }
        return field.show_list;
    }


    /**
     * ==== DELETE DATA ====
     */

    onOpenBranConProsessTransModal(data: Data) {
        this.openBranConProsessTransModal.emit(data);
    }

    openAdminTableDeleteModal = (data: Data) => {
        if (this.openDeleteModal) {
            this.openDeleteModal(data);
            return;
        }
        if (data.raw_data[this.table_info.primary_key] === null) {
            this.toasterService.error('primary-keyがNULLです', 'エラー');
            return;
        }
        this.modal_data = [data.raw_data[this.table_info.primary_key]];
        this.deleteModal.show();
    }


    delete(id_a) {
        this._connect.post('/admin/delete/' + this.table_info.table, {'id_a': id_a}).subscribe(
            (jsonData) => {
                if (jsonData['result'] === 'success') {
                    if(this.reload) this.reload(this.parent);
                    this.deleteModal.hide();
                    this.toasterService.success(jsonData['success_count'] + '件のデータを削除しました。', '成功');
                    if (['dataset', 'view'].indexOf(this.table_info.table) >= 0) {
                        this._share.loadAdminDatas();
                    }
                    this._share.loadAdminDatas();
                    if(!this.reload) setTimeout(() => window.location.reload(), 1000);
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                    this.deleteModal.hide();
                }
            }, (error) => {
                this.deleteModal.hide();
            }
        );
    }

    selectRow(event, index) {
        if (!this.isEditMode) {
            return
        }
        event.preventDefault();

        this.showContext = true;
        this.selectedRowIndex = index;
        this.contextMenuX = event.clientX;
        this.contextMenuY = event.clientY;
        this.onSelectRow.emit(index);
    }

    duplicateSelectedRow() {
        this.onDuplicateSelectedIndex.emit();
        this.showContext = false;
    }

    add_selected_to_delete_commit(): void {
        this.onAddToDeleteCommit.emit();
        this.showContext = false;
        this.deleteModal.hide();
    }

    addDeleteSearchField(field_name: string): void {
        if (Object.keys(this.search_value_by_field).indexOf(field_name) >= 0) {
            delete this.search_value_by_field[field_name]
        } else {
            this.search_value_by_field = {[field_name]: null}
            //     // console.log('add')
            //     this.search_value_by_field[field_name] = null;
        }
    }

    isShowSearchButton(field_name) {
        let form: Form = this.table_info.forms.byFieldName(field_name)
        if (field_name.match(/field__/) && (!form || !form.original_type)) {
            return false;

        }
        if (form && form.type == 'image') {
            return false;
        }
        return !this.isDashboard() && (!this.customFilter || !this.customFilter.isSetSummarizeParam())
    }

    private isDashboard() {
        return !this.parent;
    }

    isShowSearchField(field_name: string): boolean {
        return Object.keys(this.search_value_by_field).indexOf(field_name) != -1;
    }

    getSearchCondition(field_name: string, return_condition: boolean = false): string | Condition {
        // Check if customFilter and conditions exist
        let condition = this.customFilter && this.customFilter.conditions.getConditionByField(field_name);
        if (condition) {
            // Return full condition object if return_condition is true
            if (return_condition) return condition;
            // Otherwise, return only the value of the condition
            return condition.value;
        }
        // Return empty string if no condition is found
        return '';
    }

    onSearchValueChange($event, field_name: string): void {
        delete this.search_value_by_field[field_name]

        if ($event.condition) {
            let condition = $event.condition;

            // Determine the appropriate condition to use
            if (!condition) {
                if (this.customFilter && !this.customFilter.id) {
                    condition = this.customFilter.conditions.getConditionByField(field_name);
                } else {
                    condition = this.customFilter.conditions.getConditionByFieldAndValue(field_name, this.search_value_by_field[field_name]);
                }
            }

            // Update condition and associate it with the event
            if (condition) {
                $event.condition_id = condition.id;
                condition.value = $event.value;
                $event.prev_condition = condition;
            }

            // Update search value if a new value is provided
            if ($event.value) this.search_value_by_field[field_name] = $event.value;
        }

        this.changeSearchValue.emit($event)
    }

    checkboxChange($event) {
        this.onCheckboxChange.emit();
    }

    checkboxAllChange(event) {
        // console.log(event)
        let checked = event.target.checked
        const checkbox_a = document.getElementsByName('data_check');
        for (let i = 0; i < checkbox_a.length; i++) {
            const checkbox = <HTMLInputElement>checkbox_a[i];
            checkbox.checked = checked
        }
        this.onCheckboxChange.emit();

    }

    dbclick(id, $event) {
        // if ($event.toElement.tagName.toUpperCase() !== 'TD') {
        //     return;
        // }
        if (!this.embedMode) {
            history.replaceState({}, null, `${window.location.pathname}?data_id=${id}&viewModal=true`)
        }
        // this.viewModallistEvent.emit(data);
        if (this.isEditMode || this.isSummarizeMode) {
            return;
        }
        this.viewModallistEvent.emit({tbinfo: this.table_info, id: id});
    }

    ctrlClickEventTable($event) {
        this.ctrlClickEvent.emit($event);
    }

    openUnlockModal($event) {
        this.onOpenUnlockModal.emit({
            'data': $event.data
        });
    }

    getRowStyle(data: Data) {
        if (data.row_style) {
            return data.row_style;
        }
        return {};
    }

    private header_style_by_field = {}

    getHeaderStyle(field_name: string, is_child_a_tag: boolean = false): Object {
        let cache_key = this.table_info.table + ':' + field_name + (is_child_a_tag ? 'is_c' : 'not_is_c') + (this.customFilter ? this.customFilter.id : 'no_filter')
        if (this.header_style_by_field[cache_key] && (this.stored_cell_left.length <= 0)) {
            if ('left' in this.header_style_by_field[cache_key]) {
                ['left', 'sticky', 'background', 'z-index', 'position'].forEach(e => delete this.header_style_by_field[cache_key][e])
            }
            return this.header_style_by_field[cache_key]
        }
        if (!this.stored_width) {
            this.stored_width = JSON.parse(localStorage.getItem('width_setting'));
        }
        let style;
        if (this.customFilter && this.customFilter.hasHeaderStyle(field_name)) {
            style = this.customFilter.getHeaderStyle(field_name);
        } else {
            style = this.table_info.forms.byFieldName(field_name) != undefined ? this.table_info.forms.byFieldName(field_name).getHeaderStyle() : {};
        }
        let width_setting = '';
        let pathname = location.pathname.replace(/;[\S]*/gm,'');
        let dataset_id = pathname.split('/admin/')[1]; 
        if (this.stored_width && this.stored_width[dataset_id]) {
            this.stored_width[dataset_id].map((setting) => {
                if (setting['field'] == field_name || setting['field'] == this.table_info.table + '_' + field_name) {
                    width_setting = setting['current_width'];
                }
            })
            width_setting ? style = {'width': width_setting} : style;
        }

        this.stored_cell_left.map((x, i) => {
            if (Object.keys(x)[0] == field_name) {
                let left = x[field_name];
                if (this.showingStickyTableHeader && this._share.sidebar_opened ) left += 251;
                style = Object.assign(style, {'left': `${left}px`, 'position': 'sticky', 'z-index': 3, 'background': 'white'})
            }
        })

        if (is_child_a_tag && style['width'] !== undefined) {
            style = Object.assign(style, {'text-overflow': 'ellipsis'})
        }
        this.header_style_by_field[cache_key] = Object.assign({}, style);
        return this.header_style_by_field[cache_key]
    }

    leftCalculate(iteration) {
        let ele = this.el.nativeElement.querySelectorAll('th');
        if (!this.table_info.grant.edit) {
            if (iteration > 0) {
                return this.calculated_left += ele[iteration - 1].offsetWidth;
            } else {
                return this.calculated_left = 0;
            }
        } else {
            return this.calculated_left += ele[iteration].offsetWidth;
        }
    }

    // confirm col freeze
    confirmColFreeze() {
        this.calculated_left = 0;
        let fields = [];
        this.stored_cell_left = [];
        if (this.r_clickField.includes('_workflow')) {
            this.only_workflow_col_fix = true
        } else {
            this.only_workflow_col_fix = false
        }
        if (this.only_workflow_col_fix) {
            let store_index = this.stored_cell_left.findIndex(x => Object.keys(x)[0] == this.r_clickField)
            if (store_index == -1) {
                if (this.stored_cell_left[0] != this.r_clickField) {
                    this.stored_cell_left.push({[this.r_clickField]: '37px'})
                }
                fields.push(this.r_clickField);
            }
        } else {
            this.view_fields.some((x, i) => {
                let res_left = 0;
                // if(this.table_info.menu.is_workflow) {
                //     res_left = this.leftCalculate(i+1);
                // }else{
                //     res_left = this.leftCalculate(i);
                // }
                // console.log(x.Field)
                this.stored_cell_left.push({[x.Field]: res_left})
                fields.push(x.Field);
                return x.Field == this.r_clickField
            })
        }
        this.rclicked_fields = fields;
        if (this.customFilter) {
            localStorage.setItem(`fixed-field-name-${this.customFilter.id}`, this.r_clickField)
        } else {
            localStorage.setItem(`fixed-fields-${this.table_info.table}`, JSON.stringify(this.rclicked_fields))
        }
        this.calculated_left = 0;
    }

    // confirm col fix clear
    confirmClearFixColumn() {
        this.clear_fix = undefined;
        if (this.customFilter) {
            localStorage.removeItem(`fixed-field-name-${this.customFilter.id}`)
        } else {
            localStorage.removeItem(`fixed-fields-${this.table_info.table}`);
        }
        this.only_workflow_col_fix = false;
        this.stored_cell_left = [];
        this.rclicked_fields = [];
        this.workflow_col_left = undefined;
        this.clear_fix = false;
    }

    // right click
    rightClick(field: string = '', $event, i: number = 0) {
        $event.preventDefault();
        this.clear_fix = false;
        if (this.rclicked_fields) {
            this.rclicked_fields.map(r_field => {
                if (r_field == field) {
                    this.clear_fix = true;
                }
            });
        }
        if (!this.clear_fix) {
            this.r_clickField = field;
        }

        if (!field.includes('_workflow')) {
            this.only_workflow_col_fix = false;
        }

        this.contextMenuPosition.x = $event.clientX + 'px';
        this.contextMenuPosition.y = $event.clientY + 'px';
        this.clFreezeMenuTrigger.menuData = {'item': i};
        this.clFreezeMenuTrigger.menu.focusFirstItem('mouse');
        this.clFreezeMenuTrigger.openMenu();
    }


    confirmFieldWidthChange() {
        console.log(this.fieldTableHeader)
        console.log(this.fieldTableHeader.toArray())
        let width_by_field: { [field_name: string]: number } = {}
        this.fieldTableHeader.toArray().forEach((e: ElementRef) => {
            console.log(e.nativeElement.id)
            let padding: number = 12
            try {
                if (window.getComputedStyle(e.nativeElement, null).paddingLeft) {
                    padding = parseInt(window.getComputedStyle(e.nativeElement, null).paddingLeft.replace('px', ''))
                }
            } catch (e) {
            }

            let width: number = e.nativeElement.offsetWidth - padding * 2
            width_by_field[e.nativeElement.id.replace('pfc-th-', '')] = width;
            console.log(width)
        })
        this.onConfirmChangeAllFieldWidth.emit({'post': {'width_by_field': width_by_field, 'table': this.table_info.table}})



    }


    cellDataChanged($event) {
        $event['adminComponent'] = this.adminComponent
        this.onCellDataChanged.emit($event)

    }

    handleTableManagementClick(event: any): void {
        console.log('テーブル管理クリックイベントを伝播:', event);
        this.onTableManagementClick.emit(event);
    }

}

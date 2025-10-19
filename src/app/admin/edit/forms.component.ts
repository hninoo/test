import {ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges, ViewChild} from '@angular/core';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {SharedService} from '../../services/shared';
import {ActivatedRoute, Router} from '@angular/router';
import {TableInfo} from '../../class/TableInfo';
import {Data} from '../../class/Data';
import {CdkDrag, CdkDragDrop, CdkDragMove, CdkDragRelease, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {Forms} from '../../class/Forms';
import {Form} from '../../class/Form';
import {Board} from 'app/class/Board';
import {isArray} from 'jquery';
import {OrientationChangeService} from 'app/services/utils/orientation-handler-service';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import * as cloneDeep from 'lodash/cloneDeep';
import {GroupService} from 'app/services/utils/group-service';
import {SortingService} from 'app/services/utils/sorting-service';
import {GlobalVariables} from 'app/common/global-variables';
import {SelectOptionItemsFilter} from '../../class/SelectOptionItemsFilter';
import {PublicFormService} from '../../services/public-form-service';
import {SelectOptionItemsFilterWhere} from 'app/class/SelectOptionItemsFilterWhere';
import { DragDropService } from 'app/services/drag-drop.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
    selector: 'admin-forms',
    templateUrl: './forms.component.html',
    styleUrls: ['./forms.component.css']
})

export class FormsComponent implements OnInit, OnChanges {
    @Input() table_info: TableInfo;
    @Input() fields: Array<any>;
    @Input() forms: Forms;
    @Input() data: Data;
    @Input() image_data: {};
    @Input() mode: string; // add or edit
    @Input() error_a;
    @Input() grant_menu_a;

    //not requied
    @Input() is_setting: boolean;
    @Input() dataset_edit_mode: string = null;
    @Input() IS_IFRAME_MODE: boolean = false;
    @Input() only_field_name: string = null;
    @Input() show_field_label: boolean = true;

    //for disabled inputs
    @Input() customFilter: CustomFilter;


    // idの差別化用
    @Input() grant_kind: string = null;

    // テーブル定義用
    @Input() is_custom_table_definition: boolean = false;
    @Input() is_custom_table_definition_popup: boolean = false;
    @Input() is_exist_table_definition: boolean;
    @Input() parent;
    @Input() child_index: number = null;
    @Input() id_prefix: string = '';
    @Input() is_add_new_button_select_other_table: boolean = true;
    @Input() IS_PUBLIC_FORM: boolean = false;
    @Input() IS_EMBED_MODE: boolean = false;
    @Input() siblings: Array<any> = [];

    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() openLookupSearchModal: EventEmitter<Object> = new EventEmitter();
    @Output() onLoadReflectForms: EventEmitter<Object> = new EventEmitter();

    public group_fields: Array<Array<any>> = [];
    public show_fields: Array<any> = [];
    public board = new Board({});


    public grant: {} = {};
    private toasterService: ToastrService;


    public child_data_a_by_fieldname: { [key: string]: Array<Data> } = {};

    //forms fieldへの更新検知用
    public last_updated: Date = null

    public select_other_edit_modal_form: Form = null;

    public selectOptionItemsFilter: SelectOptionItemsFilter;

    public last_option_changed_date: Date = null;

    public fixedOtherTableLabels: object = {};

    public field_delete_warning: string = "";

    public cloneConfirmText = '';

    public loadingFieldsNames: string[] = [];

    @Input() parent_data: Data = null;
    @Input() showDetailSettings: boolean;
    @Input() source: string;  // Source Receive
    @Output() showDetailSettingsChange = new EventEmitter<boolean>();

    // テーブル定義項目用削除モーダル
    @ViewChild('deleteFieldModal') deleteFieldModal: any;
    @ViewChild('cloneFieldConfirm') cloneFieldConfirm: any;
    @ViewChild('selectOtherEditModal') selectOtherEditModal: any;
    @ViewChild('lookupModal') lookupModal: any;


    private froala_option: Object = {
        placeholderText: '',
        charCounterCount: false
    };
    private datetime_config_ja = {
        firstDayOfWeek: 0,
        dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
        dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
        monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    };

    private modal_data;
    private view_data;
    private raw_data;

    private modal_field;
    private downloading: string = null;



    private exist_table_a: Array<any> = [];
    private exist_table_field_by_table = {}
    /**
     * Table定義用
     */
    private pre_table: string = null;
    public auto_complete_values: Array<any>
    public placeholder_visible = false;
    private wide_view_fields;
    private narrow_view_fields;

    /** to scroll dropped ele position */
    public currentDropEle;
    public currentScrollPosition;
    public uniqueID;

    //custom button
    public sending_custom_button: boolean = false;

    constructor(private _router: Router, private _connect: Connect, public dragDropService: DragDropService, toasterService: ToastrService, public _share: SharedService, private _route: ActivatedRoute, private renderer: Renderer2, private orientationChangeService: OrientationChangeService, private cd: ChangeDetectorRef, private groupService: GroupService, private sortingService: SortingService, private publicFormService: PublicFormService) {
        this.toasterService = toasterService;
        this.dragDropService = dragDropService;
        this.uniqueID = uuidv4();
    }

    ngAfterViewInit(): void {

        if (this.isFieldEditMode()) {
            this.dragDropService.register(`dragRow_${this.uniqueID}`);
            this.dragDropService.register('dragSidebarList');
            this.group_fields.map((row, i) => {
                this.dragDropService.register(`dragRowField_${this.uniqueID}_${i}`);
            })
        }
    }

    public get connectedLists() {
        return this.dragDropService.dropLists;
    }

    allowDropPredicate = (drag: CdkDrag, drop: CdkDropList) => {
        return this.dragDropService.isDropAllowed(drag, drop);
    };

    ngDoCheck() {
        /** go scroll dropped ele position */
        if (this.currentDropEle && document.getElementById(`${this.currentDropEle}`)) {
            $('.app-body').animate({ scrollTop: this.currentScrollPosition })
            $('.drag-drop-mode').animate({ scrollTop: $(`#${this.currentDropEle}`).position().top })
            this.currentDropEle = null;
        }
    }

    dropControll(event: CdkDragDrop<[]>,type='row',data=[],index=0 ){
        let newField = false, x_order, y_order, reorder_y = false, reorder_x = false;
        if( event.item.data.Field == undefined ) newField = true;

        y_order = index + 2; x_order = 1;
        this.currentDropEle = `dragRowField_${this.uniqueID}_${index}`;

        if (type == 'row' ) {
            reorder_y = true;
            //
            if(data.length != 0){
                reorder_y = false;
                if (data.length > 1){
                    y_order = data[data.length -2][0].y + 2;
                    this.currentDropEle = `dragRowField_${this.uniqueID}_${data.length}`;
                }else{
                    y_order = data[data.length -1][0].y + 3;
                }
            }
        } else {
            reorder_y = true;
            if (data.length != 0){
                y_order = data[0].y;
                if (y_order == 1) y_order = y_order + 1
                // x_order = data.length + 1;
                x_order = event.currentIndex + 1;
                reorder_x = (data.length + 1 != x_order);
                reorder_y = false;
            }
            if( data.length >= 4 ){
                this.toasterService.clear();
                this.toasterService.error('1行に４項目まで配置可能です。');
                // y_order +=2;
                // x_order  = 1;
                // reorder_y = true;
                return;
            }
        }


        if(type == 'row'){
            if(newField){
                this.parent.addFieldDrop(event,reorder_x,reorder_y,x_order,y_order);
            }else{
                //update y order as last if rowFields drop to row droplist
                let end_y = this.group_fields[this.group_fields.length - 2][0].y;
                if( event.item.data.y != end_y ) this.parent.updateFieldYorder(event.item.data,end_y+2);
                // this.drop(event, [], this.group_fields.length -1 );
            }
        }else if(type == 'row_field'){
            if (newField) {
                this.parent.addFieldDrop(event,reorder_x,reorder_y, x_order,y_order);
            }else{
                this.drop(event, data, index);
            }
        }
        this.parent.drag_placeholder_visible = false;
        // store current scroll top
        this.currentScrollPosition = $('.app-body').scrollTop();
    }

    isFieldEditMode(): boolean {
        return this.is_custom_table_definition && this.dataset_edit_mode == 'dataset_field';
    }

    dragMoved(event: CdkDragMove<any>) {
        this.dragDropService.dragMoved(event);
    }

    dragReleased(event: CdkDragRelease) {
        this.dragDropService.dragReleased(event);
    }


    ngOnChanges(changes: SimpleChanges): void {
        //select_other_tableの項目の、絞り込みフィルタ設定
        this.selectOptionItemsFilter = new SelectOptionItemsFilter()
        this.setSelectOptionItemFilter();


        //added this condition to skip cycle loop when click edit mode
        //when occur edit mode, the dataset_edit_mode is null
        //to sort dataset edit fields
        if (this.mode == 'edit' && this.customFilter || this.dataset_edit_mode != null) this.group_fields = [];
        if (this.group_fields.length == 0 || changes.fields) {
            let group_fields = []
            this.fields.forEach(field => {
                field.y = field.y_base;
                field.x = field.x_base

                if (this.customFilter && this.customFilter.show_fields.length > 0) {
                    let position = this.customFilter.show_fields.indexOf(field['Field']);
                    if (position != -1) {
                        field.y = position;
                    }
                }

                if (group_fields.length == 0 || field.y == undefined) {
                    if (field['Field'] != undefined) {
                        group_fields.push([field])
                    } else {
                        group_fields.push(field)
                    }
                } else {
                    this.groupService.groupByAxis(group_fields, field)
                }
            })

            if (this.customFilter && this.customFilter.show_fields.length > 0) {
                this.sortingService.selectionSort(group_fields, 0, 'y')
            }

            /*if (group_fields.length > 1) {
                this.sortingService.selectionSort(group_fields, 0, 'y');

            }*/

            this.group_fields = group_fields;
        }
        this.wide_view_fields = this.group_fields;

        this.onChangeData()
        let mobile_view_fields = []
        this.group_fields.map(field => {
            if (isArray(field)) {
                field.map(field_column => {
                    mobile_view_fields.push([field_column])

                })
            } else {
                mobile_view_fields.push(field)

            }

        })
        this.narrow_view_fields = mobile_view_fields
        if (!this.is_custom_table_definition && window.visualViewport.width < GlobalVariables.maxSmartPhoneWidth) {
            this.group_fields = this.narrow_view_fields

        }

        //register again when changed field list
        if (this.isFieldEditMode()) {
            this.dragDropService.register(`dragRow_${this.uniqueID}`);
            this.dragDropService.register('dragSidebarList');
            this.group_fields.map((row, i) => {
                this.dragDropService.register(`dragRowField_${this.uniqueID}_${i}`);
            })
        }

        if (changes.forms && JSON.stringify(changes.forms.previousValue) !== JSON.stringify(changes.forms.currentValue)) {
            this.reflectRequiredShowCondition(null, null, this.parent_data);
        }

        // デフォルト値があるときルックアップするため変更を反映
        if(changes.mode && changes.mode.currentValue == 'add' && changes.forms && changes.forms.firstChange){
            Object.keys(changes.forms.currentValue._forms).forEach(key => {
                let form = changes.forms.currentValue._forms[key];
                if(form._default_value && form._copy_fields.length > 0){
                    const default_value = form._default_value == '{{admin.id}}' ? this._share.user.id : form._default_value;
                    this.changeValue(form._field_name, default_value);
                }
            });
        }
    }

    public isLoadingField(fieldName: string): boolean {
        return this.loadingFieldsNames.includes(fieldName);
    }

    @HostListener('window:orientationchange', ['$event'])
    handleOrientatoinChange(event) {
        this.group_fields = this.orientationChangeService.changeFieldOrientation(this.wide_view_fields, this.narrow_view_fields)
    }


    ngOnInit() {
        // debugger;

    }


    onChangeData() {
        //FIXME:後で親componentに伝える
        this.view_data = this.data.view_data;
        this.raw_data = this.data.raw_data;
        this.fields.forEach((field) => {
            if (isArray(field)) {
                field.forEach((field_column) => {
                    this.grant[field_column.Field] = this.raw_data[field_column.Field] === 'all' ? 'all' : 'custom';

                    if (this.forms.byFieldName(field_column.Field) && this.forms.byFieldName(field_column.Field).is_multi_value_mode) {
                        this.child_data_a_by_fieldname[field_column.Field] = this.getChildDataAry(field_column.Field);
                    }
                })
            } else {
                this.grant[field.Field] = this.raw_data[field.Field] === 'all' ? 'all' : 'custom';

                if (this.forms.byFieldName(field.Field) && this.forms.byFieldName(field.Field).is_multi_value_mode) {
                    this.child_data_a_by_fieldname[field.Field] = this.getChildDataAry(field.Field);
                }

                // 固定値の他テーブルのラベルを取得
                if(this.forms.byFieldName(field.Field) && field.fixed_value && this.forms.byFieldName(field.Field).original_type == 'select_other_table'){
                    this.forms.byFieldName(field.Field).getSelectOptions(this.table_info,this._connect).subscribe(option_items=>{
                        for (let key in option_items) {
                            let option = option_items[key];

                            if (option.value == field.fixed_value) {
                                this.fixedOtherTableLabels[field.fixed_value] = option.view_label;
                                break;

                            }
                        }
                    })
                }
            }

        })
        // this.forms.getArray().forEach(form => {
        //     form.resetConditionRequiedShowFlg()
        //     //FIXME: comment
        //     //this.onEdit(form.field['Field'])
        // })
        // this.cd.detectChanges()
        // console.log('form on chang data', this.data.last_dirty_changed)
    }

    public isTableFieldDefinition() {
        return (this.is_custom_table_definition || this.is_exist_table_definition) && (this.is_custom_table_definition_popup || this.isShowFieldDefinitionForm(null));
    }

    hasFixedOtherTableLabels(fixed_value: string): boolean {
        return this.fixedOtherTableLabels.hasOwnProperty(fixed_value);
    }


    getFroalaOption() {

        let option = this._share.getFroalaOption('simple', this.table_info.table);
        option['key'] = this._share.froala_key;
        return option;
    }

    clickOverArea($event, field) {
        if ($event) {
            if ($event.target.tagName.toUpperCase() === 'DIV') {
                this.parent.openSettingModal(field, false);
            }
        }
    }

    openSettingModal(field) {
        this.parent.openSettingModal(field, false);
    }

    addFieldData(field){
        this.modal_field = field
        this.cloneConfirmText = `${field.Comment} をコピーしますか？`;
        this.cloneFieldConfirm.show();
    }

    cloneFieldData(){
        this.parent.duplicateFieldData(this.modal_field);
        this.cloneFieldConfirm.hide();
    }

    async getDeletableFieldError(fieldObj) {
        const forms = this.forms['_forms'];
        // get all calc fields
        let calcFieldNames = Object.keys(forms).filter(key => forms[key].type === 'calc');

        // extract all expression fields
        let errorFields = [];
        calcFieldNames.forEach(fieldName => {
            let expression = forms[fieldName].expression;
            if (expression) {
                let fields = expression.match(/\{[\w|\p{L}|::]+\}/gmu);
                if (fields) {
                    fields.forEach(field => {
                        let expressionField = field.replace(/{|}/g, '');
                        if ( expressionField == fieldObj.Comment) {
                            errorFields.push(`項目「${fieldObj.Comment}」は計算項目「${expressionField}」で使われているため削除できません`);
                        }
                    });
                }
            }
        });

        var data = await this._connect.post(`/admin/check-deletable/dataset/${this.data.raw_data['id']}/${fieldObj.Field}`, fieldObj).toPromise();

        if (!data.deletable) {
            errorFields.push(data.error_message);
        }

        return errorFields;
    }

    async openTableDetectionDeleteModal(field) {
        this.modal_field = field;

        // 表示条件に使われているかの確認
        const forms = this.forms['_forms'];
        this.field_delete_warning = '';

        let fieldErrors = await this.getDeletableFieldError(field);
        if (fieldErrors.length > 0) {
            let fieldError = fieldErrors.join(',');
            this.toasterService.error(fieldError);
            return;
        }

        for (let key in forms) {
            if (!forms.hasOwnProperty(key)) {
                continue;
            }
            let form = forms[key];
            if (key == form.field) {
                continue;
            }
            if (!form.show_conditions) {
                continue;
            }

            for(let i = 0; i < Object.keys(form.show_conditions.condition_a).length; i++) {
                if (form.show_conditions.condition_a[i].field == this.modal_field.Field) {
                    this.field_delete_warning += form.label + ',';
                }
            }
        }

        if(this.field_delete_warning != '') {
            this.field_delete_warning = this.field_delete_warning.slice(0, -1);
        }

        this.deleteFieldModal.show();
    }


    haveLargeItem(form) {
        return (form.option.length > 30)
    }

    isEditableField(field, debug: boolean = false) {

        if (debug) {
            console.log('this.isShowField(field)')
            console.log(this.isShowField(field) ? 'true' : 'false')

            console.log('field.fixed_value')
            console.log(!field.fixed_value ? 'true' : 'false')

            console.log('(this.mode !== \'edit\' || field.only_add === false) ')
            console.log((this.mode !== 'edit' || field.only_add === false) ? 'true' : 'false')

            console.log('this.table_info.grant.isEditableField(field[\'Field\'])')
            console.log(this.table_info.grant.isEditableField(field['Field']) ? 'true' : 'false')

            console.log('!this.data.grant || this.data.grant.edit');
            console.log(!this.data.grant || this.data.grant.edit ? 'true' : 'false')

            console.log('ALL')
            console.log(this.isShowField(field) && !field.fixed_value && (this.mode !== 'edit' || field.only_add === false) && this.table_info.grant.isEditableField(field['Field']) &&
                (!this.data.grant || this.data.grant.edit))
        }
        return this.isShowField(field) && !field.fixed_value && (this.mode !== 'edit' || field.only_add === false) && this.table_info.grant.isEditableField(field['Field']) &&
            (!this.data.grant || this.data.grant.edit);
    }

    isChildField(field): boolean {
        let form = this.forms.byFieldName(field.Field);
        if (!form) {
            return false;
        }

        return form.original_type === 'select_other_table' && form.custom_field && form.custom_field['is_child_form'];
    }

    getChildTable(field): any {
        let form = this.forms.byFieldName(field.Field);
        if (!form || !form.custom_field) {
            return null;
        }
        
        let childTablename = form.custom_field['item-table'];
        if (!childTablename || !this.parent?.data?.child_a) {
            return null;
        }

        let childs = this.parent.data.child_a.filter((child: any) => {
            return child.table === childTablename;
        });

        return childs && childs.length > 0 ? childs[0] : null;
    }

    isShowField(field, includeChildTable = true) {
        // console.log(this.data.raw_data)
        let form = this.forms.byFieldName(field.Field);
        if (!form) {
            return false;
        }

        if (this.only_field_name) {
            if (this.only_field_name != field.Field) {
                return false;
            }
        }

        let is_hide_field_by_custom_filter: boolean = false;
        if (this.customFilter && this.customFilter.edit_use_show_fields && this.customFilter.show_fields.length > 0) {
            if (this.mode === 'add') {
                is_hide_field_by_custom_filter = this.customFilter.show_fields.indexOf(field['Field']) == -1 && !form.isRequired()
            } else if (this.mode === 'edit') {
                is_hide_field_by_custom_filter = this.customFilter.show_fields.indexOf(field['Field']) == -1
            }
        }

        // 子テーブルのとき
        if (form.siblings && Object.keys(form.siblings).length > 0 && this.raw_data.order && form.siblings[this.raw_data.order]?.hasOwnProperty(field.Field)) {
            // 新規作成のレコード
            form.is_show_by_condition = form.siblings[this.raw_data.order][field.Field]["show"]
        } else if(form.siblings && Object.keys(form.siblings).length > 0 && form.siblings[this.raw_data.id]?.hasOwnProperty(field.Field)) {
            // 既存のレコード
            form.is_show_by_condition = form.siblings[this.raw_data.id][field.Field]["show"]
        }

        // 子テーブルフィールドの場合、表示可能にする
        if (includeChildTable && form.original_type === 'select_other_table' && form.custom_field && form.custom_field['is_child_form']) {
            field.editable = true;
        }

        return ['created', 'updated', 'updated_admin_id'].indexOf(field.Field) === -1 &&

            field.editable && this.forms.byFieldName(field.Field).label !== null &&
            (field.show_edit === undefined || field.show_edit) &&
            !this.raw_data['__disabled'] &&
            ((this.parent != undefined && this.parent.table === 'dataset') || this.forms.byFieldName(field.Field).type !== 'calc' || this.raw_data['id'] !== undefined || this.forms.byFieldName(field.Field).is_calc_auto_reload_off) &&
            form.is_show_by_condition &&
            !is_hide_field_by_custom_filter;
    }


    isEdittableFieldType(field_type) {
        return ['created_at', 'updated_at'].indexOf(field_type) === -1
    }

    is_string(data) {
        return data instanceof String;
    }

    getTablenameFromTable(table) {
        for (const key of Object.keys(this.exist_table_a)) {
            const exist_table = this.exist_table_a[key];
            if (exist_table['value'] === table) {
                return exist_table['label'];
            }
        }

        return null;
    }

    getThis() {
        return this;
    }

    getEditComponent() {
        return this.parent;
    }

    /**
     * Table定義用
     */
    setChildFieldForms(reset = false) {
        this.parent.setChildFieldForms(reset)
    }

    /**
     * itemsの項目追加時
     */
    addSelectItem(data) {
        if (!data['option']['items']) {
            data['option']['items'] = [];
        }
        data['option']['items'].push({'value': '', 'label': ''})

    }


    /**
     * テーブル定義項目削除
     * @param field
     */
    deleteField() {
        this.parent.deleteFieldData(this.modal_field)

        this.deleteFieldModal.hide();
    }

    isShowFieldDefinitionForm(field) {
        if (!this.is_exist_table_definition || (field !== null && (field.Field === 'use' || field.Field === 'field'))) {
            return true;
        }
        return this.raw_data['use'] !== 'false';
    }

    getValue(field) {
        let value = this.raw_data[field['Field']];
        if (!value) {
            return value;
        }
        if (value instanceof Date) {
            value = this._share.getDateTimeStringByDate(value, this.forms.byFieldName(field['Field']).type);
        }
        return value;

    }

    shouldShowForm(form: Form) {
        if (form.label === '通知するワークフローステータス') {
            let flg = form.shouldShowForm(this.raw_data)
        }
        if (form.label === '2段階認証方法') {
            if (this.data.raw_data['id'] === this._share.user.id) {
                return this._share.admin_setting['setTwoFactor'] === 'true';
            } else {
                return false
            }
        }
        return form.shouldShowForm(this.raw_data)
    }

    getAutoCompleteValues(table) {
        this._connect.post('/admin/table/grant/' + table, {}).subscribe(
            (data) => {
                if (data.view_grant == false) {
                    this.toasterService.error('テーブル権限がありません');
                    this.onValueChanged({ field_name: "table", value: null })
                    return
                }
                this._share.getTableInfo(table).subscribe(table_info => {
                    let fields_array = [];
                    if (!table_info.forms) {
                        return;
                    }
                    table_info.forms.getArray().forEach((form: Form) => {
                        fields_array.push(form.label)
                        //fields_array.push(key)
                    })
                    // console.log(fields_array)
                    this.auto_complete_values = fields_array;
                    // console.log(this.auto_complete_values)
                })
            }
        )
    }

    private pre_select_other_value: string;
    private selected_multi_value_index: number;

    onValueChanged($event) {
        this.last_updated = new Date();
        let needCallOnEdit = true;
        if ($event.child_table == null || $event.value === '__NEW__') {
            let form = this.table_info.forms.byFieldName($event.field_name)
            if (form && form.original_type == 'select_other_table') {
                if ($event.value === '__NEW__') {
                    this.selected_multi_value_index = $event.data_index
                    this.pre_select_other_value = $event.pre_value
                    this.addNewSelectOtherTableData(form)
                    return;
                }

            }

            let updHash = {};
            updHash[$event.field_name] = $event.value;
            this.data.setRawData(updHash);
            this.raw_data = this.data.raw_data
            this.view_data = this.data.view_data

            //copy fieldを読み込む
            let value = $event.value;
            if ($event.field_name == 'table' && $event.value != null) {
                this.getAutoCompleteValues($event.value)
            } else {
                if ($event.field_name == 'table' && $event.value == null) {
                    this.auto_complete_values = []
                }
            }
            if (form && form.original_type === 'select_other_table' && form.copy_fields && form.copy_fields.length > 0 && value && !this.isAutoFillField(form.field['Field'])) {
                this.setLoadingOfCopyFields(form.field_name)
                needCallOnEdit = false;
                let params = null
                let for_lookup_params = null;
                if (this.IS_IFRAME_MODE) {
                    for_lookup_params = this.publicFormService.publicPostParams;
                    params = {
                        ...for_lookup_params,
                        table: this.table_info.table,
                        filter_id: null,
                        for_lookup: true,
                        for_grant_table: for_lookup_params.table,
                        for_grant_filter_id: for_lookup_params.filter_id,
                        for_grant_rid: for_lookup_params.rid,
                    };
                }
                this._share.getTableInfo(form.item_table, this.IS_IFRAME_MODE, params, true, false).subscribe(_table_info => {
                    this._connect.getOne(_table_info, value, for_lookup_params).subscribe(_data => {
                        let copy_from_data = new Data(_table_info)
                        copy_from_data.setInstanceData(_data['data_a'][0])
                        let updHash = {}

                        let is_update_exist = false;
                        form.copy_fields.forEach(copy_field => {
                            is_update_exist ||= (!!this.data.getRawData(copy_field['to']) && !copy_field['is_auto_reflect']);
                        })

                        let update_confirmed = false;
                        if (is_update_exist && form.is_lookup_update_confirm) {
                            update_confirmed = confirm('現在の値を上書きしてよろしいですか？');

                        }

                        let uncopied_field_name_a = []
                        let updHashForMulti = {}
                        form.copy_fields.forEach(copy_field => {
                            if (copy_field['is_auto_reflect']) {
                                //自動ルックアップの場合、on-editで更新するため、ここでは更新しない
                                return;
                            }
                            if (!copy_field['is_auto_reflect'] && !update_confirmed && !copy_field['is_force_overwrite']) {

                                if(!this.forms.byFieldName(copy_field['to']).is_multi_value_mode && this.data.getRawData(copy_field['to'])){
                                    uncopied_field_name_a.push(this.table_info.forms.byFieldName(copy_field['to']).label)
                                    return;
                                } else if(this.forms.byFieldName(copy_field['to']).is_multi_value_mode && this.data.child_data_by_table[this.forms.byFieldName(copy_field['to']).multiple_table_name].length > 0){
                                    uncopied_field_name_a.push(this.table_info.forms.byFieldName(copy_field['to']).label)
                                    return;
                                }
                            }

                            if (this.table_info.forms.byFieldName(copy_field['to']).type === 'image') {

                                const image_data = copy_from_data.view_data[copy_field['from']]
                                if (image_data) updHash[copy_field['to']] = image_data.thumbnail_url
                            } else {
                                let _copy_from_form = _table_info.forms.byFieldName(copy_field['from'])
                                if (_copy_from_form.isAutoFillField && _copy_from_form.type != 'number' && _copy_from_form.type != 'calc') {
                                    updHash[copy_field['to']] = copy_from_data.getViewData(copy_field['from'])
                                } else if(_copy_from_form.original_type == 'select_other_table' && this.table_info.forms.byFieldName(copy_field['to']).type != 'select'){
                                    updHash[copy_field['to']] = copy_from_data.getViewData(copy_field['from'])
                                } else {
                                    updHash[copy_field['to']] = copy_from_data.getRawData(copy_field['from'])
                                }

                                if(this.forms.byFieldName(copy_field['to']).is_multi_value_mode){
                                    updHashForMulti[this.forms.byFieldName(copy_field['to']).multiple_table_name] = copy_from_data.getRawData(copy_field['from'])
                                }
                            }
                        })
                        this.data.setRawData(updHash);

                        Object.keys(updHashForMulti).forEach(key => {
                            const multiValueData = updHashForMulti[key];
                            multiValueData.forEach(value => {
                                this.data.setChildData(this.data.getChildTableInfoByTable(key), { 'value': value }, null);
                            });

                        });
                        this.last_option_changed_date = new Date();
                        if (uncopied_field_name_a.length > 0) {
                            this.toasterService.warning(uncopied_field_name_a.join(',') + 'は空ではないため自動入力されませんでした');
                        }
                        //this.data = this.data.getCopy()
                        this.onEdit($event, params)

                        // ルックアップによって更新されたフィールドに基づいて絞り込みを再実行
                        // ルックアップフィールドの処理を統合
                        form.copy_fields.forEach(copy_field => {
                            if (copy_field['is_auto_reflect']) {
                                // 自動ルックアップフィールドは非同期で更新されるため遅延が必要
                                setTimeout(() => {
                                    this.setSelectOptionItemFilterAfterLookup(copy_field['to']);
                                }, 500);
                            } else if (updHash[copy_field['to']]) {
                                // 手動ルックアップフィールドは即座に処理
                                this.setSelectOptionItemFilterAfterLookup(copy_field['to']);
                            }
                        });

                        this.valueChanged.emit($event);
                    })
                }, error => {
                    let uncopied_field_name_a = []
                    form.copy_fields.forEach(copy_field => {
                        if (!this.data.getRawData(copy_field['to']) && !copy_field['is_auto_reflect']) {
                            uncopied_field_name_a.push(this.table_info.forms.byFieldName(copy_field['to']).label)
                        }
                    });
                    if (!this.IS_PUBLIC_FORM) {
                        this.toasterService.warning('ルックアップ先の閲覧権限がないため、' + uncopied_field_name_a.join(',') + 'は更新されません');
                    }
                })

            }


            //絞り込みフィールドを読み込む
            if (form) {
                this.setSelectOptionItemFilter($event.field_name)

            }

        } else {
            //multiple value
            if (Array.isArray($event.value)) {
                this.data.resetChildData($event.child_table)
                $event.value.forEach((value, index) => {
                    this.data.setChildData(this.data.getChildTableInfoByTable($event.child_table), {'value': value, 'tmp_year': $event.tmp_year, 'tmp_month': $event.tmp_month}, $event.data_index);
                });
            } else {
                this.data.setChildData(this.data.getChildTableInfoByTable($event.child_table), {'value': $event.value, 'tmp_year': $event.tmp_year, 'tmp_month': $event.tmp_month}, $event.data_index);
            }
        }


        //テーブル定義用 Dataset Difinition
        if (this.is_exist_table_definition || this.is_custom_table_definition) {
            if (this.is_custom_table_definition) {
            } else {
                // admin tableとtableが選択されたら、項目を自動的に読み込む
                this.onSelectTable(this.raw_data);
            }
        }

        if (needCallOnEdit) {
            this.onEdit($event)
            this.valueChanged.emit($event);
        }
    }

    setSelectOptionItemFilter(changed_fieldname: string = null) {
        this.selectOptionItemsFilter = this.table_info.getSelectItemOptionsFilter(this.data)

        if (changed_fieldname) {
            let changed_fieldnames = [changed_fieldname]
            this.selectOptionItemsFilter.toArray().forEach((selectOptionItemsWhere: SelectOptionItemsFilterWhere) => {
                if (changed_fieldnames.indexOf(selectOptionItemsWhere.condition_field_name) >= 0) {
                    this.data.clearData(selectOptionItemsWhere.target_field_name)
                    //中分類がclearされたなら、小分類もclear
                    changed_fieldnames.push(selectOptionItemsWhere.target_field_name)
                }

            })
        }
    }

    // ルックアップ後の絞り込み処理用メソッド
    // 無限ループを防ぐため、クリアはせずに絞り込み条件のみを更新
    setSelectOptionItemFilterAfterLookup(updated_field: string) {
        // 絞り込み条件を更新（データのクリアは行わない）
        this.selectOptionItemsFilter = this.table_info.getSelectItemOptionsFilter(this.data)

        // このフィールドが条件となっている他のselect_other_tableフィールドの選択肢を更新するだけ
        // データのクリアは行わない（無限ループ防止）
        // 選択肢の更新はforms-field.componentで自動的に行われる
    }

    onEdit($event = null, $params = null) {
        if (!this.is_custom_table_definition && (this.table_info.table.match(/^dataset_/) || this.table_info.table === 'admin')) {
            this.reflectRequiredShowCondition($event ? $event.field_name : null, $params, $event.is_child ? this.parent_data : null, true)
        }
    }

    reflectRequiredShowCondition(field_name: string, params = null, parent_data: Data = null, is_edit = false) {
        this.setLoadingOfCopyFields(field_name)

        this.table_info.reflectRequiredShowCondition(field_name, this._share, this._connect, this.forms, this.data, this.mode, this.is_setting, this.is_custom_table_definition, this.IS_IFRAME_MODE || this.IS_PUBLIC_FORM, params ?? this.publicFormService.publicPostParams, this.siblings, undefined, parent_data).subscribe((res) => {
            if (is_edit && res.status === 'warning') {
                this.toasterService.warning(res.message);
            }
            this.loadingFieldsNames = []
            if (this.onLoadReflectForms) {
                this.onLoadReflectForms.emit()
            }
        })
    }

    setLoadingOfCopyFields(field_name: string) {
        this.loadingFieldsNames = []
        let form = this.table_info.forms.byFieldName(field_name)
        if (form?.original_type == 'select_other_table') {
            form.copy_fields.forEach(copy_field => {
                //set loadingFieldsNames
                this.loadingFieldsNames.push(copy_field['to'])

            });
        }
    }

    onSelectTable(data) {
        // FIXME: confirm
        if (data.admin_table === null || data.table === null) {
            return;
        }


        this.setChildFieldForms(this.pre_table !== null && this.pre_table !== data.table);

        // 昇順・降順の項目設定
        this._connect.get('/admin/all-table-field-select/' + this.raw_data['table']).subscribe((result) => {
            this.forms.byFieldName('default_order_field').option = result.items;

        });

    }

    /**
     * VIEW DEFINITION
     */


    viewFieldIsCheck(data, value) {
        if (data !== undefined && data !== null) {
            const data_a = data.split(',');
            // FIXME: [checked]イベント発火が多いが問題ない？（適当な場所をクリックするだけで発火など）
            // console.log(data_a);
            if (data_a.indexOf(value) >= 0) {
                return true;
            }
        }
        return false;
    }

    viewFieldCheckboxChange() {

        const checkbox_a = document.getElementsByName('view_field');
        let value = '';
        let continue_next_edit = false;

        for (let i = 0; i < checkbox_a.length; i++) {
            if (continue_next_edit) {
                continue_next_edit = false;
                continue;
            }
            const checkbox = <HTMLInputElement>checkbox_a[i];
            if (checkbox.value.match(/_view$/)) {
                // 閲覧権限がない場合、編集権限も無しとする
                if (!checkbox.checked) {
                    continue_next_edit = true;
                }
            }
            if (checkbox.checked) {
                value += checkbox.value + ',';
            }
        }
        // 最後のカンマを消す
        value = value.slice(0, -1);
        // console.log(value);
        this.raw_data['fields'] = value;
    }


    /**
     * VIEW DEFINITION END
     */


    /**
     * MULTIPLE
     */
    getValueCount(field_name) {
        let number = 1;
        if (this.forms.byFieldName(field_name)['is_multi_value_mode']) {
            if (this.raw_data[field_name] == undefined) {
                number = 0;
            } else {
                number = this.raw_data[field_name].length;
            }
        }

        return Array(number).fill(1).map((x, i) => i);
    }

    addChildDatafromformsfield($event) {
        const totalformfieldfilemulti = $event.total_file + $event.return_data_index;
        this.addChildData(this.getChildByField($event['field_name']), true, -1, $event, $event.fileList, $event.field_name, $event.return_data_index, totalformfieldfilemulti)
    }

    canAddChildData(field_name: string): boolean {
        let form = this.table_info.forms.byFieldName(field_name)
        if (!form) {
            return true;
        }

        if (!form.max_child_number) {
            return true;
        }

        return form.max_child_number > this.child_data_a_by_fieldname[field_name].length

    }

    addChildData(child, scroll_after_add = true, order = -1, $event, addfile_data = null, filed_name = null, return_data_index = null, totalformfieldfilemulti = null) {
        if ($event.x == 0 && $event.y == 0) {
            //on enter
            // console.log('ON ENTER')
            return;
        }
        const new_data = {}
        if (this.is_exist_table_definition) {
            new_data['option'] = {}
        }

        if (order === -1) {
            this.data.setChildData(child, new_data);
            //this.data.child_data_by_table[child.table].push(new_data)
        }

        const index = this.data.child_data_by_table[child.table].length - 1;
        child.fields.forEach(field => {
            const _data = (this.data.child_data_by_table[child.table][index] === undefined) ? {} : this.data.child_data_by_table[child.table][index];
            this.setFieldDefault(_data, child.forms, field);
            this.data.setChildData(child, new_data, index);
        });
        if(filed_name!=null){
            let dataindex=return_data_index+1;
            if(!this.child_data_a_by_fieldname[filed_name][dataindex].getRawData('value')){
                let hashData= {};
                hashData['value']=addfile_data;
                hashData['ismultiple']=1;
                this.child_data_a_by_fieldname[filed_name][dataindex].setRawData(hashData);
            }
            else{
                for(let i = dataindex; i <= totalformfieldfilemulti; i++){
                    if(!this.child_data_a_by_fieldname[filed_name][i].getRawData('value')){
                        let hashData= {};
                        hashData['value']=addfile_data;
                        hashData['ismultiple']=1;
                        this.child_data_a_by_fieldname[filed_name][i].setRawData(hashData);
                        break;
                    }
                }
            }
        }
        this.onChangeData()
        return new_data;
    }

    addAllFormData(child, field_name: string) {
        this.data.child_data_by_table[child.table] = [];
        this.table_info.forms.byFieldName(field_name).option.forEach((_data) => {
            const new_data = {'value': _data.value}
            this.data.setChildData(child, new_data);
        })
        this.onChangeData()
    }

    deleteChildData(child, i, field_name) {
        this.data.child_data_by_table[child.table].splice(i, 1);
        try {
            this.view_data[field_name].splice(i, 1)
        } catch (e) {

        }
        this.onChangeData()
    }

    // 20240531 Kanazawa 子コンポーネントから呼び出す用に追加
    deleteAllChildDataFromChild($event) {
        this.deleteAllChildData($event.child, $event.field_name)
    }

    // 20240531 Kanazawa 追加 child_dataをクリアする、deleteChildDataを参照
    deleteAllChildData(child, field_name) {
        this.data.child_data_by_table[child.table] = [];
        try {
            this.view_data[field_name] = []
        } catch (e) {

        }
        this.onChangeData()
    }

    setFieldDefault(_data, _forms, field) {
        if (field.Default !== null) {
            _data[field.Field] = field.Default;
        }

    }

    getChildTablenameByFieldname(field_name) {
        if (!this.table_info) {
            return null;
        }
        let table_name = this.data.table_info.table + '_' + field_name + '_multi';
        return table_name;

    }

    getChildDataAry(field_name): Array<Data> {
        let table_name = this.getChildTablenameByFieldname(field_name)
        let data_a = this.data.getChildDataAry(table_name);
        return data_a;
    }

    getChildByField(field_name) {
        let child = null;
        this.data.child_a.forEach((_child) => {
            var _table_name = this.getChildTablenameByFieldname(field_name)
            if (_child.table == _table_name) {
                child = _child
                return false;
            }

        })
        return child;
    }


    drop(event: CdkDragDrop<string[]>, field, dropped_index) {
        // debugger;
        this.placeholder_visible = false;
        // moveItemInArray(this.fields, event.previousIndex, event.currentIndex);
        let start_y = event.item.data.y;
        let end_y;
        if (event.previousContainer === event.container) {
            if (event.previousIndex != event.currentIndex) {
                end_y = start_y;
                moveItemInArray(this.group_fields[end_y - 1], event.previousIndex, event.currentIndex)
                if (this.group_fields[end_y - 1].length != 0) {
                    for (let i = 0; i < this.group_fields[end_y - 1].length; i++) {
                        this.group_fields[end_y - 1][i].x = i + 1;
                    }
                }
                this.parent.moveFieldData(this.group_fields);

            }
        } else {
            if (field.length == 0) {
                end_y = dropped_index + 1;
            } else {
                end_y = field[0].y;
            }
            if (this.group_fields[end_y - 1].length <= 3) {
                transferArrayItem(this.group_fields[start_y - 1], this.group_fields[end_y - 1], event.previousIndex, event.currentIndex)

                if (end_y != start_y) {
                    for (let i = 0; i < this.group_fields[end_y - 1].length; i++) {
                        this.group_fields[end_y - 1][i].x = i + 1;
                        this.group_fields[end_y - 1][i].y = end_y;
                        // console.log(this.group_fields[end_y-1][i])
                    }
                }

                if (this.group_fields[start_y - 1].length != 0) {
                    for (let i = 0; i < this.group_fields[start_y - 1].length; i++) {
                        this.group_fields[start_y - 1][i].x = i + 1;
                    }
                }

                if (
                    this.group_fields[start_y - 1].length == 0 &&
                    start_y - 1 != this.group_fields.length - 1
                ) {
                    // console.log(this.group_fields)
                    for (let i = start_y - 1; i < this.group_fields.length; i++) {
                        if (i != this.group_fields.length - 1) {
                            this.group_fields[i] = this.group_fields[i + 1];
                            this.group_fields[i].map((field) => {
                                field.y = i + 1;
                            });
                        } else {
                            this.group_fields[i] = [];
                        }
                    }
                }
                this.parent.moveFieldData(this.group_fields);
            }
            else{
                this.toasterService.clear();
                this.toasterService.error('1行に４項目まで配置可能です。');
            }
        }
    }

    isFormStyle() {
        return !this.table_info.menu.style || this.table_info.menu.style == 'form' || this.is_custom_table_definition;
    }

    isQuestionnaireStyle() {
        return !this.isFormStyle();
    }


    isAutoFillField(field) {
        if (this.table_info.auto_copyto_fields.indexOf(field['Field']) >= 0) {
            return true;
        }
        if (this.forms.byFieldName(field['Field']) && this.forms.byFieldName(field['Field']).type === 'auto-id') {
            return true;
        }
        return false;

    }
    download_file(url, no_action_log = false, file_name: string = null, isdownload = '1') {
        this.downloading = url;
        this._share.download_file(url, () => {
            this.downloading = null;
        }, no_action_log, file_name, isdownload, true);
    }

    isDownloading(_url: string): boolean {
        return this.downloading == _url
    }



    isChildForm() {
        return this.child_index !== null;
    }


    //select_othertableの新規データ追加
    addNewSelectOtherTableData(form: Form) {
        this._share.getTableInfo(form.item_table).subscribe(_table_info => {
            if (_table_info.grant.add) {
                this.select_other_edit_modal_form = form;
                this.selectOtherEditModal.show();
            } else {
                this.toasterService.error('追加権限がありません');
            }
        })

    }


    onSubmitSelectOtherNewData($event) {
        if (!this.select_other_edit_modal_form.is_multi_value_mode) {
            let form = this.table_info.forms.byFieldName(this.select_other_edit_modal_form.field['Field']);
            form.clearOptions()
            this.table_info.resetFormOptionCache()
            // サーバー側のキャッシュもクリアするために、テーブル情報を再取得する
            this._share.resetTableFormOptionListCache(this.select_other_edit_modal_form.item_table)
            let updHash = {}
            updHash[this.select_other_edit_modal_form.field['Field']] = parseInt($event.id);
            this.data.setRawData(updHash)
            this.last_option_changed_date = new Date()
            this.onChangeData()

        } else {
            let updHash = {}
            updHash[this.select_other_edit_modal_form.field['Field']] = parseInt($event.id);
            this.onValueChanged({
                field_name: this.select_other_edit_modal_form.field['Field'],
                value: parseInt($event.id),
                data_index: this.selected_multi_value_index,
                child_table: this.getChildByField(this.select_other_edit_modal_form.field['Field']).table,
                is_child: true

            })
            this.selected_multi_value_index = null;
        }
        this.selectOtherEditModal.hide();
    }

    onCancelSelectOtherNewData() {
        this.selectOtherEditModal.hide();
    }


    public lookupForm: Form;
    public lookupSearchValue: string = null;
    public searchValueLastChanged: Date = null;
    public lookup_child_index: number;
    public lookupOptionItems: Array<any> = [];

    openLookupModal($event, child_index = null) {
        this.lookupForm = $event.form;
        this.lookup_child_index = null;
        this.lookupSearchValue = $event.searchValue
        this.lookupOptionItems = $event.optionItems
        this.searchValueLastChanged = new Date();
        if (child_index !== null) {
            this.lookup_child_index = child_index
        }
        this.lookupModal.show();
    }

    onLookupDataSelected($event) {
        //check lookupModal is open
        if (!this.lookupModal.isShown) {
            return;
        }

        this.onValueChanged({
            field_name: this.lookupForm.field['Field'],
            value: $event.id,
            data_index: this.lookup_child_index,
            child_table: this.lookupForm.multiple_table_name
        })
    }

    innerDrop(event: CdkDragDrop<any[]>) {
        if (event.previousContainer === event.container) {
          moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        }

        // https://github.com/Loftal/pigeon_cloud/pull/363 での不具合対応
        // ページを開いた初回のみ、event.container.dataとthis.data.child_data_by_table['field_name']が違う参照になって反映されない
        // 原因がわからず、一旦下記対応
        if (event.container.data[0].table_info.table === 'grant_group_admin_ids_multi') {
            this.data.child_data_by_table['grant_group_admin_ids_multi'] = event.container.data
        }
        if (event.container.data[0].table_info.table === 'grant_group_division_ids_multi') {
            this.data.child_data_by_table['grant_group_division_ids_multi'] = event.container.data
        }

        this.cd.detectChanges();
    }


    changeValue(field_name, value) {
        this.onValueChanged({
            field_name: field_name,
            value: value,
            data_index: null,
            child_table: null
        })
    }

    call_func(func_name) {
        eval('this.' + func_name + '()')
    }

    public downloadPublicKey(): void {
        this.sending_custom_button = true;

        // サーバーの公開鍵エンドポイントを別タブで開く

        const url = this._connect.getApiUrl() + '/api/admin/keys/public'; // APIの公開鍵エンドポイント
        window.open(url, '_blank');

        this.sending_custom_button = false;
        this.toasterService.success('公開鍵をダウンロードしました');
    }


    formatArrayValue(value: any): string {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value;
    }

}

import {Component, EventEmitter, Input, KeyValueDiffer, KeyValueDiffers, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import ToastrService from '../../toastr-service-wrapper.service';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import {ActivatedRoute} from '@angular/router'
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Data} from '../../class/Data';
import {TableInfo} from '../../class/TableInfo';
import {EditComponent} from './edit.component';
import {Form} from '../../class/Form';
import {Conditions} from '../../class/Conditions';
import {DataGrant} from '../../class/DataGrant';
import * as cloneDeep from 'lodash/cloneDeep';
import {v4 as uuidv4} from 'uuid';
import {Observable} from 'rxjs/Observable';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {SelectOptionItemsFilter} from '../../class/SelectOptionItemsFilter';
import {OptionItem} from '../../class/OptionItem';
import {GrantGroupData} from '../../class/GrantGroupData';
import {Lightbox, LightboxConfig} from 'ngx-lightbox';
import {Forms} from '../../class/Forms';

import * as find from 'lodash/find';
import { DecimalPipe } from '@angular/common';
import {Grant} from '../../class/Grant';
declare var $: any;
declare const google: any;


@Component({
    template: `
        <div class="modal-header bg-danger">
            <h4 class="modal-title"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></h4>
            <button type="button" class="close" (click)="hide()" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            <p>本当に削除してもよろしいですか？</p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="hide()">キャンセル</button>
            <button type="button" class="btn btn-danger" (click)="confirm()">削除する</button>
        </div>`
})
export class FormFieldFileDeleteModalComponent {
    @Input() public delete: Function;

    constructor(public activeModal: NgbActiveModal) {
    }

    hide() {
        this.activeModal.close();
    }

    confirm() {
        this.delete();
        this.activeModal.close();
    }
}


@Component({
    selector: 'admin-forms-field',
    templateUrl: './forms-field.component.html',
    styleUrls: ['./forms-field.component.css']
})

export class FormsFieldComponent implements OnInit, OnChanges {
    @Input() editComponent: EditComponent;
    @Input() table_info: TableInfo;
    @Input() data: Data;
    @Input() parent_data: Data = null;
    @Input() parent_data_ifmulti: Data = null;
    @Input() field_name: string;
    @Input() is_add: boolean = true;
    @Input() password_conf_value: string;
    @Input() is_update_calc: string;
    @Input() forms: Forms = null;
    @Input() auto_complete_values: Array<any> = [];

    @Input() disable_edit: boolean = false;
    //if multiple value
    @Input() child_table: string = null;
    @Input() child_table_data: Data = null;
    @Input() data_index: number = null;
    @Input() id_prefix: string = '';
    //if image
    @Input() thumbnail_file_info;

    @Input() default_value: string = null;

    // NOT REQUIRED
    @Input() grant_menu_a: Array<Object>;
    @Input() default_form: Form = null;
    @Input() default_field: {} = null;
    @Input() grant_kind: string = null;

    @Input() focus: boolean = false;
    @Input() cellMode: boolean = false;

    //これがないとdataに変更があってもngchangeが呼びだされない
    @Input() data_changed: Date;

    @Input() is_add_new_button_select_other_table: boolean = false;

    //更新検知用
    @Input() last_updated: Date = null;

    //select other 絞り込み
    @Input() selectOptionitemsFilter: SelectOptionItemsFilter = null;
    public is_all_related_condition_value_selected: boolean = true;
    public selectPlaceHolder: string = ''

    @Input() isEditMode: boolean = false;

    @Input() last_option_changed_date: Date = null;

    @Input() child_index: number = null;


    @Input() IS_PUBLIC_FORM: boolean = false;
    @Input() IS_EMBED_MODE: boolean = false;
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() addchildvalue: EventEmitter<Object> = new EventEmitter();
    @Output() openLookupSearchModal: EventEmitter<Object> = new EventEmitter();
    @Output() addChildData: EventEmitter<Object> = new EventEmitter();
    @Output() deleteAllChildData: EventEmitter<Object> = new EventEmitter();
    @Input() showDetailSettings: boolean;
    @Input() source: string;
    @Output() showDetailSettingsChange = new EventEmitter<boolean>();

    public option_items: Array<OptionItem> = null;

    public conditions: Conditions;

    public current_data: Data;
    private toasterService: ToastrService;
    public date_value: Date = null;
    public all_action_index = null;
    public dataset_check_all = false;
    private table: string;
    public admin_notification;

    public field_for_radio = '';

    public form: Form;
    public field: {};

    private grant: DataGrant;

    public value = null;
    public view_value;
    public first_time = 0;
    public icon_image_url: string = null;
    private downloading: string = null;
    private isimagecheck: boolean = true;

    // Track password visibility state
    public passwordVisibility: { [key: string]: boolean } = {
        'password': false,
        'password_conf': false
    };
    //year_month
    public year: number;
    public month: number;

    // URLのid or new
    public mode: string;

    // 画像用削除モーダル
    @ViewChild('deleteModal') deleteModal: any;
    @ViewChild('grantGroupModal') grantGroupModal: any;
    @ViewChild('tableManagementModal') tableManagementModal: any;
    @ViewChild('verifyModal') verifyModal: any;
    @ViewChild('testMailModal') testMailModal: any;

    public unique_input_id = null

    private paramsDiffer: KeyValueDiffer<string, any>;
    private dataDiffer: KeyValueDiffer<string, any>;
    private formDiffer: KeyValueDiffer<string, any>;

    private pre_value: string;
    public grantGroupData: GrantGroupData = null;
    public tempValue: string = null;

    // grant data table用
    public grantGroupDataByGrantId: Object = [];


    public albums = [];
    public minutes_by_interval = {}

    private previousLoadSelectFilterHash: string = null;

    private qrCodeImage:string = null;
    formattedValue: string = '';
   
    private raw_view_value: any = null; // Original unformatted value

    constructor(toasterService: ToastrService, public _share: SharedService, private _lightbox: Lightbox, private _lightboxConfig: LightboxConfig, private differs: KeyValueDiffers, private _connect: Connect, private _route: ActivatedRoute, private modalService: NgbModal) {
        this.toasterService = toasterService;
        this.paramsDiffer = this.differs.find({}).create();
        this.dataDiffer = this.differs.find({}).create();
        this.formDiffer = this.differs.find({}).create();
        _lightboxConfig.centerVertically = true;

        //this.year = (new Date()).getFullYear()
        //this.month = (new Date()).()
    }

    // 20240529 Kanazawa 追加 時間の設定セレクトボックス用の関数追加 start
    // 設定した時間の範囲内かどうか
    isValidTimeRange = (hour: number) => (this.form?.custom_field?.["start_hour"] || 0) <= hour && (this.form?.custom_field?.["end_hour"] || 24) >= hour
    // 15分間隔の時間取得
    time_by_fifteen_minutes() {
        const returnVal = [];
        [...Array(24)].map((_, i) => i).map((i) => ['00', '15', '30', '45'].map((val, _) =>
            this.isValidTimeRange(i) && returnVal.push(`${( '00' + i ).slice(-2)}:${val}`)))
        // 末尾の時間は15,30,45分を削除、00分のみ残す
        returnVal.splice(-3, 3);
        return returnVal;
    }

    isOneMinuteTimeField(form: any): boolean {
        return form.custom_field &&
            (form.custom_field.minutes_interval == 1 ||
                !('minutes_interval' in form.custom_field));
    }

    // 30分間隔の時間取得
    time_by_thirty_minutes() {
        const returnVal = [];
        [...Array(25)].map((_, i) => i).map((i) => ["00", "30"].map((val, _) => this.isValidTimeRange(i) && returnVal.push(`${( '00' + i ).slice(-2)}:${val}`)))
        returnVal.splice(-1, 1);
        return returnVal;
    }

    // 1時間間隔の時間取得
    time_by_an_hour() {
        const returnVal = [];
        [...Array(25)].map((_, i) => i).map((i) => this.isValidTimeRange(i) && returnVal.push(`${( '00' + i ).slice(-2)}:00`))
        return returnVal;
    }

    // 3時間間隔の時間取得
    time_by_three_hours() {
        const returnVal = [];
        [...Array(9)].map((_, i) => i).map((i) => this.isValidTimeRange(i * 3) && returnVal.push(`${( '00' + i * 3 ).slice(-2)}:00`))
        return returnVal;
    }

    // 20240529 Kanazawa 追加 end

    getId(postfix = '') {
        let id = this.id_prefix + this.field['Field']
        if (this.data && this.data.raw_data['id']) {
            id += '_' + this.data.raw_data['id']
        }
        if (postfix) {
            id += '_' + postfix
        }
        if(this.grant_kind){
            id += '_' + this.grant_kind
        }

        if(id == 'everyone' && this.field_for_radio) {
            id += '_' + this.field_for_radio
        }
        return id
    }

    ngOnInit() {
        this._route.paramMap.subscribe(params => {
            this.mode = params.get('id');
          });
        
        if (this.form.field['Field'] == 'two_factor_method' && this.value == 'qr') {
            this.getQrCodeImage()
        }

        if (this.data && this.data.raw_data['ismultiple']) {
            const file: File = this.value;
            const max_size = this._share.getMaxUploadFilesizeMB() * 1024 * 1024;
            //TODO: fix
            if (file.size > max_size) {
                this.toasterService.error('アップロード可能なサイズは最大' + this._share.getMaxUploadFilesizeMB() + 'MBです。', 'エラー');
                return
            }
            file['id_generate'] = Math.random().toString(36).substring(3, 9)
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    console.log('Original size:', img.width, 'x', img.height);
                    console.log('File size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
                    $('#' + file['id_generate']).attr({
                        'src': e.target.result,
                        'width': img.width,
                        'height': img.height,
                        'size': file.size
                    });
                };
                img.src = e.target.result as string;
            };
            this.value = file;
            reader.readAsDataURL(file);
            this.onChange();
        }
        if ((this.form['type'] == 'image' || this.form['type'] == 'file') && !this.disable_edit) {
            if (this.value != null) {
                this.isimagecheck = this.isFileImage();
            }
        }
        this.unique_input_id = uuidv4()
        this.field_for_radio = 'radio_' + this._share.uniqid();
        if (this.data) {
            this.password_conf_value = this.data.raw_data['password_conf'] || this.data.raw_data['password'];
        }

        if (this.data) {
            this.grant = this.data.grant;
            this.current_data = cloneDeep(this.data)
        }

        if (this.default_form) {
            this.form = this.default_form;
            this.field = this.default_field;
        } else {
            this.field = this.table_info.getFieldByFieldName(this.field_name)
            this.form = this.table_info.forms.byFieldName(this.field_name)
            if (this.form == null) {
                this.form = new Form({'field': this.field_name});
            }

            if (this.field == null && this.field_name) {
                this.field = {'Field': this.field_name};
            }
        }

        // Check for URL query parameters if in add mode
        if (this.mode === null) {
            this._route.queryParamMap.subscribe(params => {
                if (!this.field || !this.field['Name']) return;
                const fieldName = this.field['Name'];
                const altFieldName = fieldName.replace(/ /g, '_');
                let paramValue: string = null;
                if (params.has(fieldName)) {
                    paramValue = params.get(fieldName);
                } else if (params.has(altFieldName)) {
                    paramValue = params.get(altFieldName);
                }
                if (paramValue != null && this.value !== paramValue) {
                    if (this.isSelectableWithOptions()) {
                        const found = this.form.option.find(f => f.label == paramValue || f.value == paramValue || f.view_label == paramValue);
                        if (found) {
                            this.value = found.value;
                        } else {
                            this.value = '';
                        }
                    } else {
                        this.value = /^\d+$/.test(paramValue) ? parseInt(paramValue) : paramValue;
                    }
                    this.onChange();
                }
            });
        }

        if (!!this.form && ['time', 'date', 'datetime'].indexOf(this.form['type']) >= 0) {
            this.convertDatetimeValue(true, true);
            // 20240529 Kanazawa 追加 時間の間隔のセレクトボックス用
            this.minutes_by_interval = {
                "15": this.time_by_fifteen_minutes(),
                "30": this.time_by_thirty_minutes(),
                "60": this.time_by_an_hour(),
                "180": this.time_by_three_hours(),
            }
        } else if (this.form.type === 'year_month') {

            //set default value if value is empty
            if (!this.value && this.form.custom_field && 'default' in this.form.custom_field) this.value = this.form.custom_field['default'];
            if (this.value) {
                let value: String = String(this.value);
                const d = new Date(Date.parse(value.toString()));
                this.year = d.getFullYear()
                if( this.isIncludeMonth(value) ){
                    this.month = d.getMonth() + 1
                }
            }
        } else if (this.form.type === 'boolean') {
            if (this.value == null) {
                this.value = false;
                this.onChange();
            }

        }
        if (this.field['Field'] && this.field['Field'].match(/condition_json/)) {
            if (this.data && this.data.raw_data[this.field['Field']]) {
                this.conditions = new Conditions();
                this.conditions.setByJson(this.data.raw_data[this.field['Field']])
            }
        }

        if (this.isMultiSelect(this.form) && this.value && !Array.isArray(this.value)) {
            this.value = this.value.split(',')
        }
        if (this._route.queryParams['value']['year_calendar'] != undefined) {
            let calendar_field_name: string = '';
            if (this.table_info.menu['from_to_calendar_view_datetime']) {
                calendar_field_name = this.table_info.menu['calendar_view_datetime_from'];
            } else {
                calendar_field_name = this.table_info.menu['calendar_view_datetime'];
            }
            if (calendar_field_name == this.field_name) {
                let year_calendar = this._route.queryParams['value']['year_calendar'];
                let month_calendar = this._route.queryParams['value']['month_calendar'];
                let date_calendar = this._route.queryParams['value']['date_calendar'];
                this.date_value = new Date(year_calendar, month_calendar - 1, date_calendar);
                this.datetimeValueChanged();
            }
        }

        if (this.data) {
            let id = this.data.raw_data['id'];
            //SET FORM DEFAULT
            if (!id && !this.value && this.form.default_value && this.value !== this.form.default_value) {
                if (this.form.type === 'boolean') {
                    this.value = this.form.default_value
                    this.onChange();
                }


            }
        }


        if (this.table_info) {
            this.setOptionItems()
        }

        if (this.IS_EMBED_MODE && this.field['Field'] == 'grant_type') {
            this.value = 'none';
            this.onChange();
        }
    }

    /**
     * Returns true if the form is a selectable type with options.
     */
    isSelectableWithOptions(): boolean {
        return (
            (this.form.original_type === 'select_other_table' || this.form.original_type === 'radio') &&
            Array.isArray(this.form.option) &&
            this.form.option.length > 0
        );
    }

    resize(textarea: HTMLTextAreaElement){
        const maxHeight = 500;
        textarea.style.height = "100px";
        let scrollHeight = textarea.scrollHeight;
        let minHeight = parseInt(textarea.getAttribute('data-min-height')) ?? 150;
        if (scrollHeight < minHeight) scrollHeight = minHeight;
        const isOverflowing = scrollHeight > maxHeight;
        textarea.style.height = isOverflowing ? maxHeight + 'px' : scrollHeight + 'px';
    }


    convertDatetimeValue(set_null_if_invalid = true, from_init = false) {

        if (!!this.form && ['time', 'date', 'datetime'].indexOf(this.form['type']) >= 0) {
            let value: String = String(this.value);
            if (this.form['type'] === 'time') {
                value = '1970-01-01 ' + value;
            }
            // 日付のみの場合、valueに時間がなくのちのif文でバグが発生する。
            // 入力状態によって00:00:00か09:00:00で変化があるので、this.date_valueから日付を抜き出してひっつける
            if (this.form['type'] === 'date' && this.date_value) {
                const hours = this.date_value.getHours();
                const minutes = this.date_value.getMinutes();
                const seconds = this.date_value.getSeconds();
                // 時間部分を0埋めフォーマット
                const timeString = ('00' + hours).slice(-2) + ':' + ('00' + minutes).slice(-2) + ':' + ('00' + seconds).slice(-2);
                value = value + ' ' + timeString;
            }
            const d = new Date(Date.parse(value.toString()));
            if (d.toString() !== 'Invalid Date') {
                if (!this.date_value || this.date_value.getTime() !== d.getTime()) {
                    if (this.form['type'] == 'time') {
                        // 時刻のとき、08:まで入れたら自動で:00まで入ってしまうので、入力値をそのまま表示する対応
                        if (from_init) {
                            this.date_value = d;
                        }
                    } else {
                        this.date_value = d;
                    }
                }
            } else {
                const regex = /^(today|tomorrow|yesterday|now|noon|midnight|last (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|next (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|last day of|first day of|[+-]?\d+ (day|week|month|year)s?)( (\d{1,2}|H):(\d{2}|i)(:(\d{2}|s))?)?$/;
                if (this.field['Field'] == "__default_value" && ['date', 'datetime'].indexOf(this.form['type']) >= 0) console.log('date validate regex', regex.test(this.value), this.value, this.field['Field'], this.form['type'])

                if (regex.test(this.value) && this.field['Field'] == "__default_value" && ['date', 'datetime'].indexOf(this.form['type']) >= 0) {
                    var inputElement = document.querySelector(".dateInput-__default_value") as HTMLInputElement;
                    if (inputElement) {
                        inputElement.value = this.value;
                        this.onChange();
                    }
                }

                if (set_null_if_invalid) {
                    this.date_value = null;
                }
            }

        }
    }


    ngOnChanges(changes: SimpleChanges): void {
        this.value = null;

        if (changes.default_form) {
            this.form = this.default_form;
            this.field = this.default_field;
            this.value = this.default_value;

        }

        if (!this.form) {
            this.field = this.table_info.getFieldByFieldName(this.field_name)
            this.form = this.table_info.forms.byFieldName(this.field_name)
        }

        if (this.form.is_dummy_form) {
            this.loadSelectOptions()
        }
      
        if (this.data) {
            if (this.data_index !== null) {
                //childの場合
                this.value = this.data.raw_data['value'];
                this.view_value = this.data.view_data['value'];
               
                if (!this.thumbnail_file_info) this.thumbnail_file_info = this.data.view_data['value'];
            // 20240531 Kanazawa 追加 他テーブル参照且つ複数選択可、検索虫眼鏡が無効の場合複数選択セレクトボックスになる
            // その場合valueが配列になるので、child_dataのraw_dataを取得する
            } else if (this.form.original_type === 'select_other_table' && this.form.is_multi_value_mode) {
                const targetList = this.data.child_data_by_table[this.form.multiple_table_name].filter((item)=> item.raw_data.value);
                this.value = targetList.map((item)=> item.raw_data.value && item.raw_data.value);
                this.view_value = this.value;
            } else {
                this.value = this.data.raw_data[this.field['Field']];
               
                if (this.form.original_type === 'number' && this.form.is_multi_value_mode && this.form.isInteger() ) {
                    this.view_value = this.data.raw_data[this.field['Field']] ? this.data.raw_data[this.field['Field']] : null;
                }else if(this.form.original_type === 'calc' && this.form.num_separator === false) {
                    this.view_value = this.value ? this.value.toLocaleString() : null;
                    this.value = this.value ? this.value.toLocaleString() : null;

                }else{
                    this.view_value = this.data.view_data[this.field['Field']] ? this.data.view_data[this.field['Field']] : this.value;
                }
            }
        }
        if (this.form['type'] == 'fields' && this.form.isFieldsMulti()) {
            if (this.value && !Array.isArray(this.value)) {
                this.value = this.value.split(',');
            }
        }
        if (this.form['type'] == 'checkbox') {
            if (this.value && !Array.isArray(this.value)) {
                this.value = this.value.split(',');

            }
        }
        if(this.view_value && this.form['type'] == 'number') {

            let num_unit = this.form['num_unit'] || ',';

            const escapedNumUnit = num_unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            try {
                if (this.isEditMode) {
                   
                    if (Array.isArray(this.view_value)) {
                        // Need to change this.view_value instead or this.value because we need decimal placeholder in edit mode for multi fileds
                        this.view_value = this.view_value.map(val =>
                            typeof val === 'string' ? val.replace(/,/g, '') : val
                        );
                    }
                    
                }
            } catch (e) {
                console.error("RegExpの作成または使用中にエラーが発生しました:", e);
                console.error("元のnum_unit:", num_unit);
                console.error("エスケープ後のnum_unit:", escapedNumUnit);
                // エラー処理をここに追加（例：replaceをスキップする、デフォルト値を使用するなど）
            }
            
        }

        if (!!this.form && ['time', 'date', 'datetime'].indexOf(this.form['type']) >= 0) {
            this.convertDatetimeValue(false);
        } else if (this.form.type === 'year_month') {
            if (this.value) {
                let value: String = String(this.value);
                const d = new Date(Date.parse(value.toString()));
                this.year = d.getFullYear()
                if (this.isIncludeMonth(value)) {
                    this.month = d.getMonth() + 1
                }
            } else if (this.data && (this.data.raw_data['tmp_year'] || this.data.raw_data['tmp_month'])) {
                this.year = this.data.raw_data['tmp_year']
                this.month = this.data.raw_data['tmp_month']
            }
        }

        if (this.value === null) {
            if (this.data && this.data.raw_data['id']) {
                if (this.data_index !== null) {
                    //childの場合
                    this.value = this.data.raw_data['value'];
                    this.view_value = this.data.view_data['value'];
                } else {
                    if (this.field['Field'] == 'table') {
                        this.data.raw_data[this.field['Field']] != null && this.valueChanged.emit({
                            'field_name': 'table',
                            'value': this.data.raw_data[this.field['Field']],
                        });

                    }
                    this.value = this.data.raw_data[this.field['Field']];
                    this.view_value = this.data.view_data[this.field['Field']];
                    //console.log('set value by raw_data')
                }
            } else {
                this.value = this.default_value;
            }
        }
        if (this.data && !this.form['default_value'] && this.form['type'] == 'select' && !this.view_value) {
            this.value = null;
            this.data.raw_data[this.field_name] = null;
        }

        if (changes.form || changes.default_form || changes.selectOptionitemsFilter || changes.last_option_changed_date) {
            //set option items
            this.setOptionItems()
        }
        if (this.form.type === 'grant_group' && this.value) {
            this.reloadGrantGroupData()
        }

        this.pre_value = this.value


        if (this.data && this.table_info && this.table_info.table == 'dataset') {
            const menu = this._share.getMenu('dataset__' + this.data.raw_data['id']);
            if (menu) {
                this.icon_image_url = menu.icon_image_url;
            }
        }

        if(this.field_name == 'edit'){
            this.form.disable_switch = this.data.raw_data['view'] == 'true' ? 'false' : 'true';
        }
        if (this.field_name == 'grant_type') {
            this.reloadGrantGroupDataList();
        }

        // this.valueには、ファイルアップロード後はFILEオブジェクト、編集画面ではid、ルックアップではURLが入ってる
        if (this.form['type'] === 'image' && this.value && !(this.value instanceof File) && /^(http|https):\/\/[^ "]+$/.test(this.value)) {
            this.value = {
                name: 'コピーされた画像',
                id_generate: Math.random().toString(36).substring(3, 9),
                url: this.thumbnail_file_info,
            };
        }

        if(this.form.field['Field'] == '__default_value'){
            // 小数によっては 1e-8となってるので戻す
            if (typeof this.default_value === 'number' && /^-?\d+(?:\.\d+)?e[+-]?\d+$/.test(this.default_value)) {
                this.view_value = parseFloat(this.default_value).toFixed(10).replace(/\.?0+$/, '');
            } else {
                this.view_value = this.default_value;
            }
        }
        if(this.form.field['Field'] == '__fixed_value'){
            if (typeof this.default_value === 'number' && /^-?\d+(?:\.\d+)?e[+-]?\d+$/.test(this.default_value)) {
                this.view_value = parseFloat(this.default_value).toFixed(10).replace(/\.?0+$/, '');
            } else {
                this.view_value = this.default_value;
            }
        }

        // Image type
        if (this.form['type'] == 'image' && this.value && (this.value instanceof File)) {
            this.readFile( this.value )
        }

        if (typeof this.view_value === 'number') {
            this.view_value = String(this.view_value);
        }

    }

    private currentDatasetGrantIdArray: Array<number> = [];
    ngDoCheck() {
        // this function is used to trigger focus on first time only
        if (!this.data || !this.field) {
            return;
        }
        let id = this.data.raw_data['id'];
        let field = this.field['Field'];
        if (this.isEditMode == true && document.getElementById('_form_' + field + '_' + id)) {
            this.first_time++;
            // i don't know the exact reason but it triggered 15 times for the first time
            if (this.first_time < 15) {
                document.getElementById('_form_' + field + '_' + id).focus();
            }
        }
        if (this.field_name == 'grant_type') {
            const key = this.getGrantSelectorId();
            const newIdArray = this.data.child_data_by_table[key]?.map(data => data.raw_data['grant_group_id']);
            //check if dataset_grant is changed
            if (newIdArray?.length != this.currentDatasetGrantIdArray?.length || newIdArray.some((id, i) => id !== this.currentDatasetGrantIdArray[i])) {
                this.reloadGrantGroupDataList();
            }
        }
    }

    ngAfterViewInit() {
        if (!this.data) {
            return;
        }
        let id = this.data.raw_data['id'];
        let field = this.field ? this.field['Field'] : '';
        if (this.isEditMode == true && document.getElementById('_form_' + field + '_' + id)) {
            document.getElementById('_form_' + field + '_' + id).focus();
        }
    }

    openImg() {
        let album = {
            src: this.thumbnail_file_info.url,
            thumb: this.thumbnail_file_info.thumbnail_presigned_url,
        }
        this.albums.push(album)
        this._lightbox.open(this.albums, 0);
    }

    mentionSelect(event) {
        return '{' + event.label + '}';
    }

    setOptionItems() {
        // console.log('setOptionItems')
        let set_value_null_if_value_is_not_in_options = () => {
            if(this.form['type'] == 'fields' && this.form.isFieldsMulti()) return;
            if (this.value && !this.option_items.find(item => {
                return item.value == this.value;
            })) {
                //console.log('set value null')
                this.value = null;
                this.onChange()
            }
        }
        if (['fields', 'notify_target_fields', 'email_fields', 'file_fields'].indexOf(this.form['type']) >= 0) {
            this.getTableForms(this.form['target_table_field'], this.form['type']).subscribe(_option_items => {
                this.option_items = _option_items.filter(f => {
                    let is_accepted = (this.form.accept_types.length == 0 || this.form.accept_types.indexOf(f.original_type) >= 0)
                    if (!is_accepted) {
                        return false;
                    }
                    //only ignore  f.type == fixed_html in notification in fields
                    if(this.form['type'] == 'fields' && this.form.isFieldsMulti() && f.type == 'fixed_html') return false;

                    if (this.form.only_custom_field) {
                        if (!f.isCustomField()) {
                            return false;
                        }
                    }
                    return true;

                }).map(form => {
                    return new OptionItem({
                        'label': form.label,
                        'value': form.field['Field'],
                    })
                })

                if(this.form['type'] == 'notify_target_fields' && this.child_table == 'notification_table_notify_fields_multi') {
                    // ログインユーザーの選択肢を追加
                    this.option_items.unshift(new OptionItem({
                        'label': 'ログインユーザー',
                        'value': 'login_user',
                    }));
                }

                //console.log('OPTION ITEM SET')
                //console.log(this.option_items)
                set_value_null_if_value_is_not_in_options()
            })
        } else if (this.form['type'] == 'table_filter') {
            this.getTableFilter(this.form['target_table_field']).subscribe(_option_items => {
                if (this.value) {
                    this.value = parseInt(this.value)
                }
                this.option_items = _option_items.map((item: CustomFilter) => {
                    return new OptionItem({
                        'label': item.name,
                        'value': item.id,
                    })
                })
                set_value_null_if_value_is_not_in_options()
            })

        } else if (this.isSelect(this.form)) {
            if (this.table_info) {
                // console.log(this.table_info.table)
                this.loadSelectOptions()
            }
        }

    }

    loadSelectOptions() {
        //console.log(this.form.label)
        if (this.form.is_dummy_form) {
            this.setLoadOptions(this.form.option)
        } else {
            // last_option_changed_dateが変更された場合は、キャッシュをスキップして必ず再取得する
            if (this.selectOptionitemsFilter && this.selectOptionitemsFilter.hasWhereData() && this.previousLoadSelectFilterHash == this.selectOptionitemsFilter.getUniqueHash() && !this.last_option_changed_date) {
                console.log('skip load select options')
                return
            }

            const post_value = this.form.default_value == '{{admin.id}}' && this.mode == 'new' ? "{{admin.id}}" : this.data.raw_data[this.field_name]
            this.form.getSelectOptions(this.table_info, this._connect, this.selectOptionitemsFilter, post_value).subscribe(option_items => {
                if (this.selectOptionitemsFilter) {
                    this.previousLoadSelectFilterHash = this.selectOptionitemsFilter.getUniqueHash()
                }
                if (this.selectOptionitemsFilter && this.selectOptionitemsFilter.hasWhere(this.form.field['Field'])) {
                    this.is_all_related_condition_value_selected = this.selectOptionitemsFilter.inputCompleteFilterCompareValue(this.field_name)
                    if (!this.is_all_related_condition_value_selected) {
                        console.log('clear')
                        if (this.value != null) {
                            this.value = null;
                            this.onChange();
                        }
                        this.selectPlaceHolder = ''
                        let uninputtedFields = this.selectOptionitemsFilter.getUninputtedFields(this.field_name)
                        let uninput_field_label_a = []
                        uninputtedFields.forEach(field_name => {
                            uninput_field_label_a.push(this.table_info.forms.byFieldName(field_name).label)
                        })
                        this.selectPlaceHolder = uninput_field_label_a.join(',') + 'を選択して下さい'

                    } else {
                        this.selectPlaceHolder = ''
                    }

                }
                // 20240712 Kanazawa 追加 複数配列の場合空の配列も存在するので、空の配列も除外
                if (((Array.isArray(this.value) && this.value.length > 0) ||
                        (!Array.isArray(this.value) && !!this.value)) &&
                    this.form.original_type === 'select_other_table') {
                    let selected = option_items.filter(item => {
                         // 20240712 Kanazawa 追加 複数選択の場合配列で持つパターンがるので追加
                         if(Array.isArray(this.value)) {
                            return this.value.filter(val => val == item.value).length > 0;
                        }else {
                            return item.value == this.value;
                        }
                    });

                    if (selected.length == 0) {
                        if (this.value != null) {
                            //clear
                            this.value = null;
                            this.onChange();
                        }
                    } else {
                        this.view_value = selected[0].view_label
                        this.lookupSearchValue = this.view_value
                    }
                }
                if (this.form.original_type === 'table'){
                    //skip option items if match archive_flag is true
                    //also skip user table
                    option_items = option_items.filter(item=>{
                        if (item.value == "dataset__1" || find(this._share.exist_table_a, ['table', item.value])) return true;
                        return false;
                    })

                }
                this.setLoadOptions(option_items);
            })
        }
    }


    setLoadOptions(option_items) {

        let filter_option = (options, form) => {
            //FIXME: NO USE?
            if (this.form['item_where']) {
                this.form['item_where'].forEach(where => {
                    let where_key = where[0];
                    let where_val = where[1]
                    if (where_val == '{parent_id}') {
                        where_val = this.editComponent.id;
                    }
                    // console.log(options)
                    options = options.filter((option) => {
                        return option['hash'][where_key] == where_val;
                    })
                })
            }
            if (!form['is_own_parent_table']) {
                return options;
            }


            return options.filter((option) => {
                return option.value != this.data.raw_data['id'];
            })
        };
        this.option_items = filter_option(option_items, this.form)

        //現在無いデータが登録されている時
        if (['radio', 'select'].indexOf(this.form.original_type) >= 0 && this.value) {
            let value_exist = false;
            this.option_items.forEach(item => {
                if (item.value == this.value) {
                    value_exist = true;
                }
            });
            if (!value_exist) {
                //add option item
                this.option_items.push(new OptionItem({
                    label: this.value,
                    value: this.value
                }));
            }
        }

        //追加項目
        if (this.form.original_type === 'select_other_table') {
            let _new_exist: boolean = false;
            this.option_items?.forEach(item => {
                if (item['value'] == '__NEW__') {
                    _new_exist = true
                }
            })
            if (!_new_exist && this.is_add_new_button_select_other_table && this.form.show_add_on_list && this._share.getMenu(this.form.item_table)) {
                if (this._share.getSimpleTableInfo(this.form.item_table) && this._share.getSimpleTableInfo(this.form.item_table).grant.add) {
                    this.option_items.push(new OptionItem({
                        label: '+ 新規追加',
                        value: '__NEW__'
                    }));
                }
            }
        }
        // if (this.form.required && !this.value && this.option_items.length > 0 && this.option_items[0]['value'] !== '__NEW__' && this.form && this.form.copy_fields && this.form.copy_fields.length == 0) {
        //     // this.value = this.option_items[0]['value'];
        //     // this.pre_value = this.value
        //     // //console.log('SET VALUE BY LOAD OPTIONS')
        //     // this.onChange()
        // }


    }


    isSelect(form: Form) {
        return ['select', 'select_other_table', 'table', 'multi-select', 'radio', 'checkbox'].indexOf(form['type']) >= 0;
    }

    isMultiSelect(form: Form) {
        return form.type === 'multi-select' || (form.type === 'checkbox' && form.checkbox_input_type && form.checkbox_input_type === 'select')
    }

    fileChange(data, event) {
        const fileList: FileList = event.target ? event.target.files : event;
        if (fileList.length > 0) {
            for (let i = 0; i < fileList.length; i++) {
                const file: File = fileList[i];
                let MAX_MB = this._share.getMaxUploadFilesizeMB();

                /**
                 * [image] size: make it possible to set a size limit for image items
                 */
                const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (this.form['_is_limit_image_size'] && validImageTypes.includes(file.type)) {
                    MAX_MB = 1;
                    if (this.form.custom_field['limit_image_size'] ) {
                        MAX_MB = this.form.custom_field['limit_image_size']
                    }
                }

                const max_size = MAX_MB * 1024 * 1024;
                if (file.size > max_size) {
                    if (fileList.length > 0) {
                        // this.toasterService.error('アップロード可能なサイズは最大' + MAX_MB + 'MBです。', 'エラー');
                        if(this.form.type == 'image')
                        {
                            this.toasterService.error('画像サイズの制限'  +  MAX_MB + 'MBを超えています', 'エラー');
                        }else if(this.form.type == 'file') {
                            this.toasterService.error('ファイルサイズの制限'  +  MAX_MB + 'MBを超えています', 'エラー');
                        }
                        return
                    } else {
                        event.target.value = '';
                        this.toasterService.error('アップロード可能なサイズは最大' + MAX_MB + 'MBです。', 'エラー');
                        delete data[event.target.getAttribute('name')];
                        return
                    }
                }
                if (i == 0) {
                    file['id_generate'] = Math.random().toString(36).substring(3, 9)
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        $('#' + file['id_generate']).attr('src', e.target.result);
                    };
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            console.log('Original size:', img.width, 'x', img.height);
                            console.log('File size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
                            $('#' + file['id_generate']).attr({
                                'src': e.target.result,
                                'data-width': img.width,
                                'data-height': img.height,
                                'data-size': file.size
                            });
                        };
                        img.src = e.target.result as string;
                    };
                    this.value = file;
                    if (this.value != null) {
                        this.isimagecheck = this.isFileImage();
                    }
                    reader.readAsDataURL(file);
                    this.onChange();
                } else {
                    const returndata = Array();
                    returndata['field_name'] = this.field_name;
                    returndata['return_data_index'] = this.data_index;
                    returndata['total_file'] = fileList.length;
                    returndata['fileList'] = fileList[i];
                    returndata['fileList']['id_generate'] = Math.random().toString(36).substring(3, 9)
                    this.addchildvalue.emit(returndata);
                }
            }
            //data[event.target.getAttribute('name')] = file;
        } else {
            this.onChange();
            this.value = null;
            //delete data[event.target.getAttribute('name')];
        }
    }

    readFile( file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                console.log('readFile Original size:', img.width, 'x', img.height);
                console.log('readFile File size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
                $('#' + file['id_generate']).attr({
                    'src': e.target.result,
                    'data-width': img.width,
                    'data-height': img.height,
                    'data-size': file.size
                });
            };
            img.src = e.target.result as string;
        };
        reader.readAsDataURL(file);
    }

    isFileImage() {
        return this.value && this.value['type'] && this.value['type'].split('/')[0] === 'image';
    }

    checkboxChange(field, target_name) {
        const checkbox_a = document.getElementsByName(target_name);
        let value = '';
        for (let i = 0; i < checkbox_a.length; i++) {
            const checkbox = <HTMLInputElement>checkbox_a[i];
            if (checkbox.checked) {
                value += checkbox.value + ',';
            }
        }
        // 最後のカンマを消す
        value = value.slice(0, -1);
        this.value = value;
        this.onChange();
    }


    onChangeRichText(val) {
        this.onChange(null, val)
    }

    /**
     * Utility method to ensure Froala popup structure is correct
     * Ensures fr-popup fr-desktop fr-ltr fr-active div contains fr-link-insert-layer fr-layer fr-active
     */
    private ensureFroalaPopupStructure() {
        setTimeout(() => {
            const popup = $('.fr-popup.fr-desktop.fr-ltr.fr-active');
            if (popup.length > 0) {
                // Ensure popup is appended to body
                if (popup.parent().get(0) !== document.body) {
                    popup.appendTo('body');
                }
                
                // Ensure the fr-link-insert-layer exists
                let linkLayer = popup.find('.fr-link-insert-layer.fr-layer.fr-active');
                if (linkLayer.length === 0) {
                    linkLayer = $('<div class="fr-link-insert-layer fr-layer fr-active"></div>');
                    popup.append(linkLayer);
                }
                
                // Ensure proper styling
                popup.css({
                    'position': 'absolute',
                    'z-index': '9999',
                    'display': 'block'
                });
            }
        }, 50);
    }

    /**
     * Get Froala editor options with popup fix for mixed single/multi field mode
     * Fixes issue where fr-popup fr-desktop fr-ltr fr-active div is not appended
     * when clicking linkEdit in mixed field mode scenarios
     */
    getFroalaOptionWithPopupFix() {
        let option = this._share.getFroalaOption('full', this.table_info.table, this.IS_PUBLIC_FORM ? 'iframe-form' : '.app-body');
        
        // Create a deep copy to avoid modifying the shared option
        option = JSON.parse(JSON.stringify(option));
        
        // Fix for popup append issue in mixed single/multi field mode
        // Ensure popups are always appended to body for consistent behavior
        option.scrollableContainer = 'body';
        
        // Add event handlers to ensure proper popup creation and structure
        if (!option.events) {
            option.events = {};
        }
        
        const originalEvents = option.events;
        
        option.events = Object.assign({}, originalEvents, {
            'initialized': function () {
                // Store reference to editor instance for popup management
                const editor = this;
                
                // Override the popup show method to ensure proper structure
                const originalShow = editor.popups.show;
                editor.popups.show = function(id, left, top, height) {
                    const result = originalShow.call(this, id, left, top, height);
                    
                    if (id === 'link.edit') {
                        // Use utility method to ensure popup structure
                        editor.ensureFroalaPopupStructure = editor.ensureFroalaPopupStructure || function() {
                            setTimeout(() => {
                                const popup = $('.fr-popup.fr-desktop.fr-ltr.fr-active');
                                if (popup.length > 0) {
                                    // Force append to body if not already there
                                    if (popup.parent().get(0) !== document.body) {
                                        popup.appendTo('body');
                                    }
                                    
                                    // Ensure the fr-link-insert-layer exists and is active
                                    let linkLayer = popup.find('.fr-link-insert-layer.fr-layer.fr-active');
                                    if (linkLayer.length === 0) {
                                        // Create the complete layer structure
                                        linkLayer = $('<div class="fr-link-insert-layer fr-layer fr-active"></div>');
                                        popup.append(linkLayer);
                                    }
                                    
                                    // Ensure proper styling and visibility
                                    popup.css({
                                        'position': 'absolute',
                                        'z-index': '9999',
                                        'display': 'block'
                                    });
                                }
                            }, 10);
                        };
                        
                        editor.ensureFroalaPopupStructure();
                    }
                    
                    return result;
                };
                
                // Call original initialized event if it exists
                if (originalEvents && originalEvents['initialized']) {
                    originalEvents['initialized'].call(this);
                }
            },
            'commands.after': function (cmd) {
                // Handle link edit command specifically
                if (cmd === 'linkEdit') {
                    const editor = this;
                    setTimeout(() => {
                        editor.popups.show('link.edit', null, null, null);
                        // Ensure popup structure after showing
                        if (editor.ensureFroalaPopupStructure) {
                            editor.ensureFroalaPopupStructure();
                        }
                    }, 0);
                }
                
                // Call original event handler if it exists
                if (originalEvents && originalEvents['commands.after']) {
                    originalEvents['commands.after'].call(this, cmd);
                }
            }
        });
        
        return option;
    }

    restrictDecimal($event: any) {
        let val: string = $event.target.value;

        if (typeof val !== 'string') {
            val = String(val);
        }

        val = val.replace(/[^0-9.-]/g, '');

        if (val.includes('.')) {
            const [intPart, decimalPart] = val.split('.');
            if (decimalPart.length > this.form.decimal_places) {
                val = intPart + '.' + decimalPart.slice(0, this.form.decimal_places);
            }
        }
        
        this.value = val;
        this.view_value = val;
    }


    onChangeNum($event = null) {
     
        let val = this.view_value;
        if ($event && $event.target && $event.target.value !== undefined) {
            val = $event.target.value;
        }
       
        // Always treat as string
        if (typeof val !== 'string') {
            val = String(val);
        }
        const cleaned = val.replace(/[^\d.,-]/g, '');
        this.value = cleaned; // if multi value , value separate with comma
        this.view_value = cleaned;

        if(!this.form.is_multi_value_mode){
            this.value = this.view_value.replace(/,/g, '');
        }
            
        this.onChange(false, false);
       
    }

    onChange(force_field_name = null, force_value = null, $event = null) {

        this.value = $event?.target?.value || this.value;

        // BUG FIX: For default and fixed value fields, capture the actual DOM input value
        // This ensures that when users clear the input field, we get the empty string value
        // instead of keeping the previous value. This is critical for allowing deletion
        // of default and fixed values by clearing the input field.
        if (this.default_field && ['__fixed_value', '__default_value'].includes(this.default_field['Field']) ) {
            this.value = $event?.target?.value;
        }

        if (this.form.field['Field'] == 'two_factor_method' && this.value == 'qr'){
            this.getQrCodeImage()
        }
        if (this.table_info && ((this.table_info.table.match(/^notification/) && this.field['Field'].match(/json/)) || this.form.original_type === 'condition')) {
            this.valueChanged.emit({
                'field_name': this.field['Field'],
                'value': this.conditions.getSearchParamJson(),
                'data_index': this.data_index,
            });
        } else {
            this.valueChanged.emit({
                'field_name': force_field_name || this.field['Field'],
                'value': force_value || this.value,
                'data_index': this.data_index,
                'child_table': this.child_table,
                'pre_value': this.pre_value,
                'tmp_year': this.year,
                'tmp_month': this.month,
                'is_child': true
            });
        }
    }

    onCreatePassword(){
        const length = 12;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        do {
            result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        } while (!/\d/.test(result));
        this.password_conf_value = result;
        this.onChange(null, result);
        this.onChange('password_conf', result);
    }


    onValueChanged($event) {
        console.log('値が変更されました:', $event);
        this.conditions.replaceCondition($event.index, $event.condition);

        this.onChange();
    }

    onChangeGrant($event) {
        console.log('権限設定が変更されました:', $event);
        this.value = $event['grant_value'];
        this.onChange();
    }

    onChangeGrantFromModal($event) {
        console.log('モーダルから権限設定が変更されました:', $event);
        this.tempValue = $event['grant_value'];
    }

    applyTableManagement() {
        console.log('テーブル管理の変更を適用します');
        if (this.tempValue) {
            console.log('変更前の値:', this.value);
            console.log('変更後の値:', this.tempValue);
            this.value = this.tempValue;
            this.onChange();
            this.tempValue = null;
        }
        this.tableManagementModal.hide();
    }

    isCheck(index, value) {

        if (!this.value) {
            return false;
        }
        if (Array.isArray(this.value)) {
            return this.value.indexOf(value) !== -1;
        }
        return this.value.split(',').indexOf(value) !== -1;
    }

    public downloadPublicKey(): void {
        this._connect.get('/admin/keys/public').subscribe(
            (response: any) => {
                const blob = new Blob([response.key], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'webhook_public_key.pem';
                link.click();
                window.URL.revokeObjectURL(url);
                this.toasterService.success('公開鍵をダウンロードしました。');
            },
            (error) => {
                this.toasterService.error('公開鍵のダウンロードに失敗しました。');
                console.error('Failed to download public key:', error);
            }
        );
    }

    isIncludeMonth(value){
        // Split the date string by "-". value may be like that "2024-03-01"
        let parts = value.split("-");

        // Check if the array has at least two elements (year and month)
        return parts.length >= 2 && parts[1].length > 0;
    }

    isObject(data) {
        return (typeof data === 'object');
    }

    datasetId(grant_menu_a) {
        let id = '';
        grant_menu_a.map((data) => {
            const data_split = data.table.split('__');
            id += `${data_split[1]}_`;
        });
        id = id.slice(0, -1);
        return id;
    }

    /**
     *
     * @param $el jQuery Element
     * @returns invisible node height
     */
    getInvisibleElePx($el) {
        var elH = $el.outerHeight(),
            H = $(window).height(),
            r = $el[0].getBoundingClientRect(),
            t = r.top,
            b = r.bottom;
        return Math.max(0, t > 0 ? Math.min(elH, H - t) : Math.min(b, H));
    }

    onOpenDtPicker() {
        $('.cdk-overlay-pane').each(function () {
            if (parseInt($(this).css('left'), 10) < 0) {
                $(this).css('left', 30);
                $(this).css('width', '296px');
                // $(this).css('top',window.scrollY);
            }
        })
        this.setPossibleDTPickerStyle()
    }

    /**
     * set possible top and max-height when node invisible
     */
    setPossibleDTPickerStyle (){
        let invisibleHeightTotal = 0;
        ['.owl-dt-calendar', '.owl-dt-timer','.owl-dt-container-buttons'].map((el) => {
            if($(el).length){
                let $el = $(el),
                    ckdPane = $('.cdk-overlay-pane'),
                    invisibleHeight = this.getInvisibleElePx($el);
                if (invisibleHeight < $el.height()) {
                    if (el == '.owl-dt-calendar'){
                        ckdPane.css('top', parseInt(ckdPane[0].style.top) + ($el.height() - invisibleHeight))
                    }else{
                        invisibleHeightTotal += $el.height() - invisibleHeight;
                    }
                }
            }
        })
        //set max-height and scroll
        if (invisibleHeightTotal) {
            invisibleHeightTotal + 10
            $('.owl-dt-container').css({
                'max-height': `${$('.cdk-overlay-pane').height() - invisibleHeightTotal}px`,
                'overflow': `scroll`,
            })
        }
    }

    is_string(data) {
        return data instanceof String;
    }


    isOptionsHaveEmptyValue(options) {
        if (!options) {
            return false;
        }
        return options.filter((option) => {
            return option.value === ''
        }).length > 0;
    }

    openDeleteModal = () => {
        let modalRef = this.modalService.open(FormFieldFileDeleteModalComponent);
        modalRef.componentInstance.delete = this.deleteImage;
    }

    deleteImage = () => {
        this.value = '';
        this.deleteModal.hide();
        this.onChange();
    }

    datetimeValueChanged() {
        if (!!this.date_value) {
            const value = this._share.getDateTimeStringByDate(this.date_value, this.form['type']);
            if (this.value !== value) {
                this.value = value;
            }
        } else {
            this.value = null
        }
        this.onChange();
    }


    /**
     * 全角入力された場合半角に変換する
     * owlDateTimeライブラリの影響で、datetimeValueChanged関数の中ではできなかったので、
     * この関数とonBlur使って、素のjsで表記を変換している
     */
    onInput(event: any): void {
        if (this.isEditMode) return;
        const inputElement = document.querySelectorAll('.dateInput-' + this.field['Field'])[this.data_index ? this.data_index : 0] as HTMLInputElement;
        if (inputElement) {
            const halfWidthValue = this.convertToHalfWidth(event.target.value);

            inputElement.value = halfWidthValue;


        }
    }

    validateDateString(value: string) {
        this._connect.post('/admin/dataset/validate-date', { value: value }).subscribe((response: any) => {
            if (!response.isValid) {
                console.log("Invalid format");
                this.finishEditDatetime();
            } else {
                // this.date_value = new Date(response.convertedValue);
                this.value = value
                this.onChange();
            }
        });

    }

    public validateTimoutId: any;
    onKeyupDate( event: any ): void {
        if (this.field['Field'] == '__default_value' ){

            if (this.validateTimoutId) {
                clearTimeout(this.validateTimoutId);
            }

            this.validateTimoutId = setTimeout(() => {
                this.validateDateString(event.target.value);
            }, 500);
        }
    }

    onBlur(event: any): void {
        if (this.isEditMode) return;
        const inputElement = document.querySelectorAll('.dateInput-' + this.field['Field'])[this.data_index ? this.data_index : 0] as HTMLInputElement;
        let dateTimeRegex;
        if (this.form['type'] == 'datetime') {
            // 2023や2023/12や2023/12/31や2023/12/31 12:34のような形式を許容
            dateTimeRegex = /^(?:\d{2,4}(?:\/\d{1,2}(?:\/\d{1,2}(?: \d{1,2}:\d{2})?)?)?)$/;
        } else if (this.form['type'] == 'date') {
            // 2023や2023/12や2023/12/31のような形式を許容
            dateTimeRegex = /^\d{4}(\/\d{1,2}(\/\d{1,2})?)?$/;
        } else if (this.form['type'] == 'time') {
            dateTimeRegex = /^\d{1,2}:\d{2}$/;

            // Check if the input is a time without a colon (e.g., "730")
            if (/^\d{3,4}$/.test(inputElement.value)) {
                // Insert a colon to format the time correctly (e.g., "730" to "7:30")
                const timeStr = inputElement.value;
                const hours = timeStr.length === 3 ? timeStr[0] : timeStr.slice(0, 2);
                const minutes = timeStr.slice(-2);
                inputElement.value = `${parseInt(hours)}:${minutes}`;
            }
        }
        if (dateTimeRegex.test(inputElement.value)) {
            // 20230523 Kanazawa 修正 form['type']='time'の場合きちんと動いていなかったので、変換処理を追加
            const inputElementDateValue = this.form['type'] == 'time'
                ? new Date(null, null, null, parseInt(inputElement.value.split(':')[0]), parseInt(inputElement.value.split(':')[1]))
                : new Date(inputElement.value);
            this.value = this._share.getDateTimeStringByDate(inputElementDateValue, this.form['type']);
            this.date_value = inputElementDateValue;
            this.onChange();
            this.finishEditDatetime();
        } else {
            if (this.field['Field'] == '__default_value') {
                this.validateDateString(inputElement.value);
            } else {
                console.log("Invalid format");
                this.finishEditDatetime();
            }
        }

    }

    // 全角文字を半角に変換する関数
    convertToHalfWidth(str) {
        // strが文字列でない場合は、変換せずにそのまま返す
        if (typeof str !== 'string') {
            return str;
        }

        if (!/[Ａ-Ｚａ-ｚ０-９：・　]/.test(str)) {
            return str;
        }
        // たまに文字が2回連続入力される原因不明バグのためのログ
        console.log('convertToHalfWidth::', str)

        // 全角英数字を半角に変換
        return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        }).replace(/：/g, ':').replace(/・/g, '/').replace(/　/g, ' ');
    }

    finishEditDatetime() {
        if (!this.date_value) {
            this.toasterService.warning('日時のフォーマットが無効のため、空の値が設定されます', null, {timeOut: 3000, disableTimeOut: false});
        }

    }

    changeValueToDateValue($event) {
        // console.log($event)
        // console.log(this.date_value)


        this.datetimeValueChanged()
    }

    yearMonthChagned() {
        if (this.year && this.month) {
            let _dt = new Date();
            _dt.setFullYear(this.year)
            _dt.setDate(1)
            _dt.setMonth(this.month - 1)

            this.date_value = _dt;
        }

        if (!this.year && !this.month) {
            this.year = null;
            this.month = null;
            this.date_value = null;
        }
        this.datetimeValueChanged()

    }

    // windowsのみ文字が2回連続入力される原因不明バグのためのプロパティ
    private yearMonthInputTime: any;
    onYearMonthInput(event: any, type: string): void {
        const currentTime = new Date().getTime();
        // 前回の入力から0.05秒以内の場合はwindowsの文字が2回連続入力される原因不明バグの可能性があるため処理
        if (this.yearMonthInputTime && (currentTime - this.yearMonthInputTime) < 50) {
            this.fixWindowsYearMonthInputTwoInput(type);

            return;
        }
        // 現在の時間を記録
        this.yearMonthInputTime = currentTime;

        const yearElement = document.querySelectorAll('.yearInput-' + this.field['Field'])[this.data_index] as HTMLInputElement;
        let yearEleInput  = yearElement;
        // If yearElement is not defined and the event target has 'year' class, assign it to yearEleInput
        if( !yearEleInput && event.target.classList.contains('year') ){
            yearEleInput = event.target;
        }
        if (yearEleInput) {
            var yearMin = parseInt(yearEleInput.getAttribute("min")) || 1900;
            var yearMax = parseInt(yearEleInput.getAttribute("max")) || 2300;
            let yearValue = this.convertToHalfWidth(yearEleInput.value);
            if (yearValue.length == 4) {
                yearValue = parseInt(yearValue);
                if( Number.isInteger(yearValue) ){
                    if ( yearValue < yearMin) yearValue = yearMin;
                    if ( yearValue > yearMax) yearValue = yearMax;
                }else{
                    yearValue = yearMin;
                }
            }
            this.year = yearValue
            // this.year = this.convertToHalfWidth(yearElement.value)
        }
        const monthElement = document.querySelectorAll('.monthInput-' + this.field['Field'])[this.data_index] as HTMLInputElement;
        let monthEleInput  = monthElement;
        // If monthElement is not defined and the event target has 'month' class, assign it to monthEleInput
        if (!monthEleInput && event.target.classList.contains('month')) {
            monthEleInput = event.target;
        }
        if (monthEleInput) {
            var monthMin = parseInt(monthEleInput.getAttribute("min")) || 1;
            var monthMax = parseInt(monthEleInput.getAttribute("max")) || 12;
            let monthValue = this.convertToHalfWidth(monthEleInput.value);
            if(monthValue){
                monthValue = parseInt(monthValue);
                if ( Number.isInteger(monthValue) ){
                    if (monthValue < monthMin) monthValue = monthMin;
                    if (monthValue > monthMax) monthValue = monthMax;
                }else{
                    monthValue = monthMin
                }
            }
            this.month = monthValue
        }
        this.yearMonthChagned();
    }

    /**
     * windowsのみ文字が2回連続入力される原因不明バグの可能性があるため、
     * 文字が2回連続入力された場合は、最後の1文字を削除して、1回目の入力と同じ値を設定する
     */
    fixWindowsYearMonthInputTwoInput(type: string) {
        if (type == 'year') {
            const yearElement = document.querySelectorAll('.yearInput-' + this.field['Field'])[this.data_index ? this.data_index : 0] as HTMLInputElement;
            if (yearElement) {
                yearElement.value = this.year ? String(this.year) : '';
            }
        } else {
            const monthElement = document.querySelectorAll('.monthInput-' + this.field['Field'])[this.data_index ? this.data_index : 0] as HTMLInputElement;
            if (monthElement) {
                monthElement.value = this.month ? String(this.month) : '';
            }
        }
    }

    textChanged() {
        this.onChange();
    }

    radioChanged() {
        this.onChange();
    }

    isChild() {
        return this.data_index != null;
    }

    count_step() {
        return this._share.count_step(this.form);
    }

    addCondition() {
        if (!this.conditions) {
            this.conditions = new Conditions();
        }
        this.conditions.addCondition('')
        this.onChange();
    }

    delCondition(i) {
        this.conditions.deleteCondition(i)
        this.onChange();
    }

    clearValue() {
        this.date_value = null;
        this.value = null;
        this.datetimeValueChanged()
    }


    onInputGrantGroup($event) {
        let hash = {};
        hash[this.field_name] = $event.id
        this.current_data.setRawData(hash)
        this.value = $event.id;
        this.grantGroupModal.hide()

        this.reloadGrantGroupData()

        this.onChange()

    }

    private reloadGrantGroupData() {
        if (this.value) {
            this._connect.get('/admin/view/grant_group/' + this.value, null ,null, false).subscribe((data) => {
                this._share.getTableInfo('grant_group').subscribe(_table_info => {
                    this.grantGroupData = new GrantGroupData(_table_info)
                    this.grantGroupData.setInstanceData(data.data)
                })

            });

        }

    }

    public loadingGrantGroupData: boolean = false;
    private reloadGrantGroupDataList() {
        if (this.loadingGrantGroupData) {
            return;
        }
       
        if(this.value == 'custom' && this.source == "permission_setting"){
            this.showDetailSettingsChange.emit(true);
        }

        if (!this.table_info || !this.data || !this.data.child_data_by_table) {
            console.log('!!! RELOAD GRANT GROUP DATA LIST RETURN !!!')
            return;
        }
        this.grantGroupDataByGrantId = {};
        const key = this.getGrantSelectorId();
        this.data.child_data_by_table[key]?.forEach((dataset_grant) => {
            if (!dataset_grant.raw_data['grant_group_id']) {
                return;
            }
            this.loadingGrantGroupData = true;
            this._connect.get('/admin/view/grant_group/' + dataset_grant.raw_data['grant_group_id'], null, null, false).subscribe((_data) => {
                console.log('!!! RELOAD GRANT GROUP DATA LIST SUBSCRIBE !!!')
                console.log(_data)
                this._share.getTableInfo('grant_group').subscribe(_table_info => {
                    let grantGroupData = new GrantGroupData(_table_info)
                    grantGroupData.setInstanceData(_data.data)
                    this.grantGroupDataByGrantId[dataset_grant.raw_data['grant_group_id']] = grantGroupData;
                    this.loadingGrantGroupData = false;
                    this.currentDatasetGrantIdArray = this.data.child_data_by_table[key].map((dataset_grant) => dataset_grant.raw_data['grant_group_id']);
                });

            });

        });
    }

    onBooleanChange() {

        this.value = (this.value == 'true') ? 'false' : 'true';
        this.onChange();
    }

    onClickBoolean(event: MouseEvent) {
        if(this.field_name === 'setTwoFactor' && this._share.user && !this._share.validateEmail()){
            event.preventDefault();
            this.toasterService.error('ログインIDがメールアドレスでない場合は2段階認証は有効にできません.変更している場合、一度ログアウトして試してください。', 'エラー');
        }
    }


    private tableFormCache: Object = {}

    private getTableForms(_target_table_field: string, form_type: string): Observable<Array<Form>> {
        let only_notify_fields: boolean = form_type === 'notify_target_fields';
        let only_email_fields: boolean = form_type === 'email_fields';
        let only_file_fields: boolean = form_type === 'file_fields';
        let target_table = null;
        if (_target_table_field.match(/parent\./)) {
            _target_table_field = _target_table_field.replace(/parent\./, '')
            target_table = this.parent_data_ifmulti.raw_data[_target_table_field]
        } else if (this.parent_data && this.table_info.table != 'import_pop_mail_setting') {
            //これは、multiデータのparent
            target_table = this.parent_data.raw_data[_target_table_field]
        } else {
            target_table = this.data.raw_data[_target_table_field]
        }


        return new Observable((observer) => {
            if (target_table) {
                let key = _target_table_field + target_table + form_type;
                if (this.tableFormCache[key]) {
                    observer.next(this.tableFormCache[key])
                } else {
                    this._share.getTableInfo(target_table).subscribe(table_info => {
                        let forms = table_info.forms.getArray();
                        if (only_notify_fields) {
                            forms = table_info.forms.getArray().filter(form => (form.original_type === 'select_other_table' && form.item_table == 'admin') || form.original_type === 'email')
                        } else if (only_email_fields) {
                            forms = table_info.forms.getArray().filter(f => f.original_type == 'email')
                        } else if (only_file_fields) {
                            forms = table_info.forms.getArray().filter(f => f.original_type == 'file' && !f.is_multi_value_mode)
                        }
                        this.tableFormCache[key] = forms;
                        observer.next(forms)
                    })
                }
                return {
                    unsubscribe() {
                    }
                };
            }
        });


    }

    private tableFilterCache: Object = {}

    private getTableFilter(_target_table_field: string): Observable<Array<any>> {
        let target_table = null;
        if (this.parent_data) {
            target_table = this.parent_data.raw_data[_target_table_field]
        } else {
            target_table = this.data.raw_data[_target_table_field]
        }

        return new Observable((observer) => {
            if (target_table) {
                let key = _target_table_field + target_table;
                if (this.tableFilterCache[key]) {
                    observer.next(this.tableFilterCache[key])
                } else {
                    this._share.getTableInfo(target_table).subscribe(table_info => {
                        this.tableFilterCache[key] = table_info.saved_filters;
                        observer.next(this.tableFilterCache[key])
                    })
                }
                return {
                    unsubscribe() {
                    }
                };
            }

        });

    };

    onClickCurrentDatetime($event) {
        //console.log($event);

    }


    public verify_smtp_email: string = ''
    public sending_custom_button: boolean = false;

    verifySmtp() {
        let hash = this.data.raw_data
        hash['verify_email'] = this.verify_smtp_email
        this.sending_custom_button = true;
        this._connect.post(this._connect.getApiUrl() + '/admin/verify-smtp', hash).subscribe(res => {
            this.sending_custom_button = false;
            this.verifyModal.hide()
            if (res.result) {
                this.toasterService.info('メールを送信しました。メールボックスにメールが届いているか確認して下さい。', 'お知らせ');
            } else {
                this.toasterService.error('送信に失敗しました。SMTP情報を確認して下さい。', 'エラー');
            }
        });
    }

    sendTestMail() {
        let hash = this.data.raw_data
        hash['to_email'] = this.verify_smtp_email
        this.sending_custom_button = true;
        this._connect.post(this._connect.getApiUrl() + '/admin/send-test-mail', hash).subscribe(res => {
            this.sending_custom_button = false;
            this.testMailModal.hide()
            if (res.result) {
                this.toasterService.info('テストメールを送信しました。', 'お知らせ');
            } else {
                this.toasterService.error('送信に失敗しました。SMTP情報を確認して下さい。', 'エラー');
            }
        });
    }
    /**
     * DO NOT DELETE! used by cloudmenu
     */
    openVerifySmtpModal() {
        this.verifyModal.show();
    }

    openTestMailModal() {
        this.testMailModal.show();
    }
    /**
     * DO NOT DELETE! used by cloudmenu
     */
    checkMailserverConnection() {
        this.sending_custom_button = true;
        let hash = this.data.raw_data;
        this._connect.post(this._connect.getApiUrl() + '/admin/mail-import/check', hash, {}, false).subscribe(res => {
            this.sending_custom_button = false;
            this.toasterService.success(res.message);
        }, (error) => {
            this.sending_custom_button = false;
            console.error(error.error.error_debug_a)
            this.toasterService.error('接続に失敗しました。メールサーバー情報を確認して下さい。', 'エラー');
        });
    }

    call_func(func_name) {
        eval('this.' + func_name + '()')
    }

    setCurrentDateTime($event) {
        if ($event.pointerType == '') {
            //if enter key
            return;
        }
        this.date_value = new Date();
        this.datetimeValueChanged();
    }

    isUsePulldown(): boolean {
        return !this.form.not_display_pulldown || this.isEditMode || this.IS_EMBED_MODE || this.IS_PUBLIC_FORM

    }

    private loading: boolean = false;

    openNgSelect(){
        let el = document.getElementById(this.getId()),
            elRect = el.getBoundingClientRect();
        setTimeout(()=>{
            let ngDropdownPanel = $('.ng-dropdown-panel');
            if(ngDropdownPanel.length){
                ngDropdownPanel.css({
                    'width' : elRect.width,
                    'left' : elRect.left,
                })
            }
        },10)
    }

    onSelectChange(event: any) {

        if (this.form.isUseMultiplePulldown(this.cellMode)) {
            this.onChangeMultiSelect(event);
        } else {
            this.onChangeOtherSelectValue(event);
        }
    }

    onChangeOtherSelectValue($event) {
        this.value = $event?.value
        this.view_value = $event?._view_label
        if (Array.isArray($event)) {
            this.value = [];
            this.view_value = []
            $event.forEach((item) => {
                this.value.push(item.value)
                this.view_value.push(item._view_label)
            });

        }
        this.onChange()
        this.lookupSearchValue = null

        if (this.value == '__NEW__') {
            this.loading = true;
            setTimeout(() => {
                this.value = this.pre_value
                this.loading = false;
            }, 100)
        }
    }

    // 20240531 Kanazawa 追加 マルチセレクトボックス用のイベント処理
    onChangeMultiSelect($event) {
        console.log('onChangeMultiSelect event:', $event);
        console.log('option_items:', this.option_items);

        // 1度選択状態をクリアしてから選択値の設定をする
        this.deleteAllChildData.emit({ 'child': this.child_table_data, 'field_name': this.field_name });

        // 選択された項目がない場合は処理を終了
        if (!$event || $event.length === 0) {
            return;
        }

        // 選択された各項目に対して処理
        $event.forEach((item) => {
            console.log('Selected item:', item);
            // 子データを追加
            // this.addChildData.emit({ 'child': this.child_table_data });

            // itemがオブジェクトで、valueプロパティを持っている場合
            if(item && typeof item === 'object' && 'value' in item && isNaN(Number(item.value))){
                let values = [];
                $event.forEach((item) => {
                    if (item && typeof item === 'object' && 'value' in item) {
                        values.push(item.value);
                    } else {
                        values.push(item);
                    }
                });
                this.value = values;
                this.onChange();
            }
            else if (item && typeof item === 'object' && 'value' in item) {
                this.onChange(null, item.value);
            } else {
                // itemが直接値の場合（念のため）
                this.onChange(null, item);
            }
        });
    }

    public isDatasetEdit(): boolean {
        return this.table_info && this.table_info.table === 'dataset';
    }

    public getGrantArray(): Array<Grant> {
        let grantArray = [];
        const key = this.getGrantSelectorId();
        this.data.child_data_by_table[key]?.forEach((grant) => {
            let grant_hash = grant.raw_data;
            try {
                let _grant_value = JSON.parse(grant.raw_data['grant_json'])
                grant_hash['grant_value'] = _grant_value;
            } catch (e) {
                let emptyGrant = new Grant({});
                grant_hash['grant_value'] = emptyGrant.getDefaultGrant();
            }
            grant_hash['data'] = this.grantGroupDataByGrantId[grant.raw_data['grant_group_id']];

            grantArray.push(grant_hash);
        });
        // this.reloadGrantGroupData()
        return grantArray;
    }

    changeGrantType(type: string) {

        if (type == 'custom' && this.is_add) {
            return;
        }
        if(type == 'custom' && this.source == "permission_setting"){
            this.showDetailSettingsChange.emit(true);
        }
        this.value = type;
        this.onChange();
    }


    openLookupModal() {
        console.log('===========lookupsearch==========')
        console.log(this.lookupSearchValue)
        this.openLookupSearchModal.emit({
            form: this.form,
            searchValue: this.lookupSearchValue,
            optionItems:this.option_items
        })
    }

    public lookupSearchValue: string = null

    onChangeSelect($event) {
        if (!this.form.not_display_pulldown) {
            // console.log('SKIP')
            return;
        }
        console.log($event)
        // debugger;
        this.lookupSearchValue = $event.target.value
        this.value = null;
        this.view_value = null;
        this.forms.byFieldName(this.field_name).option.forEach(op => {
            if (op.view_label == $event.target.value) {
                this.value = op.value
                this.view_value = op.view_label;
            }
        })

        this.valueChanged.emit({
            'field_name': this.field['Field'],
            'value': this.value
        });
    }

    onSelectFocusOut($event) {
        return;
    }

    mentionItems() {
        return this.table_info.forms.getArray().map(f => f.label)
    }


    getFormId() {

        let id = '_form_' + this.field['Field'] + '_' + (this.data && this.data.raw_data['id'] ? this.data.raw_data['id'] : this.unique_input_id)
        if (this.data_index != null) {
            id += '_' + this.data_index;
        }
        return id
    }

    download_file(url, no_action_log = false, file_name: string = null, isdownload = '1') {
        this.downloading = url;
        this._share.download_file(url, () => {
            this.downloading = null;
            // this.changeDetectorRef.detectChanges();
        }, no_action_log, file_name, isdownload);
    }
    isDownloading(_url: string): boolean {
        return this.downloading == _url
    }


    isConditionTableSet(): boolean {
        if (this.form.condition_table_field.match(/parent./)) {
            if (!this.parent_data) {
                return false;
            }
            return this.parent_data && this.parent_data.raw_data[this.form.condition_table_field.replace('parent.', '')] != null
        }
        return this.data.raw_data[this.form.condition_table_field]

    }

    getConditionTable(): string {
        if (this.form.condition_table_field.match(/parent./)) {
            if (this.parent_data && this.parent_data.raw_data[this.form.condition_table_field.replace('parent.', '')] != null) {
                return this.parent_data.raw_data[this.form.condition_table_field.replace('parent.', '')]
            } else {
                return null;
            }
        }
        return this.data.raw_data[this.form.condition_table_field]
    }

    getQrCodeImage(){
        if (this.qrCodeImage) {
            return
        } else {
            this._connect.get('/admin/user/get-qrcode').subscribe(res => {
                this.qrCodeImage = res['qrCode'];
            })
        }
    }


    onValueChange(value: string): void {
       
        this.formattedValue = value;
        
        this.view_value = this.formattedValue
    }

    getGoogleMapFields() {
        const address = this.value;
        if (!address) {
            this.toasterService.error('住所が入力されていません');
            return;
        }

        // Google Maps APIがロードされているか確認
        if (typeof google === 'undefined') {
            this.loadGoogleMapsAPI().then(() => {
                this.geocodeAddress(address);
            }).catch(error => {
                console.error('Google Maps APIのロードに失敗しました:', error);
                this.toasterService.error('Google Maps APIのロードに失敗しました');
            });
        } else {
            this.geocodeAddress(address);
        }
    }

    private loadGoogleMapsAPI(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'google-maps-script';
            // APIキーはDBから取得に変更
            script.src = '';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                resolve();
            };

            script.onerror = (error) => {
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    private geocodeAddress(address: string) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK') {
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();

                // 緯度経度フィールドの値を更新
                const latFieldName = this.table_info.menu.getGoogleMapLatField();
                const lngFieldName = this.table_info.menu.getGoogleMapLngField();
                const latForm = this.table_info.forms.byFieldName(latFieldName)
                const lngForm = this.table_info.forms.byFieldName(lngFieldName)

                if (latFieldName && lngFieldName) {
                    // 緯度経度を指定の小数点以下桁数に丸める
                    const latDecimalPlaces = latForm.custom_field['decimal_places'] || 6;
                    const lngDecimalPlaces = lngForm.custom_field['decimal_places'] || 6;

                    const roundedLat = Number(lat).toFixed(latDecimalPlaces);
                    const roundedLng = Number(lng).toFixed(lngDecimalPlaces);

                    // 親コンポーネントに緯度経度の値の変更を通知
                    this.onChange(latFieldName, roundedLat)
                    this.onChange(lngFieldName, roundedLng)
                    this.toasterService.success('緯度経度を取得しました');
                }
            } else {
                this.toasterService.error('緯度経度の取得に失敗しました');
            }
        });
    }

    getGoogelMapLink(){
        const lat = this.data.raw_data[this.table_info.menu.getGoogleMapLatField()]
        const lng = this.data.raw_data[this.table_info.menu.getGoogleMapLngField()]
        return 'https://www.google.com/maps/search/?api=1&query=' + lat +  ',' + lng
    }

    /**
     * テーブル情報に基づいて適切な権限セレクタIDを取得する
     * @returns 'dataset_group_grant'または'dataset_grant'
     */
    getGrantSelectorId(): string {
        const key = this.table_info.table == 'dataset_group' ? 'dataset_group_grant' : 'dataset_grant';
        return key;
    }

    /**
     * 子要素のセレクタを取得する
     * @returns 'child-dataset_group_grant'または'child-dataset_grant'
     */
    getChildSelector(): string {
        return `#child-${this.getGrantSelectorId()} > .child-container`;
    }

    public openTableGrantModal(grant: any, index: number) {
        const childContainers = document.querySelectorAll(this.getChildSelector());
        const targetContainer = childContainers[index];
        if (targetContainer) {
            const button = targetContainer.querySelector('.table-management-button') as HTMLElement;
            if (button) {
                button.click();
            }

        }
    }

    modalUserDivisionGrant(grant: any, index: number) {
        const childContainers = document.querySelectorAll(this.getChildSelector());
        const targetContainer = childContainers[index];
        if (targetContainer) {
            const button = targetContainer.querySelector('.user_division_grant_btn') as HTMLElement;
            if (button) {
                button.click();
            }

        }
    }

    addTableGrant() {
        const key = this.getGrantSelectorId();
        const buttonSelector = `.add-btn-${key}`;
        const button = document.querySelector(buttonSelector) as HTMLElement;
        if (button) {
            button.click();
        }
    }

    delTableGrant(i: number) {
        const childContainers = document.querySelectorAll(this.getChildSelector());
        const targetContainer = childContainers[i];
        if (targetContainer) {
            const button = targetContainer.querySelector('.delete-button') as HTMLElement;
            if (button) {
                button.click();
            }
        }
    }

    duplicateTableGrant(i: number) {
        const childContainers = document.querySelectorAll(this.getChildSelector());
        const targetContainer = childContainers[i];
        if (targetContainer) {
            const button = targetContainer.querySelector('.duplicate-button') as HTMLElement;
            if (button) {
                button.click();
            }
        }
    }

    getFieldLabel(field_id: number): string {
        let field_label = '-'
        this.data.child_data_by_table['dataset_field'].forEach((field) => {
            if (field.raw_data['id'] === field_id) {
                field_label = field.raw_data['name']
            }
        })
        return field_label
    }

    /**
     * Toggle password visibility for any password field
     * @param event The click event
     * @param fieldId The ID of the password field
     */
    toggleFiledPasswordVisibility(event: any, fieldId: string): void {
        // Get the parent element (input group)
        const target = event.target || event.srcElement;
        const parentElement = target.closest('.input-group');

        if (parentElement) {
            // Toggle visibility state for this specific field
            this.passwordVisibility[fieldId] = !this.passwordVisibility[fieldId];

            // Toggle class on parent element
            if (this.passwordVisibility[fieldId]) {
                parentElement.classList.add('password-visible');
            } else {
                parentElement.classList.remove('password-visible');
            }

            // Find the input element and toggle its type
            const inputElement = parentElement.querySelector('input');
            if (inputElement) {
                if (!inputElement.value || inputElement.value === this._share.dummy_password || inputElement.value === this.data.raw_data['smtp_password']) {
                    if (this.passwordVisibility[fieldId] ) {
                        inputElement.value = '';
                    } else if (inputElement.value === this._share.dummy_password) {
                        inputElement.value = this._share.dummy_password;
                    } else {
                        inputElement.value = this.data.raw_data['smtp_password'] || '';
                    }
                }
                inputElement.type = this.passwordVisibility[fieldId] ? 'text' : 'password';
            }
        }
    }

}
import {Component, EventEmitter, HostListener, Input, OnChanges, AfterViewInit, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewChildren, QueryList} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router'

import ToastrService from '../../toastr-service-wrapper.service';

import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';
import {DomSanitizer} from '@angular/platform-browser';
import * as cloneDeep from 'lodash/cloneDeep';
import {TableInfo} from '../../class/TableInfo';
import {Grant} from '../../class/Grant';
import {Data} from '../../class/Data';
import {Form} from '../../class/Form';
import {Forms} from '../../class/Forms';
import {Workflow} from '../../class/Workflow';
import {Field} from '../../class/Field';
import {v4 as uuidv4} from 'uuid';
import {WorkflowTemplate} from '../../class/Workflow/WorkflowTemplate';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {Conditions} from '../../class/Conditions';
import {FormsComponent} from './forms.component';
import {SortingService} from 'app/services/utils/sorting-service';
import {GroupService} from 'app/services/utils/group-service';
import {UserTableSetting} from '../../class/UserTableSetting';
import {Observable} from 'rxjs/Observable';
import {CanComponentDeactivate} from '../../shared/guards/can-deactivate-guard.service';
import {PublicFormService} from '../../services/public-form-service';
import {CdkDragDrop, CdkDragMove, CdkDragRelease} from '@angular/cdk/drag-drop';
import { DragDropService } from 'app/services/drag-drop.service';
import {GrantGroupData} from '../../class/GrantGroupData';
import {GoogleCalendarComponent} from '../../google-calendar/google-calendar.component';

declare var $: any;

interface WidthSetting {
    field: string;
    current_width: string;
}

@Component({
    selector: 'edit-component',
    templateUrl: './edit.component.html',
    styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnChanges, AfterViewInit, CanComponentDeactivate {
    @Input() IS_IFRAME_MODE: boolean = false;
    @Input() IS_PUBLIC_FORM: boolean = false;
    @Input() filter_id: number = null;
    @Input() public_form_hash: string = null;
    @Input() submit_text: string = '送信';
    @Input() _id: number = null;
    @Input() grant_kind: string = null;
    @Input() _mode: string = null;
    @Input() _add_post_params: Object = {};
    @Input() is_add_new_button_select_other_table: boolean = true;
    @Input() public_form_rid: number = null;
    @Input() grantGroupData: GrantGroupData = null;

    @Output() onSubmit: EventEmitter<Object> = new EventEmitter();
    @Output() onCancel: EventEmitter<Object> = new EventEmitter();

    //for IFRAME
    @Input() IS_EMBED_MODE: boolean = false;
    @Input() _table: string = null;

    @ViewChildren(GoogleCalendarComponent) googleCalendars: QueryList<GoogleCalendarComponent>;

    public is_edited: boolean = false;

    public full_display_message: string = ''

    public page_title: string;
    public loading = true;
    public loading_reflect_forms = true;
    public mode: string; // add or edit
    public before_html: string;

    public table_info: TableInfo;
    public grant: Grant;

    public return_url: string;

    // 設定ページかどうか
    public is_setting = false;

    // drag and drop filed add
    public is_drag_field_add = false;
    public show_drag_field_list = true;
    public isDesktop = false;
    public drag_placeholder_visible = false;

    public fixedYorder = false;

    // データ定義ページかどうか
    public is_dataset_edit: boolean = false;
    private workflow: Workflow = null;

    private workflow_template: WorkflowTemplate;

    // adminテーブルデータ追加時
    public sendMailFlg = true;

    /**
     * DATASET DEFINITIONfalse
     */
    public dataset_edit_mode = 'dataset_field';
    public dataset_grant_type = 'me';
    public workflow_template_a: Array<WorkflowTemplate> = [];
    public workflow_template_csv: File;
    public target_table_grant: Grant = null;

    public id: number;
    public table: string;
    public fields: Array<any>;
    public forms: Forms;
    //for dataset
    public converted_fields: Array<Array<Field>>;
    public converted_forms: Forms;
    public data: Data;
    public error_a: {} = {};

    public order_field: string;

    // 項目にgrantがある場合
    public grant_menu_a: Array<any> = [];
    public sending = false;
    public is_finish_edit = false;

    //child  by index by table
    public child_error_a_by_table: Object = {};


    private toasterService: ToastrService;
    private extend_scripts: Array<string> = [];
    showDetailSettings: boolean = false;
    source: string = 'permission_setting';

    // delete modal
    @ViewChild('editModal') EditModal: any;
    @ViewChild('worflowModal') WorflowModal: any;
    @ViewChild('commentModal') CommentModal: any;
    @ViewChild('commentModalComponent') commentModalComponent: any;
    @ViewChild('publicFormConfirmModal') publicFormConfirmModal: any;
    @ViewChild('childDeltedConfirmModal') childDeltedConfirmModal: any;
    @ViewChild('confirmModal') confirmModal: any;

    @ViewChild(FormsComponent) forms_component;

    // child-table image mode
    private image_file: File;


    public field_reloading = false;

    /**
     * for dataset edit
     */
        //target table (ex.user)
    public system_table: string;
    public system_table_info: TableInfo;

    /**
     * Custom data set
     */
    public original_info_data: {};


    /**
     * workflow
     */
    public apply_workflow_flg: boolean = false

    public everyone_hide_fields: Array<any> = [];

    @ViewChild('settingModal') settingModal: any;
    public settingData: Data;
    private settingIndex;
    private settingModalIsNew;
    public settingTitle;
    public settingBtnLabel;
    public settingType: string;
    public settingTypes = [
        {
            value: 'auto-id',
            label: '自動採番',
            icon: 'list-ol',
            'option': {'auto-id-format': 'ID-{YYYY}-{MM}-{ID:4:0000}'},
            'explain': '自動採番をフォーマットに従って行います。<br>' + '過去データに設定を行いたい場合、CSVアップロードを行うことで自動採番の項目が空データに対しても自動で値が入ります。'
        },
        {value: 'text', label: '文字列(一行)', icon: 'pencil'},
        {value: 'textarea', label: '文章(複数行)', icon: 'pencil-square-o'},
        {value: 'number', label: '数値', icon: 'bar-chart', 'option': {'switch_num': 'integer', 'editable': true, 'show-list': true}},
        {value: 'boolean', label: 'Yes / No', icon: 'check-circle'},
        {value: 'radio', label: '選択肢(単一選択)', icon: 'dot-circle-o',option:{'layout':'horizontal'}},
        {value: 'select', label: '選択肢(単一選択)', icon: 'dot-circle-o', show_list: false},
        {value: 'checkbox', label: '選択肢(複数選択)', icon: 'check-square', option: {'checkbox_input_type': 'checkbox', layout:'horizontal', 'editable': true, 'show-list': true}},
        {value: 'datetime', label: '日時', icon: 'calendar'},
        {value: 'image', label: '画像', icon: 'picture-o','option':{'show_pixel':false}},
        {value: 'file', label: 'ファイル', icon: 'paperclip'},
        {value: 'select_other_table', label: '他テーブル参照', icon: 'table', 'option': {'show_lookup_modal': true, 'show_add_on_list': true}},
        {value: 'calc', label: '計算', icon: 'calculator', 'option': {'switch_num': 'integer', 'calc_result_type': 'number', 'show-list': true, 'calc_auto_reload_off': true}},
        {value: 'relation_table', label: '関連レコード一覧', icon: 'table'},
        {value: 'fixed_html', label: '固定テキスト', icon: 'commenting-o', 'option': {'show_edit_page': true, 'show_view_page': true}},
    ];
    public convertableTypes = {
        'text': ['text', 'textarea', 'number', 'boolean', 'radio', 'select', 'datetime'],
        'textarea': ['text', 'textarea', 'number', 'boolean', 'radio', 'select', 'datetime'],
        'number': ['text', 'textarea', 'number', 'radio', 'select', 'datetime'],
        'select': ['text', 'textarea', 'number', 'radio', 'select', 'datetime', 'checkbox'],
        'radio': ['text', 'textarea', 'number', 'radio', 'select', 'datetime', 'checkbox'],
        'datetime': ['text', 'textarea'],
        'date': ['text', 'textarea'],
        'time': ['text', 'textarea'],
        'year_month': ['text', 'textarea'],
        'image': ['file'],
        'file': ['image'],
    };
    private settingTypesHash = {email: 'text', richtext: 'textarea', 'year_month': 'datetime', 'url': 'text', 'date': 'datetime', 'time': 'datetime'}; // DBのtypeとsettingTypesのキーが異なる場合
    private isTableSettingOptionCollapsed;
    private ref = null;

    private editingTimer;
    private field_xy = [];
    private hasChild = false;

    // 20240419 Kanazawa 追加
    // バリデーション用 スペース、バックスラッシュ、クォーテーション、<>をチェック
    private UNIQUE_ID_REGEXP_PATTERN = /[\s|\\|'|"|_|<|>]+/;

    private UNIQUE_ID_ERROR_MESSAGE = '固有IDにスペース、\\ \' \" _ <>は入力できません';

    private is_draft_save: boolean = false;

    private readonly WIDTH_SETTING_STORAGE_KEY = 'width_setting';

    constructor(private _router: Router, private _route: ActivatedRoute, public dragDropService: DragDropService, private _connect: Connect, public _share: SharedService, toasterService: ToastrService, protected sanitizer: DomSanitizer, public sortingService: SortingService, public groupService: GroupService, private publicFormService: PublicFormService) {
        this.toasterService = toasterService;
        this.dragDropService = dragDropService;
        this.settingTypes.forEach(_type => {
            if (!_type['option']) {
                // @ts-ignore
                _type['option'] = {'show-list': true, 'show-in-detail':true, 'editable': true}
            } else {
                _type['option']['show-list'] = true;
                _type['option']['show-in-detail'] = true;
                _type['option']['editable'] = true;

            }
            if (_type.value === 'relation_table') {
                _type['option']['show-list'] = false;
            }
        })


    }

    @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        if (event.shiftKey && event.ctrlKey && event.key === 'U') {
            localStorage.setItem('debug_mode', 'true');
            this._share.debug_mode = true
            console.log(location.hostname)
            console.log(event)
        }
    }

    ngAfterViewInit(): void {
        //register dragDropService for dataset field edit only
        if (this.isFieldEditMode() ){
            this.dragDropService.register('dragSidebarList')
        }
    }

    public get connectedLists() {
        return this.dragDropService.dropLists;
    }

    disallowDropPredicate() {
        return false;
    }

    dragMoved(event: CdkDragMove<any>) {
        this.dragDropService.dragMoved(event);
    }

    dragReleased(event: CdkDragRelease) {
        this.dragDropService.dragReleased(event);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        //set empty drop lists
        this.dragDropService.setEmptyDroplist();
        if (this.table_info && this.table_info.isDatasetTable() && this.mode == 'edit') {
            if (this.editingTimer) {
                clearInterval(this.editingTimer)
            }
            navigator.sendBeacon(this._connect.getApiUrl() + '/admin/' + this.table + '/' + this.id + '/finish-edit', new FormData());
        }
    }


    canDeactivate() {
        return this.is_finish_edit || (!this.is_edited && this.table !== 'dataset') || window.confirm('保存されていないデータがあります。破棄してよろしいですか？');
    }


    setDefaultFilter(table_info) {
        this.customFilter = table_info.getDefaultFilter('edit');
    }


    setFroalaOptions(_forms: Forms, field) {
        //const froala_type = _this.forms.byFieldName(field.Field).option.froala_type;
        field.froala_option = this._share.froala_option_by_type['full'];
        field.froala_option.key = this._share.froala_key;
        field.froala_option.imageUploadURL = this._connect.getApiUrl() + '/admin/upload-froala-img/' + this.table + '/image'
        field.froala_option.fileUploadURL = this._connect.getApiUrl() + '/admin/upload-froala-file/' + this.table + '/file'
        /*
        if (this._share.use_s3) {
        } else {
            field.froala_option.imageUploadURL = this._connect.getApiUrl() + '/admin/upload-to-db';
            field.froala_option.fileUploadURL = this._connect.getApiUrl() + '/admin/upload-to-db';
        }
         */
    }

    ngOnInit() {
        this.onWindowResize(); // 初期サイズ設定
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // debugger;
        this.init()
        this.return_url = this._route.snapshot.queryParamMap.get('return_url') || null;



        if (this.IS_PUBLIC_FORM) {
            document.getElementsByTagName('body')[0].style.backgroundColor = '#f0f0f0'
        }
        if (!this.IS_IFRAME_MODE) {
            this._share.getTableInfo(this.table).subscribe(table_info => {
                //redirect to table list if hide insertable
                if(table_info.menu.hide_insertable){
                    this._router.navigate(['admin',this.table]);
                }
                this.setDefaultFilter(table_info);

                if (table_info.isDatasetTable() && this.mode == 'edit') {
                    this._connect.post('/admin/' + this.table + '/' + this.id + '/start-edit', {}).subscribe(_res => {
                    })

                    //1分
                    this.editingTimer = setInterval(() => {
                        this._connect.post('/admin/' + this.table + '/' + this.id + '/start-edit', {}).subscribe(_res => {
                        })
                    }, 1000 * 60);
                }
            });
        }
        this.onWindowResize()

    }

    onWindowResize() {
        console.log('EDIT:resize')
        if (window.innerWidth >= 992) {
            this.isDesktop = true;
            let field_list = (document.querySelector('.toggle-drag-field-list') as HTMLElement);
            if (field_list) {
                field_list.style.maxHeight = `${window.innerHeight}px`;
            }
        } else {
            this.isDesktop = false;
        }
    }

    // @HostListener('window:popstate', ['$event'])
    // onPopState(event) {
    //     if (this.mode == 'add') {
    //         if(!window.confirm('保存されていないデータがあります。破棄してよろしいですか？')) {
    //             window.history.forward()
    //         }
    //     }
    // }

    ngOnChanges(changes: SimpleChanges) {
        this.init()
    }

    onScrollSidebar($event){
        $event.target.style.maxHeight = `${window.innerHeight - 60}px`;
    }
    setClasses(): Object {

        let class_hash = {'iframe': this.IS_IFRAME_MODE, 'public-form': this.IS_PUBLIC_FORM}
        if (this.table_info) {
            class_hash[this.table_info.getJaClassName()] = true;
            class_hash[this.table_info.getClassName()] = true;
        }

        if (!this.IS_EMBED_MODE) {
            class_hash['row'] = true;
        }
        return class_hash
    }


    private url_set_params: Object = {}

    private init() {

        this._route.params.subscribe(params => {
            this.table = params['table'];
            Object.keys(params).forEach(k => {
                if (k.match(/body$/)) {
                    //一旦bodyだけ
                    this.url_set_params[k] = params[k]
                }
            })
            if (params['id'] === 'new' || !params['id']) {
                // add
                this.mode = 'add';
                if (params['ref']) {
                    this.ref = params['ref'];
                }
            } else {
                // edit
                this.id = params['id'];
                this.mode = 'edit';
            }

            if (params['public_form'] === 'true') {
                this.IS_PUBLIC_FORM = true
            }
            this.fields = [];
            this.forms = new Forms({});
            this.data = null;


            //INPUTにある場合
            if (this._id) {
                if (this._id == -1) {
                    this.id = null;
                    this.mode = 'add'
                } else {
                    this.id = this._id;
                    this.mode = 'edit'
                }
            }
            if (this._table) {
                this.table = this._table;
            }
            if (this._mode) {
                this.mode = this._mode
            }

            if (params['system_table']) {
                this.system_table = params['system_table']


                this._share.getTableInfo(this.table).subscribe(table_info => {
                    let filter = new CustomFilter();
                    filter.conditions = new Conditions()
                    filter.conditions.addCondition('eq', 'system_table', this.system_table)
                    this._connect.getList(table_info, 1, Number.MAX_SAFE_INTEGER, filter).subscribe(res => {
                        if (res['data_a'].length > 0) {
                            this._router.navigate([this._share.getAdminTable(), this.table, 'edit', res['data_a'][0]['raw_data']['id']]);
                            return;
                        }

                        //まだそのsystem tableのdatasetがない時
                        this.load();
                    });
                    this.everyone_hide_fields = [table_info.getFieldByFieldName('everyone_hide_fields')]
                })
                return;
            }

            this.publicFormService.publicPostParams = this.getPublicFormParam()
            this.load();
        });
        this.sendMailFlg = this.mode == 'add' && (this.table === 'admin' || this.table === 'dataset__' + this._share.admin_table_num) ? true : false;

    }

    private isDatasetEdit() {
        return this.table === 'dataset';
    }

    private isPositionOrDivisionEdit() {
        return this.table === 'division' || this.table === 'position';
    }

    public isEditSystemTable() {
        return !!this.system_table;
    }

    private checkIsAlreadyStoredOfPublicForm(): void {
        this._connect.post('/iframe/is_already_stored/' + this.table, this.getPublicFormParam()).subscribe(res => {
            if (res.stored) {
                this.full_display_message = '既に送信済みです';
            }
        })

    }

    private getPublicFormParam(): Object {
        return {
            'filter_id': this.filter_id,
            'hash': this.public_form_hash,
            'table': this.table,
            'rid': this.public_form_rid
        };

    }

    load() {
        if (this.system_table) {
            this._share.getTableInfo(this.system_table).subscribe(table_info => {
                this.system_table_info = table_info
            })
        }

        this.loading = true;
        let params = null;
        if (this.IS_IFRAME_MODE) {
            params = this.getPublicFormParam()
        }
        if (this.IS_PUBLIC_FORM && this.public_form_rid) {
            this.checkIsAlreadyStoredOfPublicForm();
        }

        if(this.table == 'ledger') {
            const grant_target_table = window.location.pathname.split('/')[2];
            if (grant_target_table.startsWith('dataset__')) {
                params = { ...params, grant_target_table };
            }
        }

        this._share.getTableInfo(this.table, this.IS_IFRAME_MODE, params).subscribe(async (data) => {


                if (!data) {
                    if (this.IS_IFRAME_MODE) {
                        alert('エラーが発生しました');
                        return
                    }
                    this._router.navigate([this._share.getAdminTable(), 'login']);
                    return;
                }

                this.page_title = data.menu.name;
                this._route.snapshot.data.title = this.page_title;
                this.before_html = data.edit_before_html;

                this.order_field = data['order_field']
                this.is_dataset_edit = data.menu.is_custom_table_definition;


                this.table_info = data;
                this.forms = this.table_info.forms;
                this.fields = this.table_info.fields;
                this.grant = this.table_info.grant;
                this.data = new Data(this.table_info);

                if (this._add_post_params) {
                    this.data.setRawData(this._add_post_params)
                }

                if (this.isDatasetEdit()) {
                    this.everyone_hide_fields = [data.getFieldByFieldName('everyone_hide_fields')]
                }

                //workflow needs ADMIN list view grant
                if (this.table_info.menu.is_workflow) {
                    this.workflow = new Workflow();

                }

                if (this.is_dataset_edit) {
                    this.page_title = '項目';
                }
                // アカウント設定の時。（テーブル権限自体は無いが、自分の情報は編集可能）
                this.is_setting = (data.grant.list === false);


                const parent = this;
                const onFinishLoad = () => {
                    if (parent.is_dataset_edit) {
                        // create preview form from field definition
                        parent.setFormByOriginalData()
                        parent.convertChildDataToFields()
                        if (this.isEditSystemTable()) {
                            this._share.getTableInfo(this.system_table).subscribe(table_info => {
                                this.data.setRawData({'system_table': this.system_table});
                                this.system_table_info = table_info
                                if (this.data.raw_data['label'] == '') {
                                    this.data.setRawData({'label': this.system_table_info.getLabel()});
                                }
                            })
                        }
                    }
                    if (parent.IS_IFRAME_MODE) {
                        parent.fitIframeHeight()
                    }
                }
                this.data.child_a.forEach((child) => {
                    this.child_error_a_by_table[child.table] = {}

			    	const parent_field = child.pf
			    	this.table_info.forms.getArray().forEach(form => {
			    		if (form.field_name == parent_field && form.open_empty_record > 0) {
			    			for (let i = 0; i < form.open_empty_record; i++) {
			    				this.addChildData(child, false, undefined, this.data.child_data_by_table[child.table]?.length );
			    			}
			    		}

			    	})
                });

                //set Default Custom Filter
                this.userTableSetting = this._share.getUserTableSetting(this.table)

                if (this.userTableSetting.filter_id && !this.IS_IFRAME_MODE) {
                    this.setFilter(this.userTableSetting.filter_id);
                }
                //set Default Custom Filter End


                if (this.mode === 'edit') {
                    this.loading = true
                    const handle_error = this.table == 'grant_group' ? false : true;

                    if(this.table == 'grant_group' && this.grantGroupData && this.grantGroupData.raw_data['id'] != this.id){
                        this.id = this.grantGroupData.raw_data['id'];
                    }
                    this._connect.get('/admin/view_for_edit/' + this.table + '/' + this.id, null, null, handle_error).subscribe((data_hash) => {
                        // console.log(data)
                        if (data_hash['result'] !== 'success') {
                            this.toasterService.error(data_hash['error_a'].join(','), 'エラー');
                            return;
                        }
                        data_hash = data_hash['data']
                        this.loading = false;
                        this.data.setInstanceData(data_hash);

                        if (this.grantGroupData) {
                            this.data = this.grantGroupData;
                        }

                        // breadcrumbs
                        if (this._share.menu_root) {
                            let findID =  this.table == 'dataset' && this.id ? `dataset__${this.id}` : this.table;
                            const { node, breadcrumbs } = this._share.menu_root.find(findID);
                            breadcrumbs.shift();
                            if (this.table != 'dataset')breadcrumbs.push({'name': '編集 (ID: ' + this.id + ')'});
                            this._share.breadcrumbs = breadcrumbs;
                        }

                        //ワークフロー申請中の場合、redirect
                        if (this.table != 'ledger' && this.is_dataset_edit && !this.data.isEditable()) {
                            this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.id]);
                            return;
                        }


                        //パスワード設定　
                        this.table_info.forms.getArray().forEach(form => {
                            if (form.original_type === 'password' || form.field['Field'] == 'password') {
                                let updHash = {};
                                if (form.field['Field'] !== 'smtp_password' ) {
                                    updHash[form.field['Field']] = ''
                                }
                                this.data.setRawData(updHash);
                            }
                        })

                        this.data.child_a.forEach((child, index) => {
                            child.forms?.getArray().forEach(form => {

                                if (form.original_type === 'password' || form.field['Field'] == 'password') {
                                    let updHash = {};
                                    // updHash[form.field['Field']] = this._share.dummy_password;
                                    updHash[form.field['Field']] = ''
                                    this.data.child_data_by_table[child.table].forEach(d => {
                                        d.setRawData(updHash);
                                    })
                                }
                            });
                        });
                        //パスワード設定　 END

                        if (this.table_info.menu.is_workflow) {
                            if (data_hash['workflow'] && data_hash['workflow']['id']) {
                                this.workflow = new Workflow(data_hash['workflow']);
                                if (this.workflow.isEnd()) {
                                    //拒否等の再申請の場合は、新しいワークフロー
                                    if (this.workflow_template) {
                                        this.workflow = this.workflow_template.workflow;
                                    } else {
                                        this.workflow = new Workflow();
                                    }
                                }
                            }

                        }

                        if (this.isDatasetEdit() && this.system_table) {
                            if (this.data.raw_data['table'] !== this.system_table) {
                                this.toasterService.error('正しいデータではありません。一度トップ画面からやり直して下さい。', 'エラー');
                                return;
                            }

                        }

                        if (this.data.is_locked) {
                            this.toasterService.error('他のユーザーが編集中のため、編集できません。', 'エラー');

                        }

                        if (this.isDatasetOrGroupEdit()) {
                            this.dataset_grant_type = data_hash['raw_data']['grant_type'];
                        }
                        if (this.isDatasetEdit()) {

                            /**
                             * テーブル編集の場合、workflow pathのテンプレート設定
                             */
                            if (data_hash['raw_data']['workflow_template_a_json']) {
                                let workflow_template_a: Array<Object> = JSON.parse(data_hash['raw_data']['workflow_template_a_json']);
                                workflow_template_a.forEach(workflow_template_hash => {
                                    this.workflow_template_a.push(new WorkflowTemplate(workflow_template_hash))
                                })
                            }

                            //ターゲットのテーブルのgrantを取得する
                            if (this.mode == 'edit') {
                                this._share.getTableInfo('dataset__' + this.id).subscribe(async (_target_table_info) => {
                                    this.target_table_grant = _target_table_info.grant
                                    console.log(this.target_table_grant)

                                });

                            }
                        }

                        /**
                         * Froala 設定
                         */
                        this.data.child_a.forEach((child, index) => {
                            child.fields?.forEach(field => {
                                if (child.forms.byFieldName(field.Field).type === 'richtext') {
                                    this.setFroalaOptions(child.forms, field);
                                }
                            });
                        });

                        // if pigeon cloud and master user, grant cannot be edited
                        if (this._share.is_cloud && this.table_info.is_admin_table && this.data['type'] === 'master') {
                            this.fields.forEach((field) => {
                                if (field.Field === 'pigeon_admin_grant_id') {
                                    field.editable = false;
                                }
                            })
                        }

                        if (this.data.raw_data['system_table']) {
                            this.system_table = this.data.raw_data['system_table']
                        }


                        onFinishLoad()
                    });
                } else {
                    //IF ADD
                    // デフォルト値セット
                    if ((this._id != -1 && !!this.ref) && this.grant.duplicate) {
                        this.loading = true
                        this._connect.get('/admin/view_for_edit/' + this.table + '/' + this.ref).subscribe((data) => {
                            if (data['result'] !== 'success') {
                                this.toasterService.error(data['error_a'].join(','), 'エラー');
                                return;
                            }
                            this.loading = false;
                            let fields_to_omit = [
                                'id',
                                'created',
                                'updated',
                                'admin_id',
                                'comments',
                                'workflow'
                            ];
                            let field_type_to_omit = [
                                /*
                                'file',
                                'image'
                                 */
                            ];
                            delete data.data.raw_data.id;
                            delete data.data.view_data.id;
                            delete data.data.workflow;
                            delete data.data.grant;
                            for (var form in data.data.raw_data) {
                                if (!!this.forms.byFieldName(form) && Object.prototype.hasOwnProperty.call(data.data.raw_data, form)) {
                                    if (fields_to_omit.includes(form) || field_type_to_omit.includes(this.forms.byFieldName(form).type)) {
                                        delete data.data.raw_data[form];
                                        delete data.data.view_data[form];
                                        for (var child_prop in data.data.child_data_a_by_table) {
                                            if (Object.prototype.hasOwnProperty.call(data.data.child_data_a_by_table, child_prop)) {
                                                if (child_prop.includes(form)) {
                                                    data.data.child_data_a_by_table[child_prop] = []
                                                }
                                            }
                                        }
                                    }

                                    // 自動採番の項目は重複しないように削除。
                                    if(!!this.forms.byFieldName(form) && this.forms.byFieldName(form).type === 'auto-id'){
                                        data.data.raw_data[form] = ""
                                        data.data.view_data[form] = ""
                                    }
                                }
                            }
                            let remove_child_table_id = (_data) => {
                                for (var child_prop in _data.child_data_a_by_table) {
                                    if (Object.prototype.hasOwnProperty.call(_data.child_data_a_by_table, child_prop)) {
                                        _data.child_data_a_by_table[child_prop].forEach(child => {
                                            delete child.raw_data.id;
                                            delete child.raw_data.data_id;
                                            delete child.view_data.id;
                                        });
                                        _data.child_data_a_by_table[child_prop].forEach(child => {
                                            if (child['child_data_a_by_table']) {
                                                remove_child_table_id(child)
                                            }
                                        });
                                    }
                                }
                            };

                            remove_child_table_id(data.data);

                            this.data.setAddDefualtValue(this.forms, this._share)
                            let copy_hash = data.data
                            let only_field_names = [];
                            if (this.table_info.menu.is_set_duplicate_field) {
                                this.table_info.menu.duplicate_fields.forEach(field_name => {
                                    this.table_info.forms.getArray().forEach(f => {
                                        if (f.field_name == field_name) {
                                            only_field_names.push(f.field['Field'])
                                        }
                                    })

                                })
                            }
                            this.data.setInstanceData(data.data, false, only_field_names, this.ref);

                            // 子テーブルを複製しない場合は除外
                            if (this.table_info.menu.is_set_duplicate_field) {
                                this.data.child_a.forEach((child, index) => {
                                    if (!only_field_names.includes(child.pf)) {
                                        this.data.child_data_by_table[child.table] = []
                                    }
                                })
                            }

                            onFinishLoad()
                        });
                    } else {
                        this.data.setAddDefualtValue(this.forms, this._share)
                        if (this.url_set_params) {
                            this.data.setRawData(this.url_set_params)
                        }

                        // URLパラメータからcopy_fieldsを取得して初期値として設定
                        const copy_fields_param = this._route.snapshot.queryParamMap.get('copy_fields');
                        const copy_fields_view_param = this._route.snapshot.queryParamMap.get('copy_fields_view');
                        const copy_child_data_by_table_param = this._route.snapshot.queryParamMap.get('copy_child_data_by_table');
                        if (copy_fields_param) {
                            try {
                                const copy_fields = JSON.parse(copy_fields_param);
                                if (copy_fields && typeof copy_fields === 'object') {
                                    // コピー対象フィールド情報をデータに設定
                                    Object.keys(copy_fields).forEach(field_name => {
                                        if (this.forms.byFieldName(field_name)) {
                                            this.data.setRawData({ [field_name]: copy_fields[field_name] });
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('copy_fieldsパラメータの解析に失敗しました:', e);
                            }
                        }
                        if (copy_fields_view_param) {
                            try {
                                const copy_fields_view = JSON.parse(copy_fields_view_param);
                                Object.keys(copy_fields_view).forEach(field_name => {
                                    if (this.forms.byFieldName(field_name) && ['image', 'file'].includes(this.forms.byFieldName(field_name).type)) {
                                        this.data.view_data[field_name] = copy_fields_view[field_name]
                                    }
                                });
                            } catch (e) {
                                console.error('copy_fields_viewパラメータの解析に失敗しました:', e);
                            }
                        }
                        if (copy_child_data_by_table_param) {
                            try {
                                const copy_child_data = JSON.parse(copy_child_data_by_table_param);
                                if (copy_child_data && typeof copy_child_data === 'object') {
                                    // 子テーブルデータをコピー
                                    Object.keys(copy_child_data).forEach(field_name => {
                                        const form = this.forms.byFieldName(field_name);
                                        if (form && form.type === 'relation_table') {
                                            // 対応するテーブル情報を取得
                                            const childTableInfo = this.table_info.child_a.find(child => child.pf === field_name);
                                            if (childTableInfo) {
                                                this.data.child_data_by_table[childTableInfo.table] = copy_child_data[field_name];
                                            }
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('copy_child_data_by_tableパラメータの解析に失敗しました:', e);
                            }
                        }
                        this.loading = false;
                    }
                    onFinishLoad()
                }


                if (this.data.child_a.length != 0) {
                    this.hasChild = true;
                }



            },
            error => {
                this.loading = false;
                this.toasterService.error(error.error.error_a.join(','), 'エラー');
            });
    }


    add() {
        if (this.table == 'dataset') {
            this.post('/admin/' + this.table);
        } else {
            if (this.IS_IFRAME_MODE) {
                this.post('/iframe/add/' + this.table);
            } else {
                this.post('/admin/add/' + this.table + '/');
            }
        }
    }

    edit() {
        this.post('/admin/edit/' + this.table + '/' + this.id);
    }


    addChildData(child: TableInfo, scroll_after_add = true, order = -1, index = null) {
        // debugger;
        const new_data = {}
        if (order === -1) {
            if (child.table === 'dataset_grant') {
                this.data.setChildData(child, { grant_json: null }, index, this._share);
            } else {
                this.data.setChildData(child, {}, index, this._share);
            }
        }

        //child.error_a.push({});
        if (scroll_after_add) {
            const scroll = $('#child-' + child.table).offset().top + $('#child-' + child.table).height() - 60;
            $('html,body').animate({scrollTop: scroll}, 500, 'swing');
        }
        return new_data;
    }


    orderChange(child_data_a, from_index, to_index) {
        if (from_index < 0 || to_index < 0 || from_index >= child_data_a.length || to_index >= child_data_a.length) {
            return;
        }
        const tmp = child_data_a[to_index];
        child_data_a[to_index] = child_data_a[from_index];
        child_data_a[from_index] = tmp;

    }

    public childDeleteData = {
        child: null,
        index: null
    };

    clickToDeleteChild( child, i, isConfirmed = false){
        if ( isConfirmed ){

            this.deleteChild( child, i );
            this.childDeltedConfirmModal.hide();

        }else{

            this.childDeltedConfirmModal.show();

            this.childDeleteData.child = child;
            this.childDeleteData.index = i;

        }
    }

    deleteChild(child, i) {
        this.data.child_data_by_table[child.table].splice(i, 1);
        this.data.child_data_by_table[child.table].forEach((_data: Data, i) => {
            _data.setRawData({'order': (i + 1)})
        })
    }

    duplicateChild(child, i) {
        const cloneData = cloneDeep(this.data.child_data_by_table[child.table][i])

        delete cloneData.raw_data['id'];

        let duplicate_fields = null;
        if (cloneData.table_info.menu.is_set_duplicate_field) {
            let duplicate_fields = cloneData.table_info.menu.duplicate_fields;
        }

        if (child.table == 'dataset_grant') {
            duplicate_fields = ['dataset_id', 'grant_json', 'hide_fields', 'hide_fields_ids', 'only_view_fields', 'only_view_fields_ids'];
        }

        if (duplicate_fields !== null) {
            Object.keys(cloneData.raw_data).forEach(field => {
                if (!duplicate_fields.includes(field)) {
                    delete cloneData.raw_data[field];
                    delete cloneData.view_data[field];
                }
            });
        }


        cloneData.raw_data['order'] = this.data.child_data_by_table[child.table].length;
        this.data.child_data_by_table[child.table].push( cloneData );
    }

    isString(val) {
        return (typeof val) === 'string';
    }

    private validate_data(form: Form, val, debug = false) {
        if (val == null) {
            val = '';
        }
        let error_a: Array<string> = [];
        let field = form.field;
        if (!field) {
            return [];
        }
        // field base
        if (field['Field'] === 'password') {
            if (this.data['password_conf'] !== this.data[field['Field']]) {
                error_a[field['Field']] = '確認パスワードが一致しません';
            }
        }

        if (form.original_type === 'condition' && val) {
            let conditions = new Conditions(JSON.parse(val));
            if (!conditions.validate()) {
                error_a[field['Field']] = conditions.error_message
            }
        }

        // 20240419 Kanazawa 追加
        // 固有IDのバリデーション
        if (field['Field'] === 'unique_id') {
            // 除外したい文字が含まれるかどうかチェック
            if (this.UNIQUE_ID_REGEXP_PATTERN.test(val)) {
                error_a[field['Field']] = this.UNIQUE_ID_ERROR_MESSAGE;
            }
        }

        /*
        validate server side
        const val_len = val ? val.length : 0;
        // param base
        if (form.min_len !== null) {
            const min_len = form.min_len;
            if (val_len < min_len) {
                error_a[field['Field']] = form.label + 'は最低' + min_len + '文字必要です';
            }
        }
        if (form.max_len !== null) {
            const max_len = form.max_len;
            if (val_len > max_len) {
                error_a[field['Field']] = form.label + 'は最大' + max_len + '文字までです';
            }
        }

         */
        return error_a;
    }

    validate() {
        let error_a = {};

        if (this.is_dataset_edit && this.data.raw_data['label'] === '') {
            error_a['table'] = 'テーブル名は必須です。';
        }

        this.table_info.getEditableFormArray().forEach(form => {
            let field = form.field;
            let val = this.data.raw_data[field['Field']];
            if (form.is_multi_value_mode) {
                val = this.data.getMultiDataAry(field['Field'], true);
                if (val) {
                    val.forEach((_mval) => {
                        Object.assign(error_a, this.validate_data(form, _mval, true))
                    })
                }
            } else {
                Object.assign(error_a, this.validate_data(form, val))
            }
        })

        const rawDataArray = this.data.getRawDataIncludeChild();
        Object.keys(rawDataArray).forEach((key) => {
            const val_a = rawDataArray[key];
            if (Array.isArray(val_a)) {
                val_a.forEach(val => {
                    if (val === null || val === undefined || val === '') {
                        error_a[key] = this.forms.byFieldName(key).label + 'がすべて入力されていません。';
                    }
                });
            }
        });

        this.data.child_a.forEach(child => {
            this.data.getChildDataAry(child.table).forEach((_child_data: Data) => {
                //DATASET_FIELD
                if (_child_data.table_info.table == 'dataset_field') {
                    if (_child_data.raw_data['option']['copy-fields']) {
                        //関連テーブルの条件
                        _child_data.raw_data['option']['copy-fields'].forEach(copy_field => {
                            if (copy_field['to'] == '' || copy_field['from'] == '') {
                                error_a['_dummy'] = _child_data.raw_data['name'] + 'の条件がすべて選択されていません。';
                            }
                        })
                    }
                }
                child.fields.forEach(c_field => {
                    Object.assign(error_a, this.validate_data(child.forms.byFieldName(c_field.Field), _child_data.raw_data[c_field.Field]))
                })

                if (child.child_a.length > 0) {
                    child.child_a.forEach((_child_multi_child: TableInfo) => {
                        let _child_field_name = _child_multi_child.getChildParentFieldName()
                        let _child_form = child.forms.byFieldName(_child_field_name)
                        if (_child_form?.isAutoFillField) {
                            return true;
                        }
                        //子要素のmultiple
                        _child_data.getChildDataAry(_child_multi_child.table).forEach((_multi_child_data: Data) => {
                            if (!_multi_child_data.raw_data['value']) {
                                error_a['_dummy'] = _child_multi_child.getLabel() + 'の' + _child_multi_child.forms.byFieldName('value')['label'] + 'がすべて入力されていません。';
                            }
                        });
                    });
                }
            });


        })

        if (Object.keys(error_a).length !== 0) {
            Object.keys(error_a).forEach((error_key) => {
                const error = error_a[error_key];
                this.toasterService.error(error, 'エラー');
            })

            return false;
        }
        return true;
    }


    go_edit() {
        // debugger;
        if (!this.validate()) {
            return;
        }
        this.loading = false;

        if(this.isWorkflowApplyAvailable()){
            this.is_draft_save = true;
        }

        if (this.table_info.menu.show_confirm) {
            this.EditModal.show();
        } else if (this.table_info.menu.popup_comment_after_save && !this.IS_IFRAME_MODE) {
            this.CommentModal.show();
        } else if (this.IS_PUBLIC_FORM) {

            window.parent.postMessage({'mode': 'scroll_to_top'}, '*');
            this.publicFormConfirmModal.show();
        } else {
            this.store()
        }
    }

    get_query_params()
    {
        let parameterObj = {};
        if (this._route.queryParams['value']['year_calendar'] != undefined) {
            let year_calendar = this._route.queryParams['value']['year_calendar'];
            let month_calendar = this._route.queryParams['value']['month_calendar'];
            let date_calendar = this._route.queryParams['value']['date_calendar'];
            parameterObj['queryParams'] = {
                registeredDate: year_calendar + '-' + month_calendar + '-' + date_calendar,
            };
        }
        return parameterObj;
    }

    cancel() {
        if (this.IS_EMBED_MODE) {
            this.onCancel.emit();
            return;
        }
        if (!this.id) {
            this._router.navigate([this._share.getAdminTable(), this.table], this.get_query_params());
        } else {
            if (this.table == 'dataset') {
                this._router.navigate([this._share.getAdminTable(), `dataset__${this.id}`]);
            } else {
                this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.id]);
            }
        }
    }

    workflow_store() {
        this.is_draft_save = false;
        this.apply_workflow_flg = true;
        this.store()
    }

    store() {
        if (this.mode === 'add') {
            this.add();
        } else {
            this.edit();
        }
    }

    public postFormData: FormData = null;

    loadPostFormData() {
        console.log('LoadPostForm')
        this.postFormData = this.getPostFormdata()
    }

    onCsvLoaded(file: File) {
        this.workflow_template_csv = file;
    }

    private getPostFormdata(): FormData {
        return this._share.get_post_data(this.table_info, this.data, this.fields, this.forms, this.data.child_a, this.mode, this.is_setting, this.is_dataset_edit);
    }

    private cancelOnEditRequests() {
        try {
            this.table_info.cancellAllSubscriptions();
            this.data.getFilteredChildAry(this.customFilter).forEach(child => {
                child.cancellAllSubscriptions();
            });
        } catch (e) {
            console.log(e)
        }
    }

    private updateWidthSetting(): void {
        const dataset_fields = this.getDatasetFields();
        if (!dataset_fields || dataset_fields.length === 0) {
            return;
        }

        try {
            const new_width_settings = this.createWidthSettingsFromDatasetFields(dataset_fields);
            const existing_width_settings = this.getExistingWidthSettings();
            const merged_settings = this.mergeWidthSettings(existing_width_settings, new_width_settings);
            
            this.saveWidthSettings(merged_settings);
        } catch (error) {
            console.error('Failed to update width settings:', error);
        }
    }

    private getDatasetFields(): any[] | null {
        return this.data?.child_data_by_table?.['dataset_field'] || null;
    }

    private createWidthSettingsFromDatasetFields(dataset_fields: any[]): WidthSetting[] {
        return dataset_fields
            .map(dataset_field => {
                const raw_data = dataset_field['_raw_data'];
                // Only process dataset fields that have a valid 'id'.
                // Entries without an 'id' are filtered out because width settings must be associated with a unique field identifier.
                // This ensures that only valid, identifiable fields are included in the width settings.
                if (!raw_data?.id) {
                    return null;
                }

                const field_name = `field__${raw_data.id}`;
                const width = raw_data['option']?.['list_th_width'];
                const width_value = width ? `${width}px` : '';

                return {
                    field: field_name,
                    current_width: width_value
                };
            })
            .filter(setting => setting !== null && setting.current_width !== '');
    }

    private getExistingWidthSettings(): WidthSetting[] {
        try {
            const stored = localStorage.getItem(this.WIDTH_SETTING_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to parse existing width settings:', error);
            return [];
        }
    }

    private mergeWidthSettings(existing_settings: WidthSetting[], new_settings: WidthSetting[]): WidthSetting[] {
        const new_field_names = new_settings.map(setting => setting.field);
        const filtered_existing_settings = existing_settings.filter(
            setting => !new_field_names.includes(setting.field)
        );

        return [...filtered_existing_settings, ...new_settings];
    }

    private saveWidthSettings(settings: WidthSetting[]): void {
        try {
            localStorage.setItem(this.WIDTH_SETTING_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save width settings to localStorage:', error);
        }
    }

    post(url: string) {
        if (this.is_dataset_edit) {
            this.loading = true;
            this.beforeCustomDatasetPost()
        }

        // if (this.table == 'grant_group' && this.data.raw_data['everyone'] == 'false') {
        //     const grantGroupAdminIdsMulti = (this.data.child_data_by_table as any).grant_group_admin_ids_multi;
        //     const grantGroupDivisionIdsMulti = (this.data.child_data_by_table as any).grant_group_division_ids_multi;
        //     if (grantGroupAdminIdsMulti.length == 0 && grantGroupDivisionIdsMulti.length == 0) {
        //         this.toasterService.error('ユーザーか組織を選択してください', 'エラー')
        //         return;

        //     }
        // }
        this.cancelOnEditRequests()
        this.EditModal.hide();
        this.sending = true;

        this.toasterService.clear();

        if (this.IS_EMBED_MODE) {
            // #delete child elements of #toast-container
            const toastContainer = document.getElementById('toast-container');
            if (toastContainer) {
                while (toastContainer.firstChild) {
                    toastContainer.removeChild(toastContainer.firstChild);
                }
            }
        }

        console.log(this.data)
        let formData = this.getPostFormdata();
        if (this.apply_workflow_flg && this.workflow && this.workflow.isSetWorkflow()) {
            formData.append('workflow_json', JSON.stringify(this.workflow.toArray(this._share.getMainDivisionId())));
            formData.append('workflow_comment', this.workflow_comment ? this.workflow_comment : '');
            formData.append('workflow_main_division_id', this.workflow_main_division_id ? this.workflow_main_division_id : '');
            this.workflow.workflow_path_a
        }
        if (this.is_draft_save && this.table_info.menu.is_workflow) {
            formData.append('is_draft', 'true');
        }
        if (this.table_info.menu.popup_comment_after_save) {
            formData.append('comment', this.comment ? this.comment : '');
        }

        if (this.table_info.table === 'dataset') {
            if (this.workflow_template_a) {
                let workflow_template_hash_a = []
                this.workflow_template_a.forEach((workflowTemplate => {
                    workflow_template_hash_a.push(workflowTemplate.toArray())
                }));
                formData.append('workflow_template_a_json', JSON.stringify(workflow_template_hash_a));
            }
            if(this.workflow_template_csv) {
                formData.append('workflow_template_csv', this.workflow_template_csv, this.workflow_template_csv.name);
            }
        }

        if (this.IS_IFRAME_MODE) {
            formData.append('table', this.table);
            if (this.filter_id) {
                formData.append('filter_id', this.filter_id.toString());
            }
            formData.append('hash', this.public_form_hash);
            if (this.public_form_rid) {
                formData.append('rid', this.public_form_rid.toString());
            }
        }

        if (this.ref) {
            formData.append('ref', this.ref);
        }

        //追加のパラメータ
        Object.keys(this._add_post_params).forEach(_key => {
            formData.append(_key, this._add_post_params[_key])
        })

        if(this.sendMailFlg){
            formData.append('send_mail_flg', this.sendMailFlg.toString());
        }

        this._connect.postUpload(url, formData).subscribe(
            (jsonData) => {
                if (this.IS_PUBLIC_FORM) {
                    this.publicFormConfirmModal.hide();
                }
                // console.log(jsonData);
                if (jsonData['result'] === 'success' && jsonData['id']) {
                    this.updateWidthSetting();
                    this.is_finish_edit = true;
                    this.id = jsonData['id']
                    if (this.IS_IFRAME_MODE) {
                        this.full_display_message = this.table_info.menu.public_form_sent_text ?? '送信が完了しました。'
                        window.parent.postMessage({'mode': 'scroll_to_top'}, '*');
                        this.fitIframeHeight();
                        return;
                    }
                    if (this.isDatasetEdit() || this.isPositionOrDivisionEdit()) {
                        this._share.resetTableInfoCache()
                    } else {
                        this._share.resetTableFormOptionListCache()
                    }
                    if (this.IS_EMBED_MODE) {

                        this.onSubmit.emit({
                            'id': this.id
                        })
                        this.sending = false;
                        return;
                    }
                    if (this.table == 'admin_setting'){
                        this._share.updateToastrSetting(formData.get('not_close_toastr_auto'))
                        //load adminDatas after setting update
                        this._share.loadAdminDatas();
                    }
                    if (this.is_setting || !this.grant.list) {
                        this.toasterService.success('データの編集が完了しました。', '成功');
                        this.sending = false;
                        if (this.table === 'dataset') {
                            if (this._share.prev_page) {
                                this._router.navigate([this._share.prev_page.split('/')]);
                            } else {
                                this._router.navigate([this._share.getAdminTable(), 'dataset__' + jsonData['id']]);
                            }

                        }
                    } else {
                        const goNext = () => {
                            if (this.table_info.menu.is_onlyone) {
                                this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.id]);
                            } else if (this.table_info.table === 'dataset_group') {
                                //reload admin datas when dataset group is updated
                                this._share.loadAdminDatas().then(() => {
                                    this._router.navigate([this._share.getAdminTable(), 'dataset']);
                                });

                            } else {
                                if (this.is_dataset_edit && this._share.prev_page) {
                                    this._router.navigate(this._share.prev_page.split('/'));
                                } else {
                                    if (this.is_dataset_edit && !this.isEditSystemTable()) {
                                        this._router.navigate([this._share.getAdminTable(), 'dataset__' + this.id]);
                                    } else {
                                        //change navigate array
                                        let url = decodeURIComponent(this.return_url)
                                        let url_a = url.split(';')
                                        url = url_a[0]
                                        //remove first string
                                        if (url.indexOf('/') === 0) {
                                            url = url.substr(1)
                                        }
                                        let navi_a = (url).split('/')
                                        let paramHash = {}
                                        for (let i = 1; i < url_a.length; i++) {
                                            let params = url_a[i].split('=')
                                            paramHash[params[0]] = params[1]
                                        }
                                        // @ts-ignore
                                        navi_a.push(paramHash)

                                        let parameterObj = {};
                                        if (this._route.queryParams['value']['year_calendar'] != undefined) {
                                            let year_calendar = this._route.queryParams['value']['year_calendar'];
                                            let month_calendar = this._route.queryParams['value']['month_calendar'];
                                            let date_calendar = this._route.queryParams['value']['date_calendar'];
                                            // let date_value = new Date(year_calendar, month_calendar - 1, date_calendar);
                                            parameterObj['queryParams'] = {
                                                registeredDate: year_calendar + '-' + month_calendar + '-' + date_calendar,
                                            };
                                        }
                                        this._router.navigate(this.return_url ? navi_a : [this._share.getAdminTable(), this.table], parameterObj);
                                    }
                                }
                            }
                        }

                        if (this.isDatasetEdit()) {
                            this._share.loadAdminDatas().then(() => {
                                goNext()
                            });
                        } else {
                            goNext();
                        }
                    }
                } else {
                    this.sending = false;
                    if (jsonData['error_a']) {
                        this.error_a = jsonData['error_a']
                        console.log(this.error_a)
                        this.showError(jsonData['error_a']);
                    } else {
                        this.toasterService.error('エラーが発生しました。', 'エラー')
                    }
                    scrollTo(0, 0);
                }
            },
            (error) => {
                if(error.status == '403'){
                    this.toasterService.error('サーバーにアクセス拒否されました', 'エラー')
                }

                if (this.IS_PUBLIC_FORM) {
                    this.publicFormConfirmModal.hide();
                }
                try {
                    console.error(JSON.stringify(error))
                } catch (e) {
                }
                this.sending = false;
                this.loading = false;
                this.error_a = error['error']['error_a']
                this.showError(error['error']['error_a']);
                if (this.is_dataset_edit) {
                    this.setFormByOriginalData()
                }

                if (this.IS_IFRAME_MODE) {
                    window.parent.postMessage({'mode': 'scroll_to_top'}, '*');
                    this.fitIframeHeight()
                }
            }
        );
    }


    showError(error_a) {
        try {
            //Start Scroll to errors first field
            if(typeof error_a === "object"){
                let errors = Object.keys(error_a),
                    scrollToFirstEle = document.querySelector(`.wrap-field-${errors['0']}`);
                if(scrollToFirstEle)scrollToFirstEle.parentElement.scrollIntoView()
            }
            //End Scroll to errors first field

            let body = this._share.getErrorBodyByResponse(error_a, this.data.child_a, this.child_error_a_by_table);

            this.toasterService.error(body, 'エラー');
        } catch (e) {
            console.log(error_a)
            this.toasterService.error('不明なエラーが発生しました.', 'エラー');


        }
    }

    setChildFieldForms(reset: boolean = false) {
        this.field_reloading = true;
        const pre_data_a = this.data.child_data_by_table['dataset_field'];
        const pre_field_a = pre_data_a?.map(data => {
            return data['field'];
        });
        const current_field_a = [];
        if (!this.data.child_data_by_table['dataset_field'] || reset) {
            this.data.child_data_by_table['dataset_field'] = [];
        }
        this._connect.get('/admin/table/raw-info/' + this.data['table']).subscribe((data) => {
            data.fields?.forEach((field) => {
                current_field_a.push(field.Field);
                const pre_order = pre_field_a.indexOf(field.Field);
                let new_data;
                const form = this.forms.byFieldName(field.Field);
                if (pre_order !== -1) {
                    // tslint:disable-next-line:no-shadowed-variable
                    new_data = pre_data_a.filter((data) => {
                        return data.field === field.Field
                    })[0]
                } else {
                    new_data = this.addChildData(this.data.child_a[0], false);
                    new_data['option'] = {'show-list': 'true', 'editable': 'true', 'sort-field': 'id', 'sort-order': 'desc'};
                    new_data['type'] = form.type;
                    new_data['name'] = field.Field
                }
                new_data['field'] = field.Field

                if (field.is_autoincrement) {
                    new_data['use'] = 'false';
                    new_data['__disabled'] = true;
                }

                if (new_data['type'] === 'select') {
                    new_data['option']['items'] = form.option.filter((val) => {
                        return val.value !== '';
                    })
                }
            })
            // 存在しない項目の削除
            const removed_field_a = pre_field_a?.filter((pre_field) => {
                return current_field_a.indexOf(pre_field) === -1;
            })

            removed_field_a?.forEach((field) => {
                this.data.child_data_by_table['dataset_field']?.forEach((c_data, i) => {
                    if (c_data['field'] === field) {
                        this.data.child_data_by_table['dataset_field'].splice(i, 1);
                    }
                })
            });

            this.field_reloading = false;
        })
    }

    reloadField() {
        this.setChildFieldForms()

    }


    getThis() {
        return this;
    }

    private setFormByOriginalData() {

        console.log(this.fields)
        this.fields = [this.table_info.forms.byFieldName('grant_type').field]


    }

    private convertChildDataToFields() {
        // debugger;
        console.log('method_convertchilddatatofields')
        let temp_fields: Array<Field> = [];
        this.converted_forms = new Forms({});
        if (this.data.child_data_by_table['dataset_field'] == undefined) {
            this.datasetFieldCountByType = {};
            this.data.child_data_by_table['dataset_field'] = []
        }

        this.data.getChildDataAry('dataset_field').forEach((data: Data, i) => {
            // console.log(data)
            let data_raw = data.raw_data;
            if (!data_raw) {
                data.setInstanceData({})
                data_raw = {};
            }
            let uniq_id = 'dummy_field' + i;
            if (data_raw['id'] !== undefined) {
                uniq_id = 'field__' + data_raw['id'];
            } else {
                data_raw['dummy_id'] = uniq_id
            }
            const field = new Field({
                Field: uniq_id,
                Comment: data_raw['name'],
                editable: true,
                fixed_value: data_raw['option'].value,
                x: data_raw['edit_component_x_order'] != undefined ? data_raw['edit_component_x_order'] : '1',
                y: data_raw['edit_component_y_order'] != undefined ? data_raw['edit_component_y_order'] : i + 1,
                only_add: false,
                Default: (data_raw['option'].value !== '' && data_raw['option'].value !== undefined)
                    ? data_raw['option'].value : data_raw['option'].default
            });
            data_raw['option']['show-in-detail'] = data_raw['option']['show-in-detail'] ?? true;
            const form = cloneDeep(data_raw);
            Object.keys(data_raw['option']).forEach(opkey => {
                form[opkey] = data_raw['option'][opkey];
            })
            form['']
            form['option'] = [];
            form.label = form.name;
            // layout default value horizontal, purpose for no-exist option layout
            if (['checkbox', 'radio'].indexOf(data_raw['type']) >= 0) {
                form.layout = data_raw['option']['layout'] ?? 'horizontal';
            }
            // type option
            if (['checkbox', 'radio', 'select'].indexOf(data_raw['type']) >= 0) {
                if (data_raw['option']['items'] !== undefined) {
                    let _items = data_raw['option']['items'];
                    //if string split
                    if (typeof _items === 'string') {
                        _items = _items.replace(/[\r\n]/g, ',');
                        _items = _items.split(',');
                    }
                    _items.forEach((item) => {
                        form['option'].push({'label': item, 'value': item})
                    })
                }
            }


            let _form = new Form(form)
            _form.createDummyForm('field__' + form['id'])
            this.converted_forms.add(uniq_id, _form)
            temp_fields.push(field)
        });

        let group_fields = [];
        temp_fields.forEach(field => {
            if (group_fields.length === 0) {
                group_fields.push([field]);
            } else {
                this.groupService.groupByAxis(group_fields, field)

            }
            if (this.converted_forms.byFieldName(field.Field).type === 'richtext') {
                this.setFroalaOptions(this.converted_forms, field);
            }
        });
        if (group_fields.length > 1) {
            this.sortingService.selectionSort(group_fields, 0, 'y');
        }

        this.normalizeFieldCoordinates(group_fields);

        let total_items = temp_fields.length;
        this.converted_fields = group_fields;

        if (this.converted_fields.length > 1 || total_items > 1) {
            for (let i = 0; i < (this.converted_fields.length * 2) / 2; i += 2) {
                this.converted_fields.splice(i, 0, []);

                this.converted_fields[i + 1].map(column => {
                    column.y = i + 2;
                });
            }
            if (!this.fixedYorder) this.updateRawDataCoordinates(this.converted_fields);

            this.converted_fields.splice(this.converted_fields.length, 0, []);
        } else if(this.converted_fields.length == 1) {
            this.data.child_data_by_table['dataset_field'][0].raw_data['edit_component_y_order'] = 2;
        }

        let xy = [];
        group_fields.map(dataset_field_row => {
            dataset_field_row.map(dataset_field_column => {
                xy.push({
                    'field_id': dataset_field_column.Field.startsWith('field__') ? dataset_field_column.Field.slice(7) : dataset_field_column.Field,
                    'x': dataset_field_column.x,
                    'y': dataset_field_column.y
                })
            })

        })
        this.field_xy = xy;

        this.data.updateLastDirtyChanged()
        //this.data.setDefaultData()
    }


    /**
     * フィールド座標の連続性を保証する
     * Normalize field coordinates to ensure consecutive x,y values
     * @param fields グループ化されたフィールド配列
     */
    normalizeFieldCoordinates(fields) {
        fields.map((row, y_index) => {
            row.map((column, x_index) => {
                if (column.y != y_index + 1) {
                    column.y = y_index + 1;
                }
                if (column.x != x_index + 1) {
                    column.x = x_index + 1;
                }
            });
        });

        this.updateRawDataCoordinates(fields);
    }

    /**
     * 正規化された座標値をデータベースのraw_dataに反映
     * Update raw_data with normalized coordinates
     * @param fields 正規化されたフィールド配列
     */
    private updateRawDataCoordinates(fields) {
        fields.forEach(row => {
            row.forEach(column => {
                const fieldId = column.Field.startsWith('field__')
                    ? column.Field.slice(7)
                    : column.Field;

                // dataset_field内の対応するデータを検索
                const datasetIndex = this.data.child_data_by_table['dataset_field']
                    .findIndex(field => {
                        return field.raw_data.id == fieldId ||
                               field.raw_data.dummy_id == fieldId;
                    });

                if (datasetIndex >= 0) {
                    this.data.child_data_by_table['dataset_field'][datasetIndex]
                        .raw_data['edit_component_x_order'] = column.x;
                    this.data.child_data_by_table['dataset_field'][datasetIndex]
                        .raw_data['edit_component_y_order'] = column.y;
                }
            });
        });
    }


    private beforeCustomDatasetPost() {
        this.fields = this.table_info.fields;
        this.forms = this.table_info.forms;
    }

    /**
     * Dataset Definition Field setting modal
     * @param field
     * @param isNew
     */
    openSettingModal(field = null, isNew: boolean = false) {
        this.settingType = null;
        this.settingTitle = '項目追加';
        this.settingBtnLabel = '追加する';
        this.settingData = new Data(this.data.getChildTableInfoByTable('dataset_field'));
        this.settingData.setInstanceData(
            {
                raw_data: {
                    'type': 'text',
                    'option': {
                        'show-list': true,
                        'editable': true
                    },
                    'unique_key_name': uuidv4()
                }
            }
        );
        this.settingIndex = null;
        this.settingModalIsNew = isNew;
        this.isTableSettingOptionCollapsed = true;
        if (!isNew) {
            this.settingTitle = '項目編集';
            this.settingBtnLabel = '変更する';
            const child_id = field.Field;
            this.data.getChildDataAry('dataset_field').forEach((child, i) => {
                let id = 'field__' + child.raw_data['id'];
                if (child.raw_data['id'] === undefined) {
                    id = child.raw_data['dummy_id'];
                }
                if (id === child_id) {
                    const data = cloneDeep(child);
                    if (!!!data.raw_data['unique_key_name']) {
                        data.raw_data['unique_key_name'] = uuidv4();
                    }
                    this.settingData = data;
                    this.settingIndex = i;
                    console.log(data.raw_data.type)
                    this.settingType = data.raw_data.type in this.settingTypesHash ? this.settingTypesHash[data.raw_data.type] : data.raw_data.type;
                    console.log(this.settingType)
                    return false;
                }
            })
        }
        if(!this.is_drag_field_add){

            if (this.settingData.raw_data['option'] && this.settingData.raw_data['option']['item-table']) {
                this._connect.post('/admin/table/grant/' + this.settingData.raw_data['option']['item-table'], {}).subscribe(
                    (data) => {
                        if (data.view_grant == false) {
                            this.toasterService.error('参照先のテーブルの閲覧権限がありません', 'エラー');
                            return
                        };
                        this._share.loadTableFields(this.settingData.raw_data['option']['item-table'], () => {
                            this.settingModal.show();
                        });
                    }
                )

            } else {
                this.settingModal.show();

            }
        }
    }

    duplicateFieldData(field) {
        const child_id = field.Field;
        this.settingData = new Data(this.data.getChildTableInfoByTable('dataset_field'));
        this.settingIndex = null;
        this.data.getChildDataAry('dataset_field').forEach((child, i) => {
            this.settingData.setInstanceData(
                {
                    raw_data: child.raw_data
                }
            );
            let id = 'field__' + child.raw_data['id'];
            const data = cloneDeep(child);

            if (this.checkDuplicateField(child, id, child_id, data)) {
                //clone field always at the bottom
                const flattenedArray = [].concat(...this.converted_fields);
                const maxY = flattenedArray.reduce((max, obj) => Math.max(max, obj.y || -Infinity), -Infinity);

                data.raw_data['unique_key_name'] = uuidv4();
                data.raw_data['id'] = undefined;
                data.raw_data['name'] = this.getCopyName(data.raw_data['name'], this.data.getChildDataAry('dataset_field'));
                data.raw_data['edit_component_x_order'] = 1;
                data.raw_data['edit_component_y_order'] = maxY + 2; //clone field always at the bottom
                data.raw_data['duplicate_flg'] = true;
                this.settingData = cloneDeep(data);

                this.settingType = data.raw_data.type in this.settingTypesHash ? this.settingTypesHash[data.raw_data.type] : data.raw_data.type;
                this.addFieldData()
            }

        })
    }

    checkDuplicateField(child, id, child_id, data) {

        // 複製した項目の複製
        if(child.raw_data['duplicate_flg'] && data.raw_data['dummy_id'] == child_id){
            return true;
        }

        // 2回複製したときに、2つ複製されることの防止
        if (data.raw_data['duplicate_flg']) return false

        // 既存の項目の複製
        if (id === child_id) {
            return true;
        }

        // 新規項目の複製
        if (child.raw_data['id'] === undefined && child.raw_data['dummy_id'] == child_id) {
            return true
        }

        return false
    }

    getCopyName(originalName, data_a) {
        let copyName = originalName + 'のコピー';
        let counter = 2;
        while (data_a.some(data => data.raw_data['name'] === copyName)) {
            copyName = originalName + 'のコピー' + counter;
            counter++;
        }
        return copyName;
    }

    addFieldDrop(event: CdkDragDrop<string[]>, reorder_x , reorder_y, x_order=null,y_order=null) {

        let item_data = this.addFieldRequiredDummyData(event.item.data);
        if (x_order) item_data.edit_component_x_order = x_order;
        if (y_order) item_data.edit_component_y_order = y_order;
        this.is_drag_field_add = true;
        this.openSettingModal(null, true)
        this.selectFieldType(item_data)
        this.addFieldData(reorder_x,reorder_y)
        this.is_drag_field_add = false;
    }

    isExistFieldSelected() {
        return this.settingData && !!this.settingData.raw_data['id'];
    }

    public datasetFieldCountByType = {};

    selectFieldType(_setting) {
        const setting = cloneDeep(_setting)
        this.settingType = setting.value;
        this.settingData.raw_data['type'] = setting.value;
        if (this.is_drag_field_add){
            //for new fields name

            let fieldTypeCount = 0;
            //set dataset count
            if( this.datasetFieldCountByType[setting.value] != undefined ){
                this.datasetFieldCountByType[setting.value] += 1;
                fieldTypeCount = this.datasetFieldCountByType[setting.value]
            }
            if( this.datasetFieldCountByType[setting.value] == undefined ){

                let filteredFields = this.data.child_data_by_table['dataset_field'].filter(
                    dataset_field => dataset_field.raw_data.type == setting.value
                    // && dataset_field.dummy_id != undefined
                );
                this.datasetFieldCountByType[setting.value] = (filteredFields.length+1);
                fieldTypeCount = this.datasetFieldCountByType[setting.value]
            }
            //skip index 1
            if(fieldTypeCount == 1) fieldTypeCount = 0;

            //check duplicat field name
            let checkDuplicateFieldName = (fieldTypeCount) => {
                let name = fieldTypeCount ? `${setting.label}${fieldTypeCount}` : setting.label;
                let filterNames;
                if(['checkbox','radio','select'].includes(setting.value)){
                    filterNames = this.data.child_data_by_table['dataset_field'].filter(field => ['checkbox', 'radio', 'select'].includes(setting.value) ).filter(field=>field.raw_data.name == name);
                }else{
                    filterNames = this.data.child_data_by_table['dataset_field'].filter(field=>field.raw_data.type == setting.value).filter(field=>field.raw_data.name == name);
                }
                if(filterNames.length){
                    let nextCount = fieldTypeCount + 1;
                    //skip index 1
                    if( nextCount == 1) nextCount = nextCount+1;
                    checkDuplicateFieldName(nextCount);
                }else{
                    this.settingData.raw_data['name'] = name
                }
            }
            checkDuplicateFieldName(fieldTypeCount);
            //set x-y order
            if (setting.edit_component_x_order) this.settingData.raw_data['edit_component_x_order'] = setting.edit_component_x_order;
            if (setting.edit_component_y_order) this.settingData.raw_data['edit_component_y_order'] = setting.edit_component_y_order;
        }
        if (setting.option) {
            this.settingData.raw_data['option'] = setting.option;
        }
    }

    getSettingTypeObj(): Object {

        let _selected_setting_type = null;
        this.settingType = this.settingType in this.settingTypesHash ? this.settingTypesHash[this.settingType] : this.settingType;
        this.settingTypes.forEach(setting => {
            if (setting['value'] === this.settingType) {
                _selected_setting_type = setting;
            }
        })
        if (!_selected_setting_type) {
            console.error('ERROR')
            console.error(this.settingType)
        }
        return _selected_setting_type;
    }

    canConvertField(to_type: string) {
        let preSettingType = this.settingData.raw_data['type'];
        if (!this.convertableTypes[preSettingType]) {
            return false;
        }
        return this.convertableTypes[preSettingType].indexOf(to_type) >= 0
    }

    changeFieldType() {
        this.settingType = null;
    }

    toggleDragFieldList(){
        this.show_drag_field_list = !this.show_drag_field_list;
    }

    addFieldRequiredDummyData(data) {

        if (data.value === 'calc' && !data['option']['expression']) {
            data['option']['expression'] = "{ID}";
        }
        if (data.value === 'relation_table') {
            if (!data['option']['item-table']) {
                data['option']['item-table'] = 'division';
            }
        }
        if (data.value === 'select_other_table') {
            if (!data['option']['item-table']) {
                data['option']['item-table'] = 'division'
                data['option']['label-fields'] = ["id"]
            }
        }
        if (data.value === 'fixed_html') {
            if (!data['option']['fixed_html']) {
                data['option']['fixed_html'] = '<b>固定テキストの例</b>'

            }
        }
        if (data.value === 'boolean') {
            if (!data['option']['boolean-text']) {
                data['option']['boolean-text'] = "Yes / No"
            }
        }
        if (['radio', 'checkbox'].indexOf(data.value) >= 0) {
            if (!data['option']['layout']) {
                data['option']['layout'] = 'horizontal'
            }

        }
        if (['select', 'radio', 'checkbox'].indexOf(data.value) >= 0) {
            if (!data['option']['items'] || data['option']['items'].length == 0) {
                data['option']['items'] = "選択肢 1,選択肢 2";
            }

        }
        return data;
    }

    addFieldData(reorder_x = false, reorder_y = false, setLastYIndex = false) {
        // debugger;
        const data = this.settingData.getCopy();

        // validate
        const error_a = [];
        if (data.raw_data['type'] === null) {
            error_a.push('種類は必須です');
        }
        if (data.raw_data['name'] === '' || data.raw_data['name'] === null || data.raw_data['name'] === undefined || data.raw_data['name'].trim() === '') {
            error_a.push('項目名は必須です');
        }
        if (data.raw_data['type'] === 'calc' && !data.raw_data['option']['expression']) {
            error_a.push('計算式は必須です');

        }
        if (data.raw_data['type'] === 'relation_table') {
            if (!data.raw_data['option']['item-table']) {
                error_a.push('対象テーブルは必須です');

            }

        }
        if (data.raw_data['type'] === 'boolean') {

            if (!data.raw_data['option']['boolean-text'] ||
                data.raw_data['option']['boolean-text'].trim() === '' ||
                data.raw_data['option']['boolean-text'].replace(/[\s　]/g, '') === '') {
                error_a.push('ラベルは必須です');
            }

        }
        if (data.raw_data['type'] === 'select_other_table') {
            if (!data.raw_data['option']['item-table']) {
                error_a.push('対象テーブルは必須です');
            } else {
                if (!data.raw_data['option']) {
                    error_a.push('表示項目を指定して下さい');
                } else if (!data.raw_data['option']['is_child_form']) {
                    if (!data.raw_data['option']['label-fields'][0]) {
                        error_a.push('表示項目を指定して下さい');
                    }
                }
            }
            if (data.raw_data['option']['copy-fields']) {
                data.raw_data['option']['copy-fields'].forEach(copy_field => {
                    if (!copy_field['from']) {
                        error_a.push('コピー元項目は必須です');
                    }
                    if (!copy_field['to']) {
                        error_a.push('コピー先項目は必須です');
                    }
                })

            }
        }
        // Required layout option for checkbox, radio type
        if (['radio', 'checkbox'].indexOf(data.raw_data['type']) >= 0) {
            if (!data.raw_data['option']['layout']) {
                error_a.push('layout is required');
            }

        }
        if (['select', 'radio', 'checkbox'].indexOf(data.raw_data['type']) >= 0) {
            if (!data.raw_data['option']['items'] || data.raw_data['option']['items'].length == 0) {
                error_a.push('選択肢は必須です');
            }

        }
        // 20240419 Kanazawa　追加
        // 固有IDのバリデーション
        if (this.UNIQUE_ID_REGEXP_PATTERN.test(data.raw_data['unique_id'])) {
            // 除外したい文字が含まれるかどうかチェック
            error_a.push(this.UNIQUE_ID_ERROR_MESSAGE);
        }

        /*
        if (!!data['__default_value'] || data['__default_value'] === 0) {
            data['option']['default'] = data['__default_value']
        } else {
            delete data['option']['default'];
        }
        if (!!data['__fixed_value'] || data['__fixed_value'] === 0) {
            data['option']['value'] = data['__fixed_value']
        } else {
            delete data['option']['value'];
        }
         */


        if (error_a.length > 0) {
            this.toasterService.clear();
            this.toasterService.error(error_a.join(','), 'エラー');

            return
        }

        //from form 削除
        if (data.raw_data['option']['copy-fields']) {
            data.raw_data['option']['copy-fields'].forEach(copy_field => {
                delete copy_field['from_form'];
                //copy_field['to'] = 'field__'+copy_field['to']
            })

        }



        if (!data.raw_data['edit_component_x_order']) {
            let lastFields = this.data.getChildDataAry('dataset_field')[this.data.getChildDataAry('dataset_field').length - 1];
            data.raw_data['edit_component_x_order'] = 1;
            data.raw_data['edit_component_y_order'] = lastFields ? lastFields.raw_data['edit_component_y_order'] + 2 : 2;
        }

        if (data.raw_data['option']['condition_a']) {
            data.setCondtionsByOption()
        }
        this.settingModal.hide();


        this.settingData.setInstanceData({
            raw_data: {'option': {}}
        })

        if (setLastYIndex && this.settingIndex === null) {
            data.raw_data['edit_component_y_order'] = this.converted_fields.length;
        }

        if (this.settingIndex !== null) {
            this.data.child_data_by_table['dataset_field'][this.settingIndex] = data;
        } else {
            this.data.child_data_by_table['dataset_field'].push(data);
        }

        //reorder_x base on y order
        if (reorder_x){
            this.data.child_data_by_table['dataset_field']
            .filter(field => field.raw_data['edit_component_y_order'] == data.raw_data['edit_component_y_order'])
            .map((field,i)=>{
                if (field.raw_data['unique_key_name'] != data.raw_data['unique_key_name']) {
                    field.raw_data['edit_component_x_order'] = field.raw_data['edit_component_x_order'] + 1;
                }
            });
        }

        if (reorder_y){
            this.data.child_data_by_table['dataset_field'].forEach(field=>{
                if (field.raw_data['unique_key_name'] != data.raw_data['unique_key_name'] && field.raw_data['edit_component_y_order'] >= data.raw_data['edit_component_y_order']){
                    field.raw_data['edit_component_y_order'] = field.raw_data['edit_component_y_order'] + 2;
                }
            })
        }
        this.convertChildDataToFields()
        console.log(this.fields)

    }

    updateFieldYorder(field,y_order){
        let dataset_fields = this.data.child_data_by_table['dataset_field'];
        let index = dataset_fields.findIndex(dataset_field => field.Field == 'field__' + dataset_field.raw_data.id || field.Field == dataset_field.raw_data.dummy_id)
        dataset_fields[index].raw_data['edit_component_y_order'] = y_order;
        this.convertChildDataToFields()
    }
    // データ定義の項目削除
    deleteFieldData(field) {
        let dataset_fields = this.data.child_data_by_table['dataset_field'];

        let index = dataset_fields.findIndex(dataset_field => field.Field == 'field__' + dataset_field.raw_data.id || field.Field == dataset_field.raw_data.dummy_id)

        dataset_fields.splice(index, 1);
        //reindex y order
        this.fixedYorder = false;
        this.convertChildDataToFields()
    }

    // データ定義の項目順番変更
    swapFieldData(from_index: number, to_index: number) {
        this.data.changeChildIndex('dataset_field', from_index, to_index)
        this.convertChildDataToFields()
    }

    moveFieldData(moved_field_obj) {
        this.field_xy = this.data.moveChildIndex('dataset_field', 0, 0, moved_field_obj);
        this.convertChildDataToFields();
    }

    isFormStyle() {
        return !this.table_info || !this.table_info.menu.style || this.table_info.menu.style == 'form' || this.is_dataset_edit;
    }

    isQuestionnaireStyle() {
        return !this.isFormStyle();
    }

    goList() {
        this._router.navigate([this._share.getAdminTable(), this.table]);
    }

    /**
     * WORKFLOW
     */
    workflow_apply_start() {
        if (!this.validate()) {
            return;
        }
        this.loadPostFormData()
        this.WorflowModal.show();

    }

    isWorkflowApplyAvailable() {
        return this.table_info.menu.is_workflow && ['rejected', 'done'].indexOf(this.workflow.status) <= 0;
    }

    closeWorkflow() {
        this.WorflowModal.hide();
    }

    closeCommentModal() {
        this.CommentModal.hide();
    }

    public workflow_comment: string = null;
    public workflow_main_division_id: string = null;

    workflowChanged($event) {
        this.workflow = $event.workflow;
        this.workflow_comment = $event.workflow_comment;
        this.workflow_main_division_id = $event.workflow_main_division_id;
    }

    /**
     * COMMENT
     */

    private comment: string = null;

    commentChanged($event) {
        this.comment = $event.comment;

    }


    onChangeGrant($event) {
        this.data.setRawData({'everyone_grant_json': $event.grant_value});
    }


    /**
     * IFRAME FUNC
     */
    fitIframeHeight() {
        setTimeout(() => {
            window.parent.postMessage({'mode': 'style', 'style': {height: (document.getElementById('pc-edit-view').offsetHeight + 100) + 'px'}}, '*');
        }, 500);
    }


    /**
     * フィルタ系
     */

    public customFilter: CustomFilter;
    public userTableSetting: UserTableSetting = null;

    resetFilter() {
        this.userTableSetting.filter_id = null;
        this.customFilter = null;

    }

    selectFilter($event) {
        this.customFilter = $event.filter
        this.userTableSetting.filter_id = this.customFilter.id

    }


    private setFilter(filter_id) {
        this.table_info.saved_filters.forEach(_filter => {
            if (_filter['id'] == filter_id && _filter.edit_use_show_fields) {
                this.userTableSetting.filter_id = filter_id
                if (!this.customFilter) {
                    //const params = JSON.parse(_filter['params_json'])
                    this.customFilter = cloneDeep(_filter)
                    //FIXME: 後でasyncにする
                    this.customFilter.conditions.reloadViewValuesTmp(this.table_info, this._connect, this._share)
                }
            }
        })

    }

    hasEditFilter() {
        if (!this.table_info) {
            return [];
        }
        return this.table_info.saved_filters.find(_filter => {
            return _filter.edit_use_show_fields
        })
    }

    changed() {
        console.log('changed!!!')
        console.log(this.data.raw_data)
        this.is_edited = true

        if(this.googleCalendars){
            // 素早く変更されたら追いつかないので少し待つ
            setTimeout(() => {
                this.googleCalendars.forEach(calendar => {
                    calendar.checkAndLoadGoogleCalendarEvents();
                });
            }, 500);
        }
    }


    isDatasetOrGroupEdit(): boolean {
        return ['dataset', 'dataset_group'].indexOf(this.table) >= 0
    }

    isFieldEditMode(): boolean {
        return this.is_dataset_edit && this.dataset_edit_mode == 'dataset_field';

    }

    isDisplayChild(child_i: number, child: TableInfo): boolean {
        return child.is_child_form &&
            (
                (
                    this.isDatasetOrGroupEdit() &&
                    (
                        (
                            child_i != 0 &&
                            this.dataset_edit_mode == 'grant'
                        ) ||
                        !this.is_dataset_edit
                    ) &&
                    this.mode != 'add' &&
                    this.data.raw_data['grant_type'] == 'custom'
                ) ||
                (!this.isDatasetOrGroupEdit() && child.table && this.table_info.grant.isEditableField(child.getBaseFieldNameIfChild(this.table_info.table)))
            )
    }

    isChildTableHandledByFormField(child: TableInfo): boolean {
        // Check if this child table is configured as a form field with is_child_form flag
        // This prevents duplicate rendering when a child table is handled by ChildFormsComponent
        if (!this.forms || !child.table) {
            return false;
        }

        // Look through all form fields to see if any reference this child table
        for (let field of this.table_info.fields) {
            const form = this.forms.byFieldName(field.Field);
            if (form && 
                form.original_type === 'select_other_table' && 
                form.custom_field && 
                form.custom_field['is_child_form'] === true && 
                form.custom_field['item-table'] === child.table) {
                return true;
            }
        }
        return false;
    }

    canAddChildData(child: TableInfo): boolean {
        const form = this.forms.byFieldName(child.pf)
        const child_tabels_count = this.data.child_data_by_table[child.table] ? this.data.child_data_by_table[child.table].length : 0;
        if (!form) {
            return true;
        }

        if (!form.max_child_number) {
            return true;
        }

        return form.max_child_number > child_tabels_count;
    }


    onLoadReflectForms($event) {
        console.log('onloadreflect')
        this.loading_reflect_forms = false;
        this.data.updateLastDirtyChanged()
    }

    onEditFilter($event) {
        console.log('on edi filter')
        this._router.navigate([this._share.getAdminTable(), this.table, {'_edit_filter_id': this.customFilter.id, 'filter_ac': 'edit'}]);
    }

    onDeleteFilter($event) {
        console.log('on edi filter')
        this._router.navigate([this._share.getAdminTable(), this.table, {'_edit_filter_id': this.customFilter.id, 'filter_ac': 'delete'}]);
    }

    onMapLocationSelect(location: {lat: number, lng: number}) {
        if (!this.table_info || !this.data) return;

        const latField = this.table_info.menu.getGoogleMapLatField();
        const lngField = this.table_info.menu.getGoogleMapLngField();

        if (latField && lngField) {
            console.log('緯度経度を更新:', location);

            // 緯度経度フィールドが存在する場合、値を設定
            const updHash = {
                [latField]: location.lat.toString(),
                [lngField]: location.lng.toString()
            };
            this.data.setRawData(updHash);

            // フォームの値が変更されたことを通知
            this.changed();

            // 成功メッセージを表示
            this.toasterService.success('緯度経度情報をフォームに反映しました', '位置情報更新');

            // フォームを再読み込みして確実に反映させる
            setTimeout(() => {
                this.reloadField();
            }, 100);
        }
    }

    getFieldListsCss(){
        if ( !this.show_drag_field_list && this.isFieldEditMode() && this.isDesktop ){
            return {'flex': '0 0 96.5%','max-width':'96.5%','padding-right':'0px'};
        }
        return "";
    }
    getSidebarFieldListsCss(){
        if ( !this.show_drag_field_list && this.isFieldEditMode() && this.isDesktop ){
            return {'flex': '0 0 3.5%','max-width':'3.5%'};
        }
        return "";
    }

    isEmptyObj(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }


    isUnionMode(): boolean {
        return this.data && this.data.raw_data && this.data.raw_data['union_mode'] == 'true'
    }

    // 子テーブルのCSV読み込み
    onCsvFileSelected(event: any, child: TableInfo) {
        const file: File = event.target.files[0];
        if (file) {
            this.readCsvFile(file,child);
        }
    }

    // 子テーブルのCSV読み込み
    readCsvFile(file: File, child: TableInfo) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const contents = e.target.result;
            this.toasterService.success('CSVファイルのインポートを開始しました', '成功');
            this.processCsvContents(contents, child);
        };
        reader.readAsText(file);
    }

    async processCsvContents(contents: string, child: TableInfo) {
        const lines = contents.split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            if (values.length === headers.length) {
                const entry = {};
                for (let j = 0; j < headers.length; j++) {
                    entry[headers[j].trim()] = values[j];
                }
                data.push(entry);
            }
        }

        const replacedHeaders = headers.filter(header => {
            return Object.keys(child.forms.forms).some(key => child.forms.forms[key].custom_field && child.forms.forms[key].custom_field['label'] === header);
        }).map(header => {
            const matchingForm = Object.keys(child.forms.forms).find(key => child.forms.forms[key].custom_field && child.forms.forms[key].custom_field['label'] === header);
            return child.forms.forms[matchingForm].custom_field['field'];
        });

        const processItem = async (item) => {
            const newItem = {};
            for (const key of Object.keys(item)) {
                const matchingForm = Object.keys(child.forms.forms).find(formKey => child.forms.forms[formKey].custom_field && child.forms.forms[formKey].custom_field['label'] === key);
                if (matchingForm) {
                    let value = item[key];
                    let is_multi = false;
                    if (child.forms.forms[matchingForm].custom_field['type'] == 'boolean') {
                        value = item[key] ? 'true' : 'false';
                    } else if (child.forms.forms[matchingForm].custom_field['type'] == 'year_month') {
                        // 年月の形式を変換
                        const parts = item[key].split('年');
                        if (parts.length === 2) {
                            const year = parts[0].trim();
                            const month = parts[1].replace('月', '').trim().padStart(2, '0');
                            value = `${year}-${month}-01`;
                        }
                    } else if (child.forms.forms[matchingForm].custom_field['type'] == 'select_other_table') {
                        value = await new Promise((resolve) => {
                            child.forms.forms[matchingForm].getSelectOptions(child, this._connect).subscribe(option_items => {
                                let selected = option_items.filter(option_item => {
                                    return option_item.view_label == item[key];
                                });
                                resolve(selected[0]?._value || '');
                            });
                        });
                    } else if (child.forms.forms[matchingForm].is_multi_value_mode) {
                        value = this.parseCsvLine(item[key])
                        is_multi = true;
                    }
                    const newKey = child.forms.forms[matchingForm].custom_field['field'];
                    if (is_multi) {
                        newItem[child.table + '_' + newKey + '_multi'] = value;
                    } else {
                        newItem[newKey] = value;
                    }
                }
            }
            return newItem;
        };

        const replacedData_a = await Promise.all(data.map(processItem));

        // 既存の子データをすべて削除
        if (this.data.child_data_by_table[child.table] && this.data.child_data_by_table[child.table].length > 0) {
            while (this.data.child_data_by_table[child.table].length > 0) {
                this.deleteChild(child, 0);
            }
        }
        replacedData_a.forEach((replacedData, raw_index) => {
            this.data.setChildData(child, replacedData);
            Object.keys(replacedData).forEach(table_name => {
                if (table_name.endsWith('_multi')) {
                    replacedData[table_name].forEach((value, index) => {
                        this.data.child_data_by_table[child.table][raw_index].setChildData(child.getChildTableInfo(table_name), { 'value': value }, index);
                    });
                }
            });
        });

        this.toasterService.success('CSVファイルが正常に読み込まれました。', '成功');
    }

    // 子テーブルのCSV読み込み
    parseCsvLine(line: string): string[] {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current) {
            result.push(current.trim());
        }
        return result.map(value => value.replace(/^"|"$/g, ''));
    }

    onDetailSettingsClick() {
        this.showDetailSettings = true;
    }


    isDatasetTable(table: string): boolean {
        return table.match(/^dataset_+d$/) !== null;
    }

    /**
     * フィールド名が重複している場合に一意の名前を生成する
     * Generate a unique field name if the name already exists
     * @param originalName 元のフィールド名
     * @param existingFields 既存のフィールド配列
     * @returns 一意のフィールド名
     */
    getUniqueFieldName(originalName: string, existingFields: any[]): string {
        if (!existingFields.some(field => field.raw_data.name === originalName)) {
            return originalName;
        }

        let counter = 2;
        let uniqueName = `${originalName}${counter}`;

        while (existingFields.some(field => field.raw_data.name === uniqueName)) {
            counter++;
            uniqueName = `${originalName}${counter}`;
        }

        return uniqueName;
    }

    /**
     * AIチャットボットからのフィールド編集結果を処理
     * Chat-table-edit-by-aiのAPIレスポンスを受けて、実際にデータセットのフィールド定義を変更・追加する
     *
     * @param response AIからのレスポンスデータ（chat-bot.component.tsのhandleButtonClickから呼ばれる）
     */
    handleFieldEditFromAi(response: any): void {
        // レスポンスデータの基本的な検証
        if (!response || !response.data || !response.data.fields || !response.data.fields.length) {
            this.toasterService.error('AIからの応答形式が不正です', 'エラー');
            return;
        }

        // dataset_fieldテーブルの情報を取得（フィールド定義を格納するテーブル）
        const fieldTableInfo = this.data.getChildTableInfoByTable('dataset_field');
        if (!fieldTableInfo) {
            this.toasterService.error('データセットフィールドのテーブル情報が見つかりません', 'エラー');
            return;
        }

        // 更新フラグとして現在の既存フィールド一覧を取得
        let hasUpdates = false;
        const existingFields = this.data.child_data_by_table['dataset_field'] || [];

        // AIから返されたフィールド定義を1つずつ処理
        for (const field of response.data.fields) {
            const isCreate = field.type === 'create'; // 新規作成フラグ

            if (isCreate) {
                // === 新規フィールド作成の処理 ===
                // duplicateFieldDataメソッドのコードを参考にsettingDataをセットしてaddFieldDataを使用

                // settingDataを初期化
                this.settingData = new Data(this.data.getChildTableInfoByTable('dataset_field'));
                this.settingIndex = null;

                // 新規作成時はIDを空にする
                field.field_hash.id = undefined;

                // unique_idは自動生成されるため削除
                if (field.field_hash.unique_id) {
                    delete field.field_hash.unique_id;
                }

                // フィールド名の重複チェックと自動調整
                field.field_hash.name = this.getUniqueFieldName(field.field_hash.name, existingFields);

                // X座標（横位置）の設定・検証（1-4の範囲内）
                if (!field.field_hash.edit_component_x_order) {
                    field.field_hash.edit_component_x_order = 1; // デフォルトは左端
                } else {
                    const xOrder = parseInt(field.field_hash.edit_component_x_order.toString(), 10);
                    if (xOrder < 1 || xOrder > 4) {
                        field.field_hash.edit_component_x_order = xOrder < 1 ? 1 : 4;
                    }
                }

                // Y座標（縦位置）の設定 - 指定がない場合は末尾に配置
                if (!field.field_hash.edit_component_y_order) {
                    const flattenedArray = [].concat(...this.converted_fields);
                    const maxY = flattenedArray.reduce((max, obj) => Math.max(max, obj.y || -Infinity), -Infinity);
                    field.field_hash.edit_component_y_order = maxY + 2; // フィールドは常に最下部に追加
                }

                // unique_key_nameを自動生成
                field.field_hash.unique_key_name = uuidv4();

                // settingDataにフィールドデータを設定
                this.settingData.setInstanceData({
                    raw_data: field.field_hash
                });

                // settingTypeを設定
                this.settingType = field.field_hash.type in this.settingTypesHash ? this.settingTypesHash[field.field_hash.type] : field.field_hash.type;

                // addFieldDataメソッドを使用してフィールドを追加
                this.addFieldData();

                this.toasterService.success(`フィールド "${field.field_hash.name}" を追加しました`, '成功');
                hasUpdates = true;

            } else {
                // === 既存フィールド更新の処理 ===

                // 既存フィールドをIDで検索
                const fieldIndex = existingFields.findIndex(item =>
                    item.raw_data.id === field.field_hash.id
                );

                if (fieldIndex !== -1) {
                    // 既存フィールドが見つかった場合の更新処理

                    // フィールドタイプの変更チェック（タイプ変更は制限されている）
                    const originalType = existingFields[fieldIndex].raw_data.type;
                    if (field.field_hash.type && field.field_hash.type !== originalType) {
                        this.toasterService.error(
                            `フィールドタイプの変更はできません: ${originalType} → ${field.field_hash.type}`,
                            'エラー'
                        );
                        field.field_hash.type = originalType; // 元のタイプに戻す
                    }

                    // unique_idは自動管理のため削除
                    if (field.field_hash.unique_id) {
                        delete field.field_hash.unique_id;
                    }

                    // 既存データとマージして更新データを作成
                    const updatedData = {
                        ...existingFields[fieldIndex].raw_data,
                        ...field.field_hash
                    };

                    // X座標の検証・調整
                    if (updatedData.edit_component_x_order) {
                        const xOrder = parseInt(updatedData.edit_component_x_order.toString(), 10);
                        if (xOrder < 1 || xOrder > 4) {
                            updatedData.edit_component_x_order = xOrder < 1 ? '1' : '4';
                        }
                    }

                    // Y座標が未設定の場合は既存値を使用
                    if (!updatedData.edit_component_y_order) {
                        updatedData.edit_component_y_order = existingFields[fieldIndex].raw_data.edit_component_y_order || '1';
                    }

                    // 既存フィールドの位置に更新データを設定
                    this.data.setChildData(fieldTableInfo, updatedData, fieldIndex, this._share);
                    this.toasterService.success(`フィールド "${field.field_hash.name}" を更新しました`, '成功');
                    hasUpdates = true;

                } else {
                    // 既存フィールドが見つからない場合はエラー表示のみ
                    this.toasterService.error(`フィールド "${field.field_hash.name}" (ID: ${field.field_hash.id}) が見つかりません`, 'エラー');
                }
            }
        }

        // 更新があった場合の後処理
        if (hasUpdates) {
            // フィールドデータをUI表示用に変換し直す
            this.convertChildDataToFields();
            // 編集フラグを立てる（保存が必要であることを示す）
            this.is_edited = true;
        }
    }
}

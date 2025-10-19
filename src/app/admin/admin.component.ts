import {
    ChangeDetectorRef,
    EventEmitter,
    Component,
    HostListener,
    OnInit,
    Output,
    Renderer2,
    TemplateRef,
    SimpleChanges,
    ViewChild,
    ElementRef,
    OnDestroy,
    ContentChild,
    Input,
    OnChanges
} from '@angular/core';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router, RoutesRecognized} from '@angular/router'
import ToastrService from '../toastr-service-wrapper.service';

import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import {HttpHeaders} from '@angular/common/http';
import * as FileSaver from 'file-saver';
import {interval, Observable, Subscription} from 'rxjs';
import {Grant} from '../class/Grant';
import {TableInfo} from '../class/TableInfo';
import * as cloneDeep from 'lodash/cloneDeep';
import {DataGrant} from '../class/DataGrant';
import {Data} from '../class/Data';
import {Form} from '../class/Form';
import {Condition} from '../class/Condition';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {Variable} from '../class/Filter/Variable';
import {UserTableSetting} from '../class/UserTableSetting';
import {Conditions} from '../class/Conditions';
import {Ledger} from '../class/Ledger';
import {ModalModule, BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {DynamicOverFlowService} from 'app/services/utils/dynamic-overflow';
import {CrossTableHeader} from '../class/CrossTableHeader';
import {filter, pairwise, windowCount} from 'rxjs/operators';
import {RecordListService} from '../services/RecordListService';
import {SortParam} from '../class/Filter/SortParam';
import {FormEditData} from '../class/FormEditData';
import {GoogleMapFilter} from '../class/Filter/GoogleMapFilter';
import {PusherService} from '../service/PusherService';
import {UploadProgressService} from '../service/UploadProgressService';
@Component({
    selector: 'pfc-list',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css'],
})

export class AdminComponent implements OnDestroy, OnChanges {
    private calcTime = performance.now();

    @Input() table: string = null;
    @Input() embedMode: boolean = false;
    @Input() viewDataMode: boolean = false;
    @Input() searchValue: string = null;
    @Input() searchValueLastChanged: Date;
    @Input() lookupformParam: Object;
    @Input() _customFilter: CustomFilter;


    @Output() onSelectData: EventEmitter<any> = new EventEmitter();

    /**
     * FOR VIEW
     */
    public isSummarizeMode = false;
    public fields = [];
    public field: {};


    /**
     * FOR COMPONENT
     */

        // no menu / search result etc

    public hasChildren: boolean;

    private page_title: string;
    public first_loading: boolean;
    public loading: boolean;
    public page: number;
    private per_page: number;
    private numbers: Array<number>;
    private page_changed: boolean = false;

    public data_a: Array<Data> = [];


    //private original_get_params: Object;
    //private search_params: Object;
    //public conditions: Conditions;


    public child_a: Array<any>;
    public child_a_by_id: Object = {};

    public table_info: TableInfo;
    public grant: Grant;

    public total_count: number;

    // ユーザーによって作成されたテーブルか
    public is_custom_dataset: boolean;

    // configファイルから読み込む場合
    private extend_datas: Array<any>;
    private extend_search_forms: Object;

    public checked_id_a: Array<number>;
    public unchecked_id_a: Array<number>;
    public checked_all: boolean = false;
    private csv_load_timer = null;
    private csv_upload_timer;

    private json_load_timer = null;

    public is_use_filter_for_csv_dl = true;
    public expand_email_rows: boolean = false;

    private resetBeforeCsvUpload = 'false';

    private sendMailFlg = "false";

    private delete_table_type = null;



    // for archive_flag type "archive" | "unarchive"
    private archiveFlagType: string = 'archive';
    // for confirm modal body text
    public archiveFlagConfirmText: string = '';
    private showUnarchiveButton: boolean = false;
    private is_group_edit: boolean = false;

    //private isDirty = false;

    public before_html: string;

    public downloading: Object = {};
    public sending = false;
    public isSpecialMenuCollapsed = true;
    public current_url: string;

    // search_logs用
    public search_log_base_fields;
    public search_log_base_forms;


    // summarize & search
    private all_search_text = null;
    public all_searchable_text = true;
    public customFilter: CustomFilter;
    public customView: CustomFilter;

    public all_search_variables: Array<Variable> = [];

    //order
    public isMovable: boolean = false;

    //commit
    public isEditMode = false;
    public to_delete_commit: Array<Number> = [];

    public selectedRowIndex = -1;
    public original_data_a: Data[];

    public value = null;

    // 分析機能
    private analytics_flg = false;

    public freee_auth = null;
    public freee_auth_url = null;
    public table_type = null;

    // 他マスターユーザ認証
    public auth_type = null;
    public master_users = [];
    public auth_master_user = 0;
    private authTimer;
    private auth_id = null;

    //MEMO
    public userTableSetting: UserTableSetting = null;

    public nouse_page: boolean = false;

    // tsvインポート用
    @ViewChild('adminTsvImport') AdminTsvImport: any;
    // jsonインポート用
    @ViewChild('adminJsonImport') AdminJsonImport: any;

    // 帳票用
    @ViewChild('adminLedgerImport') AdminLedgerImport: any;

    @ViewChild('searchInput') searchInputElement: ElementRef;


    //chartModal
    //@ViewChild('chartModal', {static: false}) chartModal: any;
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();

    private toasterService: ToastrService;

    public sort_params: Object = {
        'field': '',
        'asc_desc': ''
    };
    public tutorial_flag;
    public hide_scroll = true;

    public selectedCellId = null;

    public switchGroupEdit = false;
    public reset_tree = false;
    public group_edit_data_a = [];
    public group_edit_data = [];
    public group_sort_data_a = {};
    public click_group: { [group: string]: boolean } = {};

    // カレンダー表示
    public switchCalendarView: boolean = null;

    //クロス集計
    public crossTableHeader: CrossTableHeader = null;

    public searchable: boolean = true;

    public downloadingLedger: boolean = false;

    // delete modal   deleteCheckedConfirmModal
    private modal_data: Array<any>;
    @ViewChild('deleteModal') deleteModal: any;
    @ViewChild('groupDeleteModal') groupDeleteModal: any;
    @ViewChild('masterUserConfirmModal') masterUserConfirmModal: any;
    @ViewChild('copyModal') copyModal: any;
    @ViewChild('exportModal') exportModal: any;
    @ViewChild('exportCheckedConfirmModal') exportCheckedConfirmModal: any;
    @ViewChild('truncateModal') truncateModal: any;
    @ViewChild('chartModal') chartModal: any;
    @ViewChild('chartTitleModal') chartTitleModal: any;
    @ViewChild('deleteFilterModal') deleteFilterModal: any;
    @ViewChild('editFormFieldModal') editFormFieldModal: any;
    @ViewChild('exitEditModeModal') exitEditModeModal: any;
    @ViewChild('cancelEditModeModal') cancelEditModeModal: any;
    @ViewChild('deleteCheckedConfirmModal') deleteCheckedConfirmModal: any;
    @ViewChild('confirmFilterOverwriteModal') confirmFilterOverwriteModal: any;
    @ViewChild('tableSettingModal') tableSettingModal: any;
    @ViewChild('embedModal') embedModal: any;
    @ViewChild('publicFormModal') publicFormModal: any;
    @ViewChild('duplicateModal') duplicateModal: any;
    @ViewChild('unlockModal') unlockModal: any;
    @ViewChild('forceLogoutModal') forceLogoutModal: any;
    @ViewChild('indexWorkflowModal') indexWorkflowModal: any;
    @ViewChild('mailPublicFormModal') mailPublicFormModal: any;
    @ViewChild('editAllModal') editAllModal: any;

    @ViewChild('confirmFilterOverwriteConfirmModal') confirmFilterOverwriteConfirmModal: any;
    @ViewChild('confirmArchiveTableModal') confirmArchiveTableModal: any;
    @ViewChild('viewModal') viewModal: any;
    @ViewChild('jsonExportModal') jsonExportModal: any;

    // csv modal
    public modal_error_title: string;
    public modal_error_message: string;
    public csv: File;
    public json: File;
    // private missing_datasets = [];
    public missing_datasets: Array<string> = [];
    public query_string: string = '';

    public export_ready = false;
    public export_data = false;
    public export_notification = false;
    public export_grant = false;
    public export_filter = false;
    private dataset_view = true;
    public jsonContent: string = '';

    private hasFileField = false;
    @ViewChild('csvModal') csvModal: any;
    @ViewChild('dlCsvModal') dlCsvModal: any;
    @ViewChild('jsonModal') jsonModal: any;
    @ViewChild('inputCsv') inputCsv: any;
    @ViewChild('inputJSON') inputJSON: any;
    @ViewChild('errorModal') errorModal: any;
    @ViewChild('confirmSaveWidthModal') confirmSaveWidthModal: any;
    @ViewChild('exportLedgerAllModal') exportLedgerAllModal: any;
    @ViewChild('exportCheckedLedgerModal') exportCheckedLedgerModal: any;
    @ViewChild('pigeonAiModal') pigeonAiModal: any;
    @ViewChild('openAnalyticsAiModal') openAnalyticsAiModal: any;
    @ViewChild('uploadConfirmModal') uploadConfirmModal: any;


    @ViewChild('stickyTableWrapper') stickyTableWrapper: ElementRef;
    private scrollable: boolean = false;
    public checkPosition: {};
    private previous_url = '';
    private currentUrl = '';

    public formEditData: FormEditData = new FormEditData();
    private emptyObjId = 0;

    private shouldScrollToNewRow = false;

    private original_get_params: Object = {};

    private has_filter_params: boolean = false;

    public selectedData: Data = null;
    public modal_rendered = false;
    private memo_height: number = 0;

    public fileName = '';
    public file: File;
    public mail_public_form_option = {
        'use_data_related_form': true,
    }

    modalRef: BsModalRef;
    config = {
        keyboard: false,
        ignoreBackdropClick: true
    };
    // clear header style header_style_by_field after save width
    public clear_header_style: boolean = false;

    @ViewChild('googleMapViewModal') googleMapViewModal: any;

    public googleMapFilter: GoogleMapFilter = new GoogleMapFilter();
    public skipUploadConfirmation: boolean = false;

    public uploadProgress : number = 0;
    public isUploading : boolean = false;

    public lastProgress: number | null = null;
    public toastActive: boolean = false;  // Flag to track if a toast is currently active
    public toastTimeout: any = null;  // Timeout reference to control debouncing of toasts
    public currentToast: any = null;  // Reference to the current active toast

    constructor(private _router: Router, private _route: ActivatedRoute, public _connect: Connect
        , public _share: SharedService, toasterService: ToastrService, private renderer: Renderer2, public dynamicOverflowService: DynamicOverFlowService, private cdRef: ChangeDetectorRef, private modalService: BsModalService,private pusherService: PusherService,private uploadProgressService: UploadProgressService) {
        //console.time("constructor")
        this.toasterService = toasterService;
        this.per_page = 30;
        this._router.events.pipe(filter((evt: any) => evt instanceof RoutesRecognized), pairwise())
            .subscribe((events: RoutesRecognized[]) => {
                this.previous_url = events[0].urlAfterRedirects
            })


        this._router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                this.fields = this.getViewFields()
            } else if (event instanceof NavigationEnd) {
                this.currentUrl = event.url
                this.scrollable = true
                this.isEditMode = false;
                this.data_a = [];
            }

            document.querySelector('body').classList.add('aside-menu-hidden');

        })

        this.googleMapFilter = new GoogleMapFilter();
    }


    ngOnDestroy(): void {
        console.log('destroy')
        if (this.prePostSubscription) {
            this.prePostSubscription.unsubscribe();
        }

        this.pusherService.cleanup();
        this.crossTableHeader = null;
        this.customFilter = null
        this.customView = null
        this.scrollLeft = 0;
    }

    ngAfterContentChecked() {

    }

    ngAfterViewChecked() {
        if (this.scrollable) {
            if (this.checkPosition && this.stickyTableWrapper) {
                if (Object.keys(this.checkPosition)[0] == this.table) {
                    this.stickyTableWrapper.nativeElement.scrollTo({top: parseInt(this.checkPosition[this.table]), behavior: 'smooth'});
                } else {
                    this.stickyTableWrapper.nativeElement.scrollTo({top: 0, behavior: 'smooth'});
                }
            }
        }

        this._route.queryParams.subscribe(params => {
            if (params.data_id != undefined && params.viewModal != undefined && this.viewModal != undefined && this.modal_rendered == false && !this.embedMode) {
                this.modal_rendered = true;
                this.selectDataById(params.data_id)
            }
        })

    }

    ngAfterViewInit() {
        const viewInitTime = performance.now();
        console.log('View initialized:', viewInitTime, 'ms');
        setTimeout(() => {
            this._route.params.subscribe(params => {
                if (params['action']) {
                    if (params['action'] == 'pigeonAi') {
                        console.log('PIgeonAI SHOW')
                        this.pigeonAiModal.show();
                    }
                }

            });
        }, 1);
    }

    private pageLoadStartTime: number;

    ngOnInit() {
        this.pageLoadStartTime = performance.now();
        console.log('ページロード開始:', this.pageLoadStartTime, 'ms');

        // ページロード時に未完了CSVジョブをチェック
        this.checkPendingCsvJobs();

        this._route.params.subscribe(params => {

            this.stickyTableHeaderLists = ['normal-header'];
            document.querySelector('.app-body').scrollTo(0,0)

            if (this.embedMode && !this.lookupformParam) {
                this.reset(params, !params['reset'], false)
                if (this.searchValue) {
                    this.all_search_text = this.searchValue
                    this.searchAll(null)
                } else if (this.viewDataMode) {
                    this.customFilter = cloneDeep(this._customFilter)
                    this.reloadPageByCustomFilter(this.customFilter, true)

                } else {
                    this.customFilter = null;
                    this.customView = null;
                    this.all_search_text = null;
                    this.reloadPageByCustomFilter(null);
                }
            } else {
                this.reset(params, !params['reset'], true, params['page'] ? true : false)
            }

        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('init')
        this.switchCalendarView = null;

        this.first_loading = false;
        this.customFilter = new CustomFilter();

        this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
            //console.time('end');
            this.hasChildren = this._route.children.length > 0;
            if (!this.hasChildren && !this.loading) {
                // 子コンポーネントから戻ってきたとき
                // this.load(this.page);
            }
        });

        if (this.embedMode && !this._customFilter) {
            if (!this.searchValue) {
                this.customFilter = null;
                this.customView = null
                this.all_search_text = null;
            }
            this.reset()
            if (this.searchValue) {
                this.all_search_text = this.searchValue
                this.searchAll(null)
            }
        }
        console.log("ngOnchange ",this.switchCalendarView)

        /*/_
        this._share.loadAdminDatas().then((data) => {
            this.tutorial_flag = data.tutorial_flag;
        })
         */
        //console.timeEnd('ngOnInit:');


    }

    reset(params = {}, onInit = false, loadList = true, switchPage = false) {
        if (this._share.license !== 'advance' && (this._share.getAdminTable() === params['table'])) {
            // //console.time('nav')
            // this._router.navigate(['dashboard']);
            // return;
        }

        if(this.lookupformParam){
            params = this.lookupformParam
        }
        console.log('CHANGE ROUTE')
        //always uncheck in all checkbox input if checked, when route change
        this.reset_all_checkbox( true );

        this._share.prev_page = location.pathname;
        this.page = (params['page'] !== undefined) ? parseInt(params['page'], 10) : 1;
        this.all_search_text = null;
        if (!this.embedMode) {
            this.table = params['table'].split(';')[0];
        }
        this.extend_search_forms = {};
        this.extend_datas = [];
        this.sort_params = {
            'field': '',
            'asc_desc': ''
        };
        console.log(this.table)
        this.sendMailFlg = this.table === 'admin' || this.table === 'dataset__' + this._share.admin_table_num ? 'true' : 'false';

        this.original_get_params = {}
        this.all_search_variables = [];

        this.checked_id_a = [];
        this.unchecked_id_a = [];
        this.isSpecialMenuCollapsed = true;
        this.has_filter_params = false;
        this.customFilter = null;
        this.customView = null;

        this.hasChildren = this._route.children.length > 0;

        for (const key of Object.keys(params)) {
            if (key !== 'table' && key !== 'parent_table') {
                //FIXME:delete
                this.original_get_params[key] = params[key];
            }
            this.setPageValueByKey(key, params[key]);
        }


        console.log(this.isSummarizeMode)
        this.isSummarizeMode = this.isSummarizeModeFunc()
        console.log(this.isSummarizeMode)

        this.userTableSetting = this._share.getUserTableSetting(this.table)

        this.dynamicOverflowService.accordionChanged(this.userTableSetting.open_memo)

        this.load(this.page, true, false, onInit).then(() => {
            if (!this.customFilter) {
                //フィルタ
                if (params['_filter_id']) {
                    this.userTableSetting.filter_id = params['_filter_id']
                    if (this.page_changed && params['_filter_id'] == this.userTableSetting.tmp_filter?.id ){
                        // ページ変更時にtmp_filterがfilter_idと同じ場合は、tmp_filterを更新しない
                        this.customFilter = this.userTableSetting.tmp_filter;
                    }else {
                    //filter_idは指定しているが、カスタマイズのパラメータの表示にしている時
                    this.setFilter(params['_filter_id']);
                    }

                    this.isSummarizeMode = this.isSummarizeModeFunc()
                    if (params['_filter_edit']) {
                        this.openEditFilterModal(false)
                    }
                } else if (this.userTableSetting.tmp_filter && !this.embedMode) {
                    //set filter when tmp_filter has id
                    let tmp_filter = this.userTableSetting.tmp_filter;
                    this.customFilter = tmp_filter
                } else if (this.userTableSetting.filter_id) {
                    this.setFilter(this.userTableSetting.filter_id);
                }

                //ビュー
                if (params['_view_id']) {
                    this.userTableSetting.view_id = params['_view_id']
                    //filter_idは指定しているが、カスタマイズのパラメータの表示にしている時
                    this.setFilter(params['_view_id'], 'view');
                } else if (this.userTableSetting.view_id) {
                    this.setFilter(this.userTableSetting.view_id, 'view');
                }

            }

            if (this.has_filter_params && this.userTableSetting.view_id){
                if (this.userTableSetting.view_id) {
                    this.setFilter(this.userTableSetting.view_id, 'view');
                }
            }
            if (this.customFilter) {
                this.userTableSetting.tmp_filter = this.customFilter
                this.customFilter.getAllVariables(this._share).subscribe(variables => {
                    this.all_search_variables = variables
                })

                this.customFilter.conditions.condition_a.forEach(condition => {
                    condition.loadExtraDetail(this.table_info, this._share, this._connect)
                })
            }

            if (loadList && (!this.customFilter || !this.customFilter.isChart())) {
                this.loadList(() => {
                    if(switchPage && this.switchCalendarView === false){
                        this.switchCalendarView = false;
                    } else if (this.switchCalendarView === null || (loadList)) {
                        this.switchCalendarView = this.table_info.menu.is_calendar_view_enabled && this.table_info.menu.show_calendar_view_only;
                    } else {
                        this.switchCalendarView = this.switchCalendarView;
                    }
                });
            } else {
                this.setBreadcrumbs();
                this.loading = false
            }

            if (params['filter_ac'] == 'edit') {
                this.openEditFilterModal(false, 'table', params['_filter_type'], true, params['_edit_filter_id'])
            } else if (params['filter_ac'] == 'delete') {
                const filter_id = params['_edit_filter_id']
                let _filter = this.table_info.saved_filters.find(function (_filter) {
                    return _filter.id == filter_id
                })
                this.modalCustomFilter = _filter
                this.deleteFilterModal.show();
            }

            // redirect dashboar page when user.type = user and table='dataset'
            if (this.dataset_view && !this._share.isMasterUser()) {
                this._router.navigate(['admin', 'dashboard']);
            }
            //hide + button of user list page if user_type=user (not "master")
            // if(!this._share.isMasterUser()){
            //     this.grant.add  = false;
            // }
            // to disable "all search text box"," filter", "view filter", "new add noti", when user type is not master in notification page
            if (this.disableIsNotMasterUser()) {

                this.searchable = false;
                this.all_searchable_text = false;

                this.table_info.menu.not_display_filter = true;
                this.table_info.menu.not_display_filter_view = true;

            } else {
                this.searchable = true;
                this.all_searchable_text = true;
            }

            if (!this._share.cloud_setting) {
                // たまにないので、なかったら取得
                this._share.loadAdminDatas().then(() => {
                    this.getFreerAuthUrl()
                });
            } else {
                this.getFreerAuthUrl()
            }
            this.onInitCloud();
            this.page_changed = false;
        });
    }

    private getFreerAuthUrl() {
        if (this._share.useFreee()) {
            const url = this._connect.getApiUrl() + '/admin/freee/check-auth';
            this._connect.get(url).subscribe(
                (jsonData) => {
                    this.freee_auth_url = jsonData['auth_url'];
                    this.freee_auth = jsonData['auth'];
                }
            )
        }
    }

    private setBreadcrumbs(){
        if (this._share.menu_root) {
            //only dataset notfication pages
            let notification_for = this.original_get_params['notification_for'] ?? null;
            const { node, breadcrumbs } = this._share.menu_root.find(notification_for ?? this.table);
            breadcrumbs.shift();
            if (notification_for){
                breadcrumbs.push({ 'name': `${this.table}` });
            }
            this._share.breadcrumbs = breadcrumbs;
        }
    }

    /**
    * キーに対応するページの状態を設定する。
    * @param key - 設定する値のキー
    * @param value - 設定する値
    */
    private setPageValueByKey(key: string, value) {
        switch (key) {
            case '_all':
                this.all_search_text = value;
                break;
            case 'sort_params':
                this.sort_params = JSON.parse(value);
                break;
            case 'filter_params':
                let _filter = new CustomFilter(JSON.parse(value));
                if (_filter.filter_type == 'filter' || _filter.filter_type == 'mix') this.customFilter = _filter;
                if (_filter.filter_type == 'view') this.customView = _filter;
                this.has_filter_params = true;
                break;
            case 'chart_params':
                this.customFilter.setSummarizeParam(JSON.parse(value));
                break;
            case 'condition_json':
                let condition_json = JSON.parse(value);
                if ( condition_json.length &&!this.customFilter ) {
                    this.customFilter = new CustomFilter({'table': this.table});
                    this.customFilter.setAsTable();
                }
                if (condition_json.length) this.customFilter.setSearchParam(condition_json);
                this.has_filter_params = true;
                break;
            case 'simple':
                if (value === 'true') {
                    this.embedMode = true;
                }
                break;
        }
    }

    setDefaultFilter() {
        //Default Filter
        let default_filter: CustomFilter = this.table_info.getDefaultFilter('list', 'filter')

        if (default_filter) {
            this.userTableSetting.filter_id = default_filter.id
        }
        let default_view: CustomFilter = this.table_info.getDefaultFilter('list', 'view')

        if (default_view) {
            this.userTableSetting.view_id = default_view.id
        }
        console.log(default_filter)
    }

    ngDoCheck() {
        this.current_url = this._router.url;
    }

    onInitCloud() {
        //console.time('onInitCloud:');

        if (this._share.is_cloud && this.table === 'pigeon_admin_grant') {
            this.data_a.forEach((data) => {
                if (data['id'] === 1) {
                    data['__disabled'] = true
                }
            })
        }


        //console.timeEnd('onInitCloud:');
    }

    setClasses(): Object {
        let class_hash = {};
        class_hash[this.table_info.getJaClassName()] = true;
        class_hash[this.table_info.getClassName()] = true;
        if (!this.embedMode) {
            class_hash['row'] = true
        }
        return class_hash
    }


    resetUrl() {
        history.replaceState({}, null, document.location.pathname)
    }

    copyUrl() {
        navigator.clipboard.writeText(document.location.href);
        this.toasterService.success('URLがコピーされます', '成功')
    }

    canDeactivate() {
        if (this.isEditMode) {
            return window.confirm('保存されていないデータがあります。破棄してよろしいですか？');
        }
        // 認証中のときはキャンセル処理
        if (this.auth_id) {
            this.sending = false;
            if (this.authTimer) this.authTimer.unsubscribe();
            this.masterUserConfirmModal.hide()
            if (this.auth_id) this._connect.post('/admin/auth-master-user/cancel/' + this.auth_id, {}).subscribe()
        }
        this.crossTableHeader = null;
        return true;
    }

    sort(field, header = null, cross_tab = false) {
        //console.time('sort:');

        if (!header) {
            this.sort_params['asc_desc'] = (this.sort_params['field'] === field && this.sort_params['asc_desc'] === 'asc') ? 'desc' : 'asc';
        } else {
            this.sort_params['asc_desc'] = (this.sort_params['field'] === 'is_logged_in' && this.sort_params['asc_desc'] === 'asc') ? 'desc' : 'asc';
        }

        this.sort_params['field'] = header ? 'is_logged_in' : field;
        this.sort_params['cross_tab'] = cross_tab;
        if (this.embedMode) {
            this.loadList()
            return;
        }
        //this.load(1);
        let params = this.original_get_params;
        if (!params) {
            params = {}
        }
        params['sort_params'] = JSON.stringify(this.sort_params);

        this._router.navigate([this._share.getAdminTable(), this.table, params], {replaceUrl: true});
        //console.timeEnd('sort:');
    }


    load(page, display_loading = true, load_list = true, onInit = false) {
        // console.time('load:');
        this.checkPosition = JSON.parse(localStorage.getItem('set_position'))

        this.dataset_view = this._router.url == '/admin/dataset'
        return new Promise<void>((resolve) => {
            this.page = page;
            this.loading = display_loading;
            let table = this.table;
            if (this.customFilter) {
                this.customFilter.conditions.reloadConditionGroup();
            }
            this._share.getTableInfo(this.table).subscribe(async (data) => {
                if (table !== this.table) {
                    return;
                }

                /*
                if (data['result'] !== 'success') {
                    this._router.navigate([this._share.getAdminTable(), 'login']);
                    return;
                } else if (data['page_flg']) {
                    this._router.navigate([this._share.getAdminTable(), this.table, 'page']);
                    return;
                } else if (data['admin_setting_flg']) {
                    this.loading = false;
                    this._router.navigate([this._share.getAdminTable(), this.table, 'edit', data['data_id']]);
                    return;
                } else if (data['menu'] === null) {
                    this._router.navigate([this._share.getAdminTable(), 'dashboard']);
                    return;
                }
                 */


                this.table_info = data;
                this.is_custom_dataset = this.table_info.menu.is_custom_table_definition
                this.enableStickyTableHeader = this.table_info.menu.show_table_header_sticky;
                this.stickyTableHeaderLists = ['normal-header'];
                this.child_a = this.table_info.child_a;

                this.child_a.forEach((child, index) => {
                    child.data_a = [];
                    child.error_a = [];
                });

                if (!this.embedMode) {
                    // this.page_title = (this.table_info.menu.group ? this.table_info.menu.group + ' / ' : '') + this.table_info.menu.name;
                    this.page_title = this.table_info.menu.name;
                }
                this._share.header_dataset_name = this.page_title;
                this._share.header_dataset_count = null;
                this.before_html = this.table_info.list_before_html;
                this.grant = this.table_info.grant;
                // console.log(this.grant);

                this._route.snapshot.data.title = this.page_title; // パンくず
                this.isMovable = this.table_info.table == 'dataset';
                //this.page_title =
                this.hasFileField = false;

                this.group_edit_data = [];
                this.group_sort_data_a = [];
                this.group_sort_data_a = [];

                for (const key in this.table_info.forms['_forms']) {
                    if (['image', 'file'].includes(this.table_info.forms['_forms'][key]['_type'])) {
                        this.hasFileField = true;
                        break;
                    }
                }
                for (const prop in this.table_info.forms) {
                    const form: Form = this.table_info.forms.byFieldName(prop);
                    if (form) {
                        if (['image', 'file'].includes(form.type)) {
                            this.hasFileField = true;
                            break;
                        }
                    }
                }

                this.extend_search_forms = this.table_info.extend_search_forms;
                this.table_type = this.table_info.menu.table_type;


                // フィルタのセット
                if (onInit) {
                    this.setDefaultFilter()

                }

                this.fields = this.getViewFields()


                if (!this.grant.summarize_list && this.customFilter && this.customFilter.isSetSummarizeParam()) {
                    this._router.navigate([this._share.getAdminTable(), this.table]);
                    return;
                }

                if (!load_list) {
                    resolve();
                    return;
                }
                if (!this.isChartMode()) {
                    this.loadList(() => {

                        //console.time('load end!');
                        if (display_loading) {
                            this.setLoadingFalse()
                            scrollTo(0, 0);
                        }

                        resolve();
                    });
                } else {
                    if (display_loading) {
                        this.setLoadingFalse()
                    }
                    resolve();
                }
            })
        });
        //console.time('load:');
    }

    setLoadingFalse() {
        this.first_loading = false;
        this.loading = false;
    }

    getMergedCustomFilter(): CustomFilter {
        let _filter = null;

        if (this.customFilter && (!this.customFilter.canMergeView() || !this.customView)) {
            return this.customFilter;
        } else if (!this.customFilter && this.customView) {
            return this.customView;
        }

        if (this.customFilter && this.isDisplayViewFilter()) {
            //copy customFilter

            _filter = cloneDeep(this.customFilter)
            if (this.customFilter.canMergeView()) {
                _filter.mergeView(this.customView)
            } else {
            }
        }

        return _filter;
    }

    public isDisplayViewFilter(): boolean {
        return !this.customFilter || (this.customFilter.canMergeView());
    }


    private prePostSubscription: Subscription = null;
    async loadList(callback = null, force_limit = null) {
        const loadStartTime = performance.now();
        console.log('データ読み込み開始:', loadStartTime - this.pageLoadStartTime, 'ms');

        let table = this.table;
        this.loading = true;
        console.log(this.customFilter)

        let _filter = this.getMergedCustomFilter();
        if (force_limit) {
            _filter.force_limit = force_limit;
        }
        if (this.prePostSubscription) {
            this.prePostSubscription.unsubscribe();
        }
        this.prePostSubscription = await this._connect.getList(this.table_info, this.page, this.table_info.menu.per_page, _filter, this.sort_params, this.all_search_variables, true, {}, this.googleMapFilter[this.table]).subscribe((data) => {
            if (data['result'] === 'error') {
                // console.log('ERROR RESULT')
                return;
            }
            if (table !== this.table) {
                //console.time('if:');
                // console.log('NOT SAME TABLE')
                return;
            }

            if (data['count'] == -1) {
                this.nouse_page = true;
            } else {
                this.nouse_page = false;
            }

            // detail screen reference keys
            if (data['data_a']) {
                this.userTableSetting.refer_ids = data['data_a'].map(data_ => data_.raw_data.id);
            }
            this.userTableSetting.total_page    = data['total_page'];
            if (this.nouse_page) {
                if (data['data_a'].length < this.per_page) {
                    this.userTableSetting.total_page = this.page;
                } else {
                    this.userTableSetting.total_page = 10000;
                }
            }
            this.userTableSetting.current_page  = this.page;
            this.userTableSetting.sort_params   = this.sort_params;

            this.total_count = parseInt(this.nouse_page ? -1 : data['count'], 10);


            // ヘッダー用
            // ↓ 関数経由だとうまく反映されない場合がある。
            // this._share.setHeaderDatasetName(this.page_title, this.total_count, this.table_info.menu.icon_image_url);
            this._share.header_dataset_name = this.page_title;
            this._share.header_dataset_count = this.total_count;
            this._share.header_dataset_img = this.table_info.menu.icon_image_url;

            this.setBreadcrumbs();

            this.data_a = [];

            let recordListService = new RecordListService(data, _filter, this.table_info)
            this.crossTableHeader = recordListService.crossTableHeader
            this.data_a = recordListService.data_a

            if (this.table_info.menu.is_onlyone) {
                //１データのみ登録可能な場合
                // console.log(this.data_a)
                if (this.data_a.length == 0) {
                    // new
                    this._router.navigate([this._share.getAdminTable(), this.table, 'edit', 'new']);
                } else if (this.data_a.length == 1) {
                    // exist
                    this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.data_a[0].raw_data['id']]);
                }
            }


            this.numbers = Array(this.userTableSetting.total_page).fill(0).map((x, i) => i);

            this.original_data_a = this.data_a.map(_data => _data.getCopy())

            if (this.table === 'search_logs') {
                this.search_log_base_fields = this.table_info.fields;
                this.search_log_base_forms = this.table_info.forms;
            }

            if (this.loading) {
                this.setLoadingFalse()
                scrollTo(0, 0);
                setTimeout(() => {
                    // テーブルが横スクロール可能かどうか
                    // ロード後少し空けないと要素が取得できない
                    let sticky_table = document.getElementById('sticky-table-wrapper');
                    if (sticky_table) {
                        this.hide_scroll = sticky_table.scrollWidth == sticky_table.clientWidth;
                    }

                }, 10);
            }
            const loadEndTime = performance.now();
            console.log('ページ読み込み完了:', loadEndTime - this.pageLoadStartTime, 'ms');
            if (callback) {
                callback()
            }
        }, (error) => {
        });

        //console.time('loadList')

    }

    isInsertable() {
        //hide add button if hide_insertable is true
        if(this.table_info.menu.hide_insertable) return false;
        return this.grant.add && !this.isSummarizeMode && !this.table_info.is_child_form;
    }

    isBulkEditable() {
        return this.grant.update_all && !this.isSummarizeMode && !this.table_info.is_child_form;
    }

    resetSearch(use_default_filter: boolean = false, filter_type: string = 'filter') {
        //let calcTime = performance.now()
        this.userTableSetting.filter_id = null;
        this.userTableSetting.tmp_filter = null;
        if (use_default_filter) {
            this.setDefaultFilter()
        }
        if (filter_type == 'filter') {
            localStorage.removeItem(`fixed-field-name-${this.customFilter.id}`);
            this.customFilter = null;
            this.crossTableHeader = null
        } else {
            localStorage.removeItem(`fixed-field-name-${this.customView.id}`);
            this.customView = null;
        }
        this.table_info.resetMemory();
        this.reloadWithFilter()

    }

    private getFilterByFilterType(filter_type: string): CustomFilter {
        if (filter_type === 'filter' || filter_type == 'mix') {
            return this.customFilter;
        } else if (filter_type === 'view') {
            return this.customView;
        }
    }

    onPageChange(page) {
        //let calcTime = performance.now()

        // console.log("is_calendar_view_enabled pagination ",this.table_info.menu.is_calendar_view_enabled);
        // console.log("show_calendar_view_only pagination ",this.table_info.menu.show_calendar_view_only);


        // this.switchCalendarView = this.table_info.menu.is_calendar_view_enabled && this.table_info.menu.show_calendar_view_only


        let params = this.original_get_params;
        params = this.getGetParams(params)
        params['page'] = page;
        this.page_changed = true;
        if (this.embedMode) {

            this.load(page);
            return;
        }
        this._router.navigate([this._share.getAdminTable(), this.table, this.original_get_params]);
        console.log("onPageChange Pagination switchCalendarView",this.switchCalendarView)
        this.changeView(this.switchCalendarView)

        //if(performance.now() - calcTime > 1)//console.log((performance.now() - calcTime));
    }

    get_csv(csv_id) {
        //console.time('get_csv:');

        const url = this._connect.getApiUrl() + '/admin/csv-info/' + csv_id;

        return new Observable(observer => {
            this._connect.get(url).subscribe(data => {
                const csv = data['csv'];
                observer.next(csv);
            });
        });
    }

    // handle_csv_download_csv(csv, filename: string) {
    //     //console.time('handle_csv_download_csv:');

    //     if (['failed', 'done', 'cancelled'].indexOf(csv['status']) >= 0) {
    //         if (this.csv_load_timer !== null) {
    //             this.csv_load_timer.unsubscribe();
    //             this.csv_load_timer = null;
    //         } else {
    //             //timerがない場合は、既にダウンロード済み
    //             return;
    //         }
    //         //const result = JSON.parse(csv['result']);
    //         if (csv['status'] === 'failed') {
    //             this.toasterService.error('エラーが発生しました', 'エラー');
    //         } else if (csv['status'] === 'cancelled') {
    //             this.csv_load_timer.unsubscribe();
    //             this.toasterService.warning('ダウンロードがキャンセルされました', '警告');
    //         } else {
    //             // done
    //             this.download_csv(csv['id'], filename);
    //             return true;
    //         }
    //     }

    //     //console.timeEnd('handle_csv_download_csv:');
    //     return false;
    // }


    download_csv(csv_id, filename) {
        const url = this._connect.getApiUrl() + '/admin/download-csv/' + csv_id;
        return this._connect.get(url, null, {'responseType': 'blob'});
    }

    // しばらく運用して問題なかったら、get_csvと統合する
    get_json(json_id) {
        const url = this._connect.getApiUrl() + '/admin/json-info/' + json_id;

        return new Observable(observer => {
            this._connect.get(url).subscribe(data => {
                const json = data['json'];
                observer.next(json);
            });
        });
    }

    // しばらく運用して問題なかったら、handle_csv_download_csvと統合する
    handle_json_download_json(json, filename: string) {
        if (['failed', 'done'].indexOf(json['status']) >= 0) {
            if (this.json_load_timer !== null) {
                this.json_load_timer.unsubscribe();
                this.json_load_timer = null;
            } else {
                //timerがない場合は、既にダウンロード済み
                return;
            }
            if (json['status'] === 'failed') {
                this.toasterService.error('エラーが発生しました', 'エラー');
            } else {
                // done
                this.download_json(json['id'], filename);
                return true;
            }
        }

        return false;
    }

    // しばらく運用して問題なかったら、handle_csv_download_jsonと統合する
    download_json(json_id, filename) {
        const url = this._connect.getApiUrl() + '/admin/download-json/' + json_id;
        this._connect.get(url, null, {'responseType': 'blob'}).subscribe((data: any) => {
            this.downloading['json'] = false;
            if (data.size === 0) {
                alert('ダウンロードに失敗しました。権限を確認して下さい。');
                return;
            }
            const blob = new Blob([data], {type: 'text/json'});
            FileSaver.saveAs(blob, filename);
        })
    }

    prepare_csv() {
        this.dlCsvModal.hide()

        if (this.downloading['csv']) {
            this.toasterService.warning('別のCSVをダウンロード中です', '警告');
            return;
        }
        //console.time('prepare_csv:');

        const params = [];
        Object.keys(this.original_get_params).map((key) => {
            params.push(key + '=' + encodeURIComponent(this.original_get_params[key]));
        });
        console.log("params",params)
        const url = this._connect.getApiUrl() + '/admin/prepare-download/' + this.table + '/csv?' + params.join('&');
        this.downloading['csv'] = true;

        let search_params = {};
        if (this.is_use_filter_for_csv_dl && (this.customFilter || this.customView)) {
            if (this.customFilter && this.customView) {
                this.customFilter = this.getMergedCustomFilter();
            }

            if (this.customFilter) {
                search_params = this.customFilter.getFilterParam();
            } else if (this.customView) {
                search_params = this.customView.getFilterParam();
            }
        }
        if(this.table_info.is_child_form){
            search_params['child_flg'] = true;
        }
        if (this.expand_email_rows && this.table === 'admin') {
            search_params['expand_email_rows'] = true;
        }
        let filename = this.page_title + '_' + this._share.dateFormat.format(new Date(), 'yyyyMMdd_hhmm') + '.csv';
        filename = filename.replace(/\s/g, '');
        this.toasterService.success('CSVダウンロードを開始しました。時間がかかる場合があります。', '成功');
        this._connect.post(url, { search: search_params, sort: this.sort_params }, { responseType: 'text' })
            .subscribe((response: any) => {
                // CSVジョブが正常に開始された場合
                console.log('CSVダウンロード応答:', response, typeof response);
                let parsedResponse;
                try {
                    parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
                } catch (e) {
                    console.error('JSON parse error:', e, response);
                    return;
                }

                if (parsedResponse && parsedResponse.csv_id) {
                    console.log('CSVダウンロードジョブ開始:', parsedResponse.csv_id);

                    // localStorageに保存
                    const key = `csv_job_${parsedResponse.csv_id}`;
                    localStorage.setItem(key, JSON.stringify({
                        id: parsedResponse.csv_id,
                        type: 'download',
                        filename: filename,
                        status: 'wait',
                        created: new Date().toISOString()
                    }));

                    // 即座にPusher監視を開始
                    console.log('ダウンロードジョブ監視開始:', parsedResponse.csv_id, 'download', filename);
                    this.setupJobListener(parsedResponse.csv_id, 'download', filename);

                    // failsafeとしてポーリングも開始
                    this.startJobPolling(parsedResponse.csv_id, 'download', filename);
                }
        }, error => {
            if (error.message) {
                this.toasterService.error(error.error.error_message, 'エラー');
            } else {
                this.toasterService.error('CSVダウンロードの開始に失敗しました。', 'エラー');
            }
            this.downloading['csv'] = false;
            this.csv_load_timer.unsubscribe();
            this.csv_load_timer = null;
            this.pusherService.finishOperation();  // Cleanup on prepare error
        });

    }


    checkboxChange = (event) => {
        //console.time('prepare_csv:');
        this.checked_id_a = [];
        this.unchecked_id_a = [];

        const all_checkbox = document.querySelector('th.table-admin-list__checkbox input') as HTMLInputElement;
        if(all_checkbox && all_checkbox.checked ){
            this.checked_all = true;
        }else{
            this.checked_all = false;
        }

        const checkbox_a = document.getElementsByName('data_check');
        for (let i = 0; i < checkbox_a.length; i++) {
            const checkbox = <HTMLInputElement>checkbox_a[i];
            let checkedIDValue = parseInt(checkbox.value, 10);
            if (checkbox.checked) {
                this.checked_id_a.push(checkedIDValue);
            }else{
                if( this.checked_all ){
                    this.unchecked_id_a.push(checkedIDValue )
                }
            }
        }

        var query_string = '';
        if (this.dataset_view) {
            this.checked_id_a.map((id, index) => index == this.checked_id_a.length - 1 ? query_string += `dataset_id[]=${id}` : query_string += `dataset_id[]=${id}&`);
            if (query_string != '') {
                this._connect.get(`/admin/download-json?${query_string}&check_relation=true`).subscribe(
                    (jsonData) => {
                        if (this.missing_datasets != null) {
                            this.missing_datasets = jsonData;
                        }
                        // console.log(jsonData);
                    }
                ).add(() => {
                    this.export_ready = true;
                    // console.log(this.missing_datasets);

                })
            }
            this.query_string = query_string;
        }

        // console.log(this.query_string)
        if (this.filterArchiveTables().length > 0){
            this.showUnarchiveButton = true;
        }else{
            this.showUnarchiveButton = false;
        }
    }

    getViewFields(): Array<Object> {
        return this.table_info.getViewFields(this.customFilter, this._share.isMasterUser(), this.isSummarizeMode, false);
    }


    getType(field_name) {
        if (this.table_info.forms.byFieldName(field_name) === undefined) {
            return '';
        }
        return this.table_info.forms.byFieldName(field_name).type || '';
    }


    isShowManageColFunc() {
        //console.log('isShowManageCol:');
        //let calcTime = performance.now()
        if (this.customFilter && this.customFilter.isSetSummarizeParam()) {
            return false;
        }


        //console.timeEnd('isShowManageCol:');
        return this.grant.detail || this.grant.edit || this.grant.delete;
    }

    getButtonState(): string {
        if (this.resetBeforeCsvUpload === 'true') {
            return 'csv_upload';
        }
        if (this.isEditMode) {
            return 'edit_mode';
        }
        return 'normal';
    }

    onHideDeleteModal(): void {
        this.resetBeforeCsvUpload = 'false';
    }

    deleteAll() {
        if(this.csvModal.isShown){
            this.isDeleteAllUploadTriggered = true;
            this.csvModal.hide();
        }
        if (this.isEditMode) {
            this.deleteCheckedConfirmModal.show();
            return;
        }
        let all_checkbox = document.querySelector('th.table-admin-list__checkbox input') as HTMLInputElement;
        if (all_checkbox && all_checkbox.checked) {
            this.checked_all = true;
        } else {
            this.checked_all = false;
        }
        this.modal_data = this.checked_id_a;
        this.deleteModal.show();
    }

    private isDeleteAllUploadTriggered: boolean = false;
    onHideCsvModal(): void {
        if (!this.isDeleteAllUploadTriggered) {
            this.resetBeforeCsvUpload = 'false';
        }
        this.isDeleteAllUploadTriggered = false;
    }

    copyAll() {
        this.modal_data = this.checked_id_a;
        this.copyModal.show();
    }

    exportAll() {

        if (this.isEditMode) {
            this.exportCheckedConfirmModal.show();
            return;
        }
        this.modal_data = this.checked_id_a;
        this.exportModal.show();
    }

    filterArchiveTables() {
        const datasets = this.getDatasets(this._share.menu_root.children);
        return this.data_a.filter(data => {
            return datasets.some(child => child.data_id == data.getId() && child.archive_flag == true) &&
                this.checked_id_a.includes(data.getId());
        });
    }

    getDatasets(children) {
        let datasets = [];
        for (let child of children) {
            if (/^dataset__\d+$/.test(child.id)) {
                datasets.push(child);
            } else if (/^group__\d+$/.test(child.id) && child.children) {
                datasets = datasets.concat(this.getDatasets(child.children));
            }
        }

        return datasets;
    }

    archiveTable(type = 'archive') {
        this.archiveFlagType = type;
        this.archiveFlagConfirmText = 'アーカイブします。よろしいですか？（アーカイブ解除は可能です）';
        if (type == 'unarchive') {
            this.archiveFlagConfirmText = 'アーカイブを解除します。よろしいですか？';
        }
        this.confirmArchiveTableModal.show();
    }

    saveArchiveTable(){
        console.log(this.checked_id_a)
        this._connect.post('/admin/archive-dataset', {
            'ids': this.checked_id_a,
            'type': this.archiveFlagType
        }).subscribe((data) => {
            this.sending = false;
            this.checked_id_a = [];
            this.confirmArchiveTableModal.hide();

            this._share.loadAdminDatas();
            this._share.resetTableInfoCache();
            this.load(this.page);
        });
    }

    openTruncateModal() {
        //console.time('openTruncateModal:');

        this.truncateModal.show();

        //console.timeEnd('openTruncateModal:');
    }


    view(data) {
        //console.time('view:');

        this._router.navigate([this._share.getAdminTable(), this.table, 'view', data[this.table_info.primary_key]]);

        //console.timeEnd('view:');
    }

    add() {
        //console.time('add:');

        if (this.tutorial_flag === 'false') {
            this._connect.get('/admin/tutorial/complete').subscribe(
                (jsonData) => {
                    if (jsonData.status) {
                        this.tutorial_flag = true;
                    }
                },
            );
        }
        //console.timeEnd('add:');
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', 'new']);

    }

    search(is_new = false) {
        let newHash = {'name': '新しいフィルタ_' + this._share.dateFormat.format(new Date(), 'yyyyMMdd')}
        this.modalCustomFilter = new CustomFilter(newHash);
        this.modalCustomFilter.grant = 'private';
        this.modalCustomFilter.table = this.table;
        this.modalCustomFilter.setAsTable();
        this.chartModal.show();
    }

    edit(data) {

        if (data[this.table_info.primary_key] === null) {
            this.toasterService.error('primary-keyがNULLです', 'エラー');
            return;
        }
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', data[this.table_info.primary_key]]);

    }


    openDeleteModal = (data: Data, type = null) => {
        this.delete_table_type = type;
        if (type == 'dataset') {
            let match = this.table_info.table.match(/dataset__(\d+)/);
            if (!match) {
                this.toasterService.error('削除できないテーブルです', 'エラー');
                return;
            }
            const table_id = match[1];
            this.modal_data = [table_id];
            this.deleteModal.show();
            return;
        }

        if (data.getRawData('id') === null) {
            this.toasterService.error('primary-keyがNULLです', 'エラー');
            return;
        }
        this.modal_data = [data.getRawData('id')];
        // console.log(this.modal_data)
        this.deleteModal.show();

    }


    public currentDeleteGroup;
    openGroupDeleteModal = (group) => {
        this.currentDeleteGroup = group;
        this.groupDeleteModal.show();
    }

    masterUserConfirm(type = null) {
        this.delete_table_type = null;
        if (this.table == 'dataset') {
            this.auth_type = 'dataset_delete';
        } else if (type == 'upload_csv') {
            this.auth_type = 'upload_csv';
        } else if (this.modal_data && this.modal_data.length > 1) {
            this.auth_type = 'multi_record_delete';
        } else if(type == 'truncate'){
            this.auth_type = 'truncate';
        } else if (type == 'dataset') {
            this.delete_table_type = 'dataset';
            this.auth_type = 'dataset_delete';
        }
        const url = this._connect.getApiUrl() + '/admin/master-users';
        this._connect.get(url, null, {}).subscribe(data => {
            this.master_users = data.master_users;
            this.masterUserConfirmModal.show()
        })
    }

    masterUserAuth(modal_data){
        if(this.auth_master_user == 0){
            this.toasterService.error('認証の申請をするユーザーを選択してください', '失敗');
            return
        }
        this.sending = true;
        this._connect.post('/admin/send-auth-mail/' + this.auth_master_user, { 'type': this.auth_type }).subscribe(
            (data) => {
                this.auth_id = data.auth_id;
                this.authTimer = interval(5000).subscribe(x => {
                    this._connect.post('/admin/auth-master-user/check/' + data.auth_id, {}).subscribe(
                        (data) => {
                            if (data.auth === true) {
                                this.authTimer.unsubscribe();
                                this.sending = false;
                                console.log('認証されました')
                                this.toasterService.success('承認されました', '成功');
                                if (this.auth_type == 'dataset_delete' || this.auth_type == 'multi_record_delete') {
                                    this.delete(modal_data)
                                    this.masterUserConfirmModal.hide()
                                } else if(this.auth_type == 'upload_csv'){
                                    this.uploadCsv()
                                    this.masterUserConfirmModal.hide()
                                } else if(this.auth_type == 'truncate'){
                                    this.truncate()
                                    this.masterUserConfirmModal.hide()
                                }
                            }
                        },
                        (error) => {
                            console.error(error);
                        }
                    );
                });
            },
            (error) => {
                console.error(error);
            }
        );
    }
    masterUserAuthCancel(){
        this.sending = false;
        if (this.authTimer) this.authTimer.unsubscribe();
        this.masterUserConfirmModal.hide()
        if (this.auth_id) this._connect.post('/admin/auth-master-user/cancel/' + this.auth_id, {}).subscribe()
    }


    /**
     * このメソッドを呼び出すとき、this.delete_table_typeがnullであることの必ず確認すること
     * datasetという文字列が入っていたらテーブルが消えるため
     */
    delete(id_a, table: string = null) {
        if (!table) {
            table = this.table;
        }

        if(this.delete_table_type){
            table = this.delete_table_type;
        }

        this.sending = true;
        //console.time('delete:');
        if (this.isEditMode) {
            this.addCheckedToDelete();
            return;
        }
        if (table == 'admin' && this.table_info.is_admin_table && this.total_count === 1) {
            this.toasterService.error('管理者は最低一人は必要です。', 'エラー');
            return;
        }
        let params = {
            'id_a': id_a,
            'delete_all': this.checked_all,
            'unchecked_id_a': this.unchecked_id_a,
            'search': this.customFilter ? this.customFilter.getSearchParam() : null,
        };
        this._connect.post('/admin/delete/' + table, params).subscribe(
            (jsonData) => {
                this.sending = false;
                if (jsonData['result'] === 'success') {
                    this.checked_id_a = [];
                    this.checked_all = false;
                    this.deleteModal.hide();

                    // always uncheck in all checkbox input if checked, after deleted
                    this.reset_all_checkbox();

                    if (jsonData['job'] == 'start') {
                        this.toasterService.success('データの削除をリクエストしました。処理ステータスはリクエストログから閲覧可能です。', '成功');
                    } else {
                        this.toasterService.success(jsonData['success_count'] + '件のデータを削除しました。', '成功');
                        this._share.loadAdminDatas();
                        this._share.resetTableInfoCache()
                        this.load(this.page);
                    }
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                    this.deleteModal.hide();
                }
            }, (error) => {
                this.sending = false;
                this.deleteModal.hide();
            }
        );
        //console.timeEnd('delete:');
    }

    deleteGroup(group) {
        const url = this._connect.getApiUrl() + '/admin/dataset-group/delete/' + group.data_id;
        this._connect.post(url, {}).subscribe((data: any) => {
            this.groupDeleteModal.hide();
            this._share.loadAdminDatas().then(data => {
                this.reset_tree = true;
            });
        });
    }

    copy(id_a, table: string = null) {
        if (!table) {
            table = this.table;
        }
        this.sending = true;
        this._connect.post('/admin/custom-flex-copy/' + table, {'id_a': id_a}).subscribe(
            (jsonData) => {
                this.sending = false;
                if (jsonData['result'] === 'success') {
                    this.checked_id_a = [];
                    this.copyModal.hide();
                    if (jsonData['job'] === 'start') {
                        this.toasterService.success('データのコピーをリクエストしました。処理ステータスはリクエストログから閲覧可能です。', '成功');
                    } else {
                        this.toasterService.success(jsonData['success_count'] + '件のデータをコピーしました。', '成功');
                        this._share.loadAdminDatas();
                        this._share.resetTableInfoCache();
                        this.load(this.page);
                    }
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                    this.copyModal.hide();
                }
            }, (error) => {
                this.sending = false;
                this.copyModal.hide();
            }
        );
    }

    truncate() {
        //console.time('truncate:');

        if (this.table_info.is_admin_table && this.total_count === 1) {
            this.toasterService.error('管理者は最低一人は必要です。', 'エラー');
            return;
        }
        this._connect.post('/admin/truncate/' + this.table, {}).subscribe(
            (jsonData) => {
                this.isSpecialMenuCollapsed = true;
                this._share.resetTableInfoCache()
                if (jsonData['result'] === 'success') {
                    this.load(this.page);
                    this.checked_id_a = [];
                    this.truncateModal.hide();
                    this.toasterService.success('', '成功');
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                }
            },
        );

        //console.timeEnd('truncate:');
    }

    openDlCsvModal() {
        if ((this.table === 'admin' && !this.embedMode) || this.customFilter || this.customView) {
            this.dlCsvModal.show();
        } else if (this.embedMode) {
            //force current filter
            this.is_use_filter_for_csv_dl = true;
            this.prepare_csv()
        } else {
            this.prepare_csv()
        }
    }

    openCsvModal() {
        //console.time('openCsvModal:');
        this.csvModal.show();

        //console.timeEnd('openCsvModal:');
    }


    changeCsv(event) {
        //console.time('changeCsv:');

        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.csv = fileList[0];
        } else {
            this.resetCsvInput();
        }

        //console.timeEnd('changeCsv:');
    }

    downloadCsvForUpload() {
        if (this.downloading['csv']) {
            this.toasterService.warning('別のCSVをダウンロード中です', '警告');
            return;
        }
        //console.time('downloadCsvForUpload:');

        const headers = new HttpHeaders({
            'Authorization': 'Bearer ' + localStorage.getItem(this._share.getAdminTable() + '_access_token'),
        });
        const params = [];
        Object.keys(this.original_get_params).map((key) => {
            params.push(key + '=' + encodeURIComponent(this.original_get_params[key]));
        });
        params.push('child_flg=' + encodeURIComponent(this.table_info.is_child_form));
        const url = this._connect.getApiUrl() + '/admin/download-csv-for-upload/' + this.table + '?' + params.join('&');

        this._connect.get(url, null, {headers: headers, 'responseType': 'blob'}).subscribe(data => {
            const blob = new Blob([data], {type: 'text/csv'});
            FileSaver.saveAs(blob, this.page_title + '_empty.csv');
        })

        //console.timeEnd('downloadCsvForUpload:');
    }

    showNewToast(progress: number) {
        console.log("New Toast Created with progress: ", progress);

        this.currentToast = this.toasterService.success(
            `Upload Progress: ${progress}%`,
            'Uploading...',
            {
                timeOut: 600,
                progressBar: true,
                positionClass: 'toast-top-right'
            }
        );

        this.toastActive = true;
    }

    uploadCsv() {

        const uploadKey = `uploading_csv_${this.table}_${Date.now()}`;
        localStorage.setItem('current_upload_key', uploadKey);
        localStorage.setItem(uploadKey, 'true');

        this.pusherService.bindUploadProgress((data) => {
            const isUploadingDevice = this.isUploadingFromThisDevice();
            if (!isUploadingDevice) {
                return;
            }
            if (this.uploadProgress === data.progress) {
                return;
            }
            
            this.uploadProgress = Math.floor(data.progress);
            this.uploadProgressService.updateProgress(this.uploadProgress);

        });

        this.pusherService.unbind('job-finished');
        this.pusherService.unbind('upload-finished');
        this.pusherService.bindCsvUploadFinished((data) => {
            const isUploadingDevice = this.isUploadingFromThisDevice();
            if (isUploadingDevice) {
                
                this.csvModal.hide();
                if (data.status == 'done') {
                    this.load(this.page);
                }else if(data.status == 'failed'){
                    this.toasterService.error('CSVアップロードに失敗しました。結果をCSVログから確認してください', 'エラー');
                }else if(data.status == 'wait'){
                    this.toasterService.warning('CSVインポートに失敗しました', '警告');
                }
                if (data.warning) {
                    this.toasterService.warning(data.warning, '警告');
                }
                this.cleanupUploadFlags();
            }
            this.resetBeforeCsvUpload = 'false';
        });

        if (this.csv) {
            this.sending = true;
            const formData: FormData = new FormData();
            formData.append('csv', this.csv, this.csv.name);
            formData.append('reset', this.resetBeforeCsvUpload);
            formData.append('sendMailFlg', this.sendMailFlg);
            formData.append('skipConfirmation', this.skipUploadConfirmation.toString());
            if(this.skipUploadConfirmation){
                this._share.user.check_csv_no_change_modal = 'true';
            }
            this._connect.postUpload('/admin/upload-csv/' + this.table, formData).subscribe(
                (jsonData) => {
                    this.sending = false;
                    const csv_id = jsonData['csv_id'];
                    if (jsonData['result'] === 'success') {
                        this.toasterService.success('CSVアップロードしました。反映まで少しかかる場合があります。', '成功', { timeOut: 500 });
                        this.csvModal.hide();
                        this.uploadConfirmModal.hide();
                        this.resetCsvInput();

                        // CSVアップロードジョブ監視を開始
                        if (csv_id) {
                            console.log('CSVアップロードジョブ開始:', csv_id);

                            // localStorageに保存
                            const key = `csv_job_${csv_id}`;
                            localStorage.setItem(key, JSON.stringify({
                                id: csv_id,
                                type: 'upload',
                                filename: this.csv ? this.csv.name : 'upload.csv',
                                status: 'wait',
                                created: new Date().toISOString()
                            }));

                            // 即座にPusher監視を開始
                            this.setupJobListener(csv_id, 'upload', this.csv ? this.csv.name : 'upload.csv');

                            // failsafeとしてポーリングも開始
                            this.startJobPolling(csv_id, 'upload', this.csv ? this.csv.name : 'upload.csv');
                        }

                        if (this.resetBeforeCsvUpload === 'true') {
                            this.load(this.page);
                        }
                    } else {
                        this.csvModal.hide();
                        this.resetCsvInput();
                        this.modal_error_title = jsonData['title'];
                        this.modal_error_message = jsonData['message'];
                        this.errorModal.show();
                    }
                    this.resetBeforeCsvUpload = 'false';
                },
                (error) => {
                    if (error.message) {
                        this.toasterService.error(error.error.error_message, 'エラー');
                    } else {
                        this.toasterService.error('エラーが発生しました。ファイルCSVアップロード用のファイルをダウンロードし、そのファイルを編集してアップロードを行ってください。', 'エラー');
                    }
                    this.sending = false;
                }
            );
            this.deleteModal.hide();
        } else {
            this.toasterService.error('CSVファイルが選択されていません。', 'エラー');
            this.deleteModal.hide();
        }
    }



    resetCsvInput() {
        //console.time('resetCsvInput:');

        this.csv = null;
        if (this.inputCsv && this.inputCsv.nativeElement) {
            this.inputCsv.nativeElement.value = '';
        }
    }



    is_child_table(key) {
        return key.match(/\[.*\]/);

    }

    get_child_table(key) {
        const g = key.match(/\[(.*)\](.*)/);
        return g[1];

    }

    get_child_key(key) {
        const g = key.match(/\[.*\](.*)/);
        return g[1];

    }


    is_string(data) {
        return data instanceof String;
    }


    download_zip() {
        const link = document.createElement('a');
        link.href = `${this._connect.getApiUrl()}/admin/download/${this.table}/zip`;
        link.click();
    }

    /**
     * For Summarize
     */
    public modalCustomFilter: CustomFilter;
    public modalFilterType: string;

    openEditFilterModal(is_new = true, type = 'table', filter_type = 'filter', is_summarize = true, filter_id = null) {
        //console.time('summarize')
        let _filter = this.getFilterByFilterType(filter_type)
        if (filter_id != null) {
            _filter = this.table_info.saved_filters.find(function (_filter) {
                return _filter.id == filter_id
            })
            this.modalCustomFilter = _filter
        }
        this.modalFilterType = filter_type;
        if (is_new || !_filter) {
            this.modalCustomFilter = new CustomFilter();
            this.modalCustomFilter.table = this.table;
            this.modalCustomFilter.grant = 'private';
            if (type == 'table') {
                this.modalCustomFilter.setAsTable();
            } else {
                this.modalCustomFilter.setAsChart();
            }
            if (is_summarize) {
                this.modalCustomFilter.initSummarizeFilter(this._share.admin_setting['month_start'])
            }
            this.modalCustomFilter.filter_type = filter_type;
        } else {
            this.modalCustomFilter = cloneDeep(_filter)
        }
        //console.timeEnd('summarize')
        this.chartModal.show();
    }

    openDeleteFilterModal(filter_type = 'filter') {
        this.modalFilterType = filter_type;
        this.modalCustomFilter = this.getFilterByFilterType(filter_type)
        this.deleteFilterModal.show();

    }

    openDuplicateFilterModal(filter_type = 'filter') {

        this.modalFilterType = filter_type;
        this.modalCustomFilter = this.getFilterByFilterType(filter_type)
        this.chartTitleModal.show();

    }

    onClickPreviewButton($event) {
        this.chartModal.hide()
        if (!$event) {
            return;
        }
        this.chartModal.hide()
        this.reloadPageByCustomFilter($event.customFilter)
    }

    private reloadPageByCustomFilter(customFilter: CustomFilter, reset = false) {
        if (this.embedMode) {
            this.customFilter = customFilter;
            console.log(this.customFilter)
            if (this.customFilter) {
                this.customFilter.getAllVariables(this._share).subscribe(variables => {
                    this.all_search_variables = variables
                })

                if (this.table_info) {
                    this.customFilter.conditions.condition_a.forEach(condition => {
                        condition.loadExtraDetail(this.table_info, this._share, this._connect)
                    })
                }
                this.customFilter.conditions.reloadConditionGroup();
            }
            console.log(this.customFilter)
            this.sort_params = []
            if (this.customFilter.sort_params.length > 0) {
                //FIXME:複数対応
                this.sort_params = {
                    'field': this.customFilter.sort_params[0].field,
                    'asc_desc': this.customFilter.sort_params[0].asc_desc
                }
            }
            this.loadList(null, this.customFilter.force_limit);
            return;
        }
        const params = {};
        if (!customFilter.isNoFilter()) {
            //set filter id if filter type == filter
            if (customFilter.id && customFilter.filter_type == 'filter') {
                params['_filter_id'] = customFilter.id;
            }
            params['filter_params'] = JSON.stringify(customFilter.getFilterParam());
            params['condition_json'] = customFilter.conditions.getSearchParamJson();
            if (reset) params['reset'] = true;
        }
        delete params['page'];
        this._router.navigate([this._share.getAdminTable(), this.table, params]);


    }

    private getGetParams(params: Object = {}) {
        if (this.customFilter) {
            if (this.customFilter.id) {
                params['_filter_id'] = this.customFilter.id;
            } else {
                params['filter_params'] = JSON.stringify(this.customFilter.getFilterParam())
                params['condition_json'] = this.customFilter.conditions.getSearchParamJson();
            }
        }

        // if(this.customView){
        //     if (this.customView.id) {
        //         params['_view_id'] = this.customView.id;
        //     }
        //     params['view_params'] = JSON.stringify(this.customView.getFilterParam())
        // }

        return params
    }

    private validateFilter(_filter: CustomFilter): boolean {
        if (!_filter.name) {
            this.toasterService.error('フィルター名を入力してください。', 'エラー');
            return false;
        }

        return true;
    }

    saveFilter(save_new = false) {
        let _filter = this.modalCustomFilter;
        if (!this.validateFilter(_filter)) {
            return;
        }

        _filter.save(this._connect, save_new).then((result: boolean) => {
            this.sending = false;
            if (result) {
                this.toasterService.success('保存しました', '成功');
                this.chartTitleModal.hide();

                this.confirmFilterOverwriteConfirmModal.hide()

                //filter再読み込み
                this._share.getTableInfo(this.table, false, null, false).subscribe(_table_info => {
                    this.table_info = _table_info
                    this.reloadWithFilter()
                })
            } else {
                this.error(_filter.error_a.join(','));
            }

        })
    }

    deleteFilter() {
        //console.time('deleteFilter:');

        if (!this.modalCustomFilter.id) {
            this.deleteFilterModal.hide();
            this.resetSearch();
            return;
        }

        this._connect.post('/admin/delete-filter', {
            'id': this.modalCustomFilter.id
        }).subscribe((data) => {
            this._share.getTableInfo(this.table, false, null, false).subscribe(_table_info => {
                this.table_info = _table_info
                this.toasterService.success('現在のフィルタを削除しました', '成功');
                this.deleteFilterModal.hide();
                this.customFilter = null;
                this.customView = null;
                this._router.navigate([this._share.getAdminTable(), this.table]);
            })

        });
        //console.timeEnd('deleteFilter:');
    }


    /**
     * VIEW
     */
    create_view() {
        this._router.navigate([this._share.getAdminTable(), 'view', 'edit', 'new', {target_table: this.table}]);
    }

    isSummarizeModeFunc(): boolean {
        //console.time('isSummarizeMode:');

        return !!(this.customFilter && this.customFilter.isSetSummarizeParam())

    }

    isFilterMode() {

        return this.customFilter && this.customFilter.id !== null;

    }

    getThis() {
        return this;

    }


    selectSavedFilter($event, filter_type = 'filter') {
        let saved_filter: CustomFilter = $event.filter;
        if (saved_filter.summarizeFilter && saved_filter.summarizeFilter.options?.enable_totaling_start_month) {
            let year = this.table_info.lowest_year;
            if (!year) {
                year = new Date().getFullYear();
            }

            if (saved_filter.summarizeFilter.fields[0] ){
                saved_filter.summarizeFilter.fields[0]['term_year_start'] = year;
            }
        }

        if (filter_type == 'filter') {
            this.customFilter = saved_filter;
        } else {
            this.customView = saved_filter;
        }
        this.crossTableHeader = null;
        this.reloadWithFilter();
        // this.getCorrectOffsetWidth();
    }

    reloadWithFilter() {
        let _filter = this.customFilter;
        let _view = this.customView;

        this._router.navigate([this._share.getAdminTable(), this.table, {'_filter_id': _filter ? _filter.id : null, '_view_id': _view ? _view.id : null, 't': (new Date()).getTime()}]);
    }


    private setFilter(filter_id, filter_type = 'filter') {
        filter_id = parseInt(filter_id);
        this.table_info.saved_filters.forEach(_filter => {
            if (_filter['id'] == filter_id) {
                if (filter_type == 'filter') {
                    this.userTableSetting.filter_id = filter_id
                } else {
                    this.userTableSetting.view_id = filter_id
                }
                let targetFilter = this.getFilterByFilterType(filter_type);
                if (!targetFilter) {
                    if (!_filter.list_use_show_fields) {
                        return
                    }
                    if (filter_type == 'view' && _filter.filter_type == 'filter') {
                        //フィルターをビューとして使う場合
                        return;
                    }
                    //const params = JSON.parse(_filter['params_json'])
                    targetFilter = cloneDeep(_filter)
                    //FIXME: 後でasyncにする
                    targetFilter.conditions.reloadViewValuesTmp(this.table_info, this._connect, this._share)
                    this.fields = this.getViewFields()

                    if (filter_type == 'filter') {
                        this.customFilter = targetFilter;
                    } else {
                        this.customView = targetFilter;
                    }
                }
            }
        })

        this.table_info.resetMemory()
    }

    public scrollLeft:number    = 0;
    public stickyTableHeaderLists: Array<any>;
    public enableStickyTableHeader: boolean = false;

    scrollTableEnd(event) {
        //do somthing
    }
    scrollTable(event) {
        const left = event.target.scrollLeft + event.target.offsetWidth;
        const max_left = event.target.scrollWidth;
        if (left === max_left) {
            this.hide_scroll = true;
        } else {
            this.hide_scroll = false;
        }
        this.scrollLeft = event.target.scrollLeft+0.1;
        this.scrollable = false
        localStorage.setItem(`set_position`, JSON.stringify({[this.table]: event.target.scrollTop}))
    }

    isShowMenu() {
        return !this.isEditMode && this.table != 'view' && ((this.grant.add || this.grant.create_view || this.grant.summarize || this.grant.csv_download || this.grant.csv_upload));


    }


    add_chart() {
        this._router.navigate([this._share.getAdminTable(), 'dashboard', {'chart_params': JSON.stringify({'table': this.table})}]);
    }

    add_template() {
        this._router.navigate([this._share.getAdminTable(), 'dashboard', {'type': 'add_template'}]);
    }

    error(message) {
        this.toasterService.error(message, 'エラー');
        return;
    }

    createEmptyDataObject() {
        //console.time('createEmptyDataObject:');
        let editables = this.fields.filter(function (ele) {
            return ele.editable;
        });

        let emptyObj = {
            id: this.emptyObjId
        }
        editables.forEach(function (editable) {
            emptyObj[editable.Field] = null;
        })
        this.emptyObjId--;
        let newdata = new Data(this.table_info);
        newdata.setInstanceData({
            'raw_data': cloneDeep(emptyObj),
            'view_data': cloneDeep({
                id: null
            }),
            'grant': new DataGrant()
        })
        newdata.grant.setAllGrant(true)
        newdata.setDefaultData();
        //console.timeEnd('createEmptyDataObject:');
        return newdata;
    }

    appendEmptyDataObject() {
        this.data_a.push(this.createEmptyDataObject());
        this.shouldScrollToNewRow = true;
    }

    scrollToNthRow(nth) {
        let rows = document.querySelectorAll('#table-admin-list tr');
        rows[nth].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    reload = () => {
        this.load(this.page)
    }


    getPostObj(r_data): FormData {
        //console.time('getPostObj:');
        let obj = new FormData();
        const addToFormData = (field, type, forms, data, menu) => {
            if (['updated', 'created'].indexOf(field) >= 0 || (field === 'id' || field.indexOf('[id]') >= 0) && data === undefined) {
                return;
            }

            if (!!!menu['editable'] && field === 'grant') {
                return;
            }

            if ((type === 'datetime' || type === 'date' || type === 'time') && data === undefined) {
                data = '';
            } else if (data === undefined || data == null) {
                data = '';
            }
            obj.append(field, data);
        };
        this.fields.forEach(field => {
            addToFormData(field.Field, this.table_info.forms.byFieldName(field.Field).type, this.table_info.forms, r_data[field.Field], this.table_info.menu);
        });

        return obj;
    }


    setSelectedCellId = (cellId) => {
        this.selectedCellId = cellId;
    }

    @HostListener('click', ['$event'])
    onClick(e) {
        if (['input', 'select', 'label', 'textarea'].includes(e.target.localName)) {
            return;
        }
        const floarlClassPrefix = /fr-*/;
        const deleteBtnPrefix = /delete-btn/;
        let sourceTarget = e.target;
        let elementsTobeTested = [];
        while (sourceTarget) {
            elementsTobeTested.unshift(sourceTarget);
            sourceTarget = sourceTarget.parentElement;
        }
        for (let i = 0; i < elementsTobeTested.length; i++) {
            let classList = elementsTobeTested[i].classList;
            for (let cl of classList.entries()) {
                if (floarlClassPrefix.test(cl) || deleteBtnPrefix.test(cl)) {
                    return;
                }
            }
        }
        if (!this.isEditModalShown) {
            this.selectedCellId = null;
        }
    }

    @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        if (this.disableIsNotMasterUser()) return;
        if (this.customFilter && !this.embedMode) {
            this.resetSearch(true)
        }
    }

    @HostListener('document:keydown.shift', ['$event']) onShiftKeydownHandler(event: KeyboardEvent) {
        if (this._share.env === 'development') {
            // localStorage.setItem('debug_mode', 'true');
            // this._share.debug_mode = true
            console.log(event)
        }
    }

    @HostListener('document:keydown.control.shift.l', ['$event']) onCtrlShiftLHandler(event: KeyboardEvent) {
        // Trigger for any table
        event.preventDefault();

        // Check if table is valid
        if (!this.table) {
            this.toasterService.error('テーブルが選択されていません', 'エラー');
            return;
        }

        this.showJsonExportModal();
    }

    /**
     * Ctrl+Shift+Jのショートカットで直接JSONをダウンロードする
     */
    @HostListener('document:keydown.control.shift.j', ['$event']) onCtrlShiftJHandler(event: KeyboardEvent) {
        // Trigger for any table
        event.preventDefault();

        // Check if table is valid
        if (!this.table) {
            this.toasterService.error('テーブルが選択されていません', 'エラー');
            return;
        }

        this.downloadJsonDirectly();
    }

    // カスタムモーダル表示用のプロパティ
    public isJsonExportModalVisible: boolean = false;

    /**
     * JSONエクスポートモーダルを表示する
     * Ctrl+Shift+Lのショートカットで呼び出される
     */
    showJsonExportModal() {
        // Set export options to OFF by default
        this.export_data = false;
        this.export_grant = false;
        this.export_filter = false;
        this.export_notification = false;

        // Prepare query parameters
        const query_params = {
            'dataset_id[]': this.table.replace('dataset__', ''),  // Add dataset_id parameter as string
            export_data: this.export_data.toString(),
            export_notification: this.export_notification.toString(),
            export_grant: this.export_grant.toString(),
            export_filter: this.export_filter.toString(),
            query_string: this.query_string,
        };

        const query_params_string = new URLSearchParams(query_params).toString();
        const final_query_string = query_params_string + (this.query_string ? '&' + this.query_string : '');

        // Get JSON content
        const apiUrl = this._connect.getApiUrl();
        const url = `${apiUrl}/admin/download-json?${final_query_string}`;

        this._connect.get(url).subscribe(
            (data) => {
                this.jsonContent = JSON.stringify(data, null, 2);
                this.isJsonExportModalVisible = true; // カスタムモーダルを表示
            },
            (error) => {
                this.toasterService.error('JSONの取得に失敗しました', 'エラー');
                console.error('Error fetching JSON:', error);
            }
        );
    }

    /**
     * JSONエクスポートモーダルを非表示にする
     */
    hideJsonExportModal() {
        this.isJsonExportModalVisible = false;
    }

    /**
     * JSONコンテンツをクリップボードにコピーする
     */
    copyJsonContent() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.jsonContent)
                .then(() => {
                    this.toasterService.success('JSONがコピーされました', '成功');
                })
                .catch((error) => {
                    console.error('Copy failed:', error);
                    this.toasterService.error('コピーに失敗しました', 'エラー');
                });
        } else {
            this.toasterService.error('ブラウザ未対応のため、コピーに失敗しました。直接コピーを行ってください。', 'エラー');
        }
    }

    /**
     * JSONコンテンツをファイルとしてダウンロードする
     */
    downloadJsonContent() {
        try {
            // テーブル名からdataset__プレフィックスを削除
            let filename = this.table + '.json';

            // JSONデータをBlobに変換
            const blob = new Blob([this.jsonContent], {type: 'text/json'});

            // FileSaverを使用してダウンロード
            FileSaver.saveAs(blob, filename);
            this.toasterService.success('JSONがダウンロードされました', '成功');
        } catch (error) {
            console.error('Download failed:', error);
            this.toasterService.error('ダウンロードに失敗しました', 'エラー');
        }
    }

    /**
     * JSONを直接ダウンロードする
     * Ctrl+Shift+Jのショートカットで呼び出される
     */
    downloadJsonDirectly() {
        // Set export options to OFF by default
        this.export_data = false;
        this.export_grant = false;
        this.export_filter = false;
        this.export_notification = false;

        // Prepare query parameters
        const query_params = {
            'dataset_id[]': this.table.replace('dataset__', ''),  // Add dataset_id parameter as string
            export_data: this.export_data.toString(),
            export_notification: this.export_notification.toString(),
            export_grant: this.export_grant.toString(),
            export_filter: this.export_filter.toString(),
            query_string: this.query_string,
        };

        const query_params_string = new URLSearchParams(query_params).toString();
        const final_query_string = query_params_string + (this.query_string ? '&' + this.query_string : '');

        // Get JSON content
        const apiUrl = this._connect.getApiUrl();
        const url = `${apiUrl}/admin/download-json?${final_query_string}`;

        this._connect.get(url).subscribe(
            (data) => {
                // JSONデータを文字列に変換
                const jsonContent = JSON.stringify(data, null, 2);

                // テーブル名からdataset__プレフィックスを削除
                let filename = this.table + '.json';

                // JSONデータをBlobに変換
                const blob = new Blob([jsonContent], {type: 'text/json'});

                // FileSaverを使用してダウンロード
                FileSaver.saveAs(blob, filename);
                this.toasterService.success('JSONがダウンロードされました', '成功');
            },
            (error) => {
                this.toasterService.error('JSONの取得に失敗しました', 'エラー');
                console.error('Error fetching JSON:', error);
            }
        );
    }


    public isEditModalShown: boolean = false;
    showFormEditModal = (formEditData: FormEditData, data_id: number) => {
        console.log('show form modal')
        this.formEditData = formEditData;
        if (data_id < 1) {
            //新規の場合
            this.child_a_by_id[data_id] = cloneDeep(this.child_a);
            this.formEditData.child_a = this.child_a_by_id[data_id];
            this.editFormFieldModal.show()
            this.isEditModalShown = true;
            return;
        }
        this._connect.get('/admin/view/' + this.table + '/' + data_id).subscribe((data) => {
            this.child_a_by_id[data_id] = cloneDeep(this.child_a);
            if (data['result'] !== 'success') {
                this.toasterService.error(data['error_a'].join(','), 'エラー');
                return;
            }

            this.child_a_by_id[data_id].forEach((child, index) => {
                /*
                if (child.menu.multiple_mode === 'chip_toxi' || child.menu.multiple_mode === 'chip') {
                    child.data_a = data['child_a'][child.table];
                } else {
                    child.data_a = data['raw_child_a'][child.table];
                }
                 */

                child.data_a.forEach((data) => {
                    child.error_a.push({});
                });

                /*
                child.fields.forEach(field => {
                    if (child.forms.byFieldName(field.Field).type === 'richtext') {
                        this.setFroalaOptions(child.forms, field);
                    }
                });

                child.data_a.forEach((data) => {
                    this._share.loadImg(child.fields, child.forms, data)

                    if ((this.is_custom_table_definition || this.is_exist_table_definition) && data.option !== null && data.option !== '') {
                        // データ定義の場合
                        try {
                            data.option = JSON.parse(data.option);
                        } catch (e) {
                            data.option = {}
                            //console.time('JSON parse error')
                        }
                    } else {
                        data.option = {}
                    }
                });
                 */
            });

            this.editFormFieldModal.show()
            this.isEditModalShown = true;
        });
    };

    onHiddenEditModal() {
        //console.time('onhidden')
        this.formEditData = new FormEditData();
        this.isEditModalShown = false;
    }

    closeFormEditModal = () => {
        this.editFormFieldModal.hide();
        this.isEditModalShown = false;
    }

    checkDirty = () => {
        //console.time('checkDirty:');
        if (!!!this.data_a || !!!this.original_data_a) {
            return false;
        }
        if (this.data_a.length != this.original_data_a.length) {
            return true;
        }
        return this.data_a.some((data, index) => {
            return JSON.stringify(data.raw_data) != JSON.stringify(this.original_data_a[index].raw_data);
        });
        //console.timeEnd('checkDirty:');
    }

    onEditModalChangeEnd($event) {
        this.data_a[$event.data_index] = $event.data;
        this.child_a_by_id[this.data_a[$event.data_index].raw_data['id']] = $event.child_a;

        if (this.hasRequiredError($event.data_index) && false) {
            this.onFormatViewData({
                data_index: $event.data_index,
                field: $event.field,
                form: $event.form,
                raw_data: $event.data[$event.field.Field]
            });
        } else {
            if (!this.isEditMode) {
                this.saveData($event.field, $event.form, $event.child_a, $event.data_index, $event.data);
            } else {
                this.editted_row_index_a.push($event.data_index)
                this.editFormFieldModal.hide();
            }
        }
    }


    private editted_row_index_a: Array<number> = [];

    onCellDataChanged($event) {
        console.time('onCellDataChanged:');
        const _this = $event.adminComponent;
        _this.editted_row_index_a.push($event.data_index)
        if (_this.hasRequiredError($event.data_index)) {
            _this.onFormatViewData({
                data_index: $event.data_index,
                field: $event.field,
                form: $event.form,
                raw_data: $event.value
            });
        } else if (!this.isEditMode) {
            _this.saveData($event.field, $event.form, $event.child_a, $event.data_index, $event.value)
        }
        //console.timeEnd('onCellDataChanged:');
    }


    saveData(field, form, child_tableinfo_a: Array<TableInfo>, data_index, value) {
        let mode = (this.data_a[data_index].raw_data['id'] < 1) ? 'add' : 'edit';
        let post_data = this._share.get_post_data(this.table_info, this.data_a[data_index], this.fields, this.table_info.forms, child_tableinfo_a, mode)

        if (form.required && !form.is_multi_value_mode) {
            if (!!!value && value !== 0) {
                this.toasterService.error(`${form.label}が入力されていません。`, 'エラー');
                return;
            }
        }

        let url = `/admin/edit/column/${this.table}/${this.data_a[data_index].raw_data['id']}`;
        if (mode == 'add') {
            url = `/admin/edit/column/${this.table}/0`;
        }

        return this._connect.postUpload(url, post_data).subscribe((jsonData) => {
            let _data: Data = this.data_a[data_index];
            _data.setInstanceData(jsonData['data'])


            //raw_data.id = jsonData['raw_data']['id'];
            this.toasterService.success('データが保存されました。', 'お知らせ');
            if (!!this.editFormFieldModal) {
                this.editFormFieldModal.hide()
            }

            if (mode == 'add') {
                //if new data, edit delete grant is added
                let grant = new DataGrant();
                grant.setAllGrant(true);
                _data.setInstanceData({
                    'grant': grant
                })
            }
            this.data_a[data_index] = _data;
            this.selectedCellId = null;
        }, (jsonData) => {
            let error_a = {'_child_a': {}}
            let body = this._share.getErrorBodyByResponse(jsonData.error.error_a, child_tableinfo_a, {});
            //let errors = Object.keys(jsonData.error.error_a).map(k => jsonData.error.error_a[k]).reduce((accumulator, current) => (accumulator + current));
            this.toasterService.error(body, 'エラー');
        });

    }


    onUpDown(): void {
        this.reload();
        this.load(this.page, false);
        if (this.table === 'dataset') {
            this._share.loadAdminDatas()
        }
    }

    onFormatViewData($event): void {
        if (!['image', 'file'].includes($event.field.Type)) {
            let formData = new FormData();
            if ($event.raw_data == null) {
                formData.append($event.field.Field, '');
            } else {
                formData.append($event.field.Field, $event.raw_data);
            }
            this._connect.postUpload(`/admin/format/data/${this.table}`, formData).subscribe((jsonData) => {
                this.data_a[$event.data_index].view_data[$event.field.Field] = jsonData['view_data'][$event.field.Field]
            });
        }
    }

    hasRequiredError(data_index: number): boolean {
        return this.table_info.fields.some(field => {
            return (this.table_info.forms.byFieldName(field.Field).required && !!!this.data_a[data_index].raw_data[field.Field] && this.data_a[data_index].raw_data[field.Field] !== 0);
        });
    }


    searchAll(event): void {
        // 入力がない場合、処理を行わない
        if (!this.all_search_text)return;

        this.loading = true;
        if (!this.customFilter) {
            this.customFilter = new CustomFilter({'table': this.table});
            this.customFilter.setAsTable()
        }
        if (this.customFilter.conditions.condition_a.length > 0) {
            if (this.customFilter.conditions.condition_a.length == 1 && this.customFilter.conditions.condition_a[0].value == this.all_search_text && !this.embedMode) {
                this.all_search_text = null;
                this.load(this.page)
                return
            }
            else if (this.lookupformParam) {
                this.customFilter.conditions.addConditionToAllAndGroup('inc', '_all', this.all_search_text);
            }
            else if (this.customFilter.conditions.condition_a.length >= 1 || this.customFilter.conditions.condition_a[0].value != this.all_search_text) {

                this.customFilter.conditions.deleteAllConditions();
            }
        }
        this.customFilter.conditions.addConditionToAllSearchGroup(this.all_search_text);
        // this.customFilter.conditions.addConditionToAllAndGroup('inc', '_all', this.all_search_text);
        this.all_search_text = null;
        if (this.searchInputElement) this.searchInputElement.nativeElement.value = '';
        this.reloadPageByCustomFilter(this.customFilter, true)

    }


    toEditMode() {

        this.loading = true;
        this.isEditMode = true;
        this.editted_row_index_a = [];
        setTimeout(() => {
            this.loading = false;
        }, 50)
        //console.time('toEdit')
    }

    ctrlClickEvent($event) {
        this.toEditMode();
    }

    exitEditMode(commit: boolean) {
        if (commit) {
            this.exitEditModeModal.show();
        } else {
            this.cancelEditModeModal.show();
        }
    }

    addSelectedToDelete() {
        this.to_delete_commit = [...this.to_delete_commit, this.data_a[this.selectedRowIndex].raw_data['id']];
        this.data_a.splice(this.selectedRowIndex, 1);
        this.deleteModal.hide();
    }

    addCheckedToDelete() {
        let to_deletes = this.checked_id_a.map((del_id) => this.data_a.findIndex((data) => data.raw_data['id'] == del_id));
        to_deletes.sort((a, b) => b - a);
        to_deletes.forEach(element => {
            this.data_a.splice(element, 1);
        });
        this.to_delete_commit = [...this.to_delete_commit, ...this.checked_id_a];
        this.checked_id_a = [];
        this.deleteCheckedConfirmModal.hide();
    }

    onSelectRowIndex(index) {
        this.selectedRowIndex = index;
    }


    duplicateSelectedIndex() {
        let newObj = this.data_a[this.selectedRowIndex].getCopy();
        newObj.setRawData({'id': null})
        newObj.id = null;
        console.log(newObj)

        //newObj.raw_data['id'] = this.emptyObjId;
        //newObj.view_data['id'] = this.emptyObjId;
        this.data_a.splice(this.selectedRowIndex + 1, 0, newObj);
        //this.emptyObjId--;
    }


    commit() {
        let view_fields = this.table_info.getViewFields(this.getMergedCustomFilter(), this._share.isMasterUser(), this.isSummarizeMode, false, true)
        //add id field
        let id_field = this.table_info.forms.byFieldName('id').field
        //check if id field is already in view fields
        if (!view_fields.some(field => field['Field'] == 'id')) {
            view_fields.push(id_field)
        }

        // Extract field names for update_fields parameter, excluding fields with __PIGEON_IGNORE__
        let field_names = view_fields.map(field => field['Field']);

        let commit_data = this._share.getCommitData(this.table_info, this.data_a, view_fields, this.table_info.forms, this.editted_row_index_a, this.to_delete_commit)

        // Add update_fields to FormData
        field_names.forEach((field_name, index) => {
            commit_data.append(`update_fields[${index}]`, field_name);
        });

        let url = `/admin/${this.table_info.table}/commit`;
        this.sending = true;
        this._connect.postUpload(url, commit_data).subscribe((jsonData) => {
            if (jsonData['warning_a'].length > 0) {
                this.toasterService.warning(jsonData['warning_a'].join('\n'), '警告')
            }
            this.toasterService.success('データが保存されました。', 'お知らせ');
            this.resetEditParam()
            this.reload();
        }, (jsonData) => {
            let error_message = this._share.getErrorBodyByResponse(jsonData['error'].error_a);
            this.toasterService.error(error_message, 'エラー');
        }).add(() => {
            this.sending = false;
            this.exitEditModeModal.hide()
        });
    }

    private resetEditParam() {
        this._share.resetTableInfoCache()
        this.editted_row_index_a = [];
        this.to_delete_commit = [];
        this.isEditMode = false;

    }

    cancelEdit() {
        this.cancelEditModeModal.hide()
        this.resetEditParam()
        this.reload();

    }

    adminTreeEvent(tree_event) {
        console.log(tree_event)
        if (tree_event['group_edit_data']) {
            this.group_edit_data = tree_event['group_edit_data'];
            this.is_group_edit = true;
        }
    }

    groupEdit() {
        if (this.switchGroupEdit) {
            // console.log('group_edit_data');
            // console.log(this.group_edit_data);
            let order_count = 1;
            let error_group = {'required': false, 'length': false}
            const MAX_NAME_LENGTH: number = 20;
            const MAX_DEPTH2_NAME_LENGTH: number = 18;
            let length_error = [];
            if (this.is_group_edit) {
                console.log(this.group_edit_data)
                for (let i = 0; i < this.group_edit_data.length; ++i) {
                    if (this.group_edit_data[i]['group'] == undefined) {
                        this.group_edit_data_a[order_count - 1] = {};
                        this.group_edit_data_a[order_count - 1]['order'] = order_count;
                        this.group_edit_data_a[order_count - 1]['id'] = this.group_edit_data[i]['_raw_data']['id'];
                        this.group_edit_data_a[order_count - 1]['previousGroup'] = this.group_edit_data[i]['_raw_data']['group'];
                        this.group_edit_data_a[order_count - 1]['previousGroupId'] = this.group_edit_data[i]['_raw_data']['dataset_group_id'];
                        this.group_edit_data_a[order_count - 1]['currentGroup'] = null;
                        this.group_edit_data_a[order_count - 1]['isChangeGroup'] = this.group_edit_data[i]['_raw_data']['group'] === null ? false : true;
                        this.group_edit_data_a[order_count - 1]['isChangeOrder'] = this.group_edit_data[i]['_raw_data']['order'] == order_count ? false : true;
                        order_count++;
                    } else {
                        if (this.group_edit_data[i]['formControl'].value == '') {
                            error_group['required'] = true;
                        }

                        if (this.group_edit_data[i]['formControl'].value.includes('////')) {
                            let first_stage, second_stage;
                            first_stage = this.group_edit_data[i]['formControl'].value.split('////')[0];
                            second_stage = this.group_edit_data[i]['formControl'].value.split('////')[1];
                            // "////"が複数回使われていないか
                            if (this.group_edit_data[i]['formControl'].value.split('////').length - 1 >= 2) {
                                error_group['length'] = true;
                                length_error.push('1つの入力欄につき\'////\'は一度しか使用できません。');
                            }

                            // 空白か判定
                            if (first_stage == '') {
                                error_group['length'] = true;
                                length_error.push('1段目グループが未入力です。');
                            }
                            if (second_stage == '') {
                                error_group['length'] = true;
                                length_error.push('2段目グループが未入力です。');
                            }

                            // 字数制限
                            if (first_stage.length > MAX_NAME_LENGTH) {
                                error_group['length'] = true;
                                length_error.push('1段目グループ名は' + MAX_NAME_LENGTH + '文字までです。');
                            }
                            if (second_stage.length > MAX_DEPTH2_NAME_LENGTH) {
                                error_group['length'] = true;
                                length_error.push('2段目グループ名は' + MAX_DEPTH2_NAME_LENGTH + '文字までです。');
                            }
                        } else {
                            if (this.group_edit_data[i]['formControl'].value.length > MAX_NAME_LENGTH) {
                                error_group['length'] = true;
                                length_error.push('1段目グループ名は' + MAX_NAME_LENGTH + '文字までです。');
                            }
                        }
                        let group_data = this.group_edit_data[i]
                        group_data['data_a'].forEach(data => {
                            if (data['group'] == undefined) {
                                this.group_edit_data_a[order_count - 1] = {};
                                this.group_edit_data_a[order_count - 1]['order'] = order_count;
                                this.group_edit_data_a[order_count - 1]['id'] = data['_raw_data']['id'];
                                this.group_edit_data_a[order_count - 1]['previousGroup'] = data['_raw_data']['group'];
                                this.group_edit_data_a[order_count - 1]['previousGroupId'] = data['_raw_data']['dataset_group_id'];
                                this.group_edit_data_a[order_count - 1]['currentGroup'] = group_data['formControl']['value'];
                                this.group_edit_data_a[order_count - 1]['currentGroupId'] = group_data['group_id'];
                                this.group_edit_data_a[order_count - 1]['isChangeGroup'] = data['_raw_data']['group'] == this.group_edit_data[i]['formControl']['value'] ? false : true;
                                this.group_edit_data_a[order_count - 1]['isChangeOrder'] = data['_raw_data']['order'] == order_count ? false : true;
                                order_count++;
                            } else {
                                data['data_a'].forEach(data_one => {
                                    this.group_edit_data_a[order_count - 1] = {};
                                    this.group_edit_data_a[order_count - 1]['order'] = order_count;
                                    this.group_edit_data_a[order_count - 1]['id'] = data_one['_raw_data']['id'];
                                    this.group_edit_data_a[order_count - 1]['previousGroup'] = data_one['_raw_data']['group'];
                                    this.group_edit_data_a[order_count - 1]['previousGroupId'] = data_one['_raw_data']['dataset_group_id'];
                                    this.group_edit_data_a[order_count - 1]['currentGroup'] = data['formControl']['value'];
                                    this.group_edit_data_a[order_count - 1]['currentGroupId'] = this.group_edit_data[i]['group_id'];
                                    this.group_edit_data_a[order_count - 1]['isChangeGroup'] = data_one['_raw_data']['group'] == data['formControl']['value'] ? false : true;
                                    this.group_edit_data_a[order_count - 1]['isChangeOrder'] = data_one['_raw_data']['order'] == order_count ? false : true;
                                    order_count++;
                                });
                            }
                        });
                    }
                }
                if (error_group.length) {
                    for (let i = 0; i < length_error.length; i++) {
                        this.toasterService.error(length_error[i], 'エラー');
                    }
                }
                if (error_group.required) {
                    this.toasterService.error('未入力のグループが存在します。', 'エラー');
                }
                if (!error_group.length && !error_group.required) {
                    this.changeGroup(this.group_edit_data_a);
                    // console.log('this.edit_group');
                    // console.log(this.group_edit_data_a);
                }
            } else {
                this.switchGroupEdit = false;
            }
        } else {
            this.switchGroupEdit = true;
            // console.log('group_edit_data_last');
            // console.log(this.group_edit_data);

        }
    }

    groupEditCancel() {
        this.toasterService.success('グループ編集をキャンセルしました。', '成功');
        this.switchGroupEdit = false;
        this.load(this.page);
    }

    changeGroup(change_data) {
        const url = this._connect.getApiUrl() + '/admin/group-edit/dataset';
        this._connect.post(url, {group_edit_data_a: change_data}).subscribe((data: any) => {
            this.toasterService.success('グループ名を変更しました。', '成功');
            // page refresh
            location.reload();
        });
    }

    onChangeSearchValue($event) {
        if (!this.customFilter) {
            this.customFilter = new CustomFilter({'table': this.table});
            this.customFilter.setAsTable()
        }
        if ($event.condition_id ){
            this.customFilter.conditions.replaceConditionById( $event.condition_id, $event.prev_condition )
        }else{
            this.customFilter.conditions.addCondition($event.is_inc ? 'inc' : 'eq', $event.field, $event.value, undefined, $event.list_date_time_search_with_no_time);
        }
        this.reloadPageByCustomFilter(this.customFilter)

    }

    // to disable remove search condition
    // when user type is not master in notification page
    disableIsNotMasterUser(){
        if (this.original_get_params['where_from'] == 'dataset' && !this._share.isMasterUser()) return true;
        return false;
    }

    deleteCondition(condition: Condition) {
        if(this.disableIsNotMasterUser()) return;
        // old code start
        // this.customFilter.conditions.deleteConditionById(condition.id);
        // this.reloadPageByCustomFilter(this.customFilter);
        // old code end


        // test change start
        // i tried to reset it to delete filter after last one
        this.customFilter.conditions.deleteConditionById(condition.id);
        if (this.customFilter.conditions.condition_a.length >= 1) {
            this.reloadPageByCustomFilter(this.customFilter);
        } else {
            localStorage.removeItem(`fixed-field-name-${this.customFilter.id}`)
            this.userTableSetting.filter_id = null;
            this.customFilter = null;
            if (this.embedMode) {
                this.reloadPageByCustomFilter(this.customFilter);
                return;
            }
            this._router.navigate([this._share.getAdminTable(), this.table, {'ts': (new Date()).getTime()}]);
        }
        // test change end
        // this.resetSearch();

    }

    reloadPage() {
        this.loadList();
    }

    gotoSetting() {
        if (!this.table_info.isDatasetTable()) {

            this._share.getTableInfo('dataset').subscribe(_table_info => {
                let filter = new CustomFilter();
                filter.conditions = new Conditions()
                filter.conditions.addCondition('eq', 'system_table', 'admin')
                this._connect.getList(_table_info, 1, Number.MAX_SAFE_INTEGER, filter).subscribe(res => {
                    if (res['data_a'].length > 0) {
                        this._router.navigate([this._share.getAdminTable(), 'dataset', 'edit', res['data_a'][0]['raw_data']['id']]);
                        return;
                    }

                    //まだそのsystem tableのdatasetがない時
                });
                //this._router.navigate([this._share.getAdminTable(), 'dataset', 'edit', 'new', this.table_info.table]);
            })

            return;
        }
        this._router.navigate([this._share.getAdminTable(), 'dataset', 'edit', this.table_info.getDatasetId()]);

    }

    isChartMode() {
        return this.customFilter && this.customFilter.type == 'chart';
    }

    isSearchMode() {
        return this.customFilter && !this.customFilter.isSetSummarizeParam() && this.customFilter.isSetSearchParam()
    }

    onCloseChartModal($event, onSave = false) {
        //this.saveFilter(true)
        this.chartModal.hide();
        if (onSave) {

            if ($event.customFilter.isFilter(true)) {
                if (this.customView && this.customView.id == $event.customFilter.id) {
                    this.customView = null
                }
                this.customFilter = $event.customFilter;
                this.customFilter.conditions.reloadViewValuesTmp(this.table_info, this._connect, this._share)
            } else {
                if ($event.customFilter.list_use_show_fields) {
                    if (this.customFilter && this.customFilter.id == $event.customFilter.id) {
                        this.customFilter = null
                    }
                    this.customView = $event.customFilter;
                    this.customView.conditions.reloadViewValuesTmp(this.table_info, this._connect, this._share)
                }
            }
            let _filter: CustomFilter = this.getFilterByFilterType(this.modalFilterType);

            this.toasterService.success('フィルタを保存しました。', '成功');
            this.chartTitleModal.hide();
            this.confirmFilterOverwriteConfirmModal.hide();
            this._share.getTableInfo(this.table, false, null, false).subscribe(_table_info => {
                this.table_info = _table_info;
                // this.reloadPageByCustomFilter(_filter)
                this.reloadWithFilter()
                // this._router.navigate([this._share.getAdminTable(), this.table, {'_filter_id': this.customFilter.id, 't': (new Date()).getTime()}]);
            })
            //this.reload();
            //this._router.navigate([this._share.getAdminTable(), this.table, {'_filter_id': this.filter_id}]);
        }
    }

    getEmbedScriptTag() {
        let filter_id = '';
        if (this.customFilter && this.customFilter.id) {
            filter_id = this.customFilter.id.toString()
        } else if (this.customView && this.customView.id) {
            filter_id = this.customView.id.toString()
        }
        return '<script id="pigeon_script" src="' + this._connect.getSiteUrl() + '/widget/embed.js" data-table="' + this.table + '" data-hash="' + this.public_form_hash + '" data-filter="' + filter_id + '"></script>';
    }

    copyPublicFormUrl() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.public_form_url);
            this.toasterService.success('クリップボードにコピーしました', '成功');
        } else {
            this.toasterService.error('ブラウザ未対応のため、コピーに失敗しました。直接コピーを行ってください。', 'エラー');

        }
    }

    openPublicFormUrl() {
        window.open(this.public_form_url);

    }


    copyEmbedScriptTag() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.getEmbedScriptTag());
            this.toasterService.success('クリップボードにコピーしました', '成功');
        } else {
            this.toasterService.error('ブラウザ未対応のため、コピーに失敗しました。直接コピーを行ってください。', 'エラー');

        }
    }

    public public_form_url: string = '';
    public public_form_hash: string = '';

    showEmbedLink() {
        this.getPublicFormData().subscribe(() => {
            this.embedModal.show();
        })
    }

    getPublicFormData(): Observable<any> {
        return new Observable(observer => {

            const url = this._connect.getApiUrl() + '/admin/public_form_url';
            let params = {'table': this.table}
            if (this.customFilter && this.customFilter.id) {
                params['filter_id'] = this.customFilter.id
            } else if (this.customView && this.customView.id) {
                params['filter_id'] = this.customView.id
            }
            this._connect.post(url, params).subscribe((res) => {
                this.public_form_url = res['url'].replace(/\/$/, '')
                this.public_form_hash = res['hash']
                observer.next();
            })
        });


    }


    showPublicFormLink() {

        if (!this.customFilter || !this.customFilter.id || this.customFilter.isFilter(false)) {
            //this.customFilter = new CustomFilter({});
            if (!this.customView) {
                this.toasterService.warning('公開ページを作成するには、公開ページ用のビューを追加・選択して下さい。', 'エラー');
                return;
            }
        }
        this.getPublicFormData().subscribe(() => {
            this.publicFormModal.show();
        })
    }

    showPublicFormEmailLink() {
        if (!this.customFilter || !this.customFilter.id || this.customFilter.isFilter(false)) {
            //this.customFilter = new CustomFilter({});
            if (!this.customView) {
                this.toasterService.error('公開ページを作成するには、公開ページ用のビューを追加・選択して下さい。', 'エラー');
                return;
            }
        }
        this.getPublicFormData().subscribe(() => {
            this.mailPublicFormModal.show()
        })
    }

    getConditionTableInfo(condition: Condition): Observable<TableInfo> {
        return new Observable(observer => {


            if (condition.sub_fields.length > 0) {
                this._share.getTableInfo(condition.sub_fields[condition.sub_fields.length - 1]['table']).subscribe(_table_info => {
                    observer.next(_table_info)
                })

                return;
            } else {
                observer.next(this.table_info)
            }
        });
    }

    variableChanged($event, variable: Variable) {
        variable.value = $event.value;
        this.reloadPage()

    }


    conditionValueChanged() {
        this.reloadPage()
    }

    onSubmitAdminTableSetting() {
        this.tableSettingModal.hide();
        this.toasterService.success('テーブル設定を変更しました', '成功');
    }

    onImportLedger() {
        this._share.resetTableInfoCache()
        this.load(this.page);
        this.checked_id_a = [];
        this._share.loadAdminDatas();
    }

    private selectedLedger: Ledger;
    private selectedLedgerCheckedArray: Array<number> = []

    exportCheckedLedger(ledger: Ledger) {
        this.selectedLedger = ledger;
        this.selectedLedgerCheckedArray = this.checked_id_a;
        this.exportCheckedLedgerModal.show()
    }


    dlCheckedLedger(ledger: Ledger) {
        this.selectedLedger = ledger;
        this.selectedLedgerCheckedArray = this.checked_id_a;
        if (this.checked_id_a.length > 100) {
            this.toasterService.error('帳票一括DLの上限レコードは100個です。', 'エラー');
            return;
        }
        this.downloadingLedger = true;
        this._connect.post('/admin/ledger/dl-all',
            { ledger_id: this.selectedLedger.id, id_a: this.selectedLedgerCheckedArray },
            { responseType: 'blob' }  // blobとして受け取る
        ).subscribe(
            (data: Blob) => {
                const blob = new Blob([data], { type: 'application/zip' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `ledger_${this.selectedLedger.id}_${new Date().toISOString().slice(0, 10)}.zip`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.checked_id_a = [];
                this.toasterService.success('帳票ダウンロード完了。', '成功');
                this.downloadingLedger = false;
                this.exportCheckedLedgerModal.hide();
            },
            error => {
                console.error('Download failed:', error);
                this.toasterService.error('ダウンロードに失敗しました。', 'エラー');
                this.downloadingLedger = false;
            }
        );
    }

    exportLedgerConfirm(ledger: Ledger) {
        this.selectedLedger = ledger;
        this.selectedLedgerCheckedArray = [];
        this.exportLedgerAllModal.show();
    }


    exportLedger() {
        this._connect.post('/admin/ledger/export-all', {ledger_id: this.selectedLedger.id, id_a: this.selectedLedgerCheckedArray}).subscribe(res => {
            this.checked_id_a = []
            this.toasterService.success('帳票一括出力をリクエストしました。時間がかかる場合があります。', '成功');
            this.exportLedgerAllModal.hide();
            this.exportCheckedLedgerModal.hide();
        })
    }

    openPigeonAi() {
        this.pigeonAiModal.show();

    }

    openAnalyticsAi() {
        this.openAnalyticsAiModal.show();

    }


    viewmodalopen(evt) {
        this.selectDataById(evt.id)
    }

    selectDataById(data_id) {
        this._connect.get('/admin/view/' + this.table_info.table + '/' + data_id).subscribe((_data) => {


            this.selectedData = new Data(this.table_info)
            this.selectedData.setInstanceData(_data['data']);
            this._share.setCurrentData(this.selectedData, this.table_info);

            this.viewModal.show()

        });
    }

    viewmodalhide() {
        history.replaceState({}, null, document.location.pathname)
        this.viewModal.hide()
    }

    openTableSettingModal() {
        this.tableSettingModal.show()
    }

    openDeliverEmail() {


    }

    public is_memo_open: boolean = false;
    onOpenCloseMemo($event) {
        this.dynamicOverflowService.accordionChanged(this.userTableSetting.open_memo)
        setTimeout(() => {
            if (document.querySelector('#memo')) {
                this.memo_height = document.querySelector('#memo').clientHeight
            }
        }, 50)

        this.is_memo_open = $event.status == 'open';


    }

    public duplicate_hash: Object = {}

    //duplicate Modal
    openDuplicateModal($event) {
        let _duplicate_data: Data = $event.duplicate_data;
        this.duplicate_hash = {
            'dataset_id': _duplicate_data.getRawData('id'),
            'label': _duplicate_data.getRawData('label') + 'のコピー',
            'group': _duplicate_data.getRawData('group'),
            'copy_grant': false,
            'copy_notification': false,
            'copy_filter': false,

        }
        this.duplicateModal.show();
    }

    copyTable() {
        this.loading = true;

        this._connect.post('/api/admin/table/duplicate', this.duplicate_hash).subscribe(_data => {

            this._share.loadAdminDatas().then(() => {
                this.toasterService.success('テーブルをコピーしました', '成功');
                this.duplicateModal.hide();
                this.reload()
            });


        }, (error) => {
            this.loading = false;
        })

    }

    private selected_unlock_data: Data;

    openUnlockModal($event) {

        if (this._share.isMasterUser()) {
            this.selected_unlock_data = $event.data;
            this.unlockModal.show()
        }
    }

    unlock() {
        if (this._share.isMasterUser()) {
            this._connect.post('/admin/' + this.table + '/' + this.selected_unlock_data.getRawData('id') + '/finish-edit', {}).subscribe(_res => {
                this.sending = false;
                this.unlockModal.hide()
                this.toasterService.success('ロックを解除しました', '成功');
                this.reload()
            })
        }
    }

    isAllDataDelable(): boolean {
        if (this.checked_id_a.length == 0) {
            return null;
        }

        let flg: boolean = true;

        let data_a = this.data_a.filter(_data => {
            return this.checked_id_a.indexOf(parseInt(_data.getRawData('id'))) >= 0;
        });
        data_a.forEach(_data => {
            flg &&= _data.isDeletable() || _data.getRawData('delete_lock') === 'false';
        });
        return flg;
    }

    public index_workflow_param: {
        workflow_status: string,
        data_a: Array<Data>
    } = {workflow_status: null, data_a: []}


    isAllDataAssigned(): boolean {
        if (this.checked_id_a.length == 0) {
            return null;
        }

        let flg: boolean = true;

        let data_a = this.data_a.filter(_data => {
            return this.checked_id_a.indexOf(parseInt(_data.getRawData('id'))) >= 0;
        })

        data_a.forEach(_data => {
            flg &&= _data.workflow.is_assigned;
        })
        return flg;

    }

    isAllDataMyApplying(): boolean {
        if (this.checked_id_a.length == 0) {
            return null;
        }

        let flg: boolean = true;

        let data_a = this.data_a.filter(_data => {
            return this.checked_id_a.indexOf(parseInt(_data.getRawData('id'))) >= 0;
        })


        data_a.forEach(_data => {
            flg &&= _data.getRawData('admin_id') == this._share.user.id && _data.workflow && !_data.workflow.isEnd();
        })
        return flg;

    }

    public workflowAll(workflow_status: string) {
        let data_a = this.data_a.filter(_data => {
            return this.checked_id_a.indexOf(parseInt(_data.getRawData('id'))) >= 0;
        })
        this.index_workflow_param = {
            workflow_status: workflow_status,
            data_a: data_a
        }
        this.indexWorkflowModal.show()
    }

    public onCompleteWorkflowStatusChange() {
        this.indexWorkflowModal.hide();
        this.toasterService.success('ワークフローステータスの変更に成功しました')
        this.reload()

    }

    public uploadFilesByZip(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template, this.config);
    }

    public upload_zip_submit() {
        this.loading = true;
        if (this.fileName === '') {
            return;
        }

        for (const key in this.table_info.forms['_forms']) {
            if (['image', 'file'].includes(this.table_info.forms['_forms'][key]['_type'])) {
                let is_multi = this.table_info.forms['_forms'][key]['_is_multi_value_mode'] ? this.table_info.forms['_forms'][key]['_is_multi_value_mode'].toString() : 'false';
                if (is_multi == 'true') {
                    var multi_field_name = this.table_info.forms['_forms'][key]['_field']['Field'];
                } else {
                    var single_field_name = this.table_info.forms['_forms'][key]['_field']['Field'];
                }
            }
        }

        const url = this._connect.getApiUrl() + '/admin/upload-files-as-zip';

        const formData: FormData = new FormData();
        formData.append('zip', this.file, this.fileName);
        formData.append('file_name', this.fileName);
        formData.append('table_name', this.table);
        formData.append('multi_field_name', multi_field_name);
        formData.append('single_field_name', single_field_name);

        this._connect.postUpload(url, formData).subscribe((response) => {
            this.reloadPage();
        }, (error) => {
            this.loading = false;
            alert(error.error.error_a[0]);
        })

        this.modalRef.hide();
    }

    public onFileSelected(event) {
        const file: File = event.target.files[0];
        if (file.size > this._share.getMaxUploadZipFilesizeMB() * 1024 * 1024) {
            this.toasterService.error('ファイルサイズが' + this._share.getMaxUploadZipFilesizeMB() + 'MBを超えています。分割してアップロードしてください', 'エラー');
            event.target.value = "";
            return;
        }
        if (file) {
            this.fileName = file.name;
            this.file = file;
        }
    }




    public createEmailTempate() {
        let key_a = ['PUBLIC_FORM']
        key_a.push(this.table)
        if (this.customView) {
            key_a.push(this.customView.id.toString())
        } else if (this.customFilter) {
            key_a.push(this.customFilter.id.toString())
        } else {
            key_a.push('null')
        }
        key_a.push(this.mail_public_form_option.use_data_related_form ? 'true' : 'false')
        let tag = 'https://[' + key_a.join(':') + ']';
        let body = 'test\n' + tag + 'test\n'
        body = `下記URLから回答をお願い致します。\n\n${tag}`
        let params = {
            'body': body,
            'body_html': body.replace(/'n/, '<br>')
        }

        this._router.navigate([this._share.getAdminTable(), 'mail_templates', 'edit', 'new', params], {replaceUrl: true});

    }


    onViewGrantGroupIdChanged($event: Object) {
        this.customFilter.view_grant_group_id = $event['id'];

    }

    onEditGrantGroupIdChanged($event: Object) {
        this.customFilter.edit_grant_group_id = $event['id'];

    }

    goToEdit() {
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', this.selectedData.getId()]);
    }

    goToNotiPage(hasFilter = false) {
        const params = {};
        if (hasFilter) {
            // this.tableと通知設定とリマインド設定がされているフィルターをかけて通知テーブルに遷移
            let filter = new CustomFilter();
            filter.conditions = new Conditions()
            filter.conditions.addCondition('eq', 'table', this.table)
            filter.table = "notification";
            filter.setAsTable();
            params['filter_params'] = JSON.stringify(filter.getFilterParam());
            params['where_from'] = 'dataset';
            params['condition_json'] = filter.conditions.getSearchParamJson();
            params['notification_for'] = this.table;
            delete params['page'];
        }
        this._router.navigate([this._share.getAdminTable(), 'notification', params]);
    }

    getTableMinHeight() {
        return (50 + (Math.min(this.data_a.length, 10) * 37))
    }


    openUpdateAllmodal() {
        let all_checkbox = document.querySelector('th.table-admin-list__checkbox input') as HTMLInputElement;
        if (all_checkbox.checked) {
            this.checked_all = true;
        } else {
            this.checked_all = false;
        }
        this.editAllModal.show();
    }


    private changeFieldWidthPost: Object = {}
    public onConfirmFieldWidthText = '';

    onConfirmChangeAllFieldWidth($event) {
        this.changeFieldWidthPost = $event.post
        this.confirmSaveWidthModal.show();
        if (this.customFilter && this.customFilter.id) {
            this.changeFieldWidthPost['filter_id'] = this.customFilter.id
            this.onConfirmFieldWidthText = 'このフィルタの幅を現在の幅に設定します。よろしいですか？（全ユーザーに影響があります。）';
        } else {
            this.onConfirmFieldWidthText = '全ユーザーに影響があります。よろしいですか？';
        }

    }

    saveCurrentColumnWidth() {

        this.sending = true;
        this._connect.post('/admin/set-all-field-width', this.changeFieldWidthPost).subscribe(res => {
            this.sending = false;
            this.toasterService.success(res.message)
            this.confirmSaveWidthModal.hide();
            this.clear_header_style = !this.clear_header_style;
        })


    }

    new_with_copy(data) {
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', 'new', {ref: data.raw_data['id']}]);
    }


    private force_logout_id: number = null;

    forceLogoutClick($event) {
        console.log($event)
        this.force_logout_id = $event.admin_id;
        this.forceLogoutModal.show()
    }

    forceLogout() {
        this.sending = true;
        this._connect.post('/admin/force-logout', {id: this.force_logout_id}).subscribe(res => {
            this.sending = false;
            this.toasterService.success('強制ログアウトに成功しました')
            this.forceLogoutModal.hide();
        }, (error) => {
            this.sending = false;
        });
    }


    onSuccessByPigeonAi($event) {
        if ($event.action == 'new_table') {
            this.toasterService.success('作成に成功しました')
            this._share.loadAdminDatas();
        } else if ($event.action == 'search') {
            let customFilter = new CustomFilter($event.filter);
            if (customFilter.isSetSearchParam()) {
                this.customFilter = customFilter;
                this.onPageChange(1)
            }
        } else {
            let customFilter = new CustomFilter($event.filter);
            if (customFilter.isSetSummarizeParam()) {
                this.customFilter = customFilter;
                this.onPageChange(1)
            } else {
                this.toasterService.error('集計に失敗しました。依頼の仕方を変えることで成功する場合があります。')
            }

        }

    }

    onErrorByPigeonAi($event) {
        console.log($event.error)
        if ($event.error.length > 0 && $event.error[0].match(/最大/)) {
            this.toasterService.error($event.error[0])
            return;

        }
        if ($event.action == 'new_table') {
            this.toasterService.error('作成に失敗しました。再度作成することで成功する場合があります。')
        } else {
            this.toasterService.error('検索に失敗しました。再度実行することで成功する場合があります。')

        }
    }

    onSuccessByAnalyticsAi($event) {
        this.toasterService.success('AIによる分析をリクエストしました。リクエストログのメニューからステータスが確認出来ます')
        this._share.loadAdminDatas();
    }
    onErrorByAnalyticsAi($event) {
        console.log($event.error)
        if ($event.error.length > 0 && $event.error[0].match(/最大/)) {
            this.toasterService.error($event.error[0])
            return;

        }
    }

    isOem() {
        return this._share.cloud_setting && this._share.cloud_setting['use_analytics_ai'] === 'true';
    }

    onAnalyticsAiFlg(){
        const use_analytics_ai = this._share.cloud_setting && this._share.cloud_setting['use_analytics_ai'] === 'true';
        if(!use_analytics_ai) return false;
        for(let i = 0; i < this.table_info.fields.length; i++) {
            if(this.table_info.fields[i].Name === '要望') {
                this.analytics_flg = true;
                break;
            }
            this.analytics_flg = false;
        }

        return this.analytics_flg;
    }

    onSokenshaFtpFlg() {
        const sokensha_db_name_a = ['sokensha', 'sokensha-test', 'pigeon_test'];
        const db_name_flg = sokensha_db_name_a.includes(this._share.db_name);

        const ftp_table_name_a = ['dataset__22', 'dataset__41', 'dataset__45', 'dataset__71', 'dataset__72', 'dataset__73', 'dataset__113'];
        const ftp_table_flg = ftp_table_name_a.includes(this.table);

        return db_name_flg && ftp_table_flg && this._share.isMasterUser();
    }

    postFtp() {
        const header_table_name = this._share.getHeaderDatasetName();

        if (!window.confirm(header_table_name + 'テーブルを手動更新しますか？')) return;
        this._connect.post('/admin/post-ftp', { 'table': header_table_name }).subscribe(
            (jsonData) => {
                if (jsonData['result'] === 'success') {
                    this.toasterService.success(header_table_name + 'テーブルの更新を開始しました。更新中はテーブルが空になります。', '成功');
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                }
            }, (error) => {
            }
        );
    }


    toggleFilterContent(){
        this.userTableSetting.toggle_filter_content_area = !this.userTableSetting.toggle_filter_content_area;
    }

    onExport() {
        const apiUrl = this._connect.getApiUrl();
        let filename = this.page_title + '_' + this._share.dateFormat.format(new Date(), 'yyyyMMdd_hhmm') + '.json';
        filename = filename.replace(/\s/g, '')

        const job = true;

        if (job) {
            const query_params = {
                export_data: this.export_data,
                export_notification: this.export_notification,
                export_grant: this.export_grant,
                export_filter: this.export_filter,
                filename: filename
            };

            const url = `${apiUrl}/admin/prepare-download/json?${this.query_string}`;
            console.log('json export job')
            this.prepare_json(url, query_params, filename)
        } else {
            const query_params = {
                export_data: this.export_data.toString(),
                export_notification: this.export_notification.toString(),
                export_grant: this.export_grant.toString(),
                export_filter: this.export_filter.toString(),
                query_string: this.query_string,
            };

            const query_params_string = new window.URLSearchParams(query_params).toString();
            const final_query_string = query_params_string + '&' + this.query_string;

            const url = `${apiUrl}/admin/download-json?${final_query_string}`;
            window.open(url, '_blank');

        }
        this.exportModal.hide();

    }

    prepare_json(url, query_params, filename) {
        this.dlCsvModal.hide()
        if (this.downloading['json']) {
            this.toasterService.warning('別のjsonをダウンロード中です', '警告');
            return;
        }
        //console.time('prepare_csv:');

        const params = [];
        this.downloading['json'] = true;

        this._connect.post(url, {
            query_params
        }).subscribe((data) => {
            console.log(data)
            this.toasterService.success('JSONダウンロードを開始しました。時間がかかる場合があります。', '成功');
            const json_id = parseInt(data['json_id'], 10);
            const onceTimer = interval(200).subscribe(x => {
                onceTimer.unsubscribe();
                // 5秒後に１度実行して、まだなければ３秒間隔でチェック
                this.get_json(json_id).subscribe((csv) => {
                    // 5秒タイマー作成

                    this.json_load_timer = interval(2000).subscribe(x2 => {
                        this.get_json(json_id).subscribe((_json) => {
                            this.handle_json_download_json(_json, filename);
                        });
                        //console.time('test')
                    });

                })
            });

        })
            ;

    }

    changeAllSearchText($event) {
        console.log($event)
        this.all_search_text = $event.target.value;
    }

    getFreeeMaster($table_type){
        const url = this._connect.getApiUrl() + '/admin/freee/master/' + $table_type + '/' + this.table;
        this.toasterService.success('同期しています。しばらくお待ちください', '成功')
        this._connect.get(url).subscribe(
            (jsonData) => {
                this.toasterService.success('同期が完了しました。', '成功')
                console.log(jsonData)
                window.location.reload();
                // this.freee_auth_url = jsonData['auth_url'];
                // console.log(jsonData);
            }
        )
    }

    postFreeeInvoice($table_type){
        const formData: FormData = new FormData();
        formData.append('table', this.table);
        formData.append('table_type', $table_type);
        console.log(this.checked_id_a)
        if(this.checked_id_a.length > 0) formData.append('ids', this.checked_id_a.join(','));

        const url = this._connect.getApiUrl() + '/admin/freee/invoice';
        this.toasterService.success('取引連携しています。しばらくお待ちください', '成功')

        this._connect.postUpload(url, formData).subscribe(
            (jsonData) => {
                console.log(jsonData)
                this.toasterService.success('同期が完了しました。ページを更新してください', '成功')
            },
            (error) => {
                console.log('Error:', error);
                this.toasterService.success('エラーがあった明細以外の同期が完了しました。ページを更新してください', '成功')
                this.toasterService.error(error.error.error_message, 'エラー');
            }
        )
    }


    isSticky(): boolean {
        //if smartphone, false
        if (window.innerWidth < 768) {
            return false;
        }


        return this.table_info.menu.show_table_header_sticky && (!this.is_memo_open || !this.table_info.menu.top_memo)
    }
    //always uncheck in all checkbox input if checked, after deleted
    reset_all_checkbox( changed_route = false ): void {
        let all_checkbox = document.querySelector('.table-admin-list__checkbox input') as HTMLInputElement;
        if (all_checkbox) {
            all_checkbox.checked = false;
            this.checked_all = false;
            if( !changed_route ){
                all_checkbox.dispatchEvent(new Event('change'));
            }
        }
    }

    changeView(switchCalendarView = false) : boolean{
        return this.switchCalendarView = switchCalendarView
    }

    public isGoogleMapViewOpen: boolean = false;
    public edittingCustomGoogleMapFilter: GoogleMapFilter;

    public openGoogleMapView(editingFilter: GoogleMapFilter) {
        this.edittingCustomGoogleMapFilter = editingFilter;
        this.isGoogleMapViewOpen = true;
        this.googleMapViewModal.show();
    }

    public onGoogleMapPreview(filter: GoogleMapFilter) {
        // フィルターを保存
        this.googleMapFilter[this.table] = filter;

        // URLにパラメータを追加（onGoogleMapFilterSelectと同様の処理）
        if (filter && filter.id) {
            const segments = this._router.url.split('?')[0];  // クエリパラメータを除いたパス部分を取得

            // 現在のクエリパラメータを保持
            const currentQuery = this._route.snapshot.queryParams;
            const queryString = Object.keys(currentQuery).length > 0
                ? '?' + Object.keys(currentQuery).map(key => `${key}=${currentQuery[key]}`).join(';')
                : '';

            // マトリックスパラメータとクエリパラメータを組み合わせて遷移
            this._router.navigateByUrl(`${segments}${queryString}`).then(() => {
                // URLの更新が完了してから地図を更新
                this.loadList();
            });
        } else {
            // フィルターIDがない場合は直接更新
            this.loadList();
        }

        // モーダルを閉じる
        this.isGoogleMapViewOpen = false;
        this.googleMapViewModal.hide();
    }

    onGoogleMapFilterSelect(filter: GoogleMapFilter) {
        this.googleMapFilter[this.table] = filter;
        if (filter && !filter.id) {
            return;
        }
        // URLにパラメータを追加
        const segments = this._router.url.split('?')[0];  // クエリパラメータを除いたパス部分を取得

        // 現在のクエリパラメータを保持
        const currentQuery = this._route.snapshot.queryParams;
        const queryString = Object.keys(currentQuery).length > 0
            ? '?' + Object.keys(currentQuery).map(key => `${key}=${currentQuery[key]}`).join(';')
            : '';

        // マトリックスパラメータとクエリパラメータを組み合わせて遷移
        this._router.navigateByUrl(`${segments}${queryString}`).then(() => {
            // URLの更新が完了してから表示を更新
            this.load(this.page, true, true);
        });
    }

    onGoogleMapFilterDelete(id: number) {
        if (this.googleMapFilter[this.table]) {
            this.resetGoogleMapFilter();
            // 現在のデータを再読み込み
            this.load(this.page, true, true);
        }
    }

    resetGoogleMapFilter() {
        this.googleMapFilter = new GoogleMapFilter();
        // URLからパラメータを削除
        const segments = this._router.url.split('?')[0].split(';')[0];  // マトリックスパラメータとクエリパラメータを除いたパス部分を取得

        // 現在のクエリパラメータを保持
        const currentQuery = this._route.snapshot.queryParams;
        const queryString = Object.keys(currentQuery).length > 0
            ? '?' + Object.keys(currentQuery).map(key => `${key}=${currentQuery[key]}`).join(';')
            : '';

        // マトリックスパラメータを除いて遷移
        this._router.navigateByUrl(`${segments}${queryString}`);

        // フィルターをリセットして表示を更新
        this.load(this.page, true, true);
    }

    getListParams() {
        const params = {
            'page': this.page,
            'per_page': this.per_page
        };

        return params;
    }

    openUploadConfirmModal() {
        // 次回表示しない設定がチェック済みの場合は、直接アップロードを実行
        if (this._share.user.check_csv_no_change_modal === true) {
            this.uploadCsv();
            return;
        }
        this.csvModal.hide();
        this.uploadConfirmModal.show();
    }

    /**
     * テーブル名がdataset__で始まるかどうかを判定する
     * @returns {boolean} dataset__で始まる場合はtrue
     */
    /**
     * ChatBotからのフィルター適用ハンドラー
     * @param event フィルター情報
     */
    onChatSetFilter(event: any): void {
        if (!event || !event.filter) {
            console.error('フィルターデータがありません');
            return;
        }

        console.log('ChatBotからフィルター適用:', event);

        try {
            // フィルターを直接適用
            this.customFilter = new CustomFilter(event.filter);
            this.customFilter.conditions.condition_a.forEach(condition => {
                condition.loadExtraDetail(this.table_info, this._share, this._connect)
            })

            // データをリロード
            this.loadList(() => {
                this.toasterService.success('検索条件を適用しました', '成功');
            });
        } catch (e) {
            console.error('フィルター適用エラー:', e);
            this.toasterService.error('フィルターの適用に失敗しました', 'エラー');
        }
    }

    isDatasetTable(): boolean {
        return this.table && /^dataset__\d+$/.test(this.table);
    }

    checkPendingCsvJobs() {
        this._connect.get('/admin/pending-csv-jobs').subscribe(
            (data) => {
                if (data['result'] === 'success' && data['pending_jobs'].length > 0) {
                    console.log('未完了CSVジョブ発見:', data['pending_jobs'].length, '件');

                    // 各未完了ジョブをlocalStorageに保存
                    data['pending_jobs'].forEach(job => {
                        const key = `csv_job_${job.id}`;
                        localStorage.setItem(key, JSON.stringify({
                            id: job.id,
                            type: job.type,
                            filename: job.filename,
                            status: job.status,
                            created: job.created
                        }));
                    });

                    // 各ジョブに対してPusher監視とPollingを設定
                    console.log('リロード時未完了ジョブ:', data['pending_jobs']);
                    data['pending_jobs'].forEach(job => {
                        console.log('リロード時ジョブ監視開始:', job.id, job.type, job.filename);
                        this.setupJobListener(job.id, job.type, job.filename);
                        this.startJobPolling(job.id, job.type, job.filename);
                    });
                }
            },
            (error) => {
                console.error('未完了CSVジョブチェック失敗:', error);
            }
        );
    }


    setupJobListener(jobId: number, jobType: string, filename: string) {
        // Pusher listenerを設定
        this.pusherService.bindJobFinished((data) => {
            if (data.csv_id == jobId) {
                this.handleJobCompletion({id: jobId, type: jobType, filename: filename}, data);
            }
        });

        this.pusherService.bindUploadFinished((data) => {
            if (data.csv_id == jobId) {
                this.handleJobCompletion({id: jobId, type: jobType, filename: filename}, data);
            }
        });
    }

    private pollingIntervals: { [key: number]: any } = {};
    private pollingCounts: { [key: number]: number } = {};

    startJobPolling(jobId: number, jobType: string, filename: string) {
        // 既存のポーリングがあれば停止
        if (this.pollingIntervals[jobId]) {
            clearInterval(this.pollingIntervals[jobId]);
        }

        // ポーリング回数を初期化
        this.pollingCounts[jobId] = 0;

        // ポーリング処理を実行する関数
        const executePolling = () => {
            console.log('ポーリング実行:', jobId, '回数:', this.pollingCounts[jobId] + 1);
            const key = `csv_job_${jobId}`;
            const storedJob = localStorage.getItem(key);

            if (storedJob) {
                this._connect.get(`/admin/csv-info/${jobId}`).subscribe(
                    (data) => {
                        if (data['result'] === 'success' && data['csv']) {
                            const csvStatus = data['csv'];
                            if (csvStatus.status === 'done' || csvStatus.status === 'failed') {
                                this.handleJobCompletion({id: jobId, type: jobType, filename: filename}, {
                                    csv_id: csvStatus.id,
                                    status: csvStatus.status
                                });
                            }
                        }
                    },
                    (error) => {
                        console.error('CSVジョブポーリングエラー:', error);
                    }
                );
            } else {
                // localStorageにジョブがない場合はポーリング停止
                clearTimeout(this.pollingIntervals[jobId]);
                delete this.pollingIntervals[jobId];
                delete this.pollingCounts[jobId];
            }

            // ポーリング回数をインクリメント
            this.pollingCounts[jobId]++;
        };

        // 段階的なポーリング間隔を設定する関数
        const scheduleNextPolling = () => {
            const count = this.pollingCounts[jobId];
            let nextInterval: number;

            if (count === 0) {
                // 初回: 3秒
                nextInterval = 3000;
            } else if (count === 1) {
                // 2回目: 5秒
                nextInterval = 5000;
            } else if (count === 2) {
                // 3回目: 10秒
                nextInterval = 10000;
            } else {
                // 4回目以降: 30秒ごと
                nextInterval = 30000;
            }

            console.log('次回ポーリング間隔:', jobId, nextInterval + 'ms');

            this.pollingIntervals[jobId] = setTimeout(() => {
                executePolling();
                // ジョブが完了していない場合は次のポーリングをスケジュール
                if (this.pollingIntervals[jobId]) {
                    scheduleNextPolling();
                }
            }, nextInterval);
        };

        // 最初のポーリングをスケジュール
        scheduleNextPolling();

        // 15分後にポーリング停止
        setTimeout(() => {
            if (this.pollingIntervals[jobId]) {
                clearTimeout(this.pollingIntervals[jobId]);
                delete this.pollingIntervals[jobId];
                delete this.pollingCounts[jobId];
            }
        }, 900000);
    }

    handleJobCompletion(job: any, data: any) {
        const key = `csv_job_${job.id}`;
        localStorage.removeItem(key);

        // ポーリングを即座に停止
        if (this.pollingIntervals[job.id]) {
            clearTimeout(this.pollingIntervals[job.id]);
            delete this.pollingIntervals[job.id];
            delete this.pollingCounts[job.id];
        }

        if (data.status === 'done') {
            if (job.type === 'download') {
                this.downloading['csv'] = false;
                this.download_csv(job.id, job.filename).subscribe(
                    (downloadData: any) => {
                        this.downloading['csv'] = false;
                        if (downloadData.size === 0) {
                            this.toasterService.error('ダウンロードに失敗しました。権限を確認して下さい。', 'エラー');
                            return;
                        }
                        this.toasterService.success('CSVダウンロードが完了しました。', '成功');
                        const blob = new Blob([downloadData], {type: 'text/csv'});
                        FileSaver.saveAs(blob, job.filename);
                        this.pusherService.finishOperation();
                    }
                );
            } else if (job.type === 'upload') {
                this.toasterService.success('CSVアップロードが完了しました。', '成功');
                this.reload();
                this.pusherService.finishOperation();
            }
        } else if (data.status === 'failed') {
            this.toasterService.error(`CSV${job.type === 'download' ? 'ダウンロード' : 'アップロード'}に失敗しました。`, 'エラー');
            this.downloading['csv'] = false;
            this.pusherService.finishOperation();
        }
    }

    private cleanupUploadFlags(): void {
        const currentUploadKey = localStorage.getItem('current_upload_key');
        if (currentUploadKey) {
            localStorage.removeItem(currentUploadKey);
        }
        localStorage.removeItem('current_upload_key');
    }

    private isUploadingFromThisDevice(): boolean {
        const currentUploadKey = localStorage.getItem('current_upload_key');
        if (currentUploadKey !== null) {
            return localStorage.getItem(currentUploadKey) === 'true';
        }
        return false;
    }
}

import {Component, HostListener, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router'
import * as FileSaver from 'file-saver';
import ToastrService from '../../toastr-service-wrapper.service';

import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';
import {DomSanitizer} from '@angular/platform-browser';
import {TableInfo} from '../../class/TableInfo';
import {Data} from '../../class/Data';
import {Workflow} from '../../class/Workflow';
import {Ledger} from '../../class/Ledger';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {UserTableSetting} from '../../class/UserTableSetting';
import * as cloneDeep from 'lodash/cloneDeep';
import {WorkflowService} from '../../service/WorkflowService';
import {Subscription} from 'rxjs';
import {CertificateManagementComponent} from '../components/certificate-management.component';

@Component({
    selector: 'app-view-page',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.css'],
    providers: [WorkflowService],
})
export class ViewComponent implements OnInit, OnDestroy {
    public showCertificateManagement: boolean = false;
    public isMasterUser: boolean = false;

    onCertificateChange(event: any) {
        if (event.action === 'issued' || event.action === 'revoked') {
            // Reload the view to reflect certificate changes
            this.load();
        }
    }
    public page_title: string;
    public loading = true;
    public data: Data = null;
    public before_html;
    public content_html;
    public content_html_before;


    public previous_id :number = null;
    public changedView = false;
    public next_id: number = null;

    public table_info: TableInfo;
    public table: string;
    private added_main_breadcrumbs: boolean;
    private unique_val: number;
    private hide_table = false;
    private extend_scripts: Array<string> = [];
    private extend_styles: Array<string> = [];

    private extend_headers: Array<any>
    private extend_data: {};

    public workflow: Workflow = null;
    public sending: boolean;

    private toasterService: ToastrService;

    public customFilter: CustomFilter;
    public listCustomFilter: CustomFilter;
    public userTableSetting: UserTableSetting = null;

    // delete modal
    private modal_data: Array<any>;
    private routerSubscription: Subscription = null;

    public no_data: boolean = false;

    public table_type = null;

    @ViewChild('deleteModal') deleteModal: any;
    @ViewChild('workflowModal') workflowModal: any;
    @ViewChild('workflowWithdrawModal') workflowWithdrawModal: any;
    @ViewChild('workflowCancelModal') workflowCancelModal: any;
    @ViewChild('csvUploadCancelModal') csvUploadCancelModal: any;
    @ViewChild('csvCancelModal') csvCancelModal: any;
    
    // Bound version of reload function (prevents infinite loop)
    public reloadFunction: Function;


    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _share: SharedService, toasterService: ToastrService,
                protected sanitizer: DomSanitizer, private renderer: Renderer2, private workflowService: WorkflowService) {
        this.toasterService = toasterService;
        // Create bound function once to prevent infinite loop
        this.reloadFunction = this.load.bind(this, null, false);
    }

    ngOnInit() {
        this.onUrlChanged();
        if (document.location.pathname.split(';')[1] == 'comment_open=true') {
            this.toggleSideMenu();
        }
        this.routerSubscription = this._router.events.subscribe((val) => {
            // see also
            console.log()
            if (val instanceof NavigationEnd) {
                if(!this.changedView)  this.onUrlChanged()
            }
        });

        // Check if certificate management should be shown
        this._share.loadAdminDatas().then(() => {
            let settings = this._share.cloud_setting;
            console.log('Cloud settings:', settings);
            // Show certificate management if user has contracted for certificate users
            const maxCertUsers = parseInt(settings['max_client_secure_user_num']) || 0;
            this.showCertificateManagement = this.table == 'admin' && maxCertUsers > 0 && (this._share.user.type == 'master');
        }).catch(error => {
            console.error('Failed to load admin data:', error);
            this.showCertificateManagement = false;
        });

        this._share.getUser().then(user => {
            this.isMasterUser = user.type == 'master';
        });
    }
    ngAfterViewChecked(){
        if(!this.added_main_breadcrumbs){
            this.add_main_breadcrumbs()
        }
    }

    setDefaultFilter(table_info: TableInfo) {
        this.customFilter = table_info.getDefaultFilter('view');
    }

    onUrlChanged() {

        this._route.params.subscribe(params => {
            console.log('route')
            this.customFilter = null;

            this.table = params['table'];
            this.unique_val = params['id'];
            this.data = null;
            this.extend_headers = [];
            this.extend_data = {};

            delete this.table_info
            delete this.content_html
            delete this.before_html
            delete this.page_title
            this.load();
        });
    }


    ngOnDestroy() {
        // コンポーネントを破棄する時にunsubscribeする
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    setClasses(): Object {
        let class_hash = {
            'multi_col_view': this.table_info.menu.layout_apply_view,
        };
        class_hash[this.table_info.getJaClassName()] = true;
        class_hash[this.table_info.getClassName()] = true;
        return class_hash
    }

    getThis() {
        return this;
    }

    public KEY_ARROW_RIGHT = 'ArrowRight';
    public KEY_ARROW_LEFT = 'ArrowLeft';
    // @HostListener('window:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        console.log('VEIW keyup')
        if (event.key == this.KEY_ARROW_RIGHT) {
            if( this.next_id ){
                this.changedView = true;
                this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.next_id]);
            }
            return;
        }
        if (event.key == this.KEY_ARROW_LEFT) {
            if(this.previous_id){
                this.changedView = true;
                this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.previous_id]);
            }
            return;
        }
    }

    load(_this = null, setDefaultFilter = true) {
        if (!_this) {
            _this = this;
        }
        _this.ledger_active = false;
        _this.loading = true;
        let table = _this.table;
        if (_this.table_info) {
            table = _this.table_info.table
        }
        this._share.getTableInfo(table).subscribe(async (_table_info) => {
            if (!_table_info) {
                _this._router.navigate([_this._share.getAdminTable(), 'login']);
                return;
            }

            this.table_type = _table_info.menu.table_type;
            _this.before_html = _table_info.view_before_html;
            _this.page_title = _table_info.menu.name;
            if (_this._route && _this._route.snapshot) {
                _this._route.snapshot.data['title'] = _this.page_title; // パンくず
            }

            _this.table_info = _table_info;

            _this.data = new Data(_this.table_info);


            _this.extend_headers = _table_info.extend_headers;
            let load_table = _this.table
            if (setDefaultFilter) {
                this.setDefaultFilter(_table_info);
                //set Default Custom Filter
                this.userTableSetting = this._share.getUserTableSetting(this.table)

                if (this.userTableSetting.filter_id) {
                    this.setFilter(this.userTableSetting.filter_id);
                }
            }
            let filter_params = {search: this.customFilter ? this.customFilter.getSearchParam() : []}
            console.log(this.customFilter)
            _this._connect.post('/admin/view/' + _this.table + '/' + _this.unique_val, filter_params).subscribe((data) => {
                if (load_table != _this.table) {
                    return;
                }
                if (data['result'] != 'success') {
                    _this.toasterService.error(data['error_a'].join(','), 'エラー');
                    return;
                }

                this.add_main_breadcrumbs();

                _this.content_html = data['content_html'];
                _this.content_html_before = data['content_html_before'];

                data = data['data']

                _this.loading = false;
                _this.changedView = false;
                _this.data.setInstanceData(data);
                //FIXME:ngrx
                _this._share.setCurrentData(_this.data, _table_info);
                //set pre and next ids
                _this.setPrevAndNext(data.raw_data.id)

                _this.hide_table = data['delete_detail_table'];
                _this.workflow = new Workflow(data['workflow']);
                if ('extend_script_urls' in data) {
                    _this.extend_scripts = data['extend_script_urls'];

                    // HTMLに反映
                    const element = document.getElementById('extend_scripts');
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    _this.extend_scripts.forEach(url => {
                        const s = document.createElement('script');
                        s.type = 'text/javascript';
                        s.src = url;
                        element.appendChild(s);
                    })
                }
                if ('extend_style_urls' in data) {
                    _this.extend_styles = data['extend_style_urls'];

                    // HTMLに反映
                    const element = document.getElementById('extend_styles');
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    _this.extend_styles.forEach(url => {
                        const s = document.createElement('link');
                        s.rel = 'stylesheet';
                        s.href = url;
                        element.appendChild(s);
                    })
                }

                // ワークフローのパスに一つでも承認できるユーザーがいない場合は取り下げる
                if (!data.workflow_valid) {
                    _this.toasterService.error('承認できるユーザーがいないフローがあるので、申請を取り下げます。', 'エラー');
                    this.reapply(true);
                }


            }, (error) => {
                if (error.error.error_type == 'NO_DATA') {
                    this.no_data = true
                } else if(error.error.error_type == 'login_error'){
                    alert('ログアウトされました。再度ログインしてください。')
                } else {
                    alert('エラーが発生しました')
                }
            });
        });
    }

    setPrevAndNext ( id ){

        let currentIdIndex = this.userTableSetting.refer_ids.indexOf(id);
        if (currentIdIndex != -1) {
            this.previous_id = this.userTableSetting.refer_ids[currentIdIndex - 1] ?? null;
            this.next_id = this.userTableSetting.refer_ids[currentIdIndex + 1] ?? null;
        }
        if (!this.previous_id || !this.next_id) {
            let listPage = this.userTableSetting.current_page;
            let setNext  = true;
            if (!this.previous_id){
                listPage -= 1;
                setNext   = false;
            }
            if (!this.next_id) {
                listPage += 1;
                setNext  = true;
            }
            //run this when the stored data is not exist in the localstorage and the previous_id and next_id are not exist
            if (!this.previous_id && !this.next_id) {
                listPage = this.userTableSetting.current_page ? this.userTableSetting.current_page + 1 : 1;
                setNext = false;
                this.userTableSetting.total_page = this.userTableSetting.total_page ?? 1;
            }
            if (listPage > 0 && listPage <= this.userTableSetting.total_page) {
                console.error(`load  ${setNext ? 'next' : 'prev'}`, listPage)
                this.loadList(listPage, setNext);
            }
        }
    }

    goToPrevAndNext ( is_next = false ){
        if( is_next ){

            if (this.next_id) {
                this.changedView = true;
                this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.next_id]);
            }
        }else{

            if (this.previous_id) {
                this.changedView = true;
                this._router.navigate([this._share.getAdminTable(), this.table, 'view', this.previous_id]);
            }
        }

    }

    loadList( listPage, setNext = true ){
        let sort_params = this.userTableSetting.sort_params;
        let filter = cloneDeep(this.userTableSetting.tmp_filter ?? this.listCustomFilter);
        //add view filter when filtered with view filter
        if (!filter && this.userTableSetting.view_id) filter = this.table_info.getFilterById(this.userTableSetting.view_id);
        //merge view filter
        if (filter && filter.canMergeView() &&  this.userTableSetting.view_id){
            let view_filter = this.table_info.getFilterById(this.userTableSetting.view_id);
            if (view_filter)filter.mergeView(view_filter);
        }
        let all_search_variables = [];
        if(filter){
            filter.getAllVariables(this._share).subscribe(variables => {
                all_search_variables = variables
            })
        }
        this._connect.getList(this.table_info, listPage, this.table_info.menu.per_page, filter, sort_params, all_search_variables).subscribe((data) => {

            if (data['result'] === 'error') {
                // console.log('ERROR RESULT')
                return;
            }
            // detail screen reference keys
            let refer_ids = data['data_a'].map(data_ => data_.raw_data.id)
            if( !this.userTableSetting.refer_ids.includes(refer_ids[0]) ){
                this.userTableSetting.refer_ids = setNext ? this.userTableSetting.refer_ids.concat(refer_ids) : refer_ids.concat(this.userTableSetting.refer_ids) ;
            }
            // this.userTableSetting.refer_ids = refer_ids;
            this.userTableSetting.current_page  = listPage;
            this.userTableSetting.total_page    = data.total_page;
            this.setPrevAndNext(this.data.raw_data['id'])
        })
    }

    get_query_params()
    {
        let parameterObj = {};
        if (this._route.queryParams['value']['registeredDate'] != undefined) {
            parameterObj['queryParams'] = {
                registeredDate: this._route.queryParams['value']['registeredDate'],
            };
        }
        return parameterObj;
    }

    goList() {
        this._router.navigate([this._share.getAdminTable(), this.table], this.get_query_params());
    }

    edit(data) {
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', data.raw_data[this.table_info.primary_key]],{
            queryParams: { 'return_url': this._router.url }
          });
    }

    delete(id_a) {
        this._connect.post('/admin/delete/' + this.table, {'id_a': id_a}).subscribe(
            (jsonData) => {
                if (jsonData['result'] === 'success') {
                    this._share.resetTableInfoCache()
                    this.deleteModal.hide();
                    this.toasterService.success(jsonData['success_count'] + '件のデータを削除しました。', '成功');
                    this._router.navigate([this._share.getAdminTable(), this.table], this.get_query_params());
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                    this.deleteModal.hide();
                }
            }, (error) => {
                this.deleteModal.hide();
            }
        );
    }
    add_main_breadcrumbs(){
        if (this._share.menu_root) {
            const { node, breadcrumbs } = this._share.menu_root.find(this.table);
            breadcrumbs.shift();
            breadcrumbs.push({ 'name': '詳細 (ID: ' + this.unique_val + ')' });
            this._share.breadcrumbs = breadcrumbs;
            this.added_main_breadcrumbs = true;
        }
    }
    openDeleteModal(data) {
        if (data[this.table_info.primary_key] === null) {
            this.toasterService.error('primary-keyがNULLです', 'エラー');
            return;
        }
        this.modal_data = [data[this.table_info.primary_key]];
        this.deleteModal.show();
    }

    toggleSideMenu() {
        document.querySelector('body').classList.toggle('aside-menu-hidden');
    }

    outputLedger(ledger: Ledger) {
        this.sending = true;
        let filename = ledger.name + '.' + (ledger.download_pdf ? 'pdf' : 'xlsx');
        let url = this._connect.getApiUrl() + '/admin/ledger/create/' + this.table + '/' + this.unique_val + '/' + ledger.id;
        
        this._connect.get(url, null, {
            'responseType': 'blob',
            'observe': 'response'  // レスポンス全体（ヘッダーとボディ）を取得
        }).subscribe(
            (response: any) => {
                const data = response.body;  // ボディ（Blob）を取得
                this.sending = false;
                if (data.size === 0) {
                    this.toasterService.error('ダウンロードに失敗しました。権限を確認して下さい。', 'エラー');
                    return;
                }

                // Content-Dispositionヘッダーからファイル名を取得
                const contentDisposition = response.headers.get('Content-Disposition');
                let serverFileName = '';
                if (contentDisposition) {
                    // RFC 5987に準拠したファイル名のパース
                    const matches = /filename\*=UTF-8''([^;]*)/.exec(contentDisposition);
                    if (matches != null && matches[1]) {
                        serverFileName = decodeURIComponent(matches[1]);
                    } else {
                        // 従来の方式のパース（フォールバック）
                        const fallbackMatches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                        if (fallbackMatches != null && fallbackMatches[1]) {
                            serverFileName = fallbackMatches[1].replace(/['"]/g, '');
                        }
                    }
                }

                // サーバーから受け取ったファイル名を使用（ない場合はクライアントの名前を使用）
                const downloadFileName = serverFileName || filename;
                
                const blob = new Blob([data], {
                    type: ledger.download_pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                FileSaver.saveAs(blob, downloadFileName);
                
                if (this.table_type == 'branc_invoice') {
                    setTimeout(() => {
                        this.load()
                    }, 1500)
                }
            },
            (error) => {
                this.sending = false;
                this.toasterService.error('ダウンロードに失敗しました。', 'エラー');
            }
        );
    }

    /**
     * WORKFLOW
     */


    private workflow_status = null;

    workflow_reject() {
        this.workflow_status = 'rejected';
        this.workflowModal.show();

    }


    workflow_back() {
        this.workflow_status = 'back';
        this.workflowModal.show();
    }

    workflow_ok() {
        this.workflow_status = 'accepted';
        this.workflowModal.show();

    }

    workflow_withdraw() {
        this.workflow_status = 'withdraw';
        this.workflowModal.show();

    }

    private workflow_comment: string = '';

    setWorkflowStatus() {
        this.loading = true;

        this.workflowService.setStatus([this.workflow.id], this.workflow_status, this.workflow_comment, this.workflow.is_salvage_acceptable).subscribe(
            (res) => {
                this._share.loadAdminDatas()
                this.load();
                this.loading = false;
                this.workflowModal.hide();
                if (res['result']) {
                    let message = this.workflow_status == 'accepted' ? '承認しました' : '否認しました';
                    this.toasterService.success(message, '成功');
                    this.workflow_comment = '';
                } else {
                    this.toasterService.error('処理に失敗しました', '失敗');
                }
            },
            (error) => {
                this.loading = false;
                if (error.error && error.error.error_message) {
                    this.toasterService.error(error.error.error_message, 'エラー');
                } else {
                    this.toasterService.error('処理に失敗しました', 'エラー');
                }
                this.workflowModal.hide();
                this._share.loadAdminDatas()
                this.load();
            }
        );
    }

    new_with_copy(data) {
        console.log(data)
        this._router.navigate([this._share.getAdminTable(), this.table, 'edit', 'new', {ref: data.raw_data['id']}]);
    }

    check_grant_permission(data) {
        this.loading = true
        this._connect.post('/api/admin/addpermissionview/' + data.raw_data['id'], {}).subscribe(_data => {
            this._share.loadAdminDatas().then(() => {
                this.loading = false;
                window.location.reload()
            });
        }, (error) => {
            this.loading = false;
        })
    }
    /**
     * 再申請
     */
    reapply(auto = false) {
        this.loading = true;
        this.workflowService.withdraw([this.workflow.id], this.workflow_comment, auto).subscribe(res => {
            this.loading = false;
            this.workflowModal.hide();
            if (res['result'] === 'success') {
                this.toasterService.success('申請取り下げに成功しました。', '成功');
                this.workflowWithdrawModal.hide();
                this.workflowCancelModal.hide();
                this.load()
            }
        });

    }


    /**
     * フィルタ系
     */

    resetFilter() {
        if (this.userTableSetting) {
            this.userTableSetting.filter_id = null;
        }
        this.customFilter = null;
        this.load(null, false)

    }

    selectFilter($event) {
        this.customFilter = $event.filter
        this.userTableSetting.filter_id = this.customFilter.id
        this.load(null, false)

    }


    private setFilter(filter_id) {
        this.table_info.saved_filters.forEach(_filter => {
            if (_filter['id'] == filter_id && _filter.view_use_show_fields) {
                this.userTableSetting.filter_id = filter_id
                if (!this.customFilter) {
                    //const params = JSON.parse(_filter['params_json'])
                    this.customFilter = cloneDeep(_filter)
                    //FIXME: 後でasyncにする
                    this.customFilter.conditions.reloadViewValuesTmp(this.table_info, this._connect, this._share)

                    //this.fields = this.getViewFields()
                }
            }
            //add list when refresh list page
            if (_filter['id'] == filter_id && !_filter.view_use_show_fields) this.listCustomFilter = cloneDeep(_filter)
        })

    }

    hasViewFilter() {
        return this.table_info.saved_filters.find(_filter => {
            return _filter.view_use_show_fields
        })
    }

    onEditFilter($event) {
        console.log('on edi filter')
        this._router.navigate([this._share.getAdminTable(), this.table, {'_edit_filter_id': this.customFilter.id, 'filter_ac': 'edit', '_filter_type': 'view'}]);
    }


    onDeleteFilter($event) {
        console.log('on edi filter')
        this._router.navigate([this._share.getAdminTable(), this.table, {'_edit_filter_id': this.customFilter.id, 'filter_ac': 'delete', '_filter_type': 'view'}]);
    }

    canCsvCancel() {
        return this.table == 'csv' && (this.data.raw_data['status'] == 'processing' || this.data.raw_data['status'] == 'wait')
    }

    csvCancel() {
        this.csvCancelModal.hide();
        this.csvUploadCancelModal.hide();
        this.loading = true;
        this._connect.post('/admin/csv/cancel/' + this.data.raw_data['id'], {}).subscribe(_data => {
            this._share.loadAdminDatas().then(() => {
                this.toasterService.success('csvの' + this.data.raw_data['type'] + 'のキャンセルをリクエスト', '成功');
                this.load()
            });
        }, (error) => {
            this.toasterService.error('キャンセルに失敗しました', 'エラー');
            this.loading = false;
        })
    }

    backInvoiceStatus(){
        this.loading = true;
        this._connect.post('/admin/bran-con/invoice/back/' + this.data.raw_data['id'] + '/' + this.table, {}).subscribe(_data => {
            this.toasterService.success('請求書のステータスを戻しました', '成功');
            this.load()
        }, (error) => {
            this.toasterService.error('キャンセルに失敗しました', 'エラー');
            this.loading = false;
        })
    }

    accountUnlock(){
        this.loading = true;
        this._connect.post('/admin/account/unlock/' + this.data.raw_data['id'], {}).subscribe(_data => {
            this.toasterService.success('アカウントロックを解除しました', '成功');
            this.data.raw_data['account_locked']=false;
            this.loading = false;
        }, (error) => {
            this.toasterService.error('エラーが発生しました', 'エラー');
            this.loading = false;
        })
    }
    /**
     * 請求書/領収書用====================================================
     * @param type
     */
    public downloadStripeBilling(type = 'receipt') {
        let url = this._connect.getApiUrl() + '/admin/download-stripe-invoice/' + this.unique_val + '?type=' + type;
        this._connect.get('/admin/download-stripe-invoice/' + this.unique_val, {'type': type}, {headers: {'X-Requested-With': 'XMLHttpRequest'}}).subscribe((data) => {
            if (data.status == 'success') {
                window.open(url, '_blank');
            } else {
                this.toasterService.error(data.message);
            }
            console.log(data);
        })
    }

    /**
     * チャットボットからフィルターが設定された時のハンドラー
     * Handler for filter settings from chatbot
     * @param event イベントデータ
     */
    onChatSetFilter(event: any) {
        if (event.filter) {
            this.customFilter = event.filter;
            this.load(null, false);
        }
    }

    /**
     * ファイル検索機能が有効かどうかをチェック
     * Check if file search feature is enabled
     */
    isFileSearchEnabled(): boolean {
        return this._share.cloud_setting && this._share.cloud_setting['enable_filesearch'] === 'true';
    }
}

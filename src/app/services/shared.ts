import {NgModule, VERSION} from '@angular/core';
import {Connect} from './connect';
import {HttpHeaders} from '@angular/common/http';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';
import {DatePipe} from '@angular/common';
import {Data} from '../class/Data';
import {TableInfo} from '../class/TableInfo';
import {Log} from '../class/Log';
import {Form} from '../class/Form';
import {CL} from './check-license';
import {PusherService} from '../service/PusherService';
import {Observable} from 'rxjs/Observable';
import {CommonGrant} from '../class/CommonGrant';
import {UserTableSetting} from '../class/UserTableSetting';
import {SimpleTableInfo} from '../class/SimpleTableInfo';
import 'rxjs/add/operator/map'
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Grant} from '../class/Grant';
import {Menu} from '../class/Menu';
import {MenuNode} from '../class/MenuNode';
import {Dashboard} from '../class/Dashboard';


@NgModule({
    declarations: []
})
export class SharedService {
    public menu_a: Array<any>;
    public menu_root: MenuNode = null;
    public breadcrumbs: Array<any> = [];
    public froala_key: string;
    public show_setting = true;
    public setting_name: string;
    //PIGEONVERSION
    public version = '1.10.6';
    public angular_version = VERSION;
    public use_s3 = false;
    public user = null;
    public license = null;
    public expired = null;
    public is_cloud = null;
    private admin_table: string;
    private valid_menu_len = 3;
    public title = null;
    public cloud_setting: Object;
    public admin_setting: Object;
    public tutorial_flag: boolean;
    public dashboard_disabled = true;
    public system_view_disabled = true;
    public user_grant: Grant = null;
    public dataset_add_grant = false;
    public notification_a: Array<any> = [];
    public is_mail_count_reach_alert = false;
    public is_mail_limit_exceed = false;
    public is_notification_exceed = false;
    public notify_limit_per_day: number = 1000;
    public common_grant: CommonGrant = null;
    public debug_mode: boolean = false;
    public reset_hash: string = null;
    public other_user_view: boolean = false;
    public show_only_directory_on_navmenus: boolean = false;
    public is_onpremise: boolean = false;
    public env: string = 'development';
    public stripe_public_key: string = '';
    public stripe_credit_expired_within_1_month: boolean = false;
    public stripe_credit_card: Array<any> = [];
    // ---- DEVIN MUST CHANGE THIS WHEN CREATE PR ----
 public dev_warning_text: string = '開発環境で実行中です。';
    public db_name: string;
    public domain: string;
    public google_map_api_key: string;
    public google_map_max_call_count_plan: number;
    //dataset data

    private _exist_table_a: Array<SimpleTableInfo> = [];
    public exist_table_field_by_table = {}

    // ヘッダーにテーブル名を表示するために使用
    public header_dataset_name = '';
    public header_dataset_img = '';
    // ヘッダーにレコード数を表示するために使用（header_dataset_nameとセットで使用）
    public header_dataset_count: number = 0;

    public admin_unique_key = null;

    // for check
    public admin_table_num: number;

    public dummy_password = '__DUMMY_PASSWORD__';

    public custom_css_url: SafeResourceUrl = null;
    public oem_css_url: SafeResourceUrl = null;

    private _prev_page: string = null;

    public dashboard_a: Array<Dashboard> = []
    // chart
    public summary_a: Array<any> = [
        {
            'name': 'データ数',
            'value': 'count',
        },
        {
            'name': '最大',
            'value': 'max'
        },
        {
            'name': '最小',
            'value': 'min'
        },
        {
            'name': '平均',
            'value': 'avg'
        },
        {
            'name': '合計',
            'value': 'sum'
        },

    ]

    public dateFormat = {
        _fmt: {
            'yyyy': function (date) {
                return date.getFullYear() + '';
            },
            'MM': function (date) {
                return ('0' + (date.getMonth() + 1)).slice(-2);
            },
            'dd': function (date) {
                return ('0' + date.getDate()).slice(-2);
            },
            'hh': function (date) {
                return ('0' + date.getHours()).slice(-2);
            },
            'mm': function (date) {
                return ('0' + date.getMinutes()).slice(-2);
            },
            'ss': function (date) {
                return ('0' + date.getSeconds()).slice(-2);
            }
        },
        _priority: ['yyyy', 'MM', 'dd', 'hh', 'mm', 'ss'],
        format: function (date, format) {
            return this._priority.reduce((res, fmt) => res.replace(fmt, this._fmt[fmt](date)), format)
        }
    };

    public chartColorSchemas: Array<string> = [
        'office.Habitat6',
        'office.Metro6',
        'office.Hardcover6',
        'office.Headlines6',
        'office.Horizon6',
        'office.Infusion6',
        'office.Inkwell6',
        'office.Inspiration6',
        'office.Integral6',
        'office.Ion6',
        'office.IonBoardroom6',
        'office.Kilter6',
        'office.Madison6',
        'office.MainEvent6',
        'office.Marquee6',
        'office.Median6',
        'office.Mesh6',
        'office.Metail6',
        'office.Metropolitan6',
        'office.Atlas6',
        'office.Austin6',
        'office.Badge6',
        'office.Banded6',
        'office.Basis6',
        'office.Berlin6',
        'office.BlackTie6',
        'office.Blue6',
        'office.BlueGreen6',
        'office.BlueII6',
        'office.BlueRed6',
        'office.BlueWarm6',
        'office.Breeze6',
        'office.Capital6',


    ];

    public froala_option_by_type: Object = {
        'full': {
            requestWithCredentials: true,
            heightMin: 250,
            language: 'ja',
            scrollableContainer: '.app-body',
            /*
            requestHeaders: {
                Authorization: `Bearer ${localStorage.getItem(this._share.getAdminTable() + '_access_token')}`
            },
             */
            placeholderText: '',
            charCounterCount: false,
            toolbarButtons: ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'fontSize', 'color', 'inlineStyle', 'inlineClass', 'paragraphStyle', 'paragraphFormat', 'align', 'outdent', 'indent', 'insertHR', 'insertLink', 'insertTable', 'undo', 'redo', 'selectAll', 'html'],
            imageInsertButtons: ['imageBack', '|', 'imageUpload', 'imageByURL'],
            videoInsertButtons: ['videoBack', '|', 'videoByURL'],
            imageEditButtons: ['imageDisplay', 'imageAlign', 'imageInfo', 'imageRemove'],
            fontSize: ['8', '9', '10', '11', '12', '14', '16', '18', '24', '30', '36', '48', '60', '72', '96'],
            // paragraphFormat: {N: 'Normal', H2: 'Heading2', H3: 'Heading3', H4: 'Heading4'},
            wordAllowedStyleProps: ['font-size', 'background', 'color', 'width', 'text-align', 'vertical-align', 'background-color', 'padding', 'margin', 'height', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom', 'text-decoration', 'font-weight', 'font-style']
        },
        'simple': {
            requestWithCredentials: true,
            heightMin: 80,
            language: 'ja',
            scrollableContainer: '.app-body',
            /*
            requestHeaders: {
                Authorization: `Bearer ${localStorage.getItem(this._share.getAdminTable() + '_access_token')}`
            },
             */
            placeholderText: '',
            charCounterCount: false,
            toolbarButtons: ['bold', 'italic', 'underline', 'strikeThrough', 'fontSize', 'color', 'inlineStyle', 'paragraphStyle', 'paragraphFormat', 'align', 'undo', 'redo', 'selectAll', 'html']
        }
    };

    public condition_a: Object = {
        'eq': '次と一致',
        'noteq': '次と一致しない',
        'inc': '次を含む',
        'notinc': '次を含まない',
        'gt': '次の値以上',
        'lt': '次の値以下',
        'gt_ne': '次の値より大きい',
        'lt_ne': '次の値より小さい',
        'date_ago': '次の日数後より前',
        'date_later': '次の日数後より後',
        'week_ago': '次の週数後より前',
        'week_later': '次の週数後より後',
        'month_ago': '次の月数後より前',
        'month_later': '次の月数後より後',
        'year_ago': '次の年数後より前',
        'year_later': '次の年数後より後',
        'today': '今日',
        'yesterday': '昨日',
        'tomorrow': '明日',
        'this_week': '今週',
        'last_week': '先週',
        'next_week': '来週',
        'this_month': '今月',
        'last_month': '先月',
        'next_month': '来月',
        'this_year': '今年',
        'last_year': '去年',
        'next_year': '来年',
        'null': '空',
        'not_null': '空でない',
        'include_other_table': '別のテーブルに含まれる',
        'not_include_other_table': '別のテーブルに含まれない',
    };


    public triggerTypeOptions = [
        {value: 'daily', label: '毎日'},
        {value: 'weekly', label: '毎週'},
        {value: 'monthly', label: '毎月'},
        {value: 'yearly', label: '毎年'},
        {value: 'insert', label: 'データ追加時'},
        {value: 'update', label: 'データ変更時'},
        {value: 'delete', label: 'データ削除時'},
        {value: 'workflowCompleted', label: 'ワークフロー完了時'},
        // {value: 'none', label: '手動'},
    ];

    private datePipe: DatePipe = new DatePipe('en-US');

    private current_table_info: TableInfo = null;
    private current_data: Data = null;

    constructor(private _connect: Connect, protected _cl: CL = null, private sanitizer: DomSanitizer, private pusherService: PusherService) {
        if (_cl) {
            this._cl.cbl().then((result) => {
                this.setLicenseResult(result);
            });
        }
    }

    public getFroalaOption(type: string = 'simple', table_name: string = null, scrollableContainer:string = '.app-body') {
        let froala_option = this.froala_option_by_type[type];
        froala_option.scrollableContainer = scrollableContainer;
        froala_option.imageUploadURL = this._connect.getApiUrl() + '/admin/upload-to-s3/image/' + table_name
        froala_option.fileUploadURL = this._connect.getApiUrl() + '/admin/upload-to-s3/file/' + table_name
        froala_option['key'] = this.froala_key;
        return froala_option

    }

    public setCurrentData(data: Data, table_info: TableInfo) {
        this.current_data = data;
        this.current_table_info = table_info
        if (!this.current_table_info.menu.merge_comment_and_history) {
            this.loadNextLogs().subscribe(() => {
            })
        }
    }

    public reloadCurrentData() {

        this._connect.get('/admin/view/' + this.current_table_info.table + '/' + this.current_data.raw_data['id']).subscribe((data) => {
            this.current_data = new Data(this.current_table_info)
            this.current_data.setInstanceData(data['data'])
        });

    }

    public getCurrentData(): Data {
        return this.current_data;
    }

    public getCurrentDataLog(): Array<Log> {
        if (this.current_data) {
            return this.current_data.logs;
        }
        return [];
    }

    public hasCurrentLogNext(): boolean {
        if (this.current_data) {
            return this.current_data.hasNextLog();
        }
        return false;
    }

    public loadNextLogs(): Observable<any> {
        return new Observable((observer) => {
            let url = '/admin/logs/' + this.current_table_info.table + '/' + this.current_data.raw_data['id'];
            if (this.current_data.logs.length != 0) {
                let last_created = this.current_data.logs[this.current_data.logs.length - 1].created;
                url += '/' + last_created

            }
            this._connect.get(url).subscribe((data) => {
                this.current_data.setLogs(data['logs'])
                observer.next(data['logs'])
            });
        });
    }


    get prev_page(): string {
        return this._prev_page;
    }

    set prev_page(value: string) {
        console.log(value)
        this._prev_page = value;
    }

    public isTrial() {
        if (this.cloud_setting === undefined) {
            return false;
        }
        return this.cloud_setting['trial_expired'] !== null;
    }

    public getTrialRestDays() {
        if (this.cloud_setting === undefined) {
            return 0;
        }
        const now = moment()
        const expired = moment(this.cloud_setting['trial_expired'])

        return expired.diff(now, 'days');

    }

    public getContractRestDays() {
        if (this.cloud_setting === undefined || !this.cloud_setting['expired']) {
            return 100;
        }
        const now = moment()
        const expired = moment(this.cloud_setting['expired'])

        return expired.diff(now, 'days');

    }

    public isUserLoginContractType(): boolean {
        return this.cloud_setting && this.cloud_setting['contract_type'] === 'login_num';
    }

    public reset() {
        this.user = null;
        this.title = null;
        this._exist_table_a = []
        this.exist_table_field_by_table = []
        this._table_info_cache_by_table = []
    }


    public setUser(user) {
        this.user = user;
    }

    public getUser(): Promise<any> {
        return new Promise((resolve) => {
            if (this.user) {
                resolve(this.user)
            } else {
                this._connect.get('/admin/info', null, null, false).subscribe(res => {
                    resolve(res['admin'])
                });
            }

        });

    }

    public setLicenseResult(result) {
        this.license = result['client']['type'];
        this.expired = result['client']['expired'];
        this.froala_key = result['client']['froala_key'];
    }

    public getExpiredStr() {
        return this.expired;
    }

    private is_init_data_loading: boolean = false;

    public loadAdminDatas(): Promise<any> {
        const _this = this;
        // リトライ回数を追跡するための変数を追加
        let retryCount = 0;
        const maxRetries = 2;

        return new Promise((resolve) => {
            // リトライ関数を定義
            const retryLoadData = () => {
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`init_dataの読み込みに失敗しました。${retryCount}回目のリトライを行います...`);
                    setTimeout(() => {
                        this.is_init_data_loading = true;
                        loadInitData();
                    }, 1000);
                } else {
                    this.is_init_data_loading = false;
                    resolve(this);
                }
            };

            // init_dataをロードする関数
            const loadInitData = () => {
                this._connect.get('/admin/init_data').subscribe((data) => {
                    if (data['status'] == 'error') {
                        if (data['type'] == 'ip') {
                            alert('許可されていないログインです')
                        } else {
                            alert('ログインエラー')
                        }
                        location.href = '/admin/login'
                        return;
                    }
                    console.log(data)
                    _this.menu_a = data['data']['menu_a'];
                    _this.show_setting = data['data']['show_setting'];
                    _this.setting_name = data['data']['setting_name'];
                    _this.use_s3 = data['data']['use_s3'];
                    _this.title = data['data']['title'];
                    _this.admin_table_num = data['data']['admin_table_num'];
                    _this.admin_unique_key = data['data']['primary_key'];
                    _this.is_cloud = data['data']['is_cloud'];
                    _this.tutorial_flag = data['data']['tutorial_flag'];
                    _this.dashboard_disabled = data['data']['dashboard_disabled'];
                    _this.system_view_disabled = data['data']['system_view_disabled'];
                    _this.user_grant = new Grant(data['data']['user_grant']);
                    _this.dataset_add_grant = data['data']['dataset_add_grant'];
                    _this.common_grant = new CommonGrant(data['data']['common_grant']);
                    //this.debug_mode = data['data']['debug']
                    _this.env = data['data']['env'];
                    _this.stripe_public_key = data['data']['stripe_public_key'];
                    _this.is_notification_exceed = data['data']['is_noti_exceed'];
                    _this.reset_hash = data['data']['reset_hash'];
                    _this.is_mail_limit_exceed = data['data']['is_mail_limit_exceed'];
                    _this.is_mail_count_reach_alert = data['data']['is_mail_count_reach_alert'];
                    _this.is_onpremise = data['data']['is_onpremise']
                    _this.db_name = data['data']['db_name']
                    _this.domain = data['data']['domain']
                    _this.google_map_api_key = data['data']['google_map_api_key']
                    _this.google_map_max_call_count_plan = data['data']['google_map_max_call_count_plan']
                    if (_this.is_cloud) {
                        _this.cloud_setting = data['data']['cloud-setting'];
                        _this.admin_setting = data['data']['admin-setting'];

                        this.getUser().then((user) => {
                            // Initialize Pusher with config from init_data
                            if (data['data'].pusher?.key && data['data'].pusher?.cluster) {
                                this.pusherService.initialize({
                                    key: data['data'].pusher.key,
                                    cluster: data['data'].pusher.cluster,
                                    userId: user.id,
                                });
                            }
                        });

                        _this.custom_css_url = _this.getCustomCssSanitizeUrl()
                        _this.oem_css_url = _this.getOemCustomCssSanitizeUrl()
                    }

                    if(_this.admin_setting){
                        this.updateToastrSetting(_this.admin_setting['not_close_toastr_auto']);
                    }

                    if (data['other_user_view'])
                        _this.other_user_view = data['other_user_view'];
                    _this.show_only_directory_on_navmenus = data['data']['show_only_directory_on_navmenus'];
                    _this.groupMenus(_this.sortMenusOrder(_this.menu_a));
                    this._exist_table_a = data['data']['all_tables'].map(table_obj => {
                        return new SimpleTableInfo(table_obj['table'], table_obj['name'], table_obj['group'], table_obj['grant'],table_obj.archive_flag)
                    })

                    if (_this.isMasterUser() && !_this.isTrial() && _this.cloud_setting['payment_method'] == 'credit') {
                        _this.checkStripeCreditExpired();
                    }

                    this._connect.get('/admin/get_status').subscribe((data) => {
                        _this.notification_a = data['data']['notification_a'];
                        this.is_init_data_loading = false;
                        //add noti url to in_app_notification if noti url is null
                        _this.notification_a.map((noti)=>{
                            if (!noti.url) noti.url = 'admin/in_app_notification/view/' + noti.id
                            return noti;
                        })
                        resolve(this);
                    }, (error) => {
                        this.is_init_data_loading = false;
                        resolve(this);
                    });
                }, (error) => {
                    // エラー時にリトライするロジックを追加
                    try {
                        console.error('init_dataのロード中にエラーが発生しました:', error);
                        // どのようなHTTPエラーでもリトライする
                        retryLoadData();
                    } catch (e) {
                        console.error('エラーハンドリング中に例外が発生しました:', e);
                        this.is_init_data_loading = false;
                        resolve(this);
                    }
                });
            };

            if (this.is_init_data_loading) {
                let interval = setInterval(() => {
                    if (!this.is_init_data_loading) {
                        clearInterval(interval)
                        resolve(this)
                    }
                }, 200)
                return;
            }
            this.is_init_data_loading = true;
            loadInitData();
        });
    }

    public getExistTableArray(): Observable<Array<SimpleTableInfo>> {
        //wait until loadAdminDatas
        return new Observable((observer) => {
            let interval = setInterval(() => {
                if (this._exist_table_a.length > 0) {
                    clearInterval(interval)
                    observer.next(this._exist_table_a)
                    observer.complete()
                }
            }, 200)
        })
    }


    public menus_map = new Map();
    public sorted_menu = [];

    private sortMenusOrder(menus) {
        let temp_menus = [[], []];
        for (let i = 0; i < menus.length; i++) {
            if (menus[i].order < 1) {
                temp_menus[0].push(menus[i]);
            } else {
                temp_menus[1][menus[i].order] = menus[i];
            }
        }
        temp_menus[1] = temp_menus[1].filter(function (value) {
            return value != null;
        });
        return temp_menus[1].concat(temp_menus[0]);
    }

    private groupMenus(menus) {
        this.menu_root = new MenuNode('root', '(ルートディレクトリ)');
        menus.forEach((menu) => {
            if (Array.isArray(menu.dataset_group_path)) {
                // グループ下のデータセット
                let current_node = this.menu_root;
                menu.dataset_group_path.forEach((path,i) => {
                    const group_key = 'group__' + path.id;
                    const find_node = current_node.find(group_key).node;
                    if (find_node) {
                        current_node = find_node;
                    } else {
                        let parent_group_id = 0;
                        if (i != 0) parent_group_id = menu.dataset_group_path[i - 1].id
                        current_node = current_node.append(new MenuNode(group_key, path.name, 0, parent_group_id));
                        current_node.setShowGroupEdit(true);
                        current_node.setGroupDeleteLock((menu.group_delete_lock == 'true'));
                    }
                });
                const added_menu_node = current_node.append(new MenuNode(menu.table, menu.name));
                added_menu_node.setMenu(menu);
                added_menu_node.setShowGroupEdit(true);
            } else if (menu.group) {
                // メール配信・ログ用
                const group_key = 'group__' + menu.group;
                let node = this.menu_root.find(group_key).node;
                if (!node) {
                    node = this.menu_root.append(new MenuNode(group_key, menu.group, menu.dataset_group_id, menu.dataset_group_parent_id));
                }
                node.append(new MenuNode(menu.table, menu.name)).setMenu(menu);
            } else {
                // root直下のデータセット
                const added_menu_node = this.menu_root.append( new MenuNode(menu.table, menu.name) );
                added_menu_node.setMenu(menu);
                if (menu.table.indexOf('dataset__') === 0) {
                    added_menu_node.setShowGroupEdit(true);
                }
            }
        });
        this.menu_root.setBadgeTotal();
        this.menu_root.setHasChildDir();
        // console.log(this.menu_root);
    }

    // 使わない
    private sortMenus() {
        let edit_group_one = {'key': null, 'value': [], 'stage_3': false};
        let menus_map = this.menus_map;
        this.sorted_menu = [];

        menus_map.forEach(data => {
            if (!Array.isArray(data)) { // 1段目にテーブルを追加
                this.sorted_menu.push({'key': data.group, 'value': data});
            } else if (data[0].group.includes('////')) { // 3段目にテーブルを追加
                let first_stage, second_stage, temp;
                first_stage = data[0].group.split('////')[0];
                second_stage = data[0].group.split('////')[1];

                if (this.is_key(first_stage).is_key) { // 同名の1段目グループがすでに存在していたら
                    edit_group_one.key = second_stage;
                    edit_group_one.value = data;
                    edit_group_one.stage_3 = true;
                    this.sorted_menu[this.is_key(first_stage).id].stage_3 = true;
                    this.sorted_menu[this.is_key(first_stage).id].value.push(edit_group_one);
                } else { // 同名の1段目グループが存在していなかったら
                    // // 2段目グループを追加
                    edit_group_one.key = second_stage;
                    edit_group_one.stage_3 = true;
                    edit_group_one.value = data;
                    temp = edit_group_one;
                    edit_group_one = {'key': null, 'value': [], 'stage_3': false};
                    // // 1段目グループを追加
                    edit_group_one.key = first_stage;
                    edit_group_one.stage_3 = true;
                    edit_group_one.value.push(temp);
                    this.sorted_menu.push(edit_group_one);
                }
            } else {
                if (this.is_key(data[0].group).is_key) {
                    this.sorted_menu[this.is_key(data[0].group).id].value = this.sorted_menu[this.is_key(data[0].group).id].value.concat(data);
                } else {
                    // 2段目にテーブルを追加
                    edit_group_one.key = data[0].group;
                    edit_group_one.value = data;
                    this.sorted_menu.push(edit_group_one);
                }
            }
            edit_group_one = {'key': null, 'value': [], 'stage_3': false};
        });

    }

    private is_key(first_name: string) {
        let result: { 'is_key': boolean, id: number } = {'is_key': false, 'id': -1}
        for (let i = 0; i < this.sorted_menu.length; i++) {
            if (this.sorted_menu[i].key == first_name) {
                result.is_key = true;
                result.id = i;
                return result;
            }
        }
        return result;
    }

    public isRestrictMode() {
        return this.license === 'trial';
    }


    public getDatasetNum() {
        return this.menu_a.filter(function (menu) {
            return menu['table'] != null && menu['table'].match(/^dataset__/);
        }).length;
    }

    public isValidMenuNumber() {
        return this.menu_a.length <= this.getMaxMenuNum();
    }

    public getMaxMenuNum() {
        return this.license === 'trial' ? this.valid_menu_len : 1000;
    }

    public setFroalaKey(key) {
        this.froala_key = key;
    }

    public getMenu(table): Menu {
        if (!this.menu_a) {
            return;
        }
        const menu = this.menu_a.filter(function (item, index) {
            if (item.table === table) {
                return true;
            }
        });
        return menu[0];
    }

    public getMenuName(table) {
        if (!this.menu_a) {
            return;
        }
        const menu = this.menu_a.filter(function (item, index) {
            if (item.table === table) {
                return true;
            }
        });
        return menu[0]['name'];
    }

    public hasMenu(table) {
        if (!this.menu_a) {
            return false;
        }

        let has_flg = false;
        this.menu_a.forEach((menu) => {
            if (menu.table == table) {
                has_flg = true;
            }
        })
        return has_flg
    }

    public setAdminTable(admin_table) {
        this.admin_table = admin_table;
    }

    public getAdminTable() {
        return 'admin'
    }


    public download_file(url, callback, no_action_log = false, filename: string = 'file', isdownload: string = '1', pdf_download = false) {
        if (url.match(/file-by-id/)) {
            // file_info
            this._connect.get(url + '/meta',).subscribe(filedata => {
                if (filedata.name.match(/\.pdf/) && !pdf_download) {
                    window.open(filedata['direct_url'] + '/display/' + isdownload + '/' + filename);
                    if (callback) {
                        callback();
                    }
                } else {
                    const headers = new HttpHeaders({
                        'Authorization': 'Bearer ' + localStorage.getItem(this.getAdminTable() + '_access_token'),
                    });
                    this._connect.get(filedata['direct_url'], {'no_action_log': no_action_log}, {headers: headers, 'responseType': 'blob'}).subscribe(data => {
                        const blob = new Blob([data], {type: filedata.mime});
                        FileSaver.saveAs(blob, filedata.name);
                        if (callback) {
                            callback();
                        }
                    })
                }
            })
        } else {
            const headers = new HttpHeaders({
                'Authorization': 'Bearer ' + localStorage.getItem(this.getAdminTable() + '_access_token'),
            });
            this._connect.get(url, {'no_action_log': no_action_log}, {headers: headers, 'responseType': 'blob'}).subscribe(data => {
                const blob = new Blob([data]);
                console.log(filename)
                FileSaver.saveAs(blob, filename);
                if (callback) {
                    callback();
                }
            })
        }

    }


    public is_object(val) {
        return val instanceof Object;
    }

    public openLink(table, field, id, data) {
        const params = {
            'table': table,
            'field': field,
            'data_id': id,
            'link': data
        };
        /*
        this._connect.post('/admin/add-link-click-log', params).subscribe((res) => {
        });
         */
    }

    public getDateTimeStringByDate(d: any, type: string): string | null {
        if (!d && d !== 0) {
            return null;
        }

        let date: Date | null = null;

        try {

            if (d === 'current' || d === 'now') {
                date = new Date();
            } else if (d instanceof Date) {
                date = d;
            } else if (typeof d === 'string') {

                const parsed = new Date(d);
                if (!isNaN(parsed.getTime())) {
                    date = parsed;
                }
            } else if (typeof d === 'number') {

                date = new Date(d);
            }


            if (!date || isNaN(date.getTime())) {
                throw new Error(`Invalid date value: ${d}`);
            }


            switch (type) {
                case 'datetime':
                    return this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:00');
                case 'date':
                    return this.datePipe.transform(date, 'yyyy-MM-dd');
                case 'year_month':
                    return this.datePipe.transform(date, 'yyyy-MM-01');
                case 'time':
                    return this.datePipe.transform(date, 'HH:mm:00');
                default:
                    return null;
            }

        } catch (error) {
            console.warn('Date transformation failed:', error.message, 'Input:', d);
            return null;
        }
    }

    public get_post_data(_table_info: TableInfo, _data: Data, fields, forms, child_tableinfo_a: Array<TableInfo>, mode, is_setting = false, is_custom_table_definition = false, ignore_file: boolean = false, post_type = null): FormData {
        const formData: FormData = new FormData();
        let raw_data = _data.raw_data;
        if (!raw_data) {
            raw_data = {}
        }
        const addToFormData = (field, type, forms, data, raw_data) => {
            var form = forms.byFieldName(field);
            if (!form) {
                let g = field.match(/\[.*\]\[(.*?)\]$/);
                form = forms.byFieldName(g[1]);

            }
            if (field == 'password' && data == this.dummy_password && (field !== 'image_url' && ! data)) {
                //DUMMY PASSWORDはpostしない
                return
            }
            if (['updated', 'created'].indexOf(field) >= 0 || (field === 'id' || field.indexOf('[id]') >= 0) && data === undefined) {
                return;
            }
            // 権限がない場合
            if (is_setting && field === 'grant') {
                return;
            }


            // on-editのとき、他のfieldの表示条件に設定されている項目は権限がなくてもpostが必要
            let need_for_show_condition = false;
            if (post_type == 'on-edit') {
                const forms_a = forms.getArray();
                for (let i = 0; i < forms_a.length; i++) {
                    let form = forms_a[i];
                    if (form.show_conditions?.condition_a) {
                        for (let j = 0; j < form.show_conditions.condition_a.length; j++) {
                            let condition = form.show_conditions.condition_a[j];
                            if (condition.field == field) {
                                need_for_show_condition = true;
                                break;
                            }
                        }
                    }
                    if (need_for_show_condition) break;
                }
            }

            if (!need_for_show_condition && !_table_info.grant.isEditableField(field)) {
                return;
            }
            if ((type === 'datetime' || type === 'date' || type === 'time') && data === undefined) {
                // 日時が空の場合、空文字を送れるようにする
                data = '';
            } else if (data === undefined) {
                data = '';
            }

            if (type === 'image' || type === 'file') {
                if (!ignore_file) {
                    if (field == 'icon_image_url') {
                        formData.append(field, data);
                    } else if (data instanceof File && !Array.isArray(data) && !!data && !form.isAutoFillField) {
                        if (data.type.split('/')[0] === 'image') {
                            try {
                                const width = document.getElementById((data as any).id_generate)?.getAttribute('data-width');
                                const height = document.getElementById((data as any).id_generate)?.getAttribute('data-height');
                                const size = document.getElementById((data as any).id_generate)?.getAttribute('data-size');
                                if (width && height) {
                                    if(field.indexOf('_child_a') >= 0){
                                        const base_field = field.replace('[value]', '');
                                        formData.append(`${base_field}[width]`, width);
                                        formData.append(`${base_field}[height]`, height);
                                        formData.append(`${base_field}[size]`, size);
                                    } else {
                                        formData.append(`${field}_width`, width);
                                        formData.append(`${field}_height`, height);
                                        formData.append(`${field}_size`, size);
                                    }


                                }
                            } catch (error) {
                                console.error('画像メタデータの取得に失敗:', error);
                            }
                        }
                        formData.append(field, data, data.name);
                    } else if (data === '') {
                        // 削除の時
                        formData.append(field, '');
                    } else if (!form.isAutoFillField && /^(http|https):\/\/[^ "]+$/.test(data)) {
                        //自動反映ではないコピーの時
                        formData.append('LOOKUP_IMAGE_FIELD{' + field + '}', data);
                        // 既存ファイルに変更を加えてないとき
                    } else if (typeof data === 'object' && !!data) {
                        formData.append(field, data.id);
                    } else {
                        // 自動反映
                        formData.append(field, data);
                    }
                }
            } else if (type == 'calc') {
                if (mode == 'edit' && form.is_calc_auto_reload_off) {
                    formData.append(field + '_update', raw_data[field + '_update'] ? 'true' : 'false');
                }
            } else {
                if (data === null) {
                    data = '';
                }
                formData.append(field, data);
            }
        };
        fields.forEach(field => {
            //multi value is added as child_data
            if(Array.isArray(field)){
                field.map(field_one=>{
                    if (!forms.byFieldName(field_one.Field).is_multi_value_mode) {
                        addToFormData(field_one.Field, forms.byFieldName(field_one.Field).type, forms, raw_data[field_one.Field], raw_data);
                    }
                })
            }
            else{
                if (!forms.byFieldName(field.Field).is_multi_value_mode) {
                    addToFormData(field.Field, forms.byFieldName(field.Field).type, forms, raw_data[field.Field], raw_data);
                }
            }

        });

        /**
         * 子要素を入れる
         */
        if (child_tableinfo_a) {
            var addChildFormData = function (_data: Data, child: TableInfo, parent_index = '') {
                if (_data.child_data_by_table[child.table] == undefined) {
                    return true;
                }

                _data.getChildDataAry(child.table).forEach((_child_data: Data, data_index) => {
                    let data = _child_data.raw_data;
                    let current_index = '[' + child.table + '][' + data_index + ']'

                    let _child_data_id = data[child.primary_key];
                    if (data?.['value'] && !data['id']) {
                        _child_data_id = data['value']['data_id'];
                    }
                    addToFormData('_child_a' + parent_index + current_index + '[' + child.primary_key + ']', 'text', child.forms, _child_data_id, data);
                    child.fields.forEach((field) => {
                        let value = data[field.Field]
                        if ((is_custom_table_definition && child.table == 'dataset_field') && field.Field === 'option') {
                            // テーブル定義の場合
                            value = JSON.stringify(data['option']);
                        }
                        /*
                        if (value) {
                            addToFormData('_child_a' + parent_index + current_index + '[' + field.Field + ']', child.forms.byFieldName(field.Field).type, child.forms, value, data);
                        }
                         */

                        //FIXME: file_infoの場合、data_id をvalueに入れる
                        //if is array value
                        if (field.Fiel == 'id' && data?.['value'] && !data['id']) {
                            value = data['value']['data_id'];
                        }
                        addToFormData('_child_a' + parent_index + current_index + '[' + field.Field + ']', child.forms.byFieldName(field.Field).type, child.forms, value, data);
                    });

                    let no_order_table_a = ['common_grant_setting', 'dataset_grant', 'dataset_field_grant', 'dataset_group_grant', 'import_pop_mail_setting'];

                    if (!no_order_table_a.includes(child.table) && data.hasOwnProperty('order')) {
                        addToFormData('_child_a' + parent_index + current_index + '[order]', 'number', child.forms, data['order'], data);
                    }

                    if (child.table == 'dataset_field') {
                        addToFormData('_child_a' + parent_index + current_index + '[is_unique]', 'boolean', child.forms, !!data['is_unique'] ? data['is_unique'] : 'false', data);
                        addToFormData('_child_a' + parent_index + current_index + '[edit_component_x_order]', 'boolean', child.forms, data['edit_component_x_order'], data);
                        addToFormData('_child_a' + parent_index + current_index + '[edit_component_y_order]', 'boolean', child.forms, data['edit_component_y_order'], data);
                    }

                    if (!!data['unique_key_name'] && child.table == 'dataset_field') {
                        addToFormData('_child_a' + parent_index + current_index + '[unique_key_name]', 'boolean', child.forms, data['unique_key_name'], data);
                    }
                    // 順番を入れる
                    if (child.forms.byFieldName(child.order_field) !== undefined) {
                        addToFormData('_child_a' + parent_index + current_index + '[' + child.order_field + ']', child.forms.byFieldName(child.order_field).type, child.forms, data_index + 1, data);
                    }

                    if (child.child_a.length > 0) {
                        child.child_a.forEach((_child_multi_child: TableInfo) => {
                            addChildFormData(_child_data, _child_multi_child, current_index + '[_child_a]');
                        });

                    }
                })
            };
            child_tableinfo_a.forEach((child: TableInfo, i: number) => {
                let base_field_name = child.getBaseFieldNameIfChild(_table_info.table);
                let _base_form = _table_info.forms.byFieldName(base_field_name);

                if (_table_info.grant.isEditableField(base_field_name) && (!_base_form || !_base_form.isAutoFillField)) {
                    addChildFormData(_data, child);
                }
            });

        }
        return formData;

    }


    loadTableFields(table, callback = undefined) {
        if (table === '' || table === undefined) {
            return;
        }
        if (this.exist_table_field_by_table[table] != undefined && callback != undefined) {
            callback(this.exist_table_field_by_table[table]);
            return;
        }
        this._connect.get('/admin/table/info/' + table).subscribe((result) => {
            this.exist_table_field_by_table[table] = result.fields;
            if (callback !== undefined) {
                callback(result.fields);
            }
        });
    }

    getErrorBodyByResponse(get_error_a, child_a = [], child_error_a_by_data_index = {}) {
        let error_count = 0;
        let error_message = '';

        Object.keys(get_error_a).forEach(key => {
            if (key !== '_child_a') {
                error_message += get_error_a[key] + '\r\n';
                error_count++;
            } else {
                // 子要素エラー
                child_a.forEach((child: TableInfo, i) => {
                    if (get_error_a['_child_a'][child.table]) {
                        Object.keys(get_error_a['_child_a'][child.table]).forEach((j) => {
                            if (!child_error_a_by_data_index[child.table][j]) {
                                child_error_a_by_data_index[child.table][j] = {};
                            }
                            child_error_a_by_data_index[child.table][j] = get_error_a['_child_a'][child.table][j]


                            Object.keys(get_error_a['_child_a'][child.table][j]).forEach(ckey => {
                                error_message += child.getLabel() + ':' + get_error_a['_child_a'][child.table][j][ckey] + '\n';
                                error_count++;
                            })
                        });
                    }
                });
            }
        });

        let body = error_count + '件のエラーがあります。' + '\r\n';
        body += error_message;
        return body;
    }

    /**
     * ヘッダーに表示するテキスト取得
     * @returns {string}
     */
    public getHeaderDatasetName() {
        return this.header_dataset_name;
    }

    public isHeaderImgExist(): boolean {
        return !!this.header_dataset_img
    }

    public getHeaderDatasetImg(): string {
        return this.header_dataset_img;
    }

    /**
     * ヘッダーに表示するデータ件数取得
     * @returns {int}
     */
    public getHeaderDatasetCount(): number {
        return (this.header_dataset_count);
    }

    /**
     * ヘッダーに表示するテーブル情報設定
     * @param name
     * @param count
     */
    public setHeaderDatasetName(name, count, img = null) {
        if (name) {
            console.log('header null');
            this.header_dataset_name = name.replace('////', ' / ');
        }
        this.header_dataset_count = count;
        this.header_dataset_img = img
    }

    getNotificationCount() {
        return this.notification_a.filter((data) => {
            return data['read'] === 'false';
        }).length
    }

    public isNumber(str) {
        return !!str && str.match(/^[\d\.]+$/);
    }

    public debug(val) {
        console.log(val);
        return JSON.stringify(val)
        //debugger;
    }

    public getCommitData(table_info: TableInfo, _data_a: Array<Data>, fields, forms, editedIndex: Array<any> = [], toDeletes = []) {
        const addToFormData = (field, type, forms, data, prependKey, data_id = null) => {
            var form = forms.byFieldName(field);
            if (['updated', 'created'].indexOf(field) >= 0 || (field === 'id' || field.indexOf('[id]') >= 0) && data === undefined) {
                return;
            }

            if ((type === 'datetime' || type === 'date' || type === 'time') && data === undefined) {
                data = '';
            } else if (data === undefined) {
                data = '';
            }

            if(data_id == null && type === 'auto-id'){
                data = '';
            }

            if (type === 'image' || type === 'file') {
                console.log(data)
                if (typeof data === 'object' && !!data) {
                    if (!(data instanceof File)) return;

                    formData.append(`${prependKey}[${field}]`, data, data.name);
                } else if (data === '') {
                    formData.append(`${prependKey}[${field}]`, '');
                } else {
                    formData.append(`${prependKey}[${field}]`, data);
                }
            } else if (type == 'calc') {
                if (data && data['id'] > 0 && form.is_calc_auto_reload_off) {
                    formData.append(`${prependKey}[${field}_update]`, data[field + '_update']);
                }
            } else {
                if (data === null) {
                    data = '';
                }
                formData.append(`${prependKey}[${field}]`, data);
            }
        };
        const formData: FormData = new FormData();

        let new_counter = 0;
        let old_counter = 0;
        _data_a.forEach((data: Data, key: number) => {
            if (editedIndex.indexOf(key) == -1 && (data.raw_data['id'] > 0)) {
                return true;
            }
            let index = 0;
            let type = 'to_add';
            if (data.raw_data['id'] > 0) {
                index = old_counter;
                old_counter++;
                type = 'to_update';
            } else {
                index = new_counter;
                new_counter++;
            }
            fields.forEach(field => {
                if (table_info.copyto_fields.indexOf(field.Field) == -1) {
                    if (!forms.byFieldName(field.Field).is_multi_value_mode) {
                        if (forms.byFieldName(field.Field).type === 'image' || forms.byFieldName(field.Field).type === 'file') {
                            addToFormData(field.Field, forms.byFieldName(field.Field).original_type, forms, data.raw_data[field.Field], `${type}[${index}]`, data.raw_data['id']);
                        } else {
                            addToFormData(field.Field, forms.byFieldName(field.Field).original_type, forms, data.raw_data[field.Field], `${type}[${index}]`, data.raw_data['id']);
                        }
                    } else {
                        addToFormData(field.Field, forms.byFieldName(field.Field).original_type, forms, '__PIGEON_IGNORE__', `${type}[${index}]`, data.raw_data['id']);
                    }
                }
            });

            if (data.child_data_by_table && Object.keys(data.child_data_by_table).length > 0) {
                let _child_a = {};
                Object.keys(data.child_data_by_table).forEach(child_table => {
                    // Only include if there is data
                    if (data.child_data_by_table[child_table] && data.child_data_by_table[child_table].length > 0) {
                        _child_a[child_table] = data.child_data_by_table[child_table].map(childData => {
                            // You may want to filter/format childData as needed
                            return {
                                value: childData.raw_data['value'],
                                order: childData.raw_data['order']
                            };
                        });
                    }
                });
                console.log("Length child A ",Object.keys(_child_a).length);
                if (_child_a && Object.keys(_child_a).length > 0) {
                    for (const childTable of Object.keys(_child_a)) {
                        const childArray = _child_a[childTable];
                        if (Array.isArray(childArray)) {
                            for (let childIndex = 0; childIndex < childArray.length; childIndex++) {
                                const child = childArray[childIndex];
                                for (const childKey of Object.keys(child)) {
                                    formData.append(
                                        `${type}[${index}][_child_a][${childTable}][${childIndex}][${childKey}]`,
                                        child[childKey] != null ? String(child[childKey]) : ''
                                    );
                                }
                            }
                        }
                    }
                }
                // if (Object.keys(_child_a).length > 0) {
                //     formData.append(`${type}[${index}][_child_a]`, JSON.stringify(_child_a));
                // }
            }
        })

        toDeletes.forEach((element, index) => {
            formData.append(`to_delete[${index}]`, element);
        });
        return formData;
    }


    public count_step(form: Form) {
        let number = '1';
        for (let i = 0; i < form.decimal_places; i++) {
            if (i == 0) {
                number = '0.';
            } else {
                number += '0';
            }
            if (i == form.decimal_places - 1) {
                number += '1';
            }
        }
        return parseFloat(number);
    }

    /**
     * DO NOT USE
     * @param table_name
     */
    public getSimpleTableInfo(table_name: string): SimpleTableInfo {
        let get_tableinfo = function (exist_table_a) {
            let table_info = null;
            exist_table_a.forEach(_table => {
                if (_table.table == table_name) {
                    table_info = _table;
                }
            })
            return table_info;
        }
        return get_tableinfo(this.exist_table_a);
    }


    public getFilterName(table_name: string, filter_id: number): Observable<string> {
        return new Observable((observer) => {

            this.getTableInfo(table_name).subscribe(_table_info => {
                observer.next(_table_info.getFilterName(filter_id))
            })
            return {
                unsubscribe() {
                }
            };
        });
    }

    public cacheRelatedTables(table_name_a: Array<string>): Observable<TableInfo> {

        let load_need_tables: Array<string> = table_name_a
        return new Observable((observer) => {
            if (table_name_a.length == 0) {
                observer.complete()
            }
            let isTableCacheExist = (table_name: string) => !!this._table_info_cache_by_table[table_name];
            table_name_a.forEach(table_name => {
                this.getTableInfo(table_name).subscribe(table_info => {
                    if (!table_info || !table_info.forms) {
                        observer.next(null)
                        if (load_need_tables.every(isTableCacheExist)) {
                            observer.complete()
                        }
                        return;
                    }
                    if (table_info) {
                        table_info.forms.getArray().forEach(_form => {
                            if (_form.original_type === 'select_other_table') {
                                if (load_need_tables.indexOf(_form.item_table) === -1) {
                                    load_need_tables.push(_form.item_table)
                                    this._connect.post('/admin/table/grant/' + _form.item_table, {}).subscribe(
                                        (data) => {
                                            if (data.view_grant == false) return
                                            this.getTableInfo(_form.item_table).subscribe((_table_info) => {
                                                observer.next(_table_info)
                                                if (load_need_tables.every(isTableCacheExist)) {
                                                    observer.complete()
                                                }
                                            })
                                        }
                                    )
                                }
                            }
                        })
                    }
                    observer.next(table_info);
                    if (load_need_tables.every(isTableCacheExist)) {
                        observer.complete()
                    }
                })
            });


            return {
                unsubscribe() {
                }
            };
        });
    }


    public resetTableInfoCache(table: string = null) {
        if (!table) {
            this._table_info_cache_by_table = {};
        } else {
            delete this._table_info_cache_by_table[table]
        }
    }

    public resetTableFormOptionListCache(table: string = null) {
        if (!table) {
            Object.keys(this._table_info_cache_by_table).map(table => {
                this._table_info_cache_by_table[table].resetFormOptionCache();
            })
        } else {
            this._table_info_cache_by_table[table].resetFormOptionCache();
        }
    }

    private _table_info_cache_by_table = {}
    private loading_tables: Array<string> = []

    public getTableInfo(table_name: string, is_iframe: boolean = false, iframe_params: Object = null, use_cache: boolean = true, handleError = true): Observable<TableInfo> {
        if (!table_name) {
            debugger;
        }
        if (is_iframe) {
            use_cache = false;
        }
        if (use_cache && this.loading_tables.indexOf(table_name) >= 0) {
            //同じテーブルを同時にロードしないように
            return new Observable((observer) => {
                let counter = 0;
                let interval = setInterval(() => {
                    // console.log('TABLE INFO INTERVAL')
                    if (this._table_info_cache_by_table[table_name]) {
                        observer.next(this._table_info_cache_by_table[table_name]);
                        clearInterval(interval)
                    } else if (++counter >= 10) {
                        clearInterval(interval)
                        this.getTableInfo(table_name, is_iframe, iframe_params).subscribe(_table_info => {
                            observer.next(_table_info);
                        });
                    }
                }, 200)
                return {
                    unsubscribe() {
                    }
                };
            });
        }

        if (use_cache && this._table_info_cache_by_table[table_name]) {

            return new Observable((observer) => {
                observer.next(this._table_info_cache_by_table[table_name]);
                return {
                    unsubscribe() {
                    }
                };
            });
        }

        let url = '/admin/table/info/' + table_name;
        let params = iframe_params ? iframe_params : null
        if (is_iframe) {
            url = '/iframe/table/info/' + table_name;
            params = iframe_params
        }

        this.loading_tables.push(table_name)
        return this._connect.post(url, params, {}, handleError).map((data) => {
            this.loading_tables = this.loading_tables.filter(_table_name => _table_name != table_name)
            if ((data['result'] != 'success')) {
                return null;
            }
            this._table_info_cache_by_table[table_name] = new TableInfo(data)
            return this._table_info_cache_by_table[table_name];
        });
    }

    public getForm(table_name: string, field_name: string): Observable<Form> {

        const observer: Observable<Form> = new Observable((observer) => {
            this.getTableInfo(table_name).subscribe(table_info => {
                if (!table_info) {
                    observer.next(null)
                } else {
                    observer.next(table_info.forms.byFieldName(field_name));
                }
            })
            return {
                unsubscribe() {
                }
            };
        });
        return observer;

    }


    public isMasterUser() {
        if (!this.user) {
            return false;
        }
        return this.user.type == 'master';
    }

    public isContactableUser() {
        if (!this.user) {
            return false;
        }
        return this.user.id == 1;
    }

    public uniqid(a = '', b = false) {
        const c = Date.now() / 1000;
        let d = c.toString(16).split('.').join('');
        while (d.length < 14) {
            d += '0';
        }
        let e = '';
        if (b) {
            e = '.';
            e += Math.round(Math.random() * 100000000);
        }
        return a + d + e;
    }

    private division_a: Array<any> = null;
    private is_division_loading: boolean = false;

    public getDivisionList(table_info: TableInfo): Observable<any> {
        if (this.division_a || this.is_division_loading) {
            const observer: Observable<any> = new Observable((observer) => {
                let interval = setInterval(() => {
                    if (this.division_a) {
                        observer.next(this.division_a)
                        clearInterval(interval)
                    }
                }, 200)
                return {
                    unsubscribe() {
                    }
                };
            });
            return observer;

        }
        this.is_division_loading = true
        return this._connect.getList(table_info).map(data => {
            this.division_a = data['data_a'].map((hash: Object) => {
                let _data: Data = new Data(table_info)
                _data.setInstanceData(hash)
                return _data;
            })
            this.is_division_loading = false
            return this.division_a
        })

    }

    private position_a: Array<any> = null;
    private is_position_loading: boolean = false;

    public getPositionList(table_info: TableInfo): Observable<any> {
        if (this.position_a || this.is_position_loading) {
            const observer: Observable<any> = new Observable((observer) => {
                let interval = setInterval(() => {
                    if (this.position_a) {
                        observer.next(this.position_a)
                        clearInterval(interval)
                    }
                }, 200)
                return {
                    unsubscribe() {
                    }
                };
            });
            return observer;

        }
        this.is_position_loading = true
        return this._connect.getList(table_info).map(data => {
            this.position_a = data['data_a'].map((hash: Object) => {
                let _data: Data = new Data(table_info)
                _data.setInstanceData(hash)
                return _data;
            })
            this.is_position_loading = false
            return this.position_a
        })

    }

    public getMainDivisionId(): number {
        if (this.user && this.user['main_division_id']) {
            return this.user['main_division_id']
        }
        return null
    }

    public getDivisionIds(): Array<number> {
        if (this.user && this.user['division_id_a']) {
            return this.user['division_id_a']
        }
        return []
    }


    get_value() {
        console.log('test')
        return 'test';
    }

    private userTableSettingByTable = {}
    getUserTableSetting(table: string): UserTableSetting {
        if (!!this.userTableSettingByTable[table]) {
            return this.userTableSettingByTable[table]
        }
        let userTableSetting: UserTableSetting = new UserTableSetting(table);
        let setting = null;
        try {
            setting = localStorage.getItem(table);
        } catch (e) {
            console.log('localstorage error')
        }
        if (setting) {
            console.log('LOCAL STORAGE FOUND!')
            userTableSetting.setByHash(JSON.parse(localStorage.getItem(table)))
        }
        this.userTableSettingByTable[table] = userTableSetting
        return userTableSetting
    }

    getFontSizeList(): Array<number> {
        return [...Array(16)].map((_, i) => {
            return i + 8
        });
    }

    copyMessage(val: string) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);
    }

    isLoading(loading_obj: Object): boolean {
        let loading: boolean = false
        Object.keys(loading_obj).forEach(obj_key => {
            loading = loading || loading_obj[obj_key]
        })
        return loading
    }

    getSummaryTypeTextBySummaryType(summary_type: string) {
        let name = '集計結果';
        this.summary_a.forEach(summary_hash => {
            if (summary_hash['value'] == summary_type) {
                name = summary_hash['name']
            }
        })
        return name
    }


    private getCustomCssSanitizeUrl() {
        let BASE_URL = '/';
        if (location.hostname.match(/localhost/)) {
            BASE_URL = 'http://localhost/'
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl(BASE_URL + 'api/admin/file-by-id/' + this.admin_setting['custom_css_file_info_id'] + '/css');

    }

    private getOemCustomCssSanitizeUrl() {
        const BASE_URL = window.location.origin;
        return this.sanitizer.bypassSecurityTrustResourceUrl(BASE_URL + '/assets/css/oem/custom.css');
    }

    public isDevEnvironment(): boolean {
        return location.hostname.match(/^dev.*\.pigeon-dev\.com$/) !== null;
    }

    public loadDevWarningText(): void {
        if (this.isDevEnvironment()) {
            // ---- DEVIN MUST CHANGE THIS WHEN CREATE PR ----
            this.dev_warning_text = '開発環境で実行中です。';
        }
    }

    public getMaxUploadFilesizeMB(): number {
        if (!this.cloud_setting) {
            return 50;
        }
        return parseInt(this.cloud_setting['max_upload_mb']) ?? 50;
    }

    public getMaxUploadZipFilesizeMB(): number {
        return 300;
    }

    public getMaxEmailNotifyLimit(): number {
        return parseInt(this.cloud_setting['notification_sendgrid_email_limit']) ?? 5000

    }

    get exist_table_a(): Array<SimpleTableInfo> {
        return this._exist_table_a.filter(t=>t.archive_flag == false);
    }

    public validateEmail(): boolean {
        var re = /^[a-z\d][\w.-]*@[\w.-]+\.[a-z\d]+$/i
        return re.test(this.user.email);
    }

    public useFreee(): boolean {
        return this.cloud_setting && this.cloud_setting['use_freee'] === 'true';
    }

    public useGoogleCalendar(): boolean {
        return this.cloud_setting && this.cloud_setting['use_google_calendar'] === 'true';
    }

    public usePhase(): boolean {
        return this.cloud_setting && this.cloud_setting['use_phase'] === 'true';
    }

    public useMasterUserAuth(table, modal_data, type = null): boolean {
        return this.cloud_setting && this.cloud_setting['use_master_user_auth'] === 'true' && (table == 'dataset' || type == 'upload_csv' || type == 'dataset' || type == 'truncate' || modal_data.length > 1)
    }

    checkStripeCreditExpired() {
        this._connect.get('/admin/stripe-card-check').subscribe((data) => {
            this.stripe_credit_expired_within_1_month = data['expired_within_1_month']
            this.stripe_credit_card = data['card'] ?? {};
        })
    }

    public sidebar_opened = true;
    public callbackOnScroll;
    public callbackEndScroll;


    updateToastrSetting(value: any = false){
        localStorage.setItem('not_close_toastr_auto', value);
    }


    getCurrentView() {
        if (location.href.match(/\/admin\/dataset__\d+\/edit/)) {
            return 'edit'
        }

        return 'other'
    }

    isSameType(form: Form, form2: Form, allow_multi: boolean = false): Observable<boolean> {

        return new Observable((observer) => {
            this.getLookupType(form, true).subscribe(field_type => {
                if (!form2) {
                    observer.next(false);
                    return;
                }
                this.getLookupType(form2, true).subscribe(copy_field_type => {
                    let form_original_type = form.original_type;

                    if (copy_field_type == 'calc') {
                        //calcはコピー不可
                        observer.next(false);
                        return;
                    }
                    if (!field_type || !copy_field_type) {
                        observer.next(false);
                        return;
                    }

                    if (!allow_multi && (form.is_child_form || form2.is_child_form)) {
                        observer.next(false);
                        return;
                    }
                    if (!allow_multi && (!!form.is_multi_value_mode || !!form2.is_multi_value_mode)) {
                        observer.next(false);
                        return;
                    }

                    if (!allow_multi && (!!form.is_multi_value_mode != !!form2.is_multi_value_mode)) {
                        observer.next(false);
                        return;
                    }

                    // https://loftal.pigeon-cloud.com/admin/dataset__90/view/1217 の実装中
                    // if(field_type !== copy_field_type && form_original_type == 'select_other_table'){
                    //     observer.next(field_type === 'text')
                    // }

                    observer.next(field_type === copy_field_type)
                })

            })
            return {
                unsubscribe() {
                }
            };
        });


    }

    public getLookupType(form: Form, format_to_text: boolean = false): Observable<string> {
        const observer: Observable<string> = new Observable((observer) => {
            if (!form) {
                observer.next(null)
                return;
            }
            let field_type = form.type;

            if (form.is_multi_value_mode) {
                observer.next('text')
                return;
            }

            if (format_to_text && ['number', 'calc', 'auto-id'].indexOf(field_type) >= 0) {
                observer.next('number')
                return;
            }
            if (format_to_text && ['select', 'radio'].indexOf(field_type) >= 0) {
                observer.next('text')
                return;
            }

            if (field_type == 'select_other_table') {

                this.getForm(form.item_table, form.item_fields[0]).subscribe(_form => {
                    this.getLookupType(_form).subscribe(type => {
                        observer.next(type)
                    })
                })

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


    public isMobile(): boolean {
        return window.innerWidth < 768;
    }

    public isProduction(): boolean {
        return this.env === 'production';
    }


}

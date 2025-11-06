import { isArray } from 'jquery';
import {Component, ElementRef, HostListener, KeyValueDiffers, OnInit, Renderer2, ViewChild} from '@angular/core';
import {SharedService} from '../services/shared';
import {User} from '../services/user';
import {Router} from '@angular/router'
import {Connect} from '../services/connect';
import ToastrService from '../toastr-service-wrapper.service';
import { DynamicOverFlowService } from 'app/services/utils/dynamic-overflow';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import {FaviconService} from '../services/favicon';
import {UploadProgressService} from '../service/UploadProgressService';


@Component({
    selector: 'app-dashboard',
    templateUrl: './full-layout.component.html',
    styleUrls: ['./full-layout.component.css']
})
export class FullLayoutComponent implements OnInit {
    private elreference : ElementRef


    private show_setting: boolean;
    private setting_name: string;
    public current_url: string;
    public tutorial_flag;
    // 以下元々あった関数
    public disabled = false;
    public status: { isopen: boolean } = {isopen: false};
    public click_group = {};
    public menus: Array<any>;
    public activedropdown : string;
    public current_open_menu : string;
    public accordionStatus:boolean;
    private total = 0;

    public toggle_up = true;

    @ViewChild('tableShortcut') tableShortcut: any;
    // tsvインポート用
    @ViewChild('adminTsvImport') AdminTsvImport: any;
    // jsonインポート用
    @ViewChild('adminJsonImport') AdminJsonImport: any;

    public labelText = '';
    public myControl: FormControl = new FormControl('');
    public options = [];
    public filteredOptions: Observable<Object[]>;
    uploadProgress: number = 0;

    fn: any;
    value: any;
    public recommended_browser: boolean = false;
    constructor(public _share: SharedService, private _user: User, public _router: Router, private differs: KeyValueDiffers,
                private _connect: Connect, toasterService: ToastrService, public dynamicOverflowService: DynamicOverFlowService,
                private _formBuilder: FormBuilder, private renderer: Renderer2, private FaviconService: FaviconService,private uploadProgressService: UploadProgressService) {
        this.show_setting = _share.show_setting;
        this.setting_name = _share.setting_name;
        // this.toasterService = toasterService;
        //console.log((performance.now() - this.calcTime));
        // this.getcurrentmenu()
        // console.log('constructor')
    }

    getTotal(Object){
        this.total = 0;
        Object.forEach(value => {
            value.badge_text
            if(!!value.badge_text) {
                this.total=this.total+value.badge_text;
            }
        });
        return this.total;
    }

    handleSearchClick(event) {
        this.labelText = '';
        this.tableShortcut.show();
        setTimeout(function () {
            $('#table_shortcut').focus();
        }, 500)
    }

    ngOnInit(): void {
        this.uploadProgressService.progress$.subscribe(progress => {
            this.uploadProgress = progress;
        });
        
        this._share.loadDevWarningText();
        let userAgent = navigator.userAgent.toLowerCase();
        if(userAgent.indexOf('chrome') != -1 || userAgent.indexOf('safari') != -1 || userAgent.indexOf('edge') != -1) {
            this.recommended_browser = true;
        }
        if(userAgent.indexOf('opr') != -1) {
            this.recommended_browser = false;
        }
        let label_list = []
        this._share.loadAdminDatas().then((data) => {
            const pathname = document.location.pathname.split('/').slice(0, -2).join('/') !== '' ? document.location.pathname.split('/').slice(0, -2).join('/') : document.location.pathname;
            data.menu_root.setActive(pathname);
            /*
            data.sorted_menu.forEach(menu => {
                if(Array.isArray(menu.value)){
                    menu.value.forEach(val => {
                        let pathname = document.location.pathname.split('/').slice(0,-2).join('/') != '' ? document.location.pathname.split('/').slice(0,-2).join('/') : document.location.pathname
                        if (val.link && val.link[0] == pathname) {
                            this.activedropdown = menu.key
                        }
                    });
                }
            })
             */

            data.exist_table_a.map(tableinfo => {
                if(tableinfo.grant.list){
                    let top_memo = data.getMenu(tableinfo.table).top_memo ?? '';
                    label_list.push({ name: tableinfo.getLabel(), table: tableinfo.table, top_memo: top_memo })
                }
            })
            this.options = label_list

            if (data.cloud_setting['use_analytics_ai'] == 'true') {
                this.FaviconService.setFavicon()
            }
        })
        if (this._share.getTrialRestDays() < 0) {
            this._user.logout().subscribe(() => {
                this._router.navigate([this._share.getAdminTable(), 'login']);
            });
        }

        this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map(val => typeof val === 'string' ? val : ''),
            map(val => val.length >= 1 ? this.filter(val) : []),
            tap(options => this.value = options)
        );

        // this.fn = (evt: KeyboardEvent) => {
        //     if (evt.code === 'ArrowDown' || evt.code === 'ArrowUp') {
        //         if (this.value.length === 1 && this.value[0].name === '検索結果はありません') {
        //             evt.stopPropagation();
        //         }
        //     }
        // }
        //
        // document.addEventListener('keydown', this.fn, true);
    }

    ngAfterViewInit(){

        this.dynamicOverflowService.overflowHidden.subscribe(value=>{
            this.accordionStatus=value;
        })
        // ドロップダウンの向き
        // setTimeout(() => {
        //     const element = document.querySelectorAll('.nav-menus')[0];
        //     let itemCount = 0;
        //     if (!element) {
        //         return;
        //     }
        //     Array.from(element.children).forEach(child => {
        //         if (child.classList.contains('nav-menus__item')) {
        //             itemCount++;
        //         }
        //     });
        //     if (itemCount < 4) {
        //         alert('dd')
        //         this.toggle_up = false;
        //     }
        // }, 1000);
    }

    ngAfterViewChecked() {
        if (!$('.side-bar .nav-link, .active').closest('.nav-dropdown').hasClass('open show')) {
            $('.side-bar .nav-link, .active').closest('.nav-dropdown').addClass('open show');
        }
    }

    // @HostListener('window:keyup',['$event'])
    // handleKeyboardEvent(event: KeyboardEvent) {
    //     if (event.code == 'Space' && (event.ctrlKey || event.metaKey)) {
    //         this.labelText = '';
    //         this.tableShortcut.show();
    //         setTimeout(function () {
    //             $('#table_shortcut').focus();
    //         }, 500)
    //     }
    //
    // }

// table shortcut
    // filter for autocomplete text
    filter(val: string): Object[] {
        const filterValue = this._normalizeValue(val);
        let result = this.options.filter(option => {
            return this._normalizeValue(option.name).includes(filterValue) || this._normalizeValue(option.top_memo).includes(filterValue)
        });
        return result.length>0 ? result: [{"name":'検索結果はありません', "table": null}];
    }

    private _normalizeValue(value: string): string {
        return value.toLowerCase().replace(/\s/g, '');
    }

    // navigate function
    toTable() {
        this.options.map(x => {
            this.tableShortcut.hide();
            if (x.name == this.labelText) {
                this._router.navigate([this._share.getAdminTable(), x.table])
            }
        })
        this.labelText = '';
    }

    public hideMobile() {
        if (document.body.classList.contains('sidebar-mobile-show')) {
            document.body.classList.toggle('sidebar-mobile-show')
        }
        //console.log((performance.now() - this.calcTime));
    }

    // openDropdown() {
    //     //console.log('openDropdown:');
    //     if (!$('.side-bar .nav-link, .active').closest('.nav-dropdown').hasClass('open show')) {
    //         $('.side-bar .nav-link, .active').closest('.nav-dropdown').addClass('open show');
    //         $('.side-bar .nav-link, .active').closest('.nav-dropdown-toggle').attr('aria-haspopup', 'false');
    //         $('.side-bar .nav-link, .active').closest('.nav-dropdown-toggle').attr('aria-expanded', 'true');
    //     }
    //     //console.log((performance.now() - this.calcTime));
    // }

    // closeDropdown() {
    //     //console.log('closeDropdown:');
    //     $('.nav-dropdown').removeClass('open show');
    //     $('.side-bar .nav-link, .active').closest('.nav-dropdown-toggle').attr('aria-haspopup', 'true');
    //     $('.side-bar .nav-link, .active').closest('.nav-dropdown-toggle').attr('aria-expanded', 'false');
    // }

    opennav(menukey) {
        this.current_open_menu = menukey
    }

    log(obj) {
        //console.log('log:');
        //console.log(obj);
        //console.log((performance.now() - this.calcTime));
    }

    asInOrder(a, b) {
        //console.log('asInOrder:');
        //console.log((performance.now() - this.calcTime));
        return 1;
    }

    isArray(menu) {
        //console.log('isArray:');
        return Array.isArray(menu);
    }

    getLicensePage() {
        //console.log('getLicensePage:');
        if (!this._share.cloud_setting['license_id']) {
            return 'https://pigeon-fw.com/mypage';
        } else {
            return 'https://pigeon-fw.com/mypage/change-license/' + this._share.cloud_setting['license_id'];
        }
    }

    public toUserPage() {
        this._router.navigate([this._share.getAdminTable(), 'admin']);

    }

    public toGrantPage() {
        this._router.navigate([this._share.getAdminTable(), 'admin_grant']);

    }

    public toNotiPage() {
        this._router.navigate([this._share.getAdminTable(), 'notification']);

    }

    public toDatasetPage() {
        this._router.navigate([this._share.getAdminTable(), 'dataset']);

    }

    public toViewPage() {
        this._router.navigate([this._share.getAdminTable(), 'view']);

    }

    public to(page) {
        this._router.navigate([this._share.getAdminTable(), page]);

    }
    @ViewChild('logoutConfirm') logoutConfirm: any;

    public logout( confirm:boolean = false) {
        console.error(this._share.cloud_setting)
        if(this._share.cloud_setting['contract_type'] == 'login_num' && !confirm){
            this.logoutConfirm.show()
            return;
        }
        //remove pre set filter when logout
        for (const menu of this._share.menu_a) {
            let tableSetting        = this._share.getUserTableSetting(menu.table);
            tableSetting.filter_id  = null;
            tableSetting.tmp_filter = null;
            tableSetting.view_id    = null;
        }
        this._user.logout().subscribe(() => {
            this._share.reset();
            this._router.navigate([this._share.getAdminTable(), 'login']);
        });
    }

    public toEditProfile() {
        this._router.navigate([this._share.getAdminTable(), this._share.getAdminTable(), 'view', this._share.user[this._share.admin_unique_key]]);
    }

    public toStorageManagement() {
        this._router.navigate([this._share.getAdminTable(), 'info', 'management']);
    }

    public toEditAdminSetting() {
        //console.log(this._share.user);
        this._router.navigate([this._share.getAdminTable(), 'admin_setting', 'edit', 1]);
    }

    public toSsoSettings() {
        this._router.navigate([this._share.getAdminTable(), 'sso-settings']);
    }

    public toEditImportMailSetting() {
        //console.log(this._share.user);
        this._router.navigate([this._share.getAdminTable(), 'import_pop_mail', 'view', 1]);
    }

    public goAdminInvoices() {
        this._router.navigate([this._share.getAdminTable(), 'admin_invoices']);
    }
    public toPayment() {
        //console.log(this._share.user);
        this._router.navigate([this._share.getAdminTable(), 'payment', 'pay']);
    }

    public toCommonGrantSetting() {
        //console.log(this._share.user);
        this._router.navigate([this._share.getAdminTable(), 'common_grant']);
    }

    // public toggled(open: boolean): void {
    //     //console.log('Dropdown is now: ', open);
    // }



    // public toggleDropdown($event: MouseEvent): void {
    //     $event.preventDefault();
    //     $event.stopPropagation();
    //     this.status.isopen = !this.status.isopen;
    // }


    //notification
    public toggleNotificationList(): void {
        let id_a = this._share.notification_a.map((data) => data['id']);
        this._connect.post(this._connect.getApiUrl() + '/admin/read-notification', {'id_a': id_a}).subscribe(() => {
            // set Read status as true
            this._share.notification_a.map((data) => data['read'] = 'true');
        });
    }

    public addNewDataset(): void {
        this._router.navigate([this._share.getAdminTable(), 'dataset', 'edit', 'new']);

    }

    public clickGroup(group_name: string) {
        if (this.click_group[group_name]) {
            this.click_group[group_name] = false;
        } else {
            this.click_group[group_name] = true;
        }
    }

    public clickMenu() {
        document.querySelector('body').classList.toggle('sidebar-mobile-show');
    }

    goNotificationPage() {
        this._router.navigate([this._share.getAdminTable(), 'in_app_notification']);

    }
    backtomyaccount() {
        this._connect.post('/api/admin/backmyaccount',{}).subscribe(_data => {
            this._share.loadAdminDatas().then(() => {
                window.location.reload()
            });
        })
    }

    add_template() {
        this._router.navigate([this._share.getAdminTable(), 'dashboard', {'type': 'add_template'}]);
    }

}

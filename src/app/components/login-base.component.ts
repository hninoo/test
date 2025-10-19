import {Component, OnInit} from '@angular/core';
import {User} from '../services/user';
import {ActivatedRoute, Router} from '@angular/router'
import {SharedService} from '../services/shared';
import ToastrService from '../toastr-service-wrapper.service';
import {Connect} from '../services/connect';
import {FormBuilder, FormGroup} from '@angular/forms';
import {CL} from '../services/check-license';
import {FaviconService} from '../services/favicon';
import {PusherService} from '../service/PusherService';

@Component({
    templateUrl: 'login.component.html',
})
export class LoginBaseComponent implements OnInit {


    public version;
    public admin_label;
    public powered_by = null;
    public sub_label;
    public is_disabled = true;
    public loading: boolean = false;
    myForm: FormGroup;
    myResetForm: FormGroup;
    public userinfo = {};
    private datas;
    public password_changed = true;
    public password_mismatch = false;
    public requiresCertificate: boolean = false;
    public allowOnlySecureAccess: boolean = false;
    private agree_to_terms_and_conditions: boolean = false;
    private view_terms_and_conditions;
    private terms_and_conditions_content: string;
    public terms_and_conditions_ui: boolean = false;
    private agree_to_terms_and_conditions_check: boolean = false;
    private redirect = {status: false, path: 'dashboard'}
    public is_ip_error: boolean = false;
    public admin_id = '';
    public login_credentials = '';
    public oem = false;

    public login_type: string = 'user';
    public auth_token: string = null;

    public reset_pw_hash: string = null;

    public display_google_login: boolean = false;
    public display_365_login: boolean = false;
    public ip: string = null;
    public isManageLogin: boolean = false;

    private user: Object = null;

    csrf_name = '';
    csrf_value = '';
    before_html = '';


    // Track visibility state for all password fields
    public passwordVisibility: { [key: string]: boolean } = {
        'password': false,
        'new_password': false,
        'confirm_new_password': false
    };

    protected admin_table: string;

    constructor(protected _user: User,
                protected _router: Router,
                protected fb: FormBuilder,
                protected _share: SharedService,
                protected _cl: CL,
                protected _route: ActivatedRoute,
                protected toasterService: ToastrService,
                protected _connect: Connect,
                private FaviconService: FaviconService,
                private pusherService: PusherService) {
        this.toasterService = toasterService;
        this.myForm = fb.group({
            'email': '',
            'password': '',
            'new_password': '',
            'confirm_new_password': '',
        });
        this.version = this._share.version;
    }


    resetPassword(value: string, csrf_error_count = 0): void {
        if (value['new_password'] != value['confirm_new_password']) {
            this.password_mismatch = true;
        } else {
            this.password_mismatch = false;
            this._user.resetPassword(value['email'], value['new_password'], this.reset_pw_hash, this.admin_table, this.csrf_name, this.csrf_value).subscribe(
                (jsonData) => {
                    if (jsonData['result'] === 'success') {
                        this.password_changed = true;
                        this.toasterService.success('パスワードを変更しました');
                        if(this.isForgotPassword){
                            this._router.navigate(['admin','login']);
                        }else{
                            // reset_hashをクリアしてからafterLoginを呼ぶ
                            this.user['password_changed'] = true
                            this.reset_pw_hash = null;
                            this._share.reset_hash = null;
                            this.afterLogin();
                        }
                    } else {
                        if (csrf_error_count === 0) {
                            this.load_csrf(() => {
                                this.resetPassword(value, csrf_error_count + 1);
                            });
                        } else {
                            this.load_csrf();
                            this.toasterService.error( jsonData['errors'].join('\n'), 'エラー');
                        }
                    }
                })
            ;

        }
    }

    agreeToTermsAndConditions() {
        if (!this.agree_to_terms_and_conditions_check) {
            this.toasterService.error('利用規約に同意する必要があります。', 'エラー');
        } else {
            const body = {admin_id: this.admin_id}
            this._connect.post('/admin/agree_to_terms_and_conditions', body).subscribe((jsonData) => {

            },(error)=>{
                this.agree_to_terms_and_conditions_check=false;
            }).add(() => {
                this.agree_to_terms_and_conditions = true;
                this.terms_and_conditions_ui = false
                this.afterLogin();
                }
            )
        }
    }

    login(value: string, csrf_error_count: number = 0): void {
        if (this.login_credentials == '') {
            this.login_credentials = value;
        }

        // Check if certificate is required but not present
        if (this.allowOnlySecureAccess && !this.requiresCertificate) {
            this.toasterService.error('セキュアドメインでのみログインが可能です', 'エラー');
            return;
        }

        this.loading = true;
        this._user.login(value['email'].trim(), value['password'].trim(), this.admin_table, this.csrf_name, this.csrf_value, this.login_type, this.auth_token, this.isManageLogin).subscribe(
            (jsonData) => {
                if (jsonData['result'] === 'success') {
                    if (jsonData['need_otp'] && jsonData['method'] === 'email') {
                        this._connect.post('/opt_code_send', {mail: value['email']}).subscribe(res => {
                            if (res['result'] == 'success') {
                                this._router.navigate(['twostepauth']);
                            } else {
                                this.loading = false

                                let error_message = 'エラーが発生しました'
                                if ('message' in res) {
                                    error_message = res['message']
                                }
                                this.toasterService.error(error_message, 'エラー');

                            }
                        })
                        return;

                    } else if (jsonData['need_otp'] && jsonData['method'] === 'qr') {
                        this._router.navigate(['twostepauth'], { queryParams: { type: 'qr' } });
                        return;
                    }

                    // 認証トークンを持ってログインしたとき
                    if (jsonData.auth_result) {
                        if (jsonData.auth_result.error) {
                            this.toasterService.error(jsonData.auth_result.error, 'エラー');
                        } else {
                            this.toasterService.success(jsonData.auth_result.success);
                        }
                    }

                    try {
                        localStorage.setItem(this.admin_table + '_access_token', jsonData['token']);
                    } catch (e) {
                        console.log('localstorage error')
                    }
                    this.reset_pw_hash = jsonData['reset_hash']
                    console.log('Login response reset_hash:', jsonData['reset_hash']);
                    // reset_hashがある場合は_shareにも設定
                    if (jsonData['reset_hash']) {
                        this._share.reset_hash = jsonData['reset_hash']
                        console.log('Set _share.reset_hash:', this._share.reset_hash);
                    }
                    this.afterLogin(jsonData.user)
                    //max device error for 4th device
                    if (jsonData['max_device_error']){
                        this.toasterService.error(jsonData['max_device_error'])
                    }

                } else {
                    this.loading = false;
                    // console.log('count:' + this.csrf_error_count);
                    if (csrf_error_count === 0) {
                        // console.log('load again');
                        this.load_csrf(() => {
                            this.login(value, csrf_error_count + 1);
                        });
                    } else {
                        this.load_csrf();
                        this.toasterService.error(jsonData['errors'].join('\n'), 'エラー');
                    }
                }
            })
        ;
    }

    afterLogin(_user = null) {
        if (!_user) {
            _user = this.user
        }
        this.user = _user;

        // Note: Pusher is initialized in SharedService.loadAdminDatas()

        if (!this.agree_to_terms_and_conditions) {
            //FIXME: use User Class
            this.agree_to_terms_and_conditions = _user.agree_to_terms_and_conditions === true || _user.agree_to_terms_and_conditions === 'true';
        }
        this.admin_id = _user.id;

        localStorage.setItem('admin_table', this.admin_table);

        // パスワード変更が必要な場合はinit_dataを呼ばない
        if (this.reset_pw_hash || (this._share.reset_hash)) {
            console.log('Password change required, skipping init_data');
            this.password_changed = false;
            this.sub_label = 'パスワードを変更してください。'
            this.loading = false;
            return;
        }

        this.loading = true;
        this._share.loadAdminDatas().then((data) => {
            this.loading = false;
            this.userinfo = data.admin_setting
            this.view_terms_and_conditions = JSON.parse(this.userinfo['setTermsAndConditions']);
            if (this.view_terms_and_conditions && !this.agree_to_terms_and_conditions) {
                this._connect.get('/admin/terms_and_conditions').subscribe((json) => {
                    this.terms_and_conditions_content = json.result['content']
                }).add(() => this.terms_and_conditions_ui = true)
            } else {
                console.log('AfterLogin check - password_changed:', _user.password_changed);
                console.log('AfterLogin check - ignore_new_pw_input:', this.userinfo['ignore_new_pw_input']);
                console.log('AfterLogin check - _share.reset_hash:', this._share.reset_hash);
                console.log('AfterLogin check - this.reset_pw_hash:', this.reset_pw_hash);

                if ((!_user.password_changed && this.userinfo['ignore_new_pw_input'] == 'false') || this._share.reset_hash || this.reset_pw_hash) {
                    console.log('Password change required!');
                    if (this._share.reset_hash || this.reset_pw_hash) {
                        this.reset_pw_hash = this._share.reset_hash || this.reset_pw_hash;
                        console.log('Using reset_hash:', this.reset_pw_hash);
                    }
                    // ログアウトせずにパスワード変更画面を表示
                    this.password_changed = false;
                    this.sub_label = 'パスワードを変更してください。'
                    console.log('Set password_changed to false, should show password change form');
                    return;
                }
                this._user.getUser().then((_user) => {
                    if (!_user) {
                        console.error('User data is null');
                        return;
                    }
                    localStorage.removeItem('redirect_to');
                    this._share.setUser(_user);
                    if (!!_user['redirect_url_after_login']) {
                        this._router.navigate(_user['redirect_url_after_login'].split('/'));
                    } else {
                        if (this.redirect.status) {
                            localStorage.removeItem('redirect_to');
                            this._router.navigateByUrl(this.redirect.path);
                            return
                        } else {
                            this._router.navigate([this.admin_table, 'dashboard']);
                        }
                    }
                }).catch((error) => {
                    console.error('Failed to get user data:', error);
                })

            }

        });
    }

    getShare() {
        return this._share;
    }

    ngOnInit() {
        // Monitor Pusher connection status
        setInterval(() => {
            if (!this.pusherService.isChannelReady()) {
                console.warn('Pusher channel not ready');
                // Don't show error to user - Pusher is non-critical
            }
        }, 5000);

        // Check certificate status
        this._connect.get('/check-cert', { observe: 'response' }).subscribe({
            next: (response) => {
                // If we get a 200, certificate is valid or not required
                // Stay on login page
            },
            error: (error) => {
                if ((error.status === 401 || (error && error.error && (
                    error.error.error_type === 'client_cert_required' ||
                    error.error.error_type === 'client_cert_invalid' ||
                    error.error.error_type === 'client_cert_expired'
                ))) && !location.href.match(/maintenance-cert/)) {
                    console.log('Client certificate error:', error.status === 401 ? '401 SSL Certificate Error' : error.error.error_type);
                    window.location.href = '/maintenance-cert';
                    return;
                }
            }
        });

        // this._connect.get('/sendmail').subscribe(res => console.log(res))
        let _login_user = JSON.parse(localStorage.getItem('login_user'))
        if (_login_user) {
            this.myForm.controls['email'].setValue(_login_user['email'])
            try {
                localStorage.removeItem('login_user')
            } catch (e) {
                console.log('localstorage error')
            }
            this.afterLogin(_login_user)
        }

        if (this._route.snapshot.routeConfig.path === 'user/forgot-password') {
            console.log(this._route.snapshot.routeConfig.path)
            this.isForgotPassword = true;
            this._route.queryParams.subscribe(param => {
                if (param.reset_hash) {
                    this.handleCheckResetHash(param.reset_hash)
                    this.reset_pw_hash = param.reset_hash;
                    this.forgot_pw_hash = param.reset_hash;
                }
            })
        }

        this._route.queryParams.subscribe(param => {
            if (param.redirect_to) {
                this.redirect = {status: true, path: param.redirect_to}
                localStorage.setItem('redirect_to', param.redirect_to);
            }
            if (!param.redirect_to && localStorage.getItem("redirect_to")) {
                this.redirect = { status: true, path: localStorage.getItem("redirect_to") };
            }
        })
        this._route.params.subscribe(params => {
            let table = 'admin';
            if (params['db'] !== undefined) {
                table = params['db'];
            }
            if (params['olddb'] !== undefined) {
                table = params['olddb'];
                this._router.navigate([table, 'login']);
                return
            }
            if (params['type']) {
                this.login_type = params['type']
            }
            if (params['auth_token']) {
                this.auth_token = params['auth_token']
            }

            // manage-login パスかどうかを判断
            if (this._router.url.endsWith('/manage-login')) {
                this.isManageLogin = true;
            }
            this.admin_table = table;
            this.load_before_html(table);

            this._connect.get('/login/get_table_data/' + this.admin_table).subscribe((data) => {
                if (data['status'] === 'error' && data['type'] === 'ip') {
                    this.is_ip_error = true;
                    this.ip = data['ip'];

                    return;
                }

                if (data.menu_exist === false) {
                    if (data.error_a !== null) {
                        this.toasterService.error(data.error_a['errors'].join('\n'), 'エラー');
                        return;
                    } else {
                        this.toasterService.error('ログインurlが誤っています。管理者にお問い合わせください。', 'エラー');
                        return;
                    }
                }

                this.admin_label = data['label'];
                this.sub_label = '';
                this.display_google_login = data['google_login']
                                console.log(this.display_google_login);

                if (data.texts !== undefined) {
                    if (data.texts !== null) {
                        if (data.texts.login !== undefined && data.texts.login.ja !== undefined) {
                            this.admin_label = data.texts.login.ja;
                        }
                        if (data.texts['login-sub'] !== undefined && data.texts['login-sub'].ja !== undefined) {
                            this.sub_label = data.texts['login-sub'].ja;
                        }
                    }
                }

                this.admin_label = data['label'];
                this.sub_label = '';
                this.allow_forgot_password = data['allow_forgot_password']
                this.display_365_login = data['365_login']
                                                console.log(this.display_365_login);
                if(this.isForgotPassword && !this.allow_forgot_password) this._router.navigate(['admin','login'])
                if (data.texts !== undefined) {
                    if (data.texts !== null) {
                        if (data.texts.login !== undefined && data.texts.login.ja !== undefined) {
                            this.admin_label = data.texts.login.ja;
                        }
                        if (data.texts['login-sub'] !== undefined && data.texts['login-sub'].ja !== undefined) {
                            this.sub_label = data.texts['login-sub'].ja;
                        }
                    }
                }
                if (data['oem_imanishi'] == 'true') {
                    this.oem = true;
                    this.FaviconService.setFavicon()
                    this.admin_label = 'CandyCloudにログイン'
                    this.powered_by = 'CandyCloud'
                }
            });
        });

        this.load_csrf();
    }


    load_csrf(callback = null) {
        return this._connect.get('/csrf_token').subscribe((res) => {
            this.csrf_name = res['csrf_name'];
            this.csrf_value = res['csrf_value'];
            if (callback) {
                callback();
            }
        });
    }

    load_before_html(db) {
        this._connect.get('/login/load_before_html/' + db).subscribe((res) => {
            this.before_html = res['html'];
        });
    }

    /**
     * Forgot Password
     */
    public allow_forgot_password: boolean = false;
    public forgot_pw_hash: string = null;
    public isForgotPassword: boolean = false;
    handleForgotSubmit(){

        if (this.myForm.value.email != '') {
            this.handleRequestResetPassword(this.myForm.value)
        } else if (this.password_changed) {
            this.toasterService.error('有効なメールアドレスを入力してください。')
        }
        if (!this.password_changed && this.reset_pw_hash) {
            this.resetPassword(this.myForm.value)
        }

    }
    handleCheckResetHash(forgot_pw_hash){
        this._connect.post('/forgot-password/check_link', { reset_hash: forgot_pw_hash }).subscribe(
            (jsonData) => {
                this.loading = false;
                if (jsonData['result'] === 'success') {
                    this.password_changed = false;
                } else {
                    this.toasterService.error(jsonData['errors'].join('\n'), 'エラー');
                }
            }
        );
    }

    handleRequestResetPassword(data) {
        this.loading = true;
        this._connect.post('/forgot-password/request', { email: data.email }).subscribe(
            (jsonData)=>{
                this.loading = false;
                if (jsonData['result'] === 'success') {
                    this.toasterService.clear();
                    this.toasterService.success('パスワードリセットのメールを送信しました。メールをご確認ください。');
                    this.myForm.reset({'email':''});
                } else {
                    this.toasterService.error(jsonData['errors'].join('\n'), 'エラー');
                }
            }
        );
    }

    /**
     * Toggle password visibility for any password field
     * @param event The click event
     * @param fieldId The ID of the password field
     */
    togglePasswordVisibility(event: any, fieldId: string): void {
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
                inputElement.type = this.passwordVisibility[fieldId] ? 'text' : 'password';
            }
        }
    }
}

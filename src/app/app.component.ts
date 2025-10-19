import {Component, Inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router} from '@angular/router'
import {User} from './services/user';
import {Connect} from './services/connect';
import {SharedService} from './services/shared';
import {DOCUMENT} from '@angular/common';
import {CL} from './services/check-license';
import ToastrService from './toastr-service-wrapper.service';

@Component({
    // tslint:disable-next-line
    providers: [User],
    selector: 'body',
    template: '<router-outlet></router-outlet>',

})

export class AppComponent {
    menu_a;
    _share;

    constructor(private _http: HttpClient, private router: Router, private _route: ActivatedRoute,
                private user: User, private _connect: Connect, private _cl: CL, _share: SharedService, @Inject(DOCUMENT) private document: any,
                protected toasterService: ToastrService,) {
        const __this = this;
        this._share = _share;
        this.toasterService = toasterService;
        let g = __this.document.location.href.match(/https?:\/\/.*?\/(.*?)\//)
        let path = __this.document.location.pathname
        let search_query = this.document.location.search
        if (g !== null && g.length > 1 && g[1] === 'cms') {
            g = __this.document.location.href.match(/https?:\/\/.*?\/.*?\/(.*?)\//)
        }
        if (g !== null && g.length > 1 && g[1] !== undefined) {
            _share.setAdminTable(g[1]);
        }
        if (__this.document.location.href.match(/\/public/)) {
            //PUBLIC IFRAME MODE
            return;
        }
        if (__this.document.location.href.match(/\/reset/)) {
            //RESETMODE
            return;
        }
        if (__this.document.location.href.match(/\/maintenance/)) {
            //MAINTENANCE
            return;
        }
        if (g === null) {
            location.href = `/admin/login${search_query}`;
            // __this.router.navigate(['admin','login']);
            // window.alert("URLが誤っています。");
            return;
        }

        user.getUser().then(
            (_user) => {
                if (_user === null) {
                    if (!path.match(/login/)) {
                        if (path == '/user/forgot-password'){
                            __this.router.navigate(['user', 'forgot-password'], { queryParamsHandling: 'preserve' });
                            return;
                        }
                        localStorage.setItem('redirect_to', path + search_query);
                        __this.router.navigate([__this._share.getAdminTable(), 'login'], {queryParams: {redirect_to: path+search_query}});
                    } else {
                        if (path == '/user/forgot-password') {
                            __this.router.navigate(['user', 'forgot-password'], { queryParamsHandling: 'preserve' });
                            return;
                        }
                        if (path == '/admin/login/master') {
                            __this.router.navigate([__this._share.getAdminTable(), 'login', 'master']);
                        } else {
                            if (path.match(/login/)) return;
                            __this.router.navigate([__this._share.getAdminTable(), 'login']);
                        }
                    }
                } else {
                    if (__this.document.location.href.match(/login/)) {
                        if (localStorage.getItem('redirect_to')) {
                            const redirect_url = location.href = localStorage.getItem('redirect_to');
                            localStorage.removeItem('redirect_to');
                            location.href = redirect_url;
                        }
                        if (path.includes('auth')) {
                            const auth_token = path.match(/auth\/(.+)/)[1];
                            this._connect.post('/admin/auth-master-user/get-result', { 'auth_token': auth_token }).subscribe((data) => {
                                if (data.auth_result.error) {
                                    this.toasterService.error(data.auth_result.error, 'エラー');
                                } else {
                                    this.toasterService.success(data.auth_result.success);
                                }
                            })
                        }

                        __this.router.navigate([__this._share.getAdminTable(), 'dashboard']);
                    }

                    __this._share.setUser(_user);
                    if (__this._share.isMasterUser()) {
                        this.loadScript()
                    }
                }
            }
        );
        localStorage.removeItem('debug_mode');
        if (window.performance && window.performance.getEntriesByType('navigation').length && window.performance.getEntriesByType('navigation')[0]['type'] == 'reload') {
            localStorage.removeItem('set_position')
        }
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                scrollTo(0, 0); // ページ遷移後最上部へスクロール
            }
        })
    }

    loadScript() {
        return;
        const script = document.createElement('script');
        script.src = 'https://static.zdassets.com/ekr/snippet.js?key=0539d2ca-a74a-4891-bae4-ac1a6c578521';
        script.id = 'ze-snippet';
        document.head.appendChild(script);
        console.log('LOAD!')
    }
}

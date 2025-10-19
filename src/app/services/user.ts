import {NgModule} from '@angular/core';
import 'rxjs/Rx';
import {environment} from '../../environments/environment';
import {Connect} from './connect';
import {SharedService} from './shared';
import ToastrService from '../toastr-service-wrapper.service';
import {PusherService} from '../service/PusherService';

@NgModule({
    imports: [],
    providers: [Connect],
    declarations: []
})
export class User {
    private api_url = environment.api_url;
    private user = null;
    private toasterService: ToastrService;
    constructor(private _connect: Connect, 
                private _share: SharedService, 
                toasterService: ToastrService,
                private pusherService: PusherService) {
        this.toasterService = toasterService
    }

    getUser() {
        return new Promise((resolve, reject) => {
            this._connect.get('/admin/info', null, null, false).subscribe(
                (json) => {
                    if (json['result'] == 'success') {
                        if (json['admin']['id'] == null) {
                            this.logout();
                        } else {
                            this.user = json['admin'];
                        }
                    } else if (json['redirect']) {
                        location.href = json['redirect']
                    }
                    return resolve(this.user);

                },
                (error) => {
                    console.log(error)
                    if (error && error.error && error.error.error_type == 'login_max_device_error') {
                        this.toasterService.warning(error.error.error_message);
                        setTimeout(() => {
                            location.reload()
                        }, 1000);
                        return;
                    }
                    return resolve(this.user);
                }
            )

        });

    }

    login(email, password, admin_table, csrf_name = null, csrf_value = null, login_type: string = null, auth_token: string = null, isManageLogin: boolean = false) {
        const body = {
            email: email,
            password: password,
            admin_table: admin_table,
            csrf_name: csrf_name,
            csrf_value: csrf_value,
            login_type: login_type,
            auth_token: auth_token,
            isManageLogin: isManageLogin
        };
        return this._connect.post('/login/admin', body);
    }

    resetPassword(email, new_password, pw_hash: string, admin_table, csrf_name = null, csrf_value = null) {
        const body = {
            email: email,
            password: new_password,
            admin_table: admin_table,
            reset_hash: pw_hash,
            csrf_name: csrf_name,
            csrf_value: csrf_value
        };
        return this._connect.post('/admin/reset_password', body);
    }

    logout() {
        // Cleanup Pusher before other logout operations
        if (this.pusherService) {
            this.pusherService.cleanup();
        }
        
        try {
            localStorage.removeItem('admin_access_token');
            localStorage.removeItem('admin_table');
            localStorage.removeItem('set_position');
            let arr = [];
            /*
            for (let i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).substring(0, 17) == 'fixed-field-name-' || localStorage.key(i).substring(0, 12) == 'fixed-fields') {
                    arr.push(localStorage.key(i))
                }
            }
             */


            // Iterate over arr and remove the items by key
            arr.map(x => {
                localStorage.removeItem(x) // eslint-disable-line
            })
        } catch (e) {
            console.log('localstorage error')
        }
        this._share.reset();
        //localStorage.removeItem('confirmOtp');
        // this._connect.get(this.api_url + '/admin/cache_clear').subscribe(data=>{})
        return this._connect.get(this.api_url + '/admin/logout');
    }
}

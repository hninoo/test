import {Component, OnInit} from '@angular/core';
import {Connect} from 'app/services/connect';
import {FormBuilder, FormGroup} from '@angular/forms';

import {ActivatedRoute, Router} from '@angular/router';
import ToastrService from '../toastr-service-wrapper.service';
import {User} from 'app/services/user';
import {Location} from '@angular/common';
import {SharedService} from 'app/services/shared';

@Component({
    selector: 'app-two-factor',
    templateUrl: './two-factor.component.html',
    styleUrls: ['./two-factor.component.scss']
})
export class TwoFactorComponent implements OnInit {
    protected toasterService: ToastrService;

    public value
    public otp
    public label
    private admin_table
    private redirect = {status: false, path: 'dashboard'}

    myForm: FormGroup;

    constructor(private _share: SharedService, private _connect: Connect, protected fb: FormBuilder, private _router: Router, toasterService: ToastrService, protected _user: User, protected _location: Location,protected _route: ActivatedRoute) {
        this.toasterService = toasterService;
        this.myForm = fb.group({
            'otp': ''
        })
    }


    ngOnInit() {
        this._route.queryParams.subscribe(params => {
            if (params['type'] === 'qr') {
                this.label = 'Authenticatorアプリで生成されたコードを入力してください。';
            } else {
                this.label = '確認コードがメールアドレス宛に送信されました。';
            }
        });
        this.admin_table = 'admin'
        this._route.queryParams.subscribe(params => {
            if (params.redirect_to) {
                this.redirect = { status: true, path: params.redirect_to }
            }
        })
    }

    confirm(value: string): void {
        this.toasterService.clear();

        this._connect.post('/otp_confirm', {'otp': value['otp']}).subscribe(res => {
            if (res['message'] == true) {
                //localStorage.setItem('confirmOtp', 'true');
                try {
                    localStorage.setItem('login_user', JSON.stringify(res['user']));
                } catch (e) {
                    console.log('localstorage error')
                }
                this._router.navigate([this.admin_table, 'login']);
                return;
            } else {
                this.toasterService.error(res['message'] == false ? 'コードが誤っています' : res['message'], 'エラー');
                return;
            }
        })
        // after confirm otp
    }
}

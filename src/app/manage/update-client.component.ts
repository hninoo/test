import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import ToastrService from '../toastr-service-wrapper.service';
import {ActivatedRoute} from '@angular/router';


@Component({
    selector: 'app-update-client',
    templateUrl: './update-client.component.html',
})
export class UpdateClientComponent implements OnInit {
    public type = 'trial_expired';
    public loading: boolean = false;

    public email = 'admin';
    public client_name = null;

    public result: Object = null;
    public setting: Object = null;

    public url: string;

    public trial_expired: Date = null;
    public master_user: Object = null;
    public payment: Object = null;
    public next_payment: Object = null;
    public options: Array<Object> = [
        {
            type: 'mail_option',
            name: 'メール配信機能',
            price_str: ' (8,000円 + 税/月)',
            price: 8000,
            checked: false
        },
        {
            type: 'enable_api',
            name: 'API利用',
            price_str: ' (5,000円 + 税/月, ３万コール/月)',
            price: 5000,
            checked: false
        },
        {
            type: 'enable_filesearch',
            name: 'AIファイル検索機能',
            price_str: '',
            price: 0,
            checked: false
        }
    ]

    constructor(public _connect: Connect, public _share: SharedService, private toasterService: ToastrService, private _route: ActivatedRoute) {
    }


    ngOnInit(): void {
        console.log(location.hostname)
        if (!location.hostname.match(/pigeon\-cloud\.com$/)) {
            this.client_name = 'pigeon_test';
        }
        if (location.hostname.match(/pigeon\-cloud\.com$/) && !location.hostname.match(/^loftal/)) {
            location.href = '/'
        }


    }

    getSetting() {
        this._connect.get(this._connect.getApiUrl() + '/admin/get-client-setting/' + this.client_name).subscribe(res => {
            this.setting = res.setting;
            this.master_user = res.master;
            this.payment = res.payment;
            this.next_payment = res.next_payment;
            if (this.payment) {
                this.payment['option'] = JSON.parse(this.payment['options'])
            }
            if (this.next_payment) {
                this.next_payment['option'] = JSON.parse(this.next_payment['options'])
            }
            if (this.setting['trial_expired']) {
                this.trial_expired = new Date(this.setting['trial_expired']);
            }
            console.log(this.setting)
        });
    }

    update() {
        if (confirm('即時更新されます。よろしいですか？')) {
            this.loading = true;
            this._connect.post(this._connect.getApiUrl() + '/admin/update-client-setting/' + this.client_name, {
                'setting': this.setting
            }).subscribe(res => {
                this.loading = false;
                this.result = res;
                console.log(res)
                this.toasterService.success('update succeeded')
            }, err => {
                this.loading = false;
                this.toasterService.error('update failed')

            })
        }

    }

    update_master() {
        if (confirm('マスターユーザー(ID:1)の情報が変更されます。よろしいですか？')) {
            this.loading = true;
            this._connect.post(this._connect.getApiUrl() + '/admin/update-client-master/' + this.client_name, {
                'master': this.master_user
            }).subscribe(res => {
                this.loading = false;
                this.result = res;
                console.log(res)
                this.toasterService.success('update succeeded')
            }, err => {
                this.loading = false;
                this.toasterService.error('update failed')

            })
        }
    }

    datetimeValueChanged(event, field, type = 'date') {
        let value = this.setting[field];
        //if event type is Date
        if (event instanceof Date) {
            value = event;
        }
        if (!!value) {
            value = this._share.getDateTimeStringByDate(value, type);
        } else {
            value = null
        }

        this.setting[field] = value;
        if (field === 'trial_expired') {
            this.trial_expired = new Date(value);
        }
    }

}

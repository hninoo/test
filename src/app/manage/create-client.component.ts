import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import ToastrService from '../toastr-service-wrapper.service';
import {ActivatedRoute} from '@angular/router';


@Component({
    selector: 'app-create-client',
    templateUrl: './create-client.component.html',
    styleUrls: ['./create-client.component.css']
})
export class CreateClientComponent implements OnInit {
    public loading: boolean = false;

    public email = 'admin';
    public client_name = null;

    public result: Object = null;

    public url: string;

    constructor(public _connect: Connect, public _share: SharedService, toasterService: ToastrService, private _route: ActivatedRoute) {
    }


    ngOnInit(): void {
        console.log(this._share.env)
        if (this._share.env == 'production' && !location.hostname.match(/^loftal/)) {
            location.href = '/'
        }
    }

    create() {
        this.loading = true;
        this._connect.post(this._connect.getApiUrl() + '/admin/create-trial', {
            'email': this.email,
            'domain': this.client_name,
        }).subscribe(res => {
            this.loading = false;
            this.result = res;
            this.url = res['url']
            console.log(res)
        })

    }


}

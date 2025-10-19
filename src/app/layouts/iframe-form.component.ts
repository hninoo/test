import {Component, KeyValueDiffers, OnInit} from '@angular/core';
import {SharedService} from '../services/shared';
import {User} from '../services/user';
import {ActivatedRoute, Router} from '@angular/router'
import {Connect} from '../services/connect';
import ToastrService from '../toastr-service-wrapper.service';

@Component({
    selector: 'iframe-form',
    templateUrl: './iframe-form.component.html',
    //styleUrls: ['./iframe-form.component.css']
})
export class IframeFormComponent implements OnInit {

    private show_setting: boolean;
    private setting_name: string;
    public current_url: string;
    public tutorial_flag;
    // 以下元々あった関数
    public disabled = false;
    public status: { isopen: boolean } = {isopen: false};

    public filter_id: number = null;
    public public_form_hash: string = null;

    //ユーザー個別URLの場合の、もとのデータのID
    public rid: number = null;

    constructor(private _route: ActivatedRoute, public _share: SharedService, private _user: User, private _router: Router, private differs: KeyValueDiffers, private _connect: Connect, toasterService: ToastrService) {
        this.show_setting = _share.show_setting;
        this.setting_name = _share.setting_name;
    }

    ngOnInit(): void {
        document.body.classList.toggle('embed_mode')
        this._route.params.subscribe(params => {
            if (params['filter_id'] && params['filter_id'] != 0) {
                this.filter_id = params['filter_id']
            }
            this.public_form_hash = params['hash']
            if (params['rid']) {
                this.rid = params['rid']
            }
        });
    }
}

import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'

import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';

@Component({
    templateUrl: './page.component.html',
})
export class PageComponent implements OnInit {
    public page_title: string;
    public loading = true;
    public data: {};

    private id: number;
    private page: string;
    private html: string;
    private menu: {};


    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _share: SharedService) {
    }

    ngOnInit() {
        // 一つ上のコンポーネントのパラメータ（なぜかparent.parent）
        this._route.parent.parent.params.subscribe(params => {
            this.page = params['table'];
            this.load();
        });
    }

    load() {
        this.loading = true;
        this._connect.get('/admin/table/page/' + this.page).subscribe((data) => {
            if (data['result'] !== 'success') {
                this._router.navigate([this._share.getAdminTable(), 'login']);
                return;
            }
            this.html = data['html'];
            this.loading = false;
        });
    }

}

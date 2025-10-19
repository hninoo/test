import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'

import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';

@Component({
    templateUrl: './group-index.component.html',
    styleUrls: ['./group-index.component.scss']
})
export class GroupIndexComponent implements OnInit {
    public page_title: string;
    public loading = true;
    public data: {};
    public menu_node;
    public breadcrumbs;
    private id: string;

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _share: SharedService) {
    }

    ngOnInit() {
        // console.log('group index');
        this._share.header_dataset_name = '';
        this._share.header_dataset_count = 0;
        this._share.header_dataset_img = '';
        this._route.params.subscribe(params => {
            this.id = params['id'];
            if (this._share.menu_root) {
                this.setNode();
            } else {
                this._share.loadAdminDatas().then(() => {
                    this.setNode();
                });
            }
        });
    }
    setNode() {
        const {node, breadcrumbs} = this._share.menu_root.find(this.id);
        this.menu_node = node;
        breadcrumbs.shift();
        this._share.breadcrumbs = breadcrumbs;
        this.loading = false;
        // console.log(this.menu_node);
        // console.log(this.breadcrumbs);
    }

}

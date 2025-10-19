import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router'

import ToastrService from '../../toastr-service-wrapper.service';

import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';
import {TableInfo} from '../../class/TableInfo';
import {Conditions} from '../../class/Conditions';

@Component({
    selector: 'app-dashboard',
    templateUrl: './search.component.html',
})
export class SearchComponent implements OnInit {
    public page_title: string;
    public loading = true;
    public before_html;
    public sending = false;
    public conditions: Conditions;
    private child_a: Array<any>;

    public table_info: TableInfo;

    private toasterService: ToastrService;

    private table: string;

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, private _share: SharedService, toasterService: ToastrService) {
        this.toasterService = toasterService;
    }

    ngOnInit() {

        this.conditions = new Conditions();

        this._route.params.subscribe(params => {
            if (!!params['condition_json']) {
                this.conditions.setByJson(params['condition_json'])
            }
            this.table = params['table']
        });
        this.load();
    }

    load() {
        this.loading = true;
        this._connect.get('/admin/table/info/' + this.table).subscribe((data) => {
            if (data['result'] != 'success') {
                this._router.navigate([this._share.getAdminTable(), 'login']);
                return;
            }

            this.page_title = data['menu'].name + '検索';
            this._route.snapshot.data['title'] = this.page_title;
            this.before_html = data['before_html'];

            this.table_info = new TableInfo(data);
            this.child_a = data['child_a'];
            data['child_a'].forEach((child, index) => {
                child.data = {};
            });

            this.loading = false;
            if (this.conditions.condition_a.length == 0) {
                this.conditions.addCondition();
            }
        });
    }


    validate() {
        var flg = true;
        if (!this.conditions.validate()) {
            this.toasterService.error(this.conditions.error_message, 'エラー');
            return false;
        }
        return true;
    }

    search() {

        //const get_data = this.get_post_data();
        if (!this.validate()) {
            return false;
        }
        this._router.navigate([this._share.getAdminTable(), this.table, {'condition_json': this.conditions.getSearchParamJson()}]);

    }

    addCondition() {
        this.conditions.addCondition();
    }

    delCondition(i) {
        this.conditions.deleteCondition(i);
    }

    onValueChanged($event) {
        this.conditions.replaceCondition($event.index, $event.condition);
    }


}

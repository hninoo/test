import {Component, Input} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';

@Component({
    selector: 'admin-view-chip-list',
    templateUrl: './chip-list.component.html',
})

export class ViewChipListComponent {
    @Input('fields') fields: Array<any>;
    @Input('forms') forms: {};
    @Input('data_a') data_a: Array<any>;
    @Input('table') table: {};

    private field: string;
    allDatas: string[] = [];

    constructor(private _router: Router, private _route: ActivatedRoute, private _share: SharedService) {

    }

    ngOnInit() {
        this.field = '';
        for (const key in this.forms) {
            if (['id', 'order', 'created', 'updated'].indexOf(key) == -1) {
                this.field = key;
            }
        }
        this.data_a.forEach((data, index) => {
            this.allDatas.push(data[this.field]);
        });
    }

    view(data) {
        this._router.navigate([this._share.getAdminTable(), this.table, 'view', data.id]);
    }
}

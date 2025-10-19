import {Component, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router'
import {SharedService} from '../../services/shared';
import {Forms} from '../../class/Forms';
import {Data} from '../../class/Data';

@Component({
    selector: 'admin-view-table-list',
    templateUrl: './table-list.component.html',
})

export class ViewTableListComponent {
    @Input('fields') fields: Array<any>;
    @Input('forms') forms: Forms;
    @Input('data_a') data_a: Array<Data>;
    @Input('table') table: {};

    constructor(private _router: Router, private _route: ActivatedRoute, private _share: SharedService) {

    }

    view(data) {
        this._router.navigate([this._share.getAdminTable(), this.table, 'view', data.id]);
    }
}

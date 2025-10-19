import {Component, Input} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router'
import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';

@Component({
    selector: 'admin-view-image-list',
    templateUrl: './image-list.component.html',
})

export class ViewImageListComponent {
    @Input('fields') fields: Array<any>;
    @Input('forms') forms: {};
    @Input('data_a') data_a: {};
    @Input('table') table: {};

    constructor(private _router: Router, private _route: ActivatedRoute, private _share: SharedService) {

    }

    view(data) {
        this._router.navigate([this._share.getAdminTable(), this.table, 'view', data.id]);
    }
}

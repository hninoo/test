import {Component, OnInit} from '@angular/core';
import {Connect} from '../services/connect';

@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html',
    styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {

    constructor(private _connect: Connect) {
    }

    ngOnInit(): void {

        this._connect.post('/public/is-maintenance', {}, {}, false).subscribe((data) => {
            if (data.maintenance == false) {
                location.href = '/admin/login';
            }
        });
    }

}

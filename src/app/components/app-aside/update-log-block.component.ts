import {Component, Input, OnInit} from '@angular/core';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {Comment} from '../../class/Comment';
import {Log} from '../../class/Log';

@Component({
    selector: 'update-log-block',
    templateUrl: './update-log-block.component.html'
})
export class UpdateLogBlockComponent implements OnInit {
    @Input() log: Log;
    @Input() comment: Comment;

    private toasterService: ToastrService;

    constructor(public _share: SharedService, private _connect: Connect, toasterService: ToastrService) {
        this.toasterService = toasterService;
    }

    ngOnInit() {
    }

    getDataStr(data, diff) {
        if (!data) {
            return '';
        }
        if (typeof data == 'string') {
            return data;
        } else if (Array.isArray(data)) {
            //IF multiple
            return data.map((_multi_data) => {
                return this.getDataStr(_multi_data, diff)
            }).join(',')
        }

        //file
        return data['name'];
    }

}

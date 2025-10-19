import {Component} from '@angular/core';
import {SharedService} from '../../services/shared';
import {environment} from '../../../environments/environment';

@Component({
    templateUrl: 'report.component.html'
})
export class ReportComponent {
    public loading: boolean = false;

    constructor(private _share: SharedService) {
    }

    get_api_url() {
        return environment.api_url;
    }

}

import {Component, OnInit} from '@angular/core';
import {Connect} from 'app/services/connect';
import {SharedService} from '../services/shared';

@Component({
    selector: 'app-info',
    templateUrl: './info.component.html'
})

export class InfoComponent implements OnInit {

    public default_storage: number;
    public db_size: string;
    public s3_size: string;
    public total_size_GB: string;
    public db_gb: string;
    public s3_gb: string;
    public total_user;
    public current_user;
    public current_login_user;
    public table_num: number;
    public max_table_num: number;
    public apiLogData: Array<any>;

    public notify_num: number;
    public notify_limit: number;

    public loading: boolean = true;

    public db_size_by_table: Object;
    public s3_size_by_table: Object;

    constructor(private _connect: Connect, public _share: SharedService) {

    }

    ngOnInit() {
        // breadcrumbs
        this._share.breadcrumbs = [{'name': 'システム利用状況'}];

        this._connect.get('/admin/info/management').subscribe((data) => {
            this.loading = false;

            this.default_storage = Number(data['default_storage']);

            let db_cv_gb = data['db_size'] / 1073741824; // convert byte to gb
            this.db_size = this.formatSize(data['db_size']);

            let s3_cv_gb = data['s3_size'] / 1073741824; // convert byte to gb
            this.s3_size = this.formatSize(data['s3_size']);

            this.total_size_GB = (db_cv_gb + s3_cv_gb).toFixed(2);

            // for storage
            // this.storage= data['storage'].map(data => {
            //     return {
            //         name : data.name,
            //         size : this.formatSize(data.size),
            //         folder : data.folder
            //     }
            // });
            // this.db_name= data['db_name'];
            this.db_gb = db_cv_gb.toFixed(3);
            this.s3_gb = s3_cv_gb.toFixed(3);
            this.total_user = Number(data['total_user']);
            this.current_user = data['current_user'];

            this.table_num = data['table_num'];
            this.max_table_num = data['max_table_num'];

            this.apiLogData = data['api_log'];
            this.db_size_by_table = data['db_size_by_table'];
            this.s3_size_by_table = data['s3_size_by_table'];

            this.notify_num = data['notify_count']
            this.notify_limit = this._share.getMaxEmailNotifyLimit()

            this.current_login_user = data['current_login_user'];
        });
    }

    formatSize($bytes) {
        if (!$bytes) {
            return '-';
        }
        if ($bytes >= 1073741824) {
            $bytes = Number($bytes / 1073741824).toFixed(1) + ' GB';
        } else if ($bytes >= 1048576) {
            $bytes = Number($bytes / 1048576).toFixed(1) + ' MB';
        } else if ($bytes >= 1024) {
            $bytes = Number($bytes / 1024).toFixed(1) + ' KB';
        } else if ($bytes >= 1) {
            $bytes = Number($bytes).toFixed(1) + ' bytes';
        } else {
            $bytes = '0 bytes';
        }
        return $bytes;
    }

}

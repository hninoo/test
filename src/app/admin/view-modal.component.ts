import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import {Data} from 'app/class/Data';
import {TableInfo} from 'app/class/TableInfo';
import {Workflow} from 'app/class/Workflow';
import {ToastrService} from 'ngx-toastr';

@Component({
    selector: 'app-view-modal',
    templateUrl: './view-modal.component.html',
})
export class ViewModalComponent implements OnChanges {

    @Input() data: Data;
    @Input() table_info: TableInfo;
    @Input() selectDataMode: boolean = false;
    public page_title: string;
    public loading = true;
    public before_html;


    public workflow: Workflow = null;
    public sending: boolean;

    @ViewChild('viewModal', {static: false}) viewModal: any;

    constructor() {
    }

    public show() {
        this.viewModal.show()
    }

    public hide() {
        this.viewModal.hide()
    }

    ngOnChanges() {
        this.loading = true;


        this.before_html = this.table_info?.view_before_html;
        this.page_title = this.table_info?.menu?.name ? this.table_info.menu.name + '詳細' : '詳細';
    }

}

import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Connect} from '../services/connect';
import ToastrService from '../toastr-service-wrapper.service';
import {SharedService} from '../services/shared';
import {Ledger} from '../class/Ledger';

@Component({
    selector: 'admin-ledger-import',
    templateUrl: './ledger-import.component.html',
    styleUrls: ['./ledger-import.component.css']
})
export class LedgerImportComponent implements OnInit {

    @Output() onImported: EventEmitter<Object> = new EventEmitter();

    @Input() parentComponent;
    @ViewChild('importMenu') importMenu: any;
    @ViewChild('deleteLedgerConfirmModal') deleteLedgerConfirmModal: any;

    public ledger: Ledger;
    public id: number = null;
    private file: File;
    // 他の処理に合わせテーブル名を使う
    public table_name: string;

    // 通知ウィンドウ
    private toasterService: ToastrService;

    constructor(private _connect: Connect, toasterService: ToastrService, public _share: SharedService) {
        this.toasterService = toasterService;
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {
        // ngOnInitだと@ViewChildで設定されない
        this.importMenu.hide();
    }

    public openImportMenu(table_name, ledger: Ledger = null) {
        this.table_name = table_name;
        this.ledger = ledger;
        this.id = null;
        if (ledger) {
            this.id = ledger.id
        }
        this.importMenu.show();
    }

    public changeCsv(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.file = fileList[0];
        }
    }

    public uploadFile() {
        this.importMenu.hide();
        this._share.getTableInfo(this.table_name, false, null, false).subscribe(_ => {
            this.toasterService.success('帳票を登録しました。', '成功');
            this.onImported.emit();
        })

    }

    confirmDeleteLedgerTemplate() {
        this.deleteLedgerConfirmModal.show();
    }

    deleteLedgerTemplate() {
        this.parentComponent.delete([this.id], 'ledger')
        this.deleteLedgerConfirmModal.hide();
        this.importMenu.hide()

    }

    donwloadLedgerTemplate() {
        console.log(this.ledger)
        let url = '/api/admin/file-by-id/' + this.ledger.file_info_id;

        this._share.download_file(url, () => {
            //this.downloading = false;
        }, false);

        return;
    }
}

import {Component, OnInit, ViewChild,Input, EventEmitter, Output} from '@angular/core';
import ToastrService from '../toastr-service-wrapper.service';
import {Router} from '@angular/router';
import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import {Data} from '../class/Data';


/**
 * Jsonインポート用ウィンドウ
 */
@Component({
    selector: 'admin-json-import',
    templateUrl: './json-import.component.html',
})
export class JsonImportComponent implements OnInit {

    @Input() sending: boolean = null;
    @Input() json: File;
    @Input() data_a: Array<Data> = [];
    @Input() checked_id_a: Array<number>;
    @Input() modal_error_title: string;
    @Input() modal_error_message: string;
    @Input() csv: File;
    @Output() reloadPage: EventEmitter<void> = new EventEmitter();
    @Output() resetJSONInput: EventEmitter<void> = new EventEmitter();

    @ViewChild('errorModal') errorModal: any;
    @ViewChild('jsonModal') jsonModal: any;
    @ViewChild('inputJSON') inputJSON: any;
    @ViewChild('inputCsv') inputCsv: any;

    private toasterService: ToastrService;
    private resetBeforeJSONUpload = 'false';

    public group_name: string = '';
    
    constructor(public _share: SharedService, private _router: Router, private _connect: Connect, toasterService: ToastrService) {
        this.toasterService = toasterService;
        // this.loading = false;
    }

    ngOnInit(): void {
    }

    uploadJSON() {
        this.toasterService.clear();
        if (this.json != null) {
            this.sending = true;
            const formData: FormData = new FormData();
            formData.append('json', this.json);
            formData.append('group_name', this.group_name.trim());
            formData.append('reset', this.resetBeforeJSONUpload);

            this._connect.postUpload('/admin/upload-json', formData).subscribe(
                (jsonData) => {
                    if (jsonData['result'] === 'success') {
                        this.toasterService.success('JSONアップロードしました。反映まで少しかかる場合があります。', '成功');
                        this.data_a = [];
                        this.checked_id_a = [];
                        this.reloadPage.emit();
                        this._share.loadAdminDatas();
                    } else {
                        this.modal_error_title = jsonData['title'];
                        this.modal_error_message = jsonData['message'];
                        this.errorModal.show();
                    }
                    this.jsonModal.hide();
                    this.resetJSONInput.emit();
                    this.sending = false;
                }
                ,
                (error) => {
                    this.toasterService.error('一部取り込みでエラーが発生しました。' + error.error.error_a[0], 'エラー');
                    this.sending = false;
                })
        } else {
            this.toasterService.error('JSONファイルが選択されていません。', 'エラー');
        }
    }

    hideJSONModal() {
        this.jsonModal.hide();
        this.json = null;
        this.inputJSON.nativeElement.value = '';
        this.toasterService.clear();

        if (this.sending) {
            this.sending = false;
        }
    }

    changeJson(event) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.json = fileList[0];
        } else {
            this.resetCsvInput();
        }
    }

    resetCsvInput() {
        //console.time('resetCsvInput:');

        this.csv = null;
        this.inputCsv.nativeElement.value = '';

    }


    openJSONModal() {
        this.jsonModal.show();
    }

}

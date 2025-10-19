import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../../services/connect';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedService} from '../../services/shared';
import ToastrService from '../../toastr-service-wrapper.service';
import {User} from '../../services/user';
import {Workflow} from '../../class/Workflow';
import {WorkflowTemplate} from '../../class/Workflow/WorkflowTemplate';
import {TableInfo} from '../../class/TableInfo';
import {FormAndValue} from '../../class/FormAndValue';
import {CustomFilter} from '../../class/Filter/CustomFilter';

@Component({
    selector: 'edit-all-modal',
    templateUrl: './edit-all-modal.component.html',
})

export class EditAllModalComponent implements OnInit {

    @Input() parent;
    @Input() count: number;
    @Input() table_info: TableInfo = null;
    @Input() customFilter: CustomFilter = null;
    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() applied: EventEmitter<Object> = new EventEmitter();
    @Input() checked_id_a: Array<number> = [];
    @Input() unchecked_id_a: Array<number> = [];
    @Input() checked_all: boolean = false;

    private toasterService: ToastrService;
    private form_and_values: Array<FormAndValue> = []

    @ViewChild('editAllModal') editAllModal: any;

    //@ViewChild('confirmUpdateModal') confirmUpdateModal: any;

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, public _share: SharedService, private _user: User, toasterService: ToastrService) {
        this.toasterService = toasterService;
    }

    ngOnInit() {

    }


    add() {
    }


    onChange($event) {
        this.form_and_values = $event.form_and_values;
    }

    update() {
        if (this.form_and_values.length == 0) {
            this.toasterService.error('更新する項目と値を入力して下さい。');
            return;
        }
        let error_flg = false;
        this.form_and_values.forEach(form_and_value => {
            if (form_and_value.form == null) {
                this.toasterService.error('更新する項目と値を入力して下さい。');
                error_flg = true
            }
        })

        if (error_flg) {
            return;
        }
        let count = 0;
        if (this.checked_all && !this.customFilter) {
            count = this.count - this.unchecked_id_a.length;
        } else {
            count = this.checked_id_a.length;
        }


        let message = null;
        if (this.isAllData()) {
            message = '元には戻せません。全てのデータを更新してよろしいですか？' + '\nまた一括編集処理後、 一覧のリロードボタンを押して更新情報をご確認ください。';
        } else if (this.customFilter && count == 0) {
            message = 'フィルタ適用中のレコードが一括編集されます。' + '\nまた一括編集処理後、 一覧のリロードボタンを押して更新情報をご確認ください。';
        } else {
            message = '元には戻せません。選択された' + count + '件のデータを更新してよろしいですか？' + '\nまた一括編集処理後、 一覧のリロードボタンを押して更新情報をご確認ください';
        }

        if (confirm(message)) {
            let hash = {}
            this.form_and_values.forEach(form_and_value => {
                let val = form_and_value.value
                if (Array.isArray(val)) {
                    val = val.join(',')
                }
                hash[form_and_value.form.field['Field']] = val
            })
            this._connect.post('/admin/' + this.table_info.table + '/update-all', {
                'edit_all': this.checked_all && !this.customFilter,
                'unchecked_id_a': this.unchecked_id_a,
                'checked_id_a': this.checked_id_a,
                'upd_hash': hash,
                'customFilter': this.customFilter ? this.customFilter.toArray() : null
            }).subscribe(res => {
                this.toasterService.success('一括編集をリクエストしました。リクエストログのメニューからステータスが確認出来ます。');
                this.form_and_values = [];
                this.parent.reset_all_checkbox();
                this.editAllModal.hide();
            })


        }
    }

    getCheckedIdsAsString(): string {
        return this.checked_id_a.join(', ');
    }


    public show() {
        this.editAllModal.show()
    }

    public hide() {
        this.editAllModal.hide()
    }


    close() {
        this.parent.reset_all_checkbox();
        this.parent.editAllModal.hide()
    }

    isAllData(): boolean {
        return this.checked_all && !this.customFilter && this.unchecked_id_a.length == 0
    }
}

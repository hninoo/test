import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../../services/connect';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedService} from '../../services/shared';
import ToastrService from '../../toastr-service-wrapper.service';
import {User} from '../../services/user';

@Component({
    selector: 'chatgpt-modal',
    templateUrl: './chatgpt-modal.component.html',
})

export class ChatgptModalComponent implements OnInit {
    @Input() action: string = 'new_table';
    @Input() group_name: string = null;
    @Input() sample_data: boolean = true;
    @Input() request: string = null;


    //search
    @Input() table_name: string = null;
    @Input() search_text: string = null;
    @Input() summary_text: string = null;

    @Input() sending: boolean = false;

    @Output() onSubmitPigeonAi: EventEmitter<Object> = new EventEmitter();
    @Output() onErrorPigeonAi: EventEmitter<Object> = new EventEmitter();
    @Output() onCancel: EventEmitter<Object> = new EventEmitter();

    @ViewChild('pigeonAiModal') pigeonAiModal: any;

    public comment: string = '';

    constructor(private _connect: Connect) {
    }

    onClickCancel() {
        this.pigeonAiModal.hide();
        this.onCancel.emit()
    }

    public show() {
        this.pigeonAiModal.show()
    }

    public hide() {
        this.sending = false;
        this.pigeonAiModal.hide()
    }

    submit() {

        if (this.action == 'new_table') {
            if (!this.group_name) {
                alert('管理したい対象を入力してください。')
                return;
            }
            this.sending = true;
            this._connect.post('/admin/create-by-ai', {
                action: this.action,
                group_name: this.group_name,
                sample_data: this.sample_data,
                request: this.request,
            }, {}, false).subscribe((res) => {
                this.sending = false;
                console.log(res)
                this.hide();

                this.onSubmitPigeonAi.emit({
                    action: this.action,
                    group_name: this.group_name,
                    request: this.request,
                })
            }, (error) => {
                this.sending = false;
                this.onErrorPigeonAi.emit({
                    action: this.action,
                    error: error.error.error_debug_a
                });
            })
        } else if (this.action == 'search' || this.action == 'chart' || this.action == 'summary') {
            if (this.action == 'search' && !this.search_text) {
                alert('テキストを入力して下さい')
                return;
            }
            if (this.action == 'chart' && !this.summary_text) {
                alert('内容を入力して下さい')
                return;
            }
            this.sending = true;
            this._connect.post('/admin/' + this.table_name + '/search-by-ai', {
                action: this.action,
                summary_text: this.summary_text,
                search_text: this.search_text,
            }, {}, false).subscribe((res) => {
                this.sending = false;
                console.log(res)
                this.hide();

                this.onSubmitPigeonAi.emit({
                    action: this.action,
                    filter: res.filter
                })
            }, (error) => {
                this.sending = false;
                this.onErrorPigeonAi.emit({
                    action: this.action,
                    error: error.error.error_debug_a
                });
            })

        }

    }

    ngOnInit() {
        this.sending = false;
        //console.log('app-aside ngoninit')
    }

}

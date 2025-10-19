import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
    selector: 'confirm-modal',
    templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent implements OnInit {


    @Input() title: string = '';
    @Input() text: string = 'OK';
    @Input() submit_button_text: string = 'OK';
    @Input() type: string = 'primary';
    @Input() sending: boolean = false;
    @Input() is_iframe: boolean = false;

    @Output() onOk: EventEmitter<Object> = new EventEmitter();
    @Output() onCancel: EventEmitter<Object> = new EventEmitter();

    @ViewChild('confirmModal') confirmModal: any;

    constructor() {
    }

    onClickOk() {
        this.sending = true;
        this.onOk.emit()
    }

    onClickCancel() {
        this.confirmModal.hide();
        this.onCancel.emit()
    }

    public show() {
        this.confirmModal.show()
    }

    public hide() {
        this.sending = false;
        this.confirmModal.hide()
    }


    ngOnInit() {
        this.sending = false;
        //console.log('app-aside ngoninit')
    }

}

import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import {Block, CopyBlock, EmailNotificationBlock, TriggerBlock} from '../flow.component';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'app-email-noti-edit-modal',
    templateUrl: './email-noti-edit-modal.component.html',
    styleUrls: ['./email-noti-edit-modal.component.scss']
})
export class EmailNotiEditModalComponent extends BlockModalBaseComponent implements OnInit {
    //block
    public block: EmailNotificationBlock;
    @Input() public toasterService: any;

    public cc_a: string[] = [];
    public bcc_a: string[] = [];

    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (this.srcBlock && this.srcBlock.type == Block.TYPE_EMAIL_NOTIFICATION) {
            if (changes.srcBlock && !this.block) {
                console.log('copyed')
                this.block = cloneDeep(this.srcBlock) as EmailNotificationBlock
                this.cc_a = this.block.cc_a;
                this.bcc_a = this.block.bcc_a;
            }

            if (!changes.srcBlock) {
                this.block = null;
            }
        }
    }


    public save() {
        //validate
        if (!this.block.subject) {
            this.toasterService.error('件名を入力してください');
            return;
        }
        if (!this.block.to || this.block.to.length == 0) {
            this.toasterService.error('宛先を入力してください');
            return;
        }
        if (!this.validateEmail(this.block.to)) {
            this.toasterService.error('宛先のメールアドレスが不正です');
            return;
        }

        if (!this.block.body) {
            this.toasterService.error('本文を入力してください');
            return;
        }

        this.block.to = this.block.to;
        this.block.cc_a = [];
        this.block.bcc_a = [];


        this.block.cc_a = []
        let has_error = false;
        this.cc_a.forEach((cc) => {
            if (cc) {
                this.block.cc_a.push(cc);
                if (!this.validateEmail(cc)) {
                    has_error = true;
                }
            }
        });

        if (has_error) {
            this.toasterService.error('ccのメールアドレスが不正です');
            return;
        }

        this.block.bcc_a = []
        this.bcc_a.forEach((bcc) => {
            if (bcc) {
                this.block.bcc_a.push(bcc);
                if (!this.validateEmail(bcc)) {
                    has_error = true;
                }
            }
        });
        if (has_error) {
            this.toasterService.error('bccのメールアドレスが不正です');
            return;
        }


        console.log(this.block);


        super.save(this.block);
    }

    private validateEmail(email: string): boolean {
        if (!email) {
            return false;
        }
        if (email.indexOf('@') == -1) {
            return false;
        }
        return true;
    }

    public removeCcEmail(index: number) {
        this.cc_a.splice(index, 1);
    }

    public changeCcEmail(index: number, $event) {
        this.cc_a[index] = $event.target.value;
    }

    public addCcEmail() {
        this.cc_a.push('');
    }

    public removeBccEmail(index: number) {
        this.bcc_a.splice(index, 1);
    }

    public changeBccEmail(index: number, $event) {
        this.bcc_a[index] = $event.target.value;
    }

    public addBccEmail() {
        this.bcc_a.push('');
    }


    onChangeMail() {
        console.log(this.block);
        this.block.cc_a = this.cc_a;
        this.block.bcc_a = this.bcc_a;

    }

}

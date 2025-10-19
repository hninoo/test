import {Component, Input, OnInit} from '@angular/core';
import {Block, EmailNotificationBlock, SlackNotificationBlock} from '../flow.component';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'app-slack-noti-edit-modal',
    templateUrl: './slack-noti-edit-modal.component.html',
    styleUrls: ['./slack-noti-edit-modal.component.scss']
})
export class SlackNotiEditModalComponent extends BlockModalBaseComponent implements OnInit {

    //block
    public block: SlackNotificationBlock;
    @Input() public toasterService: any;


    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (this.srcBlock && this.srcBlock.type == Block.TYPE_SLACK_NOTIFICATION) {
            if (changes.srcBlock && !this.block) {
                console.log('copyed')
                this.block = cloneDeep(this.srcBlock) as SlackNotificationBlock
                console.log(this.block)
            }

            if (!changes.srcBlock) {
                this.block = null;
            }
        }
    }


    public save() {
        //validate
        if (!this.block.webhook_url) {
            this.toasterService.pop('error', 'Error', 'webhook URLは必須です。');
            return;
        }

        if (!this.block.body) {
            this.toasterService.pop('error', 'Error', 'メッセージは必須です。');
            return;
        }

        super.save(this.block);
    }


}

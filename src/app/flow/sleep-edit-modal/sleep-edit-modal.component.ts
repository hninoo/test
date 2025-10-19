import {Component, Input, OnInit} from '@angular/core';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {Block, EmailNotificationBlock, FilterBlock, SleepBlock} from '../flow.component';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'app-sleep-edit-modal',
    templateUrl: './sleep-edit-modal.component.html',
    styleUrls: ['./sleep-edit-modal.component.scss']
})
export class SleepEditModalComponent extends BlockModalBaseComponent implements OnInit {

    public block: SleepBlock;

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (this.srcBlock && this.srcBlock.type == Block.TYPE_SLEEP) {
            if (changes.srcBlock && !this.block) {
                this.block = cloneDeep(this.srcBlock) as SleepBlock
            }

            if (!changes.srcBlock) {
                this.block = null;
            }
        }
    }

    public save() {
        super.save(this.block);
    }


}

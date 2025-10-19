import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Block, TriggerBlock} from '../flow.component';
import {SharedService} from '../../services/shared';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {cloneDeep} from 'lodash';
import {TableInfo} from '../../class/TableInfo';

@Component({
    selector: 'app-trigger-edit-modal',
    templateUrl: './trigger-edit-modal.component.html',
    styleUrls: ['./trigger-edit-modal.component.scss']
})
export class TriggerEditModalComponent extends BlockModalBaseComponent implements OnInit {

    //override
    public block: TriggerBlock;

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (changes.srcBlock) {
            this.block = cloneDeep(this.srcBlock) as TriggerBlock;
        }
    }


    saveTriggerSettings() {
        // トリガブロックの設定を更新
        // const triggerBlock = this.blocks.find(block => block.type === 'TRIGGER');
        /*
        if (triggerBlock instanceof TriggerBlock) {
            triggerBlock.triggerOptions = {
                type: this.selectedTriggerType as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'onDataChange',
                time: this.selectedTriggerType !== 'onDataChange' ? this.selectedTriggerTime : undefined,
                dayOfWeek: this.selectedTriggerType === 'weekly' ? this.selectedDayOfWeek : undefined,
                day: ['monthly', 'yearly'].indexOf(this.selectedTriggerType) >= 0 ? this.selectedDay : undefined,
                month: this.selectedTriggerType === 'yearly' ? this.selectedMonth : undefined,
                onDataEventType: this.selectedTriggerType === 'onDataChange' ? this.selectedOnDataEventType as 'view' | 'insert' | 'update' | 'delete' : undefined,
                tableName: this.selectedTriggerType === 'onDataChange' ? this.selectedTableName : undefined
            };
        } else {
            alert('トリガブロックが見つかりません。');
            return;
        }
         */
        this.modal.hide();
        this.onChange.emit()
        // this.onBlockChanged()
    }

    public save() {
        super.save(this.block);
    }

    public readonly Block = Block;


}

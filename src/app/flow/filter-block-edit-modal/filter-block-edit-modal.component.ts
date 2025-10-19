import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FilterBlock, TriggerBlock} from '../flow.component';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {cloneDeep} from 'lodash';
import {Conditions} from '../../class/Conditions';

@Component({
    selector: 'app-filter-block-edit-modal',
    templateUrl: './filter-block-edit-modal.component.html',
    styleUrls: ['./filter-block-edit-modal.component.scss']
})
export class FilterBlockEditModalComponent extends BlockModalBaseComponent implements OnInit {

    @Input() public block: FilterBlock;

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (this.srcBlock && this.srcBlock.type == 'FILTER') {
            if (changes.srcBlock) {
                this.block = cloneDeep(this.srcBlock) as FilterBlock;
                if (!this.block.conditions || !(this.block.conditions instanceof Conditions)) {
                    this.block.conditions = new Conditions([]);
                }
            }
        }
    }


    public save() {
        super.save(this.block);
    }


    conditionChanged($event) {
        console.log('conditionChanged')
        console.log($event)
        this.block.conditions = $event.conditions

    }

    onChangeSortParams($event: Object) {
        console.log($event)

    }
}

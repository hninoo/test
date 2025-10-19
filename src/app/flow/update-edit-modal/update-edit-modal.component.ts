import {Component, OnChanges, OnInit} from '@angular/core';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {Block, FilterBlock, UpdateBlock} from '../flow.component';
import {cloneDeep} from 'lodash';
import {FormAndValue} from '../../class/FormAndValue';

@Component({
    selector: 'app-update-edit-modal',
    templateUrl: './update-edit-modal.component.html',
    styleUrls: ['./update-edit-modal.component.scss']
})
export class UpdateEditModalComponent extends BlockModalBaseComponent implements OnChanges {
    public block: UpdateBlock;

    public readonly Block = Block;

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (changes.srcBlock && this.srcBlock && this.srcBlock.type == 'UPDATE_DATA') {
            this.block = cloneDeep(this.srcBlock) as UpdateBlock;
        }
        super.ngOnChanges(changes);
    }


    public save() {

        super.save(this.block);
    }

    ngOnInit(): void {
    }

    onChangeUpdateValue($event) {
        console.log($event)
        this.block.form_and_values = $event.form_and_values;
    }

}

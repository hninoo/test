import {Component, OnInit} from '@angular/core';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {Block, DeleteBlock, UpdateBlock} from '../flow.component';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'app-delete-edit-modal',
    templateUrl: './delete-edit-modal.component.html',
    styleUrls: ['./delete-edit-modal.component.scss']
})
export class DeleteEditModalComponent extends BlockModalBaseComponent implements OnInit {
    public block: DeleteBlock;

    public readonly Block = Block;

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (changes.srcBlock) {
            this.block = cloneDeep(this.srcBlock) as DeleteBlock;
        }
        super.ngOnChanges(changes);
    }

    public save() {
        super.save(this.block);
    }

    ngOnInit(): void {
    }

}

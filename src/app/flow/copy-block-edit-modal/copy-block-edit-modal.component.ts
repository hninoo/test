import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import {CopyBlock, FilterBlock} from '../flow.component';
import {BlockModalBaseComponent} from '../block-modal-base/block-modal-base.component';
import {Conditions} from '../../class/Conditions';
import {cloneDeep} from 'lodash';

@Component({
    selector: 'app-copy-block-edit-modal',
    templateUrl: './copy-block-edit-modal.component.html',
    styleUrls: ['./copy-block-edit-modal.component.scss']
})
export class CopyBlockEditModalComponent extends BlockModalBaseComponent implements OnChanges {

    public block: CopyBlock;


    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (this.srcBlock && this.srcBlock.type == 'COPY') {
            if (changes.srcBlock) {
                this.block = cloneDeep(this.srcBlock) as CopyBlock;
            }
        }
    }


    public save() {
        if (this.validate()) {
            super.save(this.block);
        } else {
            this.toasterService.error(this.errors.join('<br>'));

        }

    }

    onShowFieldChanged(event: any) {
        this.block.copy_fields = event.selected_field_name_a;
        console.log(this.block.copy_fields);
    }

    hasError() {
        return this.errors.length > 0;
    }

    public errors: Array<string> = [];

    validate() {
        this.errors = [];
        if (this.block.copy_fields.length == 0) {
            this.errors.push('最低一つの項目を選択してください');
        }
        return this.errors.length == 0;
    }
}

import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {SharedService} from '../../services/shared';
import {Block, TriggerBlock} from '../flow.component';
import {TableInfo} from '../../class/TableInfo';
import {cloneDeep} from 'lodash';
import ToastrService from '../../toastr-service-wrapper.service';

@Component({
    selector: 'app-block-modal-base',
    templateUrl: './block-modal-base.component.html',
    styleUrls: ['./block-modal-base.component.scss']
})
export class BlockModalBaseComponent implements OnInit, OnChanges {
    @ViewChild('modal') modal: any;

    @Output() onChange: EventEmitter<Object> = new EventEmitter();
    @Input() protected srcBlock: Block;
    @Input() table_info: TableInfo;


    constructor(public _shared: SharedService, public toasterService: ToastrService) {
    }

    public getTriggerTypeOptions() {
        let options = this._shared.triggerTypeOptions;

        if (!this.table_info.menu.is_workflow) {
            options = options.filter((option) => {
                return option.value !== TriggerBlock.TRIGGER_TYPE.WORKFLOW_COMPLETED;
            })

        }

    }

    public show() {
        this.modal.show()
    }

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    save(block: Block) {

        this.onChange.emit({
            block: cloneDeep(block),
        })
        this.modal.hide();
        block = null;
    }

    public readonly blockClass = Block;
}

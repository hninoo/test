import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import {SharedService} from '../../services/shared';
import {WorkflowService} from '../../service/WorkflowService';
import {Data} from '../../class/Data';

@Component({
    selector: 'index-workflow-modal',
    templateUrl: './index-workflow-modal.component.html',
    providers: [WorkflowService]
})
export class IndexWorkflowModalComponent implements OnChanges {


    @Input() table_info: TableInfo;
    @Input() workflow_status: string;
    @Input() data_a: Array<Data>;
    @Input() sending: boolean = false;

    @Output() onOk: EventEmitter<Object> = new EventEmitter();
    @Output() onCancel: EventEmitter<Object> = new EventEmitter();

    @ViewChild('indexWorkflowModal') indexWorkflowModal: any;

    public workflow_comment: string;
    public loading_obj: Object = {}

    constructor(public _share: SharedService, private workflowService: WorkflowService) {

    }

    onClickOk() {
        this.sending = true;
        if (this.workflow_status == 'withdraw') {
            this.workflowService.withdraw(this.getWorkflowIdAry(), this.workflow_comment).subscribe(res => {
                this.sending = false;
                this.onOk.emit({res: res})
            }, (error) => {
                this.sending = false;

            })
        } else {
            this.workflowService.setStatus(this.getWorkflowIdAry(), this.workflow_status, this.workflow_comment).subscribe(res => {
                console.log(res)
                this.sending = false;
                this.onOk.emit({res: res})
            }, (error) => {
                this.sending = false;
                console.log('errro')
            })
        }
    }

    private getWorkflowIdAry(): Array<number> {
        return this.data_a.map(data => {
            return data.workflow.id;
        })
    }

    onClickCancel() {
        this.indexWorkflowModal.hide();
        this.onCancel.emit()
    }

    public show() {
        this.indexWorkflowModal.show()
    }

    public hide() {
        this.indexWorkflowModal.hide()
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.workflow_comment = ''
    }


}

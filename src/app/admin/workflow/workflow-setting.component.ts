import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {ActivatedRoute, Router} from '@angular/router';
import {Workflow} from '../../class/Workflow';
import {SharedService} from '../../services/shared';
import {TableInfo} from '../../class/TableInfo';
import {WorkflowPath} from '../../class/Workflow/WorkflowPath';
import {Form} from '../../class/Form';

@Component({
    selector: 'workflow-setting',
    templateUrl: './workflow-setting.component.html',
    styleUrls: ['./workflow-setting.component.css'],
})

export class WorkflowSettingComponent implements OnInit {
    @Input() table: string;
    @Input() workflow: Workflow;
    @Input() disabled: boolean = false;
    @Input() canAddTemplate: boolean = false;
    @Input() is_setting_template: boolean = false;
    @Input() fieldOptions: Array<Form> = [];
    @Input() mode: string = 'add';
    @Input() table_info: TableInfo = null;

    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();


    constructor(private _router: Router, private _route: ActivatedRoute, private _share: SharedService) {
    }

    ngOnInit() {
    }

    pathChanged($event, key = 'admin_id') {
        console.log('onchange workflow setting')
        console.log($event)
        this.workflow.workflow_path_a[$event.index][key] = $event[key];
        this.changed();
    }

    andOrChanged($event, key = 'admin_id', path_index ) {
        this.workflow.workflow_path_a[path_index]['path_and_or_a'][$event.index][key] = $event[key];
        this.changed();
    }

    workflowPathConditionChanged(workflow_path: WorkflowPath, $event) {
        workflow_path.conditions.condition_a[$event.index] = $event.condition;
        this.changed()

    }

    changed() {
        this.valueChanged.emit({
            'workflow': this.workflow,
        })
    }

    fieldChanged(index, field_name) {
        this.workflow.workflow_path_a[index]['field_name'] = field_name;
        this.changed();
    }



    delete(index) {
        this.workflow.deleteWorkflowPath(index)
        this.changed();
    }


    getDivisionAddedValues() {
        return [
            {value: '{my_main_division_id}', label: '自身の組織'}
        ]
    }

    getUserAddedValues() {
        return [
            {value: '{applying_user_id}', label: '申請したユーザー'}
        ]
    }

    isDisabled(workflowPath){
        // 終わってるフローは変更不可
        if(workflowPath.status && workflowPath.status == 'accepted') {
            return true;
        }

        if(this.mode == 'add') {
            return (this.disabled && !workflowPath.add_data);
        } else {
            return (this.disabled && (!this.table_info.workflow_can_flow_edit || !workflowPath.add_data));
        }
    }

    addAndOr(workflowPath, i) {
        this.workflow.addWorkflowPathAndOr(this.is_setting_template ? false :true, 'AND', i);
        this.changed();
    }

    moveUp(index) {
        if (index > 0) {
            const temp = this.workflow.workflow_path_a[index];
            if (this.isDisabled(temp)) return;
            // 移動先が承認済みの時は移動不可
            if (this.workflow.workflow_path_a[index - 1].status && this.workflow.workflow_path_a[index - 1].status == 'accepted') return;
            this.workflow.workflow_path_a[index] = this.workflow.workflow_path_a[index - 1];
            this.workflow.workflow_path_a[index - 1] = temp;
            this.changed();
        }
    }

    moveDown(index) {
        if (index < this.workflow.workflow_path_a.length - 1) {
            const temp = this.workflow.workflow_path_a[index];
            if(this.isDisabled(temp)) return;
            // 移動先が承認済みの時は移動不可
            if (this.workflow.workflow_path_a[index + 1].status && this.workflow.workflow_path_a[index + 1].status == 'accepted') return;
            this.workflow.workflow_path_a[index] = this.workflow.workflow_path_a[index + 1];
            this.workflow.workflow_path_a[index + 1] = temp;
            this.changed();
        }
    }
}

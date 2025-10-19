import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import 'chartjs-plugin-colorschemes';
import {Connect} from '../../services/connect';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedService} from '../../services/shared';
import ToastrService from '../../toastr-service-wrapper.service';
import {User} from '../../services/user';
import {Workflow} from '../../class/Workflow';
import {WorkflowTemplate} from '../../class/Workflow/WorkflowTemplate';
import {Data} from '../../class/Data';
import {Form} from '../../class/Form';
import {TableInfo} from '../../class/TableInfo';

@Component({
    selector: 'workflow-modal',
    templateUrl: './workflow-modal.component.html',
    styleUrls: ['./workflow-modal.component.css'],
})

export class WorkflowModalComponent implements OnInit, OnChanges {
    @Input() type;
    @Input() parent;
    @Input() table_info: TableInfo;
    @Input() workflow_base: Workflow;
    @Input() sending: boolean = false;
    @Input() postFormData: FormData = null;
    @Input() data_changed: Date = null;
    @Input() mode: string = 'add';
    @Input() data_id: number = null;


    @Output() valueChanged: EventEmitter<Object> = new EventEmitter();
    @Output() applied: EventEmitter<Object> = new EventEmitter();

    public workflow_template: WorkflowTemplate;
    public workflow: Workflow = null;
    public workflow_field_options: Array<Form> = [];
    public admin_id_a: Array<number> = [];
    public workflow_comment: string = null;
    public loading: boolean = false;
    public templates_by_name: Array<WorkflowTemplate>;
    public template_names: Array<string>;
    public selectedTemplateName: string = null;
    public main_division_id: number = null;
    public division_id_a: Array<number> = [];
    private toasterService: ToastrService;
    private workflow_status: string = null;
    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, public _share: SharedService, private _user: User, toasterService: ToastrService) {
        this.admin_id_a = [null];
        this.toasterService = toasterService;
    }

    ngOnInit() {
        this.main_division_id = this._share.getMainDivisionId();
        this.division_id_a = this._share.getDivisionIds();

        if (this.workflow_template) {
            this.workflow = this.workflow_template.workflow;
            this.changed()
        } else {
            this.workflow = this.workflow_base;
        }
        if (this.table_info) {
            this.workflow_field_options = this.table_info.workflowOptionField();
        }
        this.loadNowWorkflow()
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('ONCHANGE!!!')
        // 入力後に直で申請ボタンを押されたらテンプレート条件の変更に反応できないので、遅延させる
        setTimeout(() => {
            this.workflow_status = this.workflow.status;
            if ((changes.data_changed || changes.postFormData || this.workflow_template == null)) {
                // レコード追加か、下書き、否認、拒否のときにはテンプレートを読み込む
                if (this.isLoadTemplate()) {
                    this.loadWorkflowTemplate()
                }
            } else if ((changes.data_changed || changes.postFormData) && this.mode == 'edit' && this.table_info.workflow_can_flow_edit) {
                this.loadNowWorkflow()
            }
        }, 300);
    }

    isLoadTemplate() {
        return this.mode == 'add' || (this.workflow && !this.workflow.id) || ['rejected', 'withdraw'].includes(this.workflow.status);
    }

    loadWorkflowTemplate() {
        if (!this.table_info || !this.postFormData) {
            return;
        }
        console.log('loadWorkflowTemplate')
        this.loading = true;
        let formData = this.postFormData;
        formData.append('table', this.table_info.table);
        this._connect.postUpload('/admin/workflow/get-template', formData).subscribe(res => {
            this.loading = false;
            this.workflow_template = new WorkflowTemplate(res['template'])
            this.workflow = this.workflow_template.workflow;
            this.templates_by_name = res['templates_by_name'];
            this.template_names = Object.keys(res['templates_by_name']);
            this.selectedTemplateName = this.workflow.name;
            this.workflow.status = this.workflow_status;
            
            this.changed();

        });
    }

    onTemplateNameChanged(){
        this.workflow_template = new WorkflowTemplate(this.templates_by_name[this.selectedTemplateName]);
        this.workflow = this.workflow_template.workflow;

        this.changed();

    }

    // ワークフロー固定時に承認者を追加できるをマージ後、statusがappliedの場合は編集不可にする

    loadNowWorkflow() {
        if (!this.table_info) {
            return;
        }
        this.loading = true;
        let formData = new FormData();
        if(this.postFormData) formData = this.postFormData;
        formData.append('table', this.table_info.table);
        formData.append('id', this.data_id.toString());
        this._connect.postUpload('/admin/workflow/get-workflow', formData).subscribe(res => {
            // 否認や引き下げで再申請の場合は新しくworkflowを作成するのでidをnullにする
            if(res['workflow']['status'] == 'rejected' || res['workflow']['status'] == 'withdraw') {
                res['workflow']['id'] = null;
                res['workflow']['workflow_path_a'].forEach(path => path['id'] = null);
            }
            this.loading = false;
            this.workflow_template = new WorkflowTemplate({'workflow':res['workflow']})
            this.workflow = this.workflow_template.workflow;
            this.changed();
        });
    }

    isWorkflowTemplateExist() {
        return this.table_info.workflow_template_fixed;

    }

    canAddWorkflowtemplate() {
        return this.table_info.workflow_flow_fixed_can_add;
    }

    isWorkflowTemplatePathExist() {
        //条件にあうtempalteがない場合はfalse


        return this.workflow_template && this.workflow_template.workflow.workflow_path_a.length > 0;
    }

    changed() {
        this.valueChanged.emit({
            'workflow': this.workflow,
            'workflow_comment': this.workflow_comment,
            'workflow_main_division_id': this.main_division_id,
        })

    }

    submit() {
        this.sending = true;
        if (!this.isWorkflowTemplateExist() && !this.workflow.validate(this._share.getMainDivisionId())) {
            this.toasterService.error(this.workflow.error_message, 'エラー');
            this.sending = false;
            return;
        }
        this.applied.emit()
        this.workflow_comment = '';
    }


    add() {
        this.workflow_comment = '';
        this.workflow.addWorkflowPath(true);
    }


    close() {
        this.parent.closeWorkflow()
    }

    delete(index) {
        this.workflow.deleteWorkflowPath(index)
        this.changed();
    }

    onWorkflowChanged($event) {
        this.workflow = $event.workflow;
        this.changed();
    }

    divisionChanged($event) {
        this.main_division_id = $event.division_id;
        this.changed();
    }


}

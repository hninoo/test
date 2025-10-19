import {Base} from './Base';
import {WorkflowPath} from './Workflow/WorkflowPath';

export class Workflow extends Base {
    private _admin_id: number;
    private _table: string;
    private _data_id: number;
    private _status: string;
    private _assigned_admin_id: number;
    private _workflow_path_a: Array<WorkflowPath> = [];
    private _name: string;


    get workflow_path_a(): Array<WorkflowPath> {
        return this._workflow_path_a;
    }

    set workflow_path_a(value: Array<WorkflowPath>) {
        this._workflow_path_a = value;
    }

    private _is_assigned: boolean;
    private _is_salvage_acceptable: boolean;
    private _next_assigned_username: string;
    private _is_exist: boolean;
    private _is_editable: boolean;


    constructor(hash = {}) {
        super(hash)
        if (!hash) {
            return;
        }
        for (const key of Object.keys(hash)) {
            if (key == 'workflow_path_a') {
                this._workflow_path_a = []

                hash[key].forEach((path_hash) => {
                    let workflow_path = new WorkflowPath();
                    workflow_path.setByHash(path_hash)
                    console.log(workflow_path)
                    if (workflow_path.division_id && workflow_path.division_id.toString().match(/^\d+$/)) {
                        workflow_path.division_id = parseInt(workflow_path.division_id)
                    }
                    if (workflow_path.admin_id && workflow_path.admin_id.toString().match(/^\d+$/)) {
                        workflow_path.admin_id = parseInt(workflow_path.admin_id)
                    }

                    if (path_hash.hasOwnProperty('workflow_path_and_or_a')) {
                        workflow_path.path_and_or_a = [];
                        for (const item of path_hash['workflow_path_and_or_a']) {
                            let andOrWorkflowPath = new WorkflowPath();
                            andOrWorkflowPath.setByHash(item)
                            workflow_path.path_and_or_a.push(andOrWorkflowPath);
                        }
                    }

                    this._workflow_path_a.push(workflow_path)
                })


            } else {
                this['_' + key] = hash[key];
            }
        }
    }

    isSetWorkflow() {
        return this.workflow_path_a.length > 0;
    }


    isEnd() {
        return this._status !== 'applying';
    }

    get error_message(): string {
        return this._error_message;
    }


    private _error_message: string = null;

    public validate(main_division_id: number = null): boolean {

        if (this.workflow_path_a.length == 0) {
            this._error_message = '承認先は一つ以上選択して下さい。';
            return false;
        }

        let error_flg = false;
        this.workflow_path_a.forEach(workflowPath => {
            if (!workflowPath.validate(main_division_id)) {
                this._error_message = workflowPath.error_message;
                error_flg = true;
                return false;
            }
        })
        return !error_flg;

    }

    public addWorkflowPath(add_data_flg = false) {
        let newWorkflowPath = new WorkflowPath();
        if(add_data_flg) {
            newWorkflowPath.add_data = true;
        }
        this.workflow_path_a.push(newWorkflowPath);
    }

    public addWorkflowPathAndOr(add_data_flg = false, and_or = 'AND', i) {
        let newWorkflowPath = new WorkflowPath();
        if(add_data_flg) newWorkflowPath.add_data = true;
        newWorkflowPath.and_or = and_or;

        if (!this.workflow_path_a[i].path_and_or_a) {
            this.workflow_path_a[i].path_and_or_a = [];
        }
        this.workflow_path_a[i].path_and_or_a.push(newWorkflowPath);

    }

    public deleteWorkflowPath(index: number): void {
        this.workflow_path_a.splice(index, 1);
    }

    public getWorkflowPathForPost() {
        return this.workflow_path_a.map(wpath => {
            return wpath.toArray();
        })
    }

    public toArray(main_division_id = null): any {
        /*
        if (main_division_id) {
            //ワークフロー登録時にメインの組織IDを設定する
            this.workflow_path_a.forEach(workflowPath => {
                console.log(workflowPath)
                workflowPath.setMainDivisionId(main_division_id)

            })
        }
         */
        return super.toArray();
    }

    public isApplyUser(admin_id: number) {
        return this._admin_id == admin_id
    }

    get is_assigned(): boolean {
        return this._is_assigned;
    }

    get next_assigned_username(): string {
        return this._next_assigned_username;
    }

    get assigned_admin_id(): number {
        return this._assigned_admin_id;
    }

    get data_id(): number {
        return this._data_id;
    }

    get status(): string {
        return this._status;
    }
    set status(value: string) {
        this._status = value;
    }

    get table(): string {
        return this._table;
    }

    get is_exist(): boolean {
        return this._is_exist;
    }

    get is_editable(): boolean {
        return this._is_editable;
    }

    get name(): string {
        return this._name;
    }


    get is_salvage_acceptable(): boolean {
        return this._is_salvage_acceptable;
    }
}

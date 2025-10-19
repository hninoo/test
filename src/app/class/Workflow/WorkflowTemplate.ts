import {Base} from '../Base';
import {Conditions} from '../Conditions';
import {Workflow} from '../Workflow';

export class WorkflowTemplate extends Base {

    private _conditions: Conditions;
    private _workflow: Workflow;
    private _name: string;

    constructor(hash = {}) {
        super(hash);
        this._conditions = new Conditions();
        this._workflow = new Workflow();
        this._name = '';

        if (hash) {
            if (hash['conditions'] && hash['conditions']['condition_a']) {
                //FIXME:２つあるのはおかしい。。
                this._conditions = new Conditions(hash['conditions']['condition_a']);
            } else if (hash['conditions']) {
                if (hash['conditions']['condition_hash_a']) {
                    this._conditions = new Conditions(hash['conditions']['condition_hash_a'])
                } else {
                    this._conditions = new Conditions(hash['conditions']);
                }
            }

            if (hash['workflow']) {
                this._workflow = new Workflow(hash['workflow']);
            }
            if (hash['name']) {
                this._name = hash['name'];
            }
            if (hash['id']) {
                this.id = hash['id'];
            }
        }

    }

    get conditions(): Conditions {
        return this._conditions;
    }

    get workflow(): Workflow {
        return this._workflow;
    }

    set workflow(value: Workflow) {
        this._workflow = value;
    }
    
    get name(): string {
        return this._name;
    }
    set name(value: string) {
        this._name = value;
    }
}

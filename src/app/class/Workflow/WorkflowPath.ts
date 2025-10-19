import {Objectable} from '../Objectable';
import {Conditions} from '../Conditions';

export class WorkflowPath extends Objectable {

    [key: string]: any

    //admin or division
    private _id: number = null;
    private _status: string = null;
    private _type: string = 'admin';
    private _and_or: string = null;
    private _path_and_or_a: Array<WorkflowPath>;
    private _admin_id = null;
    private _division_id = null;
    private _position_id = null;
    private _field_name = null;
    private _is_main_division_id: boolean = false;
    private _add_data: boolean = false;

    private _conditions: Conditions = new Conditions();

    //all or one (enable if division_id is set)


    private _division_grant_type: string = 'all';

    private _include_parent_division: boolean = false;

    private _error_message: string = null;

    private main_division_id: number = null;

    protected array_ignore_fields: Array<string> = ['error_message', 'main_division_id'];

    public validate(main_division_id: number = null): boolean {
        if (this.type == 'admin') {
            if (!this.admin_id) {
                this._error_message = 'ユーザーが選択されていません';
                return false;
            }
        } else if (this.type == 'division') {
            if (!this.division_id) {
                this._error_message = '組織が選択されていません';
                return false;
            }
            if (this.isMainDivisionId() && !main_division_id) {
                this._error_message = 'メイン組織がありません';
                return false;
            }
        }
        if(this._path_and_or_a){
            for (let i = 0; i < this._path_and_or_a.length; i++) {
                if (!this._path_and_or_a[i].validate(main_division_id)) {
                    this._error_message = this._path_and_or_a[i].error_message;
                    return false;
                }
            }
        }
        return true;
    }


    public setByHash(hash) {
        for (const key of Object.keys(hash)) {
            if (key == 'conditions') {
                if (hash[key]) {
                    console.log(hash[key])
                    if (hash[key]['condition_a']) {
                        this._conditions = new Conditions(hash[key]['condition_a'])
                    } else if(hash[key]['condition_hash_a']){
                        this._conditions = new Conditions(hash[key]['condition_hash_a'])
                    } else {
                        this._conditions = new Conditions(hash[key])
                    }
                }
            } else if (this.hasProperty(this, key)) {
                this['_' + key] = hash[key];
            }
        }
        if (this._is_main_division_id) {
            this.division_id = '{my_main_division_id}';
        }
    }


    private hasProperty<K extends string>(
        x: unknown,
        name: K
    ): x is { [M in K]: unknown } {
        return x instanceof Object && name in x;
    }

    public isMainDivisionId(): boolean {
        return this.division_id == '{my_main_division_id}';

    }

    public setMainDivisionId(main_division_id: number) {
        this.main_division_id = main_division_id;
        if (this.isMainDivisionId()) {
            this.division_id = main_division_id
        }
    }

    public toArray(): any {
        let ary = super.toArray();
        return ary
    }

    public deleteAndOr(i){
        this.path_and_or_a.splice(i, 1);
    }

    get error_message(): string {
        return this._error_message;
    }

    get admin_id(): any {
        return this._admin_id;
    }

    set admin_id(value: any) {
        if (this.type == 'admin') {
            this._admin_id = value;
        }
    }

    get division_id(): any {
        return this._division_id;
    }

    set division_id(value: any) {
        if (this.type == 'division') {
            this._division_id = value;
        }
    }


    get position_id(): any {
        return this._position_id;
    }

    set position_id(value: any) {
        this._position_id = value;
    }

    get field_name(): any {
        return this._field_name;
    }

    set field_name(value: any) {
        this._field_name = value;
    }

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        if (value == 'admin') {
            this.division_id = null;
        } else {
            this.admin_id = null;
        }
        this._type = value;
    }

    get id(): number {
        return this._id;
    }

    get status(): string {
        return this._status;
    }

    get and_or(): string {
        return this._and_or;
    }

    set and_or(value: string) {
        this._and_or = value;
    }

    get path_and_or_a(): Array<WorkflowPath> {
        return this._path_and_or_a;
    }

    set path_and_or_a(value: Array<WorkflowPath>) {
        this._path_and_or_a = value;
    }

    get division_grant_type(): string {
        return this._division_grant_type;
    }

    set division_grant_type(value: string) {
        this._division_grant_type = value;
    }


    get is_main_division_id(): boolean {
        return this._is_main_division_id;
    }


    get conditions(): Conditions {
        return this._conditions;
    }


    get include_parent_division(): boolean {
        return this._include_parent_division;
    }

    set include_parent_division(value: boolean) {
        this._include_parent_division = value;
    }

    set conditions(value: Conditions) {
        this._conditions = value;
    }

    get add_data(): boolean {
        return this._add_data;
    }

    set add_data(value: boolean) {
        this._add_data = value;
    }

}



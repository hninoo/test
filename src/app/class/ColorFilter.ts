import {Base} from './Base';
import {Conditions} from './Conditions';

export class ColorFilter extends Base {

    public style: Object = {'backgroundColor': '#FFE0E2', 'fontSize.px': null, 'fontWeight': 'normal', 'color': '#374767'}
    private _conditions: Conditions
    private _field_name_a: Array<string> = [];

    constructor(hash = {}) {
        super(hash)
        this._conditions = new Conditions();

        if (!hash) {
            return;
        }

        for (const key of Object.keys(hash)) {
            if (key == 'condition_json') {

                let condition_json = JSON.parse(hash[key]);
                if (condition_json.condition_hash_a !== undefined ){
                    let _conditions = new Conditions(condition_json.condition_hash_a);

                    if (condition_json.children !== undefined ){
                        for (const children of condition_json.children) {
                            _conditions.addChildConditions( children );
                        }
                    }
                    this._conditions = _conditions;
                }else{
                    this._conditions = new Conditions(JSON.parse(hash[key]))
                }
                
            } else if (key == 'style') {
                let style = hash[key];
                if (Array.isArray(style)) {
                    style = {}
                }
                if (typeof style === 'string') {
                    style = JSON.parse(style)
                }
                this.style = style
            } else {
                this['_' + key] = hash[key];
            }
        }
    }

    get conditions(): Conditions {
        return this._conditions;
    }


    get field_name_a(): Array<string> {
        return this._field_name_a;
    }

    set field_name_a(value: Array<string>) {
        this._field_name_a = value;
    }

    toArray(): Object {
        return {
            'style': JSON.stringify(this.style),
            'condition_json': this._conditions.getSearchParamJson(),
            'field_name_a': this._field_name_a
        }
    }


    public error_a: Array<string> = []

    validate(): boolean {
        this.error_a = []
        if (this.conditions.condition_a.length == 0) {
            this.error_a.push('行に色を付ける場合、条件は必須です')
            return false;
        }

        return true;
    }
}

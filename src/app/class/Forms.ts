import {Form} from './Form';

export class Forms {
    private _forms: { [key: string]: Form; };

    constructor(forms_hash: Object) {
        this._forms = {}
        Object.keys(forms_hash).map(field_name => {
            this._forms[field_name] = new Form(forms_hash[field_name]);
        })
    }

    public add(field_name: string, form: Form) {
        this._forms[field_name] = form;
    }

    public byFieldName(field_name: string): Form {
        return this._forms[field_name];
    }

    public getArray(): Array<Form> {
        return Object.keys(this._forms).map((key: string) => {
            return this._forms[key]
        }).filter((form: Form) => {
            return !!form;
        });
    }

    public setField(field: Object) {
        if (this._forms[field['Field']]) {
            this._forms[field['Field']].field = field;
        }

    }

    public byColumnType(column_type: string) {
        for (let key in this._forms) {
            if (this._forms.hasOwnProperty(key) && this._forms[key].column_type === column_type) {
                return this._forms[key];
            }
        }

        return null;
    
    }

    get forms(): { [key: string]: Form; } {
        return this._forms;
    }
}

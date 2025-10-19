import {Form} from './Form';

export class FormAndValue {
    public form: Form = null;
    public value: string = null;

    //if CHILD
    public value_a: Array<any> = [];

    public constructor(_form: Form = null, _value: string = null) {
        this.form = _form;
        this.value = _value;
    }

    public setArrayData(data_index: number, val) {
        this.value_a[data_index] = val
    }

    // @ts-ignore
    public toArray() {
        let value_a = [];
        Object.keys(this.value_a).forEach(k => {
            value_a.push(this.value_a[k])
        })
        let is_child = value_a.length > 0
        //let value_a = Object.values(this.value_a);
        return {
            'field': this.form ? this.form.field['Field'] : null,
            'value': is_child ? value_a : this.value,
            'is_child': is_child
        }
    }

    set(form: Form, value: Object) {
        this.form = form;
        if (Array.isArray(value)) {
            this.value_a = value;
        } else {
            this.value = value.toString();
        }
    }

    public toText() {
        let value = this.value;
        if (this.value_a.length > 0) {
            //comma
            value = this.value_a.join(', ')
        }
        if (!this.form) {
            return 'No form'
        }
        return `${this.form.field['Comment']} ▶ ${value}`
    }
}

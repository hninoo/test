import {Form} from '../Form';
import {Base} from '../Base';


export class Variable extends Base {
    private _type: string = 'text';
    private _default_value: string;
    private _name: string;

    private _dummy_form: Form = null;

    //実際にセットされた値
    private _value: string;
    protected array_ignore_fields = ['dummy_form'];


    constructor(hash = null) {
        super(hash);

        if (hash && hash['type']) {
            this._type = hash['type']
        }
        if (!this._id) {
            this._id = Date.now();
        }
        if (this.default_value && !this.value) {
            this.value = this.default_value
        }
        this.setDummyForm();

    }


    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
        this.setDummyForm();
    }

    get default_value(): string {
        return this._default_value;
    }

    set default_value(value: string) {
        this._default_value = value;
    }

    public setDummyForm() {
        let form: Form = new Form({'type': this.type});
        this._dummy_form = form;
    }

    get dummy_form(): Form {
        return this._dummy_form;
    }


    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._value = value;
    }

    public error_message: string;

    public validate(): boolean {
        if (!this._name || this._name == '') {
            this.error_message = '変数名は必須です。';
            return false;

        }
        return true;
    }
}

import {Form} from './Form';
import {Data} from './Data';
import {Objectable} from './Objectable';

export class FormEditData extends Objectable {
    [key: string]: any

    public form: Form = null;
    public field: Object = null;
    public data: Data = null;
    public data_index: number = null;
    public grant_menu_a: Array<any> = [];


    public is_setting: boolean = false;
    public selectChange = null;


    public setByHash(hash) {
        for (const key of Object.keys(hash)) {
            if (this.hasProperty(this, key)) {
                this[key] = hash[key];
            }
        }
    }

    private hasProperty<K extends string>(
        x: unknown,
        name: K
    ): x is { [M in K]: unknown } {
        return x instanceof Object && name in x;
    }


}

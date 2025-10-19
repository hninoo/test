import {Objectable} from './Objectable';


export class Base extends Objectable {
    protected _id: number;
    protected _updated: Date;
    protected _created: Date;

    /**/
    [key: string]: any


    constructor(hash = null) {
        super();
        if (!hash) {
            return;
        }
        for (const key of Object.keys(hash)) {
            if (this.hasProperty(this, key)) {
                this['_' + key] = hash[key];
            }
        }
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get updated(): Date {
        return this._updated;
    }

    get created(): Date {
        return this._created;
    }

    private hasProperty<K extends string>(
        x: unknown,
        name: K
    ): x is { [M in K]: unknown } {
        return x instanceof Object && name in x;
    }

}

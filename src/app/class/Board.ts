import {Base} from './Base';

export class Board extends Base {

    private _content: string;
    private _view_data = {};

    constructor(hash) {
        super(hash)
        for (const key of Object.keys(hash)) {
            if (key == 'view') {
                this._view_data = hash['view'];
            } else {
                this['_' + key] = hash[key];
            }
        }
    }

    get content(): string {
        return this._content;
    }

    get view_data(): Object {
        return this._view_data;
    }

    set content(content) {
        this._content = content;
    }
}

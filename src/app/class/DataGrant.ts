export class DataGrant {
    get delete(): boolean {
        return this._delete;
    }

    constructor(hash = {}) {
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }
    }

    get detail(): boolean {
        return this._detail;
    }

    get edit(): boolean {
        return this._edit;
    }


    get workflow_withdraw(): boolean {
        return this._workflow_withdraw;
    }

    get deletable(): boolean {
        return this._deletable;
    }

    setAllGrant(flg) {
        this._edit = this._delete = this._detail = flg;
    }

    private _edit: boolean = false;
    private _detail: boolean = false;
    private _delete: boolean = false;
    private _deletable: boolean = false;
    private _workflow_withdraw: boolean = false;

}

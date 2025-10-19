export class Grant {
    get dashboard(): boolean {
        return this._dashboard;
    }


    get create_view(): boolean {
        return this._create_view;
    }


    private _add: boolean
    private _csv_download: boolean
    private _csv_upload: boolean
    private _zip_upload: boolean
    private _delete: boolean
    private _edit: boolean
    private _list: boolean
    private _duplicate: boolean
    private _update_all: boolean
    private _only_own_data: boolean
    private _summarize: boolean
    private _summarize_list: boolean
    private _detail: boolean
    private _create_view: boolean
    private _dashboard: boolean

    private _table_editable: boolean = false;
    private _table_author: boolean = false;
    private _permission_view: boolean = false;

    private _only_view_field_name_a: Array<string> = []
    private _hide_field_a: Array<string> = []

    constructor(hash) {
        if (!hash) {
            return;
        }
        for (const key of Object.keys(hash)) {
            this['_' + key] = hash[key];
        }
    }

    get add(): boolean {
        return this._add;
    }

    set add(value:boolean){
        this._add = value;
    }

    get csv_download(): boolean {
        return this._csv_download;
    }

    get csv_upload(): boolean {
        return this._csv_upload;
    }
    
    get zip_upload(): boolean {
        return this._zip_upload;
    }

    get delete(): boolean {
        return this._delete;
    }

    get edit(): boolean {
        return this._edit;
    }

    get list(): boolean {
        return this._list;
    }

    get duplicate(): boolean {
        return this._duplicate;
    }


    get update_all(): boolean {
        return this._update_all;
    }

    get only_own_data(): boolean {
        return this._only_own_data;
    }

    get summarize(): boolean {
        return this._summarize;
    }

    get summarize_list(): boolean {
        return this._summarize_list;
    }

    get detail(): boolean {
        return this._detail;
    }


    get table_editable(): boolean {
        return this._table_editable;
    }


    get table_author(): boolean {
        return this._table_author;
    }
    get permission_view(): boolean {
        return this._permission_view;
    }

    get only_view_field_name_a(): Array<string> {
        return this._only_view_field_name_a;
    }


    get hide_field_a(): Array<string> {
        return this._hide_field_a;
    }

    isEditableField(field_name: string): boolean {
        return this._only_view_field_name_a.indexOf(field_name) == -1
    }

    setAllGrant(flg) {
        this._edit = this._delete = this._detail = flg;
    }

    getDefaultGrant() {
        return {
            add: true,
            csv_download: true,
            csv_upload: true,
            zip_upload: true,
            delete: true,
            edit: true,
            list: true,
            duplicate: true,
            update_all: true,
            only_own_data: false,
            summarize: true,
            summarize_list: true,
            detail: true,
            create_view: true,
            dashboard: false,
            table_editable: false,
            table_author: false,
            permission_view: false,
            only_view_field_name_a: [],
            hide_field_a: []
        }
    }
}

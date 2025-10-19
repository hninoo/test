import {CustomFilter} from './Filter/CustomFilter';

export class DashboardContent {
    private _id: number = null;
    private _type: string = null;

    private _col_size: number = 12;
    private _edit_component_x_order: number = 1;
    private _edit_component_y_order: number = 1;

    private _content: string = null;
    private _customFilter: CustomFilter = null;

    public setByHash(hash) {
        this._id = hash['id'];
        this._type = hash['type'];
        this._col_size = hash['col_size'];
        this._edit_component_x_order = hash['edit_component_x_order'];
        this._edit_component_y_order = hash['edit_component_y_order'];

        if (this.col_size == 3) {
            this.col_size = 4;
        }

        if (this._type === 'board') {
            this._content = hash['content'];
        } else if (this._type === 'filter') {
            this._customFilter = new CustomFilter(hash['filter']);

        }
    }


    get id(): number {
        return this._id;
    }

    get type(): string {
        return this._type;
    }


    get content(): string {
        return this._content;
    }


    set content(value: string) {
        this._content = value;
    }

    get customFilter(): CustomFilter {
        return this._customFilter;
    }


    get col_size(): number {
        return this._col_size;
    }

    set col_size(value: number) {
        this._col_size = value;
    }

    public getColClass() {
        let class_a = ['col-xl-' + this._col_size]

        if (this.col_size == 4) {
            class_a.push('col-lg-6')
        }
        return class_a.join(' ')
    }

    get x(): number {
        return this._edit_component_x_order;
    }

    get y(): number {
        return this._edit_component_y_order;
    }
}

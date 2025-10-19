import {Grant} from './Grant';

export class SimpleTableInfo {
    public table: string;
    public name: string;
    public group: string;
    public grant: Grant;

    public archive_flag: boolean;   
    public view_label: string;

    constructor(_table: string, _name: string, _group: string, _grant: Object, _archive_flag: boolean = false) {
        this.table = _table;
        this.name = _name;
        this.group = _group;
        this.grant = new Grant(_grant)

        this.archive_flag = _archive_flag;
        this.view_label = this.getLabel()
    }

    public getLabel() {
        return (this.group ? this.group + ' / ' : '') + this.name;
    }

    public isDatasetTable() {
        return this.table.indexOf('dataset_') >= 0
    }

}

import {Data} from './Data';
import {Connect} from '../services/connect';


export class GrantGroupData extends Data {

    //constructor
    constructor(data: any) {
        super(data)
    }


    public getDivisionLabel(): string {
        return this._child_data_by_table['grant_group_division_ids_multi'].map((_data: Data) => {
            return _data.view_data['value']
        }).join(', ')
    }

    public getAdminLabel(): string {
        return this._child_data_by_table['grant_group_admin_ids_multi'].map((_data: Data) => {
            return _data.view_data['value']
        }).join('<br> ')
    }

    public loadChildData(_connect: Connect) {
        _connect.get('/admin/view/grant_group/' + this.value, null, null, false).subscribe((data) => {
            this.setInstanceData(data.data)

        });

    }
}

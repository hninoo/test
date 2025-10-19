import {Component, Input, OnInit} from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import {CopyBlock, CopyOtherTableBlock} from '../flow.component';
import {SharedService} from '../../services/shared';

@Component({
    selector: 'app-copy-other-table-block',
    templateUrl: './copy-other-table-block.component.html',
    styleUrls: ['./copy-other-table-block.component.scss']
})
export class CopyOtherTableBlockComponent implements OnInit {

    @Input() public table_info: TableInfo;
    @Input() public block: CopyOtherTableBlock;

    public target_table_info: TableInfo;
    public copy_field_name_a: Array<string> = [];
    public has_more_copy_field: boolean = false;

    constructor(private _shared: SharedService) {
    }

    ngOnInit(): void {
        this.block.copy_from_to_fields.forEach(f => {
            let _from_form = this.table_info.forms.byFieldName(f.from);
            this.copy_field_name_a.push(_from_form.label);
        });
        if (this.block.target_table) {
            this._shared.getTableInfo(this.block.target_table).subscribe(_table_info => {
                this.target_table_info = _table_info;
            });
        }
    }

}

import {Component, Input, OnInit} from '@angular/core';
import {CopyBlock} from '../flow.component';
import {TableInfo} from '../../class/TableInfo';

@Component({
    selector: 'app-copy-block',
    templateUrl: './copy-block.component.html',
    styleUrls: ['./copy-block.component.scss']
})
export class CopyBlockComponent implements OnInit {

    @Input() public table_info: TableInfo;
    @Input() public block: CopyBlock;

    public copy_field_name_a: Array<string> = [];
    public has_more_copy_field: boolean = false;

    constructor() {
    }

    ngOnInit(): void {
        let max_field_len = 3;
        this.table_info.forms.getArray().forEach(f => {
            if (this.block.copy_fields.indexOf(f.field_name) >= 0 && this.copy_field_name_a.length < max_field_len) {
                this.copy_field_name_a.push(f.label);
            }
            ;
        });
        this.has_more_copy_field = this.copy_field_name_a.length < this.block.copy_fields.length;
    }

}

import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import {SharedService} from '../../services/shared';
import {Data} from '../../class/Data';
import {GrantGroupData} from '../../class/GrantGroupData';
import {Connect} from '../../services/connect';


@Component({
    selector: 'grant-group-form',
    templateUrl: './grant-group-form.component.html',
})
export class GrantGroupFormComponent implements OnChanges {

    @ViewChild('grantGroupModal') grantGroupModal: any;

    @Input() value: number = null;
    @Input() target_table_name: string = null;
    @Input() grant_gorup_id: number = null;
    @Input() field_name: string = null;
    @Input() title: string = null;

    // idの差別化用
    @Input() grant_kind: string = null;

    @Output() onChangeValue: EventEmitter<Object> = new EventEmitter();

    public target_table_info: TableInfo = null;
    public data: Data = null;


    public grant_group_table_info: TableInfo = null;
    public grantGroupData: GrantGroupData = null;
    public searchTerm: string = '';
    public filteredGroups: any[] = [];
    public isSearching: boolean = false;
    public existGrantGroup: boolean = false;

    constructor(private _shared: SharedService, private _connect: Connect) {
    }

    filterGrantGroups(): void {
        if (!this.searchTerm) {
            this.filteredGroups = [];
            return;
        }

        this.isSearching = true;
        this._connect.get('/admin/view/grant_group/search?term=' + encodeURIComponent(this.searchTerm))
            .subscribe(
                (data) => {
                    this.filteredGroups = data.data;
                    this.isSearching = false;
                },
                (error) => {
                    console.error('Error searching grant groups:', error);
                    this.isSearching = false;
                }
            );
    }

    ngOnChanges(changes: SimpleChanges): void {
        this._shared.getTableInfo('grant_group').subscribe(_table_info => {
            this.grant_group_table_info = _table_info

        })
        this.loadGrantGroupData()

        if (this.value) {
            this.existGrantGroup = true;
        } else {
            this.existGrantGroup = false;
        }

    }

    onInputGrantGroup($event) {
        this.value = $event.id;
        this.grantGroupModal.hide();
        this.loadGrantGroupData()
        console.log($event)
        this.onChangeValue.emit({
            id: $event.id
        })
    }

    loadGrantGroupData() {
        if (!this.value) {
            return;
        }

        this._connect.get('/admin/view/grant_group/' + this.value).subscribe((data) => {
            this._shared.getTableInfo('grant_group').subscribe(_table_info => {
                this.grantGroupData = new GrantGroupData(_table_info)
                this.grantGroupData.setInstanceData(data.data)
            })
        });

    }


}

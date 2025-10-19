import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { RelationTable } from '../../class/RelationTable';
import {Data} from '../../class/Data';
import { SharedService } from '../../services/shared';
import { Observable } from 'rxjs/Observable';
import { TableInfo } from 'app/class/TableInfo';
import { Router } from '@angular/router'
import { Connect } from '../../services/connect';



@Component({
  selector: 'app-relation-table',
  templateUrl: './relation-table.component.html',
  styleUrls: ['./relation-table.component.css']
})
export class RelationTableComponent implements OnInit {

  @Input('data') data: Data = new Data(new TableInfo([]));
    @Input() relation_table_hash: any
    // public relation_table_info_by_table: Object = {};
    @Input() is_relation_view_mode:  boolean = false;
    @Input() base_table_info: TableInfo = null;
    @Input() field_id: any = null;
    public relation_table: RelationTable = null;
    public relation_table_info: TableInfo = null;

  public count: number;
  public per_page: number = 10;
  public page: number = 1;
  private numbers: Array<number>;
  public index_no: number = 0;
  public loading: boolean = false;
  public id = 'pagination-';

  public delete_data: Array<any>;
  @ViewChild('deleteRelatedItemModal') deleteRelationModal: any;


  constructor(
    private _connect: Connect,
    public _share: SharedService,
    private _router: Router
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
      console.log(this.relation_table_hash)
      if(!this.relation_table_hash) return;
      this.count = this.relation_table_hash.total_count;
      let total_page = Math.ceil(this.count / this.per_page);
      this.numbers = Array(total_page).fill(0).map((x, i) => i + 1);
      this.index_no = this.relation_table_hash.index_no;
      this.id = 'pagination-' + this.relation_table_hash.index_no;

      this._share.getTableInfo(this.relation_table_hash.table).subscribe(_table_info => {
          this.relation_table_info = _table_info;
          this.relation_table = new RelationTable(this.relation_table_hash, _table_info)
      });
  }

    public getRelationViewFields(): Observable<Array<string>> {
    return new Observable(observer => {
        this._share.getTableInfo(this.relation_table.table).subscribe(_table_info => {
        if (!_table_info) {
          observer.next([]);
        } else {
            observer.next(this.relation_table.getViewFields(_table_info))
        }
      })
    });
  }

  async onPageChange(page) {
    this.page = page;
    this.loading = true;
    await this._connect.getList(this.relation_table_info, page, this.per_page, null, {}, [], true, { field: 'field__' + this.field_id, relation_base_table: this.base_table_info.table, base_id: this.data.raw_data['id'] }).subscribe((data) => {
      this.relation_table = new RelationTable({ ...this.relation_table_hash, data_a: data.data_a }, this.relation_table_info);
      this.loading = false;
    });
  }

  goToTableEdit(table_info: TableInfo): void {
    // 親レコードのデータを取得
    const parenRawtData = this.data.raw_data;
    const parentViewData = this.data.view_data;
    // 一旦複数項目未対応
    // const parentChildDataByTable = this.data.child_data_by_table;
    
    // コピー対象フィールド情報を取得
    const copyFieldsData = {};
    const copyFieldsViewData = {};
    // const copyChildDataByTable = {};

    // base_table_info.formsをループして、relation_tableタイプのフィールドを探す
    if (this.base_table_info && this.base_table_info.forms) {
        this.base_table_info.forms.getArray().forEach(form => {
            if (form.type === 'relation_table') {
                const custom_field = form.custom_field as { copy_to_relation_fields?: Array<{ from: string; to: string }> };
                if (custom_field && custom_field.copy_to_relation_fields) {
                    // copy_to_relation_fieldsからコピー対象フィールド情報を取得
                    custom_field.copy_to_relation_fields.forEach(field => {
                        if (field.from && field.to) {
                            const value = parenRawtData[field.to];
                            const view_value = parentViewData[field.to];
                            if (value !== undefined) {
                                copyFieldsData[field.from] = value;
                                copyFieldsViewData[field.from] = view_value;
                            }
                            
                            // child_data_by_tableのコピー
                            // if (parentChildDataByTable && parentChildDataByTable[field.to]) {
                            //     copyChildDataByTable[field.from] = parentChildDataByTable[field.to];
                            // }
                        }
                    });
                }
            }
        });
    }
    
    // URLパラメータを構築
    const queryParams: any = {};
    if (Object.keys(copyFieldsData).length > 0) {
        queryParams.copy_fields = JSON.stringify(copyFieldsData);
    }
    if (Object.keys(copyFieldsViewData).length > 0) {
        queryParams.copy_fields_view = JSON.stringify(copyFieldsViewData);
    }
    // if (Object.keys(copyChildDataByTable).length > 0) {
    //     queryParams.copy_child_data_by_table = JSON.stringify(copyChildDataByTable);
    // }
    
    // 新規作成画面に遷移
    this._router.navigate([this._share.getAdminTable(), table_info.admin_table_setting.table, 'edit', 'new'], {
        queryParams: queryParams
    });
  }

  openAdminTableDeleteModal = (data: Data) => {
    if (data.raw_data['id'] === null) {
      console.error('primary-keyがNULLです', 'エラー');
      return;
    }
    this.delete_data = [data.raw_data['id']];
    this.deleteRelationModal.show();
  }
  delete(id_a: any): void {
    this.deleteRelationModal.show();
    this._connect.post('/admin/delete/' + this.relation_table.table, { 'id_a': id_a }).subscribe(
      (jsonData) => {
        console.log('related record delete', jsonData);
        let id = id_a[0];
        for (let i = 0; i < this.relation_table.data_a.length; i++) {
          if (this.relation_table.data_a[i].raw_data['id'] === id) {
            this.relation_table.data_a.splice(i, 1);
            break;
          }
        }
        this.deleteRelationModal.hide();
      }, (error) => {
        this.deleteRelationModal.hide();
      }
    );
  }

}

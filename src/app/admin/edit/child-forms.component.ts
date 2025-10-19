import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { TableInfo } from '../../class/TableInfo';
import { Form } from '../../class/Form';

@Component({
  selector: 'admin-child-forms',
  templateUrl: './child-forms.component.html',
  styleUrls: ['./child-forms.component.scss']
})
export class ChildFormsComponent implements OnInit, OnChanges {

  @Input() form: Form;
  @Input() child_table: TableInfo | null = null;
  @Input() editComponent: any;

  constructor() { }

  ngOnInit(): void {
    if (!this.form || !this.editComponent) {
      console.warn('ChildFormsComponent: Required inputs are missing');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['child_table'] && this.child_table) {
      // 子テーブルが変更された時の処理
      console.log('Child table changed:', this.child_table.table);
    }
  }

  get isValidChildForm(): boolean {
    return !!(
      this.form && 
      this.form.original_type === 'select_other_table' && 
      this.form['is_child_form'] && 
      this.child_table &&
      this.child_table.menu &&
      this.child_table.menu.multiple_mode === 'normal'
    );
  }

  get childData(): any[] {
    if (!this.editComponent?.data?.child_data_by_table || !this.child_table) {
      return [];
    }
    return this.editComponent.data.child_data_by_table[this.child_table.table] || [];
  }

  get hasChildData(): boolean {
    return this.childData.length > 0;
  }

}
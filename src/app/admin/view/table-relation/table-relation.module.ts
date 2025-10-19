import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableRelationComponent } from './table-relation.component';
import { TableRelationRoutingModule } from './table-relation-routing.module';

@NgModule({
  declarations: [
    TableRelationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableRelationRoutingModule
  ],
  exports: [
    TableRelationComponent
  ]
})
export class TableRelationModule { }

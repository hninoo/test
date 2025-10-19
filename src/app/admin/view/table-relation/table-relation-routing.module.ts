import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TableRelationComponent } from './table-relation.component';

const routes: Routes = [
  {
    path: '',
    component: TableRelationComponent
  },
  {
    path: ':table',
    component: TableRelationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TableRelationRoutingModule { }

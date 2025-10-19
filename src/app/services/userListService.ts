import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, switchMap } from 'rxjs/operators';
import { Connect } from './connect'; 
import { TableInfo } from '../class/TableInfo';
import {Data} from '../class/Data';


@Injectable({
  providedIn: 'root'
})
export class userListService {
  private cache$: Observable<TableInfo>;
  private dataListCache$: Observable<Data[]>;


  constructor(private connect: Connect) {}

  getUserInfo(): Observable<TableInfo> {
    if (!this.cache$) {
      this.cache$ = this.connect.get('/admin/table/info/admin').pipe(
        tap(_ => console.log('fetched table info')),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  getDataList(tableInfo: TableInfo): Observable<Data[]> {
    if (!this.dataListCache$) {
      this.dataListCache$ = this.connect.getList(tableInfo).pipe(
        switchMap(data => of(data['data_a'].map((hash: Object) => {
          let _data: Data = new Data(tableInfo);
          _data.setInstanceData(hash);
          return _data;
        }))),
        shareReplay(1)
      );
    }
    return this.dataListCache$;
  }
}
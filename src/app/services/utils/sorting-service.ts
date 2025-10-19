import {Injectable} from '@angular/core';

@Injectable()

export class SortingService{


	constructor(){

	}

	selectionSort(array, min_index, axis) {
        let min_item = array[min_index];
        
       
        for (let i = min_index; i < array.length; i++) {
          if (
            axis == 'x' ? parseInt(array[i].x )< parseInt(min_item.x) : parseInt(array[i][0].y) < parseInt(min_item[0].y)
            ) {
            array[min_index] = array[i];
            array[i] = min_item;
            min_item = array[min_index];
            if(axis=='x'){
                break;
            }
          }
        }
        
        if (array.length != 1) {
            min_index += 1;
          }
    
        if (min_index != array.length - 1) {
          this.selectionSort(array, min_index, axis);
        } else {
          return ;
        }
      }
}
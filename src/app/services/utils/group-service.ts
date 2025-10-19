import {Injectable} from '@angular/core'
import {SortingService} from './sorting-service'

@Injectable()

export class GroupService {

    constructor(private sortingService: SortingService) {

    }

    groupByAxis(fields, field) {
        let new_row = false;
        for (let item_array of fields) {
            if (item_array.some((item) => item.y === field.y)) {
                new_row = false;
                item_array.push(field);
                if (item_array.length > 1) {
                    this.sortingService.selectionSort(item_array, 0, 'x');

                }
                break;
            } else {
                new_row = true;
            }
        }
        if (new_row) {
            fields.push([field]);
        }

    }

}

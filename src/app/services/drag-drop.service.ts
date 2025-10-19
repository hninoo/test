import {
    CdkDrag,
    CdkDragDrop,
    CdkDragMove,
    CdkDragRelease,
    CdkDropList,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class DragDropService {
    dropLists: CdkDropList[] = [];
    currentHoverDropListId?: string;

    constructor(
        @Inject(DOCUMENT) private document: Document,
    ) { }

    public register(dropList) {
        if(!this.dropLists.find(l=>l==dropList))this.dropLists.push(dropList);
    }

    public setEmptyDroplist() {
        this.dropLists = [];
    }

    dragMoved(event: CdkDragMove) {
        let elementFromPoint = this.document.elementFromPoint(
            event.pointerPosition.x,
            event.pointerPosition.y
        );

        if (!elementFromPoint) {
            this.currentHoverDropListId = undefined;
            return;
        }

        if (elementFromPoint.classList.contains('no-drop')) {
            this.currentHoverDropListId = 'no-drop';
            return;
        }

        let dropList = elementFromPoint.classList.contains('cdk-drop-list')
            ? elementFromPoint
            : elementFromPoint.closest('.cdk-drop-list');

        if (!dropList) {
            this.currentHoverDropListId = undefined;
            return;
        }

        this.currentHoverDropListId = dropList.id;
    }

    dragReleased(event: CdkDragRelease) {
        this.currentHoverDropListId = undefined;
    }

    isDropAllowed(drag: CdkDrag, drop: CdkDropList) {
        if (this.currentHoverDropListId == null) {
            return true;
        }

        return drop.id === this.currentHoverDropListId;
    }

    drop(event: CdkDragDrop<[]> ) {
        console.log('Dropped', event, event.item.data, event.previousContainer.id);

        if (event.previousContainer == event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }

    }

}

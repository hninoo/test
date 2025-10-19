import {Injectable} from '@angular/core';
import {Block} from '../../../src/app/flow/flow.component'; // Block モデルのインポート

@Injectable({
    providedIn: 'root'
})
export class TriggerHistoryService {
    private history: string[] = [];
    private currentIndex = -1;
    private redoStack: string[] = [];


    constructor() {
    }

    addState(blocks_json: string) {
        if (this.currentIndex !== this.history.length - 1) {
            this.history.splice(this.currentIndex + 1);
        }

        this.history.push(blocks_json);

        // 履歴が10を超える場合、古い履歴を削除
        if (this.history.length > 10) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo(): string | null {
        if (this.currentIndex > 0) {
            this.redoStack.push(this.history[this.currentIndex]);
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        return null;
    }

    redo(): string | null {
        if (this.redoStack.length > 0) {
            const redoState = this.redoStack.pop();
            if (redoState) {
                this.currentIndex++;
                this.history[this.currentIndex] = redoState;
                return redoState;
            }
        }
        return null;
    }


    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

}

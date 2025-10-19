import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Conditions } from '../../../class/Conditions';
import { SharedService } from '../../../services/shared';

@Component({
    selector: 'condition-modal',
    templateUrl: './condition-modal.component.html'
})
export class ConditionModalComponent implements OnInit {
    @Input() type: 'view' | 'edit' | 'add' | 'delete' | 'summarize' | 'duplicate' | 'update_all';
    @Input() table: string;
    private _conditions: Conditions;
    @Output() onSave = new EventEmitter<Conditions>();

    constructor(
        public activeModal: NgbActiveModal,
        private _share: SharedService
    ) {
        this._conditions = new Conditions([]);
        
        const originalDismiss = this.activeModal.dismiss;
        this.activeModal.dismiss = (reason?: any) => {
            this.showGrantModal();
            return originalDismiss.call(this.activeModal, reason);
        };
    }

    @Input()
    set conditions(value: string | Record<string, any> | Conditions | null) {
        if (!value) {
            this._conditions = new Conditions([]);
            return;
        }
        
        if (value instanceof Conditions) {
            this._conditions = value;
            return;
        }

        try {
            const conditionData = typeof value === 'string' ? JSON.parse(value) : value;
            const arrayData = Array.isArray(conditionData) ? conditionData : [conditionData];
            this._conditions = new Conditions(arrayData);
        } catch (e) {
            console.error('Failed to parse conditions:', e);
            this._conditions = new Conditions([]);
        }
    }

    get conditions(): Conditions {
        return this._conditions;
    }

    ngOnInit(): void {
        if (!this._conditions) {
            this._conditions = new Conditions([]);
        }
    }

    onConditionsChanged(event: { conditions: Conditions }): void {
        if (event?.conditions instanceof Conditions) {
            this._conditions = event.conditions;
        }
    }

    save(): void {
        if (this.type === 'add' || this.type === 'delete') {
            // 条件の妥当性チェック
            if (!this._conditions || this._conditions.condition_a.length === 0) {
                if (!confirm('条件が設定されていません。すべてのデータに対して' + 
                    (this.type === 'add' ? '追加' : '削除') + 
                    '操作が可能になります。よろしいですか？')) {
                    return;
                }
            }
        }
        
        this.onSave.emit(this._conditions);
        this.showGrantModal();
        this.activeModal.close();
    }
    
    private showGrantModal(): void {
        const grantModalElements = document.getElementsByClassName('grant-modal-container');
        if (grantModalElements && grantModalElements.length > 0) {
            for (let i = 0; i < grantModalElements.length; i++) {
                const element = grantModalElements[i] as HTMLElement;
                if (element.style.display === 'none') {
                    element.style.display = 'block';
                }
            }
        }
    }

    getModalTitle(): string {
        const titles: Record<string, string> = {
            'view': '閲覧条件設定',
            'edit': '編集条件設定', 
            'add': '追加条件設定',
            'delete': '削除条件設定',
            'summarize': '集計条件設定',
            'duplicate': '複製条件設定',
            'update_all': '一括編集条件設定'
        };
        return titles[this.type] || '条件設定';
    }
}

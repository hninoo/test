import {Injectable} from '@angular/core';
import {Connect} from '../services/connect';
import {Observable} from 'rxjs/Observable';

@Injectable({
    providedIn: 'root'
})
export class WorkflowService {
    constructor(
        private _connect: Connect
    ) {
    }


    public withdraw(workflow_id_a: Array<number>, workflow_comment: string, auto: Boolean = false): Observable<any> {
        return this._connect.post('/admin/workflow/withdraw', {'id_a': workflow_id_a, 'comment': workflow_comment, 'auto': auto});
    }


    public setStatus(workflow_id_a: Array<number>, workflow_status: string, workflow_comment: string, is_salvage: boolean = false): Observable<any> {
        return new Observable(observer => {
            this._connect.post('/admin/workflow/set-status', {'id_a': workflow_id_a, 'status': workflow_status, 'comment': workflow_comment, 'is_salvage': is_salvage}, undefined, false)
                .subscribe(
                    (response) => {
                        observer.next(response);
                        observer.complete();
                    },
                    (error) => {
                        observer.error(error);
                    }
                );
        });
    }
}

import {Component, OnInit} from '@angular/core';
import {Connect} from '../services/connect';
import {Router} from '@angular/router';

@Component({
    templateUrl: 'reset.component.html',
})
export class ResetComponent implements OnInit {

    constructor(protected _connect: Connect, private _router: Router) {

    }


    ngOnInit() {
        // this._connect.get('/sendmail').subscribe(res => console.log(res))

        this._connect.post('/public/reset', {'key': 'JdvHHANCS4TCB47pe4h48tMkFF3nktZK'}).subscribe((data) => {
            this._router.navigate(['admin', 'login']);
        });
        // this.load_csrf();
    }

}

import {LoginBaseComponent} from '../../app/components/login-base.component';

/**
 * ログイン処理を置換する用の親ファイル
 */
export class LoginComponent extends LoginBaseComponent {
    ngOnInit() {
        super.ngOnInit();
        if (this.admin_table == 'user') {
            this._connect.post('/get_user', {}).toPromise().then((res) => {
                this.myForm = this.fb.group({
                    'email': res['user'].email,
                    'password': res['user'].password_raw,
                });
                this.login(this.myForm.value);
            });
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {LoginBaseComponent} from './login-base.component';
/**
 * ログイン処理を置換する用の親ファイル
 */
 @Component({
     templateUrl: 'login.component.html',
     selector: 'app-login-component'
})
 export class LoginComponent extends LoginBaseComponent {
}

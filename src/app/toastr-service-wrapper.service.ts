import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export default class ToastrServiceWrapperService {
  protected toasterService: ToastrService;
  public disableClear = true;
  constructor(toasterService: ToastrService) {
    this.toasterService = toasterService;
  }

  errorWarningConfig = { timeOut: 3000, disableTimeOut: true, enableHtml: true};

  successConfig = {
      tapToDismiss: true,
      timeOut: 3000,
      disableTimeOut: true, 
      newestOnTop: false
  };

  getOption(type = 'error'){
    let autoClose: any = localStorage.getItem('not_close_toastr_auto');
    if (autoClose == 'true' || autoClose == null) {
      this.disableClear = true;
      this.successConfig.disableTimeOut = true;
      this.errorWarningConfig.disableTimeOut = true;
    } else {
      this.disableClear = true;
      this.successConfig.disableTimeOut = false;
      this.errorWarningConfig.disableTimeOut = false;
    }
    if( type != 'error' ) return this.successConfig;
    if (type == 'error') return this.errorWarningConfig;
  }
    show(message?: string, title?: string) {
        this.toasterService.show(message, title, this.getOption());
    }

    success(message?: string, title?: string, option = {}) {
      option = { ...this.getOption('success'), ...option }
      this.toasterService.success(message, title, option);
    }

    warning(message?: string, title?: string, option = {}) {
        option = {...this.getOption(), ...option}
        console.log(option)
        this.toasterService.warning(message, title, option)
    }

    error(message?: string, title?: string, option = {}) {
        option = { ...this.getOption(), ...option }
        message = message.replace(/(\r\n|\n\r|\r|\n)/g, '<br>');
        this.toasterService.error(message, title, option)
    }

    info(message?: string, title?: string, option = {}) {
      option = { ...this.getOption(), ...option }
      this.toasterService.info(message, title, option);
    }

  clear(){
    if(!this.disableClear)this.toasterService.clear();
  }
}

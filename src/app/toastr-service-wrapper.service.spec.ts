import { TestBed } from '@angular/core/testing';

import  ToastrServiceWrapperService  from './toastr-service-wrapper.service';

describe('ToastrServiceWrapperService', () => {
  let service: ToastrServiceWrapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastrServiceWrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

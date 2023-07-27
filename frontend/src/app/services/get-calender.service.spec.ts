import { TestBed } from '@angular/core/testing';

import { GetCalenderService } from './get-calender.service';

describe('GetCalenderService', () => {
  let service: GetCalenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetCalenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

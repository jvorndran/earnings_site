import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportDateTableComponent } from './report-date-table.component';

describe('ReportDateTableComponent', () => {
  let component: ReportDateTableComponent;
  let fixture: ComponentFixture<ReportDateTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportDateTableComponent]
    });
    fixture = TestBed.createComponent(ReportDateTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

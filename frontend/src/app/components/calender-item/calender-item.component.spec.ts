import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalenderItemComponent } from './calender-item.component';

describe('CalenderItemComponent', () => {
  let component: CalenderItemComponent;
  let fixture: ComponentFixture<CalenderItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalenderItemComponent]
    });
    fixture = TestBed.createComponent(CalenderItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

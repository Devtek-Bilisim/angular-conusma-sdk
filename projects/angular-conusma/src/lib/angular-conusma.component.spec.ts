import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularConusmaComponent } from './angular-conusma.component';

describe('AngularConusmaComponent', () => {
  let component: AngularConusmaComponent;
  let fixture: ComponentFixture<AngularConusmaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularConusmaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularConusmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

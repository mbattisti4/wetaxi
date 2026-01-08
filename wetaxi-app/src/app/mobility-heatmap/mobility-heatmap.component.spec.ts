import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobilityHeatmapComponent } from './mobility-heatmap.component';

describe('MobilityHeatmapComponent', () => {
  let component: MobilityHeatmapComponent;
  let fixture: ComponentFixture<MobilityHeatmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilityHeatmapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobilityHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

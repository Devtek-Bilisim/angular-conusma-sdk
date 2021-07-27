import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularConusmaService } from './angular-conusma.service';
import { AngularConusmaComponent } from './angular-conusma.component';
import { StoreModule } from '@ngrx/store';
import { ROOT_REDUCER } from './meeting.reducer';

@NgModule({
  declarations: [AngularConusmaComponent],
  imports: [
    HttpClientModule, StoreModule.forRoot(ROOT_REDUCER)
  ],
  exports: [AngularConusmaComponent,
    HttpClientModule]
})
export class AngularConusmaModule { 
  static forRoot(): ModuleWithProviders<AngularConusmaModule> {
    return {
      ngModule: AngularConusmaModule,
      providers: [AngularConusmaService]
    };
  }
}

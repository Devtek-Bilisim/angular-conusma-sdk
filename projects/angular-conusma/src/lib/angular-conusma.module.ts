import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularConusmaService } from './angular-conusma.service';
import { AngularConusmaComponent } from './angular-conusma.component';

@NgModule({
  declarations: [AngularConusmaComponent],
  imports: [
    HttpClientModule
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

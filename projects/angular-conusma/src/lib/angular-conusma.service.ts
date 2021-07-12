import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { User } from './user';
import { ConusmaException } from './Exceptions/conusma-exception';
import { GuestUser } from './guest-user';

@Injectable({
  providedIn: 'root'
})
export class AngularConusmaService {

  private appService: AppService;
  constructor(appId: string, parameters: { apiUrl: string }) {
    var deviceId =  "DeviceInfo.getUniqueId()";
    this.appService = new AppService(appId, { apiUrl: parameters.apiUrl,deviceId:deviceId, version:'1.0.0'});

  }
  public async createUser() {
    try {
      var user: User = new User(this.appService);
      await user.create();
      return user;
    } catch (error) {
      throw new ConusmaException("createUser","User cannot be created.", error);
    }
  }
  public async createGuestUser() {
    try {
      var user: GuestUser = new GuestUser(this.appService);
      await user.create();
      return user;
    } catch (error) {
      throw new ConusmaException("createGuestUser","GuestUser cannot be created.", error);
    }
  }
}

import { Injectable } from '@angular/core';
import { User } from './user';
import { ConusmaException } from './Exceptions/conusma-exception';
import { GuestUser } from './guest-user';
import { Observable, of } from 'rxjs';
import { ConusmaRestApiException } from './Exceptions/conusma-restapi-exception';
import { AppService } from './app.service';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { map, mapTo, catchError, throwIfEmpty, tap } from "rxjs/operators";
import { Router } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
import { Meeting } from './meeting';
import { MeetingModel } from './Models/meeting-model';
import { UserModel } from './Models/user-model';

@Injectable({
  providedIn: 'root'
})
export class AngularConusmaService {
  private apiUrl: string = "";
  private deviceId: string = "";
  private appService: AppService;
  public user: User;
  public publicUser: GuestUser;
  public activeMeeting: Meeting;
  constructor(private http: HttpClient, private router: Router, private alertController: AlertController, private platform: Platform) {

  }
  public setParameters(parameters: { apiUrl: string, deviceId: string }) {
    this.deviceId = parameters.deviceId;
    this.apiUrl = parameters.apiUrl;
    this.appService = new AppService(this.http, { apiUrl: this.apiUrl, deviceId: this.deviceId, version: "1.0.0" });
  }

  public async load() {
    try {
      if (this.user == null && this.publicUser == null) {
        if (await this.appService.isTokenValid()) {
          var user_raw_data = sessionStorage.getItem("UserData");
          var _user_data = JSON.parse(user_raw_data);
          if (_user_data.User_Type == 0) {
            this.publicUser = new GuestUser(this.appService);
            await this.publicUser.load();
          }
          else if (_user_data.User_Type == 1) {
            this.user = new User(this.appService);
            await this.user.load();
          }
          else {
            throw new Error("user not found");
          }
        }
      }
    } catch (error: any) {
      throw new ConusmaException("load", "not load user data", error);

    }
  }
  public getStorageMeeting() {
    try {
      return <MeetingModel>JSON.parse(sessionStorage.getItem("Meeting"));
    } catch (error: any) {
      throw new ConusmaException("getStorageMeeting", "Meeting cannot be loaded.", error);
    }
  }
  public async createGuestUser() {
    try {
      var user: GuestUser = new GuestUser(this.appService);
      await user.create();
      this.publicUser = user;
      return user;
    } catch (error: any) {
      throw new ConusmaException("createGuestUser", "GuestUser cannot be created.", error);
    }
  }

  public storeTokens(jwtToken: string, username: string, isloggedin: string, rememberme: string) {
    localStorage.setItem("rememberme", rememberme);
    if (rememberme) {
      localStorage.setItem("JWT_TOKEN", jwtToken);
      localStorage.setItem('isLoggedin', isloggedin);
      localStorage.setItem('username', username);
      localStorage.removeItem("PublicToken");
      localStorage.removeItem("PublicUserData");
    } else {
      sessionStorage.setItem("JWT_TOKEN", jwtToken);
      sessionStorage.setItem('isLoggedin', isloggedin);
      sessionStorage.setItem('username', username);
      localStorage.removeItem('rememberme');
      localStorage.removeItem("PublicToken");
      localStorage.removeItem("PublicUserData");
    }
  }


  public IsUser() {
    let userData = sessionStorage.getItem("UserData");
    if (userData != null) {
      var user = JSON.parse(userData);
      if (user.User_Type == "1") {
        return true;
      }
    }
    return false;
  }

  public getUserName() {
    let rememberme = localStorage.getItem("rememberme");
    if (rememberme) {
      return localStorage.getItem("username");
    } else {
      return sessionStorage.getItem("username");
    }
  }

  public getIsLoggedIn() {
    let rememberme = localStorage.getItem("rememberme");
    if (rememberme) {
      return localStorage.getItem("isLoggedin");
    } else {
      return sessionStorage.getItem("isLoggedin");
    }
  }

  public logout() {
    localStorage.removeItem("JWT_TOKEN");
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('rememberme');
    sessionStorage.removeItem("JWT_TOKEN");
    sessionStorage.removeItem('isLoggedin');
  }

  async presentAlert(message: string, header: string = "Error", url: string = "", callback = () => { }) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [{
        text: 'OK',
        handler: (data: any) => {
          if (callback)
            callback();
          if (url != "") {
            this.router.navigateByUrl(url);
          }
        }
      }]
    });


    await alert.present();
  }

  async presentConfirm(message: string, header: string = "Confirm", url: string = "", callback = () => { }) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [{
        text: 'OK',
        handler: (data: any) => {
          if (callback)
            callback();
          if (url != "") {
            this.router.navigateByUrl(url);
          }
        }
      },
      {
        text: 'Cancel',
        role: 'cancel'
      }]
    });


    await alert.present();
  }
  public async IsLogginUser() {
    try {
      var token = this.appService.getJwtToken();
      if (token != undefined && token != null) {
        var user_data = await this.appService.isTokenValid();
        sessionStorage.setItem("UserData", JSON.stringify(user_data));
        localStorage.setItem('JWT_TOKEN', user_data.Token);
        this.user = new User(this.appService);
        this.user.userInfo = user_data;
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }
  public async safedevicecode(data: { Code: string, DeviceId: string }) {
    return await this.appService.safedevicecode(data);
  }
  public async isMeetingValid(data: {"MeetingId": '', "Password": ''}) {
    return <MeetingModel> await this.appService.isMeetingValid(data);
  }
  public async meetingInviteCodeControl(code:string)
  {
    return <MeetingModel> await this.appService.inviteCodeControl(code);
 
  }

  public async login(data: { userkey: string, password: string, deviceId: string }) {
    var user_data = await this.appService.login(data);
    sessionStorage.setItem("UserData", JSON.stringify(user_data));
    localStorage.setItem('JWT_TOKEN', user_data.Token);
    this.user = new User(this.appService);
    this.user.userInfo = user_data;
    return this.user;
  }
  public async Googlelogin(data: { GoogleToken: string, deviceId: string }) {
    var user_data = await this.appService.Googlelogin(data);
    sessionStorage.setItem("UserData", JSON.stringify(user_data));
    localStorage.setItem('JWT_TOKEN', user_data.Token);
    this.user = new User(this.appService);
    this.user.userInfo = user_data;
    return this.user;
  }

  public async getTimezones() {
    try {
      var timezones:Array<any> = await this.appService.getTimezones();
      return timezones;
    } catch (error:any) {
      throw new ConusmaException("getTimezones","Timezone list cannot be received.", error);
    }
  }

}

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
import { UserModel } from './Models/user-model';
import { MeetingUserModel } from './Models/meeting-user-model';
import { CountryCode } from './Models/country-code';
import { MeetingModel } from './Models/meeting-model';

@Injectable({
  providedIn: 'root'
})
export class AngularConusmaService {
  private apiUrl: string = "";
  private deviceId: string = "";
  private appService: AppService;
  public user: User = null;
  public publicUser: GuestUser = null;
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
        console.log("user loading...");
        var userData = await this.appService.isTokenValid();
        if (userData != null) {
          if (userData.User_Type == 0) {
            this.publicUser = new GuestUser(this.appService);
            await this.publicUser.load();
          }
          else if (userData.User_Type == 1) {
            this.user = new User(this.appService);
            await this.user.load();
          }
          else {
            throw new Error("user not found");
          }
        } else {
          console.log("token invalid!");
        }
      }
    } catch (error: any) {
      throw new ConusmaException("load", "can't load user data", error);

    }
  }
  public async sendEMailVerification()
  {
    return await this.appService.sendEMailVerification();
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
      this.appService.saveUserData(this.publicUser.userInfo,true);
      return user;
    } catch (error: any) {
      throw new ConusmaException("createGuestUser", "GuestUser cannot be created.", error);
    }
  }




  public IsUser() {
    let rememberme =  <boolean>JSON.parse(localStorage.getItem("rememberme"));
    if (rememberme) {
      let userData = localStorage.getItem("UserData");
      if (userData != null) {
        var user = JSON.parse(userData);
        if (user.User_Type == "1") {
          return true;
        }
      }
    } else {
      let userData = sessionStorage.getItem("UserData");
      if (userData != null) {
        var user = JSON.parse(userData);
        if (user.User_Type == "1") {
          return true;
        }
      }
    }
   
    return false;
  }
  public async signup(name:string,surname:string,username:string,email:string,password:string)
  {
    var data = {
      'Name':name,'SurName':surname,'UserName':username,'EMail':email,'Password':password
    };
    return await this.appService.signup(data);
  }
  public async signupConfirim(code:string,email:string)
  {
    var data = {
      'Code':code,'EMail':email,
    };
    return await this.appService.signupConfirm(data);
  }
  public async forgotPassword(email: string)
  {
    return await this.appService.forgotPassword(email);
  } 
  public async controlForgotPasswordCode(code:string,password:string)  
  {
    return await this.appService.controlForgotPasswordCode(code,password);
  } 
  public getUserName() {
    let rememberme = <boolean>JSON.parse(localStorage.getItem("rememberme"));
    if (rememberme) {
      return localStorage.getItem("username");
    } else {
      return sessionStorage.getItem("username");
    }
  }

  public getIsLoggedIn() {
    let rememberme = <boolean>JSON.parse(localStorage.getItem("rememberme"));
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
    sessionStorage.removeItem('UserData');
    localStorage.removeItem("UserData");
    this.user = null;
    this.publicUser = null;
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

  public async isUserLoggedIn() {
    try {
      var token = this.appService.getJwtToken();
      if (token != undefined && token != null) {
        var user_data = await this.appService.isTokenValid();
        if(user_data.User_Type == 1)
        {
          this.appService.saveUserData(user_data);
          this.user = new User(this.appService);
          this.user.userInfo = user_data;
          return true;
        }
      }
    } catch (error) {
      return false;
    }
    return false;
  }
  public async safedevicecode(data: { Code: string, DeviceId: string }) {
    return await this.appService.safedevicecode(data);
  }
  public async isMeetingValid(meetingId:string,meetingPassword:string) {
    return <MeetingModel> await this.appService.isMeetingValid({"MeetingId": meetingId, "Password": meetingPassword});
  }
  public async meetingInviteCodeControl(code:string)
  {
    return <MeetingModel> await this.appService.inviteCodeControl(code);
 
  }

  public async login(data: { userkey: string, password: string, deviceId: string }) {
    var user_data = await this.appService.login(data);
    this.appService.saveUserData(user_data);
    this.user = new User(this.appService);
    this.user.userInfo = user_data;
    this.appService.saveUserData(this.user.userInfo);
    return this.user;
  }
  public async Googlelogin(data: { GoogleToken: string, deviceId: string }) {
    var user_data = await this.appService.Googlelogin(data);
    this.appService.saveUserData(user_data);
    this.user = new User(this.appService);
    this.user.userInfo = user_data;
    this.appService.saveUserData(this.user.userInfo);
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

  public async getCountries() {
    try {
      var countries = await this.appService.getCountries();
      return <CountryCode[]>countries.value;
    } catch (error:any) {
      throw new ConusmaException("getCountries","Country list cannot be received.", error);
    }
  }

}

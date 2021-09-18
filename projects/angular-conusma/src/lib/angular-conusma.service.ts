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
import { ConsoleReporter } from 'jasmine';

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
    this.appService = new AppService({ apiUrl: this.apiUrl, deviceId: this.deviceId, version: "1.0.0" });
  }

  public async load() {
    try {
      if (this.user == null && this.publicUser == null) {
        if (await this.isTokenValid()) {
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
    } catch (error:any) {
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

  public getJwtToken() {
    let rememberme = localStorage.getItem("rememberme");
    if (rememberme) {
      return localStorage.getItem("JWT_TOKEN");
    } else {
      return sessionStorage.getItem("JWT_TOKEN");
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
  // define logged in user
  public loggedinUser: any = { firstName: 'Unknown', lastName: 'User', accessToken: '', location: '', photo: '', city: '', country: '' };

  private httpPost(service: string, data: any): Observable<any> {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.post<any>(this.apiUrl + "/" + service, data, { headers: headers }).pipe(map((res: any) => {
      return res;
    }));
  }
  private httpDelete(service: string) {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.delete(this.apiUrl + "/" + service, { headers: headers });
  }
  public async login(data: { userkey: string, password: string, deviceId: string })
  {
    
    this.httpPost("Login/UserLogin", data).pipe(
      tap((result: any) => { console.log('login result', result);
        if (result.result == "ok") {
          // TODO: normal işlemler
        } else {
          throw new Error(result.value);
        }
      }),
      catchError(this.handleError<any>('user login')));

    console.log("user data "+user_data);
    sessionStorage.setItem("UserData", JSON.stringify(user_data));
    localStorage.setItem('JWT_TOKEN', user_data.Token);
    this.user = new User(this.appService);
    await this.user.load();
    return this.user;
  }
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  public safedevicecode(data: { Code: string, DeviceId: string }): Observable<string> {
    return this.httpPost("Login/SafeDeviceCodeCheck", data);
  }
  public async Googlelogin(data: { GoogleToken: string, deviceId: string }) {
     await this.httpPost("Login/GoogleUserLogin", data).subscribe(async(result:HttpResponse<any>) => {
      sessionStorage.setItem("UserData", JSON.stringify(result.body));
      localStorage.setItem('JWT_TOKEN', result.body.Token);
      this.user = new User(this.appService);
      await this.user.load();
    },err => {
      console.log("err");
      if(err.error.type == "email")
      {
        throw new ConusmaException(err.error.type,err.error.email);
      }
      throw new ConusmaException(err.error.type," login falied");
    });
  }

  public isTokenValid(): Promise<boolean> {

    const promise = new Promise<boolean>((resolve, reject) => {
      this.httpPost("Login/tokenisvalid", {})
        .toPromise<boolean>()
        .then((result: any) => {
          // Success
          if (result) {
            sessionStorage.setItem("UserData", JSON.stringify(result));
            resolve(true);
            localStorage.setItem('JWT_TOKEN', result.Token);
          } else {
            resolve(false);
          }
        },
          err => {
            // Error
            reject(err);
          }
        );
    });
    return promise;
  }

  public signup(data: any): Observable<string> {
    return this.httpPost("User/AddUser", data);
  }

  public signupConfirm(data: any): Observable<string> {
    return this.httpPost("User/EMailVerificationCode", data);
  }

  public forgotPassword(data: any): Observable<any> {
    return this.httpPost("User/ForgotPassword", data);
  }

  public controlForgotPasswordCode(data: any): Observable<any> {
    return this.httpPost("User/ControlForgotPasswordCode", data);
  }

  public changePassword(data: any): Observable<any> {
    return this.httpPost("User/ChangePassword", data);
  }

  public async createPublicUser() {
    var user_data = await this.httpPost("Login/PublicUserCreate", {}).toPromise();
    sessionStorage.setItem("UserData", JSON.stringify(user_data));
    localStorage.setItem('JWT_TOKEN', user_data.Token);
    this.publicUser = new GuestUser(this.appService);
    await this.publicUser.load();
    return this.publicUser;
  }

  public getConferences(): Observable<any> {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.get<any>(this.apiUrl + "/" + "Meeting/GetMeetings", { headers: headers }).pipe(map((res: any) => {
      if (res.status == 401) {
        this.router.navigateByUrl("/login");
      }
      else if (res.status < 200 || res.status >= 300) {
        this.presentAlert(res.message);
      } else if (res.success == false) {
        this.presentAlert(res.message);
      }
      else {
        return res;
      }
    }));
  }
  public addMeeting(): Observable<any> {
    return this.httpPost("Meeting/CreateNewMeeting", {});
  }
  public createSchedule(data: any): Observable<any> {
    return this.httpPost("Meeting/CreateSchedule", data);
  }
  public updateSchedule(data: any): Observable<any> {
    return this.httpPost("Meeting/UpdateSchedule", data);
  }
  public getSchedules(): Observable<any> {
    return this.httpPost("Meeting/GetSchedules", {});
  }
  public getSchedule(id: number): Observable<any> {
    return this.httpPost("Meeting/GetSchedule", { Id: id });
  }
  public addFile(fileName: string, MeetingId: string, fileBase64: string): Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
      this.httpPost("File/Add", { FileName: fileName, MeetingId: MeetingId, FileDataBase64: fileBase64 })
        .toPromise<any>()
        .then((result: any) => {
          // Success
          resolve(result);
        },
          err => {
            // Error
            reject(err);
          }
        );
    });
    return promise;
  }

  public getFile(file: string) {
    return this.http.get<any>(this.apiUrl + "/" + "File/Get/" + file);
  }

  public addLogs(logs: any[]): Observable<boolean> {
    return this.httpPost("ClientLog/AddLogList", logs).pipe(map((result: any) => {
      if (result.result == "ok")
        return true;
      else
        return false;
    }));
  }

  public getLastConference(): Observable<any> {
    return this.httpPost("Conference/GetLastConference", {});
  }

  public getRoomUsers(data: any): Observable<any> {
    return this.httpPost("Conference/GetRoomUsers", data);
  }


  public getCountries(): Observable<any> {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.get<any>(this.apiUrl + "/" + "Tool/getcountrycode", { headers: headers }).pipe(map((res: any) => {
      if (res.status == 401) {
        this.router.navigateByUrl("/login");
      }
      else if (res.status < 200 || res.status >= 300) {
        this.presentAlert(res.message);
      } else if (res.success == false) {
        this.presentAlert(res.message);
      }
      else {
        return res;
      }
    }));
  }

  public getProfile(): Observable<any> {
    return this.httpPost("User/GetUserProfile", {});
  }

  public updateProfile(data: any): Observable<any> {
    return this.httpPost("User/UpdateUserProfile", data);
  }

  public updateMeeting(data: any): Observable<any> {
    return this.httpPost("Meeting/UpdateMeeting", data);
  }
  public invite(data: any): Observable<any> {
    return this.httpPost("Meeting/inviteMeeting", data);
  }

  public conferenceIsValid(data: any): Observable<any> {
    return this.httpPost("Meeting/MeetingisValid", data);
  }
  public JoinMeeting(data: any): Observable<any> {
    return this.httpPost("Meeting/JoinMeeting", data);
  }

  public inviteCodeControl(code: string): Observable<any> {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.get<any>(this.apiUrl + "/" + "Meeting/invitecodecontrol/" + code, { headers: headers }).pipe(map((res: any) => {
      if (res.status == 401) {
        this.router.navigateByUrl("/login");
      }
      else if (res.status < 200 || res.status >= 300) {
        this.presentAlert(res.message);
      } else if (res.success == false) {
        this.presentAlert(res.message);
      }
      else {
        return res;
      }
    }));
  }

  public sendEMailVerification(): Observable<any> {
    return this.httpPost("User/SendEMailVerification", {});
  }
 
  public getEmojis(): Observable<any> {
    return this.http.get<any>("assets/icon/emoji.json").pipe(map((res: any) => { return res; }));
  }
  public getTimezones(): Observable<any> {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.get<any>(this.apiUrl + "/Tool/GetTimeZone/", { headers: headers }).pipe(map((res: any) => { return res; }));
  }
  /**
 * //start live meeting request
 */
  public IsMeetingOwner(MeetingUserId: string): Observable<any> {
    return this.httpPost("Live/IsMeetingOwner/" + MeetingUserId, null);
  }
  public GetMediaServer(MeetingUserId: string): Observable<any> {
    return this.httpPost("Live/GetMediaServer/" + MeetingUserId, null);
  }
  public IsItApproved(MeetingUserId: string): Observable<boolean> {
    return this.httpPost("Live/IsItApproved/" + MeetingUserId, null);
  }
  public ConnectMeeting(data: any): Observable<any> {
    return this.httpPost("Live/Connect", data);
  }
  public UpdateMeetingUser(data: any): Observable<any> {
    return this.httpPost("Live/UpdateMeetingUser", data);
  }
  public GetMeetingUserList(data: any): Observable<any> {
    return this.httpPost("Live/GetMeetingUserList", data);
  }
  public GetLiveMeetingInfo(data: any): Observable<any> {
    return this.httpPost("Live/GetMeetingInfo", data);
  }
  public GetMyMeetingUser(data: any): Observable<any> {
    return this.httpPost("Live/GetMyMeetingUser", data);
  }
  public LiveUpdateMeetingFeatures(meetingUserId: string, data: any): Observable<any> {
    return this.httpPost("Live/UpdateMeetingFeatures/" + meetingUserId, data);
  }
  public MakeHost(data: any): Observable<boolean> {
    return this.httpPost("Live/MakeHost", data);
  }
  public Reactions(data: any): Observable<boolean> {
    return this.httpPost("Live/Reactions", data);
  }
  public RaiseYourHand(data: any): Observable<boolean> {
    return this.httpPost("Live/RaiseYourHand", data);
  }
  public RaiseYourHandDown(data: any): Observable<boolean> {
    return this.httpPost("Live/RaiseYourHandDown", data);
  }
  public MuteMeetingUser(data: any): Observable<boolean> {
    return this.httpPost("Live/MuteMeetingUser", data);
  }
  public UserApproved(data: any): Observable<boolean> {
    return this.httpPost("Live/UserApprove", data);
  }
  public LiveClose(data: any): Observable<boolean> {
    return this.httpPost("Live/Close", data);
  }
  public LiveMeetingAllClose(data: any): Observable<boolean> {
    return this.httpPost("Live/MeetingCloseAllUser", data);
  }
  public RemoveUser(data: any): Observable<boolean> {
    return this.httpPost("Live/RemoveUser", data);
  }
  public SendChatMessage(data: any): Observable<boolean> {
    return this.httpPost("Live/SendChatMessage", data);
  }
  public GetApprovedUserList(data: any): Observable<any> {
    return this.httpPost("Live/GetApprovedUserList", data);
  }
  public GetChatMessages(data: any): Observable<any> {
    return this.httpPost("Live/GetChatMessages", data);
  }
  public GetOldChatMessages(data: any): Observable<any> {
    return this.httpPost("Live/GetOldChatMessages", data);
  }
}

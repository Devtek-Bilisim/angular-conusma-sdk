import { Injectable } from '@angular/core';
import { User } from './user';
import { ConusmaException } from './Exceptions/conusma-exception';
import { GuestUser } from './guest-user';
import { Observable } from 'rxjs';
import { ConusmaRestApiException } from './Exceptions/conusma-restapi-exception';
import { AppService } from './app.service';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { map, mapTo, catchError, throwIfEmpty } from "rxjs/operators";
import { Router } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
import { CacheBuster, Cacheable } from 'ts-cacheable';
const cacheBuster$ = new Subject<void>();
@Injectable({
  providedIn: 'root'
})
export class AngularConusmaService {
  public meeting:any;
  private appId:string = "";
  private apiUrl:string = "";
  private deviceId:string = "";
  private appService:AppService;
  constructor(private http: HttpClient, private router:Router, private alertController:AlertController, private platform:Platform) {
    this.appService = new AppService();
  }
  public setParameters(appId:string, parameters: { apiUrl:string, deviceId:string } ) {
    this.deviceId = parameters.deviceId;
    this.appId = appId;
    this.apiUrl = parameters.apiUrl;
    this.appService.setParameters(this.appId, { apiUrl:this.apiUrl, deviceId:this.deviceId, version: "1.0.0" });
  }

  public async loadUser() {
    try {
      var user: User = new User(this.appService);
      await user.load();
      return user;
    } catch (error) {
      throw new ConusmaException("loadUser","User cannot be loaded.", error);
    }
  }

  public async loadGuestUser() {
    try {
      var user: GuestUser = new GuestUser(this.appService);
      await user.load();
      return user;
    } catch (error) {
      throw new ConusmaException("loadGuestUser","Guest User cannot be loaded.", error);
    }
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

  public storeTokens(jwtToken:string, username:string, isloggedin:string, rememberme:string) {
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
   if(userData != null)
   {
     var user = JSON.parse(userData);
     if(user.UserType == "User")
     {
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
   
  async presentAlert(message: string, header: string = "Error", url: string = "", callback = () => {}) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [{
        text: 'OK',
        handler: (data:any) => {
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
  
  async presentConfirm(message: string, header: string = "Confirm", url: string = "", callback = () => {}) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [{
        text: 'OK',
        handler: (data:any) => {
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
  public loggedinUser: any = { firstName: 'Unknown', lastName: 'User', accessToken: '', location:'', photo:'', city:'', country:''};

  private httpPost(service:string, data:any):Observable<any> {
    var headers = new HttpHeaders({"Content-Type":"application/json; charset=utf-8"});
    return this.http.post<any>(this.apiUrl+"/"+service, data, { headers:headers}).pipe(map((res:any) => {
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
  private httpDelete(service:string)
  {
    var headers = new HttpHeaders({"Content-Type":"application/json; charset=utf-8"});
    return this.http.delete(this.apiUrl+"/"+service,{ headers:headers});
  }

  
  public login(data:{userkey:string, password:string,deviceId:string}):Observable<string> {
    return this.httpPost("Login/UserLogin", data);
  }
  public safedevicecode(data:{Code:string, DeviceId:string}):Observable<string> {
    return this.httpPost("Login/SafeDeviceCodeCheck", data);
  }
  public Googlelogin(data:{GoogleToken:string,deviceId:string}):Observable<string> {
    return this.httpPost("Login/GoogleUserLogin", data);
  }

  public isTokenValid():Promise<boolean>{
   
    const promise = new Promise<boolean>((resolve, reject) => {
      this.httpPost("Login/tokenisvalid", {})
        .toPromise<boolean>()
        .then((result: any) => {
          // Success
          if (result) {
            sessionStorage.setItem("UserData",JSON.stringify(result));
            resolve(true);
            localStorage.setItem('JWT_TOKEN',result.Token);
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

  public signup(data:any):Observable<string> {
    return this.httpPost("User/AddUser", data);
  }

  public signupConfirm(data:any):Observable<string> {
    return this.httpPost("User/EMailVerificationCode", data);
  }

  public forgotPassword(data:any):Observable<any> {
    return this.httpPost("User/ForgotPassword", data);
  }

  public controlForgotPasswordCode(data:any):Observable<any> {
    return this.httpPost("User/ControlForgotPasswordCode", data);
  }

  public changePassword(data:any):Observable<any> {
    return this.httpPost("User/ChangePassword", data);
  }

  public createPublicUser():Observable<any> {
    return this.httpPost("Login/PublicUserCreate", {});
  }
  
  public getConferences():Observable<any> {
    var headers = new HttpHeaders({"Content-Type":"application/json; charset=utf-8"});
    return this.http.get<any>(this.apiUrl+"/"+"Meeting/GetMeetings",  { headers:headers}).pipe(map((res:any) => {
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
  public addMeeting():Observable<any> {
    return this.httpPost("Meeting/CreateNewMeeting", {});
  }
  public createSchedule(data:any):Observable<any> {
    return this.httpPost("Meeting/CreateSchedule", data);
  }
  public updateSchedule(data:any):Observable<any> {
    return this.httpPost("Meeting/UpdateSchedule", data);
  }
  public getSchedules():Observable<any> {
    return this.httpPost("Meeting/GetSchedules", {});
  }
  public getSchedule(id:number):Observable<any> {
    return this.httpPost("Meeting/GetSchedule", {Id:id});
  }
  public addFile(fileName:string, MeetingId:string, fileBase64:string):Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
      this.httpPost("File/Add", {FileName: fileName, MeetingId: MeetingId, FileDataBase64: fileBase64})
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

  public getFile(file:string) {
    return this.http.get<any>(this.apiUrl+"/"+"File/Get/"+file);
  }

  public addLogs(logs:any[]):Observable<boolean> {
    return this.httpPost("ClientLog/AddLogList", logs).pipe(map((result:any) => {
      if (result.result == "ok")
        return true;
      else
        return false;      
    }));
  }

  public getLastConference():Observable<any> {
    return this.httpPost("Conference/GetLastConference", {});
  }

  public getRoomUsers(data:any):Observable<any> {
    return this.httpPost("Conference/GetRoomUsers", data);
  }

  
  public getCountries():Observable<any> {
    var headers = new HttpHeaders({"Content-Type":"application/json; charset=utf-8"});
    return this.http.get<any>(this.apiUrl+"/"+"Tool/getcountrycode",  { headers:headers}).pipe(map((res:any) => {
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

  public getProfile():Observable<any> {
    return this.httpPost("User/GetUserProfile", {});
  }

  public updateProfile(data:any):Observable<any> {
    return this.httpPost("User/UpdateUserProfile", data);
  }
 
  public updateMeeting(data:any):Observable<any> {
    return this.httpPost("Meeting/UpdateMeeting", data);
  }
  public invite(data:any):Observable<any> {
    return this.httpPost("Meeting/inviteMeeting", data);
  }

  public conferenceIsValid(data:any):Observable<any> {
    return this.httpPost("Meeting/MeetingisValid", data);
  }
  public JoinMeeting(data:any):Observable<any> {
    return this.httpPost("Meeting/JoinMeeting", data);
  }

  public inviteCodeControl(code:string):Observable<any> {
    var headers = new HttpHeaders({"Content-Type":"application/json; charset=utf-8"});
    return this.http.get<any>(this.apiUrl+"/"+"Meeting/invitecodecontrol/" + code, { headers:headers}).pipe(map((res:any) => {
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

  public sendEMailVerification():Observable<any> {
    return this.httpPost("User/SendEMailVerification", {});
  }
  @Cacheable({
    cacheBusterObserver: cacheBuster$
  })
  public getEmojis():Observable<any> {
    return this.http.get<any>("assets/icon/emoji.json").pipe(map((res:any) => {return res;}));
  }
  public getTimezones():Observable<any> {
    var headers = new HttpHeaders({"Content-Type":"application/json; charset=utf-8"});
    return this.http.get<any>(this.apiUrl+"/Tool/GetTimeZone/", { headers:headers}).pipe(map((res:any) => {return res;}));
  }
    /**
   * //start live meeting request
   */
       public IsMeetingOwner(MeetingUserId:string):Observable<any>
        {
        return this.httpPost("Live/IsMeetingOwner/"+MeetingUserId, null);
       }
        public GetMediaServer(MeetingUserId:string):Observable<any>
        {
        return this.httpPost("Live/GetMediaServer/"+MeetingUserId, null);
       }
        public IsItApproved(MeetingUserId:string):Observable<boolean>
        {
        return this.httpPost("Live/IsItApproved/"+MeetingUserId, null);
       }
        public ConnectMeeting(data:any):Observable<any>
         {
         return this.httpPost("Live/Connect", data);
        }
        public UpdateMeetingUser(data:any):Observable<any>
         {
         return this.httpPost("Live/UpdateMeetingUser", data);
        }
        public GetMeetingUserList(data:any):Observable<any>
         {
         return this.httpPost("Live/GetMeetingUserList", data);
        }
        public GetLiveMeetingInfo(data:any):Observable<any>
        {
        return this.httpPost("Live/GetMeetingInfo", data);
       }
       public GetMyMeetingUser(data:any):Observable<any>
       {
       return this.httpPost("Live/GetMyMeetingUser", data);
      }
       public LiveUpdateMeetingFeatures(meetingUserId:string,data:any):Observable<any>
        {
        return this.httpPost("Live/UpdateMeetingFeatures/"+meetingUserId, data);
       }
       public MakeHost(data:any):Observable<boolean>
       {
       return this.httpPost("Live/MakeHost", data);
      }
      public Reactions(data:any):Observable<boolean>
       {
       return this.httpPost("Live/Reactions", data);
      }
      public RaiseYourHand(data:any):Observable<boolean>
       {
       return this.httpPost("Live/RaiseYourHand", data);
      }
      public RaiseYourHandDown(data:any):Observable<boolean>
       {
       return this.httpPost("Live/RaiseYourHandDown", data);
      }
      public MuteMeetingUser(data:any):Observable<boolean>
      {
      return this.httpPost("Live/MuteMeetingUser", data);
     }
     public UserApproved(data:any):Observable<boolean>
     {
     return this.httpPost("Live/UserApprove", data);
    }
    public LiveClose(data:any):Observable<boolean>
     {
     return this.httpPost("Live/Close", data);
    }
    public LiveMeetingAllClose(data:any):Observable<boolean>
    {
    return this.httpPost("Live/MeetingCloseAllUser", data);
   }
   public RemoveUser(data:any):Observable<boolean>
   {
   return this.httpPost("Live/RemoveUser", data);
  }
  public SendChatMessage(data:any):Observable<boolean>
   {
   return this.httpPost("Live/SendChatMessage", data);
  }
    public GetApprovedUserList(data:any):Observable<any>
    {
    return this.httpPost("Live/GetApprovedUserList", data);
   }
   public GetChatMessages(data:any):Observable<any>
   {
   return this.httpPost("Live/GetChatMessages", data);
  }
  public GetOldChatMessages(data:any):Observable<any>
   {
   return this.httpPost("Live/GetOldChatMessages", data);
  }
}

import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { ConusmaException } from "../public-api";
import { ConusmaRestApiException } from "./Exceptions/conusma-restapi-exception";
import { SuccessApiMesage } from "./Models/success-api-message";

export class AppService {
  private appId: string = "";
  public apiUrl: string = "";
  private deviceId: string = "";
  private version: string = "1.0.0";
  constructor( private http: HttpClient,parameters: { apiUrl: string, deviceId: string, version: string }) {
    this.apiUrl = parameters.apiUrl;
    this.deviceId = parameters.deviceId;
    this.version = parameters.version;
  }
  public getJwtToken() {
    let rememberme = <boolean>JSON.parse(localStorage.getItem("rememberme"));
    if (rememberme) {
      return localStorage.getItem("JWT_TOKEN");
    } else {
      return sessionStorage.getItem("JWT_TOKEN");
    }
  }
  public saveUserData(userData:any,ispublic =false) {
    if(ispublic)
    {
      localStorage.setItem("rememberme","false");
    }
    let rememberme = <boolean>JSON.parse(localStorage.getItem("rememberme"));
    if (rememberme) {
       localStorage.setItem("JWT_TOKEN",userData.Token);
       localStorage.setItem("UserData",JSON.stringify(userData));
    } else {
       sessionStorage.setItem("JWT_TOKEN",userData.Token);
       sessionStorage.setItem("UserData",JSON.stringify(userData));
    }
  }
  public httpPost(service: string, data: any): Observable<any> {
    var token = this.getJwtToken();
    if(token != null && token != undefined)
    {
      var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8","Authorization": "Bearer " + token });
      return this.http.post<any>(this.apiUrl + "/" + service, data, { headers: headers });
    }
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.post<any>(this.apiUrl + "/" + service, data, { headers: headers });
  }
  public httpDelete(service: string) {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return this.http.delete(this.apiUrl + "/" + service, { headers: headers });
  }
  public async getMeetings() {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8", 'Authorization': 'Bearer ' + this.getJwtToken() });
    return  await this.http.get<any>(this.apiUrl + "/Meeting/GetMeetings", { headers: headers }).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async IsMeetingOwner(MeetingUserId: string) {
    return await this.httpPost("Live/IsMeetingOwner/" + MeetingUserId, null).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async isMeetingValid(data:any) {
    return await this.httpPost("Meeting/MeetingIsValid" , data).toPromise().then((res)=>{
      return res;
    },err=>{
      console.log(err);
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetMediaServer(MeetingUserId: string) {
    return await this.httpPost("Live/GetMediaServer/" + MeetingUserId, null).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async IsItApproved(MeetingUserId: string) {
    return await this.httpPost("Live/IsItApproved/" + MeetingUserId, null).toPromise().then((res)=>{
      console.log("Response"+res);
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async ConnectMeeting(data: any) {
    return this.httpPost("Live/Connect", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async UpdateMeetingUser(data: any) {
    return await this.httpPost("Live/UpdateMeetingUser", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetMeetingUserList(data: any) {
    return await this.httpPost("Live/GetMeetingUserList", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetLiveMeetingInfo(data: any) {
    return await this.httpPost("Live/GetMeetingInfo", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetMyMeetingUser(data: any) {
    return await this.httpPost("Live/GetMyMeetingUser", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async LiveUpdateMeetingFeatures(meetingUserId: string, data: any) {
    return await this.httpPost("Live/UpdateMeetingFeatures/" + meetingUserId, data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async MakeHost(data: any) {
    return await this.httpPost("Live/MakeHost", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async Reactions(data: any) {
    return await this.httpPost("Live/Reactions", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async RaiseYourHand(data: any) {
    return await this.httpPost("Live/RaiseYourHand", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async RaiseYourHandDown(data: any) {
    return await this.httpPost("Live/RaiseYourHandDown", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async MuteMeetingUser(data: any) {
    return await this.httpPost("Live/MuteMeetingUser", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async UserApproved(data: any) {
    return await this.httpPost("Live/UserApprove", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async LiveClose(data: any) {
    return await this.httpPost("Live/Close", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async LiveMeetingAllClose(data: any) {
    return await this.httpPost("Live/MeetingCloseAllUser", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async RemoveUser(data: any) {
    return await this.httpPost("Live/RemoveUser", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async SendChatMessage(data: any) {
    return await this.httpPost("Live/SendChatMessage", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetApprovedUserList(data: any) {
    return await this.httpPost("Live/GetApprovedUserList", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetChatMessages(data: any) {
    return await this.httpPost("Live/GetChatMessages", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async GetOldChatMessages(data: any) {
    return await this.httpPost("Live/GetOldChatMessages", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async sendEMailVerification() {
    return await this.httpPost("User/SendEMailVerification", {}).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async getEmojis() {
    return await this.http.get<any>("assets/icon/emoji.json").toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public  async getTimezones(){
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return  await this.http.get<any>(this.apiUrl + "/Tool/GetTimeZone/", { headers: headers }).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async getProfile() {
    return await this.httpPost("User/GetUserProfile", {}).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async updateProfile(data: any) {
    return await this.httpPost("User/UpdateUserProfile", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async updateMeeting(data: any) {
    return await this.httpPost("Meeting/UpdateMeeting", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async invite(data: any) {
    return await this.httpPost("Meeting/inviteMeeting", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async meetingIsValid(data: any) {
    return await this.httpPost("Meeting/MeetingisValid", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async getMediaServerById(meetingUserId: string, mediaServerId: number) {
    return await this.httpPost("Live/GetMediaServer/" + meetingUserId + "/" + mediaServerId, null).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async JoinMeeting(data: any) {
    return await this.httpPost("Meeting/JoinMeeting", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async createMeeting() {
    return await this.httpPost("Meeting/CreateNewMeeting", {}).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async createSchedule(data: any) {
    return await this.httpPost("Meeting/CreateSchedule", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async updateSchedule(data: any) {
    return await this.httpPost("Meeting/UpdateSchedule", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async getSchedules()  {
    return await this.httpPost("Meeting/GetSchedules", {}).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async getSchedule(id: number) {
    return await this.httpPost("Meeting/GetSchedule", { Id: id }).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });;
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

  public async getFile(file: string) {
    return await this.http.get<any>(this.apiUrl + "/" + "File/Get/" + file).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });;
  }

  public  async addLogs(logs: any[]) {
    return await this.httpPost("ClientLog/AddLogList", logs).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async getLastMeeting() {
    return await this.httpPost("Meeting/GetLastConference", {}).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });;
  }

  public async getRoomUsers(data: any) {
    return await this.httpPost("Meeting/GetRoomUsers", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async safedevicecode(data: { Code: string, DeviceId: string }) {
    return await this.httpPost("Login/SafeDeviceCodeCheck", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async createPublicUser() {
   return await this.httpPost("Login/PublicUserCreate", {}).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async getCountries() {
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return await this.http.get<any>(this.apiUrl + "/" + "Tool/getcountrycode", { headers: headers }).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async Googlelogin(data: { GoogleToken: string, deviceId: string }) {
     return await this.httpPost("Login/GoogleUserLogin", data).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
  public async login(data: { userkey: string, password: string, deviceId: string })
  {
    return await this.httpPost("Login/UserLogin", data).toPromise().then(result => {
      return result;
    },(err:HttpErrorResponse) => {
      if(err.status == 403)
      {
        if(err.error.type =="email")
        {
          throw new ConusmaException(err.error.type,err.error.email);
        }
        if(err.error.type =="safe device")
        {
          throw new ConusmaException(err.error.type,err.error.email);
        }
        throw new ConusmaException(err.error.type,"device not safe");
      }
      else
      {
        throw new ConusmaException("login error","user login undefined error");
      }
    });
  }
  public async inviteCodeControl(code: string){
    var headers = new HttpHeaders({ "Content-Type": "application/json; charset=utf-8" });
    return await this.http.get<any>(this.apiUrl + "/" + "Meeting/invitecodecontrol/" + code, { headers: headers }).toPromise().then((res)=>{
      return res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async isTokenValid() 
   {
     return await this.httpPost("Login/tokenisvalid", {}).toPromise().then((res)=>{
        return res;
      },err=>{
        throw new ConusmaException(err.error.type,err.err.value);
      });
  }

  public async signup(data: any){
    return await this.httpPost("User/AddUser", data).toPromise().then((res)=>{
      return <SuccessApiMesage>res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async signupConfirm(data: any) {
    return await this.httpPost("User/EMailVerificationCode", data).toPromise().then((res)=>{
      return <SuccessApiMesage> res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async forgotPassword(email: string){
    var data = {
      'EMail':email
    };
    return await this.httpPost("User/ForgotPassword", data).toPromise().then((res)=>{
      return <SuccessApiMesage>res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async controlForgotPasswordCode(code:string,password:string){
    var data = {
      'Password':password,
      'Code':code
    };
    return await this.httpPost("User/ControlForgotPasswordCode", data).toPromise().then((res)=>{
      return <SuccessApiMesage>res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }

  public async changePassword(data: any) {
    return await this.httpPost("User/ChangePassword", data).toPromise().then((res)=>{
      return <SuccessApiMesage>res;
    },err=>{
      throw new ConusmaException(err.error.type,err.err.value);
    });
  }
}
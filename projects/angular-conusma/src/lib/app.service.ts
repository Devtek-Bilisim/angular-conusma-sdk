import { ConusmaRestApiException } from "./Exceptions/conusma-restapi-exception";

export class AppService {
  private appId: string;
  private apiUrl: string;
  private token: string;
  private deviceId: string;
  private version: string = "1.0.0";
  constructor(appId: string, parameters: { apiUrl: string, deviceId: string, version: string }) {
    this.appId = appId;
    this.apiUrl = parameters.apiUrl;
    this.token = "";
    this.deviceId = parameters.deviceId;
    this.version = parameters.version;

  }
  public setJwtToken(token: string) {
    this.token = token;
  }

  public getJwtToken(): string {
    return this.token;
  }
  public async createUserWithDeviceId() {
    var response = await fetch(this.apiUrl + "/User/AddUserWithAppCode", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        appCode: this.appId,
        deviceCode: this.deviceId,
      })
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }
  public async getMediaServer(meetingUserId: string) {
    var response = await fetch(this.apiUrl + "/Live/GetMediaServer/" + meetingUserId, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      }
    });
    return await response.json();
  }

  public async isApproved(meetingUserId: string) {
    var response = await fetch(this.apiUrl + "/Live/IsItApproved/" + meetingUserId, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      }
    });
    return await response.json();
  }

  public async getMeetings() {
    var response = await fetch(this.apiUrl + "/Meeting/GetMeetings", {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      }
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async joinMeetingById(meetingId: number) {
    var response = await fetch(this.apiUrl + "/Meeting/JoinMeeting", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      },
      body: JSON.stringify({
        meetingId: meetingId,
      })
    });
    return await response.json();
  }

  public async login(userKey: string, password: string, deviceId: string) {
    var response = await fetch(this.apiUrl + "/Login/UserLogin", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        userKey: userKey,
        password: password,
        deviceId: deviceId
      })
    });
    return await response.json();
  }

  public async checkSafeDeviceCode(code: string, deviceId: string) {
    var response = await fetch(this.apiUrl + "/Login/SafeDeviceCodeCheck", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        deviceId: deviceId
      })
    });
    return await response.json();
  }

  public async googleLogin(googleToken: string, deviceId: string) {
    var response = await fetch(this.apiUrl + "/Login/GoogleUserLogin", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        googleToken: googleToken,
        deviceId: deviceId
      })
    });
    return await response.json();
  }

  public async isTokenValid() {
    var response = await fetch(this.apiUrl + "/Login/TokenIsValid", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      }
    });
    return await response.json();
  }

  public async signup(data: any) {
    var response = await fetch(this.apiUrl + "/User/AddUser", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async signupConfirm(data: any) {
    var response = await fetch(this.apiUrl + "/User/EMailVerificationCode", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async forgotPassword(data: any) {
    var response = await fetch(this.apiUrl + "/User/ForgotPassword", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async controlForgotPasswordCode(data: any) {
    var response = await fetch(this.apiUrl + "/User/ControlForgotPasswordCode", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async changePassword(data: any) {
    var response = await fetch(this.apiUrl + "/User/ChangePassword", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async createPublicUser(Token:string="") {
    if(Token == "")
    {
      var response = await fetch(this.apiUrl + "/Login/PublicUserCreate", {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new ConusmaRestApiException(response.status, await response.text());
      }
    }
    else
    {
      var response = await fetch(this.apiUrl + "/Login/PublicUserCreate", {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          Token: Token
        }
      });
      if (!response.ok) {
        throw new ConusmaRestApiException(response.status, await response.text());
      }
    }
    
    return await response.json();
  }

  public async createMeeting() {
    var response = await fetch(this.apiUrl + "/Meeting/CreateNewMeeting", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async createSchedule(data: any) {
    var response = await fetch(this.apiUrl + "/Meeting/CreateSchedule", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async updateSchedule(data: any) {
    var response = await fetch(this.apiUrl + "/Meeting/UpdateSchedule", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async getSchedules(data: any) {
    var response = await fetch(this.apiUrl + "/Meeting/GetSchedules", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async getSchedule(id: string) {
    var response = await fetch(this.apiUrl + "/Meeting/GetSchedule", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify({
        id: id
      })
    });
    return await response.json();
  }

  public async addFile(fileName: string, meetingId: string, fileBase64: string) {
    var response = await fetch(this.apiUrl + "/File/Add", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify({
        fileName: fileName,
        meetingId: meetingId,
        fileDataBase64: fileBase64
      })
    });
    return await response.json();
  }

  public async getFile(file: string) {
    var response = await fetch(this.apiUrl + "/File/Get" + file, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async addLogs(logs: any[]) {
    var response = await fetch(this.apiUrl + "/ClientLog/AddLogList", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify({
        logs: logs
      })
    });
    return await response.json();
  }

  public async addLog(status: string, category: string, message: string, meetingId: string, username: string, hasCam: boolean, hasMic: boolean, isCamActive: boolean, isMicActive: boolean) {
    var log = {
      "uuid": this.deviceId,
      "ClientVer": "1.0.0",
      "Mac": "50:9C:58:3C:0B:DB",
      "Platform": "", // (this.platform.is('ipad')?'ipad, ':'')+(this.platform.is('iphone')?'iphone, ':'')+(this.platform.is('ios')?'ios, ':'')+(this.platform.is('android')?'android, ':'')+(this.platform.is('phablet')?'phablet, ':'')+(this.platform.is('tablet')?'tablet, ':'')+(this.platform.is('cordova')?'cordova, ':'')+(this.platform.is('capacitor')?'capacitor, ':'')+(this.platform.is('electron')?'electron, ':'') + (this.platform.is('pwa')?'pwa, ':'')+(this.platform.is('mobile')?'mobile, ':'')+(this.platform.is('mobileweb')?'mobileweb, ':'')+(this.platform.is('desktop')?'desktop':'')+(this.platform.is('hybrid')?'hybrid':''),
      "DeviceModel": "", // this.device.model,
      "DevicePlatform": "", // this.device.platform,
      "DeviceVersion": "", // this.device.version,
      "DeviceManufacturer": "", // this.device.manufacturer,
      "DeviceIsVirtual": "", //(this.device.isVirtual!=null?this.device.isVirtual:false),
      "UserName": username,
      "MeetingId": meetingId,
      "Resolution": "", //this.platform.width() + "x" + this.platform.height(),
      "Browser": "", //ua.browser.name,
      "BrowserVersion": "", // ua.browser.version,
      "OS": "", // ua.os.name,
      "OSVersion": "", // ua.os.version,
      "HasCam": hasCam,
      "HasMic": hasMic,
      "IsCamActive": isCamActive,
      "IsMicActive": isMicActive,
      "Status": status,
      "Title": category,
      "Detail": message,
    };
    var response = await fetch(this.apiUrl + "/ClientLog/AddLog", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify({
        log: log
      })
    });
    return await response.json();
  }
  public async getCountries() {
    var response = await fetch(this.apiUrl + "/Tool/GetCountryCode", {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async getProfile() {
    var response = await fetch(this.apiUrl + "/User/GetUserProfile", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async updateProfile(data: any) {
    var response = await fetch(this.apiUrl + "/User/UpdateUserProfile", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async updateMeeting(data: any) {
    var response = await fetch(this.apiUrl + "/Meeting/UpdateMeeting", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async invite(data: any) {
    var response = await fetch(this.apiUrl + "/Meeting/InviteMeeting", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async isMeetingValid(meetingId: string, password: string) {
    var response = await fetch(this.apiUrl + "/Meeting/MeetingIsValid", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify({
        meetingId: meetingId,
        password: password
      })
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async joinMeeting(meetingId: string, password: string, meetingFullName: string) {
    var response = await fetch(this.apiUrl + "/Meeting/JoinMeeting", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify({
        meetingId: meetingId,
        password: password,
        meetingFullName: meetingFullName
      })
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async controlInviteCode(code: string) {
    var response = await fetch(this.apiUrl + "/Meeting/InviteCodeControl/" + code, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async sendEmailVerification() {
    var response = await fetch(this.apiUrl + "/User/SendEmailVerification", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }
  public async getTimezones() {
    var response = await fetch(this.apiUrl + "/Tool/GetTimeZone", {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async isMeetingOwner(meetingUserId: string) {
    var response = await fetch(this.apiUrl + "/Live/IsMeetingOwner/" + meetingUserId, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async getMediaServerById(meetingUserId: string, mediaServerId: number) {
    var response = await fetch(this.apiUrl + "/Live/GetMediaServer/" + meetingUserId + "/" + mediaServerId, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      }
    });
    return await response.json();
  }

  public async connectMeeting(data: any) {
    var response = await fetch(this.apiUrl + "/Live/Connect", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async updateMeetingUser(data: any) {
    var response = await fetch(this.apiUrl + "/Live/UpdateMeetingUser", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async getMeetingUserList(data: any) {
    var response = await fetch(this.apiUrl + "/Live/GetMeetingUserList", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }

  public async getLiveMeetingInfo(data: any) {
    var response = await fetch(this.apiUrl + "/Live/GetMeetingInfo", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async getMyMeetingUser(data: any) {
    var response = await fetch(this.apiUrl + "/Live/GetMyMeetingUser", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async getLiveUpdateMeetingFeatures(meetingUserId: string, data: any) {
    var response = await fetch(this.apiUrl + "/Live/UpdateMeetingFeatures/" + meetingUserId, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async makeHost(data: any) {
    var response = await fetch(this.apiUrl + "/Live/MakeHost", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async reactions(data: any) {
    var response = await fetch(this.apiUrl + "/Live/Reactions", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async raiseYourHand(data: any) {
    var response = await fetch(this.apiUrl + "/Live/RaiseYourHand", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async raiseYourHandDown(data: any) {
    var response = await fetch(this.apiUrl + "/Live/RaiseYourHandDown", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async muteMeetingUser(data: any) {
    var response = await fetch(this.apiUrl + "/Live/MuteMeetingUser", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async approveUser(data: any) {
    var response = await fetch(this.apiUrl + "/Live/UserApprove", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async liveClose(data: any) {
    var response = await fetch(this.apiUrl + "/Live/Close", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async liveMeetingCloseAll(data: any) {
    var response = await fetch(this.apiUrl + "/Live/MeetingCloseAllUser", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async removeUser(data: any) {
    var response = await fetch(this.apiUrl + "/Live/RemoveUser", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async sendChatMessage(data: any) {
    var response = await fetch(this.apiUrl + "/Live/SendChatMessage", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async getApprovedUserList(data: any) {
    var response = await fetch(this.apiUrl + "/Live/GetApprovedUserList", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async getChatMessages(data: any) {
    var response = await fetch(this.apiUrl + "/Live/GetChatMessages", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  public async getOldChatMessages(data: any) {
    var response = await fetch(this.apiUrl + "/Live/GetOldChatMessages", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Token: this.token
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
  public async iAmHere(_meetingUserId: string) {
    var response = await fetch(this.apiUrl + "/Live/IAmHere", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      },
      body: JSON.stringify({meetingUserId:_meetingUserId})
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }
  public async getMeetingEvents(_meetingUserId: string) {
    var response = await fetch(this.apiUrl + "/Live/GetMeetingEvents", {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Token': this.token
      },
      body: JSON.stringify({meetingUserId:_meetingUserId})
    });
    if (!response.ok) {
      throw new ConusmaRestApiException(response.status, await response.text());
    }
    return await response.json();
  }
}
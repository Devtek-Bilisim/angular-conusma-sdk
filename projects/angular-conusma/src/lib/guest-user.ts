import { AppService } from "./app.service";
import { ConusmaException } from "./Exceptions/conusma-exception";
import { GuestUserModel } from "./Models/guest-user-model";
import { MeetingModel } from "./Models/meeting-model";
import { MeetingUserModel } from "./Models/meeting-user-model";
import { Meeting } from "./meeting";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { updateMeetingUser } from "./meeting.actions";

export class GuestUser {
  private appService: AppService;
  constructor(_appService: AppService) {
    this.appService = _appService;
  }
  public userInfo: GuestUserModel = new GuestUserModel();
  public async create() {
    var token = localStorage.getItem('JWT_TOKEN');
    if (token != undefined && token != null) {
      var result = await this.appService.createPublicUser();
      this.userInfo = result;
      localStorage.setItem('JWT_TOKEN', this.userInfo.Token);
      localStorage.setItem('UserData', JSON.stringify(this.userInfo));
    }
    else {
      var result = await this.appService.createPublicUser();
      this.userInfo = result;
      localStorage.setItem('JWT_TOKEN', this.userInfo.Token);
      localStorage.setItem('UserData', JSON.stringify(this.userInfo));

    }

  }
  public async load() {
    var token = localStorage.getItem('JWT_TOKEN');
    if (token != undefined && token != null) {
      var result = await this.appService.createPublicUser();
      this.userInfo = result;
      localStorage.setItem('JWT_TOKEN', this.userInfo.Token);
      localStorage.setItem('UserData', JSON.stringify(this.userInfo));
    }
    else {
      var result = await this.appService.createPublicUser();
      this.userInfo = result;
      localStorage.setItem('JWT_TOKEN', this.userInfo.Token);
      localStorage.setItem('UserData', JSON.stringify(this.userInfo));
    }

  }
  public async joinMeetingByInviteCode(inviteCode: string, meetingName: string = 'Guest') {
    try {
      var resultcode = await this.appService.inviteCodeControl(inviteCode);
      var meeting: MeetingModel = resultcode;
      var result = await this.appService.JoinMeeting({'meetingId':meeting.MeetingId, 'password':meeting.Password, 'meetingFullName':meetingName});
      var meetingUser: MeetingUserModel = result;
      var activeMeeting = new Meeting(meetingUser,meeting, this.appService);
      return activeMeeting;
    } catch (error:any) {
      throw new ConusmaException("joinMeeting", "failed to join the meeting", error);
    }
  }
  public async joinMeeting(meetingId: string, meetingPassword: string, meetingName: string = 'Guest') {
    try {
      var resultcode = await this.appService.isMeetingValid({'meetingId':meetingId,'password':meetingPassword});
      var meeting: MeetingModel = resultcode;
      var result = await this.appService.JoinMeeting({'meetingId':meeting.MeetingId,'password': meeting.Password,'meetingFullName': meetingName});
      var meetingUser: MeetingUserModel = result;
      var activeMeeting = new Meeting(meetingUser,meeting, this.appService);
      return activeMeeting;
    } catch (error:any) {
      throw new ConusmaException("joinMeeting", "failed to join the meeting", error);
    }
  }

}
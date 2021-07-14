import { AppService } from "./app.service";
import { ConusmaException } from "./Exceptions/conusma-exception";
import { GuestUserModel } from "./Models/guest-user-model";
import { MeetingModel } from "./Models/meeting-model";
import { MeetingUserModel } from "./Models/meeting-user-model";
import { Meeting } from "./meeting";

export class GuestUser {
  private appService: AppService;

  constructor(_appService: AppService) {
    this.appService = _appService;
  }
  public userInfo: GuestUserModel = new GuestUserModel();
  public async create() {
    var token = localStorage.getItem('conusmaGuestToken');
    if (token != undefined && token != null) {
      var result = await this.appService.createPublicUser(token);
      this.userInfo = result;
      this.appService.setPublicToken(this.userInfo.Token);
      localStorage.setItem('conusmaGuestToken', this.userInfo.Token);
    }
    else {
      var result = await this.appService.createPublicUser();
      this.userInfo = result;
      this.appService.setPublicToken(this.userInfo.Token);
      localStorage.setItem('conusmaGuestToken', this.userInfo.Token);
    }

  }
  public async joinMeetingByInviteCode(inviteCode: string, meetingName: string = 'Guest') {
    try {
      var resultcode = await this.appService.controlInviteCode(inviteCode);
      var meeting: MeetingModel = resultcode;
      var result = await this.appService.joinMeeting(meeting.MeetingId, meeting.Password, meetingName);
      var meetingUser: MeetingUserModel = result;
      var activeMeeting = new Meeting(meetingUser, this.appService);
      return activeMeeting;
    } catch (error) {
      throw new ConusmaException("joinMeeting", "failed to join the meeting", error);
    }
  }
  public async joinMeeting(meetingId: string, meetingPassword: string, meetingName: string = 'Guest') {
    try {
      var resultcode = await this.appService.isMeetingValid(meetingId, meetingPassword);
      var meeting: MeetingModel = resultcode;
      var result = await this.appService.joinMeeting(meeting.MeetingId, meeting.Password, meetingName);
      var meetingUser: MeetingUserModel = result;
      var activeMeeting = new Meeting(meetingUser, this.appService);
      return activeMeeting;
    } catch (error) {
      throw new ConusmaException("joinMeeting", "failed to join the meeting", error);
    }
  }

}
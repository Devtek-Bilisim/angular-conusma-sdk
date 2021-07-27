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
  meetingUser$: Observable<MeetingUserModel>;
  constructor(_appService: AppService, private store: Store<{ meetingUser: MeetingUserModel }>) {
    this.meetingUser$ = store.select('meetingUser');
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
  public async load() {
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
      this.store.dispatch(updateMeetingUser({ meetingUserModel: meetingUser }));
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
      this.store.dispatch(updateMeetingUser({ meetingUserModel: meetingUser }));
      return activeMeeting;
    } catch (error) {
      throw new ConusmaException("joinMeeting", "failed to join the meeting", error);
    }
  }

}
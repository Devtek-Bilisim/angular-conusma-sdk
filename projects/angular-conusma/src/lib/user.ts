import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { AppService } from "./app.service";
import { ConusmaException } from "./Exceptions/conusma-exception";
import { Meeting } from "./meeting";
import { updateMeetingUser } from "./meeting.actions";
import { MeetingModel } from "./Models/meeting-model";
import { MeetingUserModel } from "./Models/meeting-user-model";
import { UserModel } from "./Models/user-model";

export class User {
    meetingUser$: Observable<MeetingUserModel>;
    constructor(_appService:AppService) {
      this.appService = _appService;
    }
    private appService:AppService ;
    public userInfo:UserModel = new UserModel();
    public async load() {
      var result = await this.appService.getProfile();
      this.userInfo = result;
    }
   
    public async createMeeting()
    {
      try {
        var meeting:Meeting = await this.appService.createMeeting();
        return meeting;
      } catch (error:any) {
        throw new ConusmaException("createMeeting","Meeting cannot be created.", error);
      }
       
    }
    public async getMeetings()
    {
        try {
            var meetings:Array<MeetingModel> = await this.appService.getMeetings();
            return meetings;
          } catch (error:any) {
            throw new ConusmaException("getMeetings","Meeting list cannot be received.", error);
          }
    }
    public async getProfileMeeting()
    {
        try {
            var meetings:Array<MeetingModel> = await this.appService.getMeetings();
             var profileMeeting:MeetingModel = <MeetingModel>meetings.find(us => us.ProfileMeeting); 
            return profileMeeting;
          } catch (error:any) {
            throw new ConusmaException("getProfileMeeting", "Profile Meeting cannot be received.", error);
          }
    }
    public async joinMeeting(meeting:MeetingModel,meetingName:string='User')
    {
        try {
            var result = await this.appService.joinMeeting(meeting.MeetingId,meeting.Password,meetingName);
            var meetingUser:MeetingUserModel = result;
            var activeMeeting = new Meeting(meetingUser, this.appService);
            return activeMeeting;
          } catch (error:any) {
            throw new ConusmaException("joinMeeting", "Failed to join the meeting", error);
          }
    }

}
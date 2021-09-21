import { Observable } from "rxjs";
import { AppService } from "./app.service";
import { ConusmaException } from "./Exceptions/conusma-exception";
import { Meeting } from "./meeting";
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
        var meeting:MeetingModel = await this.appService.createMeeting();
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
    public async getSchedules()
    {
        try {
            var upcomingMeetings:Array<any> = await this.appService.getSchedules();
            return upcomingMeetings;
          } catch (error:any) {
            throw new ConusmaException("getSchedules","Upcoming meeting list cannot be received.", error);
          }
    }
    public async getSchedule(id:number)
    {
        try {
            var result = await this.appService.getSchedule(id);
            return result;
          } catch (error:any) {
            throw new ConusmaException("getSchedule","Upcoming meeting cannot be received.", error);
          }
    }
    public async updateSchedule(data:any)
    {
        try {
            var result = await this.appService.updateSchedule(data);
            return result;
          } catch (error:any) {
            throw new ConusmaException("updateSchedule","Can't update schedule.", error);
          }
    }
    public async createSchedule(data:any)
    {
        try {
            var result = await this.appService.createSchedule(data);
            return result;
          } catch (error:any) {
            throw new ConusmaException("createSchedule","Can't create schedule.", error);
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
            var result = await this.appService.JoinMeeting({'meetingId':meeting.MeetingId,'password':meeting.Password,'meetingFullName':meetingName});
            var meetingUser:MeetingUserModel = result;
            var activeMeeting = new Meeting(meetingUser, this.appService);
            return activeMeeting;
          } catch (error:any) {
            throw new ConusmaException("joinMeeting", "Failed to join the meeting", error);
          }
    }

}
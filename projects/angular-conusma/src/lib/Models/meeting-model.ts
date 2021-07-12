
export class MeetingModel {
  
    constructor() {
    }
    public InviteCode:string = "";
    public MeetingId:string = "";
    public Password:string = "";
    public Name:string = "";
    public ChatSave:boolean = false;
    public Chat:boolean = false;
    public ShareScreen:boolean = false;
    public ParticipantApproval:boolean = false;
    public ProfileMeeting:boolean = false;
    public LastConnectedTime:string = "";
    public OwnerId:string = "";
    public AddedDate:string = "";
    public ModifiedDate:string = "";
    public MeetingStatus:number = 0;
    public Id:number = 0;
}
export enum MeetingStatusEnum
{
    active = 1,
    end = 2,
    locked = 3
}

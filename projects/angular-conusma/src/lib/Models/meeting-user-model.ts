export class MeetingUserModel {
    public UserId:string = "";
    public PublicUserId:string = "";
    public MeetingFullName:string = "";
    public MediaServerSocketId:string = "";
    public RaiseHandTime:string = "";
    public Reaction:string = "";
    public ReactionTime:string = "";
    public IAmHereTime:string = "";
   
    public Approved:boolean = false;
    public ActiveCamera:boolean = false;
    public ActiveMic:boolean = false;
    public Camera:boolean = false;
    public Mic:boolean = false;
    public ShareScreen:boolean = false;
    public RaiseHand:boolean = false;
    public IsVirtualHost:boolean = false;
    public MeetingId:number = 0;
    public MediaServerId:number = 0;
    public Status:number = 4;
    public UserType:number = 1;
    public Id:string = "";
    public AddedDate:string = "";
    public ModifiedDate:string = "";
}

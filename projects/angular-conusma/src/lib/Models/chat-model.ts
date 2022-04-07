export class ChatModel {
    public Id:number;
    public MeetingId:number;
    public From:string; //gerekli
    public To:string; //gerekli
    public Message:string; //gerekli
    public File:string = "";
    public OriginFileName:string = "";
    public Time:string ;//gerekli
    public Delivered:boolean;
    public GroupMessage:boolean;
    
}

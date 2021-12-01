import { MeetingUserModel } from "./Models/meeting-user-model";
import { MediaServer } from "./media-server";
import { ConusmaException } from "./Exceptions/conusma-exception";
import { EventEmitter } from "@angular/core";
import { ChatModel } from "./Models/chat-model";
import { AppService } from "./app.service";
export class Connection {
    user: MeetingUserModel;
    mediaServer: MediaServer = null;
    transport: any;

    stream: MediaStream = null;

    isProducer: boolean = false;
    public reactionsEvent: EventEmitter<string> = new EventEmitter<string>();
    public changeStreamState: EventEmitter<boolean> = new EventEmitter<boolean>();
    public changeSpeaker: EventEmitter<string> = new EventEmitter<string>();
    public isIntersecting: boolean = false;
    public applauseEmoji: any;
    public thumbEmoji: any;
    public isRoomOwner: boolean = false;
    public isAudioActive = true;
    public isVideoActive = true;
    public lastReactionsTime = "";
    public activeSpeakar: string = "";
    public chatMessages: ChatModel[] = [];
    private appService: AppService;
    constructor(user: MeetingUserModel, _appService: AppService, _activeSpeaker: string = "Default") {
        this.user = user;
        this.activeSpeakar = _activeSpeaker;
        this.appService = _appService
    }
    public async approveUser(meetingUserId:string,approve:boolean)
    {
        if(this.isRoomOwner)
        {
            await this.appService.UserApproved({'meetingUserId':this.user.Id,'targetMeetingUserId':meetingUserId,'appro':approve});
        }
    }
    public mute() {
        this.stream.getAudioTracks()[0].enabled = false;
    }
    public unMute() {
        this.stream.getAudioTracks()[0].enabled = true;
    }
    public stopVideo() {
        this.stream.getVideoTracks()[0].enabled = false;
    }
    public startVideo() {
        this.stream.getVideoTracks()[0].enabled = true;
    }
    public async makeHost(myHostUserId: string) {
        var data = {
            "meetingUserId": this.user.Id,
            "hostMeetingUserId": myHostUserId,
            "host": true
        }
        await this.appService.MakeHost(data);
    }
    public async hostCancel(myHostUserId: string) {
        var data = {
            "meetingUserId": this.user.Id,
            "hostMeetingUserId": myHostUserId,
            "host": false
        }
        await this.appService.MakeHost(data);
    }
    public async removeUser(myHostUserId: string) {
        var data = {
            "meetingUserId": myHostUserId,
            "removeMeetingUserId": this.user.Id
        };
        await this.appService.RemoveUser(data);
    }
    public async renameUser(name: string) {
        var muser:MeetingUserModel = JSON.parse(JSON.stringify(this.user));
        muser.MeetingFullName = name;
        await this.appService.UpdateMeetingUser(muser);
    }
    public async raiseHand() {
       var data =  {
            "meetingUserId": this.user.Id,
            "state": true
          }
        await this.appService.RaiseYourHand(data);
    }
    public async raiseHandDown() {
        var data =  {
            "meetingUserId": this.user.Id,
            "state": false
          }
        await this.appService.RaiseYourHand(data);
    }
    public async invite(EMail: string) {
        var data = {
            "eMail": EMail,
            "id": this.user.MeetingId
        }
        await this.appService.invite(data);
    }

    public setMediaServer(mediaServer: MediaServer) {
        this.mediaServer = mediaServer;
    }
    public changeSpeakerEventEmit(deviceId: string) {
        this.activeSpeakar = deviceId;
        this.changeSpeaker.emit(deviceId);
    }
    public changeStreamStateEventEmit(state: boolean) {
        this.changeStreamState.emit(state);
    }
    public reactionsChangeControl() {
        try {
            var now = Date.now();
            var reactionDate = Date.parse(this.user.ReactionTime);
            if (reactionDate > now) {
                if (this.user.ReactionTime != this.lastReactionsTime) {
                    this.lastReactionsTime = this.user.ReactionTime;
                    this.reactionsEvent.emit(this.user.Reaction);
                }
            }
        } catch (error) {
            console.log("reactionsChangeControl error => " + error);
        }


    }
    public switchCamera() {
        try {
            if (this.isProducer && this.stream != null) {
                (this.stream as any).getVideoTracks()[0]._switchCamera();
                return this.stream;
            }
            else {
                throw new ConusmaException("switchCamera", "stream not found, first call enableAudioVideo function");
            }

        } catch (error: any) {
            throw new ConusmaException("switchCamera", "camera switching failed, please check detail exception", error);
        }
    }

    public toggleAudio() {
        try {
            if (this.isProducer && this.stream != null) {
                this.stream.getTracks().forEach((t: any) => {
                    if (t.kind === 'audio') {
                        t.enabled = !t.enabled;
                        this.isAudioActive = t.enabled;
                        this.user.ActiveMic = t.enabled;

                    }
                });
                return this.isAudioActive;
            }
            else {
                throw new ConusmaException("toggleAudio", "stream not found, first call enableAudioVideo function");
            }

        } catch (error: any) {
            throw new ConusmaException("toggleAudio", "toggleAudio failed", error);
        }
    }
    public toggleVideo() {
        try {
            if (this.isProducer && this.stream != null) {
                this.isVideoActive = !this.isVideoActive;
                this.stream.getVideoTracks()[0].enabled = this.isVideoActive;
                this.user.ActiveMic = this.isVideoActive;
                return this.isVideoActive;
            }
            else {
                throw new ConusmaException("toggleVideo", "stream not found, first call enableAudioVideo function");
            }

        } catch (error: any) {
            throw new ConusmaException("toggleVideo", "toggleVideo failed", error);
        }
    }
}
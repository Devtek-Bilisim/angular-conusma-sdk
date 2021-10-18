import { MeetingUserModel } from "./Models/meeting-user-model";
import { MediaServer } from "./media-server";
import { ConusmaException } from "./Exceptions/conusma-exception";
import { EventEmitter } from "@angular/core";
import { ChatModel } from "./Models/chat-model";
export class Connection {
    user:MeetingUserModel;
    mediaServer:MediaServer = null;
    transport:any;
    
    stream:MediaStream = null;
    
    isProducer:boolean = false;
    public reactionsEvent: EventEmitter<string> = new EventEmitter<string>();
    public changeStreamState: EventEmitter<boolean> = new EventEmitter<boolean>();
    public changeSpeaker: EventEmitter<string> = new EventEmitter<string>();
    public isIntersecting:boolean = false;
    public applauseEmoji: any;
    public thumbEmoji: any;
    public isRoomOwner:boolean = false;
    public isAudioActive = true;
    public isVideoActive = true;
    public lastReactionsTime = "";
    public activeSpekar:string="";
    public chatMessages:ChatModel[] = [];
    constructor(user:MeetingUserModel,_activeSpeaker:string="Default") {
        this.user = user;
        this.activeSpekar = _activeSpeaker;
    }
    public setMediaServer( mediaServer:MediaServer)
    {
        this.mediaServer = mediaServer;

    }
    public changeSpeakerEventEmit(deviceId:string)
    {
        this.activeSpekar = deviceId;
        this.changeSpeaker.emit(deviceId);
    }
    public changeStreamStateEventEmit(state:boolean)
    {
        this.changeStreamState.emit(state);
    }
    public reactionsChangeControl()
    {
        try {
            var now =  Date.now();
            var reactionDate = Date.parse(this.user.ReactionTime);
            if(reactionDate > now)
            {
                if( this.user.ReactionTime!= this.lastReactionsTime)
                {
                    this.lastReactionsTime = this.user.ReactionTime;
                    this.reactionsEvent.emit(this.user.Reaction);
                }
            }
        } catch (error) {
            console.log("reactionsChangeControl error => "+error);
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

        } catch (error:any) {
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

        } catch (error:any) {
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

        } catch (error:any) {
            throw new ConusmaException("toggleVideo", "toggleVideo failed", error);
        }
    }
}
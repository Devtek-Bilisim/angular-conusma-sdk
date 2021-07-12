import { MeetingUserModel } from "./Models/meeting-user-model";
import { MediaServer } from "./media-server";
import { ConusmaException } from "./Exceptions/conusma-exception";
export class Connection {
    user:MeetingUserModel;
    mediaServer:MediaServer;
    stream:MediaStream;
    isProducer:boolean = false;
    
    public isAudioActive = true;
    public isVideoActive = true;

    constructor(user:MeetingUserModel, mediaServer:MediaServer) {
        this.user = user;
        this.mediaServer = mediaServer;
        this.stream = new MediaStream();
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

        } catch (error) {
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

                    }
                });
                return this.isAudioActive;
            }
            else {
                throw new ConusmaException("toggleAudio", "stream not found, first call enableAudioVideo function");
            }

        } catch (error) {
            throw new ConusmaException("toggleAudio", "toggleAudio failed", error);
        }
    }
    public toggleVideo() {
        try {
            if (this.isProducer && this.stream != null) {
                this.isVideoActive = !this.isVideoActive;
                this.stream.getVideoTracks()[0].enabled = this.isVideoActive;
                return this.isVideoActive;
            }
            else {
                throw new ConusmaException("toggleVideo", "stream not found, first call enableAudioVideo function");
            }

        } catch (error) {
            throw new ConusmaException("toggleVideo", "toggleVideo failed", error);
        }
    }
}
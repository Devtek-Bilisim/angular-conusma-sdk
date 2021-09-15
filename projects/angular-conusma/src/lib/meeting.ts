import { AppService } from "./app.service";
import { io } from "socket.io-client";
import { MeetingUserModel } from "./Models/meeting-user-model";
import { ConusmaException } from "./Exceptions/conusma-exception";

import { MediaServer } from "./media-server";
import { Connection } from "./connection";
import { MeetingModel } from "./Models/meeting-model";
import { MediaServerModel } from "./Models/media-server-model";
import { connect } from "http2";

export class Meeting {
    public activeUser: MeetingUserModel;
    public meetingWorker: any;
    public mediaServers: MediaServer[] = new Array();
    public connections: Connection[] = new Array();

    private appService: AppService;

    public isClosedRequestRecieved: boolean = false;

    public audioInputs: MediaDeviceInfo[] = [];
    public audioOutputs: MediaDeviceInfo[] = [];
    public videoInputs: MediaDeviceInfo[] = [];

    public activeCamera:any;
    public activeMicrophone:any;
    public activeConnection:any;
    
    constructor(activeUser: MeetingUserModel, appService: AppService) {
        this.appService = appService;
        this.activeUser = activeUser;
        this.getDevices().then(() => {
            if (this.videoInputs.length > 0)
                this.activeCamera = this.videoInputs[0];
            if (this.audioInputs.length > 0)
                this.activeMicrophone = this.audioInputs[0];
        });
    }

    public open(workerUrl:string, apiUrl:string) {
        try {
            this.isClosedRequestRecieved = false;
            this.startMeetingWorker(workerUrl, apiUrl);
        } catch (error) {
            throw new ConusmaException("open", "cannot open, please check exception", error);

        }
    }
    private startMeetingWorker(workerUrl:string, apiUrl:string)
    {
        if(this.meetingWorker != null)
        {
            this.meetingWorker.terminate();
        }
        this.meetingWorker = new Worker(workerUrl);
        this.meetingWorker.postMessage({"MeetingUserId":this.activeUser.Id,"Token":this.appService.getJwtToken(),"url":apiUrl+"/Live/GetMeetingEvents","IAmHereUrl":apiUrl+"/Live/IAmHere"});
    }

    public async close(sendCloseRequest: boolean = false) {
        try {
            if (this.meetingWorker != null) {
                this.meetingWorker.terminate();
            }
            for (let item of this.connections) {
                if (!item.isProducer)
                    item.mediaServer.closeConsumer(item.user);
                else {
                    item.mediaServer.closeProducer();
                }
                item.stream.getTracks().forEach((track:MediaStreamTrack) => { track.stop(); });
            }
            for (var i = 0; i < this.connections.length; i++) {
                if (this.connections[i].mediaServer.socket && this.connections[i].mediaServer.socket.connected) {
                    this.connections[i].mediaServer.socket.close();
                }
                this.removeItemOnce(this.connections, i);
            }
            this.isClosedRequestRecieved = true;
            
            if (sendCloseRequest) {
                var closeData = { 'MeetingUserId': this.activeUser.Id };
                await this.appService.liveClose(closeData);
            }
        } catch (error) {
            throw new ConusmaException("close", "cannot close, please check exception", error);
        }
    }

    public async closeForAll() {
        var closeData = { 'MeetingUserId': this.activeUser.Id };
        await this.appService.liveMeetingCloseAll(closeData);
        await this.close(false);
    }

    public async getMeetingInfo() {
        return <MeetingModel>await this.appService.getLiveMeetingInfo({ 'MeetingUserId': this.activeUser.Id });
    }

    private async createMediaServer(_MediaServerModel: MediaServerModel) {

        var mediaServer = this.mediaServers.find(us => us.id == _MediaServerModel.Id);
        if (mediaServer == null || mediaServer == undefined) {
            mediaServer = new MediaServer(this.appService);
            mediaServer.id = _MediaServerModel.Id;
            mediaServer.socket = io(_MediaServerModel.ConnectionDnsAddress + ":" + _MediaServerModel.Port);
            this.mediaServers.push(mediaServer);
            var userInfoData = { 'MeetingUserId': this.activeUser.Id, 'Token': this.appService.getJwtToken() };
            let setUserInfo = await this.signal('UserInfo', userInfoData, mediaServer.socket);
            await mediaServer.load();
            mediaServer.socket.on('disconnect', async () => {
                if (!this.isClosedRequestRecieved) {
                    throw new ConusmaException("mediaserverconnection", "mediaserverconnection disconnect");
                }
            });
        }
        return mediaServer;
    }


    private async signal(type: string, data: any = null, mediaServerSocket: any): Promise<any> {
        if (mediaServerSocket != null) {
            return new Promise((resolve, reject) => {
                mediaServerSocket.emit(type, data, (err: any, response: any) => {
                    if (!err) {
                        resolve(response);
                    } else {
                        reject(err);
                    }
                });
            });
        }
        else {
            console.error("no socket connection " + type);
        }
    }
    public switchSpeaker(speaker:MediaDeviceInfo, videoElement:any) {
        try {
            videoElement.setSinkId(speaker.deviceId);     
        } catch (error) {
            throw new ConusmaException("switchSpeaker", "Cannot switch speaker", error);
        }
    }
    public async deviceKindExists(kind:MediaDeviceKind) {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            var devicelist = await navigator.mediaDevices.enumerateDevices();
            for (var i = 0; i !== devicelist.length; ++i) {
                var deviceInfo = devicelist[i];
                if (deviceInfo.kind === kind) {
                    return true;
                }
            }
        }
        return false;
    }
    public async getDevices() {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            await navigator.mediaDevices.enumerateDevices()
                .then((deviceInfos) => {
                    this.audioInputs = [];
                    this.audioOutputs = [];
                    this.videoInputs = [];
                    for (var i = 0; i !== deviceInfos.length; ++i) {
                        var deviceInfo = deviceInfos[i];
                        var option = document.createElement('option');
                        option.value = deviceInfo.deviceId;
                        if (deviceInfo.kind === 'audioinput') {
                            this.audioInputs.push(deviceInfo);
                            this.activeUser.Mic = true;
                        } else if (deviceInfo.kind === 'audiooutput') {
                            this.audioOutputs.push(deviceInfo);
                        } else if (deviceInfo.kind === 'videoinput') {
                            this.videoInputs.push(deviceInfo)
                            this.activeUser.Camera = true;
                        }
                    }
               
                });
        } else {
            this.activeUser.Mic = false;
            this.activeUser.ActiveMic = false;
            this.activeUser.Camera = false;
            this.activeUser.ActiveCamera = false;
        }
    }
    public switchCamera(camera:MediaDeviceInfo) {
        this.activeCamera = camera;
    }
    public switchMicrophone(microphone:MediaDeviceInfo) {
        this.activeMicrophone = microphone;
    }
    public async enableAudioVideo() {
        try {
            var videoConstraints: any = {
                "width": {
                    "min": "320",
                    "ideal": "480",
                    "max": "640"
                },
                "height": {
                    "min": "240",
                    "ideal": "360",
                    "max": "480"
                },
                "frameRate": "10"
            };
            var audioConstraints: any = { 'echoCancellation': true };
        
            if (this.activeCamera) {
                videoConstraints.deviceId = { exact: this.activeCamera.deviceId };
            }
            if (this.activeMicrophone) {
                audioConstraints.deviceId = { exact: this.activeMicrophone.deviceId };
            }
            const constraints: any = {
                video: videoConstraints,
                audio: audioConstraints
            };
            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (newStream != null) {
                if (newStream.getVideoTracks().length > 0) {
                    this.activeUser.Camera = true;
                    this.activeUser.ActiveCamera = newStream.getVideoTracks()[0].enabled;
                } else {
                    this.activeUser.Camera = false;
                    this.activeUser.ActiveCamera = false;
                }
    
                if (newStream.getAudioTracks().length > 0) {
                    this.activeUser.Mic = true;
                    this.activeUser.ActiveMic = newStream.getAudioTracks()[0].enabled;
                } else {
                    this.activeUser.Mic = false;
                    this.activeUser.ActiveMic = false;
                }
            } else {
                this.activeUser.Camera = false;
                this.activeUser.ActiveCamera = false;
                this.activeUser.Mic = false;
                this.activeUser.ActiveMic = false;
            }
            return newStream;
        } catch (error) {
            this.activeUser.Camera = false;
            this.activeUser.ActiveCamera = false;
            this.activeUser.Mic = false;
            this.activeUser.ActiveMic = false;
            throw new ConusmaException("enableAudioVideo", "can not read camera and microphone, please check exception.", error);
        }
        
    }

    public async enableAudio() {
        try {
            var audioConstraints: any = { 'echoCancellation': true };
        
            if (this.activeMicrophone) {
                audioConstraints.deviceId = { exact: this.activeMicrophone.deviceId };
            }
            const constraints: any = {
                video: false,
                audio: audioConstraints
            };
            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (newStream != null) {
                if (newStream.getAudioTracks().length > 0) {
                    this.activeUser.Mic = true;
                    this.activeUser.ActiveMic = newStream.getAudioTracks()[0].enabled;
                } else {
                    this.activeUser.Mic = false;
                    this.activeUser.ActiveMic = false;
                }
            } else {
                this.activeUser.Mic = false;
                this.activeUser.ActiveMic = false;
            }
            return newStream;
        } catch (error) {
            this.activeUser.Mic = false;
            this.activeUser.ActiveMic = false;
            throw new ConusmaException("enableAudio", "can not read microphone, please check exception.", error);
        }
    }

    public async enableVideo() {
        try {
            var videoConstraints: any = {
                "width": {
                    "min": "320",
                    "ideal": "480",
                    "max": "640"
                },
                "height": {
                    "min": "240",
                    "ideal": "360",
                    "max": "480"
                },
                "frameRate": "10"
            };
        
            if (this.activeCamera) {
                videoConstraints.deviceId = { exact: this.activeCamera.deviceId };
            }
 
            const constraints: any = {
                audio: false,
                video: videoConstraints
            };

            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (newStream != null) {
                if (newStream.getVideoTracks().length > 0) {
                    this.activeUser.Camera = true;
                    this.activeUser.ActiveCamera = newStream.getVideoTracks()[0].enabled;
                } else {
                    this.activeUser.Camera = false;
                    this.activeUser.ActiveCamera = false;
                }
            } else {
                this.activeUser.Camera = false;
                this.activeUser.ActiveCamera = false;
            }
            return newStream;
        } catch (error) {
            this.activeUser.Camera = false;
            this.activeUser.ActiveCamera = false;
            throw new ConusmaException("enableVideo", "can not read camera, please check exception.", error);
        } 
    }

    public async enableScreenShare() {
        try {
            const displayMediaOptions = {
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            }
            const newStream: MediaStream = await (navigator as any).mediaDevices.getDisplayMedia(displayMediaOptions);
            return newStream;
            
        } catch (error) {
            throw new ConusmaException("enableScreenShare", "can not read screen, please check exception.", error);
        }
    }

    public async connectMeeting() {
        try {
            await this.appService.connectMeeting(this.activeUser);
            console.log("User connected to the meeting.");
        } catch (error) {
            throw new ConusmaException("connectMeeting", "can not connect meeting, please check exception", error);
        }

    }
    public async isApproved() {
        try {
            return await this.appService.isApproved(this.activeUser.Id);

        } catch (error) {
            throw new ConusmaException("isApproved", "user is not approved, please check exception ", error);
        }
    }

    private waitWhoAreYou(socket: any) {
        return new Promise(resolve => {
            socket.on("WhoAreYou")
            {
                console.log("WhoAreYou signal.");
                resolve({});
            }
        });
    }
    public async getAllUsers() {
        try {
            if (this.activeUser != null) {
                return <MeetingUserModel[]>await this.appService.getMeetingUserList({ 'MeetingUserId': this.activeUser.Id });
            } else {
                return [];
            }

        } catch (error) {
            throw new ConusmaException("getAllUsers", "Unable to fetch user list, please check detail exception");
        }

    }

    public async getProducerUsers() {
        try {
            if (this.activeUser != null) {
                var users = await this.appService.getMeetingUserList({ 'MeetingUserId': this.activeUser.Id });
                var result: MeetingUserModel[] = [];
                users.forEach((item: any) => {
                    if (item.Camera == true) {
                        result.push(item);
                    }
                });
                return result;
            } else {
                return [];
            }
        } catch (error) {
            throw new ConusmaException("getProducerUsers", "Unable to fetch producer user list, please check detail exception");
        }
    }

    public async produce(localStream: MediaStream) {
        this.activeConnection = await this.createConnectionForProducer();
        this.activeConnection.stream = localStream;
        if (localStream != null) {
            await this.activeConnection.mediaServer.produce(this.activeUser, localStream);
            this.activeConnection.transport = this.activeConnection.mediaServer.producerTransport;
        } 
        return this.activeConnection;
    }

    public async closeProducer() {
        try {
            var myConenctionUser = this.connections.find(us => us.user.Id == this.activeUser.Id);
            if (myConenctionUser != null) {
                await myConenctionUser.mediaServer.closeProducer();
                this.activeUser.Camera = false;
                this.activeUser.Mic = false;
                this.activeUser.ActiveCamera = false;
                this.activeUser.ActiveMic = false;
                await this.appService.updateMeetingUser(this.activeUser);
                var index = this.connections.findIndex(us => us.user.Id == this.activeUser.Id);
                this.removeItemOnce(this.connections, index);
            }
            else
            {
                throw new ConusmaException("closeProducer","producer connection not found");

            }
        } catch (error) {
            throw new ConusmaException("closeProducer"," please check detail exception",error);
        }
    }

    private removeItemOnce(arr: any, index: any) {
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    public async consume(user: MeetingUserModel) {
        var connection = await this.createConnectionForConsumer(user);
        try {
            connection.transport = await connection.mediaServer.consume(user);
            connection.stream = connection.transport.RemoteStream;
        } catch(e) {
            connection.user.Camera = false;
            connection.user.Mic = false;
            // TODO: Log error
        }
        return connection;
    }
    public async closeConsumer(connection: Connection) {
        await connection.mediaServer.closeConsumer(connection.user);
        for (var i = 0; i < this.connections.length; i++) {
            if (this.connections[i].user.Id == connection.user.Id && this.connections[i].mediaServer.id == connection.mediaServer.id) {
                this.removeItemOnce(this.connections, i);
            }
        }
    }

    private async createConnectionForProducer() {
        const mediaServerModel: MediaServerModel = <MediaServerModel>await this.appService.getMediaServer(this.activeUser.Id);

        var mediaServer = await this.createMediaServer(mediaServerModel);

        var connection: Connection = new Connection(this.activeUser, mediaServer);

        connection.isProducer = true;

        this.connections.push(connection);
        return connection;
    }

    private async createConnectionForConsumer(user: MeetingUserModel) {
        const mediaServerModel: MediaServerModel = <MediaServerModel>await this.appService.getMediaServerById(this.activeUser.Id, user.MediaServerId);
        var mediaServer = await this.createMediaServer(mediaServerModel);
        var connection: Connection = new Connection(user, mediaServer);
        this.connections.push(connection);
        return connection;
    }
}
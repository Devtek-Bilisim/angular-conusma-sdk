import { AppService } from "./app.service";
import { io } from "socket.io-client";
import { MeetingUserModel } from "./Models/meeting-user-model";
import { ConusmaException } from "./Exceptions/conusma-exception";

import { MediaServer } from "./media-server";
import { Connection } from "./connection";
import { MeetingModel } from "./Models/meeting-model";
import { MediaServerModel } from "./Models/media-server-model";
import { WorkerDataModel } from "./Component/worker-data-model";
import * as EventEmitter from "events";

export class Meeting {
    public activeUser: MeetingUserModel;
    public meetingWorker: Worker = null;
    public mediaServers: MediaServer[] = new Array();
    public connections: Connection[] = new Array();
    public userList:MeetingUserModel[] = new Array();
    private appService: AppService;

    public isClosedRequestRecieved: boolean = false;

    public audioInputs: MediaDeviceInfo[] = [];
    public audioOutputs: MediaDeviceInfo[] = [];
    public videoInputs: MediaDeviceInfo[] = [];
    public localStream: MediaStream = null;

    public activeConnection: Connection;

    /* Peer to Peer 
      private configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      public pc = new RTCPeerConnection(this.configuration);
      public remoteStream: any;*/


    private workerModel: WorkerDataModel = new WorkerDataModel();
    public meetingEvents: EventEmitter = new EventEmitter();
    public meeting:MeetingModel = null;
    public activeSpeaker:string="default";
    constructor(activeUser: MeetingUserModel, _meeting:MeetingModel,appService: AppService) {
        this.appService = appService;
        this.activeUser = activeUser;
        this.activeUser.Camera = false;
        this.activeUser.Mic = false;
        this.activeUser.ActiveCamera = false;
        this.activeUser.ActiveMic = false;
        this.meeting = _meeting;
    }

    public open(apiUrl: string) {
        try {
            this.isClosedRequestRecieved = false;
            this.startMeetingWorker(apiUrl);
        } catch (error: any) {
            console.log(error);
            throw new ConusmaException("open", "cannot open, please check exception", error);

        }
    }
    private async ReactionsControl() {
        
        this.connections.forEach(connection => {
            connection.reactionsChangeControl();
        });
    }
    private async ConnectNewConnectionAndDeleteConenction() {
        try {
            console.log(this.userList);
            console.log(this.connections);
            for (var i = 0; i < this.userList.length; i++) {
                if (this.connections.find(us => us.user.Id == this.userList[i].Id) == null) {
                    var connectionConsumer = await this.createConsumerConnection(this.userList[i]);
                    if(connectionConsumer != null)
                    {
                        if(this.userList[i].Camera || this.userList[i].Mic)
                        {
                            await this.consume(connectionConsumer);
                        }
                    }
                }
            }
            var deleteUserList: Connection[] = [];
            for (var l = 0; l < this.connections.length; l++) {
                if (this.userList.find(us => us.Id == this.connections[l].user.Id) == null) {
                    deleteUserList.push(this.connections[l]);
                }
            }
            for (var d = 0; d < deleteUserList.length; d++) {
                await this.closeConsumer(deleteUserList[d]);
            }
            for(var u = 0 ; u < this.connections.length ; u++)
            {
                var user = this.userList.find(us => us.Id == this.connections[u].user.Id);
                if(user != null)
                {
                   this.connections[u].user = user;
                }
            }

        } catch (error) {
            console.log("error " + error);
        }
    }
    private startMeetingWorker(apiUrl: string) {
        if (this.meetingWorker != null) {
            this.meetingWorker.terminate();
        }
        this.meetingWorker = new Worker("./assets/workers/meetingworker.js");
        this.meetingWorker.postMessage({ "MeetingUserId": this.activeUser.Id, "Token": this.appService.getJwtToken(), "url": apiUrl + "/Live/GetMeetingEvents", "IAmHereUrl": apiUrl + "/Live/IAmHere" });
        this.meetingWorker.onmessage = async (event: any) => {
            var eventChange = JSON.parse(event.data);
            if (this.workerModel.MeetingUsers != eventChange.MeetingUsers) {
                this.meetingEvents.emit("meetingUser");
                this.workerModel.MeetingUsers = eventChange.MeetingUsers;
                this.userList = await this.getAllUsers();
                await this.ConnectNewConnectionAndDeleteConenction();
                await this.ReactionsControl();
            }
            if (this.workerModel.ChatUpdates != eventChange.ChatUpdates) {
                this.meetingEvents.emit("chat");
                this.workerModel.ChatUpdates = eventChange.ChatUpdates;
            }
            if (this.workerModel.MeetingUpdate != eventChange.MeetingUpdate) {
                this.meetingEvents.emit("meeting");
                this.workerModel.MeetingUpdate = eventChange.MeetingUpdate;
                await this.getMeetingInfo();
            }
        };
    }

    public async close(sendCloseRequest: boolean = false) {
        try {
            this.activeConnection = null;
            if (this.meetingWorker != null) {
                this.meetingWorker.terminate();
            }
            for (let item of this.connections) {
                if (!item.isProducer)
                    item.mediaServer.closeConsumer(item.user);
                else {
                    item.mediaServer.closeProducer();
                }
                item.stream.getTracks().forEach((track: MediaStreamTrack) => { track.stop(); });
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
                await this.appService.LiveClose(closeData);
            }
        } catch (error: any) {
            throw new ConusmaException("close", "cannot close, please check exception", error);
        }
    }

    public async closeForAll() {
        var closeData = { 'MeetingUserId': this.activeUser.Id };
        await this.appService.LiveMeetingAllClose(closeData);
        await this.close(false);
    }

    public async getMeetingInfo() {
        this.meeting =  <MeetingModel>await this.appService.GetLiveMeetingInfo({ 'MeetingUserId': this.activeUser.Id });
        return this.meeting;
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
    public switchSpeaker(speaker: MediaDeviceInfo) {
        try {
            this.connections.forEach(element => {
                element.changeSpeakerEventEmit(speaker.deviceId);
            });
            this.activeSpeaker = speaker.deviceId;
        } catch (error: any) {
            throw new ConusmaException("switchSpeaker", "Cannot switch speaker", error);
        }
    }
    public async deviceKindExists(kind: MediaDeviceKind) {
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
    public async updateDeviceList() {
        this.audioInputs = [];
        this.audioOutputs = [];
        this.videoInputs = [];
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            var deviceList = await navigator.mediaDevices.enumerateDevices();
            for (var i = 0; i !== deviceList.length; ++i) {
                var deviceInfo = deviceList[i];
                var option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                if (deviceInfo.kind === 'audioinput') {
                    this.audioInputs.push(deviceInfo);
                } else if (deviceInfo.kind === 'audiooutput') {
                    this.audioOutputs.push(deviceInfo);
                    if(deviceInfo.label.toLowerCase().includes("default"))
                    {
                        this.activeSpeaker = deviceInfo.deviceId;
                    }
                } else if (deviceInfo.kind === 'videoinput') {
                    this.videoInputs.push(deviceInfo)
                }
            }

        }
    }
    public async switchCamera(camera: MediaDeviceInfo) {
        await this.enableVideo(camera);
    }
    public async switchMicrophone(microphone: MediaDeviceInfo) {
        await this.enableAudio(microphone);
    }
    public async enableAudioVideo(camera: MediaDeviceInfo = null, microphone: MediaDeviceInfo = null) {
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

            if (camera != null) {
                videoConstraints.deviceId = { exact: camera.deviceId };
            }
            if (microphone != null) {
                audioConstraints.deviceId = { exact: microphone.deviceId };
            }
            const constraints: any = {
                video: videoConstraints,
                audio: audioConstraints
            };
            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (newStream == null) {
                throw new Error("stream is null");
            }
            if (newStream.getAudioTracks().length < 1) {
                throw new Error("audio track is null");
            }
            if (newStream.getVideoTracks().length < 1) {
                throw new Error("video track is null");
            }
            this.activeUser.Camera = true;
            this.activeUser.ActiveCamera = newStream.getVideoTracks()[0].enabled;
            this.activeUser.Mic = true;
            this.activeUser.ActiveMic = newStream.getAudioTracks()[0].enabled;
            this.localStream = newStream;
            await this.updateStreamProducerTrack(true, true, this.localStream);
        } catch (error: any) {
            this.activeUser.Camera = false;
            this.activeUser.ActiveCamera = false;
            this.activeUser.Mic = false;
            this.activeUser.ActiveMic = false;
            throw new ConusmaException("enableAudioVideo", "can not read camera and microphone, please check exception.", error);
        }

    }

    public async enableAudio(microphone: MediaDeviceInfo = null) {
        try {
            var audioConstraints: any = { 'echoCancellation': true };

            if (microphone != null) {
                audioConstraints.deviceId = { exact: microphone.deviceId };
            }
            const constraints: any = {
                video: false,
                audio: audioConstraints
            };
            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (newStream == null || newStream.getAudioTracks().length < 1) {
                throw new Error("audio stream is null");
            }
            this.activeUser.Mic = true;
            this.activeUser.ActiveMic = newStream.getAudioTracks()[0].enabled;
            if (this.localStream != null) {
                if (this.localStream.getAudioTracks().length > 0) {
                    this.localStream.removeTrack(this.localStream.getAudioTracks()[0]);
                    this.localStream.addTrack(newStream.getAudioTracks()[0]);
                }
                else {
                    this.localStream.addTrack(newStream.getAudioTracks()[0]);
                }
            }
            else {
                this.localStream = newStream;
            }
            await this.updateStreamProducerTrack(false, true, this.localStream);
        } catch (error: any) {
            throw new ConusmaException("enableAudio", "can not read microphone, please check exception.", error);
        }
    }

    public async enableVideo(camera: MediaDeviceInfo = null) {
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

            if (camera != null) {
                videoConstraints.deviceId = { exact: camera.deviceId };
            }

            const constraints: any = {
                audio: false,
                video: videoConstraints
            };

            const newStream: MediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (newStream == null || newStream.getVideoTracks().length < 1) {
                throw new Error("video stream is null");
            }
            this.activeUser.Camera = true;
            this.activeUser.ActiveCamera = newStream.getVideoTracks()[0].enabled;
            if (this.localStream != null) {
                if (this.localStream.getVideoTracks().length > 0) {
                    this.localStream.removeTrack(this.localStream.getVideoTracks()[0]);
                    this.localStream.addTrack(newStream.getVideoTracks()[0]);
                }
                else {
                    this.localStream.addTrack(newStream.getVideoTracks()[0]);

                }
            }
            else {
                this.localStream = newStream;
            }
            await this.updateStreamProducerTrack(true, false, this.localStream);
        } catch (error: any) {
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
            if (newStream == null) {
                throw new Error("share screen stream is null");
            }
            if (this.localStream != null) {
                if (this.localStream.getVideoTracks().length > 0) {
                    this.localStream.removeTrack(this.localStream.getVideoTracks()[0]);
                    this.localStream.addTrack(newStream.getVideoTracks()[0]);
                }
                else {
                    this.localStream.addTrack(newStream.getVideoTracks()[0]);
                }
            }
            else {
                this.localStream = newStream;
            }
            await this.updateStreamProducerTrack(true, false, this.localStream);
        } catch (error: any) {
            throw new ConusmaException("enableScreenShare", "can not read screen, please check exception.", error);
        }
    }
    private async updateStreamProducerTrack(video: boolean = false, audio: boolean = false, stream: MediaStream) {
        if (video && audio) {
            if (this.activeConnection != null && this.activeConnection.mediaServer != null && this.activeConnection.mediaServer.videoProducer != null) {
                await this.activeConnection.mediaServer.replaceTrack("video", this.localStream);
            }
            if (this.activeConnection != null && this.activeConnection.mediaServer != null && this.activeConnection.mediaServer.audioProducer != null) {
                await this.activeConnection.mediaServer.replaceTrack("audio", this.localStream);
            }
        }
        else if (video) {
            if (this.activeConnection != null && this.activeConnection.mediaServer != null && this.activeConnection.mediaServer.videoProducer != null) {
                await this.activeConnection.mediaServer.replaceTrack("video", this.localStream);
            }

        }
        else if (audio) {
            if (this.activeConnection != null && this.activeConnection.mediaServer != null && this.activeConnection.mediaServer.audioProducer != null) {
                await this.activeConnection.mediaServer.replaceTrack("audio", this.localStream);
            }
        }

    }
    public async connectMeeting() {
        try {
            await this.appService.ConnectMeeting(this.activeUser);
            console.log("User connected to the meeting.");
        } catch (error: any) {
            throw new ConusmaException("connectMeeting", "can not connect meeting, please check exception", error);
        }

    }
    public async isApproved() {
        try {
            return await this.appService.IsItApproved(this.activeUser.Id);

        } catch (error: any) {
            throw new ConusmaException("isApproved", "user is not approved, please check exception ", error);
        }
    }

   
    public async getAllUsers() {
        try {
            if (this.activeUser != null) {
                return <MeetingUserModel[]>await this.appService.GetMeetingUserList({ 'MeetingUserId': this.activeUser.Id });
            } else {
                return [];
            }

        } catch (error: any) {
            throw new ConusmaException("getAllUsers", "Unable to fetch user list, please check detail exception");
        }

    }

    public async getProducerUsers() {
        try {
            if (this.activeUser != null) {
                var users = await this.appService.GetMeetingUserList({ 'MeetingUserId': this.activeUser.Id });
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
        } catch (error: any) {
            throw new ConusmaException("getProducerUsers", "Unable to fetch producer user list, please check detail exception");
        }
    }
    public async createConnection()
    {
        if(this.activeConnection != null)
        {
            throw new ConusmaException("createConnection","active connection is not null");
        }
        this.activeConnection  = new Connection(this.activeUser,this.activeSpeaker);
        this.activeConnection.isProducer = false;
        this.connections.push(this.activeConnection);

    }

    public async produce() {
        if (this.localStream == null) {
            throw new ConusmaException("produce", "local stream is null , please call enableVideoAudio()");
        }
        if (this.activeConnection == null) {
            throw new ConusmaException("produce", "activeConnection  is null , please call createConnection()");
        }
        await this.createConnectionForProducer();
        this.activeConnection.stream = this.localStream;
        this.activeConnection.changeStreamStateEventEmit(true);
        await this.activeConnection.mediaServer.produce(this.activeUser, this.localStream);
        this.activeConnection.transport = this.activeConnection.mediaServer.producerTransport;
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
                await this.appService.UpdateMeetingUser(this.activeUser);
                var index = this.connections.findIndex(us => us.user.Id == this.activeUser.Id);
                this.removeItemOnce(this.connections, index);
            }
            else {
                throw new ConusmaException("closeProducer", "producer connection not found");

            }
        } catch (error: any) {
            throw new ConusmaException("closeProducer", " please check detail exception", error);
        }
    }

    private removeItemOnce(arr: any, index: any) {
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }
    public async createConsumerConnection(user: MeetingUserModel)
    {
        if( this.connections.find(us => us.user.Id == user.Id)  == null)
        {
            var connection: Connection = new Connection(user,this.activeSpeaker);
            connection.isProducer = false;
            this.connections.push(connection);
            return connection;
        }
        return null;
    }
    public async consume(connection: Connection) {
         connection = await this.createConnectionForConsumer(connection);
        try {
            connection.transport = await connection.mediaServer.consume(connection.user);
            connection.stream = connection.transport.RemoteStream;
            connection.changeStreamStateEventEmit(true);
        } catch (e) {
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
        const mediaServerModel: MediaServerModel = <MediaServerModel>await this.appService.GetMediaServer(this.activeUser.Id);
        var mediaServer = await this.createMediaServer(mediaServerModel);
        this.activeConnection.setMediaServer(mediaServer);
        this.activeConnection.isProducer = true;
    }

    private async createConnectionForConsumer(connection: Connection) {
        const mediaServerModel: MediaServerModel = <MediaServerModel>await this.appService.getMediaServerById(this.activeUser.Id, connection.user.MediaServerId);
        var mediaServer = await this.createMediaServer(mediaServerModel);
        connection.setMediaServer(mediaServer);
        return connection;
    }
    public async changeMicrophoneState(state:boolean)
    {
        try {
            var track:MediaStreamTrack = this.activeConnection.stream.getAudioTracks()[0];
            track.enabled = state;
            this.activeUser.ActiveMic = state;
            await this.appService.UpdateMeetingUser(this.activeUser);
        } catch (error:any) {
            throw new ConusmaException("changeMicrophoneState","unknown error",error);
        }
    }
    public async changeVideoState(state:boolean)
    {
        try {
            var track:MediaStreamTrack = this.activeConnection.stream.getVideoTracks()[0];
            track.enabled = state;
            this.activeUser.ActiveCamera = state;
            await this.appService.UpdateMeetingUser(this.activeUser);
        } catch (error:any) {
            throw new ConusmaException("changeVideoState","unknown error",error);
        }
    }
}
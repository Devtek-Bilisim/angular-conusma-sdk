import { MeetingUserModel } from "./Models/meeting-user-model";
import * as mediaServerClient from 'mediasoup-client';
import { AppService } from "./app.service";
import { ConusmaException } from "./Exceptions/conusma-exception";

export class MediaServer {
    id: number = 0;
    socket: any = null;
    device: any = null;
    broadcastTransport:any = null;
    producerTransport:any = null;
    videoProducer:any = null;
    audioProducer:any;
    consumerTransports:any = [];

    constructor(private appService:AppService) {}

    public async load() {
        let routerRtpCapabilities = await this.signal('getRouterRtpCapabilities', null, this.socket);
        const handlerName = mediaServerClient.detectDevice();
        if (handlerName) {
            console.log("detected handler: %s", handlerName);
        } else {
            console.error("no suitable handler found for current device");
        }

        this.device = new mediaServerClient.Device({
            handlerName: handlerName
        });
     
        console.log("device loading...");
        await this.device.load({ routerRtpCapabilities });
        console.log("device loaded.");
    }
    public async produce(user:MeetingUserModel, localStream:MediaStream) {
        try { 
            if(this.producerTransport == null)
            {
                await this.createProducerTransport();
                console.log("createProducerTransport");
            }
            if (localStream.getVideoTracks().length > 0 && this.videoProducer == null) {
                await this.createProducer(localStream, 'video');
                user.Camera = true;
                user.ActiveCamera = true;
                console.log("createVideoProducer");
            }
            if (localStream.getAudioTracks().length > 0 && this.audioProducer == null) {
                await this.createProducer(localStream, 'audio');
                user.Mic = true;
                user.ActiveMic = true;
                console.log("createAudioProducer");
            }
            user.MediaServerId = this.id;
            this.appService.ConnectMeeting(user);

        } catch (error:any) {
            throw new ConusmaException("produce", "can not send stream, please check exception", error);
        }
    }

    public async replaceTrack(kind:string, stream:MediaStream) {
        if (kind == "video") {
            await this.videoProducer.replaceTrack({ track: stream.getVideoTracks()[0] });
            this.videoProducer.track.enabled = stream.getVideoTracks()[0].enabled;
        } else if (kind == "audio") {
            await this.audioProducer.replaceTrack({ track: stream.getAudioTracks()[0] });
            this.audioProducer.track.enabled = stream.getAudioTracks()[0].enabled;
        }
    }

    private async createBroadcastTransport() {
        try {
            console.log("createBroadcastTransport started.");
            var transportOptions: any = await this.signal('createBroadcastTransport', {}, this.socket);
    
            this.broadcastTransport = await this.device.createSendTransport(transportOptions);
            this.broadcastTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
                let error = await this.signal('connectBroadcastTransport', {
                    transportId: transportOptions.id,
                    dtlsParameters
                }, this.socket);
                callback();
            });
            
            this.producerTransport.on('broadcast', async ({ kind, rtpParameters, appData }: any,
                callback: any, errback: any) => {
                let paused = false;
                paused = false;
                let id = await this.signal('broadcast', {
                    transportId: transportOptions.id,
                    kind,
                    rtpParameters,
                    paused,
                    appData
                }, this.socket);
                callback(id)
            });
        } catch (error:any) {
            throw new ConusmaException("createBroadcastTransport", "createBroadcastTransport error", error);
        }
    }
    private async createProducerTransport() {
        try {
                console.log("createProducerTransport started.");
                var transportOptions: any = await this.signal('createProducerTransport', {}, this.socket);
    
                this.producerTransport = await this.device.createSendTransport(transportOptions);
                this.producerTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
                    let error = await this.signal('connectProducerTransport', {
                        transportId: transportOptions.id,
                        dtlsParameters
                    }, this.socket);
                    callback();
                });
                
                this.producerTransport.on('produce', async ({ kind, rtpParameters, appData }: any,
                    callback: any, errback: any) => {
                    let paused = false;
                    paused = false;
                    let id = await this.signal('produce', {
                        transportId: transportOptions.id,
                        kind,
                        rtpParameters,
                        paused,
                        appData
                    }, this.socket);
                    callback(id)
                });
        } catch (error:any) {
            throw new ConusmaException("createProducerTransport", "createProducerTransport error", error);
        }
    }

    public async createProducer(localStream: MediaStream, kind: string) {
        try {
            if (kind == 'video' && this.videoProducer == null) {
                const videoTrack = localStream.getVideoTracks()[0];
                this.videoProducer = await this.producerTransport.produce({
                    track: videoTrack,
                    encodings: [
                        
                    ],
                    codecOptions:
                    {
                        videoGoogleStartBitrate: 1000
                    },
                    appData: { mediaTag: 'video' }
                });
            }
            else if (kind == 'audio' && this.audioProducer == null) {
                this.audioProducer = await this.producerTransport.produce({
                    track: localStream.getAudioTracks()[0],
                    appData: { mediaTag: 'audio' }
                });
                /*
                  // react-native-webrtc does not support setParameters
                  let aparameters = this.mediaServerClient.AudioProducer.rtpSender.getParameters();
                  if (!aparameters.encodings) {
                      aparameters.encodings = [{}];
                  }
                  aparameters.encodings[0].maxBitrate = 50 * 1000;
                  await this.mediaServerClient.AudioProducer.rtpSender.setParameters(aparameters);*/
            }

        } catch (error:any) {
            console.error("createProducer error. " + error);
        }
    }

    public async signal(type: string, data: any = null, mediaServerSocket: any): Promise<any> {
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

    public async consume(producerUser: MeetingUserModel) {
        try {
            if(this.consumerTransports.find((us:any) => us.MeetingUserId == producerUser.Id) == null)
            {
                var result = await this.createConsumerTransport(this, producerUser);
                this.consumerTransports.push(result);
                return result;
            }
            else
            {
                return this.consumerTransports.find((us:any) => us.MeetingUserId == producerUser.Id);
            }
        } catch (error:any) {
            throw new ConusmaException("consume", producerUser.Id + "The stream of the user is currently not captured. User connection information is out of date.", error);
        }
    }

    private async createConsumerTransport(targetMediaServerClient: MediaServer, user: MeetingUserModel) {
        if (targetMediaServerClient != null && targetMediaServerClient.socket != null) {

            var consumerTransport: any = new Object();
            consumerTransport.MediaServer = targetMediaServerClient;
            consumerTransport.MeetingUserId = user.Id;
            var transportOptions = await this.signal("createConsumerTransport", { MeetingUserId: user.Id }, targetMediaServerClient.socket);
            consumerTransport.MediaServerSocketId = user.MediaServerSocketId;
            consumerTransport.transportId = transportOptions.Id;
            consumerTransport.transport = await targetMediaServerClient.device.createRecvTransport(transportOptions.transportOptions);
            consumerTransport.transport.on("connect", async ({ dtlsParameters }: any, callback: any, errback: any) => {
                this.signal("connectConsumerTransport", { consumerTransportId: consumerTransport.transportId, dtlsParameters: dtlsParameters }, targetMediaServerClient.socket)
                    .then(callback)
                    .catch(errback);
            });
            consumerTransport.RemoteStream = new MediaStream();
            consumerTransport.Camera = user.Camera;
            consumerTransport.Mic = user.Mic;
            consumerTransport.ShareScreen = user.ShareScreen;
            console.log("createConsumerTransport created the consumer transport.");
            return consumerTransport;
        } else {
            throw new ConusmaException("createConsumerTransport", "No socket connection.");
        }
    }

    public async addConsumer(consumerTransport: any, kind: string) {
        if (consumerTransport != null) {
            if (kind == "video" ) {
                if(consumerTransport.videoConsumer == null)
                {
                    consumerTransport.videoConsumer = await this.consumeTransport(consumerTransport, "video");
                    this.resumeConsumer(consumerTransport, "video");
                    consumerTransport.RemoteStream.addTrack(consumerTransport.videoConsumer.track);
                }
            } else {
                if(consumerTransport.audioConsumer == null)
                {
                    consumerTransport.audioConsumer = await this.consumeTransport(consumerTransport, "audio");
                    this.resumeConsumer(consumerTransport, "audio");
                    consumerTransport.RemoteStream.addTrack(consumerTransport.audioConsumer.track);
                    consumerTransport.audioConsumer.resume();
                }
              
            }
        }
    }
    public async resumeConsumer(consumerTransport: any, kind: string) {
        this.signal('resume', { consumerTransportId: consumerTransport.transportId, kind: kind }, consumerTransport.MediaServer.socket);
    }


    private async consumeTransport(consumerTransport: any, trackKind: string) {
        const { rtpCapabilities } = consumerTransport.MediaServer.device;
        const data = await this.signal("consume", { consumerTransportId: consumerTransport.transportId, rtpCapabilities: rtpCapabilities, kind: trackKind }, consumerTransport.MediaServer.socket)
            .catch(err => {
                throw new ConusmaException("consumeTransport", "Consume error.", err);
            });
        const {
            producerId,
            id,
            kind,
            rtpParameters,
        } = data;
        let codecOptions = {};
        const consumer = await consumerTransport.transport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });
        return consumer;
    }

      
    public async pauseConsumer(consumerTransport: any, kind: string) {
        try {
            if (consumerTransport != null && consumerTransport.videoConsumer != null) {
                if (kind == 'video') {
                    await this.signal('pause', {
                        kind: 'video',
                        consumerTransportId: consumerTransport.transportId
                    }, consumerTransport.MediaServer.socket);
                    await consumerTransport.videoConsumer.pause();;
                    consumerTransport.RemoteStream.removeTrack(consumerTransport.videoConsumer.track);
                }
                else if (kind == 'audio' && consumerTransport.audioConsumer != null) {
                    await this.signal('pause', {
                        kind: 'audio',
                        consumerTransportId: consumerTransport.transportId
                    }, consumerTransport.MediaServer.socket);
                    await consumerTransport.audioConsumer.pause();
                    consumerTransport.RemoteStream.removeTrack(consumerTransport.audioConsumer.track);
                }
            }
        } catch (error:any) {

        }
    }
    public async closeConsumer(user: MeetingUserModel) {
        try {
            var index = 0;
            for (let item of this.consumerTransports) {
                if (item.MeetingUserId == user.Id) {
                    if (item.transport) {
                        item.transport.close();
                    }
                    await this.signal('removeConsumerTransport', {'consumerTransportId':item.transportId},this.socket);
                    break;
                }
                index++;
            };
            this.removeItemOnce(this.consumerTransports, index);
        } catch (error:any) {
            throw new ConusmaException("closeConsumer", "consumer cannot be closed, please check exception", error);
        }

    }

    private removeItemOnce(arr: any, index: any) {
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    public async closeProducer() {
        try {
            if (this.producerTransport)
                this.producerTransport.close(); 
                await this.signal('produceclose',{'kind':'video'},this.socket);
                await this.signal('produceclose',{'kind':'audio'},this.socket);
        } catch (error:any) {
            throw new ConusmaException("closeProducer", "producer cannot be closed, please check exception ", error);
        }

    }
    
}
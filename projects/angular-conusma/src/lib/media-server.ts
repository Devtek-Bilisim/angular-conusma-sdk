import { MeetingUserModel } from "./Models/meeting-user-model";
import * as mediaServerClient from 'mediasoup-client';
import { AppService } from "./app.service";
import { ConusmaException } from "./Exceptions/conusma-exception";

export class MediaServer {
    id: number = 0;
    socket: any = null;
    device: any = null;
    producerTransport:any;
    videoProducer:any;
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
            await this.createProducerTransport();
            if (localStream.getVideoTracks().length > 0) {
                await this.createProducer(localStream, 'video');
                user.Camera = true;
                user.ActiveCamera = true;
            }
            if (localStream.getAudioTracks().length > 0) {
                await this.createProducer(localStream, 'audio');
                user.Mic = true;
                user.ActiveMic = true;
            }
            user.MediaServerId = this.id;
            this.appService.connectMeeting(user);

        } catch (error) {
            throw new ConusmaException("produce", "can not send stream, please check exception", error);
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
        } catch (error) {
            throw new ConusmaException("createProducerTransport", "createProducerTransport error", error);
        }
    }

    private async createProducer(localStream: MediaStream, kind: string) {
        try {
            if (kind == 'video') {
                const videoTrack = localStream.getVideoTracks()[0];
                this.videoProducer = await this.producerTransport.produce({
                    track: videoTrack,
                    encodings: [
                        { maxBitrate: 500000 },
                        { maxBitrate: 1000000 },
                        { maxBitrate: 2000000 }
                    ],
                    codecOptions:
                    {
                        videoGoogleStartBitrate: 1000
                    },
                    appData: { mediaTag: 'video' }
                });
            }
            else if (kind == 'audio') {
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

        } catch (error) {
            console.error("createProducer error. " + error);
        }
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

    public async consume(producerUser: MeetingUserModel) {
        try {
            var result = await this.createConsumerTransport(this, producerUser);
            this.consumerTransports.push(result);
            return <MediaStream>result.RemoteStream;
        } catch (error) {

            throw new ConusmaException("consume", producerUser.Id + "The stream of the user is currently not captured. User connection information is out of date.", error);
        }
    }

    private async createConsumerTransport(targetMediaServerClient: MediaServer, user: MeetingUserModel) {
        if (targetMediaServerClient != null && targetMediaServerClient.socket != null) {
            console.log("createConsumerChildFunction start.");
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
            console.log("createConsumerChildFunction creating the consumer.");
            if (user.Camera || user.ShareScreen) {
                await this.addConsumer(consumerTransport, "video");
            }

            if (user.Mic) {
                await this.addConsumer(consumerTransport, "audio");
            }
            return consumerTransport;
        } else {
            throw new ConusmaException("createConsumerChildFunction", "No socket connection.");
        }
    }

    private async addConsumer(consumerTransport: any, kind: string) {
        if (consumerTransport != null) {
            if (kind == "video") {
                consumerTransport.videoConsumer = await this.consumeTransport(consumerTransport, "video");
                this.resumeConsumer(consumerTransport, "video");
                consumerTransport.RemoteStream.addTrack(consumerTransport.videoConsumer.track);
            } else {
                consumerTransport.audioConsumer = await this.consumeTransport(consumerTransport, "audio");
                this.resumeConsumer(consumerTransport, "audio");
                consumerTransport.RemoteStream.addTrack(consumerTransport.audioConsumer.track);
                consumerTransport.audioConsumer.resume();
            }
        }
    }
    private async resumeConsumer(consumerTransport: any, kind: string) {
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

      
    private async pauseConsumer(consumerTransport: any, kind: string) {
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
        } catch (error) {

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
                    break;
                }
                index++;
            };
            this.removeItemOnce(this.consumerTransports, index);
        } catch (error) {
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
        } catch (error) {
            throw new ConusmaException("closeProducer", "producer cannot be closed, please check exception ", error);
        }

    }
    
}
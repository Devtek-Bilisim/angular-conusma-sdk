export class MediaServerModel {
    public Id:number = 0;
    public Name:string = "";
    public Type:string = "";
    public ConnectionIpAddress:string = "";
    public ConnectionDnsAddress:string = "";
    public Port:string = "";
    public MediaServerType:boolean = false;
    public State:string = "";
    public Latitude:string = "";
    public Longitude:string = "";
    public CpuLimit:number = 0;
    public BandwidthRxLimit:number = 0;
    public BandwidthTxLimit:number = 0;
    public MemoryLimit:number = 0;
    public ActiveCpu:number = 0;
    public ActiveBandwidthRx:number = 0;
    public ActiveBandwidthTx:number = 0;
    public ActiveUseMemory:number = 0;
    public ActiveTotalMemory:number = 0;
    public ActiveConnectionCount:number = 0;
    public ActiveTotalConsumerCount:number = 0;
    public ActiveTotalProducerCount:number = 0;
    public ActiveVideoProducerCount:number = 0;
    public ActiveAuidoProducerCount:number = 0;
   
}

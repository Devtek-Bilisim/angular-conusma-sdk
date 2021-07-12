import { EventEmitter } from 'events';
import { ConusmaException } from "./Exceptions/conusma-exception";

export class BackgroundTimer
{
    public tickEventEmitter:EventEmitter = new EventEmitter();

    public start(interval:number)
    {
        this.timerId = setTimeout(() => {
              if(this.timeoutActive)
              {
                  this.tickEventEmitter.emit('timeout');
                  this.start(interval);
              }
        }, interval);
    }
    timerId:any;
    timeoutActive:boolean = true;
    public terminate() {
        try {
            this.timeoutActive = false;
            this.tickEventEmitter.removeAllListeners();
            clearTimeout(this.timerId);
        } catch (error) {
            throw new ConusmaException("ConusmaWorker","terminated interval error",error);
        }
    }
}
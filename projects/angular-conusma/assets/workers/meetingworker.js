var MeetingUserId;
var Token;
var url;
var IAmHereUrl;
function Start(){
    if(Token != null && Token != undefined &&  MeetingUserId != null && MeetingUserId != undefined && url != null && url != undefined)
    {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + Token);
        xhr.send(JSON.stringify({
            MeetingUserId: MeetingUserId
        }));
        xhr.onload = function(e) {
            if (this.status == 200) {
                postMessage(xhr.response);
            }
          };
    }
    setTimeout(Start(), 2000);
}
function IAmHere()
{
    if(Token != null && Token != undefined &&  MeetingUserId != null && MeetingUserId != undefined && IAmHereUrl != null && IAmHereUrl != undefined)
    {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", IAmHereUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + Token);
        xhr.send(JSON.stringify({
            MeetingUserId: MeetingUserId
        }));
    }
    setTimeout(IAmHere(), 20000);

}
onmessage = function(e) {
    MeetingUserId = e.data.MeetingUserId;
    Token = e.data.Token;
    url = e.data.url;
    IAmHereUrl = e.data.IAmHereUrl;
  }
  IAmHere();
  Start();
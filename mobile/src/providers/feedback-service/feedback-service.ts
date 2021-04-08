import { ConstantServiceProvider } from "./../constant-service/constant-service";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LocalNotifications } from '@ionic-native/local-notifications';


@Injectable()
export class FeedbackServiceProvider {
  
  countId:number=1;
  
  constructor(
    public http: HttpClient,
    private constantService: ConstantServiceProvider,
    private localNotification: LocalNotifications
  ) {}

  submitFeedback(feedback: FeedBackModel) {

    this.http
      .post(this.constantService.getConstantObject().feedBackMailUrl, feedback)
      .subscribe(data => {
        this.localNotification.schedule({
          id: this.countId++,
          title: 'Success',
          text: 'Feedback has been sent successfully',
          lockscreen:true,
          priority:2,
          vibrate:true,
          icon:"file://assets/icon/success.png",
          smallIcon:"file://assets/icon/success.png",
          color:'rgb(250,128,114)'
        });

      },error=>{

        this.localNotification.schedule({
          id: this.countId++,
          title: 'Failure',
          text: 'Feedback submission failed',
          lockscreen:true,
          priority:2,
          vibrate:true,
          icon:"file://assets/icon/error.png",
          smallIcon:"file://assets/icon/success.png",
          color:'rgb(250,128,114)'
        });
      });
      
  }
}

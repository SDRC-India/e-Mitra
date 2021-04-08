import { ConstantServiceProvider } from "./../../providers/constant-service/constant-service";
import { UtilServiceProvider } from "./../../providers/util-service/util-service";
import { Device } from "@ionic-native/device";
import { Component, ViewChild } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  IonicApp,
  Platform,
  AlertController,
  ToastController
} from "ionic-angular";
import { FeedbackServiceProvider } from "../../providers/feedback-service/feedback-service";
import { NgModel } from "@angular/forms";

/**
 * @author Harsh Pratyush
 */
@IonicPage()
@Component({
  selector: "page-feedback",
  templateUrl: "feedback.html"
})
export class FeedbackPage {
  unregisterBackButtonAction: any;

  name: string;
  email: string;
  contact: string;
  feedbackText: string;

  @ViewChild("emailInput")
  emailInput: NgModel;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private platform: Platform,
    private app: IonicApp,
    private feedbackServiceProvider: FeedbackServiceProvider,
    private device: Device,
    private alertCtrl: AlertController,
    private utilServiceProvider: UtilServiceProvider,
    private constantServiceProvider:ConstantServiceProvider,
    public toastCtrl: ToastController
  ) {}

  ionViewDidEnter() {
    this.initializeBackButtonCustomHandler();
  }

  /**
   * This method will initialize the hardware backbutton
   * It will check the status of loadingStatus variable
   * if it is true then customHandleBackButton() will call
   *
   * @author Harsh Pratyush
   * @since 1.0.0
   */
  public initializeBackButtonCustomHandler(): void {
    this.unregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => {
        // if(this.comparsionServiceProvider)
        this.customHandleBackButton();
      },
      10
    );
  }

  /**
   * This method will show a confirmation popup to exit the app, when user click on the hardware back button
   * in the home page
   *
   * @author Harsh Pratyush
   * @since 1.0.0
   */
  private customHandleBackButton(): void {
    const overlayView = this.app._overlayPortal._views[0];
    if (overlayView && overlayView.dismiss) {
      overlayView.dismiss();
    } else {
      this.navCtrl.setRoot("HomePage");
    }
  }
  /**
   * Fired when you leave a page, before it stops being the active one
   * Unregister the hardware backbutton
   *
   * @author Harsh Pratyush
   * @since 1.0.0
   */
  ionViewWillLeave() {
    // Unregister the custom back button action for this page
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
  }

  reset() {
    let alert = this.alertCtrl.create({
      title: "Reset",
      message: "Are you sure you want to clear all the selections ?",
      enableBackdropDismiss: false,
      buttons: [
        {
          text: "Cancel",
          handler: () => {}
        },
        {
          text: "Ok",
          handler: () => {
            this.name = null;
            this.contact = null;
            this.email = null;
            this.feedbackText = null;
          }
        }
      ]
    });
    alert.present();
  }

  submit() {
    if (!this.name || this.name.trim() == "" || this.name == null) {
      this.utilServiceProvider.showErrorToast(this.constantServiceProvider.getErroObject().nameError);
    } else if (!this.email || !this.emailInput.valid) {
      this.utilServiceProvider.showErrorToast(
        !this.email ? this.constantServiceProvider.getErroObject().emailRequired : this.constantServiceProvider.getErroObject().emailInvalid
      );
    } 
    // else if (!this.contact || this.contact.length < 10) {
    //   this.utilServiceProvider.showErrorToast(
    //     !this.contact
    //       ? this.constantServiceProvider.getErroObject().contactRequired
    //       : this.constantServiceProvider.getErroObject().contactLength
    //   );
    // }
     else if (
      !this.feedbackText ||
      this.feedbackText.trim() == "" ||
      this.feedbackText == null
    ) {
      this.utilServiceProvider.showErrorToast(this.constantServiceProvider.getErroObject().feedbackError);
    } 
    
    else if(!this.utilServiceProvider.checkInternet())
    {
      this.utilServiceProvider.showErrorToast(this.constantServiceProvider.getErroObject().internetConnectionError);
    }
    else {
      let feedback: FeedBackModel = {
        name: this.name,
        // contact: this.contact,
        email: this.email,
        feedback: this.feedbackText,
        osversion: this.device.version,
        manufacturerName: this.device.manufacturer,
        platformType: this.device.platform,
        model: this.device.model,
        serialNum: this.device.serial,
        uuid:this.device.uuid
      };
      this.presentToast();
      this.feedbackServiceProvider.submitFeedback(feedback);
      this.feedbackText=null;
      
    }
  }

  presentToast() {
    let toast = this.toastCtrl.create({
      message: "Sending Feedback....",
      duration: 3000,
      cssClass: "exit-toast"
    });
    toast.present();
  }

  limitLength()
  {
    this.feedbackText=this.feedbackText.substring(0,1000);
  }
}

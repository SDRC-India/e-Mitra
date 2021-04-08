import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FeedbackPage } from './feedback';
import { FeedbackServiceProvider } from '../../providers/feedback-service/feedback-service';

@NgModule({
  declarations: [
    FeedbackPage,
  ],
  imports: [
    IonicPageModule.forChild(FeedbackPage),
  ],providers:[FeedbackServiceProvider]
})
export class FeedbackPageModule {}

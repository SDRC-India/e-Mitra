import {
HttpClient
}from '@angular/common/http'; 
import {
Injectable
}from '@angular/core'; 
import {
UtilServiceProvider
}from '../util-service/util-service'; 
import {
MessageServiceProvider
}from '../message-service/message-service'; 
import 'rxjs/add/operator/toPromise'; 
import {
AlertController
}from 'ionic-angular'; 
import {
ConstantServiceProvider
}from '../constant-service/constant-service'; 
import {
PouchdbServiceProvider
}from '../pouchdb-service/pouchdb-service'; 


/**
 * This service will deal with sync codes
 * @since 1.0.0
 * @author Ratikanta 
 * @export
 * @class SyncServiceProvider
 */
@Injectable()
export class SyncServiceProvider {
count:number = 0; 
errorMsg:string = ''
config:SynchronizationDateMaster[]
  constructor(
public http:HttpClient, 
private utilService:UtilServiceProvider, 
private messageService:MessageServiceProvider, 
private alertController:AlertController, 
private pouchdbService:PouchdbServiceProvider, 
private constantService:ConstantServiceProvider
  ) {}

/**
   * This method will sync data with the server
   * @since 1.0.0
   * @author Harsh Pratyush (harsh@sdrc.co.in)
   * @memberof SyncServiceProvider
   */
async sync() {
//check intenet connetion
if (this.utilService.checkInternet()) {
this.utilService.showLoader(this.messageService.messages.syncing)

let db = await this.pouchdbService.getDB(); 

let doc = await db.get(this.constantService.getConstantObject().docName_SynChronizationMaster)

this.config = doc.data as SynchronizationDateMaster[]; 

let syncData =  {
areaSyncDate:this.config.filter(d => d.tableName === 'area')[0].lastModifiedDate, 
areaLevelSyncDate:this.config.filter(d => d.tableName === 'arealevel')[0].lastModifiedDate, 
unitSyncDate:this.config.filter(d => d.tableName === 'unit')[0].lastModifiedDate, 
indicatorSyncDate:this.config.filter(d => d.tableName === 'indicator')[0].lastModifiedDate, 
subgroupSyncDate:this.config.filter(d => d.tableName === 'subgroup')[0].lastModifiedDate, 
sectorSyncDate:this.config.filter(d => d.tableName === 'sector')[0].lastModifiedDate, 
sourceSyncDate:this.config.filter(d => d.tableName === 'source')[0].lastModifiedDate
}


let dataSyncStatus:MasterDataModel = await this.http.post(this.constantService.getConstantObject().syncMasterDataUrl, syncData).toPromise()as MasterDataModel; 
let syncResult = false
if (dataSyncStatus.synchronizationDateMasterList.filter(d => d.tableName === 'data')[0].lastModifiedDate != this.config.filter(d => d.tableName === 'data')[0].lastModifiedDate) {
   syncResult = await this.pouchdbService.sync(); 
}
else {
syncResult = true; 
}



//setting existing config value to config property

let sync =false
if(syncResult)
 sync=await this.pouchdbService.updateMasterSynchronizeData(dataSyncStatus); 


this.utilService.stopLoader()

if (syncResult && sync)
{
  this.errorMsg = 'Data Updated'
}

else
      this.errorMsg = 'Sync Failed'

this.showSyncReport(); 
}else {
//show no internet message
this.utilService.showErrorToast(this.constantService.getConstantObject().noInternetMsg)
}


}

/**
   * This method will check thevsync count
   * @since 1.0.0
   * @author Subhadarshani
   * @memberof SyncServiceProvider
   */
checkSynCount() {
if (this.count == 8) {
this.count = 0

      this.savelatestSyncDate(); 
this.utilService.stopLoader()
this.showSyncReport(); 
}
}
/**
   * This method is going to save the latest sync date in config doc.
   * @author Subhadarshani
   * @since 0.0.1 * 
   * @private
   * @memberof SyncServiceProvider
   */
async savelatestSyncDate() {
//putting latest  source sync  date in config.
//code start
let db = this.pouchdbService.getDB()
let doc = await db.get(this.constantService.getConstantObject().docName_config)
await db.put( {
_id:this.constantService.getConstantObject().docName_config, 
_rev:doc._rev, 
data:this.config

    }); 
//code end
}
/**
   * This method is going to show the sync report
   * @author Subhadarshani
   * @since 0.0.1 * 
   * @private
   * @memberof SyncServiceProvider
   */
private showSyncReport() {
if (this.errorMsg.length == 0) {
this.errorMsg = this.messageService.messages.syncSyccess
    }
let alert = this.alertController.create( {
title:'Sync report', 
cssClass:'syncModal', 
message:this.errorMsg, 
buttons:[ {
text:'OK', 
handler:() =>  {

}
}]
    }); 
alert.present(); 


}


}

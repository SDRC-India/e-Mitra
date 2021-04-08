import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { PouchdbServiceProvider } from "../pouchdb-service/pouchdb-service";
import { ConstantServiceProvider } from "../constant-service/constant-service";
import { UtilServiceProvider } from "../util-service/util-service";

/**
 *
 * @author Harsh Pratyush (harsh@sdrc.co.in)
 * @export
 * @class CustomViewServiceProvider
 */
@Injectable()
export class CustomViewServiceProvider {
  //this loadingStatus variable is taken to check the loading status
  loadingStatus: boolean = false;

  constructor(
    public pouchdbService: PouchdbServiceProvider,
    private constantServiceProvider: ConstantServiceProvider,
    private utilServiceProvider: UtilServiceProvider,
    private constantService: ConstantServiceProvider,
    private httpClient: HttpClient
  ) {}

  /**
   *
   *
   * @param {string} areaId
   * @param {Number[]} indicatorIds
   * @param {Number[]} nonKPIIndicator
   * @returns This method will return the data for a area for selected indicators for all source
   * @memberof CustomViewServiceProvider
   */
  async getGeographyWiseComparision(
    areaId: string,
    indicatorIds: Number[],
    nonKPIIndicator: Number[]
  ) {
    this.utilServiceProvider.showLoader(
      this.constantService.getConstantObject().loadingData
    );
    this.loadingStatus = false;
    let sources: Set<string> = new Set();

    let dataMap: Map<String, Map<String, String>> = new Map();
    let totalDataMap: Map<String, IDBData[]> = new Map();
    let array: IDBData[] = [];

    // if there is any non kpi indicator then we will call the server
    if (nonKPIIndicator.length && this.utilServiceProvider.checkInternet()) {
      try {
        indicatorIds.forEach(element => {
          nonKPIIndicator.push(element);
        });
        let done = false;
        let i = 0;
        while (!done) {
          let URL =
            this.constantService.getConstantObject().customViewUrl +
            i++ +
            "?indicatorSlugIds=" +
            nonKPIIndicator +
            "&areaCodes=" +
            [areaId] +
            "&searchType=2";

          let data: IData[] = <IData[]>(
            await this.httpClient.get(URL).toPromise()
          );
          if (data.length > 0) Array.prototype.push.apply(array, data);
          else done = true;
        }
      } catch (e) {}
    } 
    
    // this method will get offline data for all the offline indicator
    else if (
      indicatorIds.length &&
      !(nonKPIIndicator.length && this.utilServiceProvider.checkInternet())
    ) {
      let data: IDBData[] = [];
      try {
       let  jsondata = (await this.httpClient
          .get("assets/data/" + areaId + ".json")
          .toPromise()) as IJsonData[];
    data = this.pouchdbService.convertJsonDataToIDBData(jsondata);
      } catch {
        data = [];
      }
      array = data.filter(
        d => indicatorIds.indexOf(d.indicator.slugidindicator) > -1
      );
    }

    // sorting data with custom sorter @UtilServiceProvider.sortMonthlyArray
    array.sort(this.utilServiceProvider.sortMonthlyArray);

      // this piece of code will keep the data in a map with value as the a object containting MRT details along with all the datas
    // from previous timeperiod
    array.forEach(element => {
      sources.add(element.src.sourceName);
      if (dataMap.has(element.indicator.iName)) {
        dataMap
          .get(element.indicator.iName)
          .set(
            element.src.sourceName,
            element.value + "\n (" + element.tp + ")"
          );
        totalDataMap.get(element.indicator.iName).push(element);
      } else {
        let valueMap: Map<String, String> = new Map();
        valueMap.set(
          element.src.sourceName,
          element.value + " \n (" + element.tp + ")"
        );
        dataMap.set(element.indicator.iName, valueMap);
        totalDataMap.set(element.indicator.iName, [element]);
      }
    });

    let geographyWiseComparision: CustomViewTableData = {
      sources: sources,
      values: dataMap,
      indicatorData: totalDataMap
    };

    this.utilServiceProvider.stopLoader();
    this.loadingStatus = true;
    return geographyWiseComparision;
  }

  /**
   *
   *
   * @param {string[]} areas
   * @param {Number} indicatorId
   * @param {boolean} isOffline
   * @returns This method will return the data for a single indicator for selected areas for all source
   * @memberof CustomViewServiceProvider
   */
  async getIndicatorWiseComparision(
    areas: string[],
    indicatorId: Number,
    isOffline: boolean
  ) {
    this.utilServiceProvider.showLoader(
      this.constantService.getConstantObject().loadingData
    );
    this.loadingStatus = false;

    let sources: Set<string> = new Set();

    let dataMap: Map<String, Map<String, String>> = new Map();
    let array: IDBData[] = [];
    let totalDataMap: Map<String, IDBData[]> = new Map();

    // getting all the offline indicator when only offline indicator is selected
    if (isOffline) {
      let data: IDBData[] = [];
      // for (let i = 0; i < areas.length; i++)
       {
        try {
          let jsonData = (await this.httpClient
            .get("assets/data/" + indicatorId + ".json")
            .toPromise()) as IJsonData[];
         data= this.pouchdbService.convertJsonDataToIDBData(jsonData);   
          // Array.prototype.push.apply(data, areaData);
        } catch {
          data = [];
        }
        // array=data.filter(d=>areas.indexOf(d.area.code)>-1);
        array = data.filter(d => d.indicator.slugidindicator == indicatorId);
      }
    } 
    // getting data from the main server when indicator is non-kpi
    else {
      try {
        let done = false;
        let i = 0;
        while (!done) {
          let URL =
            this.constantService.getConstantObject().customViewUrl +
            i++ +
            "?indicatorSlugIds=" +
            [indicatorId] +
            "&areaCodes=" +
            areas +
            "&searchType=1";
          let data: IData[] = <IData[]>(
            await this.httpClient.get(URL).toPromise()
          );
          if (data.length > 0) Array.prototype.push.apply(array, data);
          else done = true;
        }
      } catch (e) {
        this.utilServiceProvider.stopLoader();
        this.loadingStatus = true;
      }
    }

    // sorting data
    array.sort(this.utilServiceProvider.sortMonthlyArray);

      // this piece of code will keep the data in a map with value as the a object containting MRT details along with all the datas
    // from previous timeperiod
    array.forEach(element => {
      sources.add(element.src.sourceName);
      if (dataMap.has(element.area.areaname)) {
        dataMap
          .get(element.area.areaname)
          .set(
            element.src.sourceName,
            element.value + "\n (" + element.tp + ")"
          );
        totalDataMap.get(element.area.areaname).push(element);
      } else {
        let valueMap: Map<String, String> = new Map();
        valueMap.set(
          element.src.sourceName,
          element.value + " \n (" + element.tp + ")"
        );
        dataMap.set(element.area.areaname, valueMap);
        totalDataMap.set(element.area.areaname, [element]);
      }
    });

    let geographyWiseComparision: CustomViewTableData = {
      sources: sources,
      values: dataMap,
      indicatorData: totalDataMap
    };
    this.utilServiceProvider.stopLoader();
    this.loadingStatus = true;

    return geographyWiseComparision;
  }

  async getSector() {
    let db = this.pouchdbService.getDB();
    let doc = await db.get(
      this.constantServiceProvider.getConstantObject().docName_sector
    );
    let sectors: ISector[] = doc.data;

    sectors.sort((a: ISector, b: ISector) => {
      if (a.slugidsector > b.slugidsector) {
        return 1;
      } else if (a.slugidsector < b.slugidsector) {
        return -1;
      } else {
        return 0;
      }
    });

    return sectors;
  }

  async getIndicators() {
    let db = this.pouchdbService.getDB();
    let doc = await db.get(
      this.constantServiceProvider.getConstantObject().docName_indicator
    );
    let indicators: IIndicator[] = doc.data;
    return indicators;
  }

  /**
   *
   * This method will return the data in visualization page of thematic view,geographical profile,data repository
   * @param {IArea} areaId
   * @param {IIndicator} indicatorId
   * @param {IDBData[]} data
   * @returns
   * @memberof CustomViewServiceProvider
   */
  async getCustomViewVisualizationData(
    areaId: IArea,
    indicatorId: IIndicator,
    data: IDBData[]
  ) {
    this.utilServiceProvider.showLoader(
      this.constantService.getConstantObject().loadingData
    );
    this.loadingStatus = false;

    let customViewVisualizationData: Map<String, MultiLineChart> = new Map();
//formating IDBData[] in LineChart Array
     data.forEach(element => {
      let linechart: LineChart = {
        axis: element.tp,
        value: element.value,
        zaxis: element.area.areaname,
        class: indicatorId.recSector.sectorName.replace(" ", "_")
      };

      if (customViewVisualizationData.has(element.src.sourceName)) {
        customViewVisualizationData
          .get(element.src.sourceName)
          .values.push(linechart);
      } else {
        let multiLineChart: MultiLineChart = {
          id: areaId.areaname,
          parentAreaName: areaId.parentAreaCode,
          values: [linechart]
        };
        customViewVisualizationData.set(element.src.sourceName, multiLineChart);
      }
    });

    this.utilServiceProvider.stopLoader();
    this.loadingStatus = true;
    return customViewVisualizationData;
  }

  /**
   * This method will return the source and available indicator with a area
   *
   * @returns
   * @memberof CustomViewServiceProvider
   */
  async getSourceIndicators() {
    let db = this.pouchdbService.getDB();
    let doc = await db.get(
      this.constantServiceProvider.getConstantObject()
        .docName_sourceIndicatorData
    );
    let sourceIndicatorDatas: SourceIndicatorData[] = doc.data;

    sourceIndicatorDatas.sort(
      (a: SourceIndicatorData, b: SourceIndicatorData) => {
        if (a.order > b.order) {
          return 1;
        } else if (a.order < b.order) {
          return -1;
        } else {
          return 0;
        }
      }
    );

    return sourceIndicatorDatas;
  }

  /**
   *
   *
   * @param {String[]} areas
   * @param {Number} indicatorId
   * @param {boolean} isOffline
   * @param {number} source
   * @returns This method will return the data for a single indicator for selected areas for all source for data-repository page
   * @memberof CustomViewServiceProvider
   */
  async getSourceWiseComparision(
    areas: String[],
    indicatorId: Number,
    isOffline: boolean,
    source: number
  ) {
    this.utilServiceProvider.showLoader(
      this.constantService.getConstantObject().loadingData
    );
    this.loadingStatus = false;

    let sources: Set<string> = new Set();

    let dataMap: Map<String, Map<String, String>> = new Map();
    let array: IDBData[] = [];
    let totalDataMap: Map<String, IDBData[]> = new Map();

    //when a KPI indicator is selected
    if (isOffline) {
      let data: IDBData[] = [];
      // for (let i = 0; i < areas.length; i++)
       {
        try {
          try {
            let jsonData = (await this.httpClient
              .get("assets/data/" + indicatorId + ".json")
              .toPromise()) as IJsonData[];
              let areaData = this.pouchdbService.convertJsonDataToIDBData(jsonData);
            Array.prototype.push.apply(data, areaData);
          } catch {
            data = [];
          }
          // array=data.filter(d=>areas.indexOf(d.area.code)>-1);
          array = data.filter(d => d.indicator.slugidindicator == indicatorId);
        } catch (e) {}
      }
    } 
    //when non-kpi is selected
    else {
      try {
        let done = false;
        let i = 0;
        while (!done) {
          let URL =
            this.constantService.getConstantObject().customViewUrl +
            i++ +
            "?indicatorSlugIds=" +
            [indicatorId] +
            "&areaCodes=" +
            areas +
            "&searchType=1";
          let data: IData[] = <IData[]>(
            await this.httpClient.get(URL).toPromise()
          );
          if (data.length > 0) Array.prototype.push.apply(array, data);
          else done = true;
        }
      } catch (e) {
        console.log(e)
        array=[];
      }
    }

    let sourceData = array;
    sourceData.sort(this.utilServiceProvider.sortMonthlyArray);

      // this piece of code will keep the data in a map with value as the a object containting MRT details along with all the datas
    // from previous timeperiod
    sourceData.forEach(element => {
      sources.add(element.src.sourceName);
      if (dataMap.has(element.area.areaname)) {
        dataMap
          .get(element.area.areaname)
          .set(
            element.src.sourceName,
            element.value + "\n (" + element.tp + ")"
          );
        totalDataMap.get(element.area.areaname).push(element);
      } else {
        let valueMap: Map<String, String> = new Map();
        valueMap.set(
          element.src.sourceName,
          element.value + " \n (" + element.tp + ")"
        );
        dataMap.set(element.area.areaname, valueMap);
        totalDataMap.set(element.area.areaname, [element]);
      }
    });

    let geographyWiseComparision: CustomViewTableData = {
      sources: sources,
      values: dataMap,
      indicatorData: totalDataMap
    };
    this.utilServiceProvider.stopLoader();
    this.loadingStatus = true;

    return geographyWiseComparision;
  }
}

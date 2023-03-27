import axios from "axios";

export default {
  name: "Weather",
  data() {
    return {
      WeatherData: [], //ajax獲取的氣象資料
      SunData: {}, //ajax獲取的日出、日沒資料
      SunDataDay: {}, //要渲染在網頁上的日出、日沒資料
      HoursDatas: [], //ajax獲取的3小時氣象資料
      HoursData: [], //要渲染在網頁上的3小時氣象資料
      DateData: [], //日期&時間
      WeekDay: [], //每日預報資料
      NowDay: { Wx: { Text: null, Img: "rain.png" } }, //今日氣象資料
      NavCity: ["臺北市", "新北市", "桃園市", "臺中市", "高雄市"],
      Search: "",
      TargetCity: "臺北市",
    };
  },
  watch: {
    TargetCity: function (val) {
      this.changeCity(val);
      this.GetSun(val);
      this.GetHours(val);
    },
  },
  mounted() {
    this.GetTime();
    axios
      .get(
        "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=CWB-42A0DB50-1C2F-4736-AC60-684BCD54294D"
      )
      .then((response) => {
        this.WeatherData =
          response["data"]["records"]["locations"][0]["location"];
      })
      .then((response) => {
        this.GetWeekDay();
        this.changeCity(this.TargetCity);
      });
    axios
      .get(
        `https://opendata.cwb.gov.tw/api/v1/rest/datastore/A-B0062-001?Authorization=CWB-42A0DB50-1C2F-4736-AC60-684BCD54294D&parameter=SunRiseTime,SunSetTime&timeFrom=${this.DateData[0]}`
      )
      .then((response) => {
        this.SunData = response["data"]["records"]["locations"]["location"];
      })
      .then((response) => {
        this.GetSun(this.TargetCity);
      });
    axios
      .get(
        `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-089?Authorization=CWB-42A0DB50-1C2F-4736-AC60-684BCD54294D&elementName=Wx,T`
      )
      .then((response) => {
        this.HoursDatas =
          response["data"]["records"]["locations"][0]["location"];
      })
      .then((response) => {
        this.GetHours(this.TargetCity);
      });
    setInterval(this.GetTime, 1000);
  },

  methods: {
    changeCity(val) {
      let WeatherNowItem = ["T", "MaxT", "MinT", "RH", "WS", "MinAT", "Wx"];
      /*       T:平均溫度
      MaxT:最高溫度
      MinT:最低溫度
      RH:平均相對溼度(百分比)
      WS:最大風速(公尺/秒)
      MinAT:最低體感溫度
      Wx:天氣現象 */
      let result = {};
      let Weather = this.WeatherData.filter((element) => {
        return element["locationName"] === val;
      });
      //由於filter會返回陣列，因此在後續篩選需要指定array[0]位置
      Weather = Weather[0]["weatherElement"];
      //
      WeatherNowItem.forEach((item) => {
        let obj = Weather.filter((element) => {
          return element["elementName"] === item;
        });
        obj = obj[0]["time"][0]["elementValue"][0]["value"];
        if (item === "Wx") {
          let WxObj = { Text: null, Img: null };
          WxObj.Text = obj;
          WxObj.Img = this.judgeGraph(obj);
          result[item] = WxObj;
        } else {
          result[item] = obj;
        }
      });
      this.NowDay = result;
      //取得一周溫度，因為會和WeekDay放入同一陣列，因此特別處理
      let T = Weather.filter((element) => {
        return element["elementName"] === "T";
      });
      T = T[0]["time"];
      T = T.filter((element, index) => {
        return (index % 2 === 1) & (index < 10);
      });
      for (let i = 0; i < 5; i++) {
        let WeekT = T[i]["elementValue"][0]["value"];
        this.WeekDay[i].T = WeekT;
      }
      //取得一周天氣現象，因為會和WeekDay放入同一陣列，因此特別處理
      let Wx = Weather.filter((element) => {
        return element["elementName"] === "Wx";
      });
      Wx = Wx[0]["time"];
      Wx = Wx.filter((element, index) => {
        return (index % 2 === 1) & (index < 10);
      });
      for (let i = 0; i < 5; i++) {
        // let WeekWx = [];
        let WeekWx = {};
        WeekWx.Text = Wx[i]["elementValue"][0]["value"];
        WeekWx.Img = this.judgeGraph(Wx[i]["elementValue"][0]["value"]);
        this.WeekDay[i].Wx = WeekWx;
      }
    },
    GetSun(city) {
      let SunData = this.SunData;
      let obj = SunData.filter((element) => {
        return element["CountyName"] === city;
      });
      obj = obj[0]["time"][0];
      let result = {
        SunRiseTime: obj.SunRiseTime,
        SunSetTime: obj.SunSetTime,
      };
      this.SunDataDay = result;
    },
    GetHours(city) {
      let result = [];
      let HoursDate = this.HoursDatas;
      let obj = HoursDate.filter((element) => {
        return element["locationName"] === city;
      });
      let Wx = obj[0]["weatherElement"][0]["time"];
      let T = obj[0]["weatherElement"][1]["time"];
      for (let i = 1; i < 6; i++) {
        let HoursObj = {};
        HoursObj.Time = Wx[i]["startTime"];
        let WxText = Wx[i]["elementValue"][0]["value"];
        let WxImg = this.judgeGraph(WxText);
        let WxObj = {
          WxText: WxText,
          Img: WxImg,
        };
        HoursObj.Wx = WxObj;
        HoursObj.T = T[i]["elementValue"][0];
        result.push(HoursObj);
      }
      this.HoursData = result
    },
    NavClick(e) {
      this.TargetCity = e.target.innerText;
    },
    GetTime() {
      this.DateData = [];
      let date = new Date();
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      if (String(month).length < 2) {
        month = "0" + String(month);
      }
      let day = date.getDate();
      let result = String(year) + "-" + String(month) + "-" + String(day);
      this.DateData.push(result);
      let LocalTime = date.toLocaleTimeString();
      let LocalTimeHead = LocalTime.slice(0, 2);
      let LocalTimeButt = LocalTime.slice(2);
      this.DateData.push(LocalTimeHead + " " + LocalTimeButt);
    },
    GetWeekDay() {
      let date = new Date();
      let NowDay = date.getDay();
      let weekHash = {
        1: "星期一",
        2: "星期二",
        3: "星期三",
        4: "星期四",
        5: "星期五",
        6: "星期六",
        0: "星期日",
      };
      for (let i = 0; i < 5; i++) {
        if (NowDay + 1 === 7) {
          NowDay = 0;
          let weatherObj = { T: null, Wx: null, Day: weekHash[NowDay] };
          this.WeekDay.push(weatherObj);
        } else {
          NowDay += 1;
          let weatherObj = { T: null, Wx: null, Day: weekHash[NowDay] };
          this.WeekDay.push(weatherObj);
        }
      }
    },
    //判斷天氣狀況適用於哪一張圖片
    judgeGraph(weather) {
      let graph = {
        雨: "rain.png",
        雲: "clouds.png",
        晴: "clear.png",
        陰: "clouds.png",
      };
      for (let i = 0; i < Object.keys(graph).length; i++) {
        if (weather.includes(Object.keys(graph)[i])) {
          return Object.values(graph)[i];
        }
      }
    },
    SearchBtnClick() {
      this.TargetCity = this.Search;
    },
  },
};

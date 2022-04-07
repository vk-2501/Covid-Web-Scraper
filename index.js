// node index.js --url=https://www.mygov.in/covid-19 --json=covidData.json  --excel=covidata.csv --dataFolder=root
// npm inint -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib





let minimist=require("minimist");
let axios=require("axios");
let jsdom=require("jsdom");
let path=require("path");
let excel=require("excel4node");
let pdf=require("pdf-lib");
let fs = require("fs");
const { createPDFAcroField } = require("pdf-lib");


let args=minimist(process.argv);
let responsekapromise=axios.get(args.url);
responsekapromise.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);
    let document=dom.window.document;
   let coronadata= document.querySelectorAll("div #stateCount > div .views-row");
   let arr=[];
   for(let i=0;i<coronadata.length;i++){
       let statecont={

       };
       statecont.statename=coronadata[i].querySelector("span.st_name").textContent;
       statecont.number=coronadata[i].querySelector("span.st_number").textContent;
       let innerinfo=coronadata[i].querySelectorAll("div.st_all_counts > div");
       statecont.confirm=innerinfo[0].querySelector("div .tick-confirmed >small").textContent;
       statecont.active=innerinfo[1].querySelector("div .tick-active >small").textContent;
       statecont.discharged=innerinfo[2].querySelector("div .tick-discharged >small").textContent;
       statecont.deaths=innerinfo[3].querySelector("div .tick-death >small").textContent;
       statecont.vaccinated=innerinfo[4].querySelector("div .tick-total-vaccine >small").textContent;
    
       arr.push(statecont);

   }

   let dataJSON=JSON.stringify(arr);
   fs.writeFileSync(args.json,dataJSON,"utf-8");

   let states=[];
   for(let i=0;i<arr.length;i++){
       putstate(states,arr[i]);
       fillinfo(states,arr[i]);
   }
   let js=  JSON.stringify(states);
   fs.writeFileSync("coronainfo.json",js,"utf-8");

//    let s=JSON.parse(js);
   createExcelfile(states);
   createfolder(states);

}).catch(function(err){
    console.log(err);
});

function putstate(states,individualstate){
    let state={
        stateName:individualstate.statename,
        info:[]
    };
    states.push(state);
}

function fillinfo(states,individual){

    let idx=-1;
    for(let i=0;i<states.length;i++){
        if(states[i].stateName==individual.statename){
            idx=i;
            break;
        }
    }
    let state1=states[idx];

    state1.info.push({
      num:individual.number,
      confirmcases:individual.confirm,
      activecases:individual.active,
      discharged:individual.discharged,
      totaldeaths:individual.deaths,
      vaccinatedfolk:individual.vaccinated
    });
}

function createExcelfile(states){
    let wb = new excel.Workbook();
    
    for(let j=0;j<states.length;j++){
        let sheet=wb.addWorksheet(states[j].stateName);
        sheet.cell(1,1).string("Number");
        sheet.cell(1,2).string("ConfirmCases");
        sheet.cell(1,3).string("ActiveCases");
        sheet.cell(1,4).string("Discharged");
        sheet.cell(1,5).string("Deaths");
        sheet.cell(1,6).string("Vaccinated");

        

        
            let num=states[j].info[0].num;
            let confirm=states[j].info[0].confirmcases;
            let active=states[j].info[0].activecases;
            let dis=states[j].info[0].discharged;
            let death=states[j].info[0].totaldeaths;
            let vaccine=states[j].info[0].vaccinatedfolk;

            // console.log(states[j].info);

            sheet.cell(2,1).string(num);
            sheet.cell(2,2).string(confirm);
            sheet.cell(2,3).string(active);
            sheet.cell(2,4).string(dis);
            sheet.cell(2,5).string(death);
            sheet.cell(2,6).string(vaccine);

              wb.write(args.excel);

    } 
}

function createfolder(states){
    fs.mkdirSync(args.dataFolder);
    for(let i=0;i<states.length;i++){
        let teamFol=path.join(args.dataFolder,states[i].stateName +".pdf");
        createPDF(states[i].stateName,states[i].info[0],teamFol);
    }
}

function createPDF(stateName,info,fin){

    let s=stateName;
    let num=info.num;
    let conf=info.confirmcases;
    let active=info.activecases;
    let discharged=info.discharged;
    let deaths=info.totaldeaths;
    let vaccine=info.vaccinatedfolk;

    let pdfDoc=pdf.PDFDocument;
    let templatebytes=fs.readFileSync("Template.pdf");
    let templatebyteskapromise=pdfDoc.load(templatebytes);

    templatebyteskapromise.then(function (pdfdoc){
        let page=pdfdoc.getPage(0);
        page.drawText(s,{
            x:200,
            y:640,
            size:15
        });

        page.drawText(num,{
            x:75,
            y:500,
            size:15

        });

        page.drawText(conf,{
            x:150,
            y:500,
            size:15

        });

        page.drawText(active,{
            x:225,
            y:500,
            size:15

        });

        page.drawText(discharged,{
            x:320,
            y:500,
            size:15

        });

        page.drawText(deaths,{
            x:420,
            y:500,
            size:15

        });

        page.drawText(vaccine,{
            x:500,
            y:500,
            size:15

        });

        let promiseTosave=pdfdoc.save();
        promiseTosave.then(function (newbytes){
            fs.writeFileSync(fin,newbytes);
        });

    });

}
 

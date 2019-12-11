var express = require('express')
var shell = require('shelljs')
const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;

export default class App {

  _expressApp
  _db
  _transport

  constructor(config) {
    //this.initMongoDB()
    this.initMailer()
    this.initServer()      
  }

  deploy(req, res) {
    try {
      if (shell.exec(`cd ${process.env.PROJECSTPATH}${req.params.project} && git pull && npm run tsc && pm2 restart 0`).code != 0) {
        //this.store(req.params.project);
        res.status(200).json({ msg: 'ok' });
        this.sendEmail(`${req.params.project} deploy success`, `${req.params.project} deploy success`)
      }else{
        this.sendEmail(`${req.params.project} deploy failed`, "")
      }
    } catch (e) {
      this.sendEmail(`${req.params.project} deploy failed`, e)
    }
  }

  store(projectName: string) {
    const collection = this.db.collection('deployments');
    collection.insertOne({projectName : projectName, date: new Date()})
  }

  sendEmail(subject: string, msg: string) {
   
    const message = {
      from: 'deploy@adias.it',
      to: 'antonio@adias.it',
      subject: subject, 
      text: msg
    };
    
    this.transport.sendMail(message, function(err, info) {
        if (err) {
          console.log(err)
        } else {
          console.log(info);
        }
    });

  }


  initServer() {
    this.expressApp = express();
    this.expressApp.listen(3010, () => {
      console.log('Server running on port 3010!');
    });

    this.expressApp.post('/deploy/:project', this.deploy)
  }

  initMailer() {
    this.transport = nodemailer.createTransport({
      host: `${process.env.SMTP}`,
      port: 465,
      secure: true,
      auth: {
         user: `${process.env.MAIL_USER}`,
         pass: `${process.env.MAIL_PWD}`
      }
    });
  }


  initMongoDB() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'ndw';

    MongoClient.connect(url, (err, client) => {
      
      console.log("Mongodb: connected successfully to server");

      this.db = client.db(dbName);
     
      //client.close();
    });
  }

    // GETTER & SETTER
  public set expressApp(val) {
    this._expressApp = val
  }

  public get expressApp() {
    return this._expressApp
  }

  public set db(val) {
    this._db = val
  }

  public get db() {
    return this._db
  }

  public set transport(val) {
    this._transport = val
  }

  public get transport() {
    return this._transport
  }

}

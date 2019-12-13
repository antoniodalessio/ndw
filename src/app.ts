var express = require('express')
var shell = require('async-shelljs')
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


  async deploy(req, res) {
    
    let commands = [
      {
        cmd: shell.cd,
        args: `${process.env.PROJECSTPATH}${req.params.project}`
      },
      {
        cmd: shell.exec,
        args: `git pull`
      },
      {
        cmd: shell.exec,
        args: `npm run tsc`
      },
      {
        cmd: shell.exec,
        args: `pm2 restart 0`
      },
    ]

    try {
      let result = await commands.reduce( async (previousPromise, next) => {
        let prevresult:any = await previousPromise;
        if (prevresult.code == 0) {
          return next.cmd.call(null,next.args)
        }else{
          return Promise.resolve({code: 1})
        }
      }, Promise.resolve({code: 0}))

      if (result.code == 0) {
        this.sendEmail(`${req.params.project} deploy success`, `${req.params.project} deploy success`)
        res.status(200).json({msg: 'ok'});
      } else {
        res.status(400).json({msg: 'ko', error: 'Something went wrong'});
        this.sendEmail(`${req.params.project} deploy failed`, "")
      }

    } catch(e) {
      this.sendEmail(`${req.params.project} deploy failed`, JSON.stringify(e))
      res.status(400).json({msg: 'ko', error: e});
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

    this.expressApp.post('/deploy/:project', async (req, res) => await this.deploy(req, res))
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

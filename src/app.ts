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
    try {

      let commands = [
        {
          cmd: 'cd',
          args: `${process.env.PROJECSTPATH}${req.params.project}`
        },
        {
          cmd: 'git',
          args: `pull`
        },
        {
          cmd: 'npm',
          args: `run tsc`
        },
        {
          cmd: 'pm2',
          args: `restart 0`
        }
      ]

      let result = await commands.reduce( async (previousPromise, next) => {
        let prevresult:any = await previousPromise;
        let cmd = next.cmd + ' ' + next.args
        let commandExists = await shell.which(next.cmd)
        if (prevresult.code == 0 && commandExists) {
          return shell.exec(cmd)
        }else{
          return Promise.resolve({code: 1})
        }
      }, Promise.resolve({code: 0}))

      console.log("result", result)

      if (result.code == 1) {
        this.sendEmail(`${req.params.project} deploy failed`, "")
        //shell.exit(0)
      }else{
        this.sendEmail(`${req.params.project} deploy success`, `${req.params.project} deploy success`)
      }      

    } catch (e) {
      this.sendEmail(`${req.params.project} deploy failed`, JSON.stringify(e))
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

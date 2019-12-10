var express = require('express')
var shell = require('shelljs')
const MongoClient = require('mongodb').MongoClient;

export default class App {

  _expressApp
  _db

  constructor(config) {
    this.expressApp = express();

    this.initMongoDB()

    this.expressApp.listen(3010, function () {
      console.log('Server running on port 3010!');
    });

    this.expressApp.post('/deploy/:project', (req, res) => {
      shell.exec(`cd ${process.env.PROJECSTPATH}${req.params.project} && git pull && npm run tsc && pm2 restart 0`)
      this.store(req.params.project);
      res.status(200).json({ msg: 'ok' });
    });
  }


  store(projectName: string) {
    const collection = this.db.collection('deployments');
    collection.insertOne({projectName : projectName, date: new Date()})
  }


  initMongoDB() {

    // Connection URL
    const url = 'mongodb://localhost:27017';

    const dbName = 'ndw';

    MongoClient.connect(url, (err, client) => {
      
      console.log("Connected successfully to server");

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

}

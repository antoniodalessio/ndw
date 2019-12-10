var express = require('express')
var shell = require('shelljs')
const MongoClient = require('mongodb').MongoClient;

export default class App {

  _expressApp

  constructor(config) {
    this.expressApp = express();

    this.expressApp.listen(3010, function () {
      console.log('Server running on port 3010!');
    });

    this.expressApp.post('/deploy/:project', function (req, res) {
      shell.exec(`cd ${process.env.PROJECSTPATH}${req.params.project} && git pull && npm run tsc && pm2 restart 0`)
      res.status(200).json({ msg: 'ok' });
    });

    this.initMongoDB()
  }


  initMongoDB() {

    // Connection URL
    const url = 'mongodb://localhost:27017';

    const dbName = 'ndw';

    MongoClient.connect(url, function(err, client) {
      
      console.log("Connected successfully to server");

      const db = client.db(dbName);

      const collection = db.collection('deployments');

      collection.insertMany([
        {a : 1}, {a : 2}, {a : 3}
      ])
     
      client.close();
    });
  }

    // GETTER & SETTER
  public set expressApp(val) {
    this._expressApp = val
  }

  public get expressApp() {
    return this._expressApp
  }

}

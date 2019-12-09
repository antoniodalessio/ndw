var express = require('express')
var shell = require('shelljs')

export default class App {

  _expressApp

  constructor(config) {
    this.expressApp = express();

    this.expressApp.listen(3010, function () {
      console.log('Server running on port 3010!');
    });

    this.expressApp.post('/deploy/:project', function (req, res) {
      shell.exec(`cd /home/pi/Desktop/progetti/${req.params.project} && git pull && npm run tsc && pm2 restart 0`)
      res.status(200).json({ msg: 'ok' });
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

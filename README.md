PiTherm
=======

Temperature sensing application for raspi made with node.js. Includes graphs and real-time updates with websockets.
![PiTherm in action](http://julkinen.salaliitto.com/pitemp/pitemp.png "PiTherm in action")

Installation
------------
The application is set for using digital sensors (i used ds18b20), but it should be fairly easily modified to accomodate other kinds of sensors too.

PiTherm can be set to use almost any database, but atm. only rrd "driver" is supplied. For this your raspi needs to have RRDTool installed.

PiTherm runs on node.js so get it (or compile) for your raspi.

Clone this repo somewhere on your pi, set your settings in a file called `config.json` (check the default config for help).

Install modules with `npm install` or if you want to install the app to your path, use `sudo npm install -g` (note that this requires you to copy the config by hand to the install dir `/usr/local/lib/node_modules/pitherm')

Then just run the server with `./app` or with global install `pitherm`.

For daemonization you have a multitude of solutions, from which the easiest is `screen ./app`



Features
--------
To lessen the stress on the sd-card, all files of the webserver are loaded into memory on startup and also gzipped, deflated and etagged to minimize network traffic. All interactions from the frontend are made with websockets and the graphs are drawn with d3.js.

Currently this version is only tested in chrome, other browsers might not work at all.

You can add as many sensors as you want in the config.json and those sensors will be automatically read. But if you're using the supplied rrd-driver, make sure you also add a ds for each of the sensors. Also all the names set for sensors etc. must match and all the paths set for sensors must be found (the application checks the paths at startup and fails if they're missing).

The frontend color-theme can be changed by changing the name of the theme to point to a css file which name matches (without the extension).

Notice
------
Although all the current features work and are stable, the whole structure of the application might change drastically at any point. The project can be considered somewhere between alpha and beta stage.

License
-------
MIT

by: ok 2013

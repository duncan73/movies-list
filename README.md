# movies-list

Very simple movie listing using data from TMDb. Uses ES6 without transpile therefore latest version of major browsers are necessary to run it.

The aim was to make it really simple so it runs in the browser by just opening index.html.

* Source: [https://github.com/duncan73/movies-list](https://github.com/duncan73/movies-list)


## Quick start

Open __index.html__ in supported browser to run the application.


## Notes to solution

Comments are in code where appropriate. 

The main focus was to make simple ES6 application without need of babel and webpack. This gives interesting opportunity to use MovieApp static methods directly in the events. Event handling can be done via eventlisteners of course. Approach used in the code basically simulates angular's (or react) way of handling events. 

Of course in real production system the setup will be different. Preferably webpack (4+), babel with support of some experimental functions, karma + jasmine + phantomjs and/or chrome (headless) for testing. So this will provide solid and scalable solution with many build options.

The classes are created and named in order to simulate components and services (similar to angular). They can be split into files and imported (if we use webpack etc.). if necessary. Which basically represent MVC model. The app does not use any visual frameworks or jQuery. All is native support of browser. 

For http requests I decided to use _axios_ HTTP client as it supports promises and is very easy to use. I was also considering fetch API but _axios_ seems to be solid solution.   

TMDb returns first 20 movies when requesting now playing movies. In response there is a property which tells how many pages and total results are available. So we are able to get all results using multiple requests. But the requirement was to call the api's only once. Therefore we have only 20 movies (max) on page.


## Browser support

* Chrome *(latest)*
* Firefox *(latest)*
* Opera *(latest)*

Also Edge in latest version should support the app, but this is not tested. 
* Edge *(latest)* (not tested)


## Documentation



## License

The code is available under the [MIT license](LICENSE.txt).

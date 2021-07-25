// initialise fullpage.js
new fullpage('#fullpage', {
  licenseKey: 'OPEN-SOURCE-GPLV3-LICENSE',
  anchors: ['charts'],
  sectionsColor: ['#f7f3de'],
  autoScrolling: true,
  fitToSection: true,
  slidesNavigation: true,
  slidesNavPosition: 'top',

  scrollOverflow: true,

  // events
  afterSlideLoad: function(section, origin, destination, direction) {
    var numberOfIntroduction = 2;
    if (destination.index <= numberOfIntroduction || destination.index > numberOfIntroduction + 3) {
      return;
    }

    var chartFunc = charts['chart' + (destination.index - numberOfIntroduction)];
    chartFunc();
  },
  onSlideLeave: function(section, origin, destination, direction) {
    if (destination.index === 6) {

    }
  }
});

// fullpage_api.setAllowScrolling(false);


// use local object to cache json response
charts.storage = {};
// @param callback: a function that works on k, i.e. of the form function(k) {}
d3.cachedJson = function(url, key, callback) {
	if (charts.storage[key]) {
		// data is in the storage
		callback(JSON.parse(charts.storage[key]));
	} else {
		// not cached, fetch the data from url
		d3.json(url, function(json) {
      charts.storage[key] = JSON.stringify(json);
      callback(json);
    });
	}
}
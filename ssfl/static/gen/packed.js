/*!
 * FullCalendar v1.6.4
 * Docs & License: http://arshaw.com/fullcalendar/
 * (c) 2013 Adam Shaw
 */

/*
 * Use fullcalendar.css for basic styling.
 * For event drag & drop, requires jQuery UI draggable.
 * For event resizing, requires jQuery UI resizable.
 */

(function($, undefined) {


;;

var defaults = {

	// display
	defaultView: 'month',
	aspectRatio: 1.35,
	header: {
		left: 'title',
		center: '',
		right: 'today prev,next'
	},
	weekends: true,
	weekNumbers: false,
	weekNumberCalculation: 'iso',
	weekNumberTitle: 'W',

	// editing
	//editable: false,
	//disableDragging: false,
	//disableResizing: false,

	allDayDefault: true,
	ignoreTimezone: true,

	// event ajax
	lazyFetching: true,
	startParam: 'start',
	endParam: 'end',

	// time formats
	titleFormat: {
		month: 'MMMM yyyy',
		week: "MMM d[ yyyy]{ '—'[ MMM] d yyyy}",
		day: 'dddd, MMM d, yyyy'
	},
	columnFormat: {
		month: 'ddd',
		week: 'ddd M/d',
		day: 'dddd M/d'
	},
	timeFormat: { // for event elements
		'': 'h(:mm)t' // default
	},

	// locale
	isRTL: false,
	firstDay: 0,
	monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
	monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
	dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
	dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
	buttonText: {
		prev: "<span class='fc-text-arrow'>‹</span>",
		next: "<span class='fc-text-arrow'>›</span>",
		prevYear: "<span class='fc-text-arrow'>«</span>",
		nextYear: "<span class='fc-text-arrow'>»</span>",
		today: 'today',
		month: 'month',
		week: 'week',
		day: 'day'
	},

	// jquery-ui theming
	theme: false,
	buttonIcons: {
		prev: 'circle-triangle-w',
		next: 'circle-triangle-e'
	},

	//selectable: false,
	unselectAuto: true,

	dropAccept: '*',

	handleWindowResize: true

};

// right-to-left defaults
var rtlDefaults = {
	header: {
		left: 'next,prev today',
		center: '',
		right: 'title'
	},
	buttonText: {
		prev: "<span class='fc-text-arrow'>›</span>",
		next: "<span class='fc-text-arrow'>‹</span>",
		prevYear: "<span class='fc-text-arrow'>»</span>",
		nextYear: "<span class='fc-text-arrow'>«</span>"
	},
	buttonIcons: {
		prev: 'circle-triangle-e',
		next: 'circle-triangle-w'
	}
};



;;

var fc = $.fullCalendar = { version: "1.6.4" };
var fcViews = fc.views = {};


$.fn.fullCalendar = function(options) {


	// method calling
	if (typeof options == 'string') {
		var args = Array.prototype.slice.call(arguments, 1);
		var res;
		this.each(function() {
			var calendar = $.data(this, 'fullCalendar');
			if (calendar && $.isFunction(calendar[options])) {
				var r = calendar[options].apply(calendar, args);
				if (res === undefined) {
					res = r;
				}
				if (options == 'destroy') {
					$.removeData(this, 'fullCalendar');
				}
			}
		});
		if (res !== undefined) {
			return res;
		}
		return this;
	}

	options = options || {};

	// would like to have this logic in EventManager, but needs to happen before options are recursively extended
	var eventSources = options.eventSources || [];
	delete options.eventSources;
	if (options.events) {
		eventSources.push(options.events);
		delete options.events;
	}


	options = $.extend(true, {},
		defaults,
		(options.isRTL || options.isRTL===undefined && defaults.isRTL) ? rtlDefaults : {},
		options
	);


	this.each(function(i, _element) {
		var element = $(_element);
		var calendar = new Calendar(element, options, eventSources);
		element.data('fullCalendar', calendar); // TODO: look into memory leak implications
		calendar.render();
	});


	return this;

};


// function for adding/overriding defaults
function setDefaults(d) {
	$.extend(true, defaults, d);
}



;;


function Calendar(element, options, eventSources) {
	var t = this;


	// exports
	t.options = options;
	t.render = render;
	t.destroy = destroy;
	t.refetchEvents = refetchEvents;
	t.reportEvents = reportEvents;
	t.reportEventChange = reportEventChange;
	t.rerenderEvents = rerenderEvents;
	t.changeView = changeView;
	t.select = select;
	t.unselect = unselect;
	t.prev = prev;
	t.next = next;
	t.prevYear = prevYear;
	t.nextYear = nextYear;
	t.today = today;
	t.gotoDate = gotoDate;
	t.incrementDate = incrementDate;
	t.formatDate = function(format, date) { return formatDate(format, date, options) };
	t.formatDates = function(format, date1, date2) { return formatDates(format, date1, date2, options) };
	t.getDate = getDate;
	t.getView = getView;
	t.option = option;
	t.trigger = trigger;


	// imports
	EventManager.call(t, options, eventSources);
	var isFetchNeeded = t.isFetchNeeded;
	var fetchEvents = t.fetchEvents;


	// locals
	var _element = element[0];
	var header;
	var headerElement;
	var content;
	var tm; // for making theme classes
	var currentView;
	var elementOuterWidth;
	var suggestedViewHeight;
	var resizeUID = 0;
	var ignoreWindowResize = 0;
	var date = new Date();
	var events = [];
	var _dragElement;



	/* Main Rendering
	-----------------------------------------------------------------------------*/


	setYMD(date, options.year, options.month, options.date);


	function render(inc) {
		if (!content) {
			initialRender();
		}
		else if (elementVisible()) {
			// mainly for the public API
			calcSize();
			_renderView(inc);
		}
	}


	function initialRender() {
		tm = options.theme ? 'ui' : 'fc';
		element.addClass('fc');
		if (options.isRTL) {
			element.addClass('fc-rtl');
		}
		else {
			element.addClass('fc-ltr');
		}
		if (options.theme) {
			element.addClass('ui-widget');
		}

		content = $("<div class='fc-content' style='position:relative'/>")
			.prependTo(element);

		header = new Header(t, options);
		headerElement = header.render();
		if (headerElement) {
			element.prepend(headerElement);
		}

		changeView(options.defaultView);

		if (options.handleWindowResize) {
			$(window).resize(windowResize);
		}

		// needed for IE in a 0x0 iframe, b/c when it is resized, never triggers a windowResize
		if (!bodyVisible()) {
			lateRender();
		}
	}


	// called when we know the calendar couldn't be rendered when it was initialized,
	// but we think it's ready now
	function lateRender() {
		setTimeout(function() { // IE7 needs this so dimensions are calculated correctly
			if (!currentView.start && bodyVisible()) { // !currentView.start makes sure this never happens more than once
				renderView();
			}
		},0);
	}


	function destroy() {

		if (currentView) {
			trigger('viewDestroy', currentView, currentView, currentView.element);
			currentView.triggerEventDestroy();
		}

		$(window).unbind('resize', windowResize);

		header.destroy();
		content.remove();
		element.removeClass('fc fc-rtl ui-widget');
	}


	function elementVisible() {
		return element.is(':visible');
	}


	function bodyVisible() {
		return $('body').is(':visible');
	}



	/* View Rendering
	-----------------------------------------------------------------------------*/


	function changeView(newViewName) {
		if (!currentView || newViewName != currentView.name) {
			_changeView(newViewName);
		}
	}


	function _changeView(newViewName) {
		ignoreWindowResize++;

		if (currentView) {
			trigger('viewDestroy', currentView, currentView, currentView.element);
			unselect();
			currentView.triggerEventDestroy(); // trigger 'eventDestroy' for each event
			freezeContentHeight();
			currentView.element.remove();
			header.deactivateButton(currentView.name);
		}

		header.activateButton(newViewName);

		currentView = new fcViews[newViewName](
			$("<div class='fc-view fc-view-" + newViewName + "' style='position:relative'/>")
				.appendTo(content),
			t // the calendar object
		);

		renderView();
		unfreezeContentHeight();

		ignoreWindowResize--;
	}


	function renderView(inc) {
		if (
			!currentView.start || // never rendered before
			inc || date < currentView.start || date >= currentView.end // or new date range
		) {
			if (elementVisible()) {
				_renderView(inc);
			}
		}
	}


	function _renderView(inc) { // assumes elementVisible
		ignoreWindowResize++;

		if (currentView.start) { // already been rendered?
			trigger('viewDestroy', currentView, currentView, currentView.element);
			unselect();
			clearEvents();
		}

		freezeContentHeight();
		currentView.render(date, inc || 0); // the view's render method ONLY renders the skeleton, nothing else
		setSize();
		unfreezeContentHeight();
		(currentView.afterRender || noop)();

		updateTitle();
		updateTodayButton();

		trigger('viewRender', currentView, currentView, currentView.element);
		currentView.trigger('viewDisplay', _element); // deprecated

		ignoreWindowResize--;

		getAndRenderEvents();
	}



	/* Resizing
	-----------------------------------------------------------------------------*/


	function updateSize() {
		if (elementVisible()) {
			unselect();
			clearEvents();
			calcSize();
			setSize();
			renderEvents();
		}
	}


	function calcSize() { // assumes elementVisible
		if (options.contentHeight) {
			suggestedViewHeight = options.contentHeight;
		}
		else if (options.height) {
			suggestedViewHeight = options.height - (headerElement ? headerElement.height() : 0) - vsides(content);
		}
		else {
			suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
		}
	}


	function setSize() { // assumes elementVisible

		if (suggestedViewHeight === undefined) {
			calcSize(); // for first time
				// NOTE: we don't want to recalculate on every renderView because
				// it could result in oscillating heights due to scrollbars.
		}

		ignoreWindowResize++;
		currentView.setHeight(suggestedViewHeight);
		currentView.setWidth(content.width());
		ignoreWindowResize--;

		elementOuterWidth = element.outerWidth();
	}


	function windowResize() {
		if (!ignoreWindowResize) {
			if (currentView.start) { // view has already been rendered
				var uid = ++resizeUID;
				setTimeout(function() { // add a delay
					if (uid == resizeUID && !ignoreWindowResize && elementVisible()) {
						if (elementOuterWidth != (elementOuterWidth = element.outerWidth())) {
							ignoreWindowResize++; // in case the windowResize callback changes the height
							updateSize();
							currentView.trigger('windowResize', _element);
							ignoreWindowResize--;
						}
					}
				}, 200);
			}else{
				// calendar must have been initialized in a 0x0 iframe that has just been resized
				lateRender();
			}
		}
	}



	/* Event Fetching/Rendering
	-----------------------------------------------------------------------------*/
	// TODO: going forward, most of this stuff should be directly handled by the view


	function refetchEvents() { // can be called as an API method
		clearEvents();
		fetchAndRenderEvents();
	}


	function rerenderEvents(modifiedEventID) { // can be called as an API method
		clearEvents();
		renderEvents(modifiedEventID);
	}


	function renderEvents(modifiedEventID) { // TODO: remove modifiedEventID hack
		if (elementVisible()) {
			currentView.setEventData(events); // for View.js, TODO: unify with renderEvents
			currentView.renderEvents(events, modifiedEventID); // actually render the DOM elements
			currentView.trigger('eventAfterAllRender');
		}
	}


	function clearEvents() {
		currentView.triggerEventDestroy(); // trigger 'eventDestroy' for each event
		currentView.clearEvents(); // actually remove the DOM elements
		currentView.clearEventData(); // for View.js, TODO: unify with clearEvents
	}


	function getAndRenderEvents() {
		if (!options.lazyFetching || isFetchNeeded(currentView.visStart, currentView.visEnd)) {
			fetchAndRenderEvents();
		}
		else {
			renderEvents();
		}
	}


	function fetchAndRenderEvents() {
		fetchEvents(currentView.visStart, currentView.visEnd);
			// ... will call reportEvents
			// ... which will call renderEvents
	}


	// called when event data arrives
	function reportEvents(_events) {
		events = _events;
		renderEvents();
	}


	// called when a single event's data has been changed
	function reportEventChange(eventID) {
		rerenderEvents(eventID);
	}



	/* Header Updating
	-----------------------------------------------------------------------------*/


	function updateTitle() {
		header.updateTitle(currentView.title);
	}


	function updateTodayButton() {
		var today = new Date();
		if (today >= currentView.start && today < currentView.end) {
			header.disableButton('today');
		}
		else {
			header.enableButton('today');
		}
	}



	/* Selection
	-----------------------------------------------------------------------------*/


	function select(start, end, allDay) {
		currentView.select(start, end, allDay===undefined ? true : allDay);
	}


	function unselect() { // safe to be called before renderView
		if (currentView) {
			currentView.unselect();
		}
	}



	/* Date
	-----------------------------------------------------------------------------*/


	function prev() {
		renderView(-1);
	}


	function next() {
		renderView(1);
	}


	function prevYear() {
		addYears(date, -1);
		renderView();
	}


	function nextYear() {
		addYears(date, 1);
		renderView();
	}


	function today() {
		date = new Date();
		renderView();
	}


	function gotoDate(year, month, dateOfMonth) {
		if (year instanceof Date) {
			date = cloneDate(year); // provided 1 argument, a Date
		}else{
			setYMD(date, year, month, dateOfMonth);
		}
		renderView();
	}


	function incrementDate(years, months, days) {
		if (years !== undefined) {
			addYears(date, years);
		}
		if (months !== undefined) {
			addMonths(date, months);
		}
		if (days !== undefined) {
			addDays(date, days);
		}
		renderView();
	}


	function getDate() {
		return cloneDate(date);
	}



	/* Height "Freezing"
	-----------------------------------------------------------------------------*/


	function freezeContentHeight() {
		content.css({
			width: '100%',
			height: content.height(),
			overflow: 'hidden'
		});
	}


	function unfreezeContentHeight() {
		content.css({
			width: '',
			height: '',
			overflow: ''
		});
	}



	/* Misc
	-----------------------------------------------------------------------------*/


	function getView() {
		return currentView;
	}


	function option(name, value) {
		if (value === undefined) {
			return options[name];
		}
		if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
			options[name] = value;
			updateSize();
		}
	}


	function trigger(name, thisObj) {
		if (options[name]) {
			return options[name].apply(
				thisObj || _element,
				Array.prototype.slice.call(arguments, 2)
			);
		}
	}



	/* External Dragging
	------------------------------------------------------------------------*/

	if (options.droppable) {
		$(document)
			.bind('dragstart', function(ev, ui) {
				var _e = ev.target;
				var e = $(_e);
				if (!e.parents('.fc').length) { // not already inside a calendar
					var accept = options.dropAccept;
					if ($.isFunction(accept) ? accept.call(_e, e) : e.is(accept)) {
						_dragElement = _e;
						currentView.dragStart(_dragElement, ev, ui);
					}
				}
			})
			.bind('dragstop', function(ev, ui) {
				if (_dragElement) {
					currentView.dragStop(_dragElement, ev, ui);
					_dragElement = null;
				}
			});
	}


}

;;

function Header(calendar, options) {
	var t = this;


	// exports
	t.render = render;
	t.destroy = destroy;
	t.updateTitle = updateTitle;
	t.activateButton = activateButton;
	t.deactivateButton = deactivateButton;
	t.disableButton = disableButton;
	t.enableButton = enableButton;


	// locals
	var element = $([]);
	var tm;



	function render() {
		tm = options.theme ? 'ui' : 'fc';
		var sections = options.header;
		if (sections) {
			element = $("<table class='fc-header' style='width:100%'/>")
				.append(
					$("<tr/>")
						.append(renderSection('left'))
						.append(renderSection('center'))
						.append(renderSection('right'))
				);
			return element;
		}
	}


	function destroy() {
		element.remove();
	}


	function renderSection(position) {
		var e = $("<td class='fc-header-" + position + "'/>");
		var buttonStr = options.header[position];
		if (buttonStr) {
			$.each(buttonStr.split(' '), function(i) {
				if (i > 0) {
					e.append("<span class='fc-header-space'/>");
				}
				var prevButton;
				$.each(this.split(','), function(j, buttonName) {
					if (buttonName == 'title') {
						e.append("<span class='fc-header-title'><h2> </h2></span>");
						if (prevButton) {
							prevButton.addClass(tm + '-corner-right');
						}
						prevButton = null;
					}else{
						var buttonClick;
						if (calendar[buttonName]) {
							buttonClick = calendar[buttonName]; // calendar method
						}
						else if (fcViews[buttonName]) {
							buttonClick = function() {
								button.removeClass(tm + '-state-hover'); // forget why
								calendar.changeView(buttonName);
							};
						}
						if (buttonClick) {
							var icon = options.theme ? smartProperty(options.buttonIcons, buttonName) : null; // why are we using smartProperty here?
							var text = smartProperty(options.buttonText, buttonName); // why are we using smartProperty here?
							var button = $(
								"<span class='fc-button fc-button-" + buttonName + " " + tm + "-state-default'>" +
									(icon ?
										"<span class='fc-icon-wrap'>" +
											"<span class='ui-icon ui-icon-" + icon + "'/>" +
										"</span>" :
										text
										) +
								"</span>"
								)
								.click(function() {
									if (!button.hasClass(tm + '-state-disabled')) {
										buttonClick();
									}
								})
								.mousedown(function() {
									button
										.not('.' + tm + '-state-active')
										.not('.' + tm + '-state-disabled')
										.addClass(tm + '-state-down');
								})
								.mouseup(function() {
									button.removeClass(tm + '-state-down');
								})
								.hover(
									function() {
										button
											.not('.' + tm + '-state-active')
											.not('.' + tm + '-state-disabled')
											.addClass(tm + '-state-hover');
									},
									function() {
										button
											.removeClass(tm + '-state-hover')
											.removeClass(tm + '-state-down');
									}
								)
								.appendTo(e);
							disableTextSelection(button);
							if (!prevButton) {
								button.addClass(tm + '-corner-left');
							}
							prevButton = button;
						}
					}
				});
				if (prevButton) {
					prevButton.addClass(tm + '-corner-right');
				}
			});
		}
		return e;
	}


	function updateTitle(html) {
		element.find('h2')
			.html(html);
	}


	function activateButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.addClass(tm + '-state-active');
	}


	function deactivateButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.removeClass(tm + '-state-active');
	}


	function disableButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.addClass(tm + '-state-disabled');
	}


	function enableButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.removeClass(tm + '-state-disabled');
	}


}

;;

fc.sourceNormalizers = [];
fc.sourceFetchers = [];

var ajaxDefaults = {
	dataType: 'json',
	cache: false
};

var eventGUID = 1;


function EventManager(options, _sources) {
	var t = this;


	// exports
	t.isFetchNeeded = isFetchNeeded;
	t.fetchEvents = fetchEvents;
	t.addEventSource = addEventSource;
	t.removeEventSource = removeEventSource;
	t.updateEvent = updateEvent;
	t.renderEvent = renderEvent;
	t.removeEvents = removeEvents;
	t.clientEvents = clientEvents;
	t.normalizeEvent = normalizeEvent;


	// imports
	var trigger = t.trigger;
	var getView = t.getView;
	var reportEvents = t.reportEvents;


	// locals
	var stickySource = { events: [] };
	var sources = [ stickySource ];
	var rangeStart, rangeEnd;
	var currentFetchID = 0;
	var pendingSourceCnt = 0;
	var loadingLevel = 0;
	var cache = [];


	for (var i=0; i<_sources.length; i++) {
		_addEventSource(_sources[i]);
	}



	/* Fetching
	-----------------------------------------------------------------------------*/


	function isFetchNeeded(start, end) {
		return !rangeStart || start < rangeStart || end > rangeEnd;
	}


	function fetchEvents(start, end) {
		rangeStart = start;
		rangeEnd = end;
		cache = [];
		var fetchID = ++currentFetchID;
		var len = sources.length;
		pendingSourceCnt = len;
		for (var i=0; i<len; i++) {
			fetchEventSource(sources[i], fetchID);
		}
	}


	function fetchEventSource(source, fetchID) {
		_fetchEventSource(source, function(events) {
			if (fetchID == currentFetchID) {
				if (events) {

					if (options.eventDataTransform) {
						events = $.map(events, options.eventDataTransform);
					}
					if (source.eventDataTransform) {
						events = $.map(events, source.eventDataTransform);
					}
					// TODO: this technique is not ideal for static array event sources.
					//  For arrays, we'll want to process all events right in the beginning, then never again.

					for (var i=0; i<events.length; i++) {
						events[i].source = source;
						normalizeEvent(events[i]);
					}
					cache = cache.concat(events);
				}
				pendingSourceCnt--;
				if (!pendingSourceCnt) {
					reportEvents(cache);
				}
			}
		});
	}


	function _fetchEventSource(source, callback) {
		var i;
		var fetchers = fc.sourceFetchers;
		var res;
		for (i=0; i<fetchers.length; i++) {
			res = fetchers[i](source, rangeStart, rangeEnd, callback);
			if (res === true) {
				// the fetcher is in charge. made its own async request
				return;
			}
			else if (typeof res == 'object') {
				// the fetcher returned a new source. process it
				_fetchEventSource(res, callback);
				return;
			}
		}
		var events = source.events;
		if (events) {
			if ($.isFunction(events)) {
				pushLoading();
				events(cloneDate(rangeStart), cloneDate(rangeEnd), function(events) {
					callback(events);
					popLoading();
				});
			}
			else if ($.isArray(events)) {
				callback(events);
			}
			else {
				callback();
			}
		}else{
			var url = source.url;
			if (url) {
				var success = source.success;
				var error = source.error;
				var complete = source.complete;

				// retrieve any outbound GET/POST $.ajax data from the options
				var customData;
				if ($.isFunction(source.data)) {
					// supplied as a function that returns a key/value object
					customData = source.data();
				}
				else {
					// supplied as a straight key/value object
					customData = source.data;
				}

				// use a copy of the custom data so we can modify the parameters
				// and not affect the passed-in object.
				var data = $.extend({}, customData || {});

				var startParam = firstDefined(source.startParam, options.startParam);
				var endParam = firstDefined(source.endParam, options.endParam);
				if (startParam) {
					data[startParam] = Math.round(+rangeStart / 1000);
				}
				if (endParam) {
					data[endParam] = Math.round(+rangeEnd / 1000);
				}

				pushLoading();
				$.ajax($.extend({}, ajaxDefaults, source, {
					data: data,
					success: function(events) {
						events = events || [];
						var res = applyAll(success, this, arguments);
						if ($.isArray(res)) {
							events = res;
						}
						callback(events);
					},
					error: function() {
						applyAll(error, this, arguments);
						callback();
					},
					complete: function() {
						applyAll(complete, this, arguments);
						popLoading();
					}
				}));
			}else{
				callback();
			}
		}
	}



	/* Sources
	-----------------------------------------------------------------------------*/


	function addEventSource(source) {
		source = _addEventSource(source);
		if (source) {
			pendingSourceCnt++;
			fetchEventSource(source, currentFetchID); // will eventually call reportEvents
		}
	}


	function _addEventSource(source) {
		if ($.isFunction(source) || $.isArray(source)) {
			source = { events: source };
		}
		else if (typeof source == 'string') {
			source = { url: source };
		}
		if (typeof source == 'object') {
			normalizeSource(source);
			sources.push(source);
			return source;
		}
	}


	function removeEventSource(source) {
		sources = $.grep(sources, function(src) {
			return !isSourcesEqual(src, source);
		});
		// remove all client events from that source
		cache = $.grep(cache, function(e) {
			return !isSourcesEqual(e.source, source);
		});
		reportEvents(cache);
	}



	/* Manipulation
	-----------------------------------------------------------------------------*/


	function updateEvent(event) { // update an existing event
		var i, len = cache.length, e,
			defaultEventEnd = getView().defaultEventEnd, // getView???
			startDelta = event.start - event._start,
			endDelta = event.end ?
				(event.end - (event._end || defaultEventEnd(event))) // event._end would be null if event.end
				: 0;                                                      // was null and event was just resized
		for (i=0; i<len; i++) {
			e = cache[i];
			if (e._id == event._id && e != event) {
				e.start = new Date(+e.start + startDelta);
				if (event.end) {
					if (e.end) {
						e.end = new Date(+e.end + endDelta);
					}else{
						e.end = new Date(+defaultEventEnd(e) + endDelta);
					}
				}else{
					e.end = null;
				}
				e.title = event.title;
				e.url = event.url;
				e.allDay = event.allDay;
				e.className = event.className;
				e.editable = event.editable;
				e.color = event.color;
				e.backgroundColor = event.backgroundColor;
				e.borderColor = event.borderColor;
				e.textColor = event.textColor;
				normalizeEvent(e);
			}
		}
		normalizeEvent(event);
		reportEvents(cache);
	}


	function renderEvent(event, stick) {
		normalizeEvent(event);
		if (!event.source) {
			if (stick) {
				stickySource.events.push(event);
				event.source = stickySource;
			}
			cache.push(event);
		}
		reportEvents(cache);
	}


	function removeEvents(filter) {
		if (!filter) { // remove all
			cache = [];
			// clear all array sources
			for (var i=0; i<sources.length; i++) {
				if ($.isArray(sources[i].events)) {
					sources[i].events = [];
				}
			}
		}else{
			if (!$.isFunction(filter)) { // an event ID
				var id = filter + '';
				filter = function(e) {
					return e._id == id;
				};
			}
			cache = $.grep(cache, filter, true);
			// remove events from array sources
			for (var i=0; i<sources.length; i++) {
				if ($.isArray(sources[i].events)) {
					sources[i].events = $.grep(sources[i].events, filter, true);
				}
			}
		}
		reportEvents(cache);
	}


	function clientEvents(filter) {
		if ($.isFunction(filter)) {
			return $.grep(cache, filter);
		}
		else if (filter) { // an event ID
			filter += '';
			return $.grep(cache, function(e) {
				return e._id == filter;
			});
		}
		return cache; // else, return all
	}



	/* Loading State
	-----------------------------------------------------------------------------*/


	function pushLoading() {
		if (!loadingLevel++) {
			trigger('loading', null, true, getView());
		}
	}


	function popLoading() {
		if (!--loadingLevel) {
			trigger('loading', null, false, getView());
		}
	}



	/* Event Normalization
	-----------------------------------------------------------------------------*/


	function normalizeEvent(event) {
		var source = event.source || {};
		var ignoreTimezone = firstDefined(source.ignoreTimezone, options.ignoreTimezone);
		event._id = event._id || (event.id === undefined ? '_fc' + eventGUID++ : event.id + '');
		if (event.date) {
			if (!event.start) {
				event.start = event.date;
			}
			delete event.date;
		}
		event._start = cloneDate(event.start = parseDate(event.start, ignoreTimezone));
		event.end = parseDate(event.end, ignoreTimezone);
		if (event.end && event.end <= event.start) {
			event.end = null;
		}
		event._end = event.end ? cloneDate(event.end) : null;
		if (event.allDay === undefined) {
			event.allDay = firstDefined(source.allDayDefault, options.allDayDefault);
		}
		if (event.className) {
			if (typeof event.className == 'string') {
				event.className = event.className.split(/\s+/);
			}
		}else{
			event.className = [];
		}
		// TODO: if there is no start date, return false to indicate an invalid event
	}



	/* Utils
	------------------------------------------------------------------------------*/


	function normalizeSource(source) {
		if (source.className) {
			// TODO: repeat code, same code for event classNames
			if (typeof source.className == 'string') {
				source.className = source.className.split(/\s+/);
			}
		}else{
			source.className = [];
		}
		var normalizers = fc.sourceNormalizers;
		for (var i=0; i<normalizers.length; i++) {
			normalizers[i](source);
		}
	}


	function isSourcesEqual(source1, source2) {
		return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
	}


	function getSourcePrimitive(source) {
		return ((typeof source == 'object') ? (source.events || source.url) : '') || source;
	}


}

;;


fc.addDays = addDays;
fc.cloneDate = cloneDate;
fc.parseDate = parseDate;
fc.parseISO8601 = parseISO8601;
fc.parseTime = parseTime;
fc.formatDate = formatDate;
fc.formatDates = formatDates;



/* Date Math
-----------------------------------------------------------------------------*/

var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	DAY_MS = 86400000,
	HOUR_MS = 3600000,
	MINUTE_MS = 60000;


function addYears(d, n, keepTime) {
	d.setFullYear(d.getFullYear() + n);
	if (!keepTime) {
		clearTime(d);
	}
	return d;
}


function addMonths(d, n, keepTime) { // prevents day overflow/underflow
	if (+d) { // prevent infinite looping on invalid dates
		var m = d.getMonth() + n,
			check = cloneDate(d);
		check.setDate(1);
		check.setMonth(m);
		d.setMonth(m);
		if (!keepTime) {
			clearTime(d);
		}
		while (d.getMonth() != check.getMonth()) {
			d.setDate(d.getDate() + (d < check ? 1 : -1));
		}
	}
	return d;
}


function addDays(d, n, keepTime) { // deals with daylight savings
	if (+d) {
		var dd = d.getDate() + n,
			check = cloneDate(d);
		check.setHours(9); // set to middle of day
		check.setDate(dd);
		d.setDate(dd);
		if (!keepTime) {
			clearTime(d);
		}
		fixDate(d, check);
	}
	return d;
}


function fixDate(d, check) { // force d to be on check's YMD, for daylight savings purposes
	if (+d) { // prevent infinite looping on invalid dates
		while (d.getDate() != check.getDate()) {
			d.setTime(+d + (d < check ? 1 : -1) * HOUR_MS);
		}
	}
}


function addMinutes(d, n) {
	d.setMinutes(d.getMinutes() + n);
	return d;
}


function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}


function cloneDate(d, dontKeepTime) {
	if (dontKeepTime) {
		return clearTime(new Date(+d));
	}
	return new Date(+d);
}


function zeroDate() { // returns a Date with time 00:00:00 and dateOfMonth=1
	var i=0, d;
	do {
		d = new Date(1970, i++, 1);
	} while (d.getHours()); // != 0
	return d;
}


function dayDiff(d1, d2) { // d1 - d2
	return Math.round((cloneDate(d1, true) - cloneDate(d2, true)) / DAY_MS);
}


function setYMD(date, y, m, d) {
	if (y !== undefined && y != date.getFullYear()) {
		date.setDate(1);
		date.setMonth(0);
		date.setFullYear(y);
	}
	if (m !== undefined && m != date.getMonth()) {
		date.setDate(1);
		date.setMonth(m);
	}
	if (d !== undefined) {
		date.setDate(d);
	}
}



/* Date Parsing
-----------------------------------------------------------------------------*/


function parseDate(s, ignoreTimezone) { // ignoreTimezone defaults to true
	if (typeof s == 'object') { // already a Date object
		return s;
	}
	if (typeof s == 'number') { // a UNIX timestamp
		return new Date(s * 1000);
	}
	if (typeof s == 'string') {
		if (s.match(/^\d+(\.\d+)?$/)) { // a UNIX timestamp
			return new Date(parseFloat(s) * 1000);
		}
		if (ignoreTimezone === undefined) {
			ignoreTimezone = true;
		}
		return parseISO8601(s, ignoreTimezone) || (s ? new Date(s) : null);
	}
	// TODO: never return invalid dates (like from new Date(<string>)), return null instead
	return null;
}


function parseISO8601(s, ignoreTimezone) { // ignoreTimezone defaults to false
	// derived from http://delete.me.uk/2005/03/iso8601.html
	// TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
	var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2})(:?([0-9]{2}))?))?)?)?)?$/);
	if (!m) {
		return null;
	}
	var date = new Date(m[1], 0, 1);
	if (ignoreTimezone || !m[13]) {
		var check = new Date(m[1], 0, 1, 9, 0);
		if (m[3]) {
			date.setMonth(m[3] - 1);
			check.setMonth(m[3] - 1);
		}
		if (m[5]) {
			date.setDate(m[5]);
			check.setDate(m[5]);
		}
		fixDate(date, check);
		if (m[7]) {
			date.setHours(m[7]);
		}
		if (m[8]) {
			date.setMinutes(m[8]);
		}
		if (m[10]) {
			date.setSeconds(m[10]);
		}
		if (m[12]) {
			date.setMilliseconds(Number("0." + m[12]) * 1000);
		}
		fixDate(date, check);
	}else{
		date.setUTCFullYear(
			m[1],
			m[3] ? m[3] - 1 : 0,
			m[5] || 1
		);
		date.setUTCHours(
			m[7] || 0,
			m[8] || 0,
			m[10] || 0,
			m[12] ? Number("0." + m[12]) * 1000 : 0
		);
		if (m[14]) {
			var offset = Number(m[16]) * 60 + (m[18] ? Number(m[18]) : 0);
			offset *= m[15] == '-' ? 1 : -1;
			date = new Date(+date + (offset * 60 * 1000));
		}
	}
	return date;
}


function parseTime(s) { // returns minutes since start of day
	if (typeof s == 'number') { // an hour
		return s * 60;
	}
	if (typeof s == 'object') { // a Date object
		return s.getHours() * 60 + s.getMinutes();
	}
	var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
	if (m) {
		var h = parseInt(m[1], 10);
		if (m[3]) {
			h %= 12;
			if (m[3].toLowerCase().charAt(0) == 'p') {
				h += 12;
			}
		}
		return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
	}
}



/* Date Formatting
-----------------------------------------------------------------------------*/
// TODO: use same function formatDate(date, [date2], format, [options])


function formatDate(date, format, options) {
	return formatDates(date, null, format, options);
}


function formatDates(date1, date2, format, options) {
	options = options || defaults;
	var date = date1,
		otherDate = date2,
		i, len = format.length, c,
		i2, formatter,
		res = '';
	for (i=0; i<len; i++) {
		c = format.charAt(i);
		if (c == "'") {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == "'") {
					if (date) {
						if (i2 == i+1) {
							res += "'";
						}else{
							res += format.substring(i+1, i2);
						}
						i = i2;
					}
					break;
				}
			}
		}
		else if (c == '(') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ')') {
					var subres = formatDate(date, format.substring(i+1, i2), options);
					if (parseInt(subres.replace(/\D/, ''), 10)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '[') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ']') {
					var subformat = format.substring(i+1, i2);
					var subres = formatDate(date, subformat, options);
					if (subres != formatDate(otherDate, subformat, options)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '{') {
			date = date2;
			otherDate = date1;
		}
		else if (c == '}') {
			date = date1;
			otherDate = date2;
		}
		else {
			for (i2=len; i2>i; i2--) {
				if (formatter = dateFormatters[format.substring(i, i2)]) {
					if (date) {
						res += formatter(date, options);
					}
					i = i2 - 1;
					break;
				}
			}
			if (i2 == i) {
				if (date) {
					res += c;
				}
			}
		}
	}
	return res;
};


var dateFormatters = {
	s	: function(d)	{ return d.getSeconds() },
	ss	: function(d)	{ return zeroPad(d.getSeconds()) },
	m	: function(d)	{ return d.getMinutes() },
	mm	: function(d)	{ return zeroPad(d.getMinutes()) },
	h	: function(d)	{ return d.getHours() % 12 || 12 },
	hh	: function(d)	{ return zeroPad(d.getHours() % 12 || 12) },
	H	: function(d)	{ return d.getHours() },
	HH	: function(d)	{ return zeroPad(d.getHours()) },
	d	: function(d)	{ return d.getDate() },
	dd	: function(d)	{ return zeroPad(d.getDate()) },
	ddd	: function(d,o)	{ return o.dayNamesShort[d.getDay()] },
	dddd: function(d,o)	{ return o.dayNames[d.getDay()] },
	M	: function(d)	{ return d.getMonth() + 1 },
	MM	: function(d)	{ return zeroPad(d.getMonth() + 1) },
	MMM	: function(d,o)	{ return o.monthNamesShort[d.getMonth()] },
	MMMM: function(d,o)	{ return o.monthNames[d.getMonth()] },
	yy	: function(d)	{ return (d.getFullYear()+'').substring(2) },
	yyyy: function(d)	{ return d.getFullYear() },
	t	: function(d)	{ return d.getHours() < 12 ? 'a' : 'p' },
	tt	: function(d)	{ return d.getHours() < 12 ? 'am' : 'pm' },
	T	: function(d)	{ return d.getHours() < 12 ? 'A' : 'P' },
	TT	: function(d)	{ return d.getHours() < 12 ? 'AM' : 'PM' },
	u	: function(d)	{ return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'") },
	S	: function(d)	{
		var date = d.getDate();
		if (date > 10 && date < 20) {
			return 'th';
		}
		return ['st', 'nd', 'rd'][date%10-1] || 'th';
	},
	w   : function(d, o) { // local
		return o.weekNumberCalculation(d);
	},
	W   : function(d) { // ISO
		return iso8601Week(d);
	}
};
fc.dateFormatters = dateFormatters;


/* thanks jQuery UI (https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js)
 *
 * Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
 * `date` - the date to get the week for
 * `number` - the number of the week within the year that contains this date
 */
function iso8601Week(date) {
	var time;
	var checkDate = new Date(date.getTime());

	// Find Thursday of this week starting on Monday
	checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));

	time = checkDate.getTime();
	checkDate.setMonth(0); // Compare with Jan 1
	checkDate.setDate(1);
	return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
}


;;

fc.applyAll = applyAll;


/* Event Date Math
-----------------------------------------------------------------------------*/


function exclEndDay(event) {
	if (event.end) {
		return _exclEndDay(event.end, event.allDay);
	}else{
		return addDays(cloneDate(event.start), 1);
	}
}


function _exclEndDay(end, allDay) {
	end = cloneDate(end);
	return allDay || end.getHours() || end.getMinutes() ? addDays(end, 1) : clearTime(end);
	// why don't we check for seconds/ms too?
}



/* Event Element Binding
-----------------------------------------------------------------------------*/


function lazySegBind(container, segs, bindHandlers) {
	container.unbind('mouseover').mouseover(function(ev) {
		var parent=ev.target, e,
			i, seg;
		while (parent != this) {
			e = parent;
			parent = parent.parentNode;
		}
		if ((i = e._fci) !== undefined) {
			e._fci = undefined;
			seg = segs[i];
			bindHandlers(seg.event, seg.element, seg);
			$(ev.target).trigger(ev);
		}
		ev.stopPropagation();
	});
}



/* Element Dimensions
-----------------------------------------------------------------------------*/


function setOuterWidth(element, width, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.width(Math.max(0, width - hsides(e, includeMargins)));
	}
}


function setOuterHeight(element, height, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.height(Math.max(0, height - vsides(e, includeMargins)));
	}
}


function hsides(element, includeMargins) {
	return hpadding(element) + hborders(element) + (includeMargins ? hmargins(element) : 0);
}


function hpadding(element) {
	return (parseFloat($.css(element[0], 'paddingLeft', true)) || 0) +
	       (parseFloat($.css(element[0], 'paddingRight', true)) || 0);
}


function hmargins(element) {
	return (parseFloat($.css(element[0], 'marginLeft', true)) || 0) +
	       (parseFloat($.css(element[0], 'marginRight', true)) || 0);
}


function hborders(element) {
	return (parseFloat($.css(element[0], 'borderLeftWidth', true)) || 0) +
	       (parseFloat($.css(element[0], 'borderRightWidth', true)) || 0);
}


function vsides(element, includeMargins) {
	return vpadding(element) +  vborders(element) + (includeMargins ? vmargins(element) : 0);
}


function vpadding(element) {
	return (parseFloat($.css(element[0], 'paddingTop', true)) || 0) +
	       (parseFloat($.css(element[0], 'paddingBottom', true)) || 0);
}


function vmargins(element) {
	return (parseFloat($.css(element[0], 'marginTop', true)) || 0) +
	       (parseFloat($.css(element[0], 'marginBottom', true)) || 0);
}


function vborders(element) {
	return (parseFloat($.css(element[0], 'borderTopWidth', true)) || 0) +
	       (parseFloat($.css(element[0], 'borderBottomWidth', true)) || 0);
}



/* Misc Utils
-----------------------------------------------------------------------------*/


//TODO: arraySlice
//TODO: isFunction, grep ?


function noop() { }


function dateCompare(a, b) {
	return a - b;
}


function arrayMax(a) {
	return Math.max.apply(Math, a);
}


function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}


function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	if (obj[name] !== undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i=parts.length-1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res !== undefined) {
			return res;
		}
	}
	return obj[''];
}


function htmlEscape(s) {
	return s.replace(/&/g, '&')
		.replace(/</g, '<')
		.replace(/>/g, '>')
		.replace(/'/g, '\'')
		.replace(/"/g, '"')
		.replace(/\n/g, '<br />');
}


function disableTextSelection(element) {
	element
		.attr('unselectable', 'on')
		.css('MozUserSelect', 'none')
		.bind('selectstart.ui', function() { return false; });
}


/*
function enableTextSelection(element) {
	element
		.attr('unselectable', 'off')
		.css('MozUserSelect', '')
		.unbind('selectstart.ui');
}
*/


function markFirstLast(e) {
	e.children()
		.removeClass('fc-first fc-last')
		.filter(':first-child')
			.addClass('fc-first')
		.end()
		.filter(':last-child')
			.addClass('fc-last');
}


function setDayID(cell, date) {
	cell.each(function(i, _cell) {
		_cell.className = _cell.className.replace(/^fc-\w*/, 'fc-' + dayIDs[date.getDay()]);
		// TODO: make a way that doesn't rely on order of classes
	});
}


function getSkinCss(event, opt) {
	var source = event.source || {};
	var eventColor = event.color;
	var sourceColor = source.color;
	var optionColor = opt('eventColor');
	var backgroundColor =
		event.backgroundColor ||
		eventColor ||
		source.backgroundColor ||
		sourceColor ||
		opt('eventBackgroundColor') ||
		optionColor;
	var borderColor =
		event.borderColor ||
		eventColor ||
		source.borderColor ||
		sourceColor ||
		opt('eventBorderColor') ||
		optionColor;
	var textColor =
		event.textColor ||
		source.textColor ||
		opt('eventTextColor');
	var statements = [];
	if (backgroundColor) {
		statements.push('background-color:' + backgroundColor);
	}
	if (borderColor) {
		statements.push('border-color:' + borderColor);
	}
	if (textColor) {
		statements.push('color:' + textColor);
	}
	return statements.join(';');
}


function applyAll(functions, thisObj, args) {
	if ($.isFunction(functions)) {
		functions = [ functions ];
	}
	if (functions) {
		var i;
		var ret;
		for (i=0; i<functions.length; i++) {
			ret = functions[i].apply(thisObj, args) || ret;
		}
		return ret;
	}
}


function firstDefined() {
	for (var i=0; i<arguments.length; i++) {
		if (arguments[i] !== undefined) {
			return arguments[i];
		}
	}
}


;;

fcViews.month = MonthView;

function MonthView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	BasicView.call(t, element, calendar, 'month');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var skipHiddenDays = t.skipHiddenDays;
	var getCellsPerWeek = t.getCellsPerWeek;
	var formatDate = calendar.formatDate;


	function render(date, delta) {

		if (delta) {
			addMonths(date, delta);
			date.setDate(1);
		}

		var firstDay = opt('firstDay');

		var start = cloneDate(date, true);
		start.setDate(1);

		var end = addMonths(cloneDate(start), 1);

		var visStart = cloneDate(start);
		addDays(visStart, -((visStart.getDay() - firstDay + 7) % 7));
		skipHiddenDays(visStart);

		var visEnd = cloneDate(end);
		addDays(visEnd, (7 - visEnd.getDay() + firstDay) % 7);
		skipHiddenDays(visEnd, -1, true);

		var colCnt = getCellsPerWeek();
		var rowCnt = Math.round(dayDiff(visEnd, visStart) / 7); // should be no need for Math.round

		if (opt('weekMode') == 'fixed') {
			addDays(visEnd, (6 - rowCnt) * 7); // add weeks to make up for it
			rowCnt = 6;
		}

		t.title = formatDate(start, opt('titleFormat'));

		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;

		renderBasic(rowCnt, colCnt, true);
	}


}

;;

fcViews.basicWeek = BasicWeekView;

function BasicWeekView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	BasicView.call(t, element, calendar, 'basicWeek');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var skipHiddenDays = t.skipHiddenDays;
	var getCellsPerWeek = t.getCellsPerWeek;
	var formatDates = calendar.formatDates;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta * 7);
		}

		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);

		var visStart = cloneDate(start);
		skipHiddenDays(visStart);

		var visEnd = cloneDate(end);
		skipHiddenDays(visEnd, -1, true);

		var colCnt = getCellsPerWeek();

		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;

		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);

		renderBasic(1, colCnt, false);
	}


}

;;

fcViews.basicDay = BasicDayView;


function BasicDayView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	BasicView.call(t, element, calendar, 'basicDay');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var skipHiddenDays = t.skipHiddenDays;
	var formatDate = calendar.formatDate;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta);
		}
		skipHiddenDays(date, delta < 0 ? -1 : 1);

		var start = cloneDate(date, true);
		var end = addDays(cloneDate(start), 1);

		t.title = formatDate(date, opt('titleFormat'));

		t.start = t.visStart = start;
		t.end = t.visEnd = end;

		renderBasic(1, 1, false);
	}


}

;;

setDefaults({
	weekMode: 'fixed'
});


function BasicView(element, calendar, viewName) {
	var t = this;


	// exports
	t.renderBasic = renderBasic;
	t.setHeight = setHeight;
	t.setWidth = setWidth;
	t.renderDayOverlay = renderDayOverlay;
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // for selection (kinda hacky)
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	t.defaultEventEnd = defaultEventEnd;
	t.getHoverListener = function() { return hoverListener };
	t.colLeft = colLeft;
	t.colRight = colRight;
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.getIsCellAllDay = function() { return true };
	t.allDayRow = allDayRow;
	t.getRowCnt = function() { return rowCnt };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getDaySegmentContainer = function() { return daySegmentContainer };


	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	BasicEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var daySelectionMousedown = t.daySelectionMousedown;
	var cellToDate = t.cellToDate;
	var dateToCell = t.dateToCell;
	var rangeToSegments = t.rangeToSegments;
	var formatDate = calendar.formatDate;


	// locals

	var table;
	var head;
	var headCells;
	var body;
	var bodyRows;
	var bodyCells;
	var bodyFirstCells;
	var firstRowCellInners;
	var firstRowCellContentInners;
	var daySegmentContainer;

	var viewWidth;
	var viewHeight;
	var colWidth;
	var weekNumberWidth;

	var rowCnt, colCnt;
	var showNumbers;
	var coordinateGrid;
	var hoverListener;
	var colPositions;
	var colContentPositions;

	var tm;
	var colFormat;
	var showWeekNumbers;
	var weekNumberTitle;
	var weekNumberFormat;



	/* Rendering
	------------------------------------------------------------*/


	disableTextSelection(element.addClass('fc-grid'));


	function renderBasic(_rowCnt, _colCnt, _showNumbers) {
		rowCnt = _rowCnt;
		colCnt = _colCnt;
		showNumbers = _showNumbers;
		updateOptions();

		if (!body) {
			buildEventContainer();
		}

		buildTable();
	}


	function updateOptions() {
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat');

		// week # options. (TODO: bad, logic also in other views)
		showWeekNumbers = opt('weekNumbers');
		weekNumberTitle = opt('weekNumberTitle');
		if (opt('weekNumberCalculation') != 'iso') {
			weekNumberFormat = "w";
		}
		else {
			weekNumberFormat = "W";
		}
	}


	function buildEventContainer() {
		daySegmentContainer =
			$("<div class='fc-event-container' style='position:absolute;z-index:8;top:0;left:0'/>")
				.appendTo(element);
	}


	function buildTable() {
		var html = buildTableHTML();

		if (table) {
			table.remove();
		}
		table = $(html).appendTo(element);

		head = table.find('thead');
		headCells = head.find('.fc-day-header');
		body = table.find('tbody');
		bodyRows = body.find('tr');
		bodyCells = body.find('.fc-day');
		bodyFirstCells = bodyRows.find('td:first-child');

		firstRowCellInners = bodyRows.eq(0).find('.fc-day > div');
		firstRowCellContentInners = bodyRows.eq(0).find('.fc-day-content > div');

		markFirstLast(head.add(head.find('tr'))); // marks first+last tr/th's
		markFirstLast(bodyRows); // marks first+last td's
		bodyRows.eq(0).addClass('fc-first');
		bodyRows.filter(':last').addClass('fc-last');

		bodyCells.each(function(i, _cell) {
			var date = cellToDate(
				Math.floor(i / colCnt),
				i % colCnt
			);
			trigger('dayRender', t, date, $(_cell));
		});

		dayBind(bodyCells);
	}



	/* HTML Building
	-----------------------------------------------------------*/


	function buildTableHTML() {
		var html =
			"<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
			buildHeadHTML() +
			buildBodyHTML() +
			"</table>";

		return html;
	}


	function buildHeadHTML() {
		var headerClass = tm + "-widget-header";
		var html = '';
		var col;
		var date;

		html += "<thead><tr>";

		if (showWeekNumbers) {
			html +=
				"<th class='fc-week-number " + headerClass + "'>" +
				htmlEscape(weekNumberTitle) +
				"</th>";
		}

		for (col=0; col<colCnt; col++) {
			date = cellToDate(0, col);
			html +=
				"<th class='fc-day-header fc-" + dayIDs[date.getDay()] + " " + headerClass + "'>" +
				htmlEscape(formatDate(date, colFormat)) +
				"</th>";
		}

		html += "</tr></thead>";

		return html;
	}


	function buildBodyHTML() {
		var contentClass = tm + "-widget-content";
		var html = '';
		var row;
		var col;
		var date;

		html += "<tbody>";

		for (row=0; row<rowCnt; row++) {

			html += "<tr class='fc-week'>";

			if (showWeekNumbers) {
				date = cellToDate(row, 0);
				html +=
					"<td class='fc-week-number " + contentClass + "'>" +
					"<div>" +
					htmlEscape(formatDate(date, weekNumberFormat)) +
					"</div>" +
					"</td>";
			}

			for (col=0; col<colCnt; col++) {
				date = cellToDate(row, col);
				html += buildCellHTML(date);
			}

			html += "</tr>";
		}

		html += "</tbody>";

		return html;
	}


	function buildCellHTML(date) {
		var contentClass = tm + "-widget-content";
		var month = t.start.getMonth();
		var today = clearTime(new Date());
		var html = '';
		var classNames = [
			'fc-day',
			'fc-' + dayIDs[date.getDay()],
			contentClass
		];

		if (date.getMonth() != month) {
			classNames.push('fc-other-month');
		}
		if (+date == +today) {
			classNames.push(
				'fc-today',
				tm + '-state-highlight'
			);
		}
		else if (date < today) {
			classNames.push('fc-past');
		}
		else {
			classNames.push('fc-future');
		}

		html +=
			"<td" +
			" class='" + classNames.join(' ') + "'" +
			" data-date='" + formatDate(date, 'yyyy-MM-dd') + "'" +
			">" +
			"<div>";

		if (showNumbers) {
			html += "<div class='fc-day-number'>" + date.getDate() + "</div>";
		}

		html +=
			"<div class='fc-day-content'>" +
			"<div style='position:relative'> </div>" +
			"</div>" +
			"</div>" +
			"</td>";

		return html;
	}



	/* Dimensions
	-----------------------------------------------------------*/


	function setHeight(height) {
		viewHeight = height;

		var bodyHeight = viewHeight - head.height();
		var rowHeight;
		var rowHeightLast;
		var cell;

		if (opt('weekMode') == 'variable') {
			rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight = Math.floor(bodyHeight / rowCnt);
			rowHeightLast = bodyHeight - rowHeight * (rowCnt-1);
		}

		bodyFirstCells.each(function(i, _cell) {
			if (i < rowCnt) {
				cell = $(_cell);
				cell.find('> div').css(
					'min-height',
					(i==rowCnt-1 ? rowHeightLast : rowHeight) - vsides(cell)
				);
			}
		});

	}


	function setWidth(width) {
		viewWidth = width;
		colPositions.clear();
		colContentPositions.clear();

		weekNumberWidth = 0;
		if (showWeekNumbers) {
			weekNumberWidth = head.find('th.fc-week-number').outerWidth();
		}

		colWidth = Math.floor((viewWidth - weekNumberWidth) / colCnt);
		setOuterWidth(headCells.slice(0, -1), colWidth);
	}



	/* Day clicking and binding
	-----------------------------------------------------------*/


	function dayBind(days) {
		days.click(dayClick)
			.mousedown(daySelectionMousedown);
	}


	function dayClick(ev) {
		if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
			var date = parseISO8601($(this).data('date'));
			trigger('dayClick', this, date, true, ev);
		}
	}



	/* Semi-transparent Overlay Helpers
	------------------------------------------------------*/
	// TODO: should be consolidated with AgendaView's methods


	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive

		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}

		var segments = rangeToSegments(overlayStart, overlayEnd);

		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];
			dayBind(
				renderCellOverlay(
					segment.row,
					segment.leftCol,
					segment.row,
					segment.rightCol
				)
			);
		}
	}


	function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
		var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
		return renderOverlay(rect, element);
	}



	/* Selection
	-----------------------------------------------------------------------*/


	function defaultSelectionEnd(startDate, allDay) {
		return cloneDate(startDate);
	}


	function renderSelection(startDate, endDate, allDay) {
		renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
	}


	function clearSelection() {
		clearOverlays();
	}


	function reportDayClick(date, allDay, ev) {
		var cell = dateToCell(date);
		var _element = bodyCells[cell.row*colCnt + cell.col];
		trigger('dayClick', _element, date, allDay, ev);
	}



	/* External Dragging
	-----------------------------------------------------------------------*/


	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
			}
		}, ev);
	}


	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			var d = cellToDate(cell);
			trigger('drop', _dragElement, d, true, ev, ui);
		}
	}



	/* Utilities
	--------------------------------------------------------*/


	function defaultEventEnd(event) {
		return cloneDate(event.start);
	}


	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		headCells.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		bodyRows.each(function(i, _e) {
			if (i < rowCnt) {
				e = $(_e);
				n = e.offset().top;
				if (i) {
					p[1] = n;
				}
				p = [n];
				rows[i] = p;
			}
		});
		p[1] = n + e.outerHeight();
	});


	hoverListener = new HoverListener(coordinateGrid);

	colPositions = new HorizontalPositionCache(function(col) {
		return firstRowCellInners.eq(col);
	});

	colContentPositions = new HorizontalPositionCache(function(col) {
		return firstRowCellContentInners.eq(col);
	});


	function colLeft(col) {
		return colPositions.left(col);
	}


	function colRight(col) {
		return colPositions.right(col);
	}


	function colContentLeft(col) {
		return colContentPositions.left(col);
	}


	function colContentRight(col) {
		return colContentPositions.right(col);
	}


	function allDayRow(i) {
		return bodyRows.eq(i);
	}

}

;;

function BasicEventRenderer() {
	var t = this;


	// exports
	t.renderEvents = renderEvents;
	t.clearEvents = clearEvents;


	// imports
	DayEventRenderer.call(t);


	function renderEvents(events, modifiedEventId) {
		t.renderDayEvents(events, modifiedEventId);
	}


	function clearEvents() {
		t.getDaySegmentContainer().empty();
	}


	// TODO: have this class (and AgendaEventRenderer) be responsible for creating the event container div

}

;;

fcViews.agendaWeek = AgendaWeekView;

function AgendaWeekView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	AgendaView.call(t, element, calendar, 'agendaWeek');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var skipHiddenDays = t.skipHiddenDays;
	var getCellsPerWeek = t.getCellsPerWeek;
	var formatDates = calendar.formatDates;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta * 7);
		}

		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);

		var visStart = cloneDate(start);
		skipHiddenDays(visStart);

		var visEnd = cloneDate(end);
		skipHiddenDays(visEnd, -1, true);

		var colCnt = getCellsPerWeek();

		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);

		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;

		renderAgenda(colCnt);
	}

}

;;

fcViews.agendaDay = AgendaDayView;


function AgendaDayView(element, calendar) {
	var t = this;


	// exports
	t.render = render;


	// imports
	AgendaView.call(t, element, calendar, 'agendaDay');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var skipHiddenDays = t.skipHiddenDays;
	var formatDate = calendar.formatDate;


	function render(date, delta) {

		if (delta) {
			addDays(date, delta);
		}
		skipHiddenDays(date, delta < 0 ? -1 : 1);

		var start = cloneDate(date, true);
		var end = addDays(cloneDate(start), 1);

		t.title = formatDate(date, opt('titleFormat'));

		t.start = t.visStart = start;
		t.end = t.visEnd = end;

		renderAgenda(1);
	}


}

;;

setDefaults({
	allDaySlot: true,
	allDayText: 'all-day',
	firstHour: 6,
	slotMinutes: 30,
	defaultEventMinutes: 120,
	axisFormat: 'h(:mm)tt',
	timeFormat: {
		agenda: 'h:mm{ - h:mm}'
	},
	dragOpacity: {
		agenda: .5
	},
	minTime: 0,
	maxTime: 24,
	slotEventOverlap: true
});


// TODO: make it work in quirks mode (event corners, all-day height)
// TODO: test liquid width, especially in IE6


function AgendaView(element, calendar, viewName) {
	var t = this;


	// exports
	t.renderAgenda = renderAgenda;
	t.setWidth = setWidth;
	t.setHeight = setHeight;
	t.afterRender = afterRender;
	t.defaultEventEnd = defaultEventEnd;
	t.timePosition = timePosition;
	t.getIsCellAllDay = getIsCellAllDay;
	t.allDayRow = getAllDayRow;
	t.getCoordinateGrid = function() { return coordinateGrid }; // specifically for AgendaEventRenderer
	t.getHoverListener = function() { return hoverListener };
	t.colLeft = colLeft;
	t.colRight = colRight;
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.getDaySegmentContainer = function() { return daySegmentContainer };
	t.getSlotSegmentContainer = function() { return slotSegmentContainer };
	t.getMinMinute = function() { return minMinute };
	t.getMaxMinute = function() { return maxMinute };
	t.getSlotContainer = function() { return slotContainer };
	t.getRowCnt = function() { return 1 };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getSnapHeight = function() { return snapHeight };
	t.getSnapMinutes = function() { return snapMinutes };
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderDayOverlay = renderDayOverlay;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // selection mousedown hack
	t.dragStart = dragStart;
	t.dragStop = dragStop;


	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	AgendaEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var reportSelection = t.reportSelection;
	var unselect = t.unselect;
	var daySelectionMousedown = t.daySelectionMousedown;
	var slotSegHtml = t.slotSegHtml;
	var cellToDate = t.cellToDate;
	var dateToCell = t.dateToCell;
	var rangeToSegments = t.rangeToSegments;
	var formatDate = calendar.formatDate;


	// locals

	var dayTable;
	var dayHead;
	var dayHeadCells;
	var dayBody;
	var dayBodyCells;
	var dayBodyCellInners;
	var dayBodyCellContentInners;
	var dayBodyFirstCell;
	var dayBodyFirstCellStretcher;
	var slotLayer;
	var daySegmentContainer;
	var allDayTable;
	var allDayRow;
	var slotScroller;
	var slotContainer;
	var slotSegmentContainer;
	var slotTable;
	var selectionHelper;

	var viewWidth;
	var viewHeight;
	var axisWidth;
	var colWidth;
	var gutterWidth;
	var slotHeight; // TODO: what if slotHeight changes? (see issue 650)

	var snapMinutes;
	var snapRatio; // ratio of number of "selection" slots to normal slots. (ex: 1, 2, 4)
	var snapHeight; // holds the pixel hight of a "selection" slot

	var colCnt;
	var slotCnt;
	var coordinateGrid;
	var hoverListener;
	var colPositions;
	var colContentPositions;
	var slotTopCache = {};

	var tm;
	var rtl;
	var minMinute, maxMinute;
	var colFormat;
	var showWeekNumbers;
	var weekNumberTitle;
	var weekNumberFormat;



	/* Rendering
	-----------------------------------------------------------------------------*/


	disableTextSelection(element.addClass('fc-agenda'));


	function renderAgenda(c) {
		colCnt = c;
		updateOptions();

		if (!dayTable) { // first time rendering?
			buildSkeleton(); // builds day table, slot area, events containers
		}
		else {
			buildDayTable(); // rebuilds day table
		}
	}


	function updateOptions() {

		tm = opt('theme') ? 'ui' : 'fc';
		rtl = opt('isRTL')
		minMinute = parseTime(opt('minTime'));
		maxMinute = parseTime(opt('maxTime'));
		colFormat = opt('columnFormat');

		// week # options. (TODO: bad, logic also in other views)
		showWeekNumbers = opt('weekNumbers');
		weekNumberTitle = opt('weekNumberTitle');
		if (opt('weekNumberCalculation') != 'iso') {
			weekNumberFormat = "w";
		}
		else {
			weekNumberFormat = "W";
		}

		snapMinutes = opt('snapMinutes') || opt('slotMinutes');
	}



	/* Build DOM
	-----------------------------------------------------------------------*/


	function buildSkeleton() {
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var s;
		var d;
		var i;
		var maxd;
		var minutes;
		var slotNormal = opt('slotMinutes') % 15 == 0;

		buildDayTable();

		slotLayer =
			$("<div style='position:absolute;z-index:2;left:0;width:100%'/>")
				.appendTo(element);

		if (opt('allDaySlot')) {

			daySegmentContainer =
				$("<div class='fc-event-container' style='position:absolute;z-index:8;top:0;left:0'/>")
					.appendTo(slotLayer);

			s =
				"<table style='width:100%' class='fc-agenda-allday' cellspacing='0'>" +
				"<tr>" +
				"<th class='" + headerClass + " fc-agenda-axis'>" + opt('allDayText') + "</th>" +
				"<td>" +
				"<div class='fc-day-content'><div style='position:relative'/></div>" +
				"</td>" +
				"<th class='" + headerClass + " fc-agenda-gutter'> </th>" +
				"</tr>" +
				"</table>";
			allDayTable = $(s).appendTo(slotLayer);
			allDayRow = allDayTable.find('tr');

			dayBind(allDayRow.find('td'));

			slotLayer.append(
				"<div class='fc-agenda-divider " + headerClass + "'>" +
				"<div class='fc-agenda-divider-inner'/>" +
				"</div>"
			);

		}else{

			daySegmentContainer = $([]); // in jQuery 1.4, we can just do $()

		}

		slotScroller =
			$("<div style='position:absolute;width:100%;overflow-x:hidden;overflow-y:auto'/>")
				.appendTo(slotLayer);

		slotContainer =
			$("<div style='position:relative;width:100%;overflow:hidden'/>")
				.appendTo(slotScroller);

		slotSegmentContainer =
			$("<div class='fc-event-container' style='position:absolute;z-index:8;top:0;left:0'/>")
				.appendTo(slotContainer);

		s =
			"<table class='fc-agenda-slots' style='width:100%' cellspacing='0'>" +
			"<tbody>";
		d = zeroDate();
		maxd = addMinutes(cloneDate(d), maxMinute);
		addMinutes(d, minMinute);
		slotCnt = 0;
		for (i=0; d < maxd; i++) {
			minutes = d.getMinutes();
			s +=
				"<tr class='fc-slot" + i + ' ' + (!minutes ? '' : 'fc-minor') + "'>" +
				"<th class='fc-agenda-axis " + headerClass + "'>" +
				((!slotNormal || !minutes) ? formatDate(d, opt('axisFormat')) : ' ') +
				"</th>" +
				"<td class='" + contentClass + "'>" +
				"<div style='position:relative'> </div>" +
				"</td>" +
				"</tr>";
			addMinutes(d, opt('slotMinutes'));
			slotCnt++;
		}
		s +=
			"</tbody>" +
			"</table>";
		slotTable = $(s).appendTo(slotContainer);

		slotBind(slotTable.find('td'));
	}



	/* Build Day Table
	-----------------------------------------------------------------------*/


	function buildDayTable() {
		var html = buildDayTableHTML();

		if (dayTable) {
			dayTable.remove();
		}
		dayTable = $(html).appendTo(element);

		dayHead = dayTable.find('thead');
		dayHeadCells = dayHead.find('th').slice(1, -1); // exclude gutter
		dayBody = dayTable.find('tbody');
		dayBodyCells = dayBody.find('td').slice(0, -1); // exclude gutter
		dayBodyCellInners = dayBodyCells.find('> div');
		dayBodyCellContentInners = dayBodyCells.find('.fc-day-content > div');

		dayBodyFirstCell = dayBodyCells.eq(0);
		dayBodyFirstCellStretcher = dayBodyCellInners.eq(0);

		markFirstLast(dayHead.add(dayHead.find('tr')));
		markFirstLast(dayBody.add(dayBody.find('tr')));

		// TODO: now that we rebuild the cells every time, we should call dayRender
	}


	function buildDayTableHTML() {
		var html =
			"<table style='width:100%' class='fc-agenda-days fc-border-separate' cellspacing='0'>" +
			buildDayTableHeadHTML() +
			buildDayTableBodyHTML() +
			"</table>";

		return html;
	}


	function buildDayTableHeadHTML() {
		var headerClass = tm + "-widget-header";
		var date;
		var html = '';
		var weekText;
		var col;

		html +=
			"<thead>" +
			"<tr>";

		if (showWeekNumbers) {
			date = cellToDate(0, 0);
			weekText = formatDate(date, weekNumberFormat);
			if (rtl) {
				weekText += weekNumberTitle;
			}
			else {
				weekText = weekNumberTitle + weekText;
			}
			html +=
				"<th class='fc-agenda-axis fc-week-number " + headerClass + "'>" +
				htmlEscape(weekText) +
				"</th>";
		}
		else {
			html += "<th class='fc-agenda-axis " + headerClass + "'> </th>";
		}

		for (col=0; col<colCnt; col++) {
			date = cellToDate(0, col);
			html +=
				"<th class='fc-" + dayIDs[date.getDay()] + " fc-col" + col + ' ' + headerClass + "'>" +
				htmlEscape(formatDate(date, colFormat)) +
				"</th>";
		}

		html +=
			"<th class='fc-agenda-gutter " + headerClass + "'> </th>" +
			"</tr>" +
			"</thead>";

		return html;
	}


	function buildDayTableBodyHTML() {
		var headerClass = tm + "-widget-header"; // TODO: make these when updateOptions() called
		var contentClass = tm + "-widget-content";
		var date;
		var today = clearTime(new Date());
		var col;
		var cellsHTML;
		var cellHTML;
		var classNames;
		var html = '';

		html +=
			"<tbody>" +
			"<tr>" +
			"<th class='fc-agenda-axis " + headerClass + "'> </th>";

		cellsHTML = '';

		for (col=0; col<colCnt; col++) {

			date = cellToDate(0, col);

			classNames = [
				'fc-col' + col,
				'fc-' + dayIDs[date.getDay()],
				contentClass
			];
			if (+date == +today) {
				classNames.push(
					tm + '-state-highlight',
					'fc-today'
				);
			}
			else if (date < today) {
				classNames.push('fc-past');
			}
			else {
				classNames.push('fc-future');
			}

			cellHTML =
				"<td class='" + classNames.join(' ') + "'>" +
				"<div>" +
				"<div class='fc-day-content'>" +
				"<div style='position:relative'> </div>" +
				"</div>" +
				"</div>" +
				"</td>";

			cellsHTML += cellHTML;
		}

		html += cellsHTML;
		html +=
			"<td class='fc-agenda-gutter " + contentClass + "'> </td>" +
			"</tr>" +
			"</tbody>";

		return html;
	}


	// TODO: data-date on the cells



	/* Dimensions
	-----------------------------------------------------------------------*/


	function setHeight(height) {
		if (height === undefined) {
			height = viewHeight;
		}
		viewHeight = height;
		slotTopCache = {};

		var headHeight = dayBody.position().top;
		var allDayHeight = slotScroller.position().top; // including divider
		var bodyHeight = Math.min( // total body height, including borders
			height - headHeight,   // when scrollbars
			slotTable.height() + allDayHeight + 1 // when no scrollbars. +1 for bottom border
		);

		dayBodyFirstCellStretcher
			.height(bodyHeight - vsides(dayBodyFirstCell));

		slotLayer.css('top', headHeight);

		slotScroller.height(bodyHeight - allDayHeight - 1);

		// the stylesheet guarantees that the first row has no border.
		// this allows .height() to work well cross-browser.
		slotHeight = slotTable.find('tr:first').height() + 1; // +1 for bottom border

		snapRatio = opt('slotMinutes') / snapMinutes;
		snapHeight = slotHeight / snapRatio;
	}


	function setWidth(width) {
		viewWidth = width;
		colPositions.clear();
		colContentPositions.clear();

		var axisFirstCells = dayHead.find('th:first');
		if (allDayTable) {
			axisFirstCells = axisFirstCells.add(allDayTable.find('th:first'));
		}
		axisFirstCells = axisFirstCells.add(slotTable.find('th:first'));

		axisWidth = 0;
		setOuterWidth(
			axisFirstCells
				.width('')
				.each(function(i, _cell) {
					axisWidth = Math.max(axisWidth, $(_cell).outerWidth());
				}),
			axisWidth
		);

		var gutterCells = dayTable.find('.fc-agenda-gutter');
		if (allDayTable) {
			gutterCells = gutterCells.add(allDayTable.find('th.fc-agenda-gutter'));
		}

		var slotTableWidth = slotScroller[0].clientWidth; // needs to be done after axisWidth (for IE7)

		gutterWidth = slotScroller.width() - slotTableWidth;
		if (gutterWidth) {
			setOuterWidth(gutterCells, gutterWidth);
			gutterCells
				.show()
				.prev()
				.removeClass('fc-last');
		}else{
			gutterCells
				.hide()
				.prev()
				.addClass('fc-last');
		}

		colWidth = Math.floor((slotTableWidth - axisWidth) / colCnt);
		setOuterWidth(dayHeadCells.slice(0, -1), colWidth);
	}



	/* Scrolling
	-----------------------------------------------------------------------*/


	function resetScroll() {
		var d0 = zeroDate();
		var scrollDate = cloneDate(d0);
		scrollDate.setHours(opt('firstHour'));
		var top = timePosition(d0, scrollDate) + 1; // +1 for the border
		function scroll() {
			slotScroller.scrollTop(top);
		}
		scroll();
		setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
	}


	function afterRender() { // after the view has been freshly rendered and sized
		resetScroll();
	}



	/* Slot/Day clicking and binding
	-----------------------------------------------------------------------*/


	function dayBind(cells) {
		cells.click(slotClick)
			.mousedown(daySelectionMousedown);
	}


	function slotBind(cells) {
		cells.click(slotClick)
			.mousedown(slotSelectionMousedown);
	}


	function slotClick(ev) {
		if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
			var col = Math.min(colCnt-1, Math.floor((ev.pageX - dayTable.offset().left - axisWidth) / colWidth));
			var date = cellToDate(0, col);
			var rowMatch = this.parentNode.className.match(/fc-slot(\d+)/); // TODO: maybe use data
			if (rowMatch) {
				var mins = parseInt(rowMatch[1]) * opt('slotMinutes');
				var hours = Math.floor(mins/60);
				date.setHours(hours);
				date.setMinutes(mins%60 + minMinute);
				trigger('dayClick', dayBodyCells[col], date, false, ev);
			}else{
				trigger('dayClick', dayBodyCells[col], date, true, ev);
			}
		}
	}



	/* Semi-transparent Overlay Helpers
	-----------------------------------------------------*/
	// TODO: should be consolidated with BasicView's methods


	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive

		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}

		var segments = rangeToSegments(overlayStart, overlayEnd);

		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];
			dayBind(
				renderCellOverlay(
					segment.row,
					segment.leftCol,
					segment.row,
					segment.rightCol
				)
			);
		}
	}


	function renderCellOverlay(row0, col0, row1, col1) { // only for all-day?
		var rect = coordinateGrid.rect(row0, col0, row1, col1, slotLayer);
		return renderOverlay(rect, slotLayer);
	}


	function renderSlotOverlay(overlayStart, overlayEnd) {
		for (var i=0; i<colCnt; i++) {
			var dayStart = cellToDate(0, i);
			var dayEnd = addDays(cloneDate(dayStart), 1);
			var stretchStart = new Date(Math.max(dayStart, overlayStart));
			var stretchEnd = new Date(Math.min(dayEnd, overlayEnd));
			if (stretchStart < stretchEnd) {
				var rect = coordinateGrid.rect(0, i, 0, i, slotContainer); // only use it for horizontal coords
				var top = timePosition(dayStart, stretchStart);
				var bottom = timePosition(dayStart, stretchEnd);
				rect.top = top;
				rect.height = bottom - top;
				slotBind(
					renderOverlay(rect, slotContainer)
				);
			}
		}
	}



	/* Coordinate Utilities
	-----------------------------------------------------------------------------*/


	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		dayHeadCells.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		if (opt('allDaySlot')) {
			e = allDayRow;
			n = e.offset().top;
			rows[0] = [n, n+e.outerHeight()];
		}
		var slotTableTop = slotContainer.offset().top;
		var slotScrollerTop = slotScroller.offset().top;
		var slotScrollerBottom = slotScrollerTop + slotScroller.outerHeight();
		function constrain(n) {
			return Math.max(slotScrollerTop, Math.min(slotScrollerBottom, n));
		}
		for (var i=0; i<slotCnt*snapRatio; i++) { // adapt slot count to increased/decreased selection slot count
			rows.push([
				constrain(slotTableTop + snapHeight*i),
				constrain(slotTableTop + snapHeight*(i+1))
			]);
		}
	});


	hoverListener = new HoverListener(coordinateGrid);

	colPositions = new HorizontalPositionCache(function(col) {
		return dayBodyCellInners.eq(col);
	});

	colContentPositions = new HorizontalPositionCache(function(col) {
		return dayBodyCellContentInners.eq(col);
	});


	function colLeft(col) {
		return colPositions.left(col);
	}


	function colContentLeft(col) {
		return colContentPositions.left(col);
	}


	function colRight(col) {
		return colPositions.right(col);
	}


	function colContentRight(col) {
		return colContentPositions.right(col);
	}


	function getIsCellAllDay(cell) {
		return opt('allDaySlot') && !cell.row;
	}


	function realCellToDate(cell) { // ugh "real" ... but blame it on our abuse of the "cell" system
		var d = cellToDate(0, cell.col);
		var slotIndex = cell.row;
		if (opt('allDaySlot')) {
			slotIndex--;
		}
		if (slotIndex >= 0) {
			addMinutes(d, minMinute + slotIndex * snapMinutes);
		}
		return d;
	}


	// get the Y coordinate of the given time on the given day (both Date objects)
	function timePosition(day, time) { // both date objects. day holds 00:00 of current day
		day = cloneDate(day, true);
		if (time < addMinutes(cloneDate(day), minMinute)) {
			return 0;
		}
		if (time >= addMinutes(cloneDate(day), maxMinute)) {
			return slotTable.height();
		}
		var slotMinutes = opt('slotMinutes'),
			minutes = time.getHours()*60 + time.getMinutes() - minMinute,
			slotI = Math.floor(minutes / slotMinutes),
			slotTop = slotTopCache[slotI];
		if (slotTop === undefined) {
			slotTop = slotTopCache[slotI] =
				slotTable.find('tr').eq(slotI).find('td div')[0].offsetTop;
				// .eq() is faster than ":eq()" selector
				// [0].offsetTop is faster than .position().top (do we really need this optimization?)
				// a better optimization would be to cache all these divs
		}
		return Math.max(0, Math.round(
			slotTop - 1 + slotHeight * ((minutes % slotMinutes) / slotMinutes)
		));
	}


	function getAllDayRow(index) {
		return allDayRow;
	}


	function defaultEventEnd(event) {
		var start = cloneDate(event.start);
		if (event.allDay) {
			return start;
		}
		return addMinutes(start, opt('defaultEventMinutes'));
	}



	/* Selection
	---------------------------------------------------------------------------------*/


	function defaultSelectionEnd(startDate, allDay) {
		if (allDay) {
			return cloneDate(startDate);
		}
		return addMinutes(cloneDate(startDate), opt('slotMinutes'));
	}


	function renderSelection(startDate, endDate, allDay) { // only for all-day
		if (allDay) {
			if (opt('allDaySlot')) {
				renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true);
			}
		}else{
			renderSlotSelection(startDate, endDate);
		}
	}


	function renderSlotSelection(startDate, endDate) {
		var helperOption = opt('selectHelper');
		coordinateGrid.build();
		if (helperOption) {
			var col = dateToCell(startDate).col;
			if (col >= 0 && col < colCnt) { // only works when times are on same day
				var rect = coordinateGrid.rect(0, col, 0, col, slotContainer); // only for horizontal coords
				var top = timePosition(startDate, startDate);
				var bottom = timePosition(startDate, endDate);
				if (bottom > top) { // protect against selections that are entirely before or after visible range
					rect.top = top;
					rect.height = bottom - top;
					rect.left += 2;
					rect.width -= 5;
					if ($.isFunction(helperOption)) {
						var helperRes = helperOption(startDate, endDate);
						if (helperRes) {
							rect.position = 'absolute';
							selectionHelper = $(helperRes)
								.css(rect)
								.appendTo(slotContainer);
						}
					}else{
						rect.isStart = true; // conside rect a "seg" now
						rect.isEnd = true;   //
						selectionHelper = $(slotSegHtml(
							{
								title: '',
								start: startDate,
								end: endDate,
								className: ['fc-select-helper'],
								editable: false
							},
							rect
						));
						selectionHelper.css('opacity', opt('dragOpacity'));
					}
					if (selectionHelper) {
						slotBind(selectionHelper);
						slotContainer.append(selectionHelper);
						setOuterWidth(selectionHelper, rect.width, true); // needs to be after appended
						setOuterHeight(selectionHelper, rect.height, true);
					}
				}
			}
		}else{
			renderSlotOverlay(startDate, endDate);
		}
	}


	function clearSelection() {
		clearOverlays();
		if (selectionHelper) {
			selectionHelper.remove();
			selectionHelper = null;
		}
	}


	function slotSelectionMousedown(ev) {
		if (ev.which == 1 && opt('selectable')) { // ev.which==1 means left mouse button
			unselect(ev);
			var dates;
			hoverListener.start(function(cell, origCell) {
				clearSelection();
				if (cell && cell.col == origCell.col && !getIsCellAllDay(cell)) {
					var d1 = realCellToDate(origCell);
					var d2 = realCellToDate(cell);
					dates = [
						d1,
						addMinutes(cloneDate(d1), snapMinutes), // calculate minutes depending on selection slot minutes
						d2,
						addMinutes(cloneDate(d2), snapMinutes)
					].sort(dateCompare);
					renderSlotSelection(dates[0], dates[3]);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						reportDayClick(dates[0], false, ev);
					}
					reportSelection(dates[0], dates[3], false, ev);
				}
			});
		}
	}


	function reportDayClick(date, allDay, ev) {
		trigger('dayClick', dayBodyCells[dateToCell(date).col], date, allDay, ev);
	}



	/* External Dragging
	--------------------------------------------------------------------------------*/


	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				if (getIsCellAllDay(cell)) {
					renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
				}else{
					var d1 = realCellToDate(cell);
					var d2 = addMinutes(cloneDate(d1), opt('defaultEventMinutes'));
					renderSlotOverlay(d1, d2);
				}
			}
		}, ev);
	}


	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			trigger('drop', _dragElement, realCellToDate(cell), getIsCellAllDay(cell), ev, ui);
		}
	}


}

;;

function AgendaEventRenderer() {
	var t = this;


	// exports
	t.renderEvents = renderEvents;
	t.clearEvents = clearEvents;
	t.slotSegHtml = slotSegHtml;


	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var eventEnd = t.eventEnd;
	var eventElementHandlers = t.eventElementHandlers;
	var setHeight = t.setHeight;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getSlotSegmentContainer = t.getSlotSegmentContainer;
	var getHoverListener = t.getHoverListener;
	var getMaxMinute = t.getMaxMinute;
	var getMinMinute = t.getMinMinute;
	var timePosition = t.timePosition;
	var getIsCellAllDay = t.getIsCellAllDay;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var cellToDate = t.cellToDate;
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var getSnapHeight = t.getSnapHeight;
	var getSnapMinutes = t.getSnapMinutes;
	var getSlotContainer = t.getSlotContainer;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var eventResize = t.eventResize;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var renderDayEvents = t.renderDayEvents;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;


	// overrides
	t.draggableDayEvent = draggableDayEvent;



	/* Rendering
	----------------------------------------------------------------------------*/


	function renderEvents(events, modifiedEventId) {
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}

		if (opt('allDaySlot')) {
			renderDayEvents(dayEvents, modifiedEventId);
			setHeight(); // no params means set to viewHeight
		}

		renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);
	}


	function clearEvents() {
		getDaySegmentContainer().empty();
		getSlotSegmentContainer().empty();
	}


	function compileSlotSegs(events) {
		var colCnt = getColCnt(),
			minMinute = getMinMinute(),
			maxMinute = getMaxMinute(),
			d,
			visEventEnds = $.map(events, slotEventEnd),
			i,
			j, seg,
			colSegs,
			segs = [];

		for (i=0; i<colCnt; i++) {

			d = cellToDate(0, i);
			addMinutes(d, minMinute);

			colSegs = sliceSegs(
				events,
				visEventEnds,
				d,
				addMinutes(cloneDate(d), maxMinute-minMinute)
			);

			colSegs = placeSlotSegs(colSegs); // returns a new order

			for (j=0; j<colSegs.length; j++) {
				seg = colSegs[j];
				seg.col = i;
				segs.push(seg);
			}
		}

		return segs;
	}


	function sliceSegs(events, visEventEnds, start, end) {
		var segs = [],
			i, len=events.length, event,
			eventStart, eventEnd,
			segStart, segEnd,
			isStart, isEnd;
		for (i=0; i<len; i++) {
			event = events[i];
			eventStart = event.start;
			eventEnd = visEventEnds[i];
			if (eventEnd > start && eventStart < end) {
				if (eventStart < start) {
					segStart = cloneDate(start);
					isStart = false;
				}else{
					segStart = eventStart;
					isStart = true;
				}
				if (eventEnd > end) {
					segEnd = cloneDate(end);
					isEnd = false;
				}else{
					segEnd = eventEnd;
					isEnd = true;
				}
				segs.push({
					event: event,
					start: segStart,
					end: segEnd,
					isStart: isStart,
					isEnd: isEnd
				});
			}
		}
		return segs.sort(compareSlotSegs);
	}


	function slotEventEnd(event) {
		if (event.end) {
			return cloneDate(event.end);
		}else{
			return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
		}
	}


	// renders events in the 'time slots' at the bottom
	// TODO: when we refactor this, when user returns `false` eventRender, don't have empty space
	// TODO: refactor will include using pixels to detect collisions instead of dates (handy for seg cmp)

	function renderSlotSegs(segs, modifiedEventId) {

		var i, segCnt=segs.length, seg,
			event,
			top,
			bottom,
			columnLeft,
			columnRight,
			columnWidth,
			width,
			left,
			right,
			html = '',
			eventElements,
			eventElement,
			triggerRes,
			titleElement,
			height,
			slotSegmentContainer = getSlotSegmentContainer(),
			isRTL = opt('isRTL');

		// calculate position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			top = timePosition(seg.start, seg.start);
			bottom = timePosition(seg.start, seg.end);
			columnLeft = colContentLeft(seg.col);
			columnRight = colContentRight(seg.col);
			columnWidth = columnRight - columnLeft;

			// shave off space on right near scrollbars (2.5%)
			// TODO: move this to CSS somehow
			columnRight -= columnWidth * .025;
			columnWidth = columnRight - columnLeft;

			width = columnWidth * (seg.forwardCoord - seg.backwardCoord);

			if (opt('slotEventOverlap')) {
				// double the width while making sure resize handle is visible
				// (assumed to be 20px wide)
				width = Math.max(
					(width - (20/2)) * 2,
					width // narrow columns will want to make the segment smaller than
						// the natural width. don't allow it
				);
			}

			if (isRTL) {
				right = columnRight - seg.backwardCoord * columnWidth;
				left = right - width;
			}
			else {
				left = columnLeft + seg.backwardCoord * columnWidth;
				right = left + width;
			}

			// make sure horizontal coordinates are in bounds
			left = Math.max(left, columnLeft);
			right = Math.min(right, columnRight);
			width = right - left;

			seg.top = top;
			seg.left = left;
			seg.outerWidth = width;
			seg.outerHeight = bottom - top;
			html += slotSegHtml(event, seg);
		}

		slotSegmentContainer[0].innerHTML = html; // faster than html()
		eventElements = slotSegmentContainer.children();

		// retrieve elements, run through eventRender callback, bind event handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			eventElement = $(eventElements[i]); // faster than eq()
			triggerRes = trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes)
						.css({
							position: 'absolute',
							top: seg.top,
							left: seg.left
						})
						.appendTo(slotSegmentContainer);
				}
				seg.element = eventElement;
				if (event._id === modifiedEventId) {
					bindSlotSeg(event, eventElement, seg);
				}else{
					eventElement[0]._fci = i; // for lazySegBind
				}
				reportEventElement(event, eventElement);
			}
		}

		lazySegBind(slotSegmentContainer, segs, bindSlotSeg);

		// record event sides and title positions
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				seg.vsides = vsides(eventElement, true);
				seg.hsides = hsides(eventElement, true);
				titleElement = eventElement.find('.fc-event-title');
				if (titleElement.length) {
					seg.contentTop = titleElement[0].offsetTop;
				}
			}
		}

		// set all positions/dimensions at once
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
				height = Math.max(0, seg.outerHeight - seg.vsides);
				eventElement[0].style.height = height + 'px';
				event = seg.event;
				if (seg.contentTop !== undefined && height - seg.contentTop < 10) {
					// not enough room for title, put it in the time (TODO: maybe make both display:inline instead)
					eventElement.find('div.fc-event-time')
						.text(formatDate(event.start, opt('timeFormat')) + ' - ' + event.title);
					eventElement.find('div.fc-event-title')
						.remove();
				}
				trigger('eventAfterRender', event, event, eventElement);
			}
		}

	}


	function slotSegHtml(event, seg) {
		var html = "<";
		var url = event.url;
		var skinCss = getSkinCss(event, opt);
		var classes = ['fc-event', 'fc-event-vert'];
		if (isEventDraggable(event)) {
			classes.push('fc-event-draggable');
		}
		if (seg.isStart) {
			classes.push('fc-event-start');
		}
		if (seg.isEnd) {
			classes.push('fc-event-end');
		}
		classes = classes.concat(event.className);
		if (event.source) {
			classes = classes.concat(event.source.className || []);
		}
		if (url) {
			html += "a href='" + htmlEscape(event.url) + "'";
		}else{
			html += "div";
		}
		html +=
			" class='" + classes.join(' ') + "'" +
			" style=" +
				"'" +
				"position:absolute;" +
				"top:" + seg.top + "px;" +
				"left:" + seg.left + "px;" +
				skinCss +
				"'" +
			">" +
			"<div class='fc-event-inner'>" +
			"<div class='fc-event-time'>" +
			htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
			"</div>" +
			"<div class='fc-event-title'>" +
			htmlEscape(event.title || '') +
			"</div>" +
			"</div>" +
			"<div class='fc-event-bg'></div>";
		if (seg.isEnd && isEventResizable(event)) {
			html +=
				"<div class='ui-resizable-handle ui-resizable-s'>=</div>";
		}
		html +=
			"</" + (url ? "a" : "div") + ">";
		return html;
	}


	function bindSlotSeg(event, eventElement, seg) {
		var timeElement = eventElement.find('div.fc-event-time');
		if (isEventDraggable(event)) {
			draggableSlotEvent(event, eventElement, timeElement);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableSlotEvent(event, eventElement, timeElement);
		}
		eventElementHandlers(event, eventElement);
	}



	/* Dragging
	-----------------------------------------------------------------------------------*/


	// when event starts out FULL-DAY
	// overrides DayEventRenderer's version because it needs to account for dragging elements
	// to and from the slot area.

	function draggableDayEvent(event, eventElement, seg) {
		var isStart = seg.isStart;
		var origWidth;
		var revert;
		var allDay = true;
		var dayDelta;
		var hoverListener = getHoverListener();
		var colWidth = getColWidth();
		var snapHeight = getSnapHeight();
		var snapMinutes = getSnapMinutes();
		var minMinute = getMinMinute();
		eventElement.draggable({
			opacity: opt('dragOpacity', 'month'), // use whatever the month view was using
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {
				trigger('eventDragStart', eventElement, event, ev, ui);
				hideEvents(event, eventElement);
				origWidth = eventElement.width();
				hoverListener.start(function(cell, origCell) {
					clearOverlays();
					if (cell) {
						revert = false;
						var origDate = cellToDate(0, origCell.col);
						var date = cellToDate(0, cell.col);
						dayDelta = dayDiff(date, origDate);
						if (!cell.row) {
							// on full-days
							renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
							resetElement();
						}else{
							// mouse is over bottom slots
							if (isStart) {
								if (allDay) {
									// convert event to temporary slot-event
									eventElement.width(colWidth - 10); // don't use entire width
									setOuterHeight(
										eventElement,
										snapHeight * Math.round(
											(event.end ? ((event.end - event.start) / MINUTE_MS) : opt('defaultEventMinutes')) /
												snapMinutes
										)
									);
									eventElement.draggable('option', 'grid', [colWidth, 1]);
									allDay = false;
								}
							}else{
								revert = true;
							}
						}
						revert = revert || (allDay && !dayDelta);
					}else{
						resetElement();
						revert = true;
					}
					eventElement.draggable('option', 'revert', revert);
				}, ev, 'drag');
			},
			stop: function(ev, ui) {
				hoverListener.stop();
				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);
				if (revert) {
					// hasn't moved or is out of bounds (draggable has already reverted)
					resetElement();
					eventElement.css('filter', ''); // clear IE opacity side-effects
					showEvents(event, eventElement);
				}else{
					// changed!
					var minuteDelta = 0;
					if (!allDay) {
						minuteDelta = Math.round((eventElement.offset().top - getSlotContainer().offset().top) / snapHeight)
							* snapMinutes
							+ minMinute
							- (event.start.getHours() * 60 + event.start.getMinutes());
					}
					eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
				}
			}
		});
		function resetElement() {
			if (!allDay) {
				eventElement
					.width(origWidth)
					.height('')
					.draggable('option', 'grid', null);
				allDay = true;
			}
		}
	}


	// when event starts out IN TIMESLOTS

	function draggableSlotEvent(event, eventElement, timeElement) {
		var coordinateGrid = t.getCoordinateGrid();
		var colCnt = getColCnt();
		var colWidth = getColWidth();
		var snapHeight = getSnapHeight();
		var snapMinutes = getSnapMinutes();

		// states
		var origPosition; // original position of the element, not the mouse
		var origCell;
		var isInBounds, prevIsInBounds;
		var isAllDay, prevIsAllDay;
		var colDelta, prevColDelta;
		var dayDelta; // derived from colDelta
		var minuteDelta, prevMinuteDelta;

		eventElement.draggable({
			scroll: false,
			grid: [ colWidth, snapHeight ],
			axis: colCnt==1 ? 'y' : false,
			opacity: opt('dragOpacity'),
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {

				trigger('eventDragStart', eventElement, event, ev, ui);
				hideEvents(event, eventElement);

				coordinateGrid.build();

				// initialize states
				origPosition = eventElement.position();
				origCell = coordinateGrid.cell(ev.pageX, ev.pageY);
				isInBounds = prevIsInBounds = true;
				isAllDay = prevIsAllDay = getIsCellAllDay(origCell);
				colDelta = prevColDelta = 0;
				dayDelta = 0;
				minuteDelta = prevMinuteDelta = 0;

			},
			drag: function(ev, ui) {

				// NOTE: this `cell` value is only useful for determining in-bounds and all-day.
				// Bad for anything else due to the discrepancy between the mouse position and the
				// element position while snapping. (problem revealed in PR #55)
				//
				// PS- the problem exists for draggableDayEvent() when dragging an all-day event to a slot event.
				// We should overhaul the dragging system and stop relying on jQuery UI.
				var cell = coordinateGrid.cell(ev.pageX, ev.pageY);

				// update states
				isInBounds = !!cell;
				if (isInBounds) {
					isAllDay = getIsCellAllDay(cell);

					// calculate column delta
					colDelta = Math.round((ui.position.left - origPosition.left) / colWidth);
					if (colDelta != prevColDelta) {
						// calculate the day delta based off of the original clicked column and the column delta
						var origDate = cellToDate(0, origCell.col);
						var col = origCell.col + colDelta;
						col = Math.max(0, col);
						col = Math.min(colCnt-1, col);
						var date = cellToDate(0, col);
						dayDelta = dayDiff(date, origDate);
					}

					// calculate minute delta (only if over slots)
					if (!isAllDay) {
						minuteDelta = Math.round((ui.position.top - origPosition.top) / snapHeight) * snapMinutes;
					}
				}

				// any state changes?
				if (
					isInBounds != prevIsInBounds ||
					isAllDay != prevIsAllDay ||
					colDelta != prevColDelta ||
					minuteDelta != prevMinuteDelta
				) {

					updateUI();

					// update previous states for next time
					prevIsInBounds = isInBounds;
					prevIsAllDay = isAllDay;
					prevColDelta = colDelta;
					prevMinuteDelta = minuteDelta;
				}

				// if out-of-bounds, revert when done, and vice versa.
				eventElement.draggable('option', 'revert', !isInBounds);

			},
			stop: function(ev, ui) {

				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);

				if (isInBounds && (isAllDay || dayDelta || minuteDelta)) { // changed!
					eventDrop(this, event, dayDelta, isAllDay ? 0 : minuteDelta, isAllDay, ev, ui);
				}
				else { // either no change or out-of-bounds (draggable has already reverted)

					// reset states for next time, and for updateUI()
					isInBounds = true;
					isAllDay = false;
					colDelta = 0;
					dayDelta = 0;
					minuteDelta = 0;

					updateUI();
					eventElement.css('filter', ''); // clear IE opacity side-effects

					// sometimes fast drags make event revert to wrong position, so reset.
					// also, if we dragged the element out of the area because of snapping,
					// but the *mouse* is still in bounds, we need to reset the position.
					eventElement.css(origPosition);

					showEvents(event, eventElement);
				}
			}
		});

		function updateUI() {
			clearOverlays();
			if (isInBounds) {
				if (isAllDay) {
					timeElement.hide();
					eventElement.draggable('option', 'grid', null); // disable grid snapping
					renderDayOverlay(
						addDays(cloneDate(event.start), dayDelta),
						addDays(exclEndDay(event), dayDelta)
					);
				}
				else {
					updateTimeText(minuteDelta);
					timeElement.css('display', ''); // show() was causing display=inline
					eventElement.draggable('option', 'grid', [colWidth, snapHeight]); // re-enable grid snapping
				}
			}
		}

		function updateTimeText(minuteDelta) {
			var newStart = addMinutes(cloneDate(event.start), minuteDelta);
			var newEnd;
			if (event.end) {
				newEnd = addMinutes(cloneDate(event.end), minuteDelta);
			}
			timeElement.text(formatDates(newStart, newEnd, opt('timeFormat')));
		}

	}



	/* Resizing
	--------------------------------------------------------------------------------------*/


	function resizableSlotEvent(event, eventElement, timeElement) {
		var snapDelta, prevSnapDelta;
		var snapHeight = getSnapHeight();
		var snapMinutes = getSnapMinutes();
		eventElement.resizable({
			handles: {
				s: '.ui-resizable-handle'
			},
			grid: snapHeight,
			start: function(ev, ui) {
				snapDelta = prevSnapDelta = 0;
				hideEvents(event, eventElement);
				trigger('eventResizeStart', this, event, ev, ui);
			},
			resize: function(ev, ui) {
				// don't rely on ui.size.height, doesn't take grid into account
				snapDelta = Math.round((Math.max(snapHeight, eventElement.height()) - ui.originalSize.height) / snapHeight);
				if (snapDelta != prevSnapDelta) {
					timeElement.text(
						formatDates(
							event.start,
							(!snapDelta && !event.end) ? null : // no change, so don't display time range
								addMinutes(eventEnd(event), snapMinutes*snapDelta),
							opt('timeFormat')
						)
					);
					prevSnapDelta = snapDelta;
				}
			},
			stop: function(ev, ui) {
				trigger('eventResizeStop', this, event, ev, ui);
				if (snapDelta) {
					eventResize(this, event, 0, snapMinutes*snapDelta, ev, ui);
				}else{
					showEvents(event, eventElement);
					// BUG: if event was really short, need to put title back in span
				}
			}
		});
	}


}



/* Agenda Event Segment Utilities
-----------------------------------------------------------------------------*/


// Sets the seg.backwardCoord and seg.forwardCoord on each segment and returns a new
// list in the order they should be placed into the DOM (an implicit z-index).
function placeSlotSegs(segs) {
	var levels = buildSlotSegLevels(segs);
	var level0 = levels[0];
	var i;

	computeForwardSlotSegs(levels);

	if (level0) {

		for (i=0; i<level0.length; i++) {
			computeSlotSegPressures(level0[i]);
		}

		for (i=0; i<level0.length; i++) {
			computeSlotSegCoords(level0[i], 0, 0);
		}
	}

	return flattenSlotSegLevels(levels);
}


// Builds an array of segments "levels". The first level will be the leftmost tier of segments
// if the calendar is left-to-right, or the rightmost if the calendar is right-to-left.
function buildSlotSegLevels(segs) {
	var levels = [];
	var i, seg;
	var j;

	for (i=0; i<segs.length; i++) {
		seg = segs[i];

		// go through all the levels and stop on the first level where there are no collisions
		for (j=0; j<levels.length; j++) {
			if (!computeSlotSegCollisions(seg, levels[j]).length) {
				break;
			}
		}

		(levels[j] || (levels[j] = [])).push(seg);
	}

	return levels;
}


// For every segment, figure out the other segments that are in subsequent
// levels that also occupy the same vertical space. Accumulate in seg.forwardSegs
function computeForwardSlotSegs(levels) {
	var i, level;
	var j, seg;
	var k;

	for (i=0; i<levels.length; i++) {
		level = levels[i];

		for (j=0; j<level.length; j++) {
			seg = level[j];

			seg.forwardSegs = [];
			for (k=i+1; k<levels.length; k++) {
				computeSlotSegCollisions(seg, levels[k], seg.forwardSegs);
			}
		}
	}
}


// Figure out which path forward (via seg.forwardSegs) results in the longest path until
// the furthest edge is reached. The number of segments in this path will be seg.forwardPressure
function computeSlotSegPressures(seg) {
	var forwardSegs = seg.forwardSegs;
	var forwardPressure = 0;
	var i, forwardSeg;

	if (seg.forwardPressure === undefined) { // not already computed

		for (i=0; i<forwardSegs.length; i++) {
			forwardSeg = forwardSegs[i];

			// figure out the child's maximum forward path
			computeSlotSegPressures(forwardSeg);

			// either use the existing maximum, or use the child's forward pressure
			// plus one (for the forwardSeg itself)
			forwardPressure = Math.max(
				forwardPressure,
				1 + forwardSeg.forwardPressure
			);
		}

		seg.forwardPressure = forwardPressure;
	}
}


// Calculate seg.forwardCoord and seg.backwardCoord for the segment, where both values range
// from 0 to 1. If the calendar is left-to-right, the seg.backwardCoord maps to "left" and
// seg.forwardCoord maps to "right" (via percentage). Vice-versa if the calendar is right-to-left.
//
// The segment might be part of a "series", which means consecutive segments with the same pressure
// who's width is unknown until an edge has been hit. `seriesBackwardPressure` is the number of
// segments behind this one in the current series, and `seriesBackwardCoord` is the starting
// coordinate of the first segment in the series.
function computeSlotSegCoords(seg, seriesBackwardPressure, seriesBackwardCoord) {
	var forwardSegs = seg.forwardSegs;
	var i;

	if (seg.forwardCoord === undefined) { // not already computed

		if (!forwardSegs.length) {

			// if there are no forward segments, this segment should butt up against the edge
			seg.forwardCoord = 1;
		}
		else {

			// sort highest pressure first
			forwardSegs.sort(compareForwardSlotSegs);

			// this segment's forwardCoord will be calculated from the backwardCoord of the
			// highest-pressure forward segment.
			computeSlotSegCoords(forwardSegs[0], seriesBackwardPressure + 1, seriesBackwardCoord);
			seg.forwardCoord = forwardSegs[0].backwardCoord;
		}

		// calculate the backwardCoord from the forwardCoord. consider the series
		seg.backwardCoord = seg.forwardCoord -
			(seg.forwardCoord - seriesBackwardCoord) / // available width for series
			(seriesBackwardPressure + 1); // # of segments in the series

		// use this segment's coordinates to computed the coordinates of the less-pressurized
		// forward segments
		for (i=0; i<forwardSegs.length; i++) {
			computeSlotSegCoords(forwardSegs[i], 0, seg.forwardCoord);
		}
	}
}


// Outputs a flat array of segments, from lowest to highest level
function flattenSlotSegLevels(levels) {
	var segs = [];
	var i, level;
	var j;

	for (i=0; i<levels.length; i++) {
		level = levels[i];

		for (j=0; j<level.length; j++) {
			segs.push(level[j]);
		}
	}

	return segs;
}


// Find all the segments in `otherSegs` that vertically collide with `seg`.
// Append into an optionally-supplied `results` array and return.
function computeSlotSegCollisions(seg, otherSegs, results) {
	results = results || [];

	for (var i=0; i<otherSegs.length; i++) {
		if (isSlotSegCollision(seg, otherSegs[i])) {
			results.push(otherSegs[i]);
		}
	}

	return results;
}


// Do these segments occupy the same vertical space?
function isSlotSegCollision(seg1, seg2) {
	return seg1.end > seg2.start && seg1.start < seg2.end;
}


// A cmp function for determining which forward segment to rely on more when computing coordinates.
function compareForwardSlotSegs(seg1, seg2) {
	// put higher-pressure first
	return seg2.forwardPressure - seg1.forwardPressure ||
		// put segments that are closer to initial edge first (and favor ones with no coords yet)
		(seg1.backwardCoord || 0) - (seg2.backwardCoord || 0) ||
		// do normal sorting...
		compareSlotSegs(seg1, seg2);
}


// A cmp function for determining which segment should be closer to the initial edge
// (the left edge on a left-to-right calendar).
function compareSlotSegs(seg1, seg2) {
	return seg1.start - seg2.start || // earlier start time goes first
		(seg2.end - seg2.start) - (seg1.end - seg1.start) || // tie? longer-duration goes first
		(seg1.event.title || '').localeCompare(seg2.event.title); // tie? alphabetically by title
}


;;


function View(element, calendar, viewName) {
	var t = this;


	// exports
	t.element = element;
	t.calendar = calendar;
	t.name = viewName;
	t.opt = opt;
	t.trigger = trigger;
	t.isEventDraggable = isEventDraggable;
	t.isEventResizable = isEventResizable;
	t.setEventData = setEventData;
	t.clearEventData = clearEventData;
	t.eventEnd = eventEnd;
	t.reportEventElement = reportEventElement;
	t.triggerEventDestroy = triggerEventDestroy;
	t.eventElementHandlers = eventElementHandlers;
	t.showEvents = showEvents;
	t.hideEvents = hideEvents;
	t.eventDrop = eventDrop;
	t.eventResize = eventResize;
	// t.title
	// t.start, t.end
	// t.visStart, t.visEnd


	// imports
	var defaultEventEnd = t.defaultEventEnd;
	var normalizeEvent = calendar.normalizeEvent; // in EventManager
	var reportEventChange = calendar.reportEventChange;


	// locals
	var eventsByID = {}; // eventID mapped to array of events (there can be multiple b/c of repeating events)
	var eventElementsByID = {}; // eventID mapped to array of jQuery elements
	var eventElementCouples = []; // array of objects, { event, element } // TODO: unify with segment system
	var options = calendar.options;



	function opt(name, viewNameOverride) {
		var v = options[name];
		if ($.isPlainObject(v)) {
			return smartProperty(v, viewNameOverride || viewName);
		}
		return v;
	}


	function trigger(name, thisObj) {
		return calendar.trigger.apply(
			calendar,
			[name, thisObj || t].concat(Array.prototype.slice.call(arguments, 2), [t])
		);
	}



	/* Event Editable Boolean Calculations
	------------------------------------------------------------------------------*/


	function isEventDraggable(event) {
		var source = event.source || {};
		return firstDefined(
				event.startEditable,
				source.startEditable,
				opt('eventStartEditable'),
				event.editable,
				source.editable,
				opt('editable')
			)
			&& !opt('disableDragging'); // deprecated
	}


	function isEventResizable(event) { // but also need to make sure the seg.isEnd == true
		var source = event.source || {};
		return firstDefined(
				event.durationEditable,
				source.durationEditable,
				opt('eventDurationEditable'),
				event.editable,
				source.editable,
				opt('editable')
			)
			&& !opt('disableResizing'); // deprecated
	}



	/* Event Data
	------------------------------------------------------------------------------*/


	function setEventData(events) { // events are already normalized at this point
		eventsByID = {};
		var i, len=events.length, event;
		for (i=0; i<len; i++) {
			event = events[i];
			if (eventsByID[event._id]) {
				eventsByID[event._id].push(event);
			}else{
				eventsByID[event._id] = [event];
			}
		}
	}


	function clearEventData() {
		eventsByID = {};
		eventElementsByID = {};
		eventElementCouples = [];
	}


	// returns a Date object for an event's end
	function eventEnd(event) {
		return event.end ? cloneDate(event.end) : defaultEventEnd(event);
	}



	/* Event Elements
	------------------------------------------------------------------------------*/


	// report when view creates an element for an event
	function reportEventElement(event, element) {
		eventElementCouples.push({ event: event, element: element });
		if (eventElementsByID[event._id]) {
			eventElementsByID[event._id].push(element);
		}else{
			eventElementsByID[event._id] = [element];
		}
	}


	function triggerEventDestroy() {
		$.each(eventElementCouples, function(i, couple) {
			t.trigger('eventDestroy', couple.event, couple.event, couple.element);
		});
	}


	// attaches eventClick, eventMouseover, eventMouseout
	function eventElementHandlers(event, eventElement) {
		eventElement
			.click(function(ev) {
				if (!eventElement.hasClass('ui-draggable-dragging') &&
					!eventElement.hasClass('ui-resizable-resizing')) {
						return trigger('eventClick', this, event, ev);
					}
			})
			.hover(
				function(ev) {
					trigger('eventMouseover', this, event, ev);
				},
				function(ev) {
					trigger('eventMouseout', this, event, ev);
				}
			);
		// TODO: don't fire eventMouseover/eventMouseout *while* dragging is occuring (on subject element)
		// TODO: same for resizing
	}


	function showEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'show');
	}


	function hideEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'hide');
	}


	function eachEventElement(event, exceptElement, funcName) {
		// NOTE: there may be multiple events per ID (repeating events)
		// and multiple segments per event
		var elements = eventElementsByID[event._id],
			i, len = elements.length;
		for (i=0; i<len; i++) {
			if (!exceptElement || elements[i][0] != exceptElement[0]) {
				elements[i][funcName]();
			}
		}
	}



	/* Event Modification Reporting
	---------------------------------------------------------------------------------*/


	function eventDrop(e, event, dayDelta, minuteDelta, allDay, ev, ui) {
		var oldAllDay = event.allDay;
		var eventId = event._id;
		moveEvents(eventsByID[eventId], dayDelta, minuteDelta, allDay);
		trigger(
			'eventDrop',
			e,
			event,
			dayDelta,
			minuteDelta,
			allDay,
			function() {
				// TODO: investigate cases where this inverse technique might not work
				moveEvents(eventsByID[eventId], -dayDelta, -minuteDelta, oldAllDay);
				reportEventChange(eventId);
			},
			ev,
			ui
		);
		reportEventChange(eventId);
	}


	function eventResize(e, event, dayDelta, minuteDelta, ev, ui) {
		var eventId = event._id;
		elongateEvents(eventsByID[eventId], dayDelta, minuteDelta);
		trigger(
			'eventResize',
			e,
			event,
			dayDelta,
			minuteDelta,
			function() {
				// TODO: investigate cases where this inverse technique might not work
				elongateEvents(eventsByID[eventId], -dayDelta, -minuteDelta);
				reportEventChange(eventId);
			},
			ev,
			ui
		);
		reportEventChange(eventId);
	}



	/* Event Modification Math
	---------------------------------------------------------------------------------*/


	function moveEvents(events, dayDelta, minuteDelta, allDay) {
		minuteDelta = minuteDelta || 0;
		for (var e, len=events.length, i=0; i<len; i++) {
			e = events[i];
			if (allDay !== undefined) {
				e.allDay = allDay;
			}
			addMinutes(addDays(e.start, dayDelta, true), minuteDelta);
			if (e.end) {
				e.end = addMinutes(addDays(e.end, dayDelta, true), minuteDelta);
			}
			normalizeEvent(e, options);
		}
	}


	function elongateEvents(events, dayDelta, minuteDelta) {
		minuteDelta = minuteDelta || 0;
		for (var e, len=events.length, i=0; i<len; i++) {
			e = events[i];
			e.end = addMinutes(addDays(eventEnd(e), dayDelta, true), minuteDelta);
			normalizeEvent(e, options);
		}
	}



	// ====================================================================================================
	// Utilities for day "cells"
	// ====================================================================================================
	// The "basic" views are completely made up of day cells.
	// The "agenda" views have day cells at the top "all day" slot.
	// This was the obvious common place to put these utilities, but they should be abstracted out into
	// a more meaningful class (like DayEventRenderer).
	// ====================================================================================================


	// For determining how a given "cell" translates into a "date":
	//
	// 1. Convert the "cell" (row and column) into a "cell offset" (the # of the cell, cronologically from the first).
	//    Keep in mind that column indices are inverted with isRTL. This is taken into account.
	//
	// 2. Convert the "cell offset" to a "day offset" (the # of days since the first visible day in the view).
	//
	// 3. Convert the "day offset" into a "date" (a JavaScript Date object).
	//
	// The reverse transformation happens when transforming a date into a cell.


	// exports
	t.isHiddenDay = isHiddenDay;
	t.skipHiddenDays = skipHiddenDays;
	t.getCellsPerWeek = getCellsPerWeek;
	t.dateToCell = dateToCell;
	t.dateToDayOffset = dateToDayOffset;
	t.dayOffsetToCellOffset = dayOffsetToCellOffset;
	t.cellOffsetToCell = cellOffsetToCell;
	t.cellToDate = cellToDate;
	t.cellToCellOffset = cellToCellOffset;
	t.cellOffsetToDayOffset = cellOffsetToDayOffset;
	t.dayOffsetToDate = dayOffsetToDate;
	t.rangeToSegments = rangeToSegments;


	// internals
	var hiddenDays = opt('hiddenDays') || []; // array of day-of-week indices that are hidden
	var isHiddenDayHash = []; // is the day-of-week hidden? (hash with day-of-week-index -> bool)
	var cellsPerWeek;
	var dayToCellMap = []; // hash from dayIndex -> cellIndex, for one week
	var cellToDayMap = []; // hash from cellIndex -> dayIndex, for one week
	var isRTL = opt('isRTL');


	// initialize important internal variables
	(function() {

		if (opt('weekends') === false) {
			hiddenDays.push(0, 6); // 0=sunday, 6=saturday
		}

		// Loop through a hypothetical week and determine which
		// days-of-week are hidden. Record in both hashes (one is the reverse of the other).
		for (var dayIndex=0, cellIndex=0; dayIndex<7; dayIndex++) {
			dayToCellMap[dayIndex] = cellIndex;
			isHiddenDayHash[dayIndex] = $.inArray(dayIndex, hiddenDays) != -1;
			if (!isHiddenDayHash[dayIndex]) {
				cellToDayMap[cellIndex] = dayIndex;
				cellIndex++;
			}
		}

		cellsPerWeek = cellIndex;
		if (!cellsPerWeek) {
			throw 'invalid hiddenDays'; // all days were hidden? bad.
		}

	})();


	// Is the current day hidden?
	// `day` is a day-of-week index (0-6), or a Date object
	function isHiddenDay(day) {
		if (typeof day == 'object') {
			day = day.getDay();
		}
		return isHiddenDayHash[day];
	}


	function getCellsPerWeek() {
		return cellsPerWeek;
	}


	// Keep incrementing the current day until it is no longer a hidden day.
	// If the initial value of `date` is not a hidden day, don't do anything.
	// Pass `isExclusive` as `true` if you are dealing with an end date.
	// `inc` defaults to `1` (increment one day forward each time)
	function skipHiddenDays(date, inc, isExclusive) {
		inc = inc || 1;
		while (
			isHiddenDayHash[ ( date.getDay() + (isExclusive ? inc : 0) + 7 ) % 7 ]
		) {
			addDays(date, inc);
		}
	}


	//
	// TRANSFORMATIONS: cell -> cell offset -> day offset -> date
	//

	// cell -> date (combines all transformations)
	// Possible arguments:
	// - row, col
	// - { row:#, col: # }
	function cellToDate() {
		var cellOffset = cellToCellOffset.apply(null, arguments);
		var dayOffset = cellOffsetToDayOffset(cellOffset);
		var date = dayOffsetToDate(dayOffset);
		return date;
	}

	// cell -> cell offset
	// Possible arguments:
	// - row, col
	// - { row:#, col:# }
	function cellToCellOffset(row, col) {
		var colCnt = t.getColCnt();

		// rtl variables. wish we could pre-populate these. but where?
		var dis = isRTL ? -1 : 1;
		var dit = isRTL ? colCnt - 1 : 0;

		if (typeof row == 'object') {
			col = row.col;
			row = row.row;
		}
		var cellOffset = row * colCnt + (col * dis + dit); // column, adjusted for RTL (dis & dit)

		return cellOffset;
	}

	// cell offset -> day offset
	function cellOffsetToDayOffset(cellOffset) {
		var day0 = t.visStart.getDay(); // first date's day of week
		cellOffset += dayToCellMap[day0]; // normlize cellOffset to beginning-of-week
		return Math.floor(cellOffset / cellsPerWeek) * 7 // # of days from full weeks
			+ cellToDayMap[ // # of days from partial last week
				(cellOffset % cellsPerWeek + cellsPerWeek) % cellsPerWeek // crazy math to handle negative cellOffsets
			]
			- day0; // adjustment for beginning-of-week normalization
	}

	// day offset -> date (JavaScript Date object)
	function dayOffsetToDate(dayOffset) {
		var date = cloneDate(t.visStart);
		addDays(date, dayOffset);
		return date;
	}


	//
	// TRANSFORMATIONS: date -> day offset -> cell offset -> cell
	//

	// date -> cell (combines all transformations)
	function dateToCell(date) {
		var dayOffset = dateToDayOffset(date);
		var cellOffset = dayOffsetToCellOffset(dayOffset);
		var cell = cellOffsetToCell(cellOffset);
		return cell;
	}

	// date -> day offset
	function dateToDayOffset(date) {
		return dayDiff(date, t.visStart);
	}

	// day offset -> cell offset
	function dayOffsetToCellOffset(dayOffset) {
		var day0 = t.visStart.getDay(); // first date's day of week
		dayOffset += day0; // normalize dayOffset to beginning-of-week
		return Math.floor(dayOffset / 7) * cellsPerWeek // # of cells from full weeks
			+ dayToCellMap[ // # of cells from partial last week
				(dayOffset % 7 + 7) % 7 // crazy math to handle negative dayOffsets
			]
			- dayToCellMap[day0]; // adjustment for beginning-of-week normalization
	}

	// cell offset -> cell (object with row & col keys)
	function cellOffsetToCell(cellOffset) {
		var colCnt = t.getColCnt();

		// rtl variables. wish we could pre-populate these. but where?
		var dis = isRTL ? -1 : 1;
		var dit = isRTL ? colCnt - 1 : 0;

		var row = Math.floor(cellOffset / colCnt);
		var col = ((cellOffset % colCnt + colCnt) % colCnt) * dis + dit; // column, adjusted for RTL (dis & dit)
		return {
			row: row,
			col: col
		};
	}


	//
	// Converts a date range into an array of segment objects.
	// "Segments" are horizontal stretches of time, sliced up by row.
	// A segment object has the following properties:
	// - row
	// - cols
	// - isStart
	// - isEnd
	//
	function rangeToSegments(startDate, endDate) {
		var rowCnt = t.getRowCnt();
		var colCnt = t.getColCnt();
		var segments = []; // array of segments to return

		// day offset for given date range
		var rangeDayOffsetStart = dateToDayOffset(startDate);
		var rangeDayOffsetEnd = dateToDayOffset(endDate); // exclusive

		// first and last cell offset for the given date range
		// "last" implies inclusivity
		var rangeCellOffsetFirst = dayOffsetToCellOffset(rangeDayOffsetStart);
		var rangeCellOffsetLast = dayOffsetToCellOffset(rangeDayOffsetEnd) - 1;

		// loop through all the rows in the view
		for (var row=0; row<rowCnt; row++) {

			// first and last cell offset for the row
			var rowCellOffsetFirst = row * colCnt;
			var rowCellOffsetLast = rowCellOffsetFirst + colCnt - 1;

			// get the segment's cell offsets by constraining the range's cell offsets to the bounds of the row
			var segmentCellOffsetFirst = Math.max(rangeCellOffsetFirst, rowCellOffsetFirst);
			var segmentCellOffsetLast = Math.min(rangeCellOffsetLast, rowCellOffsetLast);

			// make sure segment's offsets are valid and in view
			if (segmentCellOffsetFirst <= segmentCellOffsetLast) {

				// translate to cells
				var segmentCellFirst = cellOffsetToCell(segmentCellOffsetFirst);
				var segmentCellLast = cellOffsetToCell(segmentCellOffsetLast);

				// view might be RTL, so order by leftmost column
				var cols = [ segmentCellFirst.col, segmentCellLast.col ].sort();

				// Determine if segment's first/last cell is the beginning/end of the date range.
				// We need to compare "day offset" because "cell offsets" are often ambiguous and
				// can translate to multiple days, and an edge case reveals itself when we the
				// range's first cell is hidden (we don't want isStart to be true).
				var isStart = cellOffsetToDayOffset(segmentCellOffsetFirst) == rangeDayOffsetStart;
				var isEnd = cellOffsetToDayOffset(segmentCellOffsetLast) + 1 == rangeDayOffsetEnd; // +1 for comparing exclusively

				segments.push({
					row: row,
					leftCol: cols[0],
					rightCol: cols[1],
					isStart: isStart,
					isEnd: isEnd
				});
			}
		}

		return segments;
	}


}

;;

function DayEventRenderer() {
	var t = this;


	// exports
	t.renderDayEvents = renderDayEvents;
	t.draggableDayEvent = draggableDayEvent; // made public so that subclasses can override
	t.resizableDayEvent = resizableDayEvent; // "


	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var eventEnd = t.eventEnd;
	var reportEventElement = t.reportEventElement;
	var eventElementHandlers = t.eventElementHandlers;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var eventResize = t.eventResize;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var allDayRow = t.allDayRow; // TODO: rename
	var colLeft = t.colLeft;
	var colRight = t.colRight;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var dateToCell = t.dateToCell;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var formatDates = t.calendar.formatDates;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var clearSelection = t.clearSelection;
	var getHoverListener = t.getHoverListener;
	var rangeToSegments = t.rangeToSegments;
	var cellToDate = t.cellToDate;
	var cellToCellOffset = t.cellToCellOffset;
	var cellOffsetToDayOffset = t.cellOffsetToDayOffset;
	var dateToDayOffset = t.dateToDayOffset;
	var dayOffsetToCellOffset = t.dayOffsetToCellOffset;


	// Render `events` onto the calendar, attach mouse event handlers, and call the `eventAfterRender` callback for each.
	// Mouse event will be lazily applied, except if the event has an ID of `modifiedEventId`.
	// Can only be called when the event container is empty (because it wipes out all innerHTML).
	function renderDayEvents(events, modifiedEventId) {

		// do the actual rendering. Receive the intermediate "segment" data structures.
		var segments = _renderDayEvents(
			events,
			false, // don't append event elements
			true // set the heights of the rows
		);

		// report the elements to the View, for general drag/resize utilities
		segmentElementEach(segments, function(segment, element) {
			reportEventElement(segment.event, element);
		});

		// attach mouse handlers
		attachHandlers(segments, modifiedEventId);

		// call `eventAfterRender` callback for each event
		segmentElementEach(segments, function(segment, element) {
			trigger('eventAfterRender', segment.event, segment.event, element);
		});
	}


	// Render an event on the calendar, but don't report them anywhere, and don't attach mouse handlers.
	// Append this event element to the event container, which might already be populated with events.
	// If an event's segment will have row equal to `adjustRow`, then explicitly set its top coordinate to `adjustTop`.
	// This hack is used to maintain continuity when user is manually resizing an event.
	// Returns an array of DOM elements for the event.
	function renderTempDayEvent(event, adjustRow, adjustTop) {

		// actually render the event. `true` for appending element to container.
		// Recieve the intermediate "segment" data structures.
		var segments = _renderDayEvents(
			[ event ],
			true, // append event elements
			false // don't set the heights of the rows
		);

		var elements = [];

		// Adjust certain elements' top coordinates
		segmentElementEach(segments, function(segment, element) {
			if (segment.row === adjustRow) {
				element.css('top', adjustTop);
			}
			elements.push(element[0]); // accumulate DOM nodes
		});

		return elements;
	}


	// Render events onto the calendar. Only responsible for the VISUAL aspect.
	// Not responsible for attaching handlers or calling callbacks.
	// Set `doAppend` to `true` for rendering elements without clearing the existing container.
	// Set `doRowHeights` to allow setting the height of each row, to compensate for vertical event overflow.
	function _renderDayEvents(events, doAppend, doRowHeights) {

		// where the DOM nodes will eventually end up
		var finalContainer = getDaySegmentContainer();

		// the container where the initial HTML will be rendered.
		// If `doAppend`==true, uses a temporary container.
		var renderContainer = doAppend ? $("<div/>") : finalContainer;

		var segments = buildSegments(events);
		var html;
		var elements;

		// calculate the desired `left` and `width` properties on each segment object
		calculateHorizontals(segments);

		// build the HTML string. relies on `left` property
		html = buildHTML(segments);

		// render the HTML. innerHTML is considerably faster than jQuery's .html()
		renderContainer[0].innerHTML = html;

		// retrieve the individual elements
		elements = renderContainer.children();

		// if we were appending, and thus using a temporary container,
		// re-attach elements to the real container.
		if (doAppend) {
			finalContainer.append(elements);
		}

		// assigns each element to `segment.event`, after filtering them through user callbacks
		resolveElements(segments, elements);

		// Calculate the left and right padding+margin for each element.
		// We need this for setting each element's desired outer width, because of the W3C box model.
		// It's important we do this in a separate pass from acually setting the width on the DOM elements
		// because alternating reading/writing dimensions causes reflow for every iteration.
		segmentElementEach(segments, function(segment, element) {
			segment.hsides = hsides(element, true); // include margins = `true`
		});

		// Set the width of each element
		segmentElementEach(segments, function(segment, element) {
			element.width(
				Math.max(0, segment.outerWidth - segment.hsides)
			);
		});

		// Grab each element's outerHeight (setVerticals uses this).
		// To get an accurate reading, it's important to have each element's width explicitly set already.
		segmentElementEach(segments, function(segment, element) {
			segment.outerHeight = element.outerHeight(true); // include margins = `true`
		});

		// Set the top coordinate on each element (requires segment.outerHeight)
		setVerticals(segments, doRowHeights);

		return segments;
	}


	// Generate an array of "segments" for all events.
	function buildSegments(events) {
		var segments = [];
		for (var i=0; i<events.length; i++) {
			var eventSegments = buildSegmentsForEvent(events[i]);
			segments.push.apply(segments, eventSegments); // append an array to an array
		}
		return segments;
	}


	// Generate an array of segments for a single event.
	// A "segment" is the same data structure that View.rangeToSegments produces,
	// with the addition of the `event` property being set to reference the original event.
	function buildSegmentsForEvent(event) {
		var startDate = event.start;
		var endDate = exclEndDay(event);
		var segments = rangeToSegments(startDate, endDate);
		for (var i=0; i<segments.length; i++) {
			segments[i].event = event;
		}
		return segments;
	}


	// Sets the `left` and `outerWidth` property of each segment.
	// These values are the desired dimensions for the eventual DOM elements.
	function calculateHorizontals(segments) {
		var isRTL = opt('isRTL');
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];

			// Determine functions used for calulating the elements left/right coordinates,
			// depending on whether the view is RTL or not.
			// NOTE:
			// colLeft/colRight returns the coordinate butting up the edge of the cell.
			// colContentLeft/colContentRight is indented a little bit from the edge.
			var leftFunc = (isRTL ? segment.isEnd : segment.isStart) ? colContentLeft : colLeft;
			var rightFunc = (isRTL ? segment.isStart : segment.isEnd) ? colContentRight : colRight;

			var left = leftFunc(segment.leftCol);
			var right = rightFunc(segment.rightCol);
			segment.left = left;
			segment.outerWidth = right - left;
		}
	}


	// Build a concatenated HTML string for an array of segments
	function buildHTML(segments) {
		var html = '';
		for (var i=0; i<segments.length; i++) {
			html += buildHTMLForSegment(segments[i]);
		}
		return html;
	}


	// Build an HTML string for a single segment.
	// Relies on the following properties:
	// - `segment.event` (from `buildSegmentsForEvent`)
	// - `segment.left` (from `calculateHorizontals`)
	function buildHTMLForSegment(segment) {
		var html = '';
		var isRTL = opt('isRTL');
		var event = segment.event;
		var url = event.url;

		// generate the list of CSS classNames
		var classNames = [ 'fc-event', 'fc-event-hori' ];
		if (isEventDraggable(event)) {
			classNames.push('fc-event-draggable');
		}
		if (segment.isStart) {
			classNames.push('fc-event-start');
		}
		if (segment.isEnd) {
			classNames.push('fc-event-end');
		}
		// use the event's configured classNames
		// guaranteed to be an array via `normalizeEvent`
		classNames = classNames.concat(event.className);
		if (event.source) {
			// use the event's source's classNames, if specified
			classNames = classNames.concat(event.source.className || []);
		}

		// generate a semicolon delimited CSS string for any of the "skin" properties
		// of the event object (`backgroundColor`, `borderColor` and such)
		var skinCss = getSkinCss(event, opt);

		if (url) {
			html += "<a href='" + htmlEscape(url) + "'";
		}else{
			html += "<div";
		}
		html +=
			" class='" + classNames.join(' ') + "'" +
			" style=" +
				"'" +
				"position:absolute;" +
				"left:" + segment.left + "px;" +
				skinCss +
				"'" +
			">" +
			"<div class='fc-event-inner'>";
		if (!event.allDay && segment.isStart) {
			html +=
				"<span class='fc-event-time'>" +
				htmlEscape(
					formatDates(event.start, event.end, opt('timeFormat'))
				) +
				"</span>";
		}
		html +=
			"<span class='fc-event-title'>" +
			htmlEscape(event.title || '') +
			"</span>" +
			"</div>";
		if (segment.isEnd && isEventResizable(event)) {
			html +=
				"<div class='ui-resizable-handle ui-resizable-" + (isRTL ? 'w' : 'e') + "'>" +
				"   " + // makes hit area a lot better for IE6/7
				"</div>";
		}
		html += "</" + (url ? "a" : "div") + ">";

		// TODO:
		// When these elements are initially rendered, they will be briefly visibile on the screen,
		// even though their widths/heights are not set.
		// SOLUTION: initially set them as visibility:hidden ?

		return html;
	}


	// Associate each segment (an object) with an element (a jQuery object),
	// by setting each `segment.element`.
	// Run each element through the `eventRender` filter, which allows developers to
	// modify an existing element, supply a new one, or cancel rendering.
	function resolveElements(segments, elements) {
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];
			var event = segment.event;
			var element = elements.eq(i);

			// call the trigger with the original element
			var triggerRes = trigger('eventRender', event, event, element);

			if (triggerRes === false) {
				// if `false`, remove the event from the DOM and don't assign it to `segment.event`
				element.remove();
			}
			else {
				if (triggerRes && triggerRes !== true) {
					// the trigger returned a new element, but not `true` (which means keep the existing element)

					// re-assign the important CSS dimension properties that were already assigned in `buildHTMLForSegment`
					triggerRes = $(triggerRes)
						.css({
							position: 'absolute',
							left: segment.left
						});

					element.replaceWith(triggerRes);
					element = triggerRes;
				}

				segment.element = element;
			}
		}
	}



	/* Top-coordinate Methods
	-------------------------------------------------------------------------------------------------*/


	// Sets the "top" CSS property for each element.
	// If `doRowHeights` is `true`, also sets each row's first cell to an explicit height,
	// so that if elements vertically overflow, the cell expands vertically to compensate.
	function setVerticals(segments, doRowHeights) {
		var rowContentHeights = calculateVerticals(segments); // also sets segment.top
		var rowContentElements = getRowContentElements(); // returns 1 inner div per row
		var rowContentTops = [];

		// Set each row's height by setting height of first inner div
		if (doRowHeights) {
			for (var i=0; i<rowContentElements.length; i++) {
				rowContentElements[i].height(rowContentHeights[i]);
			}
		}

		// Get each row's top, relative to the views's origin.
		// Important to do this after setting each row's height.
		for (var i=0; i<rowContentElements.length; i++) {
			rowContentTops.push(
				rowContentElements[i].position().top
			);
		}

		// Set each segment element's CSS "top" property.
		// Each segment object has a "top" property, which is relative to the row's top, but...
		segmentElementEach(segments, function(segment, element) {
			element.css(
				'top',
				rowContentTops[segment.row] + segment.top // ...now, relative to views's origin
			);
		});
	}


	// Calculate the "top" coordinate for each segment, relative to the "top" of the row.
	// Also, return an array that contains the "content" height for each row
	// (the height displaced by the vertically stacked events in the row).
	// Requires segments to have their `outerHeight` property already set.
	function calculateVerticals(segments) {
		var rowCnt = getRowCnt();
		var colCnt = getColCnt();
		var rowContentHeights = []; // content height for each row
		var segmentRows = buildSegmentRows(segments); // an array of segment arrays, one for each row

		for (var rowI=0; rowI<rowCnt; rowI++) {
			var segmentRow = segmentRows[rowI];

			// an array of running total heights for each column.
			// initialize with all zeros.
			var colHeights = [];
			for (var colI=0; colI<colCnt; colI++) {
				colHeights.push(0);
			}

			// loop through every segment
			for (var segmentI=0; segmentI<segmentRow.length; segmentI++) {
				var segment = segmentRow[segmentI];

				// find the segment's top coordinate by looking at the max height
				// of all the columns the segment will be in.
				segment.top = arrayMax(
					colHeights.slice(
						segment.leftCol,
						segment.rightCol + 1 // make exclusive for slice
					)
				);

				// adjust the columns to account for the segment's height
				for (var colI=segment.leftCol; colI<=segment.rightCol; colI++) {
					colHeights[colI] = segment.top + segment.outerHeight;
				}
			}

			// the tallest column in the row should be the "content height"
			rowContentHeights.push(arrayMax(colHeights));
		}

		return rowContentHeights;
	}


	// Build an array of segment arrays, each representing the segments that will
	// be in a row of the grid, sorted by which event should be closest to the top.
	function buildSegmentRows(segments) {
		var rowCnt = getRowCnt();
		var segmentRows = [];
		var segmentI;
		var segment;
		var rowI;

		// group segments by row
		for (segmentI=0; segmentI<segments.length; segmentI++) {
			segment = segments[segmentI];
			rowI = segment.row;
			if (segment.element) { // was rendered?
				if (segmentRows[rowI]) {
					// already other segments. append to array
					segmentRows[rowI].push(segment);
				}
				else {
					// first segment in row. create new array
					segmentRows[rowI] = [ segment ];
				}
			}
		}

		// sort each row
		for (rowI=0; rowI<rowCnt; rowI++) {
			segmentRows[rowI] = sortSegmentRow(
				segmentRows[rowI] || [] // guarantee an array, even if no segments
			);
		}

		return segmentRows;
	}


	// Sort an array of segments according to which segment should appear closest to the top
	function sortSegmentRow(segments) {
		var sortedSegments = [];

		// build the subrow array
		var subrows = buildSegmentSubrows(segments);

		// flatten it
		for (var i=0; i<subrows.length; i++) {
			sortedSegments.push.apply(sortedSegments, subrows[i]); // append an array to an array
		}

		return sortedSegments;
	}


	// Take an array of segments, which are all assumed to be in the same row,
	// and sort into subrows.
	function buildSegmentSubrows(segments) {

		// Give preference to elements with certain criteria, so they have
		// a chance to be closer to the top.
		segments.sort(compareDaySegments);

		var subrows = [];
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];

			// loop through subrows, starting with the topmost, until the segment
			// doesn't collide with other segments.
			for (var j=0; j<subrows.length; j++) {
				if (!isDaySegmentCollision(segment, subrows[j])) {
					break;
				}
			}
			// `j` now holds the desired subrow index
			if (subrows[j]) {
				subrows[j].push(segment);
			}
			else {
				subrows[j] = [ segment ];
			}
		}

		return subrows;
	}


	// Return an array of jQuery objects for the placeholder content containers of each row.
	// The content containers don't actually contain anything, but their dimensions should match
	// the events that are overlaid on top.
	function getRowContentElements() {
		var i;
		var rowCnt = getRowCnt();
		var rowDivs = [];
		for (i=0; i<rowCnt; i++) {
			rowDivs[i] = allDayRow(i)
				.find('div.fc-day-content > div');
		}
		return rowDivs;
	}



	/* Mouse Handlers
	---------------------------------------------------------------------------------------------------*/
	// TODO: better documentation!


	function attachHandlers(segments, modifiedEventId) {
		var segmentContainer = getDaySegmentContainer();

		segmentElementEach(segments, function(segment, element, i) {
			var event = segment.event;
			if (event._id === modifiedEventId) {
				bindDaySeg(event, element, segment);
			}else{
				element[0]._fci = i; // for lazySegBind
			}
		});

		lazySegBind(segmentContainer, segments, bindDaySeg);
	}


	function bindDaySeg(event, eventElement, segment) {

		if (isEventDraggable(event)) {
			t.draggableDayEvent(event, eventElement, segment); // use `t` so subclasses can override
		}

		if (
			segment.isEnd && // only allow resizing on the final segment for an event
			isEventResizable(event)
		) {
			t.resizableDayEvent(event, eventElement, segment); // use `t` so subclasses can override
		}

		// attach all other handlers.
		// needs to be after, because resizableDayEvent might stopImmediatePropagation on click
		eventElementHandlers(event, eventElement);
	}


	function draggableDayEvent(event, eventElement) {
		var hoverListener = getHoverListener();
		var dayDelta;
		eventElement.draggable({
			delay: 50,
			opacity: opt('dragOpacity'),
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {
				trigger('eventDragStart', eventElement, event, ev, ui);
				hideEvents(event, eventElement);
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
					clearOverlays();
					if (cell) {
						var origDate = cellToDate(origCell);
						var date = cellToDate(cell);
						dayDelta = dayDiff(date, origDate);
						renderDayOverlay(
							addDays(cloneDate(event.start), dayDelta),
							addDays(exclEndDay(event), dayDelta)
						);
					}else{
						dayDelta = 0;
					}
				}, ev, 'drag');
			},
			stop: function(ev, ui) {
				hoverListener.stop();
				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);
				if (dayDelta) {
					eventDrop(this, event, dayDelta, 0, event.allDay, ev, ui);
				}else{
					eventElement.css('filter', ''); // clear IE opacity side-effects
					showEvents(event, eventElement);
				}
			}
		});
	}


	function resizableDayEvent(event, element, segment) {
		var isRTL = opt('isRTL');
		var direction = isRTL ? 'w' : 'e';
		var handle = element.find('.ui-resizable-' + direction); // TODO: stop using this class because we aren't using jqui for this
		var isResizing = false;

		// TODO: look into using jquery-ui mouse widget for this stuff
		disableTextSelection(element); // prevent native <a> selection for IE
		element
			.mousedown(function(ev) { // prevent native <a> selection for others
				ev.preventDefault();
			})
			.click(function(ev) {
				if (isResizing) {
					ev.preventDefault(); // prevent link from being visited (only method that worked in IE6)
					ev.stopImmediatePropagation(); // prevent fullcalendar eventClick handler from being called
					                               // (eventElementHandlers needs to be bound after resizableDayEvent)
				}
			});

		handle.mousedown(function(ev) {
			if (ev.which != 1) {
				return; // needs to be left mouse button
			}
			isResizing = true;
			var hoverListener = getHoverListener();
			var rowCnt = getRowCnt();
			var colCnt = getColCnt();
			var elementTop = element.css('top');
			var dayDelta;
			var helpers;
			var eventCopy = $.extend({}, event);
			var minCellOffset = dayOffsetToCellOffset( dateToDayOffset(event.start) );
			clearSelection();
			$('body')
				.css('cursor', direction + '-resize')
				.one('mouseup', mouseup);
			trigger('eventResizeStart', this, event, ev);
			hoverListener.start(function(cell, origCell) {
				if (cell) {

					var origCellOffset = cellToCellOffset(origCell);
					var cellOffset = cellToCellOffset(cell);

					// don't let resizing move earlier than start date cell
					cellOffset = Math.max(cellOffset, minCellOffset);

					dayDelta =
						cellOffsetToDayOffset(cellOffset) -
						cellOffsetToDayOffset(origCellOffset);

					if (dayDelta) {
						eventCopy.end = addDays(eventEnd(event), dayDelta, true);
						var oldHelpers = helpers;

						helpers = renderTempDayEvent(eventCopy, segment.row, elementTop);
						helpers = $(helpers); // turn array into a jQuery object

						helpers.find('*').css('cursor', direction + '-resize');
						if (oldHelpers) {
							oldHelpers.remove();
						}

						hideEvents(event);
					}
					else {
						if (helpers) {
							showEvents(event);
							helpers.remove();
							helpers = null;
						}
					}
					clearOverlays();
					renderDayOverlay( // coordinate grid already rebuilt with hoverListener.start()
						event.start,
						addDays( exclEndDay(event), dayDelta )
						// TODO: instead of calling renderDayOverlay() with dates,
						// call _renderDayOverlay (or whatever) with cell offsets.
					);
				}
			}, ev);

			function mouseup(ev) {
				trigger('eventResizeStop', this, event, ev);
				$('body').css('cursor', '');
				hoverListener.stop();
				clearOverlays();
				if (dayDelta) {
					eventResize(this, event, dayDelta, 0, ev);
					// event redraw will clear helpers
				}
				// otherwise, the drag handler already restored the old events

				setTimeout(function() { // make this happen after the element's click event
					isResizing = false;
				},0);
			}
		});
	}


}



/* Generalized Segment Utilities
-------------------------------------------------------------------------------------------------*/


function isDaySegmentCollision(segment, otherSegments) {
	for (var i=0; i<otherSegments.length; i++) {
		var otherSegment = otherSegments[i];
		if (
			otherSegment.leftCol <= segment.rightCol &&
			otherSegment.rightCol >= segment.leftCol
		) {
			return true;
		}
	}
	return false;
}


function segmentElementEach(segments, callback) { // TODO: use in AgendaView?
	for (var i=0; i<segments.length; i++) {
		var segment = segments[i];
		var element = segment.element;
		if (element) {
			callback(segment, element, i);
		}
	}
}


// A cmp function for determining which segments should appear higher up
function compareDaySegments(a, b) {
	return (b.rightCol - b.leftCol) - (a.rightCol - a.leftCol) || // put wider events first
		b.event.allDay - a.event.allDay || // if tie, put all-day events first (booleans cast to 0/1)
		a.event.start - b.event.start || // if a tie, sort by event start date
		(a.event.title || '').localeCompare(b.event.title) // if a tie, sort by event title
}


;;

//BUG: unselect needs to be triggered when events are dragged+dropped

function SelectionManager() {
	var t = this;


	// exports
	t.select = select;
	t.unselect = unselect;
	t.reportSelection = reportSelection;
	t.daySelectionMousedown = daySelectionMousedown;


	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var defaultSelectionEnd = t.defaultSelectionEnd;
	var renderSelection = t.renderSelection;
	var clearSelection = t.clearSelection;


	// locals
	var selected = false;



	// unselectAuto
	if (opt('selectable') && opt('unselectAuto')) {
		$(document).mousedown(function(ev) {
			var ignore = opt('unselectCancel');
			if (ignore) {
				if ($(ev.target).parents(ignore).length) { // could be optimized to stop after first match
					return;
				}
			}
			unselect(ev);
		});
	}


	function select(startDate, endDate, allDay) {
		unselect();
		if (!endDate) {
			endDate = defaultSelectionEnd(startDate, allDay);
		}
		renderSelection(startDate, endDate, allDay);
		reportSelection(startDate, endDate, allDay);
	}


	function unselect(ev) {
		if (selected) {
			selected = false;
			clearSelection();
			trigger('unselect', null, ev);
		}
	}


	function reportSelection(startDate, endDate, allDay, ev) {
		selected = true;
		trigger('select', null, startDate, endDate, allDay, ev);
	}


	function daySelectionMousedown(ev) { // not really a generic manager method, oh well
		var cellToDate = t.cellToDate;
		var getIsCellAllDay = t.getIsCellAllDay;
		var hoverListener = t.getHoverListener();
		var reportDayClick = t.reportDayClick; // this is hacky and sort of weird
		if (ev.which == 1 && opt('selectable')) { // which==1 means left mouse button
			unselect(ev);
			var _mousedownElement = this;
			var dates;
			hoverListener.start(function(cell, origCell) { // TODO: maybe put cellToDate/getIsCellAllDay info in cell
				clearSelection();
				if (cell && getIsCellAllDay(cell)) {
					dates = [ cellToDate(origCell), cellToDate(cell) ].sort(dateCompare);
					renderSelection(dates[0], dates[1], true);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						reportDayClick(dates[0], true, ev);
					}
					reportSelection(dates[0], dates[1], true, ev);
				}
			});
		}
	}


}

;;

function OverlayManager() {
	var t = this;


	// exports
	t.renderOverlay = renderOverlay;
	t.clearOverlays = clearOverlays;


	// locals
	var usedOverlays = [];
	var unusedOverlays = [];


	function renderOverlay(rect, parent) {
		var e = unusedOverlays.shift();
		if (!e) {
			e = $("<div class='fc-cell-overlay' style='position:absolute;z-index:3'/>");
		}
		if (e[0].parentNode != parent[0]) {
			e.appendTo(parent);
		}
		usedOverlays.push(e.css(rect).show());
		return e;
	}


	function clearOverlays() {
		var e;
		while (e = usedOverlays.shift()) {
			unusedOverlays.push(e.hide().unbind());
		}
	}


}

;;

function CoordinateGrid(buildFunc) {

	var t = this;
	var rows;
	var cols;


	t.build = function() {
		rows = [];
		cols = [];
		buildFunc(rows, cols);
	};


	t.cell = function(x, y) {
		var rowCnt = rows.length;
		var colCnt = cols.length;
		var i, r=-1, c=-1;
		for (i=0; i<rowCnt; i++) {
			if (y >= rows[i][0] && y < rows[i][1]) {
				r = i;
				break;
			}
		}
		for (i=0; i<colCnt; i++) {
			if (x >= cols[i][0] && x < cols[i][1]) {
				c = i;
				break;
			}
		}
		return (r>=0 && c>=0) ? { row:r, col:c } : null;
	};


	t.rect = function(row0, col0, row1, col1, originElement) { // row1,col1 is inclusive
		var origin = originElement.offset();
		return {
			top: rows[row0][0] - origin.top,
			left: cols[col0][0] - origin.left,
			width: cols[col1][1] - cols[col0][0],
			height: rows[row1][1] - rows[row0][0]
		};
	};

}

;;

function HoverListener(coordinateGrid) {


	var t = this;
	var bindType;
	var change;
	var firstCell;
	var cell;


	t.start = function(_change, ev, _bindType) {
		change = _change;
		firstCell = cell = null;
		coordinateGrid.build();
		mouse(ev);
		bindType = _bindType || 'mousemove';
		$(document).bind(bindType, mouse);
	};


	function mouse(ev) {
		_fixUIEvent(ev); // see below
		var newCell = coordinateGrid.cell(ev.pageX, ev.pageY);
		if (!newCell != !cell || newCell && (newCell.row != cell.row || newCell.col != cell.col)) {
			if (newCell) {
				if (!firstCell) {
					firstCell = newCell;
				}
				change(newCell, firstCell, newCell.row-firstCell.row, newCell.col-firstCell.col);
			}else{
				change(newCell, firstCell);
			}
			cell = newCell;
		}
	}


	t.stop = function() {
		$(document).unbind(bindType, mouse);
		return cell;
	};


}



// this fix was only necessary for jQuery UI 1.8.16 (and jQuery 1.7 or 1.7.1)
// upgrading to jQuery UI 1.8.17 (and using either jQuery 1.7 or 1.7.1) fixed the problem
// but keep this in here for 1.8.16 users
// and maybe remove it down the line

function _fixUIEvent(event) { // for issue 1168
	if (event.pageX === undefined) {
		event.pageX = event.originalEvent.pageX;
		event.pageY = event.originalEvent.pageY;
	}
}
;;

function HorizontalPositionCache(getElement) {

	var t = this,
		elements = {},
		lefts = {},
		rights = {};

	function e(i) {
		return elements[i] = elements[i] || getElement(i);
	}

	t.left = function(i) {
		return lefts[i] = lefts[i] === undefined ? e(i).position().left : lefts[i];
	};

	t.right = function(i) {
		return rights[i] = rights[i] === undefined ? t.left(i) + e(i).width() : rights[i];
	};

	t.clear = function() {
		elements = {};
		lefts = {};
		rights = {};
	};

}

;;

})(jQuery);
import '../css/mystyles.css';
import '../css/calendar.css';

var $ = jQuery;
var myIndex = 0;

$( document ).ready(function() {

function carousel() {
  var i;
  var x = document.getElementsByClassName("mySlides");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  myIndex++;
  if (myIndex > x.length) {myIndex = 1}
  x[myIndex-1].style.display = "block";
  setTimeout(carousel, 5000); // Change image every 5 seconds
}


carousel();
});
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/calendar.css":
/*!****************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/calendar.css ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// Imports\nvar ___CSS_LOADER_API_IMPORT___ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ \"./node_modules/css-loader/dist/runtime/api.js\");\nexports = ___CSS_LOADER_API_IMPORT___(false);\nexports.push([module.i, \"@import url(https://fonts.googleapis.com/css?family=Roboto:100,100i,300,300i,400,400i,500,500i,700,700i,900,900i);\"]);\n// Module\nexports.push([module.i, \"/*!\\n * FullCalendar v1.6.4 Stylesheet\\n * Docs & License: http://arshaw.com/fullcalendar/\\n * (c) 2013 Adam Shaw\\n */\\ntd.fc-day {\\n\\nbackground:#FFF !important;\\nfont-family: 'Roboto', sans-serif;\\n\\n}\\ntd.fc-today {\\n\\tbackground:#FFF !important;\\n\\tposition: relative;\\n\\n\\n}\\n\\n.fc-first th{\\n\\tfont-family: 'Roboto', sans-serif;\\n    background:#9675ce !important;\\n\\tcolor:#FFF;\\n\\tfont-size:14px !important;\\n\\tfont-weight:500 !important;\\n\\n\\t}\\n.fc-event-inner {\\n\\tfont-family: 'Roboto', sans-serif;\\n    background: #03a9f3!important;\\n    color: #FFF!important;\\n    font-size: 12px!important;\\n    font-weight: 500!important;\\n    padding: 5px 0px!important;\\n}\\n\\n.fc {\\n\\tdirection: ltr;\\n\\ttext-align: left;\\n\\t}\\n\\n.fc table {\\n\\tborder-collapse: collapse;\\n\\tborder-spacing: 0;\\n\\t}\\n\\nhtml .fc,\\n.fc table {\\n\\tfont-size: 1em;\\n\\tfont-family: \\\"Helvetica Neue\\\",Helvetica;\\n\\n\\t}\\n\\n.fc td,\\n.fc th {\\n\\tpadding: 0;\\n\\tvertical-align: top;\\n\\t}\\n\\n\\n\\n/* Header\\n------------------------------------------------------------------------*/\\n\\n.fc-header td {\\n\\twhite-space: nowrap;\\n\\tpadding: 15px 10px 0px;\\n}\\n\\n.fc-header-left {\\n\\twidth: 25%;\\n\\ttext-align: left;\\n}\\n\\n.fc-header-center {\\n\\ttext-align: center;\\n\\t}\\n\\n.fc-header-right {\\n\\twidth: 25%;\\n\\ttext-align: right;\\n\\t}\\n\\n.fc-header-title {\\n\\tdisplay: inline-block;\\n\\tvertical-align: top;\\n\\tmargin-top: -5px;\\n}\\n\\n.fc-header-title h2 {\\n\\tmargin-top: 0;\\n\\twhite-space: nowrap;\\n\\tfont-size: 32px;\\n    font-weight: 100;\\n    margin-bottom: 10px;\\n\\t\\tfont-family: 'Roboto', sans-serif;\\n}\\n\\tspan.fc-button {\\n    font-family: 'Roboto', sans-serif;\\n    border-color: #9675ce;\\n\\tcolor: #9675ce;\\n}\\n.fc-state-down, .fc-state-active {\\n    background-color: #9675ce !important;\\n\\tcolor: #FFF !important;\\n}\\n.fc .fc-header-space {\\n\\tpadding-left: 10px;\\n\\t}\\n\\n.fc-header .fc-button {\\n\\tmargin-bottom: 1em;\\n\\tvertical-align: top;\\n\\t}\\n\\n/* buttons edges butting together */\\n\\n.fc-header .fc-button {\\n\\tmargin-right: -1px;\\n\\t}\\n\\n.fc-header .fc-corner-right,  /* non-theme */\\n.fc-header .ui-corner-right { /* theme */\\n\\tmargin-right: 0; /* back to normal */\\n\\t}\\n\\n/* button layering (for border precedence) */\\n\\n.fc-header .fc-state-hover,\\n.fc-header .ui-state-hover {\\n\\tz-index: 2;\\n\\t}\\n\\n.fc-header .fc-state-down {\\n\\tz-index: 3;\\n\\t}\\n\\n.fc-header .fc-state-active,\\n.fc-header .ui-state-active {\\n\\tz-index: 4;\\n\\t}\\n\\n\\n\\n/* Content\\n------------------------------------------------------------------------*/\\n\\n.fc-content {\\n\\tclear: both;\\n\\tzoom: 1; /* for IE7, gives accurate coordinates for [un]freezeContentHeight */\\n\\t}\\n\\n.fc-view {\\n\\twidth: 100%;\\n\\toverflow: hidden;\\n\\t}\\n\\n\\n\\n/* Cell Styles\\n------------------------------------------------------------------------*/\\n\\n    /* <th>, usually */\\n.fc-widget-content {  /* <td>, usually */\\n\\tborder: 1px solid #e5e5e5;\\n\\t}\\n.fc-widget-header{\\n    border-bottom: 1px solid #EEE;\\n}\\n.fc-state-highlight { /* <td> today cell */ /* TODO: add .fc-today to <th> */\\n\\t/* background: #fcf8e3; */\\n}\\n\\n.fc-state-highlight > div > div.fc-day-number{\\n    background-color: #ff3b30;\\n    color: #FFFFFF;\\n    border-radius: 50%;\\n    margin: 4px;\\n}\\n\\n.fc-cell-overlay { /* semi-transparent rectangle while dragging */\\n\\tbackground: #bce8f1;\\n\\topacity: .3;\\n\\tfilter: alpha(opacity=30); /* for IE */\\n\\t}\\n\\n\\n\\n/* Buttons\\n------------------------------------------------------------------------*/\\n\\n.fc-button {\\n\\tposition: relative;\\n\\tdisplay: inline-block;\\n\\tpadding: 0 .6em;\\n\\toverflow: hidden;\\n\\theight: 1.9em;\\n\\tline-height: 1.9em;\\n\\twhite-space: nowrap;\\n\\tcursor: pointer;\\n\\t}\\n\\n.fc-state-default { /* non-theme */\\n\\tborder: 1px solid;\\n\\t}\\n\\n.fc-state-default.fc-corner-left { /* non-theme */\\n\\tborder-top-left-radius: 4px;\\n\\tborder-bottom-left-radius: 4px;\\n\\t}\\n\\n.fc-state-default.fc-corner-right { /* non-theme */\\n\\tborder-top-right-radius: 4px;\\n\\tborder-bottom-right-radius: 4px;\\n\\t}\\n\\n/*\\n\\tOur default prev/next buttons use HTML entities like ‹ › « »\\n\\tand we'll try to make them look good cross-browser.\\n*/\\n\\n.fc-text-arrow {\\n\\tmargin: 0 .4em;\\n\\tfont-size: 2em;\\n\\tline-height: 23px;\\n\\tvertical-align: baseline; /* for IE7 */\\n\\t}\\n\\n.fc-button-prev .fc-text-arrow,\\n.fc-button-next .fc-text-arrow { /* for ‹ › */\\n\\tfont-weight: bold;\\n\\t}\\n\\n/* icon (for jquery ui) */\\n\\n.fc-button .fc-icon-wrap {\\n\\tposition: relative;\\n\\tfloat: left;\\n\\ttop: 50%;\\n\\t}\\n\\n.fc-button .ui-icon {\\n\\tposition: relative;\\n\\tfloat: left;\\n\\tmargin-top: -50%;\\n\\n\\t*margin-top: 0;\\n\\t*top: -50%;\\n\\t}\\n\\n\\n.fc-state-default {\\n\\tborder-color: #ff3b30;\\n\\tcolor: #ff3b30;\\n}\\n.fc-button-month.fc-state-default, .fc-button-agendaWeek.fc-state-default, .fc-button-agendaDay.fc-state-default{\\n    min-width: 67px;\\n\\ttext-align: center;\\n\\ttransition: all 0.2s;\\n\\t-webkit-transition: all 0.2s;\\n}\\n.fc-state-hover,\\n.fc-state-down,\\n.fc-state-active,\\n.fc-state-disabled {\\n\\tcolor: #333333;\\n\\tbackground-color: #FFE3E3;\\n\\t}\\n\\n.fc-state-hover {\\n\\tcolor: #ff3b30;\\n\\ttext-decoration: none;\\n\\tbackground-position: 0 -15px;\\n\\t-webkit-transition: background-position 0.1s linear;\\n\\t   -moz-transition: background-position 0.1s linear;\\n\\t     -o-transition: background-position 0.1s linear;\\n\\t        transition: background-position 0.1s linear;\\n\\t}\\n\\n.fc-state-down,\\n.fc-state-active {\\n\\tbackground-color: #ff3b30;\\n\\tbackground-image: none;\\n\\toutline: 0;\\n\\tcolor: #FFFFFF;\\n}\\n\\n.fc-state-disabled {\\n\\tcursor: default;\\n\\tbackground-image: none;\\n\\tbackground-color: #FFE3E3;\\n\\tfilter: alpha(opacity=65);\\n\\tbox-shadow: none;\\n\\tborder:1px solid #FFE3E3;\\n\\tcolor: #ff3b30;\\n\\t}\\n\\n\\n\\n/* Global Event Styles\\n------------------------------------------------------------------------*/\\n\\n.fc-event-container > * {\\n\\tz-index: 8;\\n\\t}\\n\\n.fc-event-container > .ui-draggable-dragging,\\n.fc-event-container > .ui-resizable-resizing {\\n\\tz-index: 9;\\n\\t}\\n\\n.fc-event {\\n\\tborder: 1px solid #FFF; /* default BORDER color */\\n\\tbackground-color: #FFF; /* default BACKGROUND color */\\n\\tcolor: #919191;               /* default TEXT color */\\n\\tfont-size: 12px;\\n\\tcursor: default;\\n}\\n.fc-event.chill{\\n    background-color: #f3dcf8;\\n}\\n.fc-event.info{\\n    background-color: #c6ebfe;\\n}\\n.fc-event.important{\\n    background-color: #FFBEBE;\\n}\\n.fc-event.success{\\n    background-color: #BEFFBF;\\n}\\n.fc-event:hover{\\n    opacity: 0.7;\\n}\\na.fc-event {\\n\\ttext-decoration: none;\\n\\t}\\n\\na.fc-event,\\n.fc-event-draggable {\\n\\tcursor: pointer;\\n\\t}\\n\\n.fc-rtl .fc-event {\\n\\ttext-align: right;\\n\\t}\\n\\n.fc-event-inner {\\n\\twidth: 100%;\\n\\theight: 100%;\\n\\toverflow: hidden;\\n\\tline-height: 15px;\\n\\t}\\n\\n.fc-event-time,\\n.fc-event-title {\\n\\tpadding: 0 1px;\\n\\t}\\n\\n.fc .ui-resizable-handle {\\n\\tdisplay: block;\\n\\tposition: absolute;\\n\\tz-index: 99999;\\n\\toverflow: hidden; /* hacky spaces (IE6/7) */\\n\\tfont-size: 300%;  /* */\\n\\tline-height: 50%; /* */\\n\\t}\\n\\n\\n\\n/* Horizontal Events\\n------------------------------------------------------------------------*/\\n\\n.fc-event-hori {\\n\\tborder-width: 1px 0;\\n\\tmargin-bottom: 1px;\\n\\t}\\n\\n.fc-ltr .fc-event-hori.fc-event-start,\\n.fc-rtl .fc-event-hori.fc-event-end {\\n\\tborder-left-width: 1px;\\n\\t/*\\nborder-top-left-radius: 3px;\\n\\tborder-bottom-left-radius: 3px;\\n*/\\n\\t}\\n\\n.fc-ltr .fc-event-hori.fc-event-end,\\n.fc-rtl .fc-event-hori.fc-event-start {\\n\\tborder-right-width: 1px;\\n\\t/*\\nborder-top-right-radius: 3px;\\n\\tborder-bottom-right-radius: 3px;\\n*/\\n\\t}\\n\\n/* resizable */\\n\\n.fc-event-hori .ui-resizable-e {\\n\\ttop: 0           !important; /* importants override pre jquery ui 1.7 styles */\\n\\tright: -3px      !important;\\n\\twidth: 7px       !important;\\n\\theight: 100%     !important;\\n\\tcursor: e-resize;\\n\\t}\\n\\n.fc-event-hori .ui-resizable-w {\\n\\ttop: 0           !important;\\n\\tleft: -3px       !important;\\n\\twidth: 7px       !important;\\n\\theight: 100%     !important;\\n\\tcursor: w-resize;\\n\\t}\\n\\n.fc-event-hori .ui-resizable-handle {\\n\\t_padding-bottom: 14px; /* IE6 had 0 height */\\n\\t}\\n\\n\\n\\n/* Reusable Separate-border Table\\n------------------------------------------------------------*/\\n\\ntable.fc-border-separate {\\n\\tborder-collapse: separate;\\n\\t}\\n\\n.fc-border-separate th,\\n.fc-border-separate td {\\n\\tborder-width: 1px 0 0 1px;\\n\\t}\\n\\n.fc-border-separate th.fc-last,\\n.fc-border-separate td.fc-last {\\n\\tborder-right-width: 1px;\\n\\t}\\n\\n\\n.fc-border-separate tr.fc-last td {\\n\\n}\\n.fc-border-separate .fc-week .fc-first{\\n    border-left: 0;\\n}\\n.fc-border-separate .fc-week .fc-last{\\n    border-right: 0;\\n}\\n.fc-border-separate tr.fc-last th{\\n    border-bottom-width: 1px;\\n    border-color: #cdcdcd;\\n    font-size: 16px;\\n    font-weight: 300;\\n\\tline-height: 30px;\\n}\\n.fc-border-separate tbody tr.fc-first td,\\n.fc-border-separate tbody tr.fc-first th {\\n\\tborder-top-width: 0;\\n\\t}\\n\\n\\n\\n/* Month View, Basic Week View, Basic Day View\\n------------------------------------------------------------------------*/\\n\\n.fc-grid th {\\n\\ttext-align: center;\\n\\t}\\n\\n.fc .fc-week-number {\\n\\twidth: 22px;\\n\\ttext-align: center;\\n\\t}\\n\\n.fc .fc-week-number div {\\n\\tpadding: 0 2px;\\n\\t}\\n\\n.fc-grid .fc-day-number {\\n\\tfloat: right;\\n\\tpadding: 0 2px;\\n\\t}\\n\\n.fc-grid .fc-other-month .fc-day-number {\\n\\topacity: 0.3;\\n\\tfilter: alpha(opacity=30); /* for IE */\\n\\t/* opacity with small font can sometimes look too faded\\n\\t   might want to set the 'color' property instead\\n\\t   making day-numbers bold also fixes the problem */\\n\\t}\\n\\n.fc-grid .fc-day-content {\\n\\tclear: both;\\n\\tpadding: 2px 2px 1px; /* distance between events and day edges */\\n\\t}\\n\\n/* event styles */\\n\\n.fc-grid .fc-event-time {\\n\\tfont-weight: bold;\\n\\t}\\n\\n/* right-to-left */\\n\\n.fc-rtl .fc-grid .fc-day-number {\\n\\tfloat: left;\\n\\t}\\n\\n.fc-rtl .fc-grid .fc-event-time {\\n\\tfloat: right;\\n\\t}\\n\\n\\n\\n/* Agenda Week View, Agenda Day View\\n------------------------------------------------------------------------*/\\n\\n.fc-agenda table {\\n\\tborder-collapse: separate;\\n\\t}\\n\\n.fc-agenda-days th {\\n\\ttext-align: center;\\n\\t}\\n\\n.fc-agenda .fc-agenda-axis {\\n\\twidth: 50px;\\n\\tpadding: 0 4px;\\n\\tvertical-align: middle;\\n\\ttext-align: right;\\n\\twhite-space: nowrap;\\n\\tfont-weight: normal;\\n\\t}\\n\\n.fc-agenda .fc-week-number {\\n\\tfont-weight: bold;\\n\\t}\\n\\n.fc-agenda .fc-day-content {\\n\\tpadding: 2px 2px 1px;\\n\\t}\\n\\n/* make axis border take precedence */\\n\\n.fc-agenda-days .fc-agenda-axis {\\n\\tborder-right-width: 1px;\\n\\t}\\n\\n.fc-agenda-days .fc-col0 {\\n\\tborder-left-width: 0;\\n\\t}\\n\\n/* all-day area */\\n\\n.fc-agenda-allday th {\\n\\tborder-width: 0 1px;\\n\\t}\\n\\n.fc-agenda-allday .fc-day-content {\\n\\tmin-height: 34px; /* TODO: doesnt work well in quirksmode */\\n\\t_height: 34px;\\n\\t}\\n\\n/* divider (between all-day and slots) */\\n\\n.fc-agenda-divider-inner {\\n\\theight: 2px;\\n\\toverflow: hidden;\\n\\t}\\n\\n.fc-widget-header .fc-agenda-divider-inner {\\n\\tbackground: #eee;\\n\\t}\\n\\n/* slot rows */\\n\\n.fc-agenda-slots th {\\n\\tborder-width: 1px 1px 0;\\n\\t}\\n\\n.fc-agenda-slots td {\\n\\tborder-width: 1px 0 0;\\n\\tbackground: none;\\n\\t}\\n\\n.fc-agenda-slots td div {\\n\\theight: 20px;\\n\\t}\\n\\n.fc-agenda-slots tr.fc-slot0 th,\\n.fc-agenda-slots tr.fc-slot0 td {\\n\\tborder-top-width: 0;\\n\\t}\\n\\n.fc-agenda-slots tr.fc-minor th.ui-widget-header {\\n\\t*border-top-style: solid; /* doesn't work with background in IE6/7 */\\n\\t}\\n\\n\\n\\n/* Vertical Events\\n------------------------------------------------------------------------*/\\n\\n.fc-event-vert {\\n\\tborder-width: 0 1px;\\n\\t}\\n\\n.fc-event-vert.fc-event-start {\\n\\tborder-top-width: 1px;\\n\\tborder-top-left-radius: 3px;\\n\\tborder-top-right-radius: 3px;\\n\\t}\\n\\n.fc-event-vert.fc-event-end {\\n\\tborder-bottom-width: 1px;\\n\\tborder-bottom-left-radius: 3px;\\n\\tborder-bottom-right-radius: 3px;\\n\\t}\\n\\n.fc-event-vert .fc-event-time {\\n\\twhite-space: nowrap;\\n\\tfont-size: 10px;\\n\\t}\\n\\n.fc-event-vert .fc-event-inner {\\n\\tposition: relative;\\n\\tz-index: 2;\\n\\t}\\n\\n.fc-event-vert .fc-event-bg { /* makes the event lighter w/ a semi-transparent overlay  */\\n\\tposition: absolute;\\n\\tz-index: 1;\\n\\ttop: 0;\\n\\tleft: 0;\\n\\twidth: 100%;\\n\\theight: 100%;\\n\\tbackground: #fff;\\n\\topacity: .25;\\n\\tfilter: alpha(opacity=25);\\n\\t}\\n\\n.fc .ui-draggable-dragging .fc-event-bg, /* TODO: something nicer like .fc-opacity */\\n.fc-select-helper .fc-event-bg {\\n\\tdisplay: none\\\\9; /* for IE6/7/8. nested opacity filters while dragging don't work */\\n\\t}\\n\\n/* resizable */\\n\\n.fc-event-vert .ui-resizable-s {\\n\\tbottom: 0        !important; /* importants override pre jquery ui 1.7 styles */\\n\\twidth: 100%      !important;\\n\\theight: 8px      !important;\\n\\toverflow: hidden !important;\\n\\tline-height: 8px !important;\\n\\tfont-size: 11px  !important;\\n\\tfont-family: monospace;\\n\\ttext-align: center;\\n\\tcursor: s-resize;\\n\\t}\\n\\n.fc-agenda .ui-resizable-resizing { /* TODO: better selector */\\n\\t_overflow: hidden;\\n\\t}\\n\\nthead tr.fc-first{\\n    background-color: #f7f7f7;\\n}\\ntable.fc-header{\\n    background-color: #FFFFFF;\\n    border-radius: 6px 6px 0 0;\\n}\\n\\n.fc-week .fc-day > div .fc-day-number{\\n    font-size: 15px;\\n    margin: 2px;\\n    min-width: 19px;\\n    padding: 6px;\\n    text-align: center;\\n       width: 30px;\\n    height: 30px;\\n}\\n.fc-sun, .fc-sat{\\n    color: #b8b8b8;\\n}\\n\\n.fc-week .fc-day:hover .fc-day-number{\\n    background-color: #B8B8B8;\\n    border-radius: 50%;\\n    color: #FFFFFF;\\n    transition: background-color 0.2s;\\n}\\n.fc-week .fc-day.fc-state-highlight:hover .fc-day-number{\\n    background-color:  #ff3b30;\\n}\\n.fc-button-today{\\n    border: 1px solid rgba(255,255,255,.0);\\n}\\n.fc-view-agendaDay thead tr.fc-first .fc-widget-header{\\n    text-align: right;\\n    padding-right: 10px;\\n}\\n\\n/*!\\n * FullCalendar v1.6.4 Print Stylesheet\\n * Docs & License: http://arshaw.com/fullcalendar/\\n * (c) 2013 Adam Shaw\\n */\\n\\n/*\\n * Include this stylesheet on your page to get a more printer-friendly calendar.\\n * When including this stylesheet, use the media='print' attribute of the <link> tag.\\n * Make sure to include this stylesheet IN ADDITION to the regular fullcalendar.css.\\n */\\n\\n\\n /* Events\\n-----------------------------------------------------*/\\n\\n.fc-event {\\n\\tbackground: #fff !important;\\n\\tcolor: #000 !important;\\n\\t}\\n\\n/* for vertical events */\\n\\n.fc-event-bg {\\n\\tdisplay: none !important;\\n\\t}\\n\\n.fc-event .ui-resizable-handle {\\n\\tdisplay: none !important;\\n\\t}\\n\\n\\n\", \"\"]);\n// Exports\nmodule.exports = exports;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL3NzZmwvc3RhdGljL2Nzcy9jYWxlbmRhci5jc3MuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zc2ZsL3N0YXRpYy9jc3MvY2FsZW5kYXIuY3NzPzBhYTkiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gSW1wb3J0c1xudmFyIF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyA9IHJlcXVpcmUoXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCIpO1xuZXhwb3J0cyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhmYWxzZSk7XG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJAaW1wb3J0IHVybChodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2Nzcz9mYW1pbHk9Um9ib3RvOjEwMCwxMDBpLDMwMCwzMDBpLDQwMCw0MDBpLDUwMCw1MDBpLDcwMCw3MDBpLDkwMCw5MDBpKTtcIl0pO1xuLy8gTW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIvKiFcXG4gKiBGdWxsQ2FsZW5kYXIgdjEuNi40IFN0eWxlc2hlZXRcXG4gKiBEb2NzICYgTGljZW5zZTogaHR0cDovL2Fyc2hhdy5jb20vZnVsbGNhbGVuZGFyL1xcbiAqIChjKSAyMDEzIEFkYW0gU2hhd1xcbiAqL1xcbnRkLmZjLWRheSB7XFxuXFxuYmFja2dyb3VuZDojRkZGICFpbXBvcnRhbnQ7XFxuZm9udC1mYW1pbHk6ICdSb2JvdG8nLCBzYW5zLXNlcmlmO1xcblxcbn1cXG50ZC5mYy10b2RheSB7XFxuXFx0YmFja2dyb3VuZDojRkZGICFpbXBvcnRhbnQ7XFxuXFx0cG9zaXRpb246IHJlbGF0aXZlO1xcblxcblxcbn1cXG5cXG4uZmMtZmlyc3QgdGh7XFxuXFx0Zm9udC1mYW1pbHk6ICdSb2JvdG8nLCBzYW5zLXNlcmlmO1xcbiAgICBiYWNrZ3JvdW5kOiM5Njc1Y2UgIWltcG9ydGFudDtcXG5cXHRjb2xvcjojRkZGO1xcblxcdGZvbnQtc2l6ZToxNHB4ICFpbXBvcnRhbnQ7XFxuXFx0Zm9udC13ZWlnaHQ6NTAwICFpbXBvcnRhbnQ7XFxuXFxuXFx0fVxcbi5mYy1ldmVudC1pbm5lciB7XFxuXFx0Zm9udC1mYW1pbHk6ICdSb2JvdG8nLCBzYW5zLXNlcmlmO1xcbiAgICBiYWNrZ3JvdW5kOiAjMDNhOWYzIWltcG9ydGFudDtcXG4gICAgY29sb3I6ICNGRkYhaW1wb3J0YW50O1xcbiAgICBmb250LXNpemU6IDEycHghaW1wb3J0YW50O1xcbiAgICBmb250LXdlaWdodDogNTAwIWltcG9ydGFudDtcXG4gICAgcGFkZGluZzogNXB4IDBweCFpbXBvcnRhbnQ7XFxufVxcblxcbi5mYyB7XFxuXFx0ZGlyZWN0aW9uOiBsdHI7XFxuXFx0dGV4dC1hbGlnbjogbGVmdDtcXG5cXHR9XFxuXFxuLmZjIHRhYmxlIHtcXG5cXHRib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO1xcblxcdGJvcmRlci1zcGFjaW5nOiAwO1xcblxcdH1cXG5cXG5odG1sIC5mYyxcXG4uZmMgdGFibGUge1xcblxcdGZvbnQtc2l6ZTogMWVtO1xcblxcdGZvbnQtZmFtaWx5OiBcXFwiSGVsdmV0aWNhIE5ldWVcXFwiLEhlbHZldGljYTtcXG5cXG5cXHR9XFxuXFxuLmZjIHRkLFxcbi5mYyB0aCB7XFxuXFx0cGFkZGluZzogMDtcXG5cXHR2ZXJ0aWNhbC1hbGlnbjogdG9wO1xcblxcdH1cXG5cXG5cXG5cXG4vKiBIZWFkZXJcXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcblxcbi5mYy1oZWFkZXIgdGQge1xcblxcdHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuXFx0cGFkZGluZzogMTVweCAxMHB4IDBweDtcXG59XFxuXFxuLmZjLWhlYWRlci1sZWZ0IHtcXG5cXHR3aWR0aDogMjUlO1xcblxcdHRleHQtYWxpZ246IGxlZnQ7XFxufVxcblxcbi5mYy1oZWFkZXItY2VudGVyIHtcXG5cXHR0ZXh0LWFsaWduOiBjZW50ZXI7XFxuXFx0fVxcblxcbi5mYy1oZWFkZXItcmlnaHQge1xcblxcdHdpZHRoOiAyNSU7XFxuXFx0dGV4dC1hbGlnbjogcmlnaHQ7XFxuXFx0fVxcblxcbi5mYy1oZWFkZXItdGl0bGUge1xcblxcdGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG5cXHR2ZXJ0aWNhbC1hbGlnbjogdG9wO1xcblxcdG1hcmdpbi10b3A6IC01cHg7XFxufVxcblxcbi5mYy1oZWFkZXItdGl0bGUgaDIge1xcblxcdG1hcmdpbi10b3A6IDA7XFxuXFx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcXG5cXHRmb250LXNpemU6IDMycHg7XFxuICAgIGZvbnQtd2VpZ2h0OiAxMDA7XFxuICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XFxuXFx0XFx0Zm9udC1mYW1pbHk6ICdSb2JvdG8nLCBzYW5zLXNlcmlmO1xcbn1cXG5cXHRzcGFuLmZjLWJ1dHRvbiB7XFxuICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvJywgc2Fucy1zZXJpZjtcXG4gICAgYm9yZGVyLWNvbG9yOiAjOTY3NWNlO1xcblxcdGNvbG9yOiAjOTY3NWNlO1xcbn1cXG4uZmMtc3RhdGUtZG93biwgLmZjLXN0YXRlLWFjdGl2ZSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICM5Njc1Y2UgIWltcG9ydGFudDtcXG5cXHRjb2xvcjogI0ZGRiAhaW1wb3J0YW50O1xcbn1cXG4uZmMgLmZjLWhlYWRlci1zcGFjZSB7XFxuXFx0cGFkZGluZy1sZWZ0OiAxMHB4O1xcblxcdH1cXG5cXG4uZmMtaGVhZGVyIC5mYy1idXR0b24ge1xcblxcdG1hcmdpbi1ib3R0b206IDFlbTtcXG5cXHR2ZXJ0aWNhbC1hbGlnbjogdG9wO1xcblxcdH1cXG5cXG4vKiBidXR0b25zIGVkZ2VzIGJ1dHRpbmcgdG9nZXRoZXIgKi9cXG5cXG4uZmMtaGVhZGVyIC5mYy1idXR0b24ge1xcblxcdG1hcmdpbi1yaWdodDogLTFweDtcXG5cXHR9XFxuXFxuLmZjLWhlYWRlciAuZmMtY29ybmVyLXJpZ2h0LCAgLyogbm9uLXRoZW1lICovXFxuLmZjLWhlYWRlciAudWktY29ybmVyLXJpZ2h0IHsgLyogdGhlbWUgKi9cXG5cXHRtYXJnaW4tcmlnaHQ6IDA7IC8qIGJhY2sgdG8gbm9ybWFsICovXFxuXFx0fVxcblxcbi8qIGJ1dHRvbiBsYXllcmluZyAoZm9yIGJvcmRlciBwcmVjZWRlbmNlKSAqL1xcblxcbi5mYy1oZWFkZXIgLmZjLXN0YXRlLWhvdmVyLFxcbi5mYy1oZWFkZXIgLnVpLXN0YXRlLWhvdmVyIHtcXG5cXHR6LWluZGV4OiAyO1xcblxcdH1cXG5cXG4uZmMtaGVhZGVyIC5mYy1zdGF0ZS1kb3duIHtcXG5cXHR6LWluZGV4OiAzO1xcblxcdH1cXG5cXG4uZmMtaGVhZGVyIC5mYy1zdGF0ZS1hY3RpdmUsXFxuLmZjLWhlYWRlciAudWktc3RhdGUtYWN0aXZlIHtcXG5cXHR6LWluZGV4OiA0O1xcblxcdH1cXG5cXG5cXG5cXG4vKiBDb250ZW50XFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG5cXG4uZmMtY29udGVudCB7XFxuXFx0Y2xlYXI6IGJvdGg7XFxuXFx0em9vbTogMTsgLyogZm9yIElFNywgZ2l2ZXMgYWNjdXJhdGUgY29vcmRpbmF0ZXMgZm9yIFt1bl1mcmVlemVDb250ZW50SGVpZ2h0ICovXFxuXFx0fVxcblxcbi5mYy12aWV3IHtcXG5cXHR3aWR0aDogMTAwJTtcXG5cXHRvdmVyZmxvdzogaGlkZGVuO1xcblxcdH1cXG5cXG5cXG5cXG4vKiBDZWxsIFN0eWxlc1xcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuXFxuICAgIC8qIDx0aD4sIHVzdWFsbHkgKi9cXG4uZmMtd2lkZ2V0LWNvbnRlbnQgeyAgLyogPHRkPiwgdXN1YWxseSAqL1xcblxcdGJvcmRlcjogMXB4IHNvbGlkICNlNWU1ZTU7XFxuXFx0fVxcbi5mYy13aWRnZXQtaGVhZGVye1xcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI0VFRTtcXG59XFxuLmZjLXN0YXRlLWhpZ2hsaWdodCB7IC8qIDx0ZD4gdG9kYXkgY2VsbCAqLyAvKiBUT0RPOiBhZGQgLmZjLXRvZGF5IHRvIDx0aD4gKi9cXG5cXHQvKiBiYWNrZ3JvdW5kOiAjZmNmOGUzOyAqL1xcbn1cXG5cXG4uZmMtc3RhdGUtaGlnaGxpZ2h0ID4gZGl2ID4gZGl2LmZjLWRheS1udW1iZXJ7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZjNiMzA7XFxuICAgIGNvbG9yOiAjRkZGRkZGO1xcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XFxuICAgIG1hcmdpbjogNHB4O1xcbn1cXG5cXG4uZmMtY2VsbC1vdmVybGF5IHsgLyogc2VtaS10cmFuc3BhcmVudCByZWN0YW5nbGUgd2hpbGUgZHJhZ2dpbmcgKi9cXG5cXHRiYWNrZ3JvdW5kOiAjYmNlOGYxO1xcblxcdG9wYWNpdHk6IC4zO1xcblxcdGZpbHRlcjogYWxwaGEob3BhY2l0eT0zMCk7IC8qIGZvciBJRSAqL1xcblxcdH1cXG5cXG5cXG5cXG4vKiBCdXR0b25zXFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG5cXG4uZmMtYnV0dG9uIHtcXG5cXHRwb3NpdGlvbjogcmVsYXRpdmU7XFxuXFx0ZGlzcGxheTogaW5saW5lLWJsb2NrO1xcblxcdHBhZGRpbmc6IDAgLjZlbTtcXG5cXHRvdmVyZmxvdzogaGlkZGVuO1xcblxcdGhlaWdodDogMS45ZW07XFxuXFx0bGluZS1oZWlnaHQ6IDEuOWVtO1xcblxcdHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuXFx0Y3Vyc29yOiBwb2ludGVyO1xcblxcdH1cXG5cXG4uZmMtc3RhdGUtZGVmYXVsdCB7IC8qIG5vbi10aGVtZSAqL1xcblxcdGJvcmRlcjogMXB4IHNvbGlkO1xcblxcdH1cXG5cXG4uZmMtc3RhdGUtZGVmYXVsdC5mYy1jb3JuZXItbGVmdCB7IC8qIG5vbi10aGVtZSAqL1xcblxcdGJvcmRlci10b3AtbGVmdC1yYWRpdXM6IDRweDtcXG5cXHRib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiA0cHg7XFxuXFx0fVxcblxcbi5mYy1zdGF0ZS1kZWZhdWx0LmZjLWNvcm5lci1yaWdodCB7IC8qIG5vbi10aGVtZSAqL1xcblxcdGJvcmRlci10b3AtcmlnaHQtcmFkaXVzOiA0cHg7XFxuXFx0Ym9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IDRweDtcXG5cXHR9XFxuXFxuLypcXG5cXHRPdXIgZGVmYXVsdCBwcmV2L25leHQgYnV0dG9ucyB1c2UgSFRNTCBlbnRpdGllcyBsaWtlIOKAuSDigLogwqsgwrtcXG5cXHRhbmQgd2UnbGwgdHJ5IHRvIG1ha2UgdGhlbSBsb29rIGdvb2QgY3Jvc3MtYnJvd3Nlci5cXG4qL1xcblxcbi5mYy10ZXh0LWFycm93IHtcXG5cXHRtYXJnaW46IDAgLjRlbTtcXG5cXHRmb250LXNpemU6IDJlbTtcXG5cXHRsaW5lLWhlaWdodDogMjNweDtcXG5cXHR2ZXJ0aWNhbC1hbGlnbjogYmFzZWxpbmU7IC8qIGZvciBJRTcgKi9cXG5cXHR9XFxuXFxuLmZjLWJ1dHRvbi1wcmV2IC5mYy10ZXh0LWFycm93LFxcbi5mYy1idXR0b24tbmV4dCAuZmMtdGV4dC1hcnJvdyB7IC8qIGZvciDigLkg4oC6ICovXFxuXFx0Zm9udC13ZWlnaHQ6IGJvbGQ7XFxuXFx0fVxcblxcbi8qIGljb24gKGZvciBqcXVlcnkgdWkpICovXFxuXFxuLmZjLWJ1dHRvbiAuZmMtaWNvbi13cmFwIHtcXG5cXHRwb3NpdGlvbjogcmVsYXRpdmU7XFxuXFx0ZmxvYXQ6IGxlZnQ7XFxuXFx0dG9wOiA1MCU7XFxuXFx0fVxcblxcbi5mYy1idXR0b24gLnVpLWljb24ge1xcblxcdHBvc2l0aW9uOiByZWxhdGl2ZTtcXG5cXHRmbG9hdDogbGVmdDtcXG5cXHRtYXJnaW4tdG9wOiAtNTAlO1xcblxcblxcdCptYXJnaW4tdG9wOiAwO1xcblxcdCp0b3A6IC01MCU7XFxuXFx0fVxcblxcblxcbi5mYy1zdGF0ZS1kZWZhdWx0IHtcXG5cXHRib3JkZXItY29sb3I6ICNmZjNiMzA7XFxuXFx0Y29sb3I6ICNmZjNiMzA7XFxufVxcbi5mYy1idXR0b24tbW9udGguZmMtc3RhdGUtZGVmYXVsdCwgLmZjLWJ1dHRvbi1hZ2VuZGFXZWVrLmZjLXN0YXRlLWRlZmF1bHQsIC5mYy1idXR0b24tYWdlbmRhRGF5LmZjLXN0YXRlLWRlZmF1bHR7XFxuICAgIG1pbi13aWR0aDogNjdweDtcXG5cXHR0ZXh0LWFsaWduOiBjZW50ZXI7XFxuXFx0dHJhbnNpdGlvbjogYWxsIDAuMnM7XFxuXFx0LXdlYmtpdC10cmFuc2l0aW9uOiBhbGwgMC4ycztcXG59XFxuLmZjLXN0YXRlLWhvdmVyLFxcbi5mYy1zdGF0ZS1kb3duLFxcbi5mYy1zdGF0ZS1hY3RpdmUsXFxuLmZjLXN0YXRlLWRpc2FibGVkIHtcXG5cXHRjb2xvcjogIzMzMzMzMztcXG5cXHRiYWNrZ3JvdW5kLWNvbG9yOiAjRkZFM0UzO1xcblxcdH1cXG5cXG4uZmMtc3RhdGUtaG92ZXIge1xcblxcdGNvbG9yOiAjZmYzYjMwO1xcblxcdHRleHQtZGVjb3JhdGlvbjogbm9uZTtcXG5cXHRiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwIC0xNXB4O1xcblxcdC13ZWJraXQtdHJhbnNpdGlvbjogYmFja2dyb3VuZC1wb3NpdGlvbiAwLjFzIGxpbmVhcjtcXG5cXHQgICAtbW96LXRyYW5zaXRpb246IGJhY2tncm91bmQtcG9zaXRpb24gMC4xcyBsaW5lYXI7XFxuXFx0ICAgICAtby10cmFuc2l0aW9uOiBiYWNrZ3JvdW5kLXBvc2l0aW9uIDAuMXMgbGluZWFyO1xcblxcdCAgICAgICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZC1wb3NpdGlvbiAwLjFzIGxpbmVhcjtcXG5cXHR9XFxuXFxuLmZjLXN0YXRlLWRvd24sXFxuLmZjLXN0YXRlLWFjdGl2ZSB7XFxuXFx0YmFja2dyb3VuZC1jb2xvcjogI2ZmM2IzMDtcXG5cXHRiYWNrZ3JvdW5kLWltYWdlOiBub25lO1xcblxcdG91dGxpbmU6IDA7XFxuXFx0Y29sb3I6ICNGRkZGRkY7XFxufVxcblxcbi5mYy1zdGF0ZS1kaXNhYmxlZCB7XFxuXFx0Y3Vyc29yOiBkZWZhdWx0O1xcblxcdGJhY2tncm91bmQtaW1hZ2U6IG5vbmU7XFxuXFx0YmFja2dyb3VuZC1jb2xvcjogI0ZGRTNFMztcXG5cXHRmaWx0ZXI6IGFscGhhKG9wYWNpdHk9NjUpO1xcblxcdGJveC1zaGFkb3c6IG5vbmU7XFxuXFx0Ym9yZGVyOjFweCBzb2xpZCAjRkZFM0UzO1xcblxcdGNvbG9yOiAjZmYzYjMwO1xcblxcdH1cXG5cXG5cXG5cXG4vKiBHbG9iYWwgRXZlbnQgU3R5bGVzXFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG5cXG4uZmMtZXZlbnQtY29udGFpbmVyID4gKiB7XFxuXFx0ei1pbmRleDogODtcXG5cXHR9XFxuXFxuLmZjLWV2ZW50LWNvbnRhaW5lciA+IC51aS1kcmFnZ2FibGUtZHJhZ2dpbmcsXFxuLmZjLWV2ZW50LWNvbnRhaW5lciA+IC51aS1yZXNpemFibGUtcmVzaXppbmcge1xcblxcdHotaW5kZXg6IDk7XFxuXFx0fVxcblxcbi5mYy1ldmVudCB7XFxuXFx0Ym9yZGVyOiAxcHggc29saWQgI0ZGRjsgLyogZGVmYXVsdCBCT1JERVIgY29sb3IgKi9cXG5cXHRiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGOyAvKiBkZWZhdWx0IEJBQ0tHUk9VTkQgY29sb3IgKi9cXG5cXHRjb2xvcjogIzkxOTE5MTsgICAgICAgICAgICAgICAvKiBkZWZhdWx0IFRFWFQgY29sb3IgKi9cXG5cXHRmb250LXNpemU6IDEycHg7XFxuXFx0Y3Vyc29yOiBkZWZhdWx0O1xcbn1cXG4uZmMtZXZlbnQuY2hpbGx7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmM2RjZjg7XFxufVxcbi5mYy1ldmVudC5pbmZve1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjYzZlYmZlO1xcbn1cXG4uZmMtZXZlbnQuaW1wb3J0YW50e1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZCRUJFO1xcbn1cXG4uZmMtZXZlbnQuc3VjY2Vzc3tcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI0JFRkZCRjtcXG59XFxuLmZjLWV2ZW50OmhvdmVye1xcbiAgICBvcGFjaXR5OiAwLjc7XFxufVxcbmEuZmMtZXZlbnQge1xcblxcdHRleHQtZGVjb3JhdGlvbjogbm9uZTtcXG5cXHR9XFxuXFxuYS5mYy1ldmVudCxcXG4uZmMtZXZlbnQtZHJhZ2dhYmxlIHtcXG5cXHRjdXJzb3I6IHBvaW50ZXI7XFxuXFx0fVxcblxcbi5mYy1ydGwgLmZjLWV2ZW50IHtcXG5cXHR0ZXh0LWFsaWduOiByaWdodDtcXG5cXHR9XFxuXFxuLmZjLWV2ZW50LWlubmVyIHtcXG5cXHR3aWR0aDogMTAwJTtcXG5cXHRoZWlnaHQ6IDEwMCU7XFxuXFx0b3ZlcmZsb3c6IGhpZGRlbjtcXG5cXHRsaW5lLWhlaWdodDogMTVweDtcXG5cXHR9XFxuXFxuLmZjLWV2ZW50LXRpbWUsXFxuLmZjLWV2ZW50LXRpdGxlIHtcXG5cXHRwYWRkaW5nOiAwIDFweDtcXG5cXHR9XFxuXFxuLmZjIC51aS1yZXNpemFibGUtaGFuZGxlIHtcXG5cXHRkaXNwbGF5OiBibG9jaztcXG5cXHRwb3NpdGlvbjogYWJzb2x1dGU7XFxuXFx0ei1pbmRleDogOTk5OTk7XFxuXFx0b3ZlcmZsb3c6IGhpZGRlbjsgLyogaGFja3kgc3BhY2VzIChJRTYvNykgKi9cXG5cXHRmb250LXNpemU6IDMwMCU7ICAvKiAqL1xcblxcdGxpbmUtaGVpZ2h0OiA1MCU7IC8qICovXFxuXFx0fVxcblxcblxcblxcbi8qIEhvcml6b250YWwgRXZlbnRzXFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG5cXG4uZmMtZXZlbnQtaG9yaSB7XFxuXFx0Ym9yZGVyLXdpZHRoOiAxcHggMDtcXG5cXHRtYXJnaW4tYm90dG9tOiAxcHg7XFxuXFx0fVxcblxcbi5mYy1sdHIgLmZjLWV2ZW50LWhvcmkuZmMtZXZlbnQtc3RhcnQsXFxuLmZjLXJ0bCAuZmMtZXZlbnQtaG9yaS5mYy1ldmVudC1lbmQge1xcblxcdGJvcmRlci1sZWZ0LXdpZHRoOiAxcHg7XFxuXFx0LypcXG5ib3JkZXItdG9wLWxlZnQtcmFkaXVzOiAzcHg7XFxuXFx0Ym9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogM3B4O1xcbiovXFxuXFx0fVxcblxcbi5mYy1sdHIgLmZjLWV2ZW50LWhvcmkuZmMtZXZlbnQtZW5kLFxcbi5mYy1ydGwgLmZjLWV2ZW50LWhvcmkuZmMtZXZlbnQtc3RhcnQge1xcblxcdGJvcmRlci1yaWdodC13aWR0aDogMXB4O1xcblxcdC8qXFxuYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IDNweDtcXG5cXHRib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogM3B4O1xcbiovXFxuXFx0fVxcblxcbi8qIHJlc2l6YWJsZSAqL1xcblxcbi5mYy1ldmVudC1ob3JpIC51aS1yZXNpemFibGUtZSB7XFxuXFx0dG9wOiAwICAgICAgICAgICAhaW1wb3J0YW50OyAvKiBpbXBvcnRhbnRzIG92ZXJyaWRlIHByZSBqcXVlcnkgdWkgMS43IHN0eWxlcyAqL1xcblxcdHJpZ2h0OiAtM3B4ICAgICAgIWltcG9ydGFudDtcXG5cXHR3aWR0aDogN3B4ICAgICAgICFpbXBvcnRhbnQ7XFxuXFx0aGVpZ2h0OiAxMDAlICAgICAhaW1wb3J0YW50O1xcblxcdGN1cnNvcjogZS1yZXNpemU7XFxuXFx0fVxcblxcbi5mYy1ldmVudC1ob3JpIC51aS1yZXNpemFibGUtdyB7XFxuXFx0dG9wOiAwICAgICAgICAgICAhaW1wb3J0YW50O1xcblxcdGxlZnQ6IC0zcHggICAgICAgIWltcG9ydGFudDtcXG5cXHR3aWR0aDogN3B4ICAgICAgICFpbXBvcnRhbnQ7XFxuXFx0aGVpZ2h0OiAxMDAlICAgICAhaW1wb3J0YW50O1xcblxcdGN1cnNvcjogdy1yZXNpemU7XFxuXFx0fVxcblxcbi5mYy1ldmVudC1ob3JpIC51aS1yZXNpemFibGUtaGFuZGxlIHtcXG5cXHRfcGFkZGluZy1ib3R0b206IDE0cHg7IC8qIElFNiBoYWQgMCBoZWlnaHQgKi9cXG5cXHR9XFxuXFxuXFxuXFxuLyogUmV1c2FibGUgU2VwYXJhdGUtYm9yZGVyIFRhYmxlXFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG5cXG50YWJsZS5mYy1ib3JkZXItc2VwYXJhdGUge1xcblxcdGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XFxuXFx0fVxcblxcbi5mYy1ib3JkZXItc2VwYXJhdGUgdGgsXFxuLmZjLWJvcmRlci1zZXBhcmF0ZSB0ZCB7XFxuXFx0Ym9yZGVyLXdpZHRoOiAxcHggMCAwIDFweDtcXG5cXHR9XFxuXFxuLmZjLWJvcmRlci1zZXBhcmF0ZSB0aC5mYy1sYXN0LFxcbi5mYy1ib3JkZXItc2VwYXJhdGUgdGQuZmMtbGFzdCB7XFxuXFx0Ym9yZGVyLXJpZ2h0LXdpZHRoOiAxcHg7XFxuXFx0fVxcblxcblxcbi5mYy1ib3JkZXItc2VwYXJhdGUgdHIuZmMtbGFzdCB0ZCB7XFxuXFxufVxcbi5mYy1ib3JkZXItc2VwYXJhdGUgLmZjLXdlZWsgLmZjLWZpcnN0e1xcbiAgICBib3JkZXItbGVmdDogMDtcXG59XFxuLmZjLWJvcmRlci1zZXBhcmF0ZSAuZmMtd2VlayAuZmMtbGFzdHtcXG4gICAgYm9yZGVyLXJpZ2h0OiAwO1xcbn1cXG4uZmMtYm9yZGVyLXNlcGFyYXRlIHRyLmZjLWxhc3QgdGh7XFxuICAgIGJvcmRlci1ib3R0b20td2lkdGg6IDFweDtcXG4gICAgYm9yZGVyLWNvbG9yOiAjY2RjZGNkO1xcbiAgICBmb250LXNpemU6IDE2cHg7XFxuICAgIGZvbnQtd2VpZ2h0OiAzMDA7XFxuXFx0bGluZS1oZWlnaHQ6IDMwcHg7XFxufVxcbi5mYy1ib3JkZXItc2VwYXJhdGUgdGJvZHkgdHIuZmMtZmlyc3QgdGQsXFxuLmZjLWJvcmRlci1zZXBhcmF0ZSB0Ym9keSB0ci5mYy1maXJzdCB0aCB7XFxuXFx0Ym9yZGVyLXRvcC13aWR0aDogMDtcXG5cXHR9XFxuXFxuXFxuXFxuLyogTW9udGggVmlldywgQmFzaWMgV2VlayBWaWV3LCBCYXNpYyBEYXkgVmlld1xcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuXFxuLmZjLWdyaWQgdGgge1xcblxcdHRleHQtYWxpZ246IGNlbnRlcjtcXG5cXHR9XFxuXFxuLmZjIC5mYy13ZWVrLW51bWJlciB7XFxuXFx0d2lkdGg6IDIycHg7XFxuXFx0dGV4dC1hbGlnbjogY2VudGVyO1xcblxcdH1cXG5cXG4uZmMgLmZjLXdlZWstbnVtYmVyIGRpdiB7XFxuXFx0cGFkZGluZzogMCAycHg7XFxuXFx0fVxcblxcbi5mYy1ncmlkIC5mYy1kYXktbnVtYmVyIHtcXG5cXHRmbG9hdDogcmlnaHQ7XFxuXFx0cGFkZGluZzogMCAycHg7XFxuXFx0fVxcblxcbi5mYy1ncmlkIC5mYy1vdGhlci1tb250aCAuZmMtZGF5LW51bWJlciB7XFxuXFx0b3BhY2l0eTogMC4zO1xcblxcdGZpbHRlcjogYWxwaGEob3BhY2l0eT0zMCk7IC8qIGZvciBJRSAqL1xcblxcdC8qIG9wYWNpdHkgd2l0aCBzbWFsbCBmb250IGNhbiBzb21ldGltZXMgbG9vayB0b28gZmFkZWRcXG5cXHQgICBtaWdodCB3YW50IHRvIHNldCB0aGUgJ2NvbG9yJyBwcm9wZXJ0eSBpbnN0ZWFkXFxuXFx0ICAgbWFraW5nIGRheS1udW1iZXJzIGJvbGQgYWxzbyBmaXhlcyB0aGUgcHJvYmxlbSAqL1xcblxcdH1cXG5cXG4uZmMtZ3JpZCAuZmMtZGF5LWNvbnRlbnQge1xcblxcdGNsZWFyOiBib3RoO1xcblxcdHBhZGRpbmc6IDJweCAycHggMXB4OyAvKiBkaXN0YW5jZSBiZXR3ZWVuIGV2ZW50cyBhbmQgZGF5IGVkZ2VzICovXFxuXFx0fVxcblxcbi8qIGV2ZW50IHN0eWxlcyAqL1xcblxcbi5mYy1ncmlkIC5mYy1ldmVudC10aW1lIHtcXG5cXHRmb250LXdlaWdodDogYm9sZDtcXG5cXHR9XFxuXFxuLyogcmlnaHQtdG8tbGVmdCAqL1xcblxcbi5mYy1ydGwgLmZjLWdyaWQgLmZjLWRheS1udW1iZXIge1xcblxcdGZsb2F0OiBsZWZ0O1xcblxcdH1cXG5cXG4uZmMtcnRsIC5mYy1ncmlkIC5mYy1ldmVudC10aW1lIHtcXG5cXHRmbG9hdDogcmlnaHQ7XFxuXFx0fVxcblxcblxcblxcbi8qIEFnZW5kYSBXZWVrIFZpZXcsIEFnZW5kYSBEYXkgVmlld1xcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuXFxuLmZjLWFnZW5kYSB0YWJsZSB7XFxuXFx0Ym9yZGVyLWNvbGxhcHNlOiBzZXBhcmF0ZTtcXG5cXHR9XFxuXFxuLmZjLWFnZW5kYS1kYXlzIHRoIHtcXG5cXHR0ZXh0LWFsaWduOiBjZW50ZXI7XFxuXFx0fVxcblxcbi5mYy1hZ2VuZGEgLmZjLWFnZW5kYS1heGlzIHtcXG5cXHR3aWR0aDogNTBweDtcXG5cXHRwYWRkaW5nOiAwIDRweDtcXG5cXHR2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xcblxcdHRleHQtYWxpZ246IHJpZ2h0O1xcblxcdHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG5cXHR9XFxuXFxuLmZjLWFnZW5kYSAuZmMtd2Vlay1udW1iZXIge1xcblxcdGZvbnQtd2VpZ2h0OiBib2xkO1xcblxcdH1cXG5cXG4uZmMtYWdlbmRhIC5mYy1kYXktY29udGVudCB7XFxuXFx0cGFkZGluZzogMnB4IDJweCAxcHg7XFxuXFx0fVxcblxcbi8qIG1ha2UgYXhpcyBib3JkZXIgdGFrZSBwcmVjZWRlbmNlICovXFxuXFxuLmZjLWFnZW5kYS1kYXlzIC5mYy1hZ2VuZGEtYXhpcyB7XFxuXFx0Ym9yZGVyLXJpZ2h0LXdpZHRoOiAxcHg7XFxuXFx0fVxcblxcbi5mYy1hZ2VuZGEtZGF5cyAuZmMtY29sMCB7XFxuXFx0Ym9yZGVyLWxlZnQtd2lkdGg6IDA7XFxuXFx0fVxcblxcbi8qIGFsbC1kYXkgYXJlYSAqL1xcblxcbi5mYy1hZ2VuZGEtYWxsZGF5IHRoIHtcXG5cXHRib3JkZXItd2lkdGg6IDAgMXB4O1xcblxcdH1cXG5cXG4uZmMtYWdlbmRhLWFsbGRheSAuZmMtZGF5LWNvbnRlbnQge1xcblxcdG1pbi1oZWlnaHQ6IDM0cHg7IC8qIFRPRE86IGRvZXNudCB3b3JrIHdlbGwgaW4gcXVpcmtzbW9kZSAqL1xcblxcdF9oZWlnaHQ6IDM0cHg7XFxuXFx0fVxcblxcbi8qIGRpdmlkZXIgKGJldHdlZW4gYWxsLWRheSBhbmQgc2xvdHMpICovXFxuXFxuLmZjLWFnZW5kYS1kaXZpZGVyLWlubmVyIHtcXG5cXHRoZWlnaHQ6IDJweDtcXG5cXHRvdmVyZmxvdzogaGlkZGVuO1xcblxcdH1cXG5cXG4uZmMtd2lkZ2V0LWhlYWRlciAuZmMtYWdlbmRhLWRpdmlkZXItaW5uZXIge1xcblxcdGJhY2tncm91bmQ6ICNlZWU7XFxuXFx0fVxcblxcbi8qIHNsb3Qgcm93cyAqL1xcblxcbi5mYy1hZ2VuZGEtc2xvdHMgdGgge1xcblxcdGJvcmRlci13aWR0aDogMXB4IDFweCAwO1xcblxcdH1cXG5cXG4uZmMtYWdlbmRhLXNsb3RzIHRkIHtcXG5cXHRib3JkZXItd2lkdGg6IDFweCAwIDA7XFxuXFx0YmFja2dyb3VuZDogbm9uZTtcXG5cXHR9XFxuXFxuLmZjLWFnZW5kYS1zbG90cyB0ZCBkaXYge1xcblxcdGhlaWdodDogMjBweDtcXG5cXHR9XFxuXFxuLmZjLWFnZW5kYS1zbG90cyB0ci5mYy1zbG90MCB0aCxcXG4uZmMtYWdlbmRhLXNsb3RzIHRyLmZjLXNsb3QwIHRkIHtcXG5cXHRib3JkZXItdG9wLXdpZHRoOiAwO1xcblxcdH1cXG5cXG4uZmMtYWdlbmRhLXNsb3RzIHRyLmZjLW1pbm9yIHRoLnVpLXdpZGdldC1oZWFkZXIge1xcblxcdCpib3JkZXItdG9wLXN0eWxlOiBzb2xpZDsgLyogZG9lc24ndCB3b3JrIHdpdGggYmFja2dyb3VuZCBpbiBJRTYvNyAqL1xcblxcdH1cXG5cXG5cXG5cXG4vKiBWZXJ0aWNhbCBFdmVudHNcXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcblxcbi5mYy1ldmVudC12ZXJ0IHtcXG5cXHRib3JkZXItd2lkdGg6IDAgMXB4O1xcblxcdH1cXG5cXG4uZmMtZXZlbnQtdmVydC5mYy1ldmVudC1zdGFydCB7XFxuXFx0Ym9yZGVyLXRvcC13aWR0aDogMXB4O1xcblxcdGJvcmRlci10b3AtbGVmdC1yYWRpdXM6IDNweDtcXG5cXHRib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogM3B4O1xcblxcdH1cXG5cXG4uZmMtZXZlbnQtdmVydC5mYy1ldmVudC1lbmQge1xcblxcdGJvcmRlci1ib3R0b20td2lkdGg6IDFweDtcXG5cXHRib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiAzcHg7XFxuXFx0Ym9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IDNweDtcXG5cXHR9XFxuXFxuLmZjLWV2ZW50LXZlcnQgLmZjLWV2ZW50LXRpbWUge1xcblxcdHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuXFx0Zm9udC1zaXplOiAxMHB4O1xcblxcdH1cXG5cXG4uZmMtZXZlbnQtdmVydCAuZmMtZXZlbnQtaW5uZXIge1xcblxcdHBvc2l0aW9uOiByZWxhdGl2ZTtcXG5cXHR6LWluZGV4OiAyO1xcblxcdH1cXG5cXG4uZmMtZXZlbnQtdmVydCAuZmMtZXZlbnQtYmcgeyAvKiBtYWtlcyB0aGUgZXZlbnQgbGlnaHRlciB3LyBhIHNlbWktdHJhbnNwYXJlbnQgb3ZlcmxheSAgKi9cXG5cXHRwb3NpdGlvbjogYWJzb2x1dGU7XFxuXFx0ei1pbmRleDogMTtcXG5cXHR0b3A6IDA7XFxuXFx0bGVmdDogMDtcXG5cXHR3aWR0aDogMTAwJTtcXG5cXHRoZWlnaHQ6IDEwMCU7XFxuXFx0YmFja2dyb3VuZDogI2ZmZjtcXG5cXHRvcGFjaXR5OiAuMjU7XFxuXFx0ZmlsdGVyOiBhbHBoYShvcGFjaXR5PTI1KTtcXG5cXHR9XFxuXFxuLmZjIC51aS1kcmFnZ2FibGUtZHJhZ2dpbmcgLmZjLWV2ZW50LWJnLCAvKiBUT0RPOiBzb21ldGhpbmcgbmljZXIgbGlrZSAuZmMtb3BhY2l0eSAqL1xcbi5mYy1zZWxlY3QtaGVscGVyIC5mYy1ldmVudC1iZyB7XFxuXFx0ZGlzcGxheTogbm9uZVxcXFw5OyAvKiBmb3IgSUU2LzcvOC4gbmVzdGVkIG9wYWNpdHkgZmlsdGVycyB3aGlsZSBkcmFnZ2luZyBkb24ndCB3b3JrICovXFxuXFx0fVxcblxcbi8qIHJlc2l6YWJsZSAqL1xcblxcbi5mYy1ldmVudC12ZXJ0IC51aS1yZXNpemFibGUtcyB7XFxuXFx0Ym90dG9tOiAwICAgICAgICAhaW1wb3J0YW50OyAvKiBpbXBvcnRhbnRzIG92ZXJyaWRlIHByZSBqcXVlcnkgdWkgMS43IHN0eWxlcyAqL1xcblxcdHdpZHRoOiAxMDAlICAgICAgIWltcG9ydGFudDtcXG5cXHRoZWlnaHQ6IDhweCAgICAgICFpbXBvcnRhbnQ7XFxuXFx0b3ZlcmZsb3c6IGhpZGRlbiAhaW1wb3J0YW50O1xcblxcdGxpbmUtaGVpZ2h0OiA4cHggIWltcG9ydGFudDtcXG5cXHRmb250LXNpemU6IDExcHggICFpbXBvcnRhbnQ7XFxuXFx0Zm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcXG5cXHR0ZXh0LWFsaWduOiBjZW50ZXI7XFxuXFx0Y3Vyc29yOiBzLXJlc2l6ZTtcXG5cXHR9XFxuXFxuLmZjLWFnZW5kYSAudWktcmVzaXphYmxlLXJlc2l6aW5nIHsgLyogVE9ETzogYmV0dGVyIHNlbGVjdG9yICovXFxuXFx0X292ZXJmbG93OiBoaWRkZW47XFxuXFx0fVxcblxcbnRoZWFkIHRyLmZjLWZpcnN0e1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjdmN2Y3O1xcbn1cXG50YWJsZS5mYy1oZWFkZXJ7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XFxuICAgIGJvcmRlci1yYWRpdXM6IDZweCA2cHggMCAwO1xcbn1cXG5cXG4uZmMtd2VlayAuZmMtZGF5ID4gZGl2IC5mYy1kYXktbnVtYmVye1xcbiAgICBmb250LXNpemU6IDE1cHg7XFxuICAgIG1hcmdpbjogMnB4O1xcbiAgICBtaW4td2lkdGg6IDE5cHg7XFxuICAgIHBhZGRpbmc6IDZweDtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgICAgICB3aWR0aDogMzBweDtcXG4gICAgaGVpZ2h0OiAzMHB4O1xcbn1cXG4uZmMtc3VuLCAuZmMtc2F0e1xcbiAgICBjb2xvcjogI2I4YjhiODtcXG59XFxuXFxuLmZjLXdlZWsgLmZjLWRheTpob3ZlciAuZmMtZGF5LW51bWJlcntcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI0I4QjhCODtcXG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xcbiAgICBjb2xvcjogI0ZGRkZGRjtcXG4gICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZC1jb2xvciAwLjJzO1xcbn1cXG4uZmMtd2VlayAuZmMtZGF5LmZjLXN0YXRlLWhpZ2hsaWdodDpob3ZlciAuZmMtZGF5LW51bWJlcntcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogICNmZjNiMzA7XFxufVxcbi5mYy1idXR0b24tdG9kYXl7XFxuICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjApO1xcbn1cXG4uZmMtdmlldy1hZ2VuZGFEYXkgdGhlYWQgdHIuZmMtZmlyc3QgLmZjLXdpZGdldC1oZWFkZXJ7XFxuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xcbiAgICBwYWRkaW5nLXJpZ2h0OiAxMHB4O1xcbn1cXG5cXG4vKiFcXG4gKiBGdWxsQ2FsZW5kYXIgdjEuNi40IFByaW50IFN0eWxlc2hlZXRcXG4gKiBEb2NzICYgTGljZW5zZTogaHR0cDovL2Fyc2hhdy5jb20vZnVsbGNhbGVuZGFyL1xcbiAqIChjKSAyMDEzIEFkYW0gU2hhd1xcbiAqL1xcblxcbi8qXFxuICogSW5jbHVkZSB0aGlzIHN0eWxlc2hlZXQgb24geW91ciBwYWdlIHRvIGdldCBhIG1vcmUgcHJpbnRlci1mcmllbmRseSBjYWxlbmRhci5cXG4gKiBXaGVuIGluY2x1ZGluZyB0aGlzIHN0eWxlc2hlZXQsIHVzZSB0aGUgbWVkaWE9J3ByaW50JyBhdHRyaWJ1dGUgb2YgdGhlIDxsaW5rPiB0YWcuXFxuICogTWFrZSBzdXJlIHRvIGluY2x1ZGUgdGhpcyBzdHlsZXNoZWV0IElOIEFERElUSU9OIHRvIHRoZSByZWd1bGFyIGZ1bGxjYWxlbmRhci5jc3MuXFxuICovXFxuXFxuXFxuIC8qIEV2ZW50c1xcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG5cXG4uZmMtZXZlbnQge1xcblxcdGJhY2tncm91bmQ6ICNmZmYgIWltcG9ydGFudDtcXG5cXHRjb2xvcjogIzAwMCAhaW1wb3J0YW50O1xcblxcdH1cXG5cXG4vKiBmb3IgdmVydGljYWwgZXZlbnRzICovXFxuXFxuLmZjLWV2ZW50LWJnIHtcXG5cXHRkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XFxuXFx0fVxcblxcbi5mYy1ldmVudCAudWktcmVzaXphYmxlLWhhbmRsZSB7XFxuXFx0ZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O1xcblxcdH1cXG5cXG5cXG5cIiwgXCJcIl0pO1xuLy8gRXhwb3J0c1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzO1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/calendar.css\n");

/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/mystyles.css":
/*!****************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/mystyles.css ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// Imports\nvar ___CSS_LOADER_API_IMPORT___ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ \"./node_modules/css-loader/dist/runtime/api.js\");\nexports = ___CSS_LOADER_API_IMPORT___(false);\nexports.push([module.i, \"@import url(https://fonts.googleapis.com/css?family=Nunito:400,700);\"]);\n// Module\nexports.push([module.i, \"@keyframes spinAround {\\n  from {\\n    transform: rotate(0deg); }\\n  to {\\n    transform: rotate(359deg); } }\\n\\n.is-unselectable, .button, .file {\\n  -webkit-touch-callout: none;\\n  -webkit-user-select: none;\\n  -moz-user-select: none;\\n  -ms-user-select: none;\\n  user-select: none; }\\n\\n.select:not(.is-multiple):not(.is-loading)::after, .navbar-link:not(.is-arrowless)::after {\\n  border: 3px solid transparent;\\n  border-radius: 2px;\\n  border-right: 0;\\n  border-top: 0;\\n  content: \\\" \\\";\\n  display: block;\\n  height: 0.625em;\\n  margin-top: -0.4375em;\\n  pointer-events: none;\\n  position: absolute;\\n  top: 50%;\\n  transform: rotate(-45deg);\\n  transform-origin: center;\\n  width: 0.625em; }\\n\\n.title:not(:last-child),\\n.subtitle:not(:last-child) {\\n  margin-bottom: 1.5rem; }\\n\\n.button.is-loading::after, .select.is-loading::after, .control.is-loading::after {\\n  animation: spinAround 500ms infinite linear;\\n  border: 2px solid #dbdbdb;\\n  border-radius: 290486px;\\n  border-right-color: transparent;\\n  border-top-color: transparent;\\n  content: \\\"\\\";\\n  display: block;\\n  height: 1em;\\n  position: relative;\\n  width: 1em; }\\n\\n.is-overlay, .hero-video {\\n  bottom: 0;\\n  left: 0;\\n  position: absolute;\\n  right: 0;\\n  top: 0; }\\n\\n.button, .input, .textarea, .select select, .file-cta,\\n.file-name {\\n  -moz-appearance: none;\\n  -webkit-appearance: none;\\n  align-items: center;\\n  border: 2px solid transparent;\\n  border-radius: 4px;\\n  box-shadow: none;\\n  display: inline-flex;\\n  font-size: 1rem;\\n  height: 2.5em;\\n  justify-content: flex-start;\\n  line-height: 1.5;\\n  padding-bottom: calc(0.5em - 2px);\\n  padding-left: calc(0.75em - 2px);\\n  padding-right: calc(0.75em - 2px);\\n  padding-top: calc(0.5em - 2px);\\n  position: relative;\\n  vertical-align: top; }\\n  .button:focus, .input:focus, .textarea:focus, .select select:focus, .file-cta:focus,\\n  .file-name:focus, .is-focused.button, .is-focused.input, .is-focused.textarea, .select select.is-focused, .is-focused.file-cta,\\n  .is-focused.file-name, .button:active, .input:active, .textarea:active, .select select:active, .file-cta:active,\\n  .file-name:active, .is-active.button, .is-active.input, .is-active.textarea, .select select.is-active, .is-active.file-cta,\\n  .is-active.file-name {\\n    outline: none; }\\n  .button[disabled], .input[disabled], .textarea[disabled], .select select[disabled], .file-cta[disabled],\\n  .file-name[disabled],\\n  fieldset[disabled] .button,\\n  fieldset[disabled] .input,\\n  fieldset[disabled] .textarea,\\n  fieldset[disabled] .select select,\\n  .select fieldset[disabled] select,\\n  fieldset[disabled] .file-cta,\\n  fieldset[disabled] .file-name {\\n    cursor: not-allowed; }\\n\\n/*! minireset.css v0.0.6 | MIT License | github.com/jgthms/minireset.css */\\nhtml,\\nbody,\\np,\\nol,\\nul,\\nli,\\ndl,\\ndt,\\ndd,\\nblockquote,\\nfigure,\\nfieldset,\\nlegend,\\ntextarea,\\npre,\\niframe,\\nhr,\\nh1,\\nh2,\\nh3,\\nh4,\\nh5,\\nh6 {\\n  margin: 0;\\n  padding: 0; }\\n\\nh1,\\nh2,\\nh3,\\nh4,\\nh5,\\nh6 {\\n  font-size: 100%;\\n  font-weight: normal; }\\n\\nul {\\n  list-style: none; }\\n\\nbutton,\\ninput,\\nselect,\\ntextarea {\\n  margin: 0; }\\n\\nhtml {\\n  box-sizing: border-box; }\\n\\n*, *::before, *::after {\\n  box-sizing: inherit; }\\n\\nimg,\\nvideo {\\n  height: auto;\\n  max-width: 100%; }\\n\\niframe {\\n  border: 0; }\\n\\ntable {\\n  border-collapse: collapse;\\n  border-spacing: 0; }\\n\\ntd,\\nth {\\n  padding: 0; }\\n  td:not([align]),\\n  th:not([align]) {\\n    text-align: left; }\\n\\nhtml {\\n  background-color: #EFF0EB;\\n  font-size: 16px;\\n  -moz-osx-font-smoothing: grayscale;\\n  -webkit-font-smoothing: antialiased;\\n  min-width: 300px;\\n  overflow-x: hidden;\\n  overflow-y: scroll;\\n  text-rendering: optimizeLegibility;\\n  text-size-adjust: 100%; }\\n\\narticle,\\naside,\\nfigure,\\nfooter,\\nheader,\\nhgroup,\\nsection {\\n  display: block; }\\n\\nbody,\\nbutton,\\ninput,\\nselect,\\ntextarea {\\n  font-family: \\\"Nunito\\\", sans-serif; }\\n\\ncode,\\npre {\\n  -moz-osx-font-smoothing: auto;\\n  -webkit-font-smoothing: auto;\\n  font-family: monospace; }\\n\\nbody {\\n  color: #757763;\\n  font-size: 1em;\\n  font-weight: 400;\\n  line-height: 1.5; }\\n\\na {\\n  color: blue;\\n  cursor: pointer;\\n  text-decoration: none; }\\n  a strong {\\n    color: currentColor; }\\n  a:hover {\\n    color: #363636; }\\n\\ncode {\\n  background-color: whitesmoke;\\n  color: #f14668;\\n  font-size: 0.875em;\\n  font-weight: normal;\\n  padding: 0.25em 0.5em 0.25em; }\\n\\nhr {\\n  background-color: whitesmoke;\\n  border: none;\\n  display: block;\\n  height: 2px;\\n  margin: 1.5rem 0; }\\n\\nimg {\\n  height: auto;\\n  max-width: 100%; }\\n\\ninput[type=\\\"checkbox\\\"],\\ninput[type=\\\"radio\\\"] {\\n  vertical-align: baseline; }\\n\\nsmall {\\n  font-size: 0.875em; }\\n\\nspan {\\n  font-style: inherit;\\n  font-weight: inherit; }\\n\\nstrong {\\n  color: #363636;\\n  font-weight: 700; }\\n\\nfieldset {\\n  border: none; }\\n\\npre {\\n  -webkit-overflow-scrolling: touch;\\n  background-color: whitesmoke;\\n  color: #757763;\\n  font-size: 0.875em;\\n  overflow-x: auto;\\n  padding: 1.25rem 1.5rem;\\n  white-space: pre;\\n  word-wrap: normal; }\\n  pre code {\\n    background-color: transparent;\\n    color: currentColor;\\n    font-size: 1em;\\n    padding: 0; }\\n\\ntable td,\\ntable th {\\n  vertical-align: top; }\\n  table td:not([align]),\\n  table th:not([align]) {\\n    text-align: left; }\\n\\ntable th {\\n  color: #363636; }\\n\\n.is-clearfix::after {\\n  clear: both;\\n  content: \\\" \\\";\\n  display: table; }\\n\\n.is-pulled-left {\\n  float: left !important; }\\n\\n.is-pulled-right {\\n  float: right !important; }\\n\\n.is-clipped {\\n  overflow: hidden !important; }\\n\\n.is-size-1 {\\n  font-size: 3rem !important; }\\n\\n.is-size-2 {\\n  font-size: 2.5rem !important; }\\n\\n.is-size-3 {\\n  font-size: 2rem !important; }\\n\\n.is-size-4 {\\n  font-size: 1.5rem !important; }\\n\\n.is-size-5 {\\n  font-size: 1.25rem !important; }\\n\\n.is-size-6 {\\n  font-size: 1rem !important; }\\n\\n.is-size-7 {\\n  font-size: 0.75rem !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-size-1-mobile {\\n    font-size: 3rem !important; }\\n  .is-size-2-mobile {\\n    font-size: 2.5rem !important; }\\n  .is-size-3-mobile {\\n    font-size: 2rem !important; }\\n  .is-size-4-mobile {\\n    font-size: 1.5rem !important; }\\n  .is-size-5-mobile {\\n    font-size: 1.25rem !important; }\\n  .is-size-6-mobile {\\n    font-size: 1rem !important; }\\n  .is-size-7-mobile {\\n    font-size: 0.75rem !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-size-1-tablet {\\n    font-size: 3rem !important; }\\n  .is-size-2-tablet {\\n    font-size: 2.5rem !important; }\\n  .is-size-3-tablet {\\n    font-size: 2rem !important; }\\n  .is-size-4-tablet {\\n    font-size: 1.5rem !important; }\\n  .is-size-5-tablet {\\n    font-size: 1.25rem !important; }\\n  .is-size-6-tablet {\\n    font-size: 1rem !important; }\\n  .is-size-7-tablet {\\n    font-size: 0.75rem !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-size-1-touch {\\n    font-size: 3rem !important; }\\n  .is-size-2-touch {\\n    font-size: 2.5rem !important; }\\n  .is-size-3-touch {\\n    font-size: 2rem !important; }\\n  .is-size-4-touch {\\n    font-size: 1.5rem !important; }\\n  .is-size-5-touch {\\n    font-size: 1.25rem !important; }\\n  .is-size-6-touch {\\n    font-size: 1rem !important; }\\n  .is-size-7-touch {\\n    font-size: 0.75rem !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-size-1-desktop {\\n    font-size: 3rem !important; }\\n  .is-size-2-desktop {\\n    font-size: 2.5rem !important; }\\n  .is-size-3-desktop {\\n    font-size: 2rem !important; }\\n  .is-size-4-desktop {\\n    font-size: 1.5rem !important; }\\n  .is-size-5-desktop {\\n    font-size: 1.25rem !important; }\\n  .is-size-6-desktop {\\n    font-size: 1rem !important; }\\n  .is-size-7-desktop {\\n    font-size: 0.75rem !important; } }\\n\\n.has-text-centered {\\n  text-align: center !important; }\\n\\n.has-text-justified {\\n  text-align: justify !important; }\\n\\n.has-text-left {\\n  text-align: left !important; }\\n\\n.has-text-right {\\n  text-align: right !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .has-text-centered-mobile {\\n    text-align: center !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .has-text-centered-tablet {\\n    text-align: center !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .has-text-centered-tablet-only {\\n    text-align: center !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .has-text-centered-touch {\\n    text-align: center !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .has-text-centered-desktop {\\n    text-align: center !important; } }\\n\\n@media screen and (max-width: 768px) {\\n  .has-text-justified-mobile {\\n    text-align: justify !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .has-text-justified-tablet {\\n    text-align: justify !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .has-text-justified-tablet-only {\\n    text-align: justify !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .has-text-justified-touch {\\n    text-align: justify !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .has-text-justified-desktop {\\n    text-align: justify !important; } }\\n\\n@media screen and (max-width: 768px) {\\n  .has-text-left-mobile {\\n    text-align: left !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .has-text-left-tablet {\\n    text-align: left !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .has-text-left-tablet-only {\\n    text-align: left !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .has-text-left-touch {\\n    text-align: left !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .has-text-left-desktop {\\n    text-align: left !important; } }\\n\\n@media screen and (max-width: 768px) {\\n  .has-text-right-mobile {\\n    text-align: right !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .has-text-right-tablet {\\n    text-align: right !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .has-text-right-tablet-only {\\n    text-align: right !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .has-text-right-touch {\\n    text-align: right !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .has-text-right-desktop {\\n    text-align: right !important; } }\\n\\n.is-capitalized {\\n  text-transform: capitalize !important; }\\n\\n.is-lowercase {\\n  text-transform: lowercase !important; }\\n\\n.is-uppercase {\\n  text-transform: uppercase !important; }\\n\\n.is-italic {\\n  font-style: italic !important; }\\n\\n.has-text-white {\\n  color: white !important; }\\n\\na.has-text-white:hover, a.has-text-white:focus {\\n  color: #e6e6e6 !important; }\\n\\n.has-background-white {\\n  background-color: white !important; }\\n\\n.has-text-black {\\n  color: #0a0a0a !important; }\\n\\na.has-text-black:hover, a.has-text-black:focus {\\n  color: black !important; }\\n\\n.has-background-black {\\n  background-color: #0a0a0a !important; }\\n\\n.has-text-light {\\n  color: whitesmoke !important; }\\n\\na.has-text-light:hover, a.has-text-light:focus {\\n  color: #dbdbdb !important; }\\n\\n.has-background-light {\\n  background-color: whitesmoke !important; }\\n\\n.has-text-dark {\\n  color: #363636 !important; }\\n\\na.has-text-dark:hover, a.has-text-dark:focus {\\n  color: #1c1c1c !important; }\\n\\n.has-background-dark {\\n  background-color: #363636 !important; }\\n\\n.has-text-primary {\\n  color: #8A4D76 !important; }\\n\\na.has-text-primary:hover, a.has-text-primary:focus {\\n  color: #693b5a !important; }\\n\\n.has-background-primary {\\n  background-color: #8A4D76 !important; }\\n\\n.has-text-link {\\n  color: blue !important; }\\n\\na.has-text-link:hover, a.has-text-link:focus {\\n  color: #0000cc !important; }\\n\\n.has-background-link {\\n  background-color: blue !important; }\\n\\n.has-text-info {\\n  color: #3298dc !important; }\\n\\na.has-text-info:hover, a.has-text-info:focus {\\n  color: #207dbc !important; }\\n\\n.has-background-info {\\n  background-color: #3298dc !important; }\\n\\n.has-text-success {\\n  color: #48c774 !important; }\\n\\na.has-text-success:hover, a.has-text-success:focus {\\n  color: #34a85c !important; }\\n\\n.has-background-success {\\n  background-color: #48c774 !important; }\\n\\n.has-text-warning {\\n  color: #ffdd57 !important; }\\n\\na.has-text-warning:hover, a.has-text-warning:focus {\\n  color: #ffd324 !important; }\\n\\n.has-background-warning {\\n  background-color: #ffdd57 !important; }\\n\\n.has-text-danger {\\n  color: #f14668 !important; }\\n\\na.has-text-danger:hover, a.has-text-danger:focus {\\n  color: #ee1742 !important; }\\n\\n.has-background-danger {\\n  background-color: #f14668 !important; }\\n\\n.has-text-black-bis {\\n  color: #121212 !important; }\\n\\n.has-background-black-bis {\\n  background-color: #121212 !important; }\\n\\n.has-text-black-ter {\\n  color: #242424 !important; }\\n\\n.has-background-black-ter {\\n  background-color: #242424 !important; }\\n\\n.has-text-grey-darker {\\n  color: #363636 !important; }\\n\\n.has-background-grey-darker {\\n  background-color: #363636 !important; }\\n\\n.has-text-grey-dark {\\n  color: #757763 !important; }\\n\\n.has-background-grey-dark {\\n  background-color: #757763 !important; }\\n\\n.has-text-grey {\\n  color: #7a7a7a !important; }\\n\\n.has-background-grey {\\n  background-color: #7a7a7a !important; }\\n\\n.has-text-grey-light {\\n  color: #D0D1CD !important; }\\n\\n.has-background-grey-light {\\n  background-color: #D0D1CD !important; }\\n\\n.has-text-grey-lighter {\\n  color: #dbdbdb !important; }\\n\\n.has-background-grey-lighter {\\n  background-color: #dbdbdb !important; }\\n\\n.has-text-white-ter {\\n  color: whitesmoke !important; }\\n\\n.has-background-white-ter {\\n  background-color: whitesmoke !important; }\\n\\n.has-text-white-bis {\\n  color: #fafafa !important; }\\n\\n.has-background-white-bis {\\n  background-color: #fafafa !important; }\\n\\n.has-text-weight-light {\\n  font-weight: 300 !important; }\\n\\n.has-text-weight-normal {\\n  font-weight: 400 !important; }\\n\\n.has-text-weight-medium {\\n  font-weight: 500 !important; }\\n\\n.has-text-weight-semibold {\\n  font-weight: 600 !important; }\\n\\n.has-text-weight-bold {\\n  font-weight: 700 !important; }\\n\\n.is-family-primary {\\n  font-family: \\\"Nunito\\\", sans-serif !important; }\\n\\n.is-family-secondary {\\n  font-family: \\\"Nunito\\\", sans-serif !important; }\\n\\n.is-family-sans-serif {\\n  font-family: \\\"Nunito\\\", sans-serif !important; }\\n\\n.is-family-monospace {\\n  font-family: monospace !important; }\\n\\n.is-family-code {\\n  font-family: monospace !important; }\\n\\n.is-block {\\n  display: block !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-block-mobile {\\n    display: block !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-block-tablet {\\n    display: block !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-block-tablet-only {\\n    display: block !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-block-touch {\\n    display: block !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-block-desktop {\\n    display: block !important; } }\\n\\n.is-flex {\\n  display: flex !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-flex-mobile {\\n    display: flex !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-flex-tablet {\\n    display: flex !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-flex-tablet-only {\\n    display: flex !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-flex-touch {\\n    display: flex !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-flex-desktop {\\n    display: flex !important; } }\\n\\n.is-inline {\\n  display: inline !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-inline-mobile {\\n    display: inline !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-inline-tablet {\\n    display: inline !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-inline-tablet-only {\\n    display: inline !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-inline-touch {\\n    display: inline !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-inline-desktop {\\n    display: inline !important; } }\\n\\n.is-inline-block {\\n  display: inline-block !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-inline-block-mobile {\\n    display: inline-block !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-inline-block-tablet {\\n    display: inline-block !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-inline-block-tablet-only {\\n    display: inline-block !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-inline-block-touch {\\n    display: inline-block !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-inline-block-desktop {\\n    display: inline-block !important; } }\\n\\n.is-inline-flex {\\n  display: inline-flex !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-inline-flex-mobile {\\n    display: inline-flex !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-inline-flex-tablet {\\n    display: inline-flex !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-inline-flex-tablet-only {\\n    display: inline-flex !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-inline-flex-touch {\\n    display: inline-flex !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-inline-flex-desktop {\\n    display: inline-flex !important; } }\\n\\n.is-hidden {\\n  display: none !important; }\\n\\n.is-sr-only {\\n  border: none !important;\\n  clip: rect(0, 0, 0, 0) !important;\\n  height: 0.01em !important;\\n  overflow: hidden !important;\\n  padding: 0 !important;\\n  position: absolute !important;\\n  white-space: nowrap !important;\\n  width: 0.01em !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-hidden-mobile {\\n    display: none !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-hidden-tablet {\\n    display: none !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-hidden-tablet-only {\\n    display: none !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-hidden-touch {\\n    display: none !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-hidden-desktop {\\n    display: none !important; } }\\n\\n.is-invisible {\\n  visibility: hidden !important; }\\n\\n@media screen and (max-width: 768px) {\\n  .is-invisible-mobile {\\n    visibility: hidden !important; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .is-invisible-tablet {\\n    visibility: hidden !important; } }\\n\\n@media screen and (min-width: 769px) and (max-width: 1023px) {\\n  .is-invisible-tablet-only {\\n    visibility: hidden !important; } }\\n\\n@media screen and (max-width: 1023px) {\\n  .is-invisible-touch {\\n    visibility: hidden !important; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .is-invisible-desktop {\\n    visibility: hidden !important; } }\\n\\n.is-marginless {\\n  margin: 0 !important; }\\n\\n.is-paddingless {\\n  padding: 0 !important; }\\n\\n.is-radiusless {\\n  border-radius: 0 !important; }\\n\\n.is-shadowless {\\n  box-shadow: none !important; }\\n\\n.is-relative {\\n  position: relative !important; }\\n\\n.button {\\n  background-color: white;\\n  border-color: #dbdbdb;\\n  border-width: 2px;\\n  color: #363636;\\n  cursor: pointer;\\n  justify-content: center;\\n  padding-bottom: calc(0.5em - 2px);\\n  padding-left: 1em;\\n  padding-right: 1em;\\n  padding-top: calc(0.5em - 2px);\\n  text-align: center;\\n  white-space: nowrap; }\\n  .button strong {\\n    color: inherit; }\\n  .button .icon, .button .icon.is-small, .button .icon.is-medium, .button .icon.is-large {\\n    height: 1.5em;\\n    width: 1.5em; }\\n  .button .icon:first-child:not(:last-child) {\\n    margin-left: calc(-0.5em - 2px);\\n    margin-right: 0.25em; }\\n  .button .icon:last-child:not(:first-child) {\\n    margin-left: 0.25em;\\n    margin-right: calc(-0.5em - 2px); }\\n  .button .icon:first-child:last-child {\\n    margin-left: calc(-0.5em - 2px);\\n    margin-right: calc(-0.5em - 2px); }\\n  .button:hover, .button.is-hovered {\\n    border-color: #D0D1CD;\\n    color: #363636; }\\n  .button:focus, .button.is-focused {\\n    border-color: #4b5cff;\\n    color: #363636; }\\n    .button:focus:not(:active), .button.is-focused:not(:active) {\\n      box-shadow: 0 0 0 0.125em rgba(0, 0, 255, 0.25); }\\n  .button:active, .button.is-active {\\n    border-color: #757763;\\n    color: #363636; }\\n  .button.is-text {\\n    background-color: transparent;\\n    border-color: transparent;\\n    color: #757763;\\n    text-decoration: underline; }\\n    .button.is-text:hover, .button.is-text.is-hovered, .button.is-text:focus, .button.is-text.is-focused {\\n      background-color: whitesmoke;\\n      color: #363636; }\\n    .button.is-text:active, .button.is-text.is-active {\\n      background-color: #e8e8e8;\\n      color: #363636; }\\n    .button.is-text[disabled],\\n    fieldset[disabled] .button.is-text {\\n      background-color: transparent;\\n      border-color: transparent;\\n      box-shadow: none; }\\n  .button.is-white {\\n    background-color: white;\\n    border-color: transparent;\\n    color: #0a0a0a; }\\n    .button.is-white:hover, .button.is-white.is-hovered {\\n      background-color: #f9f9f9;\\n      border-color: transparent;\\n      color: #0a0a0a; }\\n    .button.is-white:focus, .button.is-white.is-focused {\\n      border-color: transparent;\\n      color: #0a0a0a; }\\n      .button.is-white:focus:not(:active), .button.is-white.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.25); }\\n    .button.is-white:active, .button.is-white.is-active {\\n      background-color: #f2f2f2;\\n      border-color: transparent;\\n      color: #0a0a0a; }\\n    .button.is-white[disabled],\\n    fieldset[disabled] .button.is-white {\\n      background-color: white;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-white.is-inverted {\\n      background-color: #0a0a0a;\\n      color: white; }\\n      .button.is-white.is-inverted:hover, .button.is-white.is-inverted.is-hovered {\\n        background-color: black; }\\n      .button.is-white.is-inverted[disabled],\\n      fieldset[disabled] .button.is-white.is-inverted {\\n        background-color: #0a0a0a;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: white; }\\n    .button.is-white.is-loading::after {\\n      border-color: transparent transparent #0a0a0a #0a0a0a !important; }\\n    .button.is-white.is-outlined {\\n      background-color: transparent;\\n      border-color: white;\\n      color: white; }\\n      .button.is-white.is-outlined:hover, .button.is-white.is-outlined.is-hovered, .button.is-white.is-outlined:focus, .button.is-white.is-outlined.is-focused {\\n        background-color: white;\\n        border-color: white;\\n        color: #0a0a0a; }\\n      .button.is-white.is-outlined.is-loading::after {\\n        border-color: transparent transparent white white !important; }\\n      .button.is-white.is-outlined.is-loading:hover::after, .button.is-white.is-outlined.is-loading.is-hovered::after, .button.is-white.is-outlined.is-loading:focus::after, .button.is-white.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #0a0a0a #0a0a0a !important; }\\n      .button.is-white.is-outlined[disabled],\\n      fieldset[disabled] .button.is-white.is-outlined {\\n        background-color: transparent;\\n        border-color: white;\\n        box-shadow: none;\\n        color: white; }\\n    .button.is-white.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #0a0a0a;\\n      color: #0a0a0a; }\\n      .button.is-white.is-inverted.is-outlined:hover, .button.is-white.is-inverted.is-outlined.is-hovered, .button.is-white.is-inverted.is-outlined:focus, .button.is-white.is-inverted.is-outlined.is-focused {\\n        background-color: #0a0a0a;\\n        color: white; }\\n      .button.is-white.is-inverted.is-outlined.is-loading:hover::after, .button.is-white.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-white.is-inverted.is-outlined.is-loading:focus::after, .button.is-white.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent white white !important; }\\n      .button.is-white.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-white.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #0a0a0a;\\n        box-shadow: none;\\n        color: #0a0a0a; }\\n  .button.is-black {\\n    background-color: #0a0a0a;\\n    border-color: transparent;\\n    color: white; }\\n    .button.is-black:hover, .button.is-black.is-hovered {\\n      background-color: #040404;\\n      border-color: transparent;\\n      color: white; }\\n    .button.is-black:focus, .button.is-black.is-focused {\\n      border-color: transparent;\\n      color: white; }\\n      .button.is-black:focus:not(:active), .button.is-black.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25); }\\n    .button.is-black:active, .button.is-black.is-active {\\n      background-color: black;\\n      border-color: transparent;\\n      color: white; }\\n    .button.is-black[disabled],\\n    fieldset[disabled] .button.is-black {\\n      background-color: #0a0a0a;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-black.is-inverted {\\n      background-color: white;\\n      color: #0a0a0a; }\\n      .button.is-black.is-inverted:hover, .button.is-black.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-black.is-inverted[disabled],\\n      fieldset[disabled] .button.is-black.is-inverted {\\n        background-color: white;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #0a0a0a; }\\n    .button.is-black.is-loading::after {\\n      border-color: transparent transparent white white !important; }\\n    .button.is-black.is-outlined {\\n      background-color: transparent;\\n      border-color: #0a0a0a;\\n      color: #0a0a0a; }\\n      .button.is-black.is-outlined:hover, .button.is-black.is-outlined.is-hovered, .button.is-black.is-outlined:focus, .button.is-black.is-outlined.is-focused {\\n        background-color: #0a0a0a;\\n        border-color: #0a0a0a;\\n        color: white; }\\n      .button.is-black.is-outlined.is-loading::after {\\n        border-color: transparent transparent #0a0a0a #0a0a0a !important; }\\n      .button.is-black.is-outlined.is-loading:hover::after, .button.is-black.is-outlined.is-loading.is-hovered::after, .button.is-black.is-outlined.is-loading:focus::after, .button.is-black.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent white white !important; }\\n      .button.is-black.is-outlined[disabled],\\n      fieldset[disabled] .button.is-black.is-outlined {\\n        background-color: transparent;\\n        border-color: #0a0a0a;\\n        box-shadow: none;\\n        color: #0a0a0a; }\\n    .button.is-black.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: white;\\n      color: white; }\\n      .button.is-black.is-inverted.is-outlined:hover, .button.is-black.is-inverted.is-outlined.is-hovered, .button.is-black.is-inverted.is-outlined:focus, .button.is-black.is-inverted.is-outlined.is-focused {\\n        background-color: white;\\n        color: #0a0a0a; }\\n      .button.is-black.is-inverted.is-outlined.is-loading:hover::after, .button.is-black.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-black.is-inverted.is-outlined.is-loading:focus::after, .button.is-black.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #0a0a0a #0a0a0a !important; }\\n      .button.is-black.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-black.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: white;\\n        box-shadow: none;\\n        color: white; }\\n  .button.is-light {\\n    background-color: whitesmoke;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n    .button.is-light:hover, .button.is-light.is-hovered {\\n      background-color: #eeeeee;\\n      border-color: transparent;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .button.is-light:focus, .button.is-light.is-focused {\\n      border-color: transparent;\\n      color: rgba(0, 0, 0, 0.7); }\\n      .button.is-light:focus:not(:active), .button.is-light.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(245, 245, 245, 0.25); }\\n    .button.is-light:active, .button.is-light.is-active {\\n      background-color: #e8e8e8;\\n      border-color: transparent;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .button.is-light[disabled],\\n    fieldset[disabled] .button.is-light {\\n      background-color: whitesmoke;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-light.is-inverted {\\n      background-color: rgba(0, 0, 0, 0.7);\\n      color: whitesmoke; }\\n      .button.is-light.is-inverted:hover, .button.is-light.is-inverted.is-hovered {\\n        background-color: rgba(0, 0, 0, 0.7); }\\n      .button.is-light.is-inverted[disabled],\\n      fieldset[disabled] .button.is-light.is-inverted {\\n        background-color: rgba(0, 0, 0, 0.7);\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: whitesmoke; }\\n    .button.is-light.is-loading::after {\\n      border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important; }\\n    .button.is-light.is-outlined {\\n      background-color: transparent;\\n      border-color: whitesmoke;\\n      color: whitesmoke; }\\n      .button.is-light.is-outlined:hover, .button.is-light.is-outlined.is-hovered, .button.is-light.is-outlined:focus, .button.is-light.is-outlined.is-focused {\\n        background-color: whitesmoke;\\n        border-color: whitesmoke;\\n        color: rgba(0, 0, 0, 0.7); }\\n      .button.is-light.is-outlined.is-loading::after {\\n        border-color: transparent transparent whitesmoke whitesmoke !important; }\\n      .button.is-light.is-outlined.is-loading:hover::after, .button.is-light.is-outlined.is-loading.is-hovered::after, .button.is-light.is-outlined.is-loading:focus::after, .button.is-light.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important; }\\n      .button.is-light.is-outlined[disabled],\\n      fieldset[disabled] .button.is-light.is-outlined {\\n        background-color: transparent;\\n        border-color: whitesmoke;\\n        box-shadow: none;\\n        color: whitesmoke; }\\n    .button.is-light.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: rgba(0, 0, 0, 0.7);\\n      color: rgba(0, 0, 0, 0.7); }\\n      .button.is-light.is-inverted.is-outlined:hover, .button.is-light.is-inverted.is-outlined.is-hovered, .button.is-light.is-inverted.is-outlined:focus, .button.is-light.is-inverted.is-outlined.is-focused {\\n        background-color: rgba(0, 0, 0, 0.7);\\n        color: whitesmoke; }\\n      .button.is-light.is-inverted.is-outlined.is-loading:hover::after, .button.is-light.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-light.is-inverted.is-outlined.is-loading:focus::after, .button.is-light.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent whitesmoke whitesmoke !important; }\\n      .button.is-light.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-light.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: rgba(0, 0, 0, 0.7);\\n        box-shadow: none;\\n        color: rgba(0, 0, 0, 0.7); }\\n  .button.is-dark {\\n    background-color: #363636;\\n    border-color: transparent;\\n    color: #fff; }\\n    .button.is-dark:hover, .button.is-dark.is-hovered {\\n      background-color: #2f2f2f;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-dark:focus, .button.is-dark.is-focused {\\n      border-color: transparent;\\n      color: #fff; }\\n      .button.is-dark:focus:not(:active), .button.is-dark.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25); }\\n    .button.is-dark:active, .button.is-dark.is-active {\\n      background-color: #292929;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-dark[disabled],\\n    fieldset[disabled] .button.is-dark {\\n      background-color: #363636;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-dark.is-inverted {\\n      background-color: #fff;\\n      color: #363636; }\\n      .button.is-dark.is-inverted:hover, .button.is-dark.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-dark.is-inverted[disabled],\\n      fieldset[disabled] .button.is-dark.is-inverted {\\n        background-color: #fff;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #363636; }\\n    .button.is-dark.is-loading::after {\\n      border-color: transparent transparent #fff #fff !important; }\\n    .button.is-dark.is-outlined {\\n      background-color: transparent;\\n      border-color: #363636;\\n      color: #363636; }\\n      .button.is-dark.is-outlined:hover, .button.is-dark.is-outlined.is-hovered, .button.is-dark.is-outlined:focus, .button.is-dark.is-outlined.is-focused {\\n        background-color: #363636;\\n        border-color: #363636;\\n        color: #fff; }\\n      .button.is-dark.is-outlined.is-loading::after {\\n        border-color: transparent transparent #363636 #363636 !important; }\\n      .button.is-dark.is-outlined.is-loading:hover::after, .button.is-dark.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-outlined.is-loading:focus::after, .button.is-dark.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #fff #fff !important; }\\n      .button.is-dark.is-outlined[disabled],\\n      fieldset[disabled] .button.is-dark.is-outlined {\\n        background-color: transparent;\\n        border-color: #363636;\\n        box-shadow: none;\\n        color: #363636; }\\n    .button.is-dark.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #fff;\\n      color: #fff; }\\n      .button.is-dark.is-inverted.is-outlined:hover, .button.is-dark.is-inverted.is-outlined.is-hovered, .button.is-dark.is-inverted.is-outlined:focus, .button.is-dark.is-inverted.is-outlined.is-focused {\\n        background-color: #fff;\\n        color: #363636; }\\n      .button.is-dark.is-inverted.is-outlined.is-loading:hover::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-inverted.is-outlined.is-loading:focus::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #363636 #363636 !important; }\\n      .button.is-dark.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-dark.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #fff;\\n        box-shadow: none;\\n        color: #fff; }\\n  .button.is-primary {\\n    background-color: #8A4D76;\\n    border-color: transparent;\\n    color: #fff; }\\n    .button.is-primary:hover, .button.is-primary.is-hovered {\\n      background-color: #82486f;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-primary:focus, .button.is-primary.is-focused {\\n      border-color: transparent;\\n      color: #fff; }\\n      .button.is-primary:focus:not(:active), .button.is-primary.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(138, 77, 118, 0.25); }\\n    .button.is-primary:active, .button.is-primary.is-active {\\n      background-color: #7a4468;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-primary[disabled],\\n    fieldset[disabled] .button.is-primary {\\n      background-color: #8A4D76;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-primary.is-inverted {\\n      background-color: #fff;\\n      color: #8A4D76; }\\n      .button.is-primary.is-inverted:hover, .button.is-primary.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-primary.is-inverted[disabled],\\n      fieldset[disabled] .button.is-primary.is-inverted {\\n        background-color: #fff;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #8A4D76; }\\n    .button.is-primary.is-loading::after {\\n      border-color: transparent transparent #fff #fff !important; }\\n    .button.is-primary.is-outlined {\\n      background-color: transparent;\\n      border-color: #8A4D76;\\n      color: #8A4D76; }\\n      .button.is-primary.is-outlined:hover, .button.is-primary.is-outlined.is-hovered, .button.is-primary.is-outlined:focus, .button.is-primary.is-outlined.is-focused {\\n        background-color: #8A4D76;\\n        border-color: #8A4D76;\\n        color: #fff; }\\n      .button.is-primary.is-outlined.is-loading::after {\\n        border-color: transparent transparent #8A4D76 #8A4D76 !important; }\\n      .button.is-primary.is-outlined.is-loading:hover::after, .button.is-primary.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-outlined.is-loading:focus::after, .button.is-primary.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #fff #fff !important; }\\n      .button.is-primary.is-outlined[disabled],\\n      fieldset[disabled] .button.is-primary.is-outlined {\\n        background-color: transparent;\\n        border-color: #8A4D76;\\n        box-shadow: none;\\n        color: #8A4D76; }\\n    .button.is-primary.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #fff;\\n      color: #fff; }\\n      .button.is-primary.is-inverted.is-outlined:hover, .button.is-primary.is-inverted.is-outlined.is-hovered, .button.is-primary.is-inverted.is-outlined:focus, .button.is-primary.is-inverted.is-outlined.is-focused {\\n        background-color: #fff;\\n        color: #8A4D76; }\\n      .button.is-primary.is-inverted.is-outlined.is-loading:hover::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-inverted.is-outlined.is-loading:focus::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #8A4D76 #8A4D76 !important; }\\n      .button.is-primary.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-primary.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #fff;\\n        box-shadow: none;\\n        color: #fff; }\\n    .button.is-primary.is-light {\\n      background-color: #f8f2f6;\\n      color: #9d5886; }\\n      .button.is-primary.is-light:hover, .button.is-primary.is-light.is-hovered {\\n        background-color: #f3eaf0;\\n        border-color: transparent;\\n        color: #9d5886; }\\n      .button.is-primary.is-light:active, .button.is-primary.is-light.is-active {\\n        background-color: #efe2ea;\\n        border-color: transparent;\\n        color: #9d5886; }\\n  .button.is-link {\\n    background-color: blue;\\n    border-color: transparent;\\n    color: #fff; }\\n    .button.is-link:hover, .button.is-link.is-hovered {\\n      background-color: #0000f2;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-link:focus, .button.is-link.is-focused {\\n      border-color: transparent;\\n      color: #fff; }\\n      .button.is-link:focus:not(:active), .button.is-link.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(0, 0, 255, 0.25); }\\n    .button.is-link:active, .button.is-link.is-active {\\n      background-color: #0000e6;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-link[disabled],\\n    fieldset[disabled] .button.is-link {\\n      background-color: blue;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-link.is-inverted {\\n      background-color: #fff;\\n      color: blue; }\\n      .button.is-link.is-inverted:hover, .button.is-link.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-link.is-inverted[disabled],\\n      fieldset[disabled] .button.is-link.is-inverted {\\n        background-color: #fff;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: blue; }\\n    .button.is-link.is-loading::after {\\n      border-color: transparent transparent #fff #fff !important; }\\n    .button.is-link.is-outlined {\\n      background-color: transparent;\\n      border-color: blue;\\n      color: blue; }\\n      .button.is-link.is-outlined:hover, .button.is-link.is-outlined.is-hovered, .button.is-link.is-outlined:focus, .button.is-link.is-outlined.is-focused {\\n        background-color: blue;\\n        border-color: blue;\\n        color: #fff; }\\n      .button.is-link.is-outlined.is-loading::after {\\n        border-color: transparent transparent blue blue !important; }\\n      .button.is-link.is-outlined.is-loading:hover::after, .button.is-link.is-outlined.is-loading.is-hovered::after, .button.is-link.is-outlined.is-loading:focus::after, .button.is-link.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #fff #fff !important; }\\n      .button.is-link.is-outlined[disabled],\\n      fieldset[disabled] .button.is-link.is-outlined {\\n        background-color: transparent;\\n        border-color: blue;\\n        box-shadow: none;\\n        color: blue; }\\n    .button.is-link.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #fff;\\n      color: #fff; }\\n      .button.is-link.is-inverted.is-outlined:hover, .button.is-link.is-inverted.is-outlined.is-hovered, .button.is-link.is-inverted.is-outlined:focus, .button.is-link.is-inverted.is-outlined.is-focused {\\n        background-color: #fff;\\n        color: blue; }\\n      .button.is-link.is-inverted.is-outlined.is-loading:hover::after, .button.is-link.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-link.is-inverted.is-outlined.is-loading:focus::after, .button.is-link.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent blue blue !important; }\\n      .button.is-link.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-link.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #fff;\\n        box-shadow: none;\\n        color: #fff; }\\n    .button.is-link.is-light {\\n      background-color: #ebebff;\\n      color: #0f0fff; }\\n      .button.is-link.is-light:hover, .button.is-link.is-light.is-hovered {\\n        background-color: #dedeff;\\n        border-color: transparent;\\n        color: #0f0fff; }\\n      .button.is-link.is-light:active, .button.is-link.is-light.is-active {\\n        background-color: #d1d1ff;\\n        border-color: transparent;\\n        color: #0f0fff; }\\n  .button.is-info {\\n    background-color: #3298dc;\\n    border-color: transparent;\\n    color: #fff; }\\n    .button.is-info:hover, .button.is-info.is-hovered {\\n      background-color: #2793da;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-info:focus, .button.is-info.is-focused {\\n      border-color: transparent;\\n      color: #fff; }\\n      .button.is-info:focus:not(:active), .button.is-info.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(50, 152, 220, 0.25); }\\n    .button.is-info:active, .button.is-info.is-active {\\n      background-color: #238cd1;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-info[disabled],\\n    fieldset[disabled] .button.is-info {\\n      background-color: #3298dc;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-info.is-inverted {\\n      background-color: #fff;\\n      color: #3298dc; }\\n      .button.is-info.is-inverted:hover, .button.is-info.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-info.is-inverted[disabled],\\n      fieldset[disabled] .button.is-info.is-inverted {\\n        background-color: #fff;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #3298dc; }\\n    .button.is-info.is-loading::after {\\n      border-color: transparent transparent #fff #fff !important; }\\n    .button.is-info.is-outlined {\\n      background-color: transparent;\\n      border-color: #3298dc;\\n      color: #3298dc; }\\n      .button.is-info.is-outlined:hover, .button.is-info.is-outlined.is-hovered, .button.is-info.is-outlined:focus, .button.is-info.is-outlined.is-focused {\\n        background-color: #3298dc;\\n        border-color: #3298dc;\\n        color: #fff; }\\n      .button.is-info.is-outlined.is-loading::after {\\n        border-color: transparent transparent #3298dc #3298dc !important; }\\n      .button.is-info.is-outlined.is-loading:hover::after, .button.is-info.is-outlined.is-loading.is-hovered::after, .button.is-info.is-outlined.is-loading:focus::after, .button.is-info.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #fff #fff !important; }\\n      .button.is-info.is-outlined[disabled],\\n      fieldset[disabled] .button.is-info.is-outlined {\\n        background-color: transparent;\\n        border-color: #3298dc;\\n        box-shadow: none;\\n        color: #3298dc; }\\n    .button.is-info.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #fff;\\n      color: #fff; }\\n      .button.is-info.is-inverted.is-outlined:hover, .button.is-info.is-inverted.is-outlined.is-hovered, .button.is-info.is-inverted.is-outlined:focus, .button.is-info.is-inverted.is-outlined.is-focused {\\n        background-color: #fff;\\n        color: #3298dc; }\\n      .button.is-info.is-inverted.is-outlined.is-loading:hover::after, .button.is-info.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-info.is-inverted.is-outlined.is-loading:focus::after, .button.is-info.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #3298dc #3298dc !important; }\\n      .button.is-info.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-info.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #fff;\\n        box-shadow: none;\\n        color: #fff; }\\n    .button.is-info.is-light {\\n      background-color: #eef6fc;\\n      color: #1d72aa; }\\n      .button.is-info.is-light:hover, .button.is-info.is-light.is-hovered {\\n        background-color: #e3f1fa;\\n        border-color: transparent;\\n        color: #1d72aa; }\\n      .button.is-info.is-light:active, .button.is-info.is-light.is-active {\\n        background-color: #d8ebf8;\\n        border-color: transparent;\\n        color: #1d72aa; }\\n  .button.is-success {\\n    background-color: #48c774;\\n    border-color: transparent;\\n    color: #fff; }\\n    .button.is-success:hover, .button.is-success.is-hovered {\\n      background-color: #3ec46d;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-success:focus, .button.is-success.is-focused {\\n      border-color: transparent;\\n      color: #fff; }\\n      .button.is-success:focus:not(:active), .button.is-success.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(72, 199, 116, 0.25); }\\n    .button.is-success:active, .button.is-success.is-active {\\n      background-color: #3abb67;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-success[disabled],\\n    fieldset[disabled] .button.is-success {\\n      background-color: #48c774;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-success.is-inverted {\\n      background-color: #fff;\\n      color: #48c774; }\\n      .button.is-success.is-inverted:hover, .button.is-success.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-success.is-inverted[disabled],\\n      fieldset[disabled] .button.is-success.is-inverted {\\n        background-color: #fff;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #48c774; }\\n    .button.is-success.is-loading::after {\\n      border-color: transparent transparent #fff #fff !important; }\\n    .button.is-success.is-outlined {\\n      background-color: transparent;\\n      border-color: #48c774;\\n      color: #48c774; }\\n      .button.is-success.is-outlined:hover, .button.is-success.is-outlined.is-hovered, .button.is-success.is-outlined:focus, .button.is-success.is-outlined.is-focused {\\n        background-color: #48c774;\\n        border-color: #48c774;\\n        color: #fff; }\\n      .button.is-success.is-outlined.is-loading::after {\\n        border-color: transparent transparent #48c774 #48c774 !important; }\\n      .button.is-success.is-outlined.is-loading:hover::after, .button.is-success.is-outlined.is-loading.is-hovered::after, .button.is-success.is-outlined.is-loading:focus::after, .button.is-success.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #fff #fff !important; }\\n      .button.is-success.is-outlined[disabled],\\n      fieldset[disabled] .button.is-success.is-outlined {\\n        background-color: transparent;\\n        border-color: #48c774;\\n        box-shadow: none;\\n        color: #48c774; }\\n    .button.is-success.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #fff;\\n      color: #fff; }\\n      .button.is-success.is-inverted.is-outlined:hover, .button.is-success.is-inverted.is-outlined.is-hovered, .button.is-success.is-inverted.is-outlined:focus, .button.is-success.is-inverted.is-outlined.is-focused {\\n        background-color: #fff;\\n        color: #48c774; }\\n      .button.is-success.is-inverted.is-outlined.is-loading:hover::after, .button.is-success.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-success.is-inverted.is-outlined.is-loading:focus::after, .button.is-success.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #48c774 #48c774 !important; }\\n      .button.is-success.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-success.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #fff;\\n        box-shadow: none;\\n        color: #fff; }\\n    .button.is-success.is-light {\\n      background-color: #effaf3;\\n      color: #257942; }\\n      .button.is-success.is-light:hover, .button.is-success.is-light.is-hovered {\\n        background-color: #e6f7ec;\\n        border-color: transparent;\\n        color: #257942; }\\n      .button.is-success.is-light:active, .button.is-success.is-light.is-active {\\n        background-color: #dcf4e4;\\n        border-color: transparent;\\n        color: #257942; }\\n  .button.is-warning {\\n    background-color: #ffdd57;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n    .button.is-warning:hover, .button.is-warning.is-hovered {\\n      background-color: #ffdb4a;\\n      border-color: transparent;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .button.is-warning:focus, .button.is-warning.is-focused {\\n      border-color: transparent;\\n      color: rgba(0, 0, 0, 0.7); }\\n      .button.is-warning:focus:not(:active), .button.is-warning.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(255, 221, 87, 0.25); }\\n    .button.is-warning:active, .button.is-warning.is-active {\\n      background-color: #ffd83d;\\n      border-color: transparent;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .button.is-warning[disabled],\\n    fieldset[disabled] .button.is-warning {\\n      background-color: #ffdd57;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-warning.is-inverted {\\n      background-color: rgba(0, 0, 0, 0.7);\\n      color: #ffdd57; }\\n      .button.is-warning.is-inverted:hover, .button.is-warning.is-inverted.is-hovered {\\n        background-color: rgba(0, 0, 0, 0.7); }\\n      .button.is-warning.is-inverted[disabled],\\n      fieldset[disabled] .button.is-warning.is-inverted {\\n        background-color: rgba(0, 0, 0, 0.7);\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #ffdd57; }\\n    .button.is-warning.is-loading::after {\\n      border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important; }\\n    .button.is-warning.is-outlined {\\n      background-color: transparent;\\n      border-color: #ffdd57;\\n      color: #ffdd57; }\\n      .button.is-warning.is-outlined:hover, .button.is-warning.is-outlined.is-hovered, .button.is-warning.is-outlined:focus, .button.is-warning.is-outlined.is-focused {\\n        background-color: #ffdd57;\\n        border-color: #ffdd57;\\n        color: rgba(0, 0, 0, 0.7); }\\n      .button.is-warning.is-outlined.is-loading::after {\\n        border-color: transparent transparent #ffdd57 #ffdd57 !important; }\\n      .button.is-warning.is-outlined.is-loading:hover::after, .button.is-warning.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-outlined.is-loading:focus::after, .button.is-warning.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important; }\\n      .button.is-warning.is-outlined[disabled],\\n      fieldset[disabled] .button.is-warning.is-outlined {\\n        background-color: transparent;\\n        border-color: #ffdd57;\\n        box-shadow: none;\\n        color: #ffdd57; }\\n    .button.is-warning.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: rgba(0, 0, 0, 0.7);\\n      color: rgba(0, 0, 0, 0.7); }\\n      .button.is-warning.is-inverted.is-outlined:hover, .button.is-warning.is-inverted.is-outlined.is-hovered, .button.is-warning.is-inverted.is-outlined:focus, .button.is-warning.is-inverted.is-outlined.is-focused {\\n        background-color: rgba(0, 0, 0, 0.7);\\n        color: #ffdd57; }\\n      .button.is-warning.is-inverted.is-outlined.is-loading:hover::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-inverted.is-outlined.is-loading:focus::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #ffdd57 #ffdd57 !important; }\\n      .button.is-warning.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-warning.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: rgba(0, 0, 0, 0.7);\\n        box-shadow: none;\\n        color: rgba(0, 0, 0, 0.7); }\\n    .button.is-warning.is-light {\\n      background-color: #fffbeb;\\n      color: #947600; }\\n      .button.is-warning.is-light:hover, .button.is-warning.is-light.is-hovered {\\n        background-color: #fff8de;\\n        border-color: transparent;\\n        color: #947600; }\\n      .button.is-warning.is-light:active, .button.is-warning.is-light.is-active {\\n        background-color: #fff6d1;\\n        border-color: transparent;\\n        color: #947600; }\\n  .button.is-danger {\\n    background-color: #f14668;\\n    border-color: transparent;\\n    color: #fff; }\\n    .button.is-danger:hover, .button.is-danger.is-hovered {\\n      background-color: #f03a5f;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-danger:focus, .button.is-danger.is-focused {\\n      border-color: transparent;\\n      color: #fff; }\\n      .button.is-danger:focus:not(:active), .button.is-danger.is-focused:not(:active) {\\n        box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25); }\\n    .button.is-danger:active, .button.is-danger.is-active {\\n      background-color: #ef2e55;\\n      border-color: transparent;\\n      color: #fff; }\\n    .button.is-danger[disabled],\\n    fieldset[disabled] .button.is-danger {\\n      background-color: #f14668;\\n      border-color: transparent;\\n      box-shadow: none; }\\n    .button.is-danger.is-inverted {\\n      background-color: #fff;\\n      color: #f14668; }\\n      .button.is-danger.is-inverted:hover, .button.is-danger.is-inverted.is-hovered {\\n        background-color: #f2f2f2; }\\n      .button.is-danger.is-inverted[disabled],\\n      fieldset[disabled] .button.is-danger.is-inverted {\\n        background-color: #fff;\\n        border-color: transparent;\\n        box-shadow: none;\\n        color: #f14668; }\\n    .button.is-danger.is-loading::after {\\n      border-color: transparent transparent #fff #fff !important; }\\n    .button.is-danger.is-outlined {\\n      background-color: transparent;\\n      border-color: #f14668;\\n      color: #f14668; }\\n      .button.is-danger.is-outlined:hover, .button.is-danger.is-outlined.is-hovered, .button.is-danger.is-outlined:focus, .button.is-danger.is-outlined.is-focused {\\n        background-color: #f14668;\\n        border-color: #f14668;\\n        color: #fff; }\\n      .button.is-danger.is-outlined.is-loading::after {\\n        border-color: transparent transparent #f14668 #f14668 !important; }\\n      .button.is-danger.is-outlined.is-loading:hover::after, .button.is-danger.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-outlined.is-loading:focus::after, .button.is-danger.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #fff #fff !important; }\\n      .button.is-danger.is-outlined[disabled],\\n      fieldset[disabled] .button.is-danger.is-outlined {\\n        background-color: transparent;\\n        border-color: #f14668;\\n        box-shadow: none;\\n        color: #f14668; }\\n    .button.is-danger.is-inverted.is-outlined {\\n      background-color: transparent;\\n      border-color: #fff;\\n      color: #fff; }\\n      .button.is-danger.is-inverted.is-outlined:hover, .button.is-danger.is-inverted.is-outlined.is-hovered, .button.is-danger.is-inverted.is-outlined:focus, .button.is-danger.is-inverted.is-outlined.is-focused {\\n        background-color: #fff;\\n        color: #f14668; }\\n      .button.is-danger.is-inverted.is-outlined.is-loading:hover::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-inverted.is-outlined.is-loading:focus::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-focused::after {\\n        border-color: transparent transparent #f14668 #f14668 !important; }\\n      .button.is-danger.is-inverted.is-outlined[disabled],\\n      fieldset[disabled] .button.is-danger.is-inverted.is-outlined {\\n        background-color: transparent;\\n        border-color: #fff;\\n        box-shadow: none;\\n        color: #fff; }\\n    .button.is-danger.is-light {\\n      background-color: #feecf0;\\n      color: #cc0f35; }\\n      .button.is-danger.is-light:hover, .button.is-danger.is-light.is-hovered {\\n        background-color: #fde0e6;\\n        border-color: transparent;\\n        color: #cc0f35; }\\n      .button.is-danger.is-light:active, .button.is-danger.is-light.is-active {\\n        background-color: #fcd4dc;\\n        border-color: transparent;\\n        color: #cc0f35; }\\n  .button.is-small {\\n    border-radius: 2px;\\n    font-size: 0.75rem; }\\n  .button.is-normal {\\n    font-size: 1rem; }\\n  .button.is-medium {\\n    font-size: 1.25rem; }\\n  .button.is-large {\\n    font-size: 1.5rem; }\\n  .button[disabled],\\n  fieldset[disabled] .button {\\n    background-color: white;\\n    border-color: #dbdbdb;\\n    box-shadow: none;\\n    opacity: 0.5; }\\n  .button.is-fullwidth {\\n    display: flex;\\n    width: 100%; }\\n  .button.is-loading {\\n    color: transparent !important;\\n    pointer-events: none; }\\n    .button.is-loading::after {\\n      position: absolute;\\n      left: calc(50% - (1em / 2));\\n      top: calc(50% - (1em / 2));\\n      position: absolute !important; }\\n  .button.is-static {\\n    background-color: whitesmoke;\\n    border-color: #dbdbdb;\\n    color: #7a7a7a;\\n    box-shadow: none;\\n    pointer-events: none; }\\n  .button.is-rounded {\\n    border-radius: 290486px;\\n    padding-left: calc(1em + 0.25em);\\n    padding-right: calc(1em + 0.25em); }\\n\\n.buttons {\\n  align-items: center;\\n  display: flex;\\n  flex-wrap: wrap;\\n  justify-content: flex-start; }\\n  .buttons .button {\\n    margin-bottom: 0.5rem; }\\n    .buttons .button:not(:last-child):not(.is-fullwidth) {\\n      margin-right: 0.5rem; }\\n  .buttons:last-child {\\n    margin-bottom: -0.5rem; }\\n  .buttons:not(:last-child) {\\n    margin-bottom: 1rem; }\\n  .buttons.are-small .button:not(.is-normal):not(.is-medium):not(.is-large) {\\n    border-radius: 2px;\\n    font-size: 0.75rem; }\\n  .buttons.are-medium .button:not(.is-small):not(.is-normal):not(.is-large) {\\n    font-size: 1.25rem; }\\n  .buttons.are-large .button:not(.is-small):not(.is-normal):not(.is-medium) {\\n    font-size: 1.5rem; }\\n  .buttons.has-addons .button:not(:first-child) {\\n    border-bottom-left-radius: 0;\\n    border-top-left-radius: 0; }\\n  .buttons.has-addons .button:not(:last-child) {\\n    border-bottom-right-radius: 0;\\n    border-top-right-radius: 0;\\n    margin-right: -1px; }\\n  .buttons.has-addons .button:last-child {\\n    margin-right: 0; }\\n  .buttons.has-addons .button:hover, .buttons.has-addons .button.is-hovered {\\n    z-index: 2; }\\n  .buttons.has-addons .button:focus, .buttons.has-addons .button.is-focused, .buttons.has-addons .button:active, .buttons.has-addons .button.is-active, .buttons.has-addons .button.is-selected {\\n    z-index: 3; }\\n    .buttons.has-addons .button:focus:hover, .buttons.has-addons .button.is-focused:hover, .buttons.has-addons .button:active:hover, .buttons.has-addons .button.is-active:hover, .buttons.has-addons .button.is-selected:hover {\\n      z-index: 4; }\\n  .buttons.has-addons .button.is-expanded {\\n    flex-grow: 1;\\n    flex-shrink: 1; }\\n  .buttons.is-centered {\\n    justify-content: center; }\\n    .buttons.is-centered:not(.has-addons) .button:not(.is-fullwidth) {\\n      margin-left: 0.25rem;\\n      margin-right: 0.25rem; }\\n  .buttons.is-right {\\n    justify-content: flex-end; }\\n    .buttons.is-right:not(.has-addons) .button:not(.is-fullwidth) {\\n      margin-left: 0.25rem;\\n      margin-right: 0.25rem; }\\n\\n.container {\\n  flex-grow: 1;\\n  margin: 0 auto;\\n  position: relative;\\n  width: auto; }\\n  .container.is-fluid {\\n    max-width: none;\\n    padding-left: 32px;\\n    padding-right: 32px;\\n    width: 100%; }\\n  @media screen and (min-width: 1024px) {\\n    .container {\\n      max-width: 960px; } }\\n\\n.title,\\n.subtitle {\\n  word-break: break-word; }\\n  .title em,\\n  .title span,\\n  .subtitle em,\\n  .subtitle span {\\n    font-weight: inherit; }\\n  .title sub,\\n  .subtitle sub {\\n    font-size: 0.75em; }\\n  .title sup,\\n  .subtitle sup {\\n    font-size: 0.75em; }\\n  .title .tag,\\n  .subtitle .tag {\\n    vertical-align: middle; }\\n\\n.title {\\n  color: #363636;\\n  font-size: 2rem;\\n  font-weight: 600;\\n  line-height: 1.125; }\\n  .title strong {\\n    color: inherit;\\n    font-weight: inherit; }\\n  .title + .highlight {\\n    margin-top: -0.75rem; }\\n  .title:not(.is-spaced) + .subtitle {\\n    margin-top: -1.25rem; }\\n  .title.is-1 {\\n    font-size: 3rem; }\\n  .title.is-2 {\\n    font-size: 2.5rem; }\\n  .title.is-3 {\\n    font-size: 2rem; }\\n  .title.is-4 {\\n    font-size: 1.5rem; }\\n  .title.is-5 {\\n    font-size: 1.25rem; }\\n  .title.is-6 {\\n    font-size: 1rem; }\\n  .title.is-7 {\\n    font-size: 0.75rem; }\\n\\n.subtitle {\\n  color: #757763;\\n  font-size: 1.25rem;\\n  font-weight: 400;\\n  line-height: 1.25; }\\n  .subtitle strong {\\n    color: #363636;\\n    font-weight: 600; }\\n  .subtitle:not(.is-spaced) + .title {\\n    margin-top: -1.25rem; }\\n  .subtitle.is-1 {\\n    font-size: 3rem; }\\n  .subtitle.is-2 {\\n    font-size: 2.5rem; }\\n  .subtitle.is-3 {\\n    font-size: 2rem; }\\n  .subtitle.is-4 {\\n    font-size: 1.5rem; }\\n  .subtitle.is-5 {\\n    font-size: 1.25rem; }\\n  .subtitle.is-6 {\\n    font-size: 1rem; }\\n  .subtitle.is-7 {\\n    font-size: 0.75rem; }\\n\\n.input, .textarea, .select select {\\n  background-color: white;\\n  border-color: transparent;\\n  border-radius: 4px;\\n  color: #363636; }\\n  .input::-moz-placeholder, .textarea::-moz-placeholder, .select select::-moz-placeholder {\\n    color: rgba(54, 54, 54, 0.3); }\\n  .input::-webkit-input-placeholder, .textarea::-webkit-input-placeholder, .select select::-webkit-input-placeholder {\\n    color: rgba(54, 54, 54, 0.3); }\\n  .input:-moz-placeholder, .textarea:-moz-placeholder, .select select:-moz-placeholder {\\n    color: rgba(54, 54, 54, 0.3); }\\n  .input:-ms-input-placeholder, .textarea:-ms-input-placeholder, .select select:-ms-input-placeholder {\\n    color: rgba(54, 54, 54, 0.3); }\\n  .input:hover, .textarea:hover, .select select:hover, .is-hovered.input, .is-hovered.textarea, .select select.is-hovered {\\n    border-color: #D0D1CD; }\\n  .input:focus, .textarea:focus, .select select:focus, .is-focused.input, .is-focused.textarea, .select select.is-focused, .input:active, .textarea:active, .select select:active, .is-active.input, .is-active.textarea, .select select.is-active {\\n    border-color: blue;\\n    box-shadow: 0 0 0 0.125em rgba(0, 0, 255, 0.25); }\\n  .input[disabled], .textarea[disabled], .select select[disabled],\\n  fieldset[disabled] .input,\\n  fieldset[disabled] .textarea,\\n  fieldset[disabled] .select select,\\n  .select fieldset[disabled] select {\\n    background-color: whitesmoke;\\n    border-color: whitesmoke;\\n    box-shadow: none;\\n    color: #7a7a7a; }\\n    .input[disabled]::-moz-placeholder, .textarea[disabled]::-moz-placeholder, .select select[disabled]::-moz-placeholder,\\n    fieldset[disabled] .input::-moz-placeholder,\\n    fieldset[disabled] .textarea::-moz-placeholder,\\n    fieldset[disabled] .select select::-moz-placeholder,\\n    .select fieldset[disabled] select::-moz-placeholder {\\n      color: rgba(122, 122, 122, 0.3); }\\n    .input[disabled]::-webkit-input-placeholder, .textarea[disabled]::-webkit-input-placeholder, .select select[disabled]::-webkit-input-placeholder,\\n    fieldset[disabled] .input::-webkit-input-placeholder,\\n    fieldset[disabled] .textarea::-webkit-input-placeholder,\\n    fieldset[disabled] .select select::-webkit-input-placeholder,\\n    .select fieldset[disabled] select::-webkit-input-placeholder {\\n      color: rgba(122, 122, 122, 0.3); }\\n    .input[disabled]:-moz-placeholder, .textarea[disabled]:-moz-placeholder, .select select[disabled]:-moz-placeholder,\\n    fieldset[disabled] .input:-moz-placeholder,\\n    fieldset[disabled] .textarea:-moz-placeholder,\\n    fieldset[disabled] .select select:-moz-placeholder,\\n    .select fieldset[disabled] select:-moz-placeholder {\\n      color: rgba(122, 122, 122, 0.3); }\\n    .input[disabled]:-ms-input-placeholder, .textarea[disabled]:-ms-input-placeholder, .select select[disabled]:-ms-input-placeholder,\\n    fieldset[disabled] .input:-ms-input-placeholder,\\n    fieldset[disabled] .textarea:-ms-input-placeholder,\\n    fieldset[disabled] .select select:-ms-input-placeholder,\\n    .select fieldset[disabled] select:-ms-input-placeholder {\\n      color: rgba(122, 122, 122, 0.3); }\\n\\n.input, .textarea {\\n  box-shadow: none;\\n  max-width: 100%;\\n  width: 100%; }\\n  .input[readonly], .textarea[readonly] {\\n    box-shadow: none; }\\n  .is-white.input, .is-white.textarea {\\n    border-color: white; }\\n    .is-white.input:focus, .is-white.textarea:focus, .is-white.is-focused.input, .is-white.is-focused.textarea, .is-white.input:active, .is-white.textarea:active, .is-white.is-active.input, .is-white.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.25); }\\n  .is-black.input, .is-black.textarea {\\n    border-color: #0a0a0a; }\\n    .is-black.input:focus, .is-black.textarea:focus, .is-black.is-focused.input, .is-black.is-focused.textarea, .is-black.input:active, .is-black.textarea:active, .is-black.is-active.input, .is-black.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25); }\\n  .is-light.input, .is-light.textarea {\\n    border-color: whitesmoke; }\\n    .is-light.input:focus, .is-light.textarea:focus, .is-light.is-focused.input, .is-light.is-focused.textarea, .is-light.input:active, .is-light.textarea:active, .is-light.is-active.input, .is-light.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(245, 245, 245, 0.25); }\\n  .is-dark.input, .is-dark.textarea {\\n    border-color: #363636; }\\n    .is-dark.input:focus, .is-dark.textarea:focus, .is-dark.is-focused.input, .is-dark.is-focused.textarea, .is-dark.input:active, .is-dark.textarea:active, .is-dark.is-active.input, .is-dark.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25); }\\n  .is-primary.input, .is-primary.textarea {\\n    border-color: #8A4D76; }\\n    .is-primary.input:focus, .is-primary.textarea:focus, .is-primary.is-focused.input, .is-primary.is-focused.textarea, .is-primary.input:active, .is-primary.textarea:active, .is-primary.is-active.input, .is-primary.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(138, 77, 118, 0.25); }\\n  .is-link.input, .is-link.textarea {\\n    border-color: blue; }\\n    .is-link.input:focus, .is-link.textarea:focus, .is-link.is-focused.input, .is-link.is-focused.textarea, .is-link.input:active, .is-link.textarea:active, .is-link.is-active.input, .is-link.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(0, 0, 255, 0.25); }\\n  .is-info.input, .is-info.textarea {\\n    border-color: #3298dc; }\\n    .is-info.input:focus, .is-info.textarea:focus, .is-info.is-focused.input, .is-info.is-focused.textarea, .is-info.input:active, .is-info.textarea:active, .is-info.is-active.input, .is-info.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(50, 152, 220, 0.25); }\\n  .is-success.input, .is-success.textarea {\\n    border-color: #48c774; }\\n    .is-success.input:focus, .is-success.textarea:focus, .is-success.is-focused.input, .is-success.is-focused.textarea, .is-success.input:active, .is-success.textarea:active, .is-success.is-active.input, .is-success.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(72, 199, 116, 0.25); }\\n  .is-warning.input, .is-warning.textarea {\\n    border-color: #ffdd57; }\\n    .is-warning.input:focus, .is-warning.textarea:focus, .is-warning.is-focused.input, .is-warning.is-focused.textarea, .is-warning.input:active, .is-warning.textarea:active, .is-warning.is-active.input, .is-warning.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(255, 221, 87, 0.25); }\\n  .is-danger.input, .is-danger.textarea {\\n    border-color: #f14668; }\\n    .is-danger.input:focus, .is-danger.textarea:focus, .is-danger.is-focused.input, .is-danger.is-focused.textarea, .is-danger.input:active, .is-danger.textarea:active, .is-danger.is-active.input, .is-danger.is-active.textarea {\\n      box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25); }\\n  .is-small.input, .is-small.textarea {\\n    border-radius: 2px;\\n    font-size: 0.75rem; }\\n  .is-medium.input, .is-medium.textarea {\\n    font-size: 1.25rem; }\\n  .is-large.input, .is-large.textarea {\\n    font-size: 1.5rem; }\\n  .is-fullwidth.input, .is-fullwidth.textarea {\\n    display: block;\\n    width: 100%; }\\n  .is-inline.input, .is-inline.textarea {\\n    display: inline;\\n    width: auto; }\\n\\n.input.is-rounded {\\n  border-radius: 290486px;\\n  padding-left: calc(calc(0.75em - 2px) + 0.375em);\\n  padding-right: calc(calc(0.75em - 2px) + 0.375em); }\\n\\n.input.is-static {\\n  background-color: transparent;\\n  border-color: transparent;\\n  box-shadow: none;\\n  padding-left: 0;\\n  padding-right: 0; }\\n\\n.textarea {\\n  display: block;\\n  max-width: 100%;\\n  min-width: 100%;\\n  padding: calc(0.75em - 2px);\\n  resize: vertical; }\\n  .textarea:not([rows]) {\\n    max-height: 40em;\\n    min-height: 8em; }\\n  .textarea[rows] {\\n    height: initial; }\\n  .textarea.has-fixed-size {\\n    resize: none; }\\n\\n.checkbox, .radio {\\n  cursor: pointer;\\n  display: inline-block;\\n  line-height: 1.25;\\n  position: relative; }\\n  .checkbox input, .radio input {\\n    cursor: pointer; }\\n  .checkbox:hover, .radio:hover {\\n    color: #363636; }\\n  .checkbox[disabled], .radio[disabled],\\n  fieldset[disabled] .checkbox,\\n  fieldset[disabled] .radio {\\n    color: #7a7a7a;\\n    cursor: not-allowed; }\\n\\n.radio + .radio {\\n  margin-left: 0.5em; }\\n\\n.select {\\n  display: inline-block;\\n  max-width: 100%;\\n  position: relative;\\n  vertical-align: top; }\\n  .select:not(.is-multiple) {\\n    height: 2.5em; }\\n  .select:not(.is-multiple):not(.is-loading)::after {\\n    border-color: blue;\\n    right: 1.125em;\\n    z-index: 4; }\\n  .select.is-rounded select {\\n    border-radius: 290486px;\\n    padding-left: 1em; }\\n  .select select {\\n    cursor: pointer;\\n    display: block;\\n    font-size: 1em;\\n    max-width: 100%;\\n    outline: none; }\\n    .select select::-ms-expand {\\n      display: none; }\\n    .select select[disabled]:hover,\\n    fieldset[disabled] .select select:hover {\\n      border-color: whitesmoke; }\\n    .select select:not([multiple]) {\\n      padding-right: 2.5em; }\\n    .select select[multiple] {\\n      height: auto;\\n      padding: 0; }\\n      .select select[multiple] option {\\n        padding: 0.5em 1em; }\\n  .select:not(.is-multiple):not(.is-loading):hover::after {\\n    border-color: #363636; }\\n  .select.is-white:not(:hover)::after {\\n    border-color: white; }\\n  .select.is-white select {\\n    border-color: white; }\\n    .select.is-white select:hover, .select.is-white select.is-hovered {\\n      border-color: #f2f2f2; }\\n    .select.is-white select:focus, .select.is-white select.is-focused, .select.is-white select:active, .select.is-white select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.25); }\\n  .select.is-black:not(:hover)::after {\\n    border-color: #0a0a0a; }\\n  .select.is-black select {\\n    border-color: #0a0a0a; }\\n    .select.is-black select:hover, .select.is-black select.is-hovered {\\n      border-color: black; }\\n    .select.is-black select:focus, .select.is-black select.is-focused, .select.is-black select:active, .select.is-black select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25); }\\n  .select.is-light:not(:hover)::after {\\n    border-color: whitesmoke; }\\n  .select.is-light select {\\n    border-color: whitesmoke; }\\n    .select.is-light select:hover, .select.is-light select.is-hovered {\\n      border-color: #e8e8e8; }\\n    .select.is-light select:focus, .select.is-light select.is-focused, .select.is-light select:active, .select.is-light select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(245, 245, 245, 0.25); }\\n  .select.is-dark:not(:hover)::after {\\n    border-color: #363636; }\\n  .select.is-dark select {\\n    border-color: #363636; }\\n    .select.is-dark select:hover, .select.is-dark select.is-hovered {\\n      border-color: #292929; }\\n    .select.is-dark select:focus, .select.is-dark select.is-focused, .select.is-dark select:active, .select.is-dark select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25); }\\n  .select.is-primary:not(:hover)::after {\\n    border-color: #8A4D76; }\\n  .select.is-primary select {\\n    border-color: #8A4D76; }\\n    .select.is-primary select:hover, .select.is-primary select.is-hovered {\\n      border-color: #7a4468; }\\n    .select.is-primary select:focus, .select.is-primary select.is-focused, .select.is-primary select:active, .select.is-primary select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(138, 77, 118, 0.25); }\\n  .select.is-link:not(:hover)::after {\\n    border-color: blue; }\\n  .select.is-link select {\\n    border-color: blue; }\\n    .select.is-link select:hover, .select.is-link select.is-hovered {\\n      border-color: #0000e6; }\\n    .select.is-link select:focus, .select.is-link select.is-focused, .select.is-link select:active, .select.is-link select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(0, 0, 255, 0.25); }\\n  .select.is-info:not(:hover)::after {\\n    border-color: #3298dc; }\\n  .select.is-info select {\\n    border-color: #3298dc; }\\n    .select.is-info select:hover, .select.is-info select.is-hovered {\\n      border-color: #238cd1; }\\n    .select.is-info select:focus, .select.is-info select.is-focused, .select.is-info select:active, .select.is-info select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(50, 152, 220, 0.25); }\\n  .select.is-success:not(:hover)::after {\\n    border-color: #48c774; }\\n  .select.is-success select {\\n    border-color: #48c774; }\\n    .select.is-success select:hover, .select.is-success select.is-hovered {\\n      border-color: #3abb67; }\\n    .select.is-success select:focus, .select.is-success select.is-focused, .select.is-success select:active, .select.is-success select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(72, 199, 116, 0.25); }\\n  .select.is-warning:not(:hover)::after {\\n    border-color: #ffdd57; }\\n  .select.is-warning select {\\n    border-color: #ffdd57; }\\n    .select.is-warning select:hover, .select.is-warning select.is-hovered {\\n      border-color: #ffd83d; }\\n    .select.is-warning select:focus, .select.is-warning select.is-focused, .select.is-warning select:active, .select.is-warning select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(255, 221, 87, 0.25); }\\n  .select.is-danger:not(:hover)::after {\\n    border-color: #f14668; }\\n  .select.is-danger select {\\n    border-color: #f14668; }\\n    .select.is-danger select:hover, .select.is-danger select.is-hovered {\\n      border-color: #ef2e55; }\\n    .select.is-danger select:focus, .select.is-danger select.is-focused, .select.is-danger select:active, .select.is-danger select.is-active {\\n      box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25); }\\n  .select.is-small {\\n    border-radius: 2px;\\n    font-size: 0.75rem; }\\n  .select.is-medium {\\n    font-size: 1.25rem; }\\n  .select.is-large {\\n    font-size: 1.5rem; }\\n  .select.is-disabled::after {\\n    border-color: #7a7a7a; }\\n  .select.is-fullwidth {\\n    width: 100%; }\\n    .select.is-fullwidth select {\\n      width: 100%; }\\n  .select.is-loading::after {\\n    margin-top: 0;\\n    position: absolute;\\n    right: 0.625em;\\n    top: 0.625em;\\n    transform: none; }\\n  .select.is-loading.is-small:after {\\n    font-size: 0.75rem; }\\n  .select.is-loading.is-medium:after {\\n    font-size: 1.25rem; }\\n  .select.is-loading.is-large:after {\\n    font-size: 1.5rem; }\\n\\n.file {\\n  align-items: stretch;\\n  display: flex;\\n  justify-content: flex-start;\\n  position: relative; }\\n  .file.is-white .file-cta {\\n    background-color: white;\\n    border-color: transparent;\\n    color: #0a0a0a; }\\n  .file.is-white:hover .file-cta, .file.is-white.is-hovered .file-cta {\\n    background-color: #f9f9f9;\\n    border-color: transparent;\\n    color: #0a0a0a; }\\n  .file.is-white:focus .file-cta, .file.is-white.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(255, 255, 255, 0.25);\\n    color: #0a0a0a; }\\n  .file.is-white:active .file-cta, .file.is-white.is-active .file-cta {\\n    background-color: #f2f2f2;\\n    border-color: transparent;\\n    color: #0a0a0a; }\\n  .file.is-black .file-cta {\\n    background-color: #0a0a0a;\\n    border-color: transparent;\\n    color: white; }\\n  .file.is-black:hover .file-cta, .file.is-black.is-hovered .file-cta {\\n    background-color: #040404;\\n    border-color: transparent;\\n    color: white; }\\n  .file.is-black:focus .file-cta, .file.is-black.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(10, 10, 10, 0.25);\\n    color: white; }\\n  .file.is-black:active .file-cta, .file.is-black.is-active .file-cta {\\n    background-color: black;\\n    border-color: transparent;\\n    color: white; }\\n  .file.is-light .file-cta {\\n    background-color: whitesmoke;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-light:hover .file-cta, .file.is-light.is-hovered .file-cta {\\n    background-color: #eeeeee;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-light:focus .file-cta, .file.is-light.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(245, 245, 245, 0.25);\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-light:active .file-cta, .file.is-light.is-active .file-cta {\\n    background-color: #e8e8e8;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-dark .file-cta {\\n    background-color: #363636;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-dark:hover .file-cta, .file.is-dark.is-hovered .file-cta {\\n    background-color: #2f2f2f;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-dark:focus .file-cta, .file.is-dark.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(54, 54, 54, 0.25);\\n    color: #fff; }\\n  .file.is-dark:active .file-cta, .file.is-dark.is-active .file-cta {\\n    background-color: #292929;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-primary .file-cta {\\n    background-color: #8A4D76;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-primary:hover .file-cta, .file.is-primary.is-hovered .file-cta {\\n    background-color: #82486f;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-primary:focus .file-cta, .file.is-primary.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(138, 77, 118, 0.25);\\n    color: #fff; }\\n  .file.is-primary:active .file-cta, .file.is-primary.is-active .file-cta {\\n    background-color: #7a4468;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-link .file-cta {\\n    background-color: blue;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-link:hover .file-cta, .file.is-link.is-hovered .file-cta {\\n    background-color: #0000f2;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-link:focus .file-cta, .file.is-link.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(0, 0, 255, 0.25);\\n    color: #fff; }\\n  .file.is-link:active .file-cta, .file.is-link.is-active .file-cta {\\n    background-color: #0000e6;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-info .file-cta {\\n    background-color: #3298dc;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-info:hover .file-cta, .file.is-info.is-hovered .file-cta {\\n    background-color: #2793da;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-info:focus .file-cta, .file.is-info.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(50, 152, 220, 0.25);\\n    color: #fff; }\\n  .file.is-info:active .file-cta, .file.is-info.is-active .file-cta {\\n    background-color: #238cd1;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-success .file-cta {\\n    background-color: #48c774;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-success:hover .file-cta, .file.is-success.is-hovered .file-cta {\\n    background-color: #3ec46d;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-success:focus .file-cta, .file.is-success.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(72, 199, 116, 0.25);\\n    color: #fff; }\\n  .file.is-success:active .file-cta, .file.is-success.is-active .file-cta {\\n    background-color: #3abb67;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-warning .file-cta {\\n    background-color: #ffdd57;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-warning:hover .file-cta, .file.is-warning.is-hovered .file-cta {\\n    background-color: #ffdb4a;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-warning:focus .file-cta, .file.is-warning.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(255, 221, 87, 0.25);\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-warning:active .file-cta, .file.is-warning.is-active .file-cta {\\n    background-color: #ffd83d;\\n    border-color: transparent;\\n    color: rgba(0, 0, 0, 0.7); }\\n  .file.is-danger .file-cta {\\n    background-color: #f14668;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-danger:hover .file-cta, .file.is-danger.is-hovered .file-cta {\\n    background-color: #f03a5f;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-danger:focus .file-cta, .file.is-danger.is-focused .file-cta {\\n    border-color: transparent;\\n    box-shadow: 0 0 0.5em rgba(241, 70, 104, 0.25);\\n    color: #fff; }\\n  .file.is-danger:active .file-cta, .file.is-danger.is-active .file-cta {\\n    background-color: #ef2e55;\\n    border-color: transparent;\\n    color: #fff; }\\n  .file.is-small {\\n    font-size: 0.75rem; }\\n  .file.is-medium {\\n    font-size: 1.25rem; }\\n    .file.is-medium .file-icon .fa {\\n      font-size: 21px; }\\n  .file.is-large {\\n    font-size: 1.5rem; }\\n    .file.is-large .file-icon .fa {\\n      font-size: 28px; }\\n  .file.has-name .file-cta {\\n    border-bottom-right-radius: 0;\\n    border-top-right-radius: 0; }\\n  .file.has-name .file-name {\\n    border-bottom-left-radius: 0;\\n    border-top-left-radius: 0; }\\n  .file.has-name.is-empty .file-cta {\\n    border-radius: 4px; }\\n  .file.has-name.is-empty .file-name {\\n    display: none; }\\n  .file.is-boxed .file-label {\\n    flex-direction: column; }\\n  .file.is-boxed .file-cta {\\n    flex-direction: column;\\n    height: auto;\\n    padding: 1em 3em; }\\n  .file.is-boxed .file-name {\\n    border-width: 0 1px 1px; }\\n  .file.is-boxed .file-icon {\\n    height: 1.5em;\\n    width: 1.5em; }\\n    .file.is-boxed .file-icon .fa {\\n      font-size: 21px; }\\n  .file.is-boxed.is-small .file-icon .fa {\\n    font-size: 14px; }\\n  .file.is-boxed.is-medium .file-icon .fa {\\n    font-size: 28px; }\\n  .file.is-boxed.is-large .file-icon .fa {\\n    font-size: 35px; }\\n  .file.is-boxed.has-name .file-cta {\\n    border-radius: 4px 4px 0 0; }\\n  .file.is-boxed.has-name .file-name {\\n    border-radius: 0 0 4px 4px;\\n    border-width: 0 1px 1px; }\\n  .file.is-centered {\\n    justify-content: center; }\\n  .file.is-fullwidth .file-label {\\n    width: 100%; }\\n  .file.is-fullwidth .file-name {\\n    flex-grow: 1;\\n    max-width: none; }\\n  .file.is-right {\\n    justify-content: flex-end; }\\n    .file.is-right .file-cta {\\n      border-radius: 0 4px 4px 0; }\\n    .file.is-right .file-name {\\n      border-radius: 4px 0 0 4px;\\n      border-width: 1px 0 1px 1px;\\n      order: -1; }\\n\\n.file-label {\\n  align-items: stretch;\\n  display: flex;\\n  cursor: pointer;\\n  justify-content: flex-start;\\n  overflow: hidden;\\n  position: relative; }\\n  .file-label:hover .file-cta {\\n    background-color: #eeeeee;\\n    color: #363636; }\\n  .file-label:hover .file-name {\\n    border-color: #d5d5d5; }\\n  .file-label:active .file-cta {\\n    background-color: #e8e8e8;\\n    color: #363636; }\\n  .file-label:active .file-name {\\n    border-color: #cfcfcf; }\\n\\n.file-input {\\n  height: 100%;\\n  left: 0;\\n  opacity: 0;\\n  outline: none;\\n  position: absolute;\\n  top: 0;\\n  width: 100%; }\\n\\n.file-cta,\\n.file-name {\\n  border-color: #dbdbdb;\\n  border-radius: 4px;\\n  font-size: 1em;\\n  padding-left: 1em;\\n  padding-right: 1em;\\n  white-space: nowrap; }\\n\\n.file-cta {\\n  background-color: whitesmoke;\\n  color: #757763; }\\n\\n.file-name {\\n  border-color: #dbdbdb;\\n  border-style: solid;\\n  border-width: 1px 1px 1px 0;\\n  display: block;\\n  max-width: 16em;\\n  overflow: hidden;\\n  text-align: left;\\n  text-overflow: ellipsis; }\\n\\n.file-icon {\\n  align-items: center;\\n  display: flex;\\n  height: 1em;\\n  justify-content: center;\\n  margin-right: 0.5em;\\n  width: 1em; }\\n  .file-icon .fa {\\n    font-size: 14px; }\\n\\n.label {\\n  color: #363636;\\n  display: block;\\n  font-size: 1rem;\\n  font-weight: 700; }\\n  .label:not(:last-child) {\\n    margin-bottom: 0.5em; }\\n  .label.is-small {\\n    font-size: 0.75rem; }\\n  .label.is-medium {\\n    font-size: 1.25rem; }\\n  .label.is-large {\\n    font-size: 1.5rem; }\\n\\n.help {\\n  display: block;\\n  font-size: 0.75rem;\\n  margin-top: 0.25rem; }\\n  .help.is-white {\\n    color: white; }\\n  .help.is-black {\\n    color: #0a0a0a; }\\n  .help.is-light {\\n    color: whitesmoke; }\\n  .help.is-dark {\\n    color: #363636; }\\n  .help.is-primary {\\n    color: #8A4D76; }\\n  .help.is-link {\\n    color: blue; }\\n  .help.is-info {\\n    color: #3298dc; }\\n  .help.is-success {\\n    color: #48c774; }\\n  .help.is-warning {\\n    color: #ffdd57; }\\n  .help.is-danger {\\n    color: #f14668; }\\n\\n.field:not(:last-child) {\\n  margin-bottom: 0.75rem; }\\n\\n.field.has-addons {\\n  display: flex;\\n  justify-content: flex-start; }\\n  .field.has-addons .control:not(:last-child) {\\n    margin-right: -1px; }\\n  .field.has-addons .control:not(:first-child):not(:last-child) .button,\\n  .field.has-addons .control:not(:first-child):not(:last-child) .input,\\n  .field.has-addons .control:not(:first-child):not(:last-child) .select select {\\n    border-radius: 0; }\\n  .field.has-addons .control:first-child:not(:only-child) .button,\\n  .field.has-addons .control:first-child:not(:only-child) .input,\\n  .field.has-addons .control:first-child:not(:only-child) .select select {\\n    border-bottom-right-radius: 0;\\n    border-top-right-radius: 0; }\\n  .field.has-addons .control:last-child:not(:only-child) .button,\\n  .field.has-addons .control:last-child:not(:only-child) .input,\\n  .field.has-addons .control:last-child:not(:only-child) .select select {\\n    border-bottom-left-radius: 0;\\n    border-top-left-radius: 0; }\\n  .field.has-addons .control .button:not([disabled]):hover, .field.has-addons .control .button:not([disabled]).is-hovered,\\n  .field.has-addons .control .input:not([disabled]):hover,\\n  .field.has-addons .control .input:not([disabled]).is-hovered,\\n  .field.has-addons .control .select select:not([disabled]):hover,\\n  .field.has-addons .control .select select:not([disabled]).is-hovered {\\n    z-index: 2; }\\n  .field.has-addons .control .button:not([disabled]):focus, .field.has-addons .control .button:not([disabled]).is-focused, .field.has-addons .control .button:not([disabled]):active, .field.has-addons .control .button:not([disabled]).is-active,\\n  .field.has-addons .control .input:not([disabled]):focus,\\n  .field.has-addons .control .input:not([disabled]).is-focused,\\n  .field.has-addons .control .input:not([disabled]):active,\\n  .field.has-addons .control .input:not([disabled]).is-active,\\n  .field.has-addons .control .select select:not([disabled]):focus,\\n  .field.has-addons .control .select select:not([disabled]).is-focused,\\n  .field.has-addons .control .select select:not([disabled]):active,\\n  .field.has-addons .control .select select:not([disabled]).is-active {\\n    z-index: 3; }\\n    .field.has-addons .control .button:not([disabled]):focus:hover, .field.has-addons .control .button:not([disabled]).is-focused:hover, .field.has-addons .control .button:not([disabled]):active:hover, .field.has-addons .control .button:not([disabled]).is-active:hover,\\n    .field.has-addons .control .input:not([disabled]):focus:hover,\\n    .field.has-addons .control .input:not([disabled]).is-focused:hover,\\n    .field.has-addons .control .input:not([disabled]):active:hover,\\n    .field.has-addons .control .input:not([disabled]).is-active:hover,\\n    .field.has-addons .control .select select:not([disabled]):focus:hover,\\n    .field.has-addons .control .select select:not([disabled]).is-focused:hover,\\n    .field.has-addons .control .select select:not([disabled]):active:hover,\\n    .field.has-addons .control .select select:not([disabled]).is-active:hover {\\n      z-index: 4; }\\n  .field.has-addons .control.is-expanded {\\n    flex-grow: 1;\\n    flex-shrink: 1; }\\n  .field.has-addons.has-addons-centered {\\n    justify-content: center; }\\n  .field.has-addons.has-addons-right {\\n    justify-content: flex-end; }\\n  .field.has-addons.has-addons-fullwidth .control {\\n    flex-grow: 1;\\n    flex-shrink: 0; }\\n\\n.field.is-grouped {\\n  display: flex;\\n  justify-content: flex-start; }\\n  .field.is-grouped > .control {\\n    flex-shrink: 0; }\\n    .field.is-grouped > .control:not(:last-child) {\\n      margin-bottom: 0;\\n      margin-right: 0.75rem; }\\n    .field.is-grouped > .control.is-expanded {\\n      flex-grow: 1;\\n      flex-shrink: 1; }\\n  .field.is-grouped.is-grouped-centered {\\n    justify-content: center; }\\n  .field.is-grouped.is-grouped-right {\\n    justify-content: flex-end; }\\n  .field.is-grouped.is-grouped-multiline {\\n    flex-wrap: wrap; }\\n    .field.is-grouped.is-grouped-multiline > .control:last-child, .field.is-grouped.is-grouped-multiline > .control:not(:last-child) {\\n      margin-bottom: 0.75rem; }\\n    .field.is-grouped.is-grouped-multiline:last-child {\\n      margin-bottom: -0.75rem; }\\n    .field.is-grouped.is-grouped-multiline:not(:last-child) {\\n      margin-bottom: 0; }\\n\\n@media screen and (min-width: 769px), print {\\n  .field.is-horizontal {\\n    display: flex; } }\\n\\n.field-label .label {\\n  font-size: inherit; }\\n\\n@media screen and (max-width: 768px) {\\n  .field-label {\\n    margin-bottom: 0.5rem; } }\\n\\n@media screen and (min-width: 769px), print {\\n  .field-label {\\n    flex-basis: 0;\\n    flex-grow: 1;\\n    flex-shrink: 0;\\n    margin-right: 1.5rem;\\n    text-align: right; }\\n    .field-label.is-small {\\n      font-size: 0.75rem;\\n      padding-top: 0.375em; }\\n    .field-label.is-normal {\\n      padding-top: 0.375em; }\\n    .field-label.is-medium {\\n      font-size: 1.25rem;\\n      padding-top: 0.375em; }\\n    .field-label.is-large {\\n      font-size: 1.5rem;\\n      padding-top: 0.375em; } }\\n\\n.field-body .field .field {\\n  margin-bottom: 0; }\\n\\n@media screen and (min-width: 769px), print {\\n  .field-body {\\n    display: flex;\\n    flex-basis: 0;\\n    flex-grow: 5;\\n    flex-shrink: 1; }\\n    .field-body .field {\\n      margin-bottom: 0; }\\n    .field-body > .field {\\n      flex-shrink: 1; }\\n      .field-body > .field:not(.is-narrow) {\\n        flex-grow: 1; }\\n      .field-body > .field:not(:last-child) {\\n        margin-right: 0.75rem; } }\\n\\n.control {\\n  box-sizing: border-box;\\n  clear: both;\\n  font-size: 1rem;\\n  position: relative;\\n  text-align: left; }\\n  .control.has-icons-left .input:focus ~ .icon,\\n  .control.has-icons-left .select:focus ~ .icon, .control.has-icons-right .input:focus ~ .icon,\\n  .control.has-icons-right .select:focus ~ .icon {\\n    color: #757763; }\\n  .control.has-icons-left .input.is-small ~ .icon,\\n  .control.has-icons-left .select.is-small ~ .icon, .control.has-icons-right .input.is-small ~ .icon,\\n  .control.has-icons-right .select.is-small ~ .icon {\\n    font-size: 0.75rem; }\\n  .control.has-icons-left .input.is-medium ~ .icon,\\n  .control.has-icons-left .select.is-medium ~ .icon, .control.has-icons-right .input.is-medium ~ .icon,\\n  .control.has-icons-right .select.is-medium ~ .icon {\\n    font-size: 1.25rem; }\\n  .control.has-icons-left .input.is-large ~ .icon,\\n  .control.has-icons-left .select.is-large ~ .icon, .control.has-icons-right .input.is-large ~ .icon,\\n  .control.has-icons-right .select.is-large ~ .icon {\\n    font-size: 1.5rem; }\\n  .control.has-icons-left .icon, .control.has-icons-right .icon {\\n    color: #dbdbdb;\\n    height: 2.5em;\\n    pointer-events: none;\\n    position: absolute;\\n    top: 0;\\n    width: 2.5em;\\n    z-index: 4; }\\n  .control.has-icons-left .input,\\n  .control.has-icons-left .select select {\\n    padding-left: 2.5em; }\\n  .control.has-icons-left .icon.is-left {\\n    left: 0; }\\n  .control.has-icons-right .input,\\n  .control.has-icons-right .select select {\\n    padding-right: 2.5em; }\\n  .control.has-icons-right .icon.is-right {\\n    right: 0; }\\n  .control.is-loading::after {\\n    position: absolute !important;\\n    right: 0.625em;\\n    top: 0.625em;\\n    z-index: 4; }\\n  .control.is-loading.is-small:after {\\n    font-size: 0.75rem; }\\n  .control.is-loading.is-medium:after {\\n    font-size: 1.25rem; }\\n  .control.is-loading.is-large:after {\\n    font-size: 1.5rem; }\\n\\n.navbar {\\n  background-color: white;\\n  min-height: 3.25rem;\\n  position: relative;\\n  z-index: 30; }\\n  .navbar.is-white {\\n    background-color: white;\\n    color: #0a0a0a; }\\n    .navbar.is-white .navbar-brand > .navbar-item,\\n    .navbar.is-white .navbar-brand .navbar-link {\\n      color: #0a0a0a; }\\n    .navbar.is-white .navbar-brand > a.navbar-item:focus, .navbar.is-white .navbar-brand > a.navbar-item:hover, .navbar.is-white .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-white .navbar-brand .navbar-link:focus,\\n    .navbar.is-white .navbar-brand .navbar-link:hover,\\n    .navbar.is-white .navbar-brand .navbar-link.is-active {\\n      background-color: #f2f2f2;\\n      color: #0a0a0a; }\\n    .navbar.is-white .navbar-brand .navbar-link::after {\\n      border-color: #0a0a0a; }\\n    .navbar.is-white .navbar-burger {\\n      color: #0a0a0a; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-white .navbar-start > .navbar-item,\\n      .navbar.is-white .navbar-start .navbar-link,\\n      .navbar.is-white .navbar-end > .navbar-item,\\n      .navbar.is-white .navbar-end .navbar-link {\\n        color: #0a0a0a; }\\n      .navbar.is-white .navbar-start > a.navbar-item:focus, .navbar.is-white .navbar-start > a.navbar-item:hover, .navbar.is-white .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-white .navbar-start .navbar-link:focus,\\n      .navbar.is-white .navbar-start .navbar-link:hover,\\n      .navbar.is-white .navbar-start .navbar-link.is-active,\\n      .navbar.is-white .navbar-end > a.navbar-item:focus,\\n      .navbar.is-white .navbar-end > a.navbar-item:hover,\\n      .navbar.is-white .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-white .navbar-end .navbar-link:focus,\\n      .navbar.is-white .navbar-end .navbar-link:hover,\\n      .navbar.is-white .navbar-end .navbar-link.is-active {\\n        background-color: #f2f2f2;\\n        color: #0a0a0a; }\\n      .navbar.is-white .navbar-start .navbar-link::after,\\n      .navbar.is-white .navbar-end .navbar-link::after {\\n        border-color: #0a0a0a; }\\n      .navbar.is-white .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-white .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-white .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #f2f2f2;\\n        color: #0a0a0a; }\\n      .navbar.is-white .navbar-dropdown a.navbar-item.is-active {\\n        background-color: white;\\n        color: #0a0a0a; } }\\n  .navbar.is-black {\\n    background-color: #0a0a0a;\\n    color: white; }\\n    .navbar.is-black .navbar-brand > .navbar-item,\\n    .navbar.is-black .navbar-brand .navbar-link {\\n      color: white; }\\n    .navbar.is-black .navbar-brand > a.navbar-item:focus, .navbar.is-black .navbar-brand > a.navbar-item:hover, .navbar.is-black .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-black .navbar-brand .navbar-link:focus,\\n    .navbar.is-black .navbar-brand .navbar-link:hover,\\n    .navbar.is-black .navbar-brand .navbar-link.is-active {\\n      background-color: black;\\n      color: white; }\\n    .navbar.is-black .navbar-brand .navbar-link::after {\\n      border-color: white; }\\n    .navbar.is-black .navbar-burger {\\n      color: white; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-black .navbar-start > .navbar-item,\\n      .navbar.is-black .navbar-start .navbar-link,\\n      .navbar.is-black .navbar-end > .navbar-item,\\n      .navbar.is-black .navbar-end .navbar-link {\\n        color: white; }\\n      .navbar.is-black .navbar-start > a.navbar-item:focus, .navbar.is-black .navbar-start > a.navbar-item:hover, .navbar.is-black .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-black .navbar-start .navbar-link:focus,\\n      .navbar.is-black .navbar-start .navbar-link:hover,\\n      .navbar.is-black .navbar-start .navbar-link.is-active,\\n      .navbar.is-black .navbar-end > a.navbar-item:focus,\\n      .navbar.is-black .navbar-end > a.navbar-item:hover,\\n      .navbar.is-black .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-black .navbar-end .navbar-link:focus,\\n      .navbar.is-black .navbar-end .navbar-link:hover,\\n      .navbar.is-black .navbar-end .navbar-link.is-active {\\n        background-color: black;\\n        color: white; }\\n      .navbar.is-black .navbar-start .navbar-link::after,\\n      .navbar.is-black .navbar-end .navbar-link::after {\\n        border-color: white; }\\n      .navbar.is-black .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-black .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-black .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: black;\\n        color: white; }\\n      .navbar.is-black .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #0a0a0a;\\n        color: white; } }\\n  .navbar.is-light {\\n    background-color: whitesmoke;\\n    color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-light .navbar-brand > .navbar-item,\\n    .navbar.is-light .navbar-brand .navbar-link {\\n      color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-light .navbar-brand > a.navbar-item:focus, .navbar.is-light .navbar-brand > a.navbar-item:hover, .navbar.is-light .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-light .navbar-brand .navbar-link:focus,\\n    .navbar.is-light .navbar-brand .navbar-link:hover,\\n    .navbar.is-light .navbar-brand .navbar-link.is-active {\\n      background-color: #e8e8e8;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-light .navbar-brand .navbar-link::after {\\n      border-color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-light .navbar-burger {\\n      color: rgba(0, 0, 0, 0.7); }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-light .navbar-start > .navbar-item,\\n      .navbar.is-light .navbar-start .navbar-link,\\n      .navbar.is-light .navbar-end > .navbar-item,\\n      .navbar.is-light .navbar-end .navbar-link {\\n        color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-light .navbar-start > a.navbar-item:focus, .navbar.is-light .navbar-start > a.navbar-item:hover, .navbar.is-light .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-light .navbar-start .navbar-link:focus,\\n      .navbar.is-light .navbar-start .navbar-link:hover,\\n      .navbar.is-light .navbar-start .navbar-link.is-active,\\n      .navbar.is-light .navbar-end > a.navbar-item:focus,\\n      .navbar.is-light .navbar-end > a.navbar-item:hover,\\n      .navbar.is-light .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-light .navbar-end .navbar-link:focus,\\n      .navbar.is-light .navbar-end .navbar-link:hover,\\n      .navbar.is-light .navbar-end .navbar-link.is-active {\\n        background-color: #e8e8e8;\\n        color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-light .navbar-start .navbar-link::after,\\n      .navbar.is-light .navbar-end .navbar-link::after {\\n        border-color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-light .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-light .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-light .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #e8e8e8;\\n        color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-light .navbar-dropdown a.navbar-item.is-active {\\n        background-color: whitesmoke;\\n        color: rgba(0, 0, 0, 0.7); } }\\n  .navbar.is-dark {\\n    background-color: #363636;\\n    color: #fff; }\\n    .navbar.is-dark .navbar-brand > .navbar-item,\\n    .navbar.is-dark .navbar-brand .navbar-link {\\n      color: #fff; }\\n    .navbar.is-dark .navbar-brand > a.navbar-item:focus, .navbar.is-dark .navbar-brand > a.navbar-item:hover, .navbar.is-dark .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-dark .navbar-brand .navbar-link:focus,\\n    .navbar.is-dark .navbar-brand .navbar-link:hover,\\n    .navbar.is-dark .navbar-brand .navbar-link.is-active {\\n      background-color: #292929;\\n      color: #fff; }\\n    .navbar.is-dark .navbar-brand .navbar-link::after {\\n      border-color: #fff; }\\n    .navbar.is-dark .navbar-burger {\\n      color: #fff; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-dark .navbar-start > .navbar-item,\\n      .navbar.is-dark .navbar-start .navbar-link,\\n      .navbar.is-dark .navbar-end > .navbar-item,\\n      .navbar.is-dark .navbar-end .navbar-link {\\n        color: #fff; }\\n      .navbar.is-dark .navbar-start > a.navbar-item:focus, .navbar.is-dark .navbar-start > a.navbar-item:hover, .navbar.is-dark .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-dark .navbar-start .navbar-link:focus,\\n      .navbar.is-dark .navbar-start .navbar-link:hover,\\n      .navbar.is-dark .navbar-start .navbar-link.is-active,\\n      .navbar.is-dark .navbar-end > a.navbar-item:focus,\\n      .navbar.is-dark .navbar-end > a.navbar-item:hover,\\n      .navbar.is-dark .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-dark .navbar-end .navbar-link:focus,\\n      .navbar.is-dark .navbar-end .navbar-link:hover,\\n      .navbar.is-dark .navbar-end .navbar-link.is-active {\\n        background-color: #292929;\\n        color: #fff; }\\n      .navbar.is-dark .navbar-start .navbar-link::after,\\n      .navbar.is-dark .navbar-end .navbar-link::after {\\n        border-color: #fff; }\\n      .navbar.is-dark .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-dark .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-dark .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #292929;\\n        color: #fff; }\\n      .navbar.is-dark .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #363636;\\n        color: #fff; } }\\n  .navbar.is-primary {\\n    background-color: #8A4D76;\\n    color: #fff; }\\n    .navbar.is-primary .navbar-brand > .navbar-item,\\n    .navbar.is-primary .navbar-brand .navbar-link {\\n      color: #fff; }\\n    .navbar.is-primary .navbar-brand > a.navbar-item:focus, .navbar.is-primary .navbar-brand > a.navbar-item:hover, .navbar.is-primary .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-primary .navbar-brand .navbar-link:focus,\\n    .navbar.is-primary .navbar-brand .navbar-link:hover,\\n    .navbar.is-primary .navbar-brand .navbar-link.is-active {\\n      background-color: #7a4468;\\n      color: #fff; }\\n    .navbar.is-primary .navbar-brand .navbar-link::after {\\n      border-color: #fff; }\\n    .navbar.is-primary .navbar-burger {\\n      color: #fff; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-primary .navbar-start > .navbar-item,\\n      .navbar.is-primary .navbar-start .navbar-link,\\n      .navbar.is-primary .navbar-end > .navbar-item,\\n      .navbar.is-primary .navbar-end .navbar-link {\\n        color: #fff; }\\n      .navbar.is-primary .navbar-start > a.navbar-item:focus, .navbar.is-primary .navbar-start > a.navbar-item:hover, .navbar.is-primary .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-primary .navbar-start .navbar-link:focus,\\n      .navbar.is-primary .navbar-start .navbar-link:hover,\\n      .navbar.is-primary .navbar-start .navbar-link.is-active,\\n      .navbar.is-primary .navbar-end > a.navbar-item:focus,\\n      .navbar.is-primary .navbar-end > a.navbar-item:hover,\\n      .navbar.is-primary .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-primary .navbar-end .navbar-link:focus,\\n      .navbar.is-primary .navbar-end .navbar-link:hover,\\n      .navbar.is-primary .navbar-end .navbar-link.is-active {\\n        background-color: #7a4468;\\n        color: #fff; }\\n      .navbar.is-primary .navbar-start .navbar-link::after,\\n      .navbar.is-primary .navbar-end .navbar-link::after {\\n        border-color: #fff; }\\n      .navbar.is-primary .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-primary .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-primary .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #7a4468;\\n        color: #fff; }\\n      .navbar.is-primary .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #8A4D76;\\n        color: #fff; } }\\n  .navbar.is-link {\\n    background-color: blue;\\n    color: #fff; }\\n    .navbar.is-link .navbar-brand > .navbar-item,\\n    .navbar.is-link .navbar-brand .navbar-link {\\n      color: #fff; }\\n    .navbar.is-link .navbar-brand > a.navbar-item:focus, .navbar.is-link .navbar-brand > a.navbar-item:hover, .navbar.is-link .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-link .navbar-brand .navbar-link:focus,\\n    .navbar.is-link .navbar-brand .navbar-link:hover,\\n    .navbar.is-link .navbar-brand .navbar-link.is-active {\\n      background-color: #0000e6;\\n      color: #fff; }\\n    .navbar.is-link .navbar-brand .navbar-link::after {\\n      border-color: #fff; }\\n    .navbar.is-link .navbar-burger {\\n      color: #fff; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-link .navbar-start > .navbar-item,\\n      .navbar.is-link .navbar-start .navbar-link,\\n      .navbar.is-link .navbar-end > .navbar-item,\\n      .navbar.is-link .navbar-end .navbar-link {\\n        color: #fff; }\\n      .navbar.is-link .navbar-start > a.navbar-item:focus, .navbar.is-link .navbar-start > a.navbar-item:hover, .navbar.is-link .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-link .navbar-start .navbar-link:focus,\\n      .navbar.is-link .navbar-start .navbar-link:hover,\\n      .navbar.is-link .navbar-start .navbar-link.is-active,\\n      .navbar.is-link .navbar-end > a.navbar-item:focus,\\n      .navbar.is-link .navbar-end > a.navbar-item:hover,\\n      .navbar.is-link .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-link .navbar-end .navbar-link:focus,\\n      .navbar.is-link .navbar-end .navbar-link:hover,\\n      .navbar.is-link .navbar-end .navbar-link.is-active {\\n        background-color: #0000e6;\\n        color: #fff; }\\n      .navbar.is-link .navbar-start .navbar-link::after,\\n      .navbar.is-link .navbar-end .navbar-link::after {\\n        border-color: #fff; }\\n      .navbar.is-link .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-link .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-link .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #0000e6;\\n        color: #fff; }\\n      .navbar.is-link .navbar-dropdown a.navbar-item.is-active {\\n        background-color: blue;\\n        color: #fff; } }\\n  .navbar.is-info {\\n    background-color: #3298dc;\\n    color: #fff; }\\n    .navbar.is-info .navbar-brand > .navbar-item,\\n    .navbar.is-info .navbar-brand .navbar-link {\\n      color: #fff; }\\n    .navbar.is-info .navbar-brand > a.navbar-item:focus, .navbar.is-info .navbar-brand > a.navbar-item:hover, .navbar.is-info .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-info .navbar-brand .navbar-link:focus,\\n    .navbar.is-info .navbar-brand .navbar-link:hover,\\n    .navbar.is-info .navbar-brand .navbar-link.is-active {\\n      background-color: #238cd1;\\n      color: #fff; }\\n    .navbar.is-info .navbar-brand .navbar-link::after {\\n      border-color: #fff; }\\n    .navbar.is-info .navbar-burger {\\n      color: #fff; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-info .navbar-start > .navbar-item,\\n      .navbar.is-info .navbar-start .navbar-link,\\n      .navbar.is-info .navbar-end > .navbar-item,\\n      .navbar.is-info .navbar-end .navbar-link {\\n        color: #fff; }\\n      .navbar.is-info .navbar-start > a.navbar-item:focus, .navbar.is-info .navbar-start > a.navbar-item:hover, .navbar.is-info .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-info .navbar-start .navbar-link:focus,\\n      .navbar.is-info .navbar-start .navbar-link:hover,\\n      .navbar.is-info .navbar-start .navbar-link.is-active,\\n      .navbar.is-info .navbar-end > a.navbar-item:focus,\\n      .navbar.is-info .navbar-end > a.navbar-item:hover,\\n      .navbar.is-info .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-info .navbar-end .navbar-link:focus,\\n      .navbar.is-info .navbar-end .navbar-link:hover,\\n      .navbar.is-info .navbar-end .navbar-link.is-active {\\n        background-color: #238cd1;\\n        color: #fff; }\\n      .navbar.is-info .navbar-start .navbar-link::after,\\n      .navbar.is-info .navbar-end .navbar-link::after {\\n        border-color: #fff; }\\n      .navbar.is-info .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-info .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-info .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #238cd1;\\n        color: #fff; }\\n      .navbar.is-info .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #3298dc;\\n        color: #fff; } }\\n  .navbar.is-success {\\n    background-color: #48c774;\\n    color: #fff; }\\n    .navbar.is-success .navbar-brand > .navbar-item,\\n    .navbar.is-success .navbar-brand .navbar-link {\\n      color: #fff; }\\n    .navbar.is-success .navbar-brand > a.navbar-item:focus, .navbar.is-success .navbar-brand > a.navbar-item:hover, .navbar.is-success .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-success .navbar-brand .navbar-link:focus,\\n    .navbar.is-success .navbar-brand .navbar-link:hover,\\n    .navbar.is-success .navbar-brand .navbar-link.is-active {\\n      background-color: #3abb67;\\n      color: #fff; }\\n    .navbar.is-success .navbar-brand .navbar-link::after {\\n      border-color: #fff; }\\n    .navbar.is-success .navbar-burger {\\n      color: #fff; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-success .navbar-start > .navbar-item,\\n      .navbar.is-success .navbar-start .navbar-link,\\n      .navbar.is-success .navbar-end > .navbar-item,\\n      .navbar.is-success .navbar-end .navbar-link {\\n        color: #fff; }\\n      .navbar.is-success .navbar-start > a.navbar-item:focus, .navbar.is-success .navbar-start > a.navbar-item:hover, .navbar.is-success .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-success .navbar-start .navbar-link:focus,\\n      .navbar.is-success .navbar-start .navbar-link:hover,\\n      .navbar.is-success .navbar-start .navbar-link.is-active,\\n      .navbar.is-success .navbar-end > a.navbar-item:focus,\\n      .navbar.is-success .navbar-end > a.navbar-item:hover,\\n      .navbar.is-success .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-success .navbar-end .navbar-link:focus,\\n      .navbar.is-success .navbar-end .navbar-link:hover,\\n      .navbar.is-success .navbar-end .navbar-link.is-active {\\n        background-color: #3abb67;\\n        color: #fff; }\\n      .navbar.is-success .navbar-start .navbar-link::after,\\n      .navbar.is-success .navbar-end .navbar-link::after {\\n        border-color: #fff; }\\n      .navbar.is-success .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-success .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-success .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #3abb67;\\n        color: #fff; }\\n      .navbar.is-success .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #48c774;\\n        color: #fff; } }\\n  .navbar.is-warning {\\n    background-color: #ffdd57;\\n    color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-warning .navbar-brand > .navbar-item,\\n    .navbar.is-warning .navbar-brand .navbar-link {\\n      color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-warning .navbar-brand > a.navbar-item:focus, .navbar.is-warning .navbar-brand > a.navbar-item:hover, .navbar.is-warning .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-warning .navbar-brand .navbar-link:focus,\\n    .navbar.is-warning .navbar-brand .navbar-link:hover,\\n    .navbar.is-warning .navbar-brand .navbar-link.is-active {\\n      background-color: #ffd83d;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-warning .navbar-brand .navbar-link::after {\\n      border-color: rgba(0, 0, 0, 0.7); }\\n    .navbar.is-warning .navbar-burger {\\n      color: rgba(0, 0, 0, 0.7); }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-warning .navbar-start > .navbar-item,\\n      .navbar.is-warning .navbar-start .navbar-link,\\n      .navbar.is-warning .navbar-end > .navbar-item,\\n      .navbar.is-warning .navbar-end .navbar-link {\\n        color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-warning .navbar-start > a.navbar-item:focus, .navbar.is-warning .navbar-start > a.navbar-item:hover, .navbar.is-warning .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-warning .navbar-start .navbar-link:focus,\\n      .navbar.is-warning .navbar-start .navbar-link:hover,\\n      .navbar.is-warning .navbar-start .navbar-link.is-active,\\n      .navbar.is-warning .navbar-end > a.navbar-item:focus,\\n      .navbar.is-warning .navbar-end > a.navbar-item:hover,\\n      .navbar.is-warning .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-warning .navbar-end .navbar-link:focus,\\n      .navbar.is-warning .navbar-end .navbar-link:hover,\\n      .navbar.is-warning .navbar-end .navbar-link.is-active {\\n        background-color: #ffd83d;\\n        color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-warning .navbar-start .navbar-link::after,\\n      .navbar.is-warning .navbar-end .navbar-link::after {\\n        border-color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-warning .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-warning .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-warning .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #ffd83d;\\n        color: rgba(0, 0, 0, 0.7); }\\n      .navbar.is-warning .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #ffdd57;\\n        color: rgba(0, 0, 0, 0.7); } }\\n  .navbar.is-danger {\\n    background-color: #f14668;\\n    color: #fff; }\\n    .navbar.is-danger .navbar-brand > .navbar-item,\\n    .navbar.is-danger .navbar-brand .navbar-link {\\n      color: #fff; }\\n    .navbar.is-danger .navbar-brand > a.navbar-item:focus, .navbar.is-danger .navbar-brand > a.navbar-item:hover, .navbar.is-danger .navbar-brand > a.navbar-item.is-active,\\n    .navbar.is-danger .navbar-brand .navbar-link:focus,\\n    .navbar.is-danger .navbar-brand .navbar-link:hover,\\n    .navbar.is-danger .navbar-brand .navbar-link.is-active {\\n      background-color: #ef2e55;\\n      color: #fff; }\\n    .navbar.is-danger .navbar-brand .navbar-link::after {\\n      border-color: #fff; }\\n    .navbar.is-danger .navbar-burger {\\n      color: #fff; }\\n    @media screen and (min-width: 1024px) {\\n      .navbar.is-danger .navbar-start > .navbar-item,\\n      .navbar.is-danger .navbar-start .navbar-link,\\n      .navbar.is-danger .navbar-end > .navbar-item,\\n      .navbar.is-danger .navbar-end .navbar-link {\\n        color: #fff; }\\n      .navbar.is-danger .navbar-start > a.navbar-item:focus, .navbar.is-danger .navbar-start > a.navbar-item:hover, .navbar.is-danger .navbar-start > a.navbar-item.is-active,\\n      .navbar.is-danger .navbar-start .navbar-link:focus,\\n      .navbar.is-danger .navbar-start .navbar-link:hover,\\n      .navbar.is-danger .navbar-start .navbar-link.is-active,\\n      .navbar.is-danger .navbar-end > a.navbar-item:focus,\\n      .navbar.is-danger .navbar-end > a.navbar-item:hover,\\n      .navbar.is-danger .navbar-end > a.navbar-item.is-active,\\n      .navbar.is-danger .navbar-end .navbar-link:focus,\\n      .navbar.is-danger .navbar-end .navbar-link:hover,\\n      .navbar.is-danger .navbar-end .navbar-link.is-active {\\n        background-color: #ef2e55;\\n        color: #fff; }\\n      .navbar.is-danger .navbar-start .navbar-link::after,\\n      .navbar.is-danger .navbar-end .navbar-link::after {\\n        border-color: #fff; }\\n      .navbar.is-danger .navbar-item.has-dropdown:focus .navbar-link,\\n      .navbar.is-danger .navbar-item.has-dropdown:hover .navbar-link,\\n      .navbar.is-danger .navbar-item.has-dropdown.is-active .navbar-link {\\n        background-color: #ef2e55;\\n        color: #fff; }\\n      .navbar.is-danger .navbar-dropdown a.navbar-item.is-active {\\n        background-color: #f14668;\\n        color: #fff; } }\\n  .navbar > .container {\\n    align-items: stretch;\\n    display: flex;\\n    min-height: 3.25rem;\\n    width: 100%; }\\n  .navbar.has-shadow {\\n    box-shadow: 0 2px 0 0 whitesmoke; }\\n  .navbar.is-fixed-bottom, .navbar.is-fixed-top {\\n    left: 0;\\n    position: fixed;\\n    right: 0;\\n    z-index: 30; }\\n  .navbar.is-fixed-bottom {\\n    bottom: 0; }\\n    .navbar.is-fixed-bottom.has-shadow {\\n      box-shadow: 0 -2px 0 0 whitesmoke; }\\n  .navbar.is-fixed-top {\\n    top: 0; }\\n\\nhtml.has-navbar-fixed-top,\\nbody.has-navbar-fixed-top {\\n  padding-top: 3.25rem; }\\n\\nhtml.has-navbar-fixed-bottom,\\nbody.has-navbar-fixed-bottom {\\n  padding-bottom: 3.25rem; }\\n\\n.navbar-brand,\\n.navbar-tabs {\\n  align-items: stretch;\\n  display: flex;\\n  flex-shrink: 0;\\n  min-height: 3.25rem; }\\n\\n.navbar-brand a.navbar-item:focus, .navbar-brand a.navbar-item:hover {\\n  background-color: transparent; }\\n\\n.navbar-tabs {\\n  -webkit-overflow-scrolling: touch;\\n  max-width: 100vw;\\n  overflow-x: auto;\\n  overflow-y: hidden; }\\n\\n.navbar-burger {\\n  color: #757763;\\n  cursor: pointer;\\n  display: block;\\n  height: 3.25rem;\\n  position: relative;\\n  width: 3.25rem;\\n  margin-left: auto; }\\n  .navbar-burger span {\\n    background-color: currentColor;\\n    display: block;\\n    height: 1px;\\n    left: calc(50% - 8px);\\n    position: absolute;\\n    transform-origin: center;\\n    transition-duration: 86ms;\\n    transition-property: background-color, opacity, transform;\\n    transition-timing-function: ease-out;\\n    width: 16px; }\\n    .navbar-burger span:nth-child(1) {\\n      top: calc(50% - 6px); }\\n    .navbar-burger span:nth-child(2) {\\n      top: calc(50% - 1px); }\\n    .navbar-burger span:nth-child(3) {\\n      top: calc(50% + 4px); }\\n  .navbar-burger:hover {\\n    background-color: rgba(0, 0, 0, 0.05); }\\n  .navbar-burger.is-active span:nth-child(1) {\\n    transform: translateY(5px) rotate(45deg); }\\n  .navbar-burger.is-active span:nth-child(2) {\\n    opacity: 0; }\\n  .navbar-burger.is-active span:nth-child(3) {\\n    transform: translateY(-5px) rotate(-45deg); }\\n\\n.navbar-menu {\\n  display: none; }\\n\\n.navbar-item,\\n.navbar-link {\\n  color: #757763;\\n  display: block;\\n  line-height: 1.5;\\n  padding: 0.5rem 0.75rem;\\n  position: relative; }\\n  .navbar-item .icon:only-child,\\n  .navbar-link .icon:only-child {\\n    margin-left: -0.25rem;\\n    margin-right: -0.25rem; }\\n\\na.navbar-item,\\n.navbar-link {\\n  cursor: pointer; }\\n  a.navbar-item:focus, a.navbar-item:focus-within, a.navbar-item:hover, a.navbar-item.is-active,\\n  .navbar-link:focus,\\n  .navbar-link:focus-within,\\n  .navbar-link:hover,\\n  .navbar-link.is-active {\\n    background-color: #fafafa;\\n    color: blue; }\\n\\n.navbar-item {\\n  display: block;\\n  flex-grow: 0;\\n  flex-shrink: 0; }\\n  .navbar-item img {\\n    max-height: 1.75rem; }\\n  .navbar-item.has-dropdown {\\n    padding: 0; }\\n  .navbar-item.is-expanded {\\n    flex-grow: 1;\\n    flex-shrink: 1; }\\n  .navbar-item.is-tab {\\n    border-bottom: 1px solid transparent;\\n    min-height: 3.25rem;\\n    padding-bottom: calc(0.5rem - 1px); }\\n    .navbar-item.is-tab:focus, .navbar-item.is-tab:hover {\\n      background-color: transparent;\\n      border-bottom-color: blue; }\\n    .navbar-item.is-tab.is-active {\\n      background-color: transparent;\\n      border-bottom-color: blue;\\n      border-bottom-style: solid;\\n      border-bottom-width: 3px;\\n      color: blue;\\n      padding-bottom: calc(0.5rem - 3px); }\\n\\n.navbar-content {\\n  flex-grow: 1;\\n  flex-shrink: 1; }\\n\\n.navbar-link:not(.is-arrowless) {\\n  padding-right: 2.5em; }\\n  .navbar-link:not(.is-arrowless)::after {\\n    border-color: blue;\\n    margin-top: -0.375em;\\n    right: 1.125em; }\\n\\n.navbar-dropdown {\\n  font-size: 0.875rem;\\n  padding-bottom: 0.5rem;\\n  padding-top: 0.5rem; }\\n  .navbar-dropdown .navbar-item {\\n    padding-left: 1.5rem;\\n    padding-right: 1.5rem; }\\n\\n.navbar-divider {\\n  background-color: whitesmoke;\\n  border: none;\\n  display: none;\\n  height: 2px;\\n  margin: 0.5rem 0; }\\n\\n@media screen and (max-width: 1023px) {\\n  .navbar > .container {\\n    display: block; }\\n  .navbar-brand .navbar-item,\\n  .navbar-tabs .navbar-item {\\n    align-items: center;\\n    display: flex; }\\n  .navbar-link::after {\\n    display: none; }\\n  .navbar-menu {\\n    background-color: white;\\n    box-shadow: 0 8px 16px rgba(10, 10, 10, 0.1);\\n    padding: 0.5rem 0; }\\n    .navbar-menu.is-active {\\n      display: block; }\\n  .navbar.is-fixed-bottom-touch, .navbar.is-fixed-top-touch {\\n    left: 0;\\n    position: fixed;\\n    right: 0;\\n    z-index: 30; }\\n  .navbar.is-fixed-bottom-touch {\\n    bottom: 0; }\\n    .navbar.is-fixed-bottom-touch.has-shadow {\\n      box-shadow: 0 -2px 3px rgba(10, 10, 10, 0.1); }\\n  .navbar.is-fixed-top-touch {\\n    top: 0; }\\n  .navbar.is-fixed-top .navbar-menu, .navbar.is-fixed-top-touch .navbar-menu {\\n    -webkit-overflow-scrolling: touch;\\n    max-height: calc(100vh - 3.25rem);\\n    overflow: auto; }\\n  html.has-navbar-fixed-top-touch,\\n  body.has-navbar-fixed-top-touch {\\n    padding-top: 3.25rem; }\\n  html.has-navbar-fixed-bottom-touch,\\n  body.has-navbar-fixed-bottom-touch {\\n    padding-bottom: 3.25rem; } }\\n\\n@media screen and (min-width: 1024px) {\\n  .navbar,\\n  .navbar-menu,\\n  .navbar-start,\\n  .navbar-end {\\n    align-items: stretch;\\n    display: flex; }\\n  .navbar {\\n    min-height: 3.25rem; }\\n    .navbar.is-spaced {\\n      padding: 1rem 2rem; }\\n      .navbar.is-spaced .navbar-start,\\n      .navbar.is-spaced .navbar-end {\\n        align-items: center; }\\n      .navbar.is-spaced a.navbar-item,\\n      .navbar.is-spaced .navbar-link {\\n        border-radius: 4px; }\\n    .navbar.is-transparent a.navbar-item:focus, .navbar.is-transparent a.navbar-item:hover, .navbar.is-transparent a.navbar-item.is-active,\\n    .navbar.is-transparent .navbar-link:focus,\\n    .navbar.is-transparent .navbar-link:hover,\\n    .navbar.is-transparent .navbar-link.is-active {\\n      background-color: transparent !important; }\\n    .navbar.is-transparent .navbar-item.has-dropdown.is-active .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:focus .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:focus-within .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:hover .navbar-link {\\n      background-color: transparent !important; }\\n    .navbar.is-transparent .navbar-dropdown a.navbar-item:focus, .navbar.is-transparent .navbar-dropdown a.navbar-item:hover {\\n      background-color: whitesmoke;\\n      color: #0a0a0a; }\\n    .navbar.is-transparent .navbar-dropdown a.navbar-item.is-active {\\n      background-color: whitesmoke;\\n      color: blue; }\\n  .navbar-burger {\\n    display: none; }\\n  .navbar-item,\\n  .navbar-link {\\n    align-items: center;\\n    display: flex; }\\n  .navbar-item {\\n    display: flex; }\\n    .navbar-item.has-dropdown {\\n      align-items: stretch; }\\n    .navbar-item.has-dropdown-up .navbar-link::after {\\n      transform: rotate(135deg) translate(0.25em, -0.25em); }\\n    .navbar-item.has-dropdown-up .navbar-dropdown {\\n      border-bottom: 2px solid #dbdbdb;\\n      border-radius: 6px 6px 0 0;\\n      border-top: none;\\n      bottom: 100%;\\n      box-shadow: 0 -8px 8px rgba(10, 10, 10, 0.1);\\n      top: auto; }\\n    .navbar-item.is-active .navbar-dropdown, .navbar-item.is-hoverable:focus .navbar-dropdown, .navbar-item.is-hoverable:focus-within .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown {\\n      display: block; }\\n      .navbar.is-spaced .navbar-item.is-active .navbar-dropdown, .navbar-item.is-active .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:focus .navbar-dropdown, .navbar-item.is-hoverable:focus .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:focus-within .navbar-dropdown, .navbar-item.is-hoverable:focus-within .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:hover .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown.is-boxed {\\n        opacity: 1;\\n        pointer-events: auto;\\n        transform: translateY(0); }\\n  .navbar-menu {\\n    flex-grow: 1;\\n    flex-shrink: 0; }\\n  .navbar-start {\\n    justify-content: flex-start;\\n    margin-right: auto; }\\n  .navbar-end {\\n    justify-content: flex-end;\\n    margin-left: auto; }\\n  .navbar-dropdown {\\n    background-color: white;\\n    border-bottom-left-radius: 6px;\\n    border-bottom-right-radius: 6px;\\n    border-top: 2px solid #dbdbdb;\\n    box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1);\\n    display: none;\\n    font-size: 0.875rem;\\n    left: 0;\\n    min-width: 100%;\\n    position: absolute;\\n    top: 100%;\\n    z-index: 20; }\\n    .navbar-dropdown .navbar-item {\\n      padding: 0.375rem 1rem;\\n      white-space: nowrap; }\\n    .navbar-dropdown a.navbar-item {\\n      padding-right: 3rem; }\\n      .navbar-dropdown a.navbar-item:focus, .navbar-dropdown a.navbar-item:hover {\\n        background-color: whitesmoke;\\n        color: #0a0a0a; }\\n      .navbar-dropdown a.navbar-item.is-active {\\n        background-color: whitesmoke;\\n        color: blue; }\\n    .navbar.is-spaced .navbar-dropdown, .navbar-dropdown.is-boxed {\\n      border-radius: 6px;\\n      border-top: none;\\n      box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\\n      display: block;\\n      opacity: 0;\\n      pointer-events: none;\\n      top: calc(100% + (-4px));\\n      transform: translateY(-5px);\\n      transition-duration: 86ms;\\n      transition-property: opacity, transform; }\\n    .navbar-dropdown.is-right {\\n      left: auto;\\n      right: 0; }\\n  .navbar-divider {\\n    display: block; }\\n  .navbar > .container .navbar-brand,\\n  .container > .navbar .navbar-brand {\\n    margin-left: -.75rem; }\\n  .navbar > .container .navbar-menu,\\n  .container > .navbar .navbar-menu {\\n    margin-right: -.75rem; }\\n  .navbar.is-fixed-bottom-desktop, .navbar.is-fixed-top-desktop {\\n    left: 0;\\n    position: fixed;\\n    right: 0;\\n    z-index: 30; }\\n  .navbar.is-fixed-bottom-desktop {\\n    bottom: 0; }\\n    .navbar.is-fixed-bottom-desktop.has-shadow {\\n      box-shadow: 0 -2px 3px rgba(10, 10, 10, 0.1); }\\n  .navbar.is-fixed-top-desktop {\\n    top: 0; }\\n  html.has-navbar-fixed-top-desktop,\\n  body.has-navbar-fixed-top-desktop {\\n    padding-top: 3.25rem; }\\n  html.has-navbar-fixed-bottom-desktop,\\n  body.has-navbar-fixed-bottom-desktop {\\n    padding-bottom: 3.25rem; }\\n  html.has-spaced-navbar-fixed-top,\\n  body.has-spaced-navbar-fixed-top {\\n    padding-top: 5.25rem; }\\n  html.has-spaced-navbar-fixed-bottom,\\n  body.has-spaced-navbar-fixed-bottom {\\n    padding-bottom: 5.25rem; }\\n  a.navbar-item.is-active,\\n  .navbar-link.is-active {\\n    color: #0a0a0a; }\\n  a.navbar-item.is-active:not(:focus):not(:hover),\\n  .navbar-link.is-active:not(:focus):not(:hover) {\\n    background-color: transparent; }\\n  .navbar-item.has-dropdown:focus .navbar-link, .navbar-item.has-dropdown:hover .navbar-link, .navbar-item.has-dropdown.is-active .navbar-link {\\n    background-color: #fafafa; } }\\n\\n.hero.is-fullheight-with-navbar {\\n  min-height: calc(100vh - 3.25rem); }\\n\\n.hero {\\n  align-items: stretch;\\n  display: flex;\\n  flex-direction: column;\\n  justify-content: space-between; }\\n  .hero .navbar {\\n    background: none; }\\n  .hero .tabs ul {\\n    border-bottom: none; }\\n  .hero.is-white {\\n    background-color: white;\\n    color: #0a0a0a; }\\n    .hero.is-white a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-white strong {\\n      color: inherit; }\\n    .hero.is-white .title {\\n      color: #0a0a0a; }\\n    .hero.is-white .subtitle {\\n      color: rgba(10, 10, 10, 0.9); }\\n      .hero.is-white .subtitle a:not(.button),\\n      .hero.is-white .subtitle strong {\\n        color: #0a0a0a; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-white .navbar-menu {\\n        background-color: white; } }\\n    .hero.is-white .navbar-item,\\n    .hero.is-white .navbar-link {\\n      color: rgba(10, 10, 10, 0.7); }\\n    .hero.is-white a.navbar-item:hover, .hero.is-white a.navbar-item.is-active,\\n    .hero.is-white .navbar-link:hover,\\n    .hero.is-white .navbar-link.is-active {\\n      background-color: #f2f2f2;\\n      color: #0a0a0a; }\\n    .hero.is-white .tabs a {\\n      color: #0a0a0a;\\n      opacity: 0.9; }\\n      .hero.is-white .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-white .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-white .tabs.is-boxed a, .hero.is-white .tabs.is-toggle a {\\n      color: #0a0a0a; }\\n      .hero.is-white .tabs.is-boxed a:hover, .hero.is-white .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-white .tabs.is-boxed li.is-active a, .hero.is-white .tabs.is-boxed li.is-active a:hover, .hero.is-white .tabs.is-toggle li.is-active a, .hero.is-white .tabs.is-toggle li.is-active a:hover {\\n      background-color: #0a0a0a;\\n      border-color: #0a0a0a;\\n      color: white; }\\n    .hero.is-white.is-bold {\\n      background-image: linear-gradient(141deg, #e6e6e6 0%, white 71%, white 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-white.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #e6e6e6 0%, white 71%, white 100%); } }\\n  .hero.is-black {\\n    background-color: #0a0a0a;\\n    color: white; }\\n    .hero.is-black a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-black strong {\\n      color: inherit; }\\n    .hero.is-black .title {\\n      color: white; }\\n    .hero.is-black .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-black .subtitle a:not(.button),\\n      .hero.is-black .subtitle strong {\\n        color: white; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-black .navbar-menu {\\n        background-color: #0a0a0a; } }\\n    .hero.is-black .navbar-item,\\n    .hero.is-black .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-black a.navbar-item:hover, .hero.is-black a.navbar-item.is-active,\\n    .hero.is-black .navbar-link:hover,\\n    .hero.is-black .navbar-link.is-active {\\n      background-color: black;\\n      color: white; }\\n    .hero.is-black .tabs a {\\n      color: white;\\n      opacity: 0.9; }\\n      .hero.is-black .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-black .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-black .tabs.is-boxed a, .hero.is-black .tabs.is-toggle a {\\n      color: white; }\\n      .hero.is-black .tabs.is-boxed a:hover, .hero.is-black .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-black .tabs.is-boxed li.is-active a, .hero.is-black .tabs.is-boxed li.is-active a:hover, .hero.is-black .tabs.is-toggle li.is-active a, .hero.is-black .tabs.is-toggle li.is-active a:hover {\\n      background-color: white;\\n      border-color: white;\\n      color: #0a0a0a; }\\n    .hero.is-black.is-bold {\\n      background-image: linear-gradient(141deg, black 0%, #0a0a0a 71%, #181616 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-black.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, black 0%, #0a0a0a 71%, #181616 100%); } }\\n  .hero.is-light {\\n    background-color: whitesmoke;\\n    color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-light a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-light strong {\\n      color: inherit; }\\n    .hero.is-light .title {\\n      color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-light .subtitle {\\n      color: rgba(0, 0, 0, 0.9); }\\n      .hero.is-light .subtitle a:not(.button),\\n      .hero.is-light .subtitle strong {\\n        color: rgba(0, 0, 0, 0.7); }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-light .navbar-menu {\\n        background-color: whitesmoke; } }\\n    .hero.is-light .navbar-item,\\n    .hero.is-light .navbar-link {\\n      color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-light a.navbar-item:hover, .hero.is-light a.navbar-item.is-active,\\n    .hero.is-light .navbar-link:hover,\\n    .hero.is-light .navbar-link.is-active {\\n      background-color: #e8e8e8;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-light .tabs a {\\n      color: rgba(0, 0, 0, 0.7);\\n      opacity: 0.9; }\\n      .hero.is-light .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-light .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-light .tabs.is-boxed a, .hero.is-light .tabs.is-toggle a {\\n      color: rgba(0, 0, 0, 0.7); }\\n      .hero.is-light .tabs.is-boxed a:hover, .hero.is-light .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-light .tabs.is-boxed li.is-active a, .hero.is-light .tabs.is-boxed li.is-active a:hover, .hero.is-light .tabs.is-toggle li.is-active a, .hero.is-light .tabs.is-toggle li.is-active a:hover {\\n      background-color: rgba(0, 0, 0, 0.7);\\n      border-color: rgba(0, 0, 0, 0.7);\\n      color: whitesmoke; }\\n    .hero.is-light.is-bold {\\n      background-image: linear-gradient(141deg, #dfd8d9 0%, whitesmoke 71%, white 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-light.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #dfd8d9 0%, whitesmoke 71%, white 100%); } }\\n  .hero.is-dark {\\n    background-color: #363636;\\n    color: #fff; }\\n    .hero.is-dark a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-dark strong {\\n      color: inherit; }\\n    .hero.is-dark .title {\\n      color: #fff; }\\n    .hero.is-dark .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-dark .subtitle a:not(.button),\\n      .hero.is-dark .subtitle strong {\\n        color: #fff; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-dark .navbar-menu {\\n        background-color: #363636; } }\\n    .hero.is-dark .navbar-item,\\n    .hero.is-dark .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-dark a.navbar-item:hover, .hero.is-dark a.navbar-item.is-active,\\n    .hero.is-dark .navbar-link:hover,\\n    .hero.is-dark .navbar-link.is-active {\\n      background-color: #292929;\\n      color: #fff; }\\n    .hero.is-dark .tabs a {\\n      color: #fff;\\n      opacity: 0.9; }\\n      .hero.is-dark .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-dark .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-dark .tabs.is-boxed a, .hero.is-dark .tabs.is-toggle a {\\n      color: #fff; }\\n      .hero.is-dark .tabs.is-boxed a:hover, .hero.is-dark .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-dark .tabs.is-boxed li.is-active a, .hero.is-dark .tabs.is-boxed li.is-active a:hover, .hero.is-dark .tabs.is-toggle li.is-active a, .hero.is-dark .tabs.is-toggle li.is-active a:hover {\\n      background-color: #fff;\\n      border-color: #fff;\\n      color: #363636; }\\n    .hero.is-dark.is-bold {\\n      background-image: linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-dark.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%); } }\\n  .hero.is-primary {\\n    background-color: #8A4D76;\\n    color: #fff; }\\n    .hero.is-primary a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-primary strong {\\n      color: inherit; }\\n    .hero.is-primary .title {\\n      color: #fff; }\\n    .hero.is-primary .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-primary .subtitle a:not(.button),\\n      .hero.is-primary .subtitle strong {\\n        color: #fff; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-primary .navbar-menu {\\n        background-color: #8A4D76; } }\\n    .hero.is-primary .navbar-item,\\n    .hero.is-primary .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-primary a.navbar-item:hover, .hero.is-primary a.navbar-item.is-active,\\n    .hero.is-primary .navbar-link:hover,\\n    .hero.is-primary .navbar-link.is-active {\\n      background-color: #7a4468;\\n      color: #fff; }\\n    .hero.is-primary .tabs a {\\n      color: #fff;\\n      opacity: 0.9; }\\n      .hero.is-primary .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-primary .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-primary .tabs.is-boxed a, .hero.is-primary .tabs.is-toggle a {\\n      color: #fff; }\\n      .hero.is-primary .tabs.is-boxed a:hover, .hero.is-primary .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-primary .tabs.is-boxed li.is-active a, .hero.is-primary .tabs.is-boxed li.is-active a:hover, .hero.is-primary .tabs.is-toggle li.is-active a, .hero.is-primary .tabs.is-toggle li.is-active a:hover {\\n      background-color: #fff;\\n      border-color: #fff;\\n      color: #8A4D76; }\\n    .hero.is-primary.is-bold {\\n      background-image: linear-gradient(141deg, #713367 0%, #8A4D76 71%, #a05079 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-primary.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #713367 0%, #8A4D76 71%, #a05079 100%); } }\\n  .hero.is-link {\\n    background-color: blue;\\n    color: #fff; }\\n    .hero.is-link a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-link strong {\\n      color: inherit; }\\n    .hero.is-link .title {\\n      color: #fff; }\\n    .hero.is-link .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-link .subtitle a:not(.button),\\n      .hero.is-link .subtitle strong {\\n        color: #fff; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-link .navbar-menu {\\n        background-color: blue; } }\\n    .hero.is-link .navbar-item,\\n    .hero.is-link .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-link a.navbar-item:hover, .hero.is-link a.navbar-item.is-active,\\n    .hero.is-link .navbar-link:hover,\\n    .hero.is-link .navbar-link.is-active {\\n      background-color: #0000e6;\\n      color: #fff; }\\n    .hero.is-link .tabs a {\\n      color: #fff;\\n      opacity: 0.9; }\\n      .hero.is-link .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-link .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-link .tabs.is-boxed a, .hero.is-link .tabs.is-toggle a {\\n      color: #fff; }\\n      .hero.is-link .tabs.is-boxed a:hover, .hero.is-link .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-link .tabs.is-boxed li.is-active a, .hero.is-link .tabs.is-boxed li.is-active a:hover, .hero.is-link .tabs.is-toggle li.is-active a, .hero.is-link .tabs.is-toggle li.is-active a:hover {\\n      background-color: #fff;\\n      border-color: #fff;\\n      color: blue; }\\n    .hero.is-link.is-bold {\\n      background-image: linear-gradient(141deg, #0022cc 0%, blue 71%, #401aff 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-link.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #0022cc 0%, blue 71%, #401aff 100%); } }\\n  .hero.is-info {\\n    background-color: #3298dc;\\n    color: #fff; }\\n    .hero.is-info a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-info strong {\\n      color: inherit; }\\n    .hero.is-info .title {\\n      color: #fff; }\\n    .hero.is-info .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-info .subtitle a:not(.button),\\n      .hero.is-info .subtitle strong {\\n        color: #fff; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-info .navbar-menu {\\n        background-color: #3298dc; } }\\n    .hero.is-info .navbar-item,\\n    .hero.is-info .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-info a.navbar-item:hover, .hero.is-info a.navbar-item.is-active,\\n    .hero.is-info .navbar-link:hover,\\n    .hero.is-info .navbar-link.is-active {\\n      background-color: #238cd1;\\n      color: #fff; }\\n    .hero.is-info .tabs a {\\n      color: #fff;\\n      opacity: 0.9; }\\n      .hero.is-info .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-info .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-info .tabs.is-boxed a, .hero.is-info .tabs.is-toggle a {\\n      color: #fff; }\\n      .hero.is-info .tabs.is-boxed a:hover, .hero.is-info .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-info .tabs.is-boxed li.is-active a, .hero.is-info .tabs.is-boxed li.is-active a:hover, .hero.is-info .tabs.is-toggle li.is-active a, .hero.is-info .tabs.is-toggle li.is-active a:hover {\\n      background-color: #fff;\\n      border-color: #fff;\\n      color: #3298dc; }\\n    .hero.is-info.is-bold {\\n      background-image: linear-gradient(141deg, #159dc6 0%, #3298dc 71%, #4389e5 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-info.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #159dc6 0%, #3298dc 71%, #4389e5 100%); } }\\n  .hero.is-success {\\n    background-color: #48c774;\\n    color: #fff; }\\n    .hero.is-success a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-success strong {\\n      color: inherit; }\\n    .hero.is-success .title {\\n      color: #fff; }\\n    .hero.is-success .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-success .subtitle a:not(.button),\\n      .hero.is-success .subtitle strong {\\n        color: #fff; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-success .navbar-menu {\\n        background-color: #48c774; } }\\n    .hero.is-success .navbar-item,\\n    .hero.is-success .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-success a.navbar-item:hover, .hero.is-success a.navbar-item.is-active,\\n    .hero.is-success .navbar-link:hover,\\n    .hero.is-success .navbar-link.is-active {\\n      background-color: #3abb67;\\n      color: #fff; }\\n    .hero.is-success .tabs a {\\n      color: #fff;\\n      opacity: 0.9; }\\n      .hero.is-success .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-success .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-success .tabs.is-boxed a, .hero.is-success .tabs.is-toggle a {\\n      color: #fff; }\\n      .hero.is-success .tabs.is-boxed a:hover, .hero.is-success .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-success .tabs.is-boxed li.is-active a, .hero.is-success .tabs.is-boxed li.is-active a:hover, .hero.is-success .tabs.is-toggle li.is-active a, .hero.is-success .tabs.is-toggle li.is-active a:hover {\\n      background-color: #fff;\\n      border-color: #fff;\\n      color: #48c774; }\\n    .hero.is-success.is-bold {\\n      background-image: linear-gradient(141deg, #29b342 0%, #48c774 71%, #56d296 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-success.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #29b342 0%, #48c774 71%, #56d296 100%); } }\\n  .hero.is-warning {\\n    background-color: #ffdd57;\\n    color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-warning a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-warning strong {\\n      color: inherit; }\\n    .hero.is-warning .title {\\n      color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-warning .subtitle {\\n      color: rgba(0, 0, 0, 0.9); }\\n      .hero.is-warning .subtitle a:not(.button),\\n      .hero.is-warning .subtitle strong {\\n        color: rgba(0, 0, 0, 0.7); }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-warning .navbar-menu {\\n        background-color: #ffdd57; } }\\n    .hero.is-warning .navbar-item,\\n    .hero.is-warning .navbar-link {\\n      color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-warning a.navbar-item:hover, .hero.is-warning a.navbar-item.is-active,\\n    .hero.is-warning .navbar-link:hover,\\n    .hero.is-warning .navbar-link.is-active {\\n      background-color: #ffd83d;\\n      color: rgba(0, 0, 0, 0.7); }\\n    .hero.is-warning .tabs a {\\n      color: rgba(0, 0, 0, 0.7);\\n      opacity: 0.9; }\\n      .hero.is-warning .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-warning .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-warning .tabs.is-boxed a, .hero.is-warning .tabs.is-toggle a {\\n      color: rgba(0, 0, 0, 0.7); }\\n      .hero.is-warning .tabs.is-boxed a:hover, .hero.is-warning .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-warning .tabs.is-boxed li.is-active a, .hero.is-warning .tabs.is-boxed li.is-active a:hover, .hero.is-warning .tabs.is-toggle li.is-active a, .hero.is-warning .tabs.is-toggle li.is-active a:hover {\\n      background-color: rgba(0, 0, 0, 0.7);\\n      border-color: rgba(0, 0, 0, 0.7);\\n      color: #ffdd57; }\\n    .hero.is-warning.is-bold {\\n      background-image: linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-warning.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%); } }\\n  .hero.is-danger {\\n    background-color: #f14668;\\n    color: #fff; }\\n    .hero.is-danger a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\\n    .hero.is-danger strong {\\n      color: inherit; }\\n    .hero.is-danger .title {\\n      color: #fff; }\\n    .hero.is-danger .subtitle {\\n      color: rgba(255, 255, 255, 0.9); }\\n      .hero.is-danger .subtitle a:not(.button),\\n      .hero.is-danger .subtitle strong {\\n        color: #fff; }\\n    @media screen and (max-width: 1023px) {\\n      .hero.is-danger .navbar-menu {\\n        background-color: #f14668; } }\\n    .hero.is-danger .navbar-item,\\n    .hero.is-danger .navbar-link {\\n      color: rgba(255, 255, 255, 0.7); }\\n    .hero.is-danger a.navbar-item:hover, .hero.is-danger a.navbar-item.is-active,\\n    .hero.is-danger .navbar-link:hover,\\n    .hero.is-danger .navbar-link.is-active {\\n      background-color: #ef2e55;\\n      color: #fff; }\\n    .hero.is-danger .tabs a {\\n      color: #fff;\\n      opacity: 0.9; }\\n      .hero.is-danger .tabs a:hover {\\n        opacity: 1; }\\n    .hero.is-danger .tabs li.is-active a {\\n      opacity: 1; }\\n    .hero.is-danger .tabs.is-boxed a, .hero.is-danger .tabs.is-toggle a {\\n      color: #fff; }\\n      .hero.is-danger .tabs.is-boxed a:hover, .hero.is-danger .tabs.is-toggle a:hover {\\n        background-color: rgba(10, 10, 10, 0.1); }\\n    .hero.is-danger .tabs.is-boxed li.is-active a, .hero.is-danger .tabs.is-boxed li.is-active a:hover, .hero.is-danger .tabs.is-toggle li.is-active a, .hero.is-danger .tabs.is-toggle li.is-active a:hover {\\n      background-color: #fff;\\n      border-color: #fff;\\n      color: #f14668; }\\n    .hero.is-danger.is-bold {\\n      background-image: linear-gradient(141deg, #fa0a62 0%, #f14668 71%, #f7595f 100%); }\\n      @media screen and (max-width: 768px) {\\n        .hero.is-danger.is-bold .navbar-menu {\\n          background-image: linear-gradient(141deg, #fa0a62 0%, #f14668 71%, #f7595f 100%); } }\\n  .hero.is-small .hero-body {\\n    padding-bottom: 1.5rem;\\n    padding-top: 1.5rem; }\\n  @media screen and (min-width: 769px), print {\\n    .hero.is-medium .hero-body {\\n      padding-bottom: 9rem;\\n      padding-top: 9rem; } }\\n  @media screen and (min-width: 769px), print {\\n    .hero.is-large .hero-body {\\n      padding-bottom: 18rem;\\n      padding-top: 18rem; } }\\n  .hero.is-halfheight .hero-body, .hero.is-fullheight .hero-body, .hero.is-fullheight-with-navbar .hero-body {\\n    align-items: center;\\n    display: flex; }\\n    .hero.is-halfheight .hero-body > .container, .hero.is-fullheight .hero-body > .container, .hero.is-fullheight-with-navbar .hero-body > .container {\\n      flex-grow: 1;\\n      flex-shrink: 1; }\\n  .hero.is-halfheight {\\n    min-height: 50vh; }\\n  .hero.is-fullheight {\\n    min-height: 100vh; }\\n\\n.hero-video {\\n  overflow: hidden; }\\n  .hero-video video {\\n    left: 50%;\\n    min-height: 100%;\\n    min-width: 100%;\\n    position: absolute;\\n    top: 50%;\\n    transform: translate3d(-50%, -50%, 0); }\\n  .hero-video.is-transparent {\\n    opacity: 0.3; }\\n  @media screen and (max-width: 768px) {\\n    .hero-video {\\n      display: none; } }\\n\\n.hero-buttons {\\n  margin-top: 1.5rem; }\\n  @media screen and (max-width: 768px) {\\n    .hero-buttons .button {\\n      display: flex; }\\n      .hero-buttons .button:not(:last-child) {\\n        margin-bottom: 0.75rem; } }\\n  @media screen and (min-width: 769px), print {\\n    .hero-buttons {\\n      display: flex;\\n      justify-content: center; }\\n      .hero-buttons .button:not(:last-child) {\\n        margin-right: 1.5rem; } }\\n\\n.hero-head,\\n.hero-foot {\\n  flex-grow: 0;\\n  flex-shrink: 0; }\\n\\n.hero-body {\\n  flex-grow: 1;\\n  flex-shrink: 0;\\n  padding: 3rem 1.5rem; }\\n\\n.section {\\n  padding: 3rem 1.5rem; }\\n  @media screen and (min-width: 1024px) {\\n    .section.is-medium {\\n      padding: 9rem 1.5rem; }\\n    .section.is-large {\\n      padding: 18rem 1.5rem; } }\\n\\nh4 {\\n  font-size: 125%;\\n  font-weight: 600; }\\n\\n.imagecaption {\\n  padding: 3px;\\n  margin: 10px;\\n  float: left;\\n  border: 1px solid black; }\\n\\nfigure {\\n  display: table;\\n  margin: 0px; }\\n\\nfigure img {\\n  display: block; }\\n\\nfigure figcaption {\\n  background: rgba(0, 0, 0, 0.5);\\n  color: #FFF;\\n  caption-side: bottom;\\n  text-align: center;\\n  border: 1px dotted blue; }\\n\\n.title {\\n  margin-top: 0.5rem; }\\n\\nbutton {\\n  padding: 4px; }\\n\", \"\"]);\n// Exports\nmodule.exports = exports;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL3NzZmwvc3RhdGljL2Nzcy9teXN0eWxlcy5jc3MuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zc2ZsL3N0YXRpYy9jc3MvbXlzdHlsZXMuY3NzPzFiZDciXSwic291cmNlc0NvbnRlbnQiOlsiLy8gSW1wb3J0c1xudmFyIF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyA9IHJlcXVpcmUoXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCIpO1xuZXhwb3J0cyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhmYWxzZSk7XG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCJAaW1wb3J0IHVybChodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2Nzcz9mYW1pbHk9TnVuaXRvOjQwMCw3MDApO1wiXSk7XG4vLyBNb2R1bGVcbmV4cG9ydHMucHVzaChbbW9kdWxlLmlkLCBcIkBrZXlmcmFtZXMgc3BpbkFyb3VuZCB7XFxuICBmcm9tIHtcXG4gICAgdHJhbnNmb3JtOiByb3RhdGUoMGRlZyk7IH1cXG4gIHRvIHtcXG4gICAgdHJhbnNmb3JtOiByb3RhdGUoMzU5ZGVnKTsgfSB9XFxuXFxuLmlzLXVuc2VsZWN0YWJsZSwgLmJ1dHRvbiwgLmZpbGUge1xcbiAgLXdlYmtpdC10b3VjaC1jYWxsb3V0OiBub25lO1xcbiAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcXG4gIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7XFxuICAtbXMtdXNlci1zZWxlY3Q6IG5vbmU7XFxuICB1c2VyLXNlbGVjdDogbm9uZTsgfVxcblxcbi5zZWxlY3Q6bm90KC5pcy1tdWx0aXBsZSk6bm90KC5pcy1sb2FkaW5nKTo6YWZ0ZXIsIC5uYXZiYXItbGluazpub3QoLmlzLWFycm93bGVzcyk6OmFmdGVyIHtcXG4gIGJvcmRlcjogM3B4IHNvbGlkIHRyYW5zcGFyZW50O1xcbiAgYm9yZGVyLXJhZGl1czogMnB4O1xcbiAgYm9yZGVyLXJpZ2h0OiAwO1xcbiAgYm9yZGVyLXRvcDogMDtcXG4gIGNvbnRlbnQ6IFxcXCIgXFxcIjtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgaGVpZ2h0OiAwLjYyNWVtO1xcbiAgbWFyZ2luLXRvcDogLTAuNDM3NWVtO1xcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDUwJTtcXG4gIHRyYW5zZm9ybTogcm90YXRlKC00NWRlZyk7XFxuICB0cmFuc2Zvcm0tb3JpZ2luOiBjZW50ZXI7XFxuICB3aWR0aDogMC42MjVlbTsgfVxcblxcbi50aXRsZTpub3QoOmxhc3QtY2hpbGQpLFxcbi5zdWJ0aXRsZTpub3QoOmxhc3QtY2hpbGQpIHtcXG4gIG1hcmdpbi1ib3R0b206IDEuNXJlbTsgfVxcblxcbi5idXR0b24uaXMtbG9hZGluZzo6YWZ0ZXIsIC5zZWxlY3QuaXMtbG9hZGluZzo6YWZ0ZXIsIC5jb250cm9sLmlzLWxvYWRpbmc6OmFmdGVyIHtcXG4gIGFuaW1hdGlvbjogc3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7XFxuICBib3JkZXI6IDJweCBzb2xpZCAjZGJkYmRiO1xcbiAgYm9yZGVyLXJhZGl1czogMjkwNDg2cHg7XFxuICBib3JkZXItcmlnaHQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgYm9yZGVyLXRvcC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICBjb250ZW50OiBcXFwiXFxcIjtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgaGVpZ2h0OiAxZW07XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICB3aWR0aDogMWVtOyB9XFxuXFxuLmlzLW92ZXJsYXksIC5oZXJvLXZpZGVvIHtcXG4gIGJvdHRvbTogMDtcXG4gIGxlZnQ6IDA7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICByaWdodDogMDtcXG4gIHRvcDogMDsgfVxcblxcbi5idXR0b24sIC5pbnB1dCwgLnRleHRhcmVhLCAuc2VsZWN0IHNlbGVjdCwgLmZpbGUtY3RhLFxcbi5maWxlLW5hbWUge1xcbiAgLW1vei1hcHBlYXJhbmNlOiBub25lO1xcbiAgLXdlYmtpdC1hcHBlYXJhbmNlOiBub25lO1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGJvcmRlcjogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xcbiAgYm94LXNoYWRvdzogbm9uZTtcXG4gIGRpc3BsYXk6IGlubGluZS1mbGV4O1xcbiAgZm9udC1zaXplOiAxcmVtO1xcbiAgaGVpZ2h0OiAyLjVlbTtcXG4gIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcXG4gIGxpbmUtaGVpZ2h0OiAxLjU7XFxuICBwYWRkaW5nLWJvdHRvbTogY2FsYygwLjVlbSAtIDJweCk7XFxuICBwYWRkaW5nLWxlZnQ6IGNhbGMoMC43NWVtIC0gMnB4KTtcXG4gIHBhZGRpbmctcmlnaHQ6IGNhbGMoMC43NWVtIC0gMnB4KTtcXG4gIHBhZGRpbmctdG9wOiBjYWxjKDAuNWVtIC0gMnB4KTtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gIHZlcnRpY2FsLWFsaWduOiB0b3A7IH1cXG4gIC5idXR0b246Zm9jdXMsIC5pbnB1dDpmb2N1cywgLnRleHRhcmVhOmZvY3VzLCAuc2VsZWN0IHNlbGVjdDpmb2N1cywgLmZpbGUtY3RhOmZvY3VzLFxcbiAgLmZpbGUtbmFtZTpmb2N1cywgLmlzLWZvY3VzZWQuYnV0dG9uLCAuaXMtZm9jdXNlZC5pbnB1dCwgLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5zZWxlY3Qgc2VsZWN0LmlzLWZvY3VzZWQsIC5pcy1mb2N1c2VkLmZpbGUtY3RhLFxcbiAgLmlzLWZvY3VzZWQuZmlsZS1uYW1lLCAuYnV0dG9uOmFjdGl2ZSwgLmlucHV0OmFjdGl2ZSwgLnRleHRhcmVhOmFjdGl2ZSwgLnNlbGVjdCBzZWxlY3Q6YWN0aXZlLCAuZmlsZS1jdGE6YWN0aXZlLFxcbiAgLmZpbGUtbmFtZTphY3RpdmUsIC5pcy1hY3RpdmUuYnV0dG9uLCAuaXMtYWN0aXZlLmlucHV0LCAuaXMtYWN0aXZlLnRleHRhcmVhLCAuc2VsZWN0IHNlbGVjdC5pcy1hY3RpdmUsIC5pcy1hY3RpdmUuZmlsZS1jdGEsXFxuICAuaXMtYWN0aXZlLmZpbGUtbmFtZSB7XFxuICAgIG91dGxpbmU6IG5vbmU7IH1cXG4gIC5idXR0b25bZGlzYWJsZWRdLCAuaW5wdXRbZGlzYWJsZWRdLCAudGV4dGFyZWFbZGlzYWJsZWRdLCAuc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF0sIC5maWxlLWN0YVtkaXNhYmxlZF0sXFxuICAuZmlsZS1uYW1lW2Rpc2FibGVkXSxcXG4gIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLFxcbiAgZmllbGRzZXRbZGlzYWJsZWRdIC5pbnB1dCxcXG4gIGZpZWxkc2V0W2Rpc2FibGVkXSAudGV4dGFyZWEsXFxuICBmaWVsZHNldFtkaXNhYmxlZF0gLnNlbGVjdCBzZWxlY3QsXFxuICAuc2VsZWN0IGZpZWxkc2V0W2Rpc2FibGVkXSBzZWxlY3QsXFxuICBmaWVsZHNldFtkaXNhYmxlZF0gLmZpbGUtY3RhLFxcbiAgZmllbGRzZXRbZGlzYWJsZWRdIC5maWxlLW5hbWUge1xcbiAgICBjdXJzb3I6IG5vdC1hbGxvd2VkOyB9XFxuXFxuLyohIG1pbmlyZXNldC5jc3MgdjAuMC42IHwgTUlUIExpY2Vuc2UgfCBnaXRodWIuY29tL2pndGhtcy9taW5pcmVzZXQuY3NzICovXFxuaHRtbCxcXG5ib2R5LFxcbnAsXFxub2wsXFxudWwsXFxubGksXFxuZGwsXFxuZHQsXFxuZGQsXFxuYmxvY2txdW90ZSxcXG5maWd1cmUsXFxuZmllbGRzZXQsXFxubGVnZW5kLFxcbnRleHRhcmVhLFxcbnByZSxcXG5pZnJhbWUsXFxuaHIsXFxuaDEsXFxuaDIsXFxuaDMsXFxuaDQsXFxuaDUsXFxuaDYge1xcbiAgbWFyZ2luOiAwO1xcbiAgcGFkZGluZzogMDsgfVxcblxcbmgxLFxcbmgyLFxcbmgzLFxcbmg0LFxcbmg1LFxcbmg2IHtcXG4gIGZvbnQtc2l6ZTogMTAwJTtcXG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7IH1cXG5cXG51bCB7XFxuICBsaXN0LXN0eWxlOiBub25lOyB9XFxuXFxuYnV0dG9uLFxcbmlucHV0LFxcbnNlbGVjdCxcXG50ZXh0YXJlYSB7XFxuICBtYXJnaW46IDA7IH1cXG5cXG5odG1sIHtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7IH1cXG5cXG4qLCAqOjpiZWZvcmUsICo6OmFmdGVyIHtcXG4gIGJveC1zaXppbmc6IGluaGVyaXQ7IH1cXG5cXG5pbWcsXFxudmlkZW8ge1xcbiAgaGVpZ2h0OiBhdXRvO1xcbiAgbWF4LXdpZHRoOiAxMDAlOyB9XFxuXFxuaWZyYW1lIHtcXG4gIGJvcmRlcjogMDsgfVxcblxcbnRhYmxlIHtcXG4gIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XFxuICBib3JkZXItc3BhY2luZzogMDsgfVxcblxcbnRkLFxcbnRoIHtcXG4gIHBhZGRpbmc6IDA7IH1cXG4gIHRkOm5vdChbYWxpZ25dKSxcXG4gIHRoOm5vdChbYWxpZ25dKSB7XFxuICAgIHRleHQtYWxpZ246IGxlZnQ7IH1cXG5cXG5odG1sIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICNFRkYwRUI7XFxuICBmb250LXNpemU6IDE2cHg7XFxuICAtbW96LW9zeC1mb250LXNtb290aGluZzogZ3JheXNjYWxlO1xcbiAgLXdlYmtpdC1mb250LXNtb290aGluZzogYW50aWFsaWFzZWQ7XFxuICBtaW4td2lkdGg6IDMwMHB4O1xcbiAgb3ZlcmZsb3cteDogaGlkZGVuO1xcbiAgb3ZlcmZsb3cteTogc2Nyb2xsO1xcbiAgdGV4dC1yZW5kZXJpbmc6IG9wdGltaXplTGVnaWJpbGl0eTtcXG4gIHRleHQtc2l6ZS1hZGp1c3Q6IDEwMCU7IH1cXG5cXG5hcnRpY2xlLFxcbmFzaWRlLFxcbmZpZ3VyZSxcXG5mb290ZXIsXFxuaGVhZGVyLFxcbmhncm91cCxcXG5zZWN0aW9uIHtcXG4gIGRpc3BsYXk6IGJsb2NrOyB9XFxuXFxuYm9keSxcXG5idXR0b24sXFxuaW5wdXQsXFxuc2VsZWN0LFxcbnRleHRhcmVhIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiTnVuaXRvXFxcIiwgc2Fucy1zZXJpZjsgfVxcblxcbmNvZGUsXFxucHJlIHtcXG4gIC1tb3otb3N4LWZvbnQtc21vb3RoaW5nOiBhdXRvO1xcbiAgLXdlYmtpdC1mb250LXNtb290aGluZzogYXV0bztcXG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7IH1cXG5cXG5ib2R5IHtcXG4gIGNvbG9yOiAjNzU3NzYzO1xcbiAgZm9udC1zaXplOiAxZW07XFxuICBmb250LXdlaWdodDogNDAwO1xcbiAgbGluZS1oZWlnaHQ6IDEuNTsgfVxcblxcbmEge1xcbiAgY29sb3I6IGJsdWU7XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7IH1cXG4gIGEgc3Ryb25nIHtcXG4gICAgY29sb3I6IGN1cnJlbnRDb2xvcjsgfVxcbiAgYTpob3ZlciB7XFxuICAgIGNvbG9yOiAjMzYzNjM2OyB9XFxuXFxuY29kZSB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgY29sb3I6ICNmMTQ2Njg7XFxuICBmb250LXNpemU6IDAuODc1ZW07XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgcGFkZGluZzogMC4yNWVtIDAuNWVtIDAuMjVlbTsgfVxcblxcbmhyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICBib3JkZXI6IG5vbmU7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIGhlaWdodDogMnB4O1xcbiAgbWFyZ2luOiAxLjVyZW0gMDsgfVxcblxcbmltZyB7XFxuICBoZWlnaHQ6IGF1dG87XFxuICBtYXgtd2lkdGg6IDEwMCU7IH1cXG5cXG5pbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJdLFxcbmlucHV0W3R5cGU9XFxcInJhZGlvXFxcIl0ge1xcbiAgdmVydGljYWwtYWxpZ246IGJhc2VsaW5lOyB9XFxuXFxuc21hbGwge1xcbiAgZm9udC1zaXplOiAwLjg3NWVtOyB9XFxuXFxuc3BhbiB7XFxuICBmb250LXN0eWxlOiBpbmhlcml0O1xcbiAgZm9udC13ZWlnaHQ6IGluaGVyaXQ7IH1cXG5cXG5zdHJvbmcge1xcbiAgY29sb3I6ICMzNjM2MzY7XFxuICBmb250LXdlaWdodDogNzAwOyB9XFxuXFxuZmllbGRzZXQge1xcbiAgYm9yZGVyOiBub25lOyB9XFxuXFxucHJlIHtcXG4gIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaDtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICBjb2xvcjogIzc1Nzc2MztcXG4gIGZvbnQtc2l6ZTogMC44NzVlbTtcXG4gIG92ZXJmbG93LXg6IGF1dG87XFxuICBwYWRkaW5nOiAxLjI1cmVtIDEuNXJlbTtcXG4gIHdoaXRlLXNwYWNlOiBwcmU7XFxuICB3b3JkLXdyYXA6IG5vcm1hbDsgfVxcbiAgcHJlIGNvZGUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6IGN1cnJlbnRDb2xvcjtcXG4gICAgZm9udC1zaXplOiAxZW07XFxuICAgIHBhZGRpbmc6IDA7IH1cXG5cXG50YWJsZSB0ZCxcXG50YWJsZSB0aCB7XFxuICB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB9XFxuICB0YWJsZSB0ZDpub3QoW2FsaWduXSksXFxuICB0YWJsZSB0aDpub3QoW2FsaWduXSkge1xcbiAgICB0ZXh0LWFsaWduOiBsZWZ0OyB9XFxuXFxudGFibGUgdGgge1xcbiAgY29sb3I6ICMzNjM2MzY7IH1cXG5cXG4uaXMtY2xlYXJmaXg6OmFmdGVyIHtcXG4gIGNsZWFyOiBib3RoO1xcbiAgY29udGVudDogXFxcIiBcXFwiO1xcbiAgZGlzcGxheTogdGFibGU7IH1cXG5cXG4uaXMtcHVsbGVkLWxlZnQge1xcbiAgZmxvYXQ6IGxlZnQgIWltcG9ydGFudDsgfVxcblxcbi5pcy1wdWxsZWQtcmlnaHQge1xcbiAgZmxvYXQ6IHJpZ2h0ICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtY2xpcHBlZCB7XFxuICBvdmVyZmxvdzogaGlkZGVuICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtc2l6ZS0xIHtcXG4gIGZvbnQtc2l6ZTogM3JlbSAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXNpemUtMiB7XFxuICBmb250LXNpemU6IDIuNXJlbSAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXNpemUtMyB7XFxuICBmb250LXNpemU6IDJyZW0gIWltcG9ydGFudDsgfVxcblxcbi5pcy1zaXplLTQge1xcbiAgZm9udC1zaXplOiAxLjVyZW0gIWltcG9ydGFudDsgfVxcblxcbi5pcy1zaXplLTUge1xcbiAgZm9udC1zaXplOiAxLjI1cmVtICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtc2l6ZS02IHtcXG4gIGZvbnQtc2l6ZTogMXJlbSAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXNpemUtNyB7XFxuICBmb250LXNpemU6IDAuNzVyZW0gIWltcG9ydGFudDsgfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAuaXMtc2l6ZS0xLW1vYmlsZSB7XFxuICAgIGZvbnQtc2l6ZTogM3JlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS0yLW1vYmlsZSB7XFxuICAgIGZvbnQtc2l6ZTogMi41cmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTMtbW9iaWxlIHtcXG4gICAgZm9udC1zaXplOiAycmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTQtbW9iaWxlIHtcXG4gICAgZm9udC1zaXplOiAxLjVyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNS1tb2JpbGUge1xcbiAgICBmb250LXNpemU6IDEuMjVyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNi1tb2JpbGUge1xcbiAgICBmb250LXNpemU6IDFyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNy1tb2JpbGUge1xcbiAgICBmb250LXNpemU6IDAuNzVyZW0gIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAuaXMtc2l6ZS0xLXRhYmxldCB7XFxuICAgIGZvbnQtc2l6ZTogM3JlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS0yLXRhYmxldCB7XFxuICAgIGZvbnQtc2l6ZTogMi41cmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTMtdGFibGV0IHtcXG4gICAgZm9udC1zaXplOiAycmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTQtdGFibGV0IHtcXG4gICAgZm9udC1zaXplOiAxLjVyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNS10YWJsZXQge1xcbiAgICBmb250LXNpemU6IDEuMjVyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNi10YWJsZXQge1xcbiAgICBmb250LXNpemU6IDFyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNy10YWJsZXQge1xcbiAgICBmb250LXNpemU6IDAuNzVyZW0gIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaXMtc2l6ZS0xLXRvdWNoIHtcXG4gICAgZm9udC1zaXplOiAzcmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTItdG91Y2gge1xcbiAgICBmb250LXNpemU6IDIuNXJlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS0zLXRvdWNoIHtcXG4gICAgZm9udC1zaXplOiAycmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTQtdG91Y2gge1xcbiAgICBmb250LXNpemU6IDEuNXJlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS01LXRvdWNoIHtcXG4gICAgZm9udC1zaXplOiAxLjI1cmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTYtdG91Y2gge1xcbiAgICBmb250LXNpemU6IDFyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNy10b3VjaCB7XFxuICAgIGZvbnQtc2l6ZTogMC43NXJlbSAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gIC5pcy1zaXplLTEtZGVza3RvcCB7XFxuICAgIGZvbnQtc2l6ZTogM3JlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS0yLWRlc2t0b3Age1xcbiAgICBmb250LXNpemU6IDIuNXJlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS0zLWRlc2t0b3Age1xcbiAgICBmb250LXNpemU6IDJyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNC1kZXNrdG9wIHtcXG4gICAgZm9udC1zaXplOiAxLjVyZW0gIWltcG9ydGFudDsgfVxcbiAgLmlzLXNpemUtNS1kZXNrdG9wIHtcXG4gICAgZm9udC1zaXplOiAxLjI1cmVtICFpbXBvcnRhbnQ7IH1cXG4gIC5pcy1zaXplLTYtZGVza3RvcCB7XFxuICAgIGZvbnQtc2l6ZTogMXJlbSAhaW1wb3J0YW50OyB9XFxuICAuaXMtc2l6ZS03LWRlc2t0b3Age1xcbiAgICBmb250LXNpemU6IDAuNzVyZW0gIWltcG9ydGFudDsgfSB9XFxuXFxuLmhhcy10ZXh0LWNlbnRlcmVkIHtcXG4gIHRleHQtYWxpZ246IGNlbnRlciAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWp1c3RpZmllZCB7XFxuICB0ZXh0LWFsaWduOiBqdXN0aWZ5ICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtbGVmdCB7XFxuICB0ZXh0LWFsaWduOiBsZWZ0ICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtcmlnaHQge1xcbiAgdGV4dC1hbGlnbjogcmlnaHQgIWltcG9ydGFudDsgfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAuaGFzLXRleHQtY2VudGVyZWQtbW9iaWxlIHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSwgcHJpbnQge1xcbiAgLmhhcy10ZXh0LWNlbnRlcmVkLXRhYmxldCB7XFxuICAgIHRleHQtYWxpZ246IGNlbnRlciAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmhhcy10ZXh0LWNlbnRlcmVkLXRhYmxldC1vbmx5IHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmhhcy10ZXh0LWNlbnRlcmVkLXRvdWNoIHtcXG4gICAgdGV4dC1hbGlnbjogY2VudGVyICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgLmhhcy10ZXh0LWNlbnRlcmVkLWRlc2t0b3Age1xcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXIgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpIHtcXG4gIC5oYXMtdGV4dC1qdXN0aWZpZWQtbW9iaWxlIHtcXG4gICAgdGV4dC1hbGlnbjoganVzdGlmeSAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCksIHByaW50IHtcXG4gIC5oYXMtdGV4dC1qdXN0aWZpZWQtdGFibGV0IHtcXG4gICAgdGV4dC1hbGlnbjoganVzdGlmeSAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmhhcy10ZXh0LWp1c3RpZmllZC10YWJsZXQtb25seSB7XFxuICAgIHRleHQtYWxpZ246IGp1c3RpZnkgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaGFzLXRleHQtanVzdGlmaWVkLXRvdWNoIHtcXG4gICAgdGV4dC1hbGlnbjoganVzdGlmeSAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gIC5oYXMtdGV4dC1qdXN0aWZpZWQtZGVza3RvcCB7XFxuICAgIHRleHQtYWxpZ246IGp1c3RpZnkgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpIHtcXG4gIC5oYXMtdGV4dC1sZWZ0LW1vYmlsZSB7XFxuICAgIHRleHQtYWxpZ246IGxlZnQgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAuaGFzLXRleHQtbGVmdC10YWJsZXQge1xcbiAgICB0ZXh0LWFsaWduOiBsZWZ0ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaGFzLXRleHQtbGVmdC10YWJsZXQtb25seSB7XFxuICAgIHRleHQtYWxpZ246IGxlZnQgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaGFzLXRleHQtbGVmdC10b3VjaCB7XFxuICAgIHRleHQtYWxpZ246IGxlZnQgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAuaGFzLXRleHQtbGVmdC1kZXNrdG9wIHtcXG4gICAgdGV4dC1hbGlnbjogbGVmdCAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgLmhhcy10ZXh0LXJpZ2h0LW1vYmlsZSB7XFxuICAgIHRleHQtYWxpZ246IHJpZ2h0ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSwgcHJpbnQge1xcbiAgLmhhcy10ZXh0LXJpZ2h0LXRhYmxldCB7XFxuICAgIHRleHQtYWxpZ246IHJpZ2h0ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaGFzLXRleHQtcmlnaHQtdGFibGV0LW9ubHkge1xcbiAgICB0ZXh0LWFsaWduOiByaWdodCAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gIC5oYXMtdGV4dC1yaWdodC10b3VjaCB7XFxuICAgIHRleHQtYWxpZ246IHJpZ2h0ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgLmhhcy10ZXh0LXJpZ2h0LWRlc2t0b3Age1xcbiAgICB0ZXh0LWFsaWduOiByaWdodCAhaW1wb3J0YW50OyB9IH1cXG5cXG4uaXMtY2FwaXRhbGl6ZWQge1xcbiAgdGV4dC10cmFuc2Zvcm06IGNhcGl0YWxpemUgIWltcG9ydGFudDsgfVxcblxcbi5pcy1sb3dlcmNhc2Uge1xcbiAgdGV4dC10cmFuc2Zvcm06IGxvd2VyY2FzZSAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXVwcGVyY2FzZSB7XFxuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtaXRhbGljIHtcXG4gIGZvbnQtc3R5bGU6IGl0YWxpYyAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LXdoaXRlIHtcXG4gIGNvbG9yOiB3aGl0ZSAhaW1wb3J0YW50OyB9XFxuXFxuYS5oYXMtdGV4dC13aGl0ZTpob3ZlciwgYS5oYXMtdGV4dC13aGl0ZTpmb2N1cyB7XFxuICBjb2xvcjogI2U2ZTZlNiAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy1iYWNrZ3JvdW5kLXdoaXRlIHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtYmxhY2sge1xcbiAgY29sb3I6ICMwYTBhMGEgIWltcG9ydGFudDsgfVxcblxcbmEuaGFzLXRleHQtYmxhY2s6aG92ZXIsIGEuaGFzLXRleHQtYmxhY2s6Zm9jdXMge1xcbiAgY29sb3I6IGJsYWNrICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtYmxhY2sge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYSAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWxpZ2h0IHtcXG4gIGNvbG9yOiB3aGl0ZXNtb2tlICFpbXBvcnRhbnQ7IH1cXG5cXG5hLmhhcy10ZXh0LWxpZ2h0OmhvdmVyLCBhLmhhcy10ZXh0LWxpZ2h0OmZvY3VzIHtcXG4gIGNvbG9yOiAjZGJkYmRiICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtbGlnaHQge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGVzbW9rZSAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWRhcmsge1xcbiAgY29sb3I6ICMzNjM2MzYgIWltcG9ydGFudDsgfVxcblxcbmEuaGFzLXRleHQtZGFyazpob3ZlciwgYS5oYXMtdGV4dC1kYXJrOmZvY3VzIHtcXG4gIGNvbG9yOiAjMWMxYzFjICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtZGFyayB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzYzNjM2ICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtcHJpbWFyeSB7XFxuICBjb2xvcjogIzhBNEQ3NiAhaW1wb3J0YW50OyB9XFxuXFxuYS5oYXMtdGV4dC1wcmltYXJ5OmhvdmVyLCBhLmhhcy10ZXh0LXByaW1hcnk6Zm9jdXMge1xcbiAgY29sb3I6ICM2OTNiNWEgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtYmFja2dyb3VuZC1wcmltYXJ5IHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICM4QTRENzYgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtdGV4dC1saW5rIHtcXG4gIGNvbG9yOiBibHVlICFpbXBvcnRhbnQ7IH1cXG5cXG5hLmhhcy10ZXh0LWxpbms6aG92ZXIsIGEuaGFzLXRleHQtbGluazpmb2N1cyB7XFxuICBjb2xvcjogIzAwMDBjYyAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy1iYWNrZ3JvdW5kLWxpbmsge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogYmx1ZSAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWluZm8ge1xcbiAgY29sb3I6ICMzMjk4ZGMgIWltcG9ydGFudDsgfVxcblxcbmEuaGFzLXRleHQtaW5mbzpob3ZlciwgYS5oYXMtdGV4dC1pbmZvOmZvY3VzIHtcXG4gIGNvbG9yOiAjMjA3ZGJjICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtaW5mbyB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzI5OGRjICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtc3VjY2VzcyB7XFxuICBjb2xvcjogIzQ4Yzc3NCAhaW1wb3J0YW50OyB9XFxuXFxuYS5oYXMtdGV4dC1zdWNjZXNzOmhvdmVyLCBhLmhhcy10ZXh0LXN1Y2Nlc3M6Zm9jdXMge1xcbiAgY29sb3I6ICMzNGE4NWMgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtYmFja2dyb3VuZC1zdWNjZXNzIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICM0OGM3NzQgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtdGV4dC13YXJuaW5nIHtcXG4gIGNvbG9yOiAjZmZkZDU3ICFpbXBvcnRhbnQ7IH1cXG5cXG5hLmhhcy10ZXh0LXdhcm5pbmc6aG92ZXIsIGEuaGFzLXRleHQtd2FybmluZzpmb2N1cyB7XFxuICBjb2xvcjogI2ZmZDMyNCAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy1iYWNrZ3JvdW5kLXdhcm5pbmcge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZGQ1NyAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWRhbmdlciB7XFxuICBjb2xvcjogI2YxNDY2OCAhaW1wb3J0YW50OyB9XFxuXFxuYS5oYXMtdGV4dC1kYW5nZXI6aG92ZXIsIGEuaGFzLXRleHQtZGFuZ2VyOmZvY3VzIHtcXG4gIGNvbG9yOiAjZWUxNzQyICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtZGFuZ2VyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICNmMTQ2NjggIWltcG9ydGFudDsgfVxcblxcbi5oYXMtdGV4dC1ibGFjay1iaXMge1xcbiAgY29sb3I6ICMxMjEyMTIgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtYmFja2dyb3VuZC1ibGFjay1iaXMge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEyMTIxMiAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWJsYWNrLXRlciB7XFxuICBjb2xvcjogIzI0MjQyNCAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy1iYWNrZ3JvdW5kLWJsYWNrLXRlciB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjQyNDI0ICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtZ3JleS1kYXJrZXIge1xcbiAgY29sb3I6ICMzNjM2MzYgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtYmFja2dyb3VuZC1ncmV5LWRhcmtlciB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzYzNjM2ICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtZ3JleS1kYXJrIHtcXG4gIGNvbG9yOiAjNzU3NzYzICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtZ3JleS1kYXJrIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICM3NTc3NjMgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtdGV4dC1ncmV5IHtcXG4gIGNvbG9yOiAjN2E3YTdhICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtZ3JleSB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjN2E3YTdhICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtZ3JleS1saWdodCB7XFxuICBjb2xvcjogI0QwRDFDRCAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy1iYWNrZ3JvdW5kLWdyZXktbGlnaHQge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI0QwRDFDRCAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LWdyZXktbGlnaHRlciB7XFxuICBjb2xvcjogI2RiZGJkYiAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy1iYWNrZ3JvdW5kLWdyZXktbGlnaHRlciB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGJkYmRiICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtd2hpdGUtdGVyIHtcXG4gIGNvbG9yOiB3aGl0ZXNtb2tlICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2UgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtdGV4dC13aGl0ZS1iaXMge1xcbiAgY29sb3I6ICNmYWZhZmEgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtYmFja2dyb3VuZC13aGl0ZS1iaXMge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZhZmFmYSAhaW1wb3J0YW50OyB9XFxuXFxuLmhhcy10ZXh0LXdlaWdodC1saWdodCB7XFxuICBmb250LXdlaWdodDogMzAwICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtd2VpZ2h0LW5vcm1hbCB7XFxuICBmb250LXdlaWdodDogNDAwICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtd2VpZ2h0LW1lZGl1bSB7XFxuICBmb250LXdlaWdodDogNTAwICFpbXBvcnRhbnQ7IH1cXG5cXG4uaGFzLXRleHQtd2VpZ2h0LXNlbWlib2xkIHtcXG4gIGZvbnQtd2VpZ2h0OiA2MDAgIWltcG9ydGFudDsgfVxcblxcbi5oYXMtdGV4dC13ZWlnaHQtYm9sZCB7XFxuICBmb250LXdlaWdodDogNzAwICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtZmFtaWx5LXByaW1hcnkge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJOdW5pdG9cXFwiLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtZmFtaWx5LXNlY29uZGFyeSB7XFxuICBmb250LWZhbWlseTogXFxcIk51bml0b1xcXCIsIHNhbnMtc2VyaWYgIWltcG9ydGFudDsgfVxcblxcbi5pcy1mYW1pbHktc2Fucy1zZXJpZiB7XFxuICBmb250LWZhbWlseTogXFxcIk51bml0b1xcXCIsIHNhbnMtc2VyaWYgIWltcG9ydGFudDsgfVxcblxcbi5pcy1mYW1pbHktbW9ub3NwYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBtb25vc3BhY2UgIWltcG9ydGFudDsgfVxcblxcbi5pcy1mYW1pbHktY29kZSB7XFxuICBmb250LWZhbWlseTogbW9ub3NwYWNlICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtYmxvY2sge1xcbiAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDsgfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAuaXMtYmxvY2stbW9iaWxlIHtcXG4gICAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAuaXMtYmxvY2stdGFibGV0IHtcXG4gICAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gIC5pcy1ibG9jay10YWJsZXQtb25seSB7XFxuICAgIGRpc3BsYXk6IGJsb2NrICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWJsb2NrLXRvdWNoIHtcXG4gICAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAuaXMtYmxvY2stZGVza3RvcCB7XFxuICAgIGRpc3BsYXk6IGJsb2NrICFpbXBvcnRhbnQ7IH0gfVxcblxcbi5pcy1mbGV4IHtcXG4gIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDsgfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAuaXMtZmxleC1tb2JpbGUge1xcbiAgICBkaXNwbGF5OiBmbGV4ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSwgcHJpbnQge1xcbiAgLmlzLWZsZXgtdGFibGV0IHtcXG4gICAgZGlzcGxheTogZmxleCAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWZsZXgtdGFibGV0LW9ubHkge1xcbiAgICBkaXNwbGF5OiBmbGV4ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWZsZXgtdG91Y2gge1xcbiAgICBkaXNwbGF5OiBmbGV4ICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgLmlzLWZsZXgtZGVza3RvcCB7XFxuICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDsgfSB9XFxuXFxuLmlzLWlubGluZSB7XFxuICBkaXNwbGF5OiBpbmxpbmUgIWltcG9ydGFudDsgfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAuaXMtaW5saW5lLW1vYmlsZSB7XFxuICAgIGRpc3BsYXk6IGlubGluZSAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCksIHByaW50IHtcXG4gIC5pcy1pbmxpbmUtdGFibGV0IHtcXG4gICAgZGlzcGxheTogaW5saW5lICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaXMtaW5saW5lLXRhYmxldC1vbmx5IHtcXG4gICAgZGlzcGxheTogaW5saW5lICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWlubGluZS10b3VjaCB7XFxuICAgIGRpc3BsYXk6IGlubGluZSAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gIC5pcy1pbmxpbmUtZGVza3RvcCB7XFxuICAgIGRpc3BsYXk6IGlubGluZSAhaW1wb3J0YW50OyB9IH1cXG5cXG4uaXMtaW5saW5lLWJsb2NrIHtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jayAhaW1wb3J0YW50OyB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpIHtcXG4gIC5pcy1pbmxpbmUtYmxvY2stbW9iaWxlIHtcXG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSwgcHJpbnQge1xcbiAgLmlzLWlubGluZS1ibG9jay10YWJsZXQge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2sgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gIC5pcy1pbmxpbmUtYmxvY2stdGFibGV0LW9ubHkge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2sgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaXMtaW5saW5lLWJsb2NrLXRvdWNoIHtcXG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgLmlzLWlubGluZS1ibG9jay1kZXNrdG9wIHtcXG4gICAgZGlzcGxheTogaW5saW5lLWJsb2NrICFpbXBvcnRhbnQ7IH0gfVxcblxcbi5pcy1pbmxpbmUtZmxleCB7XFxuICBkaXNwbGF5OiBpbmxpbmUtZmxleCAhaW1wb3J0YW50OyB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpIHtcXG4gIC5pcy1pbmxpbmUtZmxleC1tb2JpbGUge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleCAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCksIHByaW50IHtcXG4gIC5pcy1pbmxpbmUtZmxleC10YWJsZXQge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleCAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWlubGluZS1mbGV4LXRhYmxldC1vbmx5IHtcXG4gICAgZGlzcGxheTogaW5saW5lLWZsZXggIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAuaXMtaW5saW5lLWZsZXgtdG91Y2gge1xcbiAgICBkaXNwbGF5OiBpbmxpbmUtZmxleCAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gIC5pcy1pbmxpbmUtZmxleC1kZXNrdG9wIHtcXG4gICAgZGlzcGxheTogaW5saW5lLWZsZXggIWltcG9ydGFudDsgfSB9XFxuXFxuLmlzLWhpZGRlbiB7XFxuICBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtc3Itb25seSB7XFxuICBib3JkZXI6IG5vbmUgIWltcG9ydGFudDtcXG4gIGNsaXA6IHJlY3QoMCwgMCwgMCwgMCkgIWltcG9ydGFudDtcXG4gIGhlaWdodDogMC4wMWVtICFpbXBvcnRhbnQ7XFxuICBvdmVyZmxvdzogaGlkZGVuICFpbXBvcnRhbnQ7XFxuICBwYWRkaW5nOiAwICFpbXBvcnRhbnQ7XFxuICBwb3NpdGlvbjogYWJzb2x1dGUgIWltcG9ydGFudDtcXG4gIHdoaXRlLXNwYWNlOiBub3dyYXAgIWltcG9ydGFudDtcXG4gIHdpZHRoOiAwLjAxZW0gIWltcG9ydGFudDsgfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAuaXMtaGlkZGVuLW1vYmlsZSB7XFxuICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAuaXMtaGlkZGVuLXRhYmxldCB7XFxuICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gIC5pcy1oaWRkZW4tdGFibGV0LW9ubHkge1xcbiAgICBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWhpZGRlbi10b3VjaCB7XFxuICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAuaXMtaGlkZGVuLWRlc2t0b3Age1xcbiAgICBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gfVxcblxcbi5pcy1pbnZpc2libGUge1xcbiAgdmlzaWJpbGl0eTogaGlkZGVuICFpbXBvcnRhbnQ7IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgLmlzLWludmlzaWJsZS1tb2JpbGUge1xcbiAgICB2aXNpYmlsaXR5OiBoaWRkZW4gIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAuaXMtaW52aXNpYmxlLXRhYmxldCB7XFxuICAgIHZpc2liaWxpdHk6IGhpZGRlbiAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgLmlzLWludmlzaWJsZS10YWJsZXQtb25seSB7XFxuICAgIHZpc2liaWxpdHk6IGhpZGRlbiAhaW1wb3J0YW50OyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gIC5pcy1pbnZpc2libGUtdG91Y2gge1xcbiAgICB2aXNpYmlsaXR5OiBoaWRkZW4gIWltcG9ydGFudDsgfSB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAuaXMtaW52aXNpYmxlLWRlc2t0b3Age1xcbiAgICB2aXNpYmlsaXR5OiBoaWRkZW4gIWltcG9ydGFudDsgfSB9XFxuXFxuLmlzLW1hcmdpbmxlc3Mge1xcbiAgbWFyZ2luOiAwICFpbXBvcnRhbnQ7IH1cXG5cXG4uaXMtcGFkZGluZ2xlc3Mge1xcbiAgcGFkZGluZzogMCAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXJhZGl1c2xlc3Mge1xcbiAgYm9yZGVyLXJhZGl1czogMCAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXNoYWRvd2xlc3Mge1xcbiAgYm94LXNoYWRvdzogbm9uZSAhaW1wb3J0YW50OyB9XFxuXFxuLmlzLXJlbGF0aXZlIHtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZSAhaW1wb3J0YW50OyB9XFxuXFxuLmJ1dHRvbiB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gIGJvcmRlci1jb2xvcjogI2RiZGJkYjtcXG4gIGJvcmRlci13aWR0aDogMnB4O1xcbiAgY29sb3I6ICMzNjM2MzY7XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIHBhZGRpbmctYm90dG9tOiBjYWxjKDAuNWVtIC0gMnB4KTtcXG4gIHBhZGRpbmctbGVmdDogMWVtO1xcbiAgcGFkZGluZy1yaWdodDogMWVtO1xcbiAgcGFkZGluZy10b3A6IGNhbGMoMC41ZW0gLSAycHgpO1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxcbiAgLmJ1dHRvbiBzdHJvbmcge1xcbiAgICBjb2xvcjogaW5oZXJpdDsgfVxcbiAgLmJ1dHRvbiAuaWNvbiwgLmJ1dHRvbiAuaWNvbi5pcy1zbWFsbCwgLmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW0sIC5idXR0b24gLmljb24uaXMtbGFyZ2Uge1xcbiAgICBoZWlnaHQ6IDEuNWVtO1xcbiAgICB3aWR0aDogMS41ZW07IH1cXG4gIC5idXR0b24gLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKSB7XFxuICAgIG1hcmdpbi1sZWZ0OiBjYWxjKC0wLjVlbSAtIDJweCk7XFxuICAgIG1hcmdpbi1yaWdodDogMC4yNWVtOyB9XFxuICAuYnV0dG9uIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCkge1xcbiAgICBtYXJnaW4tbGVmdDogMC4yNWVtO1xcbiAgICBtYXJnaW4tcmlnaHQ6IGNhbGMoLTAuNWVtIC0gMnB4KTsgfVxcbiAgLmJ1dHRvbiAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxkIHtcXG4gICAgbWFyZ2luLWxlZnQ6IGNhbGMoLTAuNWVtIC0gMnB4KTtcXG4gICAgbWFyZ2luLXJpZ2h0OiBjYWxjKC0wLjVlbSAtIDJweCk7IH1cXG4gIC5idXR0b246aG92ZXIsIC5idXR0b24uaXMtaG92ZXJlZCB7XFxuICAgIGJvcmRlci1jb2xvcjogI0QwRDFDRDtcXG4gICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gIC5idXR0b246Zm9jdXMsIC5idXR0b24uaXMtZm9jdXNlZCB7XFxuICAgIGJvcmRlci1jb2xvcjogIzRiNWNmZjtcXG4gICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gICAgLmJ1dHRvbjpmb2N1czpub3QoOmFjdGl2ZSksIC5idXR0b24uaXMtZm9jdXNlZDpub3QoOmFjdGl2ZSkge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSgwLCAwLCAyNTUsIDAuMjUpOyB9XFxuICAuYnV0dG9uOmFjdGl2ZSwgLmJ1dHRvbi5pcy1hY3RpdmUge1xcbiAgICBib3JkZXItY29sb3I6ICM3NTc3NjM7XFxuICAgIGNvbG9yOiAjMzYzNjM2OyB9XFxuICAuYnV0dG9uLmlzLXRleHQge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6ICM3NTc3NjM7XFxuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOyB9XFxuICAgIC5idXR0b24uaXMtdGV4dDpob3ZlciwgLmJ1dHRvbi5pcy10ZXh0LmlzLWhvdmVyZWQsIC5idXR0b24uaXMtdGV4dDpmb2N1cywgLmJ1dHRvbi5pcy10ZXh0LmlzLWZvY3VzZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICAgICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gICAgLmJ1dHRvbi5pcy10ZXh0OmFjdGl2ZSwgLmJ1dHRvbi5pcy10ZXh0LmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U4ZThlODtcXG4gICAgICBjb2xvcjogIzM2MzYzNjsgfVxcbiAgICAuYnV0dG9uLmlzLXRleHRbZGlzYWJsZWRdLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy10ZXh0IHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJveC1zaGFkb3c6IG5vbmU7IH1cXG4gIC5idXR0b24uaXMtd2hpdGUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLmJ1dHRvbi5pcy13aGl0ZTpob3ZlciwgLmJ1dHRvbi5pcy13aGl0ZS5pcy1ob3ZlcmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjlmOWY5O1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLmJ1dHRvbi5pcy13aGl0ZTpmb2N1cywgLmJ1dHRvbi5pcy13aGl0ZS5pcy1mb2N1c2VkIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgICAgLmJ1dHRvbi5pcy13aGl0ZTpmb2N1czpub3QoOmFjdGl2ZSksIC5idXR0b24uaXMtd2hpdGUuaXMtZm9jdXNlZDpub3QoOmFjdGl2ZSkge1xcbiAgICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpOyB9XFxuICAgIC5idXR0b24uaXMtd2hpdGU6YWN0aXZlLCAuYnV0dG9uLmlzLXdoaXRlLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YyZjJmMjtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgIC5idXR0b24uaXMtd2hpdGVbZGlzYWJsZWRdLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy13aGl0ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3gtc2hhZG93OiBub25lOyB9XFxuICAgIC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwYTBhMGE7XFxuICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgICAgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZDpob3ZlciwgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IGJsYWNrOyB9XFxuICAgICAgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5idXR0b24uaXMtd2hpdGUuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzBhMGEwYSAjMGEwYTBhICFpbXBvcnRhbnQ7IH1cXG4gICAgLmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB3aGl0ZTtcXG4gICAgICBjb2xvcjogd2hpdGU7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogd2hpdGU7XFxuICAgICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICAgIC5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWQuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCB3aGl0ZSB3aGl0ZSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjMGEwYTBhICMwYTBhMGEgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB3aGl0ZTtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogd2hpdGU7IH1cXG4gICAgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjMGEwYTBhO1xcbiAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgICAgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1ob3ZlcmVkLCAuYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgICAgIC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpob3Zlcjo6YWZ0ZXIsIC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1ob3ZlcmVkOjphZnRlciwgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmZvY3VzOjphZnRlciwgLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWZvY3VzZWQ6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgd2hpdGUgd2hpdGUgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjMGEwYTBhO1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAuYnV0dG9uLmlzLWJsYWNrIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5idXR0b24uaXMtYmxhY2s6aG92ZXIsIC5idXR0b24uaXMtYmxhY2suaXMtaG92ZXJlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzA0MDQwNDtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgICAuYnV0dG9uLmlzLWJsYWNrOmZvY3VzLCAuYnV0dG9uLmlzLWJsYWNrLmlzLWZvY3VzZWQge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1ibGFjazpmb2N1czpub3QoOmFjdGl2ZSksIC5idXR0b24uaXMtYmxhY2suaXMtZm9jdXNlZDpub3QoOmFjdGl2ZSkge1xcbiAgICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDEwLCAxMCwgMTAsIDAuMjUpOyB9XFxuICAgIC5idXR0b24uaXMtYmxhY2s6YWN0aXZlLCAuYnV0dG9uLmlzLWJsYWNrLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogYmxhY2s7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogd2hpdGU7IH1cXG4gICAgLmJ1dHRvbi5pcy1ibGFja1tkaXNhYmxlZF0sXFxuICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWJsYWNrIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGEwYTBhO1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm94LXNoYWRvdzogbm9uZTsgfVxcbiAgICAuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICAgIC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQ6aG92ZXIsIC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtaG92ZXJlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmMmYyOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgIC5idXR0b24uaXMtYmxhY2suaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgd2hpdGUgd2hpdGUgIWltcG9ydGFudDsgfVxcbiAgICAuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6ICMwYTBhMGE7XFxuICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgICAuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGEwYTBhO1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjMGEwYTBhO1xcbiAgICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMwYTBhMGEgIzBhMGEwYSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCB3aGl0ZSB3aGl0ZSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3JkZXItY29sb3I6ICMwYTBhMGE7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB3aGl0ZTtcXG4gICAgICBjb2xvcjogd2hpdGU7IH1cXG4gICAgICAuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjMGEwYTBhICMwYTBhMGEgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB3aGl0ZTtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogd2hpdGU7IH1cXG4gIC5idXR0b24uaXMtbGlnaHQge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIC5idXR0b24uaXMtbGlnaHQ6aG92ZXIsIC5idXR0b24uaXMtbGlnaHQuaXMtaG92ZXJlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2VlZWVlZTtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLmJ1dHRvbi5pcy1saWdodDpmb2N1cywgLmJ1dHRvbi5pcy1saWdodC5pcy1mb2N1c2VkIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpZ2h0OmZvY3VzOm5vdCg6YWN0aXZlKSwgLmJ1dHRvbi5pcy1saWdodC5pcy1mb2N1c2VkOm5vdCg6YWN0aXZlKSB7XFxuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMjQ1LCAyNDUsIDI0NSwgMC4yNSk7IH1cXG4gICAgLmJ1dHRvbi5pcy1saWdodDphY3RpdmUsIC5idXR0b24uaXMtbGlnaHQuaXMtYWN0aXZlIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAuYnV0dG9uLmlzLWxpZ2h0W2Rpc2FibGVkXSxcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtbGlnaHQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3gtc2hhZG93OiBub25lOyB9XFxuICAgIC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTtcXG4gICAgICBjb2xvcjogd2hpdGVzbW9rZTsgfVxcbiAgICAgIC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQ6aG92ZXIsIC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtaG92ZXJlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiB3aGl0ZXNtb2tlOyB9XFxuICAgIC5idXR0b24uaXMtbGlnaHQuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgcmdiYSgwLCAwLCAwLCAwLjcpIHJnYmEoMCwgMCwgMCwgMC43KSAhaW1wb3J0YW50OyB9XFxuICAgIC5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJvcmRlci1jb2xvcjogd2hpdGVzbW9rZTtcXG4gICAgICBjb2xvcjogd2hpdGVzbW9rZTsgfVxcbiAgICAgIC5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQ6aG92ZXIsIC5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQuaXMtaG92ZXJlZCwgLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZDpmb2N1cywgLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZC5pcy1mb2N1c2VkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICAgICAgICBib3JkZXItY29sb3I6IHdoaXRlc21va2U7XFxuICAgICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50IHdoaXRlc21va2Ugd2hpdGVzbW9rZSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCByZ2JhKDAsIDAsIDAsIDAuNykgcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogd2hpdGVzbW9rZTtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogd2hpdGVzbW9rZTsgfVxcbiAgICAuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTtcXG4gICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1ob3ZlcmVkLCAuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpO1xcbiAgICAgICAgY29sb3I6IHdoaXRlc21va2U7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtaG92ZXJlZDo6YWZ0ZXIsIC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpmb2N1czo6YWZ0ZXIsIC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50IHdoaXRlc21va2Ugd2hpdGVzbW9rZSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3JkZXItY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAuYnV0dG9uLmlzLWRhcmsge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzYzNjM2O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLWRhcms6aG92ZXIsIC5idXR0b24uaXMtZGFyay5pcy1ob3ZlcmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMmYyZjJmO1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmJ1dHRvbi5pcy1kYXJrOmZvY3VzLCAuYnV0dG9uLmlzLWRhcmsuaXMtZm9jdXNlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFyazpmb2N1czpub3QoOmFjdGl2ZSksIC5idXR0b24uaXMtZGFyay5pcy1mb2N1c2VkOm5vdCg6YWN0aXZlKSB7XFxuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoNTQsIDU0LCA1NCwgMC4yNSk7IH1cXG4gICAgLmJ1dHRvbi5pcy1kYXJrOmFjdGl2ZSwgLmJ1dHRvbi5pcy1kYXJrLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzI5MjkyOTtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtZGFya1tkaXNhYmxlZF0sXFxuICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWRhcmsge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzNjM2MzY7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3gtc2hhZG93OiBub25lOyB9XFxuICAgIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBjb2xvcjogIzM2MzYzNjsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZDpob3ZlciwgLmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLWhvdmVyZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YyZjJmMjsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogIzM2MzYzNjsgfVxcbiAgICAuYnV0dG9uLmlzLWRhcmsuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnQ7IH1cXG4gICAgLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6ICMzNjM2MzY7XFxuICAgICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gICAgICAuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6aG92ZXIsIC5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZC5pcy1ob3ZlcmVkLCAuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZC5pcy1mb2N1c2VkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzNjM2MzY7XFxuICAgICAgICBib3JkZXItY29sb3I6ICMzNjM2MzY7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMzNjM2MzYgIzM2MzYzNiAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1ob3ZlcmVkOjphZnRlciwgLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjMzYzNjM2O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjMzYzNjM2OyB9XFxuICAgIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmO1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtaG92ZXJlZCwgLmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgICAgICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gICAgICAuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpob3Zlcjo6YWZ0ZXIsIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpmb2N1czo6YWZ0ZXIsIC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWZvY3VzZWQ6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzM2MzYzNiAjMzYzNjM2ICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gIC5idXR0b24uaXMtcHJpbWFyeSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICM4QTRENzY7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtcHJpbWFyeTpob3ZlciwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWhvdmVyZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM4MjQ4NmY7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLXByaW1hcnk6Zm9jdXMsIC5idXR0b24uaXMtcHJpbWFyeS5pcy1mb2N1c2VkIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1wcmltYXJ5OmZvY3VzOm5vdCg6YWN0aXZlKSwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWZvY3VzZWQ6bm90KDphY3RpdmUpIHtcXG4gICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSgxMzgsIDc3LCAxMTgsIDAuMjUpOyB9XFxuICAgIC5idXR0b24uaXMtcHJpbWFyeTphY3RpdmUsIC5idXR0b24uaXMtcHJpbWFyeS5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM3YTQ0Njg7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLXByaW1hcnlbZGlzYWJsZWRdLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1wcmltYXJ5IHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjOEE0RDc2O1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm94LXNoYWRvdzogbm9uZTsgfVxcbiAgICAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICM4QTRENzY7IH1cXG4gICAgICAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQ6aG92ZXIsIC5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmMmYyZjI7IH1cXG4gICAgICAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6ICM4QTRENzY7IH1cXG4gICAgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWxvYWRpbmc6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50OyB9XFxuICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjOEE0RDc2O1xcbiAgICAgIGNvbG9yOiAjOEE0RDc2OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWQuaXMtaG92ZXJlZCwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjOEE0RDc2O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjOEE0RDc2O1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWQuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjOEE0RDc2ICM4QTRENzYgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtaG92ZXJlZDo6YWZ0ZXIsIC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmZvY3VzOjphZnRlciwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogIzhBNEQ3NjtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogIzhBNEQ3NjsgfVxcbiAgICAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1cywgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICAgIGNvbG9yOiAjOEE0RDc2OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1ob3ZlcmVkOjphZnRlciwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICM4QTRENzYgIzhBNEQ3NiAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmO1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1saWdodCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y4ZjJmNjtcXG4gICAgICBjb2xvcjogIzlkNTg4NjsgfVxcbiAgICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1saWdodDpob3ZlciwgLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWxpZ2h0LmlzLWhvdmVyZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YzZWFmMDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBjb2xvcjogIzlkNTg4NjsgfVxcbiAgICAgIC5idXR0b24uaXMtcHJpbWFyeS5pcy1saWdodDphY3RpdmUsIC5idXR0b24uaXMtcHJpbWFyeS5pcy1saWdodC5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2VmZTJlYTtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBjb2xvcjogIzlkNTg4NjsgfVxcbiAgLmJ1dHRvbi5pcy1saW5rIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogYmx1ZTtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmJ1dHRvbi5pcy1saW5rOmhvdmVyLCAuYnV0dG9uLmlzLWxpbmsuaXMtaG92ZXJlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDBmMjtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtbGluazpmb2N1cywgLmJ1dHRvbi5pcy1saW5rLmlzLWZvY3VzZWQge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpbms6Zm9jdXM6bm90KDphY3RpdmUpLCAuYnV0dG9uLmlzLWxpbmsuaXMtZm9jdXNlZDpub3QoOmFjdGl2ZSkge1xcbiAgICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDAsIDAsIDI1NSwgMC4yNSk7IH1cXG4gICAgLmJ1dHRvbi5pcy1saW5rOmFjdGl2ZSwgLmJ1dHRvbi5pcy1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDBlNjtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtbGlua1tkaXNhYmxlZF0sXFxuICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWxpbmsge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGJsdWU7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3gtc2hhZG93OiBub25lOyB9XFxuICAgIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBjb2xvcjogYmx1ZTsgfVxcbiAgICAgIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZDpob3ZlciwgLmJ1dHRvbi5pcy1saW5rLmlzLWludmVydGVkLmlzLWhvdmVyZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YyZjJmMjsgfVxcbiAgICAgIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogYmx1ZTsgfVxcbiAgICAuYnV0dG9uLmlzLWxpbmsuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnQ7IH1cXG4gICAgLmJ1dHRvbi5pcy1saW5rLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6IGJsdWU7XFxuICAgICAgY29sb3I6IGJsdWU7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpbmsuaXMtb3V0bGluZWQ6aG92ZXIsIC5idXR0b24uaXMtbGluay5pcy1vdXRsaW5lZC5pcy1ob3ZlcmVkLCAuYnV0dG9uLmlzLWxpbmsuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtbGluay5pcy1vdXRsaW5lZC5pcy1mb2N1c2VkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IGJsdWU7XFxuICAgICAgICBib3JkZXItY29sb3I6IGJsdWU7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5idXR0b24uaXMtbGluay5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50IGJsdWUgYmx1ZSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saW5rLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLWxpbmsuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1ob3ZlcmVkOjphZnRlciwgLmJ1dHRvbi5pcy1saW5rLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLWxpbmsuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saW5rLmlzLW91dGxpbmVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1saW5rLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiBibHVlO1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiBibHVlOyB9XFxuICAgIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmO1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saW5rLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLWxpbmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtaG92ZXJlZCwgLmJ1dHRvbi5pcy1saW5rLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLWxpbmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgICAgICAgY29sb3I6IGJsdWU7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpbmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpob3Zlcjo6YWZ0ZXIsIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWxpbmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpmb2N1czo6YWZ0ZXIsIC5idXR0b24uaXMtbGluay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWZvY3VzZWQ6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgYmx1ZSBibHVlICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLWxpbmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWxpbmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmJ1dHRvbi5pcy1saW5rLmlzLWxpZ2h0IHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZWJlYmZmO1xcbiAgICAgIGNvbG9yOiAjMGYwZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saW5rLmlzLWxpZ2h0OmhvdmVyLCAuYnV0dG9uLmlzLWxpbmsuaXMtbGlnaHQuaXMtaG92ZXJlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGVkZWZmO1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGNvbG9yOiAjMGYwZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1saW5rLmlzLWxpZ2h0OmFjdGl2ZSwgLmJ1dHRvbi5pcy1saW5rLmlzLWxpZ2h0LmlzLWFjdGl2ZSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDFkMWZmO1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGNvbG9yOiAjMGYwZmZmOyB9XFxuICAuYnV0dG9uLmlzLWluZm8ge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzI5OGRjO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLWluZm86aG92ZXIsIC5idXR0b24uaXMtaW5mby5pcy1ob3ZlcmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjc5M2RhO1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmJ1dHRvbi5pcy1pbmZvOmZvY3VzLCAuYnV0dG9uLmlzLWluZm8uaXMtZm9jdXNlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5idXR0b24uaXMtaW5mbzpmb2N1czpub3QoOmFjdGl2ZSksIC5idXR0b24uaXMtaW5mby5pcy1mb2N1c2VkOm5vdCg6YWN0aXZlKSB7XFxuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoNTAsIDE1MiwgMjIwLCAwLjI1KTsgfVxcbiAgICAuYnV0dG9uLmlzLWluZm86YWN0aXZlLCAuYnV0dG9uLmlzLWluZm8uaXMtYWN0aXZlIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjM4Y2QxO1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmJ1dHRvbi5pcy1pbmZvW2Rpc2FibGVkXSxcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtaW5mbyB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzMyOThkYztcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJveC1zaGFkb3c6IG5vbmU7IH1cXG4gICAgLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgICAgIGNvbG9yOiAjMzI5OGRjOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkOmhvdmVyLCAuYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtaG92ZXJlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmMmYyOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjMzI5OGRjOyB9XFxuICAgIC5idXR0b24uaXMtaW5mby5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudDsgfVxcbiAgICAuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJvcmRlci1jb2xvcjogIzMyOThkYztcXG4gICAgICBjb2xvcjogIzMyOThkYzsgfVxcbiAgICAgIC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpmb2N1cywgLmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzMyOThkYztcXG4gICAgICAgIGJvcmRlci1jb2xvcjogIzMyOThkYztcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzMyOThkYyAjMzI5OGRjICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQuaXMtbG9hZGluZzpob3Zlcjo6YWZ0ZXIsIC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQuaXMtbG9hZGluZzpmb2N1czo6YWZ0ZXIsIC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWZvY3VzZWQ6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3JkZXItY29sb3I6ICMzMjk4ZGM7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6ICMzMjk4ZGM7IH1cXG4gICAgLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsIC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1ob3ZlcmVkLCAuYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1mb2N1c2VkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XFxuICAgICAgICBjb2xvcjogIzMyOThkYzsgfVxcbiAgICAgIC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtaG92ZXJlZDo6YWZ0ZXIsIC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmZvY3VzOjphZnRlciwgLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjMzI5OGRjICMzMjk4ZGMgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLWluZm8uaXMtbGlnaHQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNlZWY2ZmM7XFxuICAgICAgY29sb3I6ICMxZDcyYWE7IH1cXG4gICAgICAuYnV0dG9uLmlzLWluZm8uaXMtbGlnaHQ6aG92ZXIsIC5idXR0b24uaXMtaW5mby5pcy1saWdodC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNlM2YxZmE7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgY29sb3I6ICMxZDcyYWE7IH1cXG4gICAgICAuYnV0dG9uLmlzLWluZm8uaXMtbGlnaHQ6YWN0aXZlLCAuYnV0dG9uLmlzLWluZm8uaXMtbGlnaHQuaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNkOGViZjg7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgY29sb3I6ICMxZDcyYWE7IH1cXG4gIC5idXR0b24uaXMtc3VjY2VzcyB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICM0OGM3NzQ7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtc3VjY2Vzczpob3ZlciwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWhvdmVyZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzZWM0NmQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLXN1Y2Nlc3M6Zm9jdXMsIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1mb2N1c2VkIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1zdWNjZXNzOmZvY3VzOm5vdCg6YWN0aXZlKSwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWZvY3VzZWQ6bm90KDphY3RpdmUpIHtcXG4gICAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSg3MiwgMTk5LCAxMTYsIDAuMjUpOyB9XFxuICAgIC5idXR0b24uaXMtc3VjY2VzczphY3RpdmUsIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzYWJiNjc7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLXN1Y2Nlc3NbZGlzYWJsZWRdLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1zdWNjZXNzIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDhjNzc0O1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm94LXNoYWRvdzogbm9uZTsgfVxcbiAgICAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICM0OGM3NzQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQ6aG92ZXIsIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmMmYyZjI7IH1cXG4gICAgICAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICAgICAgY29sb3I6ICM0OGM3NzQ7IH1cXG4gICAgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWxvYWRpbmc6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50OyB9XFxuICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjNDhjNzc0O1xcbiAgICAgIGNvbG9yOiAjNDhjNzc0OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmhvdmVyLCAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQuaXMtaG92ZXJlZCwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQuaXMtZm9jdXNlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDhjNzc0O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjNDhjNzc0O1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjNDhjNzc0ICM0OGM3NzQgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmhvdmVyOjphZnRlciwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtaG92ZXJlZDo6YWZ0ZXIsIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmZvY3VzOjphZnRlciwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkLmlzLWxvYWRpbmcuaXMtZm9jdXNlZDo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogIzQ4Yzc3NDtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogIzQ4Yzc3NDsgfVxcbiAgICAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1cywgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICAgIGNvbG9yOiAjNDhjNzc0OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1ob3ZlcmVkOjphZnRlciwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6Zm9jdXM6OmFmdGVyLCAuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICM0OGM3NzQgIzQ4Yzc3NCAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmO1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1saWdodCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2VmZmFmMztcXG4gICAgICBjb2xvcjogIzI1Nzk0MjsgfVxcbiAgICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1saWdodDpob3ZlciwgLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWxpZ2h0LmlzLWhvdmVyZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U2ZjdlYztcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBjb2xvcjogIzI1Nzk0MjsgfVxcbiAgICAgIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1saWdodDphY3RpdmUsIC5idXR0b24uaXMtc3VjY2Vzcy5pcy1saWdodC5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2RjZjRlNDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBjb2xvcjogIzI1Nzk0MjsgfVxcbiAgLmJ1dHRvbi5pcy13YXJuaW5nIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZGQ1NztcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAuYnV0dG9uLmlzLXdhcm5pbmc6aG92ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1ob3ZlcmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZkYjRhO1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAuYnV0dG9uLmlzLXdhcm5pbmc6Zm9jdXMsIC5idXR0b24uaXMtd2FybmluZy5pcy1mb2N1c2VkIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdhcm5pbmc6Zm9jdXM6bm90KDphY3RpdmUpLCAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtZm9jdXNlZDpub3QoOmFjdGl2ZSkge1xcbiAgICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDI1NSwgMjIxLCA4NywgMC4yNSk7IH1cXG4gICAgLmJ1dHRvbi5pcy13YXJuaW5nOmFjdGl2ZSwgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZDgzZDtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLmJ1dHRvbi5pcy13YXJuaW5nW2Rpc2FibGVkXSxcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtd2FybmluZyB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZGQ1NztcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGJveC1zaGFkb3c6IG5vbmU7IH1cXG4gICAgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7XFxuICAgICAgY29sb3I6ICNmZmRkNTc7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQ6aG92ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjZmZkZDU3OyB9XFxuICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCByZ2JhKDAsIDAsIDAsIDAuNykgcmdiYSgwLCAwLCAwLCAwLjcpICFpbXBvcnRhbnQ7IH1cXG4gICAgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmRkNTc7XFxuICAgICAgY29sb3I6ICNmZmRkNTc7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQ6aG92ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZC5pcy1ob3ZlcmVkLCAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZC5pcy1mb2N1c2VkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmRkNTc7XFxuICAgICAgICBib3JkZXItY29sb3I6ICNmZmRkNTc7XFxuICAgICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgICAgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZGQ1NyAjZmZkZDU3ICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpob3Zlcjo6YWZ0ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpmb2N1czo6YWZ0ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWZvY3VzZWQ6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgcmdiYSgwLCAwLCAwLCAwLjcpIHJnYmEoMCwgMCwgMCwgMC43KSAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkW2Rpc2FibGVkXSxcXG4gICAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZmZkZDU3O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjZmZkZDU3OyB9XFxuICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1cywgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpO1xcbiAgICAgICAgY29sb3I6ICNmZmRkNTc7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpob3Zlcjo6YWZ0ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZzpmb2N1czo6YWZ0ZXIsIC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWZvY3VzZWQ6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZGQ1NyAjZmZkZDU3ICFpbXBvcnRhbnQ7IH1cXG4gICAgICAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBib3JkZXItY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1saWdodCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmJlYjtcXG4gICAgICBjb2xvcjogIzk0NzYwMDsgfVxcbiAgICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1saWdodDpob3ZlciwgLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWxpZ2h0LmlzLWhvdmVyZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjhkZTtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBjb2xvcjogIzk0NzYwMDsgfVxcbiAgICAgIC5idXR0b24uaXMtd2FybmluZy5pcy1saWdodDphY3RpdmUsIC5idXR0b24uaXMtd2FybmluZy5pcy1saWdodC5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjZkMTtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgICBjb2xvcjogIzk0NzYwMDsgfVxcbiAgLmJ1dHRvbi5pcy1kYW5nZXIge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjE0NjY4O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLWRhbmdlcjpob3ZlciwgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaG92ZXJlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YwM2E1ZjtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtZGFuZ2VyOmZvY3VzLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1mb2N1c2VkIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYW5nZXI6Zm9jdXM6bm90KDphY3RpdmUpLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1mb2N1c2VkOm5vdCg6YWN0aXZlKSB7XFxuICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMjQxLCA3MCwgMTA0LCAwLjI1KTsgfVxcbiAgICAuYnV0dG9uLmlzLWRhbmdlcjphY3RpdmUsIC5idXR0b24uaXMtZGFuZ2VyLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2VmMmU1NTtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5idXR0b24uaXMtZGFuZ2VyW2Rpc2FibGVkXSxcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtZGFuZ2VyIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjE0NjY4O1xcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm94LXNoYWRvdzogbm9uZTsgfVxcbiAgICAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBjb2xvcjogI2YxNDY2ODsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkOmhvdmVyLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmMmYyZjI7IH1cXG4gICAgICAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZFtkaXNhYmxlZF0sXFxuICAgICAgZmllbGRzZXRbZGlzYWJsZWRdIC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgICAgIGNvbG9yOiAjZjE0NjY4OyB9XFxuICAgIC5idXR0b24uaXMtZGFuZ2VyLmlzLWxvYWRpbmc6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50OyB9XFxuICAgIC5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICBib3JkZXItY29sb3I6ICNmMTQ2Njg7XFxuICAgICAgY29sb3I6ICNmMTQ2Njg7IH1cXG4gICAgICAuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpob3ZlciwgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQuaXMtaG92ZXJlZCwgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQ6Zm9jdXMsIC5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVkLmlzLWZvY3VzZWQge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YxNDY2ODtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogI2YxNDY2ODtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZjE0NjY4ICNmMTQ2NjggIWltcG9ydGFudDsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmZvY3VzOjphZnRlciwgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogI2YxNDY2ODtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogI2YxNDY2ODsgfVxcbiAgICAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmO1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsIC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWhvdmVyZWQsIC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3VzLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1mb2N1c2VkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XFxuICAgICAgICBjb2xvcjogI2YxNDY2ODsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkLmlzLWxvYWRpbmc6aG92ZXI6OmFmdGVyLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nLmlzLWhvdmVyZWQ6OmFmdGVyLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZC5pcy1sb2FkaW5nOmZvY3VzOjphZnRlciwgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQuaXMtbG9hZGluZy5pcy1mb2N1c2VkOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmMTQ2NjggI2YxNDY2OCAhaW1wb3J0YW50OyB9XFxuICAgICAgLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWRbZGlzYWJsZWRdLFxcbiAgICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZCB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjtcXG4gICAgICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuYnV0dG9uLmlzLWRhbmdlci5pcy1saWdodCB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZlZWNmMDtcXG4gICAgICBjb2xvcjogI2NjMGYzNTsgfVxcbiAgICAgIC5idXR0b24uaXMtZGFuZ2VyLmlzLWxpZ2h0OmhvdmVyLCAuYnV0dG9uLmlzLWRhbmdlci5pcy1saWdodC5pcy1ob3ZlcmVkIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZGUwZTY7XFxuICAgICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICAgICAgY29sb3I6ICNjYzBmMzU7IH1cXG4gICAgICAuYnV0dG9uLmlzLWRhbmdlci5pcy1saWdodDphY3RpdmUsIC5idXR0b24uaXMtZGFuZ2VyLmlzLWxpZ2h0LmlzLWFjdGl2ZSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmNkNGRjO1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgICAgIGNvbG9yOiAjY2MwZjM1OyB9XFxuICAuYnV0dG9uLmlzLXNtYWxsIHtcXG4gICAgYm9yZGVyLXJhZGl1czogMnB4O1xcbiAgICBmb250LXNpemU6IDAuNzVyZW07IH1cXG4gIC5idXR0b24uaXMtbm9ybWFsIHtcXG4gICAgZm9udC1zaXplOiAxcmVtOyB9XFxuICAuYnV0dG9uLmlzLW1lZGl1bSB7XFxuICAgIGZvbnQtc2l6ZTogMS4yNXJlbTsgfVxcbiAgLmJ1dHRvbi5pcy1sYXJnZSB7XFxuICAgIGZvbnQtc2l6ZTogMS41cmVtOyB9XFxuICAuYnV0dG9uW2Rpc2FibGVkXSxcXG4gIGZpZWxkc2V0W2Rpc2FibGVkXSAuYnV0dG9uIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgIGJvcmRlci1jb2xvcjogI2RiZGJkYjtcXG4gICAgYm94LXNoYWRvdzogbm9uZTtcXG4gICAgb3BhY2l0eTogMC41OyB9XFxuICAuYnV0dG9uLmlzLWZ1bGx3aWR0aCB7XFxuICAgIGRpc3BsYXk6IGZsZXg7XFxuICAgIHdpZHRoOiAxMDAlOyB9XFxuICAuYnV0dG9uLmlzLWxvYWRpbmcge1xcbiAgICBjb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDtcXG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7IH1cXG4gICAgLmJ1dHRvbi5pcy1sb2FkaW5nOjphZnRlciB7XFxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICAgIGxlZnQ6IGNhbGMoNTAlIC0gKDFlbSAvIDIpKTtcXG4gICAgICB0b3A6IGNhbGMoNTAlIC0gKDFlbSAvIDIpKTtcXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGUgIWltcG9ydGFudDsgfVxcbiAgLmJ1dHRvbi5pcy1zdGF0aWMge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgICBib3JkZXItY29sb3I6ICNkYmRiZGI7XFxuICAgIGNvbG9yOiAjN2E3YTdhO1xcbiAgICBib3gtc2hhZG93OiBub25lO1xcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTsgfVxcbiAgLmJ1dHRvbi5pcy1yb3VuZGVkIHtcXG4gICAgYm9yZGVyLXJhZGl1czogMjkwNDg2cHg7XFxuICAgIHBhZGRpbmctbGVmdDogY2FsYygxZW0gKyAwLjI1ZW0pO1xcbiAgICBwYWRkaW5nLXJpZ2h0OiBjYWxjKDFlbSArIDAuMjVlbSk7IH1cXG5cXG4uYnV0dG9ucyB7XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGZsZXgtd3JhcDogd3JhcDtcXG4gIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsgfVxcbiAgLmJ1dHRvbnMgLmJ1dHRvbiB7XFxuICAgIG1hcmdpbi1ib3R0b206IDAuNXJlbTsgfVxcbiAgICAuYnV0dG9ucyAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCk6bm90KC5pcy1mdWxsd2lkdGgpIHtcXG4gICAgICBtYXJnaW4tcmlnaHQ6IDAuNXJlbTsgfVxcbiAgLmJ1dHRvbnM6bGFzdC1jaGlsZCB7XFxuICAgIG1hcmdpbi1ib3R0b206IC0wLjVyZW07IH1cXG4gIC5idXR0b25zOm5vdCg6bGFzdC1jaGlsZCkge1xcbiAgICBtYXJnaW4tYm90dG9tOiAxcmVtOyB9XFxuICAuYnV0dG9ucy5hcmUtc21hbGwgLmJ1dHRvbjpub3QoLmlzLW5vcm1hbCk6bm90KC5pcy1tZWRpdW0pOm5vdCguaXMtbGFyZ2UpIHtcXG4gICAgYm9yZGVyLXJhZGl1czogMnB4O1xcbiAgICBmb250LXNpemU6IDAuNzVyZW07IH1cXG4gIC5idXR0b25zLmFyZS1tZWRpdW0gLmJ1dHRvbjpub3QoLmlzLXNtYWxsKTpub3QoLmlzLW5vcm1hbCk6bm90KC5pcy1sYXJnZSkge1xcbiAgICBmb250LXNpemU6IDEuMjVyZW07IH1cXG4gIC5idXR0b25zLmFyZS1sYXJnZSAuYnV0dG9uOm5vdCguaXMtc21hbGwpOm5vdCguaXMtbm9ybWFsKTpub3QoLmlzLW1lZGl1bSkge1xcbiAgICBmb250LXNpemU6IDEuNXJlbTsgfVxcbiAgLmJ1dHRvbnMuaGFzLWFkZG9ucyAuYnV0dG9uOm5vdCg6Zmlyc3QtY2hpbGQpIHtcXG4gICAgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogMDtcXG4gICAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogMDsgfVxcbiAgLmJ1dHRvbnMuaGFzLWFkZG9ucyAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCkge1xcbiAgICBib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogMDtcXG4gICAgYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IDA7XFxuICAgIG1hcmdpbi1yaWdodDogLTFweDsgfVxcbiAgLmJ1dHRvbnMuaGFzLWFkZG9ucyAuYnV0dG9uOmxhc3QtY2hpbGQge1xcbiAgICBtYXJnaW4tcmlnaHQ6IDA7IH1cXG4gIC5idXR0b25zLmhhcy1hZGRvbnMgLmJ1dHRvbjpob3ZlciwgLmJ1dHRvbnMuaGFzLWFkZG9ucyAuYnV0dG9uLmlzLWhvdmVyZWQge1xcbiAgICB6LWluZGV4OiAyOyB9XFxuICAuYnV0dG9ucy5oYXMtYWRkb25zIC5idXR0b246Zm9jdXMsIC5idXR0b25zLmhhcy1hZGRvbnMgLmJ1dHRvbi5pcy1mb2N1c2VkLCAuYnV0dG9ucy5oYXMtYWRkb25zIC5idXR0b246YWN0aXZlLCAuYnV0dG9ucy5oYXMtYWRkb25zIC5idXR0b24uaXMtYWN0aXZlLCAuYnV0dG9ucy5oYXMtYWRkb25zIC5idXR0b24uaXMtc2VsZWN0ZWQge1xcbiAgICB6LWluZGV4OiAzOyB9XFxuICAgIC5idXR0b25zLmhhcy1hZGRvbnMgLmJ1dHRvbjpmb2N1czpob3ZlciwgLmJ1dHRvbnMuaGFzLWFkZG9ucyAuYnV0dG9uLmlzLWZvY3VzZWQ6aG92ZXIsIC5idXR0b25zLmhhcy1hZGRvbnMgLmJ1dHRvbjphY3RpdmU6aG92ZXIsIC5idXR0b25zLmhhcy1hZGRvbnMgLmJ1dHRvbi5pcy1hY3RpdmU6aG92ZXIsIC5idXR0b25zLmhhcy1hZGRvbnMgLmJ1dHRvbi5pcy1zZWxlY3RlZDpob3ZlciB7XFxuICAgICAgei1pbmRleDogNDsgfVxcbiAgLmJ1dHRvbnMuaGFzLWFkZG9ucyAuYnV0dG9uLmlzLWV4cGFuZGVkIHtcXG4gICAgZmxleC1ncm93OiAxO1xcbiAgICBmbGV4LXNocmluazogMTsgfVxcbiAgLmJ1dHRvbnMuaXMtY2VudGVyZWQge1xcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgfVxcbiAgICAuYnV0dG9ucy5pcy1jZW50ZXJlZDpub3QoLmhhcy1hZGRvbnMpIC5idXR0b246bm90KC5pcy1mdWxsd2lkdGgpIHtcXG4gICAgICBtYXJnaW4tbGVmdDogMC4yNXJlbTtcXG4gICAgICBtYXJnaW4tcmlnaHQ6IDAuMjVyZW07IH1cXG4gIC5idXR0b25zLmlzLXJpZ2h0IHtcXG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDsgfVxcbiAgICAuYnV0dG9ucy5pcy1yaWdodDpub3QoLmhhcy1hZGRvbnMpIC5idXR0b246bm90KC5pcy1mdWxsd2lkdGgpIHtcXG4gICAgICBtYXJnaW4tbGVmdDogMC4yNXJlbTtcXG4gICAgICBtYXJnaW4tcmlnaHQ6IDAuMjVyZW07IH1cXG5cXG4uY29udGFpbmVyIHtcXG4gIGZsZXgtZ3JvdzogMTtcXG4gIG1hcmdpbjogMCBhdXRvO1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgd2lkdGg6IGF1dG87IH1cXG4gIC5jb250YWluZXIuaXMtZmx1aWQge1xcbiAgICBtYXgtd2lkdGg6IG5vbmU7XFxuICAgIHBhZGRpbmctbGVmdDogMzJweDtcXG4gICAgcGFkZGluZy1yaWdodDogMzJweDtcXG4gICAgd2lkdGg6IDEwMCU7IH1cXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgICAuY29udGFpbmVyIHtcXG4gICAgICBtYXgtd2lkdGg6IDk2MHB4OyB9IH1cXG5cXG4udGl0bGUsXFxuLnN1YnRpdGxlIHtcXG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7IH1cXG4gIC50aXRsZSBlbSxcXG4gIC50aXRsZSBzcGFuLFxcbiAgLnN1YnRpdGxlIGVtLFxcbiAgLnN1YnRpdGxlIHNwYW4ge1xcbiAgICBmb250LXdlaWdodDogaW5oZXJpdDsgfVxcbiAgLnRpdGxlIHN1YixcXG4gIC5zdWJ0aXRsZSBzdWIge1xcbiAgICBmb250LXNpemU6IDAuNzVlbTsgfVxcbiAgLnRpdGxlIHN1cCxcXG4gIC5zdWJ0aXRsZSBzdXAge1xcbiAgICBmb250LXNpemU6IDAuNzVlbTsgfVxcbiAgLnRpdGxlIC50YWcsXFxuICAuc3VidGl0bGUgLnRhZyB7XFxuICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7IH1cXG5cXG4udGl0bGUge1xcbiAgY29sb3I6ICMzNjM2MzY7XFxuICBmb250LXNpemU6IDJyZW07XFxuICBmb250LXdlaWdodDogNjAwO1xcbiAgbGluZS1oZWlnaHQ6IDEuMTI1OyB9XFxuICAudGl0bGUgc3Ryb25nIHtcXG4gICAgY29sb3I6IGluaGVyaXQ7XFxuICAgIGZvbnQtd2VpZ2h0OiBpbmhlcml0OyB9XFxuICAudGl0bGUgKyAuaGlnaGxpZ2h0IHtcXG4gICAgbWFyZ2luLXRvcDogLTAuNzVyZW07IH1cXG4gIC50aXRsZTpub3QoLmlzLXNwYWNlZCkgKyAuc3VidGl0bGUge1xcbiAgICBtYXJnaW4tdG9wOiAtMS4yNXJlbTsgfVxcbiAgLnRpdGxlLmlzLTEge1xcbiAgICBmb250LXNpemU6IDNyZW07IH1cXG4gIC50aXRsZS5pcy0yIHtcXG4gICAgZm9udC1zaXplOiAyLjVyZW07IH1cXG4gIC50aXRsZS5pcy0zIHtcXG4gICAgZm9udC1zaXplOiAycmVtOyB9XFxuICAudGl0bGUuaXMtNCB7XFxuICAgIGZvbnQtc2l6ZTogMS41cmVtOyB9XFxuICAudGl0bGUuaXMtNSB7XFxuICAgIGZvbnQtc2l6ZTogMS4yNXJlbTsgfVxcbiAgLnRpdGxlLmlzLTYge1xcbiAgICBmb250LXNpemU6IDFyZW07IH1cXG4gIC50aXRsZS5pcy03IHtcXG4gICAgZm9udC1zaXplOiAwLjc1cmVtOyB9XFxuXFxuLnN1YnRpdGxlIHtcXG4gIGNvbG9yOiAjNzU3NzYzO1xcbiAgZm9udC1zaXplOiAxLjI1cmVtO1xcbiAgZm9udC13ZWlnaHQ6IDQwMDtcXG4gIGxpbmUtaGVpZ2h0OiAxLjI1OyB9XFxuICAuc3VidGl0bGUgc3Ryb25nIHtcXG4gICAgY29sb3I6ICMzNjM2MzY7XFxuICAgIGZvbnQtd2VpZ2h0OiA2MDA7IH1cXG4gIC5zdWJ0aXRsZTpub3QoLmlzLXNwYWNlZCkgKyAudGl0bGUge1xcbiAgICBtYXJnaW4tdG9wOiAtMS4yNXJlbTsgfVxcbiAgLnN1YnRpdGxlLmlzLTEge1xcbiAgICBmb250LXNpemU6IDNyZW07IH1cXG4gIC5zdWJ0aXRsZS5pcy0yIHtcXG4gICAgZm9udC1zaXplOiAyLjVyZW07IH1cXG4gIC5zdWJ0aXRsZS5pcy0zIHtcXG4gICAgZm9udC1zaXplOiAycmVtOyB9XFxuICAuc3VidGl0bGUuaXMtNCB7XFxuICAgIGZvbnQtc2l6ZTogMS41cmVtOyB9XFxuICAuc3VidGl0bGUuaXMtNSB7XFxuICAgIGZvbnQtc2l6ZTogMS4yNXJlbTsgfVxcbiAgLnN1YnRpdGxlLmlzLTYge1xcbiAgICBmb250LXNpemU6IDFyZW07IH1cXG4gIC5zdWJ0aXRsZS5pcy03IHtcXG4gICAgZm9udC1zaXplOiAwLjc1cmVtOyB9XFxuXFxuLmlucHV0LCAudGV4dGFyZWEsIC5zZWxlY3Qgc2VsZWN0IHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xcbiAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gIGJvcmRlci1yYWRpdXM6IDRweDtcXG4gIGNvbG9yOiAjMzYzNjM2OyB9XFxuICAuaW5wdXQ6Oi1tb3otcGxhY2Vob2xkZXIsIC50ZXh0YXJlYTo6LW1vei1wbGFjZWhvbGRlciwgLnNlbGVjdCBzZWxlY3Q6Oi1tb3otcGxhY2Vob2xkZXIge1xcbiAgICBjb2xvcjogcmdiYSg1NCwgNTQsIDU0LCAwLjMpOyB9XFxuICAuaW5wdXQ6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsIC50ZXh0YXJlYTo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwgLnNlbGVjdCBzZWxlY3Q6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIge1xcbiAgICBjb2xvcjogcmdiYSg1NCwgNTQsIDU0LCAwLjMpOyB9XFxuICAuaW5wdXQ6LW1vei1wbGFjZWhvbGRlciwgLnRleHRhcmVhOi1tb3otcGxhY2Vob2xkZXIsIC5zZWxlY3Qgc2VsZWN0Oi1tb3otcGxhY2Vob2xkZXIge1xcbiAgICBjb2xvcjogcmdiYSg1NCwgNTQsIDU0LCAwLjMpOyB9XFxuICAuaW5wdXQ6LW1zLWlucHV0LXBsYWNlaG9sZGVyLCAudGV4dGFyZWE6LW1zLWlucHV0LXBsYWNlaG9sZGVyLCAuc2VsZWN0IHNlbGVjdDotbXMtaW5wdXQtcGxhY2Vob2xkZXIge1xcbiAgICBjb2xvcjogcmdiYSg1NCwgNTQsIDU0LCAwLjMpOyB9XFxuICAuaW5wdXQ6aG92ZXIsIC50ZXh0YXJlYTpob3ZlciwgLnNlbGVjdCBzZWxlY3Q6aG92ZXIsIC5pcy1ob3ZlcmVkLmlucHV0LCAuaXMtaG92ZXJlZC50ZXh0YXJlYSwgLnNlbGVjdCBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgIGJvcmRlci1jb2xvcjogI0QwRDFDRDsgfVxcbiAgLmlucHV0OmZvY3VzLCAudGV4dGFyZWE6Zm9jdXMsIC5zZWxlY3Qgc2VsZWN0OmZvY3VzLCAuaXMtZm9jdXNlZC5pbnB1dCwgLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5zZWxlY3Qgc2VsZWN0LmlzLWZvY3VzZWQsIC5pbnB1dDphY3RpdmUsIC50ZXh0YXJlYTphY3RpdmUsIC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZSwgLmlzLWFjdGl2ZS5pbnB1dCwgLmlzLWFjdGl2ZS50ZXh0YXJlYSwgLnNlbGVjdCBzZWxlY3QuaXMtYWN0aXZlIHtcXG4gICAgYm9yZGVyLWNvbG9yOiBibHVlO1xcbiAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMCwgMCwgMjU1LCAwLjI1KTsgfVxcbiAgLmlucHV0W2Rpc2FibGVkXSwgLnRleHRhcmVhW2Rpc2FibGVkXSwgLnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdLFxcbiAgZmllbGRzZXRbZGlzYWJsZWRdIC5pbnB1dCxcXG4gIGZpZWxkc2V0W2Rpc2FibGVkXSAudGV4dGFyZWEsXFxuICBmaWVsZHNldFtkaXNhYmxlZF0gLnNlbGVjdCBzZWxlY3QsXFxuICAuc2VsZWN0IGZpZWxkc2V0W2Rpc2FibGVkXSBzZWxlY3Qge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgICBib3JkZXItY29sb3I6IHdoaXRlc21va2U7XFxuICAgIGJveC1zaGFkb3c6IG5vbmU7XFxuICAgIGNvbG9yOiAjN2E3YTdhOyB9XFxuICAgIC5pbnB1dFtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsIC50ZXh0YXJlYVtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsIC5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlcixcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC5pbnB1dDo6LW1vei1wbGFjZWhvbGRlcixcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC50ZXh0YXJlYTo6LW1vei1wbGFjZWhvbGRlcixcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC5zZWxlY3Qgc2VsZWN0OjotbW96LXBsYWNlaG9sZGVyLFxcbiAgICAuc2VsZWN0IGZpZWxkc2V0W2Rpc2FibGVkXSBzZWxlY3Q6Oi1tb3otcGxhY2Vob2xkZXIge1xcbiAgICAgIGNvbG9yOiByZ2JhKDEyMiwgMTIyLCAxMjIsIDAuMyk7IH1cXG4gICAgLmlucHV0W2Rpc2FibGVkXTo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwgLnRleHRhcmVhW2Rpc2FibGVkXTo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwgLnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmlucHV0Ojotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLnRleHRhcmVhOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLnNlbGVjdCBzZWxlY3Q6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsXFxuICAgIC5zZWxlY3QgZmllbGRzZXRbZGlzYWJsZWRdIHNlbGVjdDo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciB7XFxuICAgICAgY29sb3I6IHJnYmEoMTIyLCAxMjIsIDEyMiwgMC4zKTsgfVxcbiAgICAuaW5wdXRbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsIC50ZXh0YXJlYVtkaXNhYmxlZF06LW1vei1wbGFjZWhvbGRlciwgLnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsXFxuICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuaW5wdXQ6LW1vei1wbGFjZWhvbGRlcixcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC50ZXh0YXJlYTotbW96LXBsYWNlaG9sZGVyLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLnNlbGVjdCBzZWxlY3Q6LW1vei1wbGFjZWhvbGRlcixcXG4gICAgLnNlbGVjdCBmaWVsZHNldFtkaXNhYmxlZF0gc2VsZWN0Oi1tb3otcGxhY2Vob2xkZXIge1xcbiAgICAgIGNvbG9yOiByZ2JhKDEyMiwgMTIyLCAxMjIsIDAuMyk7IH1cXG4gICAgLmlucHV0W2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsIC50ZXh0YXJlYVtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLCAuc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLFxcbiAgICBmaWVsZHNldFtkaXNhYmxlZF0gLmlucHV0Oi1tcy1pbnB1dC1wbGFjZWhvbGRlcixcXG4gICAgZmllbGRzZXRbZGlzYWJsZWRdIC50ZXh0YXJlYTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsXFxuICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuc2VsZWN0IHNlbGVjdDotbXMtaW5wdXQtcGxhY2Vob2xkZXIsXFxuICAgIC5zZWxlY3QgZmllbGRzZXRbZGlzYWJsZWRdIHNlbGVjdDotbXMtaW5wdXQtcGxhY2Vob2xkZXIge1xcbiAgICAgIGNvbG9yOiByZ2JhKDEyMiwgMTIyLCAxMjIsIDAuMyk7IH1cXG5cXG4uaW5wdXQsIC50ZXh0YXJlYSB7XFxuICBib3gtc2hhZG93OiBub25lO1xcbiAgbWF4LXdpZHRoOiAxMDAlO1xcbiAgd2lkdGg6IDEwMCU7IH1cXG4gIC5pbnB1dFtyZWFkb25seV0sIC50ZXh0YXJlYVtyZWFkb25seV0ge1xcbiAgICBib3gtc2hhZG93OiBub25lOyB9XFxuICAuaXMtd2hpdGUuaW5wdXQsIC5pcy13aGl0ZS50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogd2hpdGU7IH1cXG4gICAgLmlzLXdoaXRlLmlucHV0OmZvY3VzLCAuaXMtd2hpdGUudGV4dGFyZWE6Zm9jdXMsIC5pcy13aGl0ZS5pcy1mb2N1c2VkLmlucHV0LCAuaXMtd2hpdGUuaXMtZm9jdXNlZC50ZXh0YXJlYSwgLmlzLXdoaXRlLmlucHV0OmFjdGl2ZSwgLmlzLXdoaXRlLnRleHRhcmVhOmFjdGl2ZSwgLmlzLXdoaXRlLmlzLWFjdGl2ZS5pbnB1dCwgLmlzLXdoaXRlLmlzLWFjdGl2ZS50ZXh0YXJlYSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpOyB9XFxuICAuaXMtYmxhY2suaW5wdXQsIC5pcy1ibGFjay50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogIzBhMGEwYTsgfVxcbiAgICAuaXMtYmxhY2suaW5wdXQ6Zm9jdXMsIC5pcy1ibGFjay50ZXh0YXJlYTpmb2N1cywgLmlzLWJsYWNrLmlzLWZvY3VzZWQuaW5wdXQsIC5pcy1ibGFjay5pcy1mb2N1c2VkLnRleHRhcmVhLCAuaXMtYmxhY2suaW5wdXQ6YWN0aXZlLCAuaXMtYmxhY2sudGV4dGFyZWE6YWN0aXZlLCAuaXMtYmxhY2suaXMtYWN0aXZlLmlucHV0LCAuaXMtYmxhY2suaXMtYWN0aXZlLnRleHRhcmVhIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMTAsIDEwLCAxMCwgMC4yNSk7IH1cXG4gIC5pcy1saWdodC5pbnB1dCwgLmlzLWxpZ2h0LnRleHRhcmVhIHtcXG4gICAgYm9yZGVyLWNvbG9yOiB3aGl0ZXNtb2tlOyB9XFxuICAgIC5pcy1saWdodC5pbnB1dDpmb2N1cywgLmlzLWxpZ2h0LnRleHRhcmVhOmZvY3VzLCAuaXMtbGlnaHQuaXMtZm9jdXNlZC5pbnB1dCwgLmlzLWxpZ2h0LmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy1saWdodC5pbnB1dDphY3RpdmUsIC5pcy1saWdodC50ZXh0YXJlYTphY3RpdmUsIC5pcy1saWdodC5pcy1hY3RpdmUuaW5wdXQsIC5pcy1saWdodC5pcy1hY3RpdmUudGV4dGFyZWEge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSgyNDUsIDI0NSwgMjQ1LCAwLjI1KTsgfVxcbiAgLmlzLWRhcmsuaW5wdXQsIC5pcy1kYXJrLnRleHRhcmVhIHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjMzYzNjM2OyB9XFxuICAgIC5pcy1kYXJrLmlucHV0OmZvY3VzLCAuaXMtZGFyay50ZXh0YXJlYTpmb2N1cywgLmlzLWRhcmsuaXMtZm9jdXNlZC5pbnB1dCwgLmlzLWRhcmsuaXMtZm9jdXNlZC50ZXh0YXJlYSwgLmlzLWRhcmsuaW5wdXQ6YWN0aXZlLCAuaXMtZGFyay50ZXh0YXJlYTphY3RpdmUsIC5pcy1kYXJrLmlzLWFjdGl2ZS5pbnB1dCwgLmlzLWRhcmsuaXMtYWN0aXZlLnRleHRhcmVhIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoNTQsIDU0LCA1NCwgMC4yNSk7IH1cXG4gIC5pcy1wcmltYXJ5LmlucHV0LCAuaXMtcHJpbWFyeS50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogIzhBNEQ3NjsgfVxcbiAgICAuaXMtcHJpbWFyeS5pbnB1dDpmb2N1cywgLmlzLXByaW1hcnkudGV4dGFyZWE6Zm9jdXMsIC5pcy1wcmltYXJ5LmlzLWZvY3VzZWQuaW5wdXQsIC5pcy1wcmltYXJ5LmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy1wcmltYXJ5LmlucHV0OmFjdGl2ZSwgLmlzLXByaW1hcnkudGV4dGFyZWE6YWN0aXZlLCAuaXMtcHJpbWFyeS5pcy1hY3RpdmUuaW5wdXQsIC5pcy1wcmltYXJ5LmlzLWFjdGl2ZS50ZXh0YXJlYSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDEzOCwgNzcsIDExOCwgMC4yNSk7IH1cXG4gIC5pcy1saW5rLmlucHV0LCAuaXMtbGluay50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogYmx1ZTsgfVxcbiAgICAuaXMtbGluay5pbnB1dDpmb2N1cywgLmlzLWxpbmsudGV4dGFyZWE6Zm9jdXMsIC5pcy1saW5rLmlzLWZvY3VzZWQuaW5wdXQsIC5pcy1saW5rLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy1saW5rLmlucHV0OmFjdGl2ZSwgLmlzLWxpbmsudGV4dGFyZWE6YWN0aXZlLCAuaXMtbGluay5pcy1hY3RpdmUuaW5wdXQsIC5pcy1saW5rLmlzLWFjdGl2ZS50ZXh0YXJlYSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDAsIDAsIDI1NSwgMC4yNSk7IH1cXG4gIC5pcy1pbmZvLmlucHV0LCAuaXMtaW5mby50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogIzMyOThkYzsgfVxcbiAgICAuaXMtaW5mby5pbnB1dDpmb2N1cywgLmlzLWluZm8udGV4dGFyZWE6Zm9jdXMsIC5pcy1pbmZvLmlzLWZvY3VzZWQuaW5wdXQsIC5pcy1pbmZvLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy1pbmZvLmlucHV0OmFjdGl2ZSwgLmlzLWluZm8udGV4dGFyZWE6YWN0aXZlLCAuaXMtaW5mby5pcy1hY3RpdmUuaW5wdXQsIC5pcy1pbmZvLmlzLWFjdGl2ZS50ZXh0YXJlYSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDUwLCAxNTIsIDIyMCwgMC4yNSk7IH1cXG4gIC5pcy1zdWNjZXNzLmlucHV0LCAuaXMtc3VjY2Vzcy50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogIzQ4Yzc3NDsgfVxcbiAgICAuaXMtc3VjY2Vzcy5pbnB1dDpmb2N1cywgLmlzLXN1Y2Nlc3MudGV4dGFyZWE6Zm9jdXMsIC5pcy1zdWNjZXNzLmlzLWZvY3VzZWQuaW5wdXQsIC5pcy1zdWNjZXNzLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy1zdWNjZXNzLmlucHV0OmFjdGl2ZSwgLmlzLXN1Y2Nlc3MudGV4dGFyZWE6YWN0aXZlLCAuaXMtc3VjY2Vzcy5pcy1hY3RpdmUuaW5wdXQsIC5pcy1zdWNjZXNzLmlzLWFjdGl2ZS50ZXh0YXJlYSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDcyLCAxOTksIDExNiwgMC4yNSk7IH1cXG4gIC5pcy13YXJuaW5nLmlucHV0LCAuaXMtd2FybmluZy50ZXh0YXJlYSB7XFxuICAgIGJvcmRlci1jb2xvcjogI2ZmZGQ1NzsgfVxcbiAgICAuaXMtd2FybmluZy5pbnB1dDpmb2N1cywgLmlzLXdhcm5pbmcudGV4dGFyZWE6Zm9jdXMsIC5pcy13YXJuaW5nLmlzLWZvY3VzZWQuaW5wdXQsIC5pcy13YXJuaW5nLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy13YXJuaW5nLmlucHV0OmFjdGl2ZSwgLmlzLXdhcm5pbmcudGV4dGFyZWE6YWN0aXZlLCAuaXMtd2FybmluZy5pcy1hY3RpdmUuaW5wdXQsIC5pcy13YXJuaW5nLmlzLWFjdGl2ZS50ZXh0YXJlYSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDI1NSwgMjIxLCA4NywgMC4yNSk7IH1cXG4gIC5pcy1kYW5nZXIuaW5wdXQsIC5pcy1kYW5nZXIudGV4dGFyZWEge1xcbiAgICBib3JkZXItY29sb3I6ICNmMTQ2Njg7IH1cXG4gICAgLmlzLWRhbmdlci5pbnB1dDpmb2N1cywgLmlzLWRhbmdlci50ZXh0YXJlYTpmb2N1cywgLmlzLWRhbmdlci5pcy1mb2N1c2VkLmlucHV0LCAuaXMtZGFuZ2VyLmlzLWZvY3VzZWQudGV4dGFyZWEsIC5pcy1kYW5nZXIuaW5wdXQ6YWN0aXZlLCAuaXMtZGFuZ2VyLnRleHRhcmVhOmFjdGl2ZSwgLmlzLWRhbmdlci5pcy1hY3RpdmUuaW5wdXQsIC5pcy1kYW5nZXIuaXMtYWN0aXZlLnRleHRhcmVhIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMjQxLCA3MCwgMTA0LCAwLjI1KTsgfVxcbiAgLmlzLXNtYWxsLmlucHV0LCAuaXMtc21hbGwudGV4dGFyZWEge1xcbiAgICBib3JkZXItcmFkaXVzOiAycHg7XFxuICAgIGZvbnQtc2l6ZTogMC43NXJlbTsgfVxcbiAgLmlzLW1lZGl1bS5pbnB1dCwgLmlzLW1lZGl1bS50ZXh0YXJlYSB7XFxuICAgIGZvbnQtc2l6ZTogMS4yNXJlbTsgfVxcbiAgLmlzLWxhcmdlLmlucHV0LCAuaXMtbGFyZ2UudGV4dGFyZWEge1xcbiAgICBmb250LXNpemU6IDEuNXJlbTsgfVxcbiAgLmlzLWZ1bGx3aWR0aC5pbnB1dCwgLmlzLWZ1bGx3aWR0aC50ZXh0YXJlYSB7XFxuICAgIGRpc3BsYXk6IGJsb2NrO1xcbiAgICB3aWR0aDogMTAwJTsgfVxcbiAgLmlzLWlubGluZS5pbnB1dCwgLmlzLWlubGluZS50ZXh0YXJlYSB7XFxuICAgIGRpc3BsYXk6IGlubGluZTtcXG4gICAgd2lkdGg6IGF1dG87IH1cXG5cXG4uaW5wdXQuaXMtcm91bmRlZCB7XFxuICBib3JkZXItcmFkaXVzOiAyOTA0ODZweDtcXG4gIHBhZGRpbmctbGVmdDogY2FsYyhjYWxjKDAuNzVlbSAtIDJweCkgKyAwLjM3NWVtKTtcXG4gIHBhZGRpbmctcmlnaHQ6IGNhbGMoY2FsYygwLjc1ZW0gLSAycHgpICsgMC4zNzVlbSk7IH1cXG5cXG4uaW5wdXQuaXMtc3RhdGljIHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gIGJveC1zaGFkb3c6IG5vbmU7XFxuICBwYWRkaW5nLWxlZnQ6IDA7XFxuICBwYWRkaW5nLXJpZ2h0OiAwOyB9XFxuXFxuLnRleHRhcmVhIHtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgbWF4LXdpZHRoOiAxMDAlO1xcbiAgbWluLXdpZHRoOiAxMDAlO1xcbiAgcGFkZGluZzogY2FsYygwLjc1ZW0gLSAycHgpO1xcbiAgcmVzaXplOiB2ZXJ0aWNhbDsgfVxcbiAgLnRleHRhcmVhOm5vdChbcm93c10pIHtcXG4gICAgbWF4LWhlaWdodDogNDBlbTtcXG4gICAgbWluLWhlaWdodDogOGVtOyB9XFxuICAudGV4dGFyZWFbcm93c10ge1xcbiAgICBoZWlnaHQ6IGluaXRpYWw7IH1cXG4gIC50ZXh0YXJlYS5oYXMtZml4ZWQtc2l6ZSB7XFxuICAgIHJlc2l6ZTogbm9uZTsgfVxcblxcbi5jaGVja2JveCwgLnJhZGlvIHtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIGxpbmUtaGVpZ2h0OiAxLjI1O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlOyB9XFxuICAuY2hlY2tib3ggaW5wdXQsIC5yYWRpbyBpbnB1dCB7XFxuICAgIGN1cnNvcjogcG9pbnRlcjsgfVxcbiAgLmNoZWNrYm94OmhvdmVyLCAucmFkaW86aG92ZXIge1xcbiAgICBjb2xvcjogIzM2MzYzNjsgfVxcbiAgLmNoZWNrYm94W2Rpc2FibGVkXSwgLnJhZGlvW2Rpc2FibGVkXSxcXG4gIGZpZWxkc2V0W2Rpc2FibGVkXSAuY2hlY2tib3gsXFxuICBmaWVsZHNldFtkaXNhYmxlZF0gLnJhZGlvIHtcXG4gICAgY29sb3I6ICM3YTdhN2E7XFxuICAgIGN1cnNvcjogbm90LWFsbG93ZWQ7IH1cXG5cXG4ucmFkaW8gKyAucmFkaW8ge1xcbiAgbWFyZ2luLWxlZnQ6IDAuNWVtOyB9XFxuXFxuLnNlbGVjdCB7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICBtYXgtd2lkdGg6IDEwMCU7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB9XFxuICAuc2VsZWN0Om5vdCguaXMtbXVsdGlwbGUpIHtcXG4gICAgaGVpZ2h0OiAyLjVlbTsgfVxcbiAgLnNlbGVjdDpub3QoLmlzLW11bHRpcGxlKTpub3QoLmlzLWxvYWRpbmcpOjphZnRlciB7XFxuICAgIGJvcmRlci1jb2xvcjogYmx1ZTtcXG4gICAgcmlnaHQ6IDEuMTI1ZW07XFxuICAgIHotaW5kZXg6IDQ7IH1cXG4gIC5zZWxlY3QuaXMtcm91bmRlZCBzZWxlY3Qge1xcbiAgICBib3JkZXItcmFkaXVzOiAyOTA0ODZweDtcXG4gICAgcGFkZGluZy1sZWZ0OiAxZW07IH1cXG4gIC5zZWxlY3Qgc2VsZWN0IHtcXG4gICAgY3Vyc29yOiBwb2ludGVyO1xcbiAgICBkaXNwbGF5OiBibG9jaztcXG4gICAgZm9udC1zaXplOiAxZW07XFxuICAgIG1heC13aWR0aDogMTAwJTtcXG4gICAgb3V0bGluZTogbm9uZTsgfVxcbiAgICAuc2VsZWN0IHNlbGVjdDo6LW1zLWV4cGFuZCB7XFxuICAgICAgZGlzcGxheTogbm9uZTsgfVxcbiAgICAuc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06aG92ZXIsXFxuICAgIGZpZWxkc2V0W2Rpc2FibGVkXSAuc2VsZWN0IHNlbGVjdDpob3ZlciB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB3aGl0ZXNtb2tlOyB9XFxuICAgIC5zZWxlY3Qgc2VsZWN0Om5vdChbbXVsdGlwbGVdKSB7XFxuICAgICAgcGFkZGluZy1yaWdodDogMi41ZW07IH1cXG4gICAgLnNlbGVjdCBzZWxlY3RbbXVsdGlwbGVdIHtcXG4gICAgICBoZWlnaHQ6IGF1dG87XFxuICAgICAgcGFkZGluZzogMDsgfVxcbiAgICAgIC5zZWxlY3Qgc2VsZWN0W211bHRpcGxlXSBvcHRpb24ge1xcbiAgICAgICAgcGFkZGluZzogMC41ZW0gMWVtOyB9XFxuICAuc2VsZWN0Om5vdCguaXMtbXVsdGlwbGUpOm5vdCguaXMtbG9hZGluZyk6aG92ZXI6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjMzYzNjM2OyB9XFxuICAuc2VsZWN0LmlzLXdoaXRlOm5vdCg6aG92ZXIpOjphZnRlciB7XFxuICAgIGJvcmRlci1jb2xvcjogd2hpdGU7IH1cXG4gIC5zZWxlY3QuaXMtd2hpdGUgc2VsZWN0IHtcXG4gICAgYm9yZGVyLWNvbG9yOiB3aGl0ZTsgfVxcbiAgICAuc2VsZWN0LmlzLXdoaXRlIHNlbGVjdDpob3ZlciwgLnNlbGVjdC5pcy13aGl0ZSBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZjJmMmYyOyB9XFxuICAgIC5zZWxlY3QuaXMtd2hpdGUgc2VsZWN0OmZvY3VzLCAuc2VsZWN0LmlzLXdoaXRlIHNlbGVjdC5pcy1mb2N1c2VkLCAuc2VsZWN0LmlzLXdoaXRlIHNlbGVjdDphY3RpdmUsIC5zZWxlY3QuaXMtd2hpdGUgc2VsZWN0LmlzLWFjdGl2ZSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpOyB9XFxuICAuc2VsZWN0LmlzLWJsYWNrOm5vdCg6aG92ZXIpOjphZnRlciB7XFxuICAgIGJvcmRlci1jb2xvcjogIzBhMGEwYTsgfVxcbiAgLnNlbGVjdC5pcy1ibGFjayBzZWxlY3Qge1xcbiAgICBib3JkZXItY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLnNlbGVjdC5pcy1ibGFjayBzZWxlY3Q6aG92ZXIsIC5zZWxlY3QuaXMtYmxhY2sgc2VsZWN0LmlzLWhvdmVyZWQge1xcbiAgICAgIGJvcmRlci1jb2xvcjogYmxhY2s7IH1cXG4gICAgLnNlbGVjdC5pcy1ibGFjayBzZWxlY3Q6Zm9jdXMsIC5zZWxlY3QuaXMtYmxhY2sgc2VsZWN0LmlzLWZvY3VzZWQsIC5zZWxlY3QuaXMtYmxhY2sgc2VsZWN0OmFjdGl2ZSwgLnNlbGVjdC5pcy1ibGFjayBzZWxlY3QuaXMtYWN0aXZlIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMTAsIDEwLCAxMCwgMC4yNSk7IH1cXG4gIC5zZWxlY3QuaXMtbGlnaHQ6bm90KDpob3Zlcik6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiB3aGl0ZXNtb2tlOyB9XFxuICAuc2VsZWN0LmlzLWxpZ2h0IHNlbGVjdCB7XFxuICAgIGJvcmRlci1jb2xvcjogd2hpdGVzbW9rZTsgfVxcbiAgICAuc2VsZWN0LmlzLWxpZ2h0IHNlbGVjdDpob3ZlciwgLnNlbGVjdC5pcy1saWdodCBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZThlOGU4OyB9XFxuICAgIC5zZWxlY3QuaXMtbGlnaHQgc2VsZWN0OmZvY3VzLCAuc2VsZWN0LmlzLWxpZ2h0IHNlbGVjdC5pcy1mb2N1c2VkLCAuc2VsZWN0LmlzLWxpZ2h0IHNlbGVjdDphY3RpdmUsIC5zZWxlY3QuaXMtbGlnaHQgc2VsZWN0LmlzLWFjdGl2ZSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDI0NSwgMjQ1LCAyNDUsIDAuMjUpOyB9XFxuICAuc2VsZWN0LmlzLWRhcms6bm90KDpob3Zlcik6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjMzYzNjM2OyB9XFxuICAuc2VsZWN0LmlzLWRhcmsgc2VsZWN0IHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjMzYzNjM2OyB9XFxuICAgIC5zZWxlY3QuaXMtZGFyayBzZWxlY3Q6aG92ZXIsIC5zZWxlY3QuaXMtZGFyayBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjMjkyOTI5OyB9XFxuICAgIC5zZWxlY3QuaXMtZGFyayBzZWxlY3Q6Zm9jdXMsIC5zZWxlY3QuaXMtZGFyayBzZWxlY3QuaXMtZm9jdXNlZCwgLnNlbGVjdC5pcy1kYXJrIHNlbGVjdDphY3RpdmUsIC5zZWxlY3QuaXMtZGFyayBzZWxlY3QuaXMtYWN0aXZlIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoNTQsIDU0LCA1NCwgMC4yNSk7IH1cXG4gIC5zZWxlY3QuaXMtcHJpbWFyeTpub3QoOmhvdmVyKTo6YWZ0ZXIge1xcbiAgICBib3JkZXItY29sb3I6ICM4QTRENzY7IH1cXG4gIC5zZWxlY3QuaXMtcHJpbWFyeSBzZWxlY3Qge1xcbiAgICBib3JkZXItY29sb3I6ICM4QTRENzY7IH1cXG4gICAgLnNlbGVjdC5pcy1wcmltYXJ5IHNlbGVjdDpob3ZlciwgLnNlbGVjdC5pcy1wcmltYXJ5IHNlbGVjdC5pcy1ob3ZlcmVkIHtcXG4gICAgICBib3JkZXItY29sb3I6ICM3YTQ0Njg7IH1cXG4gICAgLnNlbGVjdC5pcy1wcmltYXJ5IHNlbGVjdDpmb2N1cywgLnNlbGVjdC5pcy1wcmltYXJ5IHNlbGVjdC5pcy1mb2N1c2VkLCAuc2VsZWN0LmlzLXByaW1hcnkgc2VsZWN0OmFjdGl2ZSwgLnNlbGVjdC5pcy1wcmltYXJ5IHNlbGVjdC5pcy1hY3RpdmUge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSgxMzgsIDc3LCAxMTgsIDAuMjUpOyB9XFxuICAuc2VsZWN0LmlzLWxpbms6bm90KDpob3Zlcik6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiBibHVlOyB9XFxuICAuc2VsZWN0LmlzLWxpbmsgc2VsZWN0IHtcXG4gICAgYm9yZGVyLWNvbG9yOiBibHVlOyB9XFxuICAgIC5zZWxlY3QuaXMtbGluayBzZWxlY3Q6aG92ZXIsIC5zZWxlY3QuaXMtbGluayBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjMDAwMGU2OyB9XFxuICAgIC5zZWxlY3QuaXMtbGluayBzZWxlY3Q6Zm9jdXMsIC5zZWxlY3QuaXMtbGluayBzZWxlY3QuaXMtZm9jdXNlZCwgLnNlbGVjdC5pcy1saW5rIHNlbGVjdDphY3RpdmUsIC5zZWxlY3QuaXMtbGluayBzZWxlY3QuaXMtYWN0aXZlIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMCwgMCwgMjU1LCAwLjI1KTsgfVxcbiAgLnNlbGVjdC5pcy1pbmZvOm5vdCg6aG92ZXIpOjphZnRlciB7XFxuICAgIGJvcmRlci1jb2xvcjogIzMyOThkYzsgfVxcbiAgLnNlbGVjdC5pcy1pbmZvIHNlbGVjdCB7XFxuICAgIGJvcmRlci1jb2xvcjogIzMyOThkYzsgfVxcbiAgICAuc2VsZWN0LmlzLWluZm8gc2VsZWN0OmhvdmVyLCAuc2VsZWN0LmlzLWluZm8gc2VsZWN0LmlzLWhvdmVyZWQge1xcbiAgICAgIGJvcmRlci1jb2xvcjogIzIzOGNkMTsgfVxcbiAgICAuc2VsZWN0LmlzLWluZm8gc2VsZWN0OmZvY3VzLCAuc2VsZWN0LmlzLWluZm8gc2VsZWN0LmlzLWZvY3VzZWQsIC5zZWxlY3QuaXMtaW5mbyBzZWxlY3Q6YWN0aXZlLCAuc2VsZWN0LmlzLWluZm8gc2VsZWN0LmlzLWFjdGl2ZSB7XFxuICAgICAgYm94LXNoYWRvdzogMCAwIDAgMC4xMjVlbSByZ2JhKDUwLCAxNTIsIDIyMCwgMC4yNSk7IH1cXG4gIC5zZWxlY3QuaXMtc3VjY2Vzczpub3QoOmhvdmVyKTo6YWZ0ZXIge1xcbiAgICBib3JkZXItY29sb3I6ICM0OGM3NzQ7IH1cXG4gIC5zZWxlY3QuaXMtc3VjY2VzcyBzZWxlY3Qge1xcbiAgICBib3JkZXItY29sb3I6ICM0OGM3NzQ7IH1cXG4gICAgLnNlbGVjdC5pcy1zdWNjZXNzIHNlbGVjdDpob3ZlciwgLnNlbGVjdC5pcy1zdWNjZXNzIHNlbGVjdC5pcy1ob3ZlcmVkIHtcXG4gICAgICBib3JkZXItY29sb3I6ICMzYWJiNjc7IH1cXG4gICAgLnNlbGVjdC5pcy1zdWNjZXNzIHNlbGVjdDpmb2N1cywgLnNlbGVjdC5pcy1zdWNjZXNzIHNlbGVjdC5pcy1mb2N1c2VkLCAuc2VsZWN0LmlzLXN1Y2Nlc3Mgc2VsZWN0OmFjdGl2ZSwgLnNlbGVjdC5pcy1zdWNjZXNzIHNlbGVjdC5pcy1hY3RpdmUge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSg3MiwgMTk5LCAxMTYsIDAuMjUpOyB9XFxuICAuc2VsZWN0LmlzLXdhcm5pbmc6bm90KDpob3Zlcik6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjZmZkZDU3OyB9XFxuICAuc2VsZWN0LmlzLXdhcm5pbmcgc2VsZWN0IHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjZmZkZDU3OyB9XFxuICAgIC5zZWxlY3QuaXMtd2FybmluZyBzZWxlY3Q6aG92ZXIsIC5zZWxlY3QuaXMtd2FybmluZyBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZmZkODNkOyB9XFxuICAgIC5zZWxlY3QuaXMtd2FybmluZyBzZWxlY3Q6Zm9jdXMsIC5zZWxlY3QuaXMtd2FybmluZyBzZWxlY3QuaXMtZm9jdXNlZCwgLnNlbGVjdC5pcy13YXJuaW5nIHNlbGVjdDphY3RpdmUsIC5zZWxlY3QuaXMtd2FybmluZyBzZWxlY3QuaXMtYWN0aXZlIHtcXG4gICAgICBib3gtc2hhZG93OiAwIDAgMCAwLjEyNWVtIHJnYmEoMjU1LCAyMjEsIDg3LCAwLjI1KTsgfVxcbiAgLnNlbGVjdC5pcy1kYW5nZXI6bm90KDpob3Zlcik6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjZjE0NjY4OyB9XFxuICAuc2VsZWN0LmlzLWRhbmdlciBzZWxlY3Qge1xcbiAgICBib3JkZXItY29sb3I6ICNmMTQ2Njg7IH1cXG4gICAgLnNlbGVjdC5pcy1kYW5nZXIgc2VsZWN0OmhvdmVyLCAuc2VsZWN0LmlzLWRhbmdlciBzZWxlY3QuaXMtaG92ZXJlZCB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZWYyZTU1OyB9XFxuICAgIC5zZWxlY3QuaXMtZGFuZ2VyIHNlbGVjdDpmb2N1cywgLnNlbGVjdC5pcy1kYW5nZXIgc2VsZWN0LmlzLWZvY3VzZWQsIC5zZWxlY3QuaXMtZGFuZ2VyIHNlbGVjdDphY3RpdmUsIC5zZWxlY3QuaXMtZGFuZ2VyIHNlbGVjdC5pcy1hY3RpdmUge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgMCAwIDAuMTI1ZW0gcmdiYSgyNDEsIDcwLCAxMDQsIDAuMjUpOyB9XFxuICAuc2VsZWN0LmlzLXNtYWxsIHtcXG4gICAgYm9yZGVyLXJhZGl1czogMnB4O1xcbiAgICBmb250LXNpemU6IDAuNzVyZW07IH1cXG4gIC5zZWxlY3QuaXMtbWVkaXVtIHtcXG4gICAgZm9udC1zaXplOiAxLjI1cmVtOyB9XFxuICAuc2VsZWN0LmlzLWxhcmdlIHtcXG4gICAgZm9udC1zaXplOiAxLjVyZW07IH1cXG4gIC5zZWxlY3QuaXMtZGlzYWJsZWQ6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiAjN2E3YTdhOyB9XFxuICAuc2VsZWN0LmlzLWZ1bGx3aWR0aCB7XFxuICAgIHdpZHRoOiAxMDAlOyB9XFxuICAgIC5zZWxlY3QuaXMtZnVsbHdpZHRoIHNlbGVjdCB7XFxuICAgICAgd2lkdGg6IDEwMCU7IH1cXG4gIC5zZWxlY3QuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICBtYXJnaW4tdG9wOiAwO1xcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgIHJpZ2h0OiAwLjYyNWVtO1xcbiAgICB0b3A6IDAuNjI1ZW07XFxuICAgIHRyYW5zZm9ybTogbm9uZTsgfVxcbiAgLnNlbGVjdC5pcy1sb2FkaW5nLmlzLXNtYWxsOmFmdGVyIHtcXG4gICAgZm9udC1zaXplOiAwLjc1cmVtOyB9XFxuICAuc2VsZWN0LmlzLWxvYWRpbmcuaXMtbWVkaXVtOmFmdGVyIHtcXG4gICAgZm9udC1zaXplOiAxLjI1cmVtOyB9XFxuICAuc2VsZWN0LmlzLWxvYWRpbmcuaXMtbGFyZ2U6YWZ0ZXIge1xcbiAgICBmb250LXNpemU6IDEuNXJlbTsgfVxcblxcbi5maWxlIHtcXG4gIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTsgfVxcbiAgLmZpbGUuaXMtd2hpdGUgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAuZmlsZS5pcy13aGl0ZTpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLXdoaXRlLmlzLWhvdmVyZWQgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjlmOTtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gIC5maWxlLmlzLXdoaXRlOmZvY3VzIC5maWxlLWN0YSwgLmZpbGUuaXMtd2hpdGUuaXMtZm9jdXNlZCAuZmlsZS1jdGEge1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBib3gtc2hhZG93OiAwIDAgMC41ZW0gcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KTtcXG4gICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gIC5maWxlLmlzLXdoaXRlOmFjdGl2ZSAuZmlsZS1jdGEsIC5maWxlLmlzLXdoaXRlLmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmMmYyO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgLmZpbGUuaXMtYmxhY2sgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6IHdoaXRlOyB9XFxuICAuZmlsZS5pcy1ibGFjazpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLWJsYWNrLmlzLWhvdmVyZWQgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzA0MDQwNDtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6IHdoaXRlOyB9XFxuICAuZmlsZS5pcy1ibGFjazpmb2N1cyAuZmlsZS1jdGEsIC5maWxlLmlzLWJsYWNrLmlzLWZvY3VzZWQgLmZpbGUtY3RhIHtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgYm94LXNoYWRvdzogMCAwIDAuNWVtIHJnYmEoMTAsIDEwLCAxMCwgMC4yNSk7XFxuICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgLmZpbGUuaXMtYmxhY2s6YWN0aXZlIC5maWxlLWN0YSwgLmZpbGUuaXMtYmxhY2suaXMtYWN0aXZlIC5maWxlLWN0YSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6IGJsYWNrO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogd2hpdGU7IH1cXG4gIC5maWxlLmlzLWxpZ2h0IC5maWxlLWN0YSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gIC5maWxlLmlzLWxpZ2h0OmhvdmVyIC5maWxlLWN0YSwgLmZpbGUuaXMtbGlnaHQuaXMtaG92ZXJlZCAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZWVlZWVlO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAuZmlsZS5pcy1saWdodDpmb2N1cyAuZmlsZS1jdGEsIC5maWxlLmlzLWxpZ2h0LmlzLWZvY3VzZWQgLmZpbGUtY3RhIHtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgYm94LXNoYWRvdzogMCAwIDAuNWVtIHJnYmEoMjQ1LCAyNDUsIDI0NSwgMC4yNSk7XFxuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gIC5maWxlLmlzLWxpZ2h0OmFjdGl2ZSAuZmlsZS1jdGEsIC5maWxlLmlzLWxpZ2h0LmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAuZmlsZS5pcy1kYXJrIC5maWxlLWN0YSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICMzNjM2MzY7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAuZmlsZS5pcy1kYXJrOmhvdmVyIC5maWxlLWN0YSwgLmZpbGUuaXMtZGFyay5pcy1ob3ZlcmVkIC5maWxlLWN0YSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICMyZjJmMmY7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAuZmlsZS5pcy1kYXJrOmZvY3VzIC5maWxlLWN0YSwgLmZpbGUuaXMtZGFyay5pcy1mb2N1c2VkIC5maWxlLWN0YSB7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGJveC1zaGFkb3c6IDAgMCAwLjVlbSByZ2JhKDU0LCA1NCwgNTQsIDAuMjUpO1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtZGFyazphY3RpdmUgLmZpbGUtY3RhLCAuZmlsZS5pcy1kYXJrLmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjkyOTI5O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtcHJpbWFyeSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjOEE0RDc2O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtcHJpbWFyeTpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLXByaW1hcnkuaXMtaG92ZXJlZCAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjODI0ODZmO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtcHJpbWFyeTpmb2N1cyAuZmlsZS1jdGEsIC5maWxlLmlzLXByaW1hcnkuaXMtZm9jdXNlZCAuZmlsZS1jdGEge1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBib3gtc2hhZG93OiAwIDAgMC41ZW0gcmdiYSgxMzgsIDc3LCAxMTgsIDAuMjUpO1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtcHJpbWFyeTphY3RpdmUgLmZpbGUtY3RhLCAuZmlsZS5pcy1wcmltYXJ5LmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjN2E0NDY4O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtbGluayAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBibHVlO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtbGluazpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLWxpbmsuaXMtaG92ZXJlZCAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMGYyO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtbGluazpmb2N1cyAuZmlsZS1jdGEsIC5maWxlLmlzLWxpbmsuaXMtZm9jdXNlZCAuZmlsZS1jdGEge1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBib3gtc2hhZG93OiAwIDAgMC41ZW0gcmdiYSgwLCAwLCAyNTUsIDAuMjUpO1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtbGluazphY3RpdmUgLmZpbGUtY3RhLCAuZmlsZS5pcy1saW5rLmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMGU2O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtaW5mbyAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzI5OGRjO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtaW5mbzpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLWluZm8uaXMtaG92ZXJlZCAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjc5M2RhO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtaW5mbzpmb2N1cyAuZmlsZS1jdGEsIC5maWxlLmlzLWluZm8uaXMtZm9jdXNlZCAuZmlsZS1jdGEge1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBib3gtc2hhZG93OiAwIDAgMC41ZW0gcmdiYSg1MCwgMTUyLCAyMjAsIDAuMjUpO1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtaW5mbzphY3RpdmUgLmZpbGUtY3RhLCAuZmlsZS5pcy1pbmZvLmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjM4Y2QxO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtc3VjY2VzcyAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDhjNzc0O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtc3VjY2Vzczpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLXN1Y2Nlc3MuaXMtaG92ZXJlZCAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjM2VjNDZkO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtc3VjY2Vzczpmb2N1cyAuZmlsZS1jdGEsIC5maWxlLmlzLXN1Y2Nlc3MuaXMtZm9jdXNlZCAuZmlsZS1jdGEge1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBib3gtc2hhZG93OiAwIDAgMC41ZW0gcmdiYSg3MiwgMTk5LCAxMTYsIDAuMjUpO1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtc3VjY2VzczphY3RpdmUgLmZpbGUtY3RhLCAuZmlsZS5pcy1zdWNjZXNzLmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjM2FiYjY3O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtd2FybmluZyAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZkZDU3O1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAuZmlsZS5pcy13YXJuaW5nOmhvdmVyIC5maWxlLWN0YSwgLmZpbGUuaXMtd2FybmluZy5pcy1ob3ZlcmVkIC5maWxlLWN0YSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmRiNGE7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gIC5maWxlLmlzLXdhcm5pbmc6Zm9jdXMgLmZpbGUtY3RhLCAuZmlsZS5pcy13YXJuaW5nLmlzLWZvY3VzZWQgLmZpbGUtY3RhIHtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgYm94LXNoYWRvdzogMCAwIDAuNWVtIHJnYmEoMjU1LCAyMjEsIDg3LCAwLjI1KTtcXG4gICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgLmZpbGUuaXMtd2FybmluZzphY3RpdmUgLmZpbGUtY3RhLCAuZmlsZS5pcy13YXJuaW5nLmlzLWFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZkODNkO1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAuZmlsZS5pcy1kYW5nZXIgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2YxNDY2ODtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6ICNmZmY7IH1cXG4gIC5maWxlLmlzLWRhbmdlcjpob3ZlciAuZmlsZS1jdGEsIC5maWxlLmlzLWRhbmdlci5pcy1ob3ZlcmVkIC5maWxlLWN0YSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmMDNhNWY7XFxuICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAuZmlsZS5pcy1kYW5nZXI6Zm9jdXMgLmZpbGUtY3RhLCAuZmlsZS5pcy1kYW5nZXIuaXMtZm9jdXNlZCAuZmlsZS1jdGEge1xcbiAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xcbiAgICBib3gtc2hhZG93OiAwIDAgMC41ZW0gcmdiYSgyNDEsIDcwLCAxMDQsIDAuMjUpO1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmZpbGUuaXMtZGFuZ2VyOmFjdGl2ZSAuZmlsZS1jdGEsIC5maWxlLmlzLWRhbmdlci5pcy1hY3RpdmUgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2VmMmU1NTtcXG4gICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudDtcXG4gICAgY29sb3I6ICNmZmY7IH1cXG4gIC5maWxlLmlzLXNtYWxsIHtcXG4gICAgZm9udC1zaXplOiAwLjc1cmVtOyB9XFxuICAuZmlsZS5pcy1tZWRpdW0ge1xcbiAgICBmb250LXNpemU6IDEuMjVyZW07IH1cXG4gICAgLmZpbGUuaXMtbWVkaXVtIC5maWxlLWljb24gLmZhIHtcXG4gICAgICBmb250LXNpemU6IDIxcHg7IH1cXG4gIC5maWxlLmlzLWxhcmdlIHtcXG4gICAgZm9udC1zaXplOiAxLjVyZW07IH1cXG4gICAgLmZpbGUuaXMtbGFyZ2UgLmZpbGUtaWNvbiAuZmEge1xcbiAgICAgIGZvbnQtc2l6ZTogMjhweDsgfVxcbiAgLmZpbGUuaGFzLW5hbWUgLmZpbGUtY3RhIHtcXG4gICAgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IDA7XFxuICAgIGJvcmRlci10b3AtcmlnaHQtcmFkaXVzOiAwOyB9XFxuICAuZmlsZS5oYXMtbmFtZSAuZmlsZS1uYW1lIHtcXG4gICAgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogMDtcXG4gICAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogMDsgfVxcbiAgLmZpbGUuaGFzLW5hbWUuaXMtZW1wdHkgLmZpbGUtY3RhIHtcXG4gICAgYm9yZGVyLXJhZGl1czogNHB4OyB9XFxuICAuZmlsZS5oYXMtbmFtZS5pcy1lbXB0eSAuZmlsZS1uYW1lIHtcXG4gICAgZGlzcGxheTogbm9uZTsgfVxcbiAgLmZpbGUuaXMtYm94ZWQgLmZpbGUtbGFiZWwge1xcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyB9XFxuICAuZmlsZS5pcy1ib3hlZCAuZmlsZS1jdGEge1xcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgICBoZWlnaHQ6IGF1dG87XFxuICAgIHBhZGRpbmc6IDFlbSAzZW07IH1cXG4gIC5maWxlLmlzLWJveGVkIC5maWxlLW5hbWUge1xcbiAgICBib3JkZXItd2lkdGg6IDAgMXB4IDFweDsgfVxcbiAgLmZpbGUuaXMtYm94ZWQgLmZpbGUtaWNvbiB7XFxuICAgIGhlaWdodDogMS41ZW07XFxuICAgIHdpZHRoOiAxLjVlbTsgfVxcbiAgICAuZmlsZS5pcy1ib3hlZCAuZmlsZS1pY29uIC5mYSB7XFxuICAgICAgZm9udC1zaXplOiAyMXB4OyB9XFxuICAuZmlsZS5pcy1ib3hlZC5pcy1zbWFsbCAuZmlsZS1pY29uIC5mYSB7XFxuICAgIGZvbnQtc2l6ZTogMTRweDsgfVxcbiAgLmZpbGUuaXMtYm94ZWQuaXMtbWVkaXVtIC5maWxlLWljb24gLmZhIHtcXG4gICAgZm9udC1zaXplOiAyOHB4OyB9XFxuICAuZmlsZS5pcy1ib3hlZC5pcy1sYXJnZSAuZmlsZS1pY29uIC5mYSB7XFxuICAgIGZvbnQtc2l6ZTogMzVweDsgfVxcbiAgLmZpbGUuaXMtYm94ZWQuaGFzLW5hbWUgLmZpbGUtY3RhIHtcXG4gICAgYm9yZGVyLXJhZGl1czogNHB4IDRweCAwIDA7IH1cXG4gIC5maWxlLmlzLWJveGVkLmhhcy1uYW1lIC5maWxlLW5hbWUge1xcbiAgICBib3JkZXItcmFkaXVzOiAwIDAgNHB4IDRweDtcXG4gICAgYm9yZGVyLXdpZHRoOiAwIDFweCAxcHg7IH1cXG4gIC5maWxlLmlzLWNlbnRlcmVkIHtcXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IH1cXG4gIC5maWxlLmlzLWZ1bGx3aWR0aCAuZmlsZS1sYWJlbCB7XFxuICAgIHdpZHRoOiAxMDAlOyB9XFxuICAuZmlsZS5pcy1mdWxsd2lkdGggLmZpbGUtbmFtZSB7XFxuICAgIGZsZXgtZ3JvdzogMTtcXG4gICAgbWF4LXdpZHRoOiBub25lOyB9XFxuICAuZmlsZS5pcy1yaWdodCB7XFxuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7IH1cXG4gICAgLmZpbGUuaXMtcmlnaHQgLmZpbGUtY3RhIHtcXG4gICAgICBib3JkZXItcmFkaXVzOiAwIDRweCA0cHggMDsgfVxcbiAgICAuZmlsZS5pcy1yaWdodCAuZmlsZS1uYW1lIHtcXG4gICAgICBib3JkZXItcmFkaXVzOiA0cHggMCAwIDRweDtcXG4gICAgICBib3JkZXItd2lkdGg6IDFweCAwIDFweCAxcHg7XFxuICAgICAgb3JkZXI6IC0xOyB9XFxuXFxuLmZpbGUtbGFiZWwge1xcbiAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbiAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTsgfVxcbiAgLmZpbGUtbGFiZWw6aG92ZXIgLmZpbGUtY3RhIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2VlZWVlZTtcXG4gICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gIC5maWxlLWxhYmVsOmhvdmVyIC5maWxlLW5hbWUge1xcbiAgICBib3JkZXItY29sb3I6ICNkNWQ1ZDU7IH1cXG4gIC5maWxlLWxhYmVsOmFjdGl2ZSAuZmlsZS1jdGEge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xcbiAgICBjb2xvcjogIzM2MzYzNjsgfVxcbiAgLmZpbGUtbGFiZWw6YWN0aXZlIC5maWxlLW5hbWUge1xcbiAgICBib3JkZXItY29sb3I6ICNjZmNmY2Y7IH1cXG5cXG4uZmlsZS1pbnB1dCB7XFxuICBoZWlnaHQ6IDEwMCU7XFxuICBsZWZ0OiAwO1xcbiAgb3BhY2l0eTogMDtcXG4gIG91dGxpbmU6IG5vbmU7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICB0b3A6IDA7XFxuICB3aWR0aDogMTAwJTsgfVxcblxcbi5maWxlLWN0YSxcXG4uZmlsZS1uYW1lIHtcXG4gIGJvcmRlci1jb2xvcjogI2RiZGJkYjtcXG4gIGJvcmRlci1yYWRpdXM6IDRweDtcXG4gIGZvbnQtc2l6ZTogMWVtO1xcbiAgcGFkZGluZy1sZWZ0OiAxZW07XFxuICBwYWRkaW5nLXJpZ2h0OiAxZW07XFxuICB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XFxuXFxuLmZpbGUtY3RhIHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICBjb2xvcjogIzc1Nzc2MzsgfVxcblxcbi5maWxlLW5hbWUge1xcbiAgYm9yZGVyLWNvbG9yOiAjZGJkYmRiO1xcbiAgYm9yZGVyLXN0eWxlOiBzb2xpZDtcXG4gIGJvcmRlci13aWR0aDogMXB4IDFweCAxcHggMDtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgbWF4LXdpZHRoOiAxNmVtO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gIHRleHQtYWxpZ246IGxlZnQ7XFxuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsgfVxcblxcbi5maWxlLWljb24ge1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBoZWlnaHQ6IDFlbTtcXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgbWFyZ2luLXJpZ2h0OiAwLjVlbTtcXG4gIHdpZHRoOiAxZW07IH1cXG4gIC5maWxlLWljb24gLmZhIHtcXG4gICAgZm9udC1zaXplOiAxNHB4OyB9XFxuXFxuLmxhYmVsIHtcXG4gIGNvbG9yOiAjMzYzNjM2O1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICBmb250LXNpemU6IDFyZW07XFxuICBmb250LXdlaWdodDogNzAwOyB9XFxuICAubGFiZWw6bm90KDpsYXN0LWNoaWxkKSB7XFxuICAgIG1hcmdpbi1ib3R0b206IDAuNWVtOyB9XFxuICAubGFiZWwuaXMtc21hbGwge1xcbiAgICBmb250LXNpemU6IDAuNzVyZW07IH1cXG4gIC5sYWJlbC5pcy1tZWRpdW0ge1xcbiAgICBmb250LXNpemU6IDEuMjVyZW07IH1cXG4gIC5sYWJlbC5pcy1sYXJnZSB7XFxuICAgIGZvbnQtc2l6ZTogMS41cmVtOyB9XFxuXFxuLmhlbHAge1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICBmb250LXNpemU6IDAuNzVyZW07XFxuICBtYXJnaW4tdG9wOiAwLjI1cmVtOyB9XFxuICAuaGVscC5pcy13aGl0ZSB7XFxuICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgLmhlbHAuaXMtYmxhY2sge1xcbiAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgLmhlbHAuaXMtbGlnaHQge1xcbiAgICBjb2xvcjogd2hpdGVzbW9rZTsgfVxcbiAgLmhlbHAuaXMtZGFyayB7XFxuICAgIGNvbG9yOiAjMzYzNjM2OyB9XFxuICAuaGVscC5pcy1wcmltYXJ5IHtcXG4gICAgY29sb3I6ICM4QTRENzY7IH1cXG4gIC5oZWxwLmlzLWxpbmsge1xcbiAgICBjb2xvcjogYmx1ZTsgfVxcbiAgLmhlbHAuaXMtaW5mbyB7XFxuICAgIGNvbG9yOiAjMzI5OGRjOyB9XFxuICAuaGVscC5pcy1zdWNjZXNzIHtcXG4gICAgY29sb3I6ICM0OGM3NzQ7IH1cXG4gIC5oZWxwLmlzLXdhcm5pbmcge1xcbiAgICBjb2xvcjogI2ZmZGQ1NzsgfVxcbiAgLmhlbHAuaXMtZGFuZ2VyIHtcXG4gICAgY29sb3I6ICNmMTQ2Njg7IH1cXG5cXG4uZmllbGQ6bm90KDpsYXN0LWNoaWxkKSB7XFxuICBtYXJnaW4tYm90dG9tOiAwLjc1cmVtOyB9XFxuXFxuLmZpZWxkLmhhcy1hZGRvbnMge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsgfVxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2w6bm90KDpsYXN0LWNoaWxkKSB7XFxuICAgIG1hcmdpbi1yaWdodDogLTFweDsgfVxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2w6bm90KDpmaXJzdC1jaGlsZCk6bm90KDpsYXN0LWNoaWxkKSAuYnV0dG9uLFxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2w6bm90KDpmaXJzdC1jaGlsZCk6bm90KDpsYXN0LWNoaWxkKSAuaW5wdXQsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbDpub3QoOmZpcnN0LWNoaWxkKTpub3QoOmxhc3QtY2hpbGQpIC5zZWxlY3Qgc2VsZWN0IHtcXG4gICAgYm9yZGVyLXJhZGl1czogMDsgfVxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2w6Zmlyc3QtY2hpbGQ6bm90KDpvbmx5LWNoaWxkKSAuYnV0dG9uLFxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2w6Zmlyc3QtY2hpbGQ6bm90KDpvbmx5LWNoaWxkKSAuaW5wdXQsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbDpmaXJzdC1jaGlsZDpub3QoOm9ubHktY2hpbGQpIC5zZWxlY3Qgc2VsZWN0IHtcXG4gICAgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IDA7XFxuICAgIGJvcmRlci10b3AtcmlnaHQtcmFkaXVzOiAwOyB9XFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbDpsYXN0LWNoaWxkOm5vdCg6b25seS1jaGlsZCkgLmJ1dHRvbixcXG4gIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sOmxhc3QtY2hpbGQ6bm90KDpvbmx5LWNoaWxkKSAuaW5wdXQsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbDpsYXN0LWNoaWxkOm5vdCg6b25seS1jaGlsZCkgLnNlbGVjdCBzZWxlY3Qge1xcbiAgICBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiAwO1xcbiAgICBib3JkZXItdG9wLWxlZnQtcmFkaXVzOiAwOyB9XFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuYnV0dG9uOm5vdChbZGlzYWJsZWRdKTpob3ZlciwgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLmJ1dHRvbjpub3QoW2Rpc2FibGVkXSkuaXMtaG92ZXJlZCxcXG4gIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5pbnB1dDpub3QoW2Rpc2FibGVkXSk6aG92ZXIsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuaW5wdXQ6bm90KFtkaXNhYmxlZF0pLmlzLWhvdmVyZWQsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuc2VsZWN0IHNlbGVjdDpub3QoW2Rpc2FibGVkXSk6aG92ZXIsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuc2VsZWN0IHNlbGVjdDpub3QoW2Rpc2FibGVkXSkuaXMtaG92ZXJlZCB7XFxuICAgIHotaW5kZXg6IDI7IH1cXG4gIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5idXR0b246bm90KFtkaXNhYmxlZF0pOmZvY3VzLCAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuYnV0dG9uOm5vdChbZGlzYWJsZWRdKS5pcy1mb2N1c2VkLCAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuYnV0dG9uOm5vdChbZGlzYWJsZWRdKTphY3RpdmUsIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5idXR0b246bm90KFtkaXNhYmxlZF0pLmlzLWFjdGl2ZSxcXG4gIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5pbnB1dDpub3QoW2Rpc2FibGVkXSk6Zm9jdXMsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuaW5wdXQ6bm90KFtkaXNhYmxlZF0pLmlzLWZvY3VzZWQsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuaW5wdXQ6bm90KFtkaXNhYmxlZF0pOmFjdGl2ZSxcXG4gIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5pbnB1dDpub3QoW2Rpc2FibGVkXSkuaXMtYWN0aXZlLFxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLnNlbGVjdCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pOmZvY3VzLFxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLnNlbGVjdCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLmlzLWZvY3VzZWQsXFxuICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuc2VsZWN0IHNlbGVjdDpub3QoW2Rpc2FibGVkXSk6YWN0aXZlLFxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLnNlbGVjdCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLmlzLWFjdGl2ZSB7XFxuICAgIHotaW5kZXg6IDM7IH1cXG4gICAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLmJ1dHRvbjpub3QoW2Rpc2FibGVkXSk6Zm9jdXM6aG92ZXIsIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5idXR0b246bm90KFtkaXNhYmxlZF0pLmlzLWZvY3VzZWQ6aG92ZXIsIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5idXR0b246bm90KFtkaXNhYmxlZF0pOmFjdGl2ZTpob3ZlciwgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLmJ1dHRvbjpub3QoW2Rpc2FibGVkXSkuaXMtYWN0aXZlOmhvdmVyLFxcbiAgICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuaW5wdXQ6bm90KFtkaXNhYmxlZF0pOmZvY3VzOmhvdmVyLFxcbiAgICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuaW5wdXQ6bm90KFtkaXNhYmxlZF0pLmlzLWZvY3VzZWQ6aG92ZXIsXFxuICAgIC5maWVsZC5oYXMtYWRkb25zIC5jb250cm9sIC5pbnB1dDpub3QoW2Rpc2FibGVkXSk6YWN0aXZlOmhvdmVyLFxcbiAgICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuaW5wdXQ6bm90KFtkaXNhYmxlZF0pLmlzLWFjdGl2ZTpob3ZlcixcXG4gICAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLnNlbGVjdCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pOmZvY3VzOmhvdmVyLFxcbiAgICAuZmllbGQuaGFzLWFkZG9ucyAuY29udHJvbCAuc2VsZWN0IHNlbGVjdDpub3QoW2Rpc2FibGVkXSkuaXMtZm9jdXNlZDpob3ZlcixcXG4gICAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLnNlbGVjdCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pOmFjdGl2ZTpob3ZlcixcXG4gICAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wgLnNlbGVjdCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLmlzLWFjdGl2ZTpob3ZlciB7XFxuICAgICAgei1pbmRleDogNDsgfVxcbiAgLmZpZWxkLmhhcy1hZGRvbnMgLmNvbnRyb2wuaXMtZXhwYW5kZWQge1xcbiAgICBmbGV4LWdyb3c6IDE7XFxuICAgIGZsZXgtc2hyaW5rOiAxOyB9XFxuICAuZmllbGQuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWNlbnRlcmVkIHtcXG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IH1cXG4gIC5maWVsZC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtcmlnaHQge1xcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kOyB9XFxuICAuZmllbGQuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWZ1bGx3aWR0aCAuY29udHJvbCB7XFxuICAgIGZsZXgtZ3JvdzogMTtcXG4gICAgZmxleC1zaHJpbms6IDA7IH1cXG5cXG4uZmllbGQuaXMtZ3JvdXBlZCB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0OyB9XFxuICAuZmllbGQuaXMtZ3JvdXBlZCA+IC5jb250cm9sIHtcXG4gICAgZmxleC1zaHJpbms6IDA7IH1cXG4gICAgLmZpZWxkLmlzLWdyb3VwZWQgPiAuY29udHJvbDpub3QoOmxhc3QtY2hpbGQpIHtcXG4gICAgICBtYXJnaW4tYm90dG9tOiAwO1xcbiAgICAgIG1hcmdpbi1yaWdodDogMC43NXJlbTsgfVxcbiAgICAuZmllbGQuaXMtZ3JvdXBlZCA+IC5jb250cm9sLmlzLWV4cGFuZGVkIHtcXG4gICAgICBmbGV4LWdyb3c6IDE7XFxuICAgICAgZmxleC1zaHJpbms6IDE7IH1cXG4gIC5maWVsZC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtY2VudGVyZWQge1xcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgfVxcbiAgLmZpZWxkLmlzLWdyb3VwZWQuaXMtZ3JvdXBlZC1yaWdodCB7XFxuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7IH1cXG4gIC5maWVsZC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtbXVsdGlsaW5lIHtcXG4gICAgZmxleC13cmFwOiB3cmFwOyB9XFxuICAgIC5maWVsZC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtbXVsdGlsaW5lID4gLmNvbnRyb2w6bGFzdC1jaGlsZCwgLmZpZWxkLmlzLWdyb3VwZWQuaXMtZ3JvdXBlZC1tdWx0aWxpbmUgPiAuY29udHJvbDpub3QoOmxhc3QtY2hpbGQpIHtcXG4gICAgICBtYXJnaW4tYm90dG9tOiAwLjc1cmVtOyB9XFxuICAgIC5maWVsZC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtbXVsdGlsaW5lOmxhc3QtY2hpbGQge1xcbiAgICAgIG1hcmdpbi1ib3R0b206IC0wLjc1cmVtOyB9XFxuICAgIC5maWVsZC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtbXVsdGlsaW5lOm5vdCg6bGFzdC1jaGlsZCkge1xcbiAgICAgIG1hcmdpbi1ib3R0b206IDA7IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCksIHByaW50IHtcXG4gIC5maWVsZC5pcy1ob3Jpem9udGFsIHtcXG4gICAgZGlzcGxheTogZmxleDsgfSB9XFxuXFxuLmZpZWxkLWxhYmVsIC5sYWJlbCB7XFxuICBmb250LXNpemU6IGluaGVyaXQ7IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgLmZpZWxkLWxhYmVsIHtcXG4gICAgbWFyZ2luLWJvdHRvbTogMC41cmVtOyB9IH1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCksIHByaW50IHtcXG4gIC5maWVsZC1sYWJlbCB7XFxuICAgIGZsZXgtYmFzaXM6IDA7XFxuICAgIGZsZXgtZ3JvdzogMTtcXG4gICAgZmxleC1zaHJpbms6IDA7XFxuICAgIG1hcmdpbi1yaWdodDogMS41cmVtO1xcbiAgICB0ZXh0LWFsaWduOiByaWdodDsgfVxcbiAgICAuZmllbGQtbGFiZWwuaXMtc21hbGwge1xcbiAgICAgIGZvbnQtc2l6ZTogMC43NXJlbTtcXG4gICAgICBwYWRkaW5nLXRvcDogMC4zNzVlbTsgfVxcbiAgICAuZmllbGQtbGFiZWwuaXMtbm9ybWFsIHtcXG4gICAgICBwYWRkaW5nLXRvcDogMC4zNzVlbTsgfVxcbiAgICAuZmllbGQtbGFiZWwuaXMtbWVkaXVtIHtcXG4gICAgICBmb250LXNpemU6IDEuMjVyZW07XFxuICAgICAgcGFkZGluZy10b3A6IDAuMzc1ZW07IH1cXG4gICAgLmZpZWxkLWxhYmVsLmlzLWxhcmdlIHtcXG4gICAgICBmb250LXNpemU6IDEuNXJlbTtcXG4gICAgICBwYWRkaW5nLXRvcDogMC4zNzVlbTsgfSB9XFxuXFxuLmZpZWxkLWJvZHkgLmZpZWxkIC5maWVsZCB7XFxuICBtYXJnaW4tYm90dG9tOiAwOyB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAuZmllbGQtYm9keSB7XFxuICAgIGRpc3BsYXk6IGZsZXg7XFxuICAgIGZsZXgtYmFzaXM6IDA7XFxuICAgIGZsZXgtZ3JvdzogNTtcXG4gICAgZmxleC1zaHJpbms6IDE7IH1cXG4gICAgLmZpZWxkLWJvZHkgLmZpZWxkIHtcXG4gICAgICBtYXJnaW4tYm90dG9tOiAwOyB9XFxuICAgIC5maWVsZC1ib2R5ID4gLmZpZWxkIHtcXG4gICAgICBmbGV4LXNocmluazogMTsgfVxcbiAgICAgIC5maWVsZC1ib2R5ID4gLmZpZWxkOm5vdCguaXMtbmFycm93KSB7XFxuICAgICAgICBmbGV4LWdyb3c6IDE7IH1cXG4gICAgICAuZmllbGQtYm9keSA+IC5maWVsZDpub3QoOmxhc3QtY2hpbGQpIHtcXG4gICAgICAgIG1hcmdpbi1yaWdodDogMC43NXJlbTsgfSB9XFxuXFxuLmNvbnRyb2wge1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIGNsZWFyOiBib3RoO1xcbiAgZm9udC1zaXplOiAxcmVtO1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgdGV4dC1hbGlnbjogbGVmdDsgfVxcbiAgLmNvbnRyb2wuaGFzLWljb25zLWxlZnQgLmlucHV0OmZvY3VzIH4gLmljb24sXFxuICAuY29udHJvbC5oYXMtaWNvbnMtbGVmdCAuc2VsZWN0OmZvY3VzIH4gLmljb24sIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuaW5wdXQ6Zm9jdXMgfiAuaWNvbixcXG4gIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuc2VsZWN0OmZvY3VzIH4gLmljb24ge1xcbiAgICBjb2xvcjogIzc1Nzc2MzsgfVxcbiAgLmNvbnRyb2wuaGFzLWljb25zLWxlZnQgLmlucHV0LmlzLXNtYWxsIH4gLmljb24sXFxuICAuY29udHJvbC5oYXMtaWNvbnMtbGVmdCAuc2VsZWN0LmlzLXNtYWxsIH4gLmljb24sIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuaW5wdXQuaXMtc21hbGwgfiAuaWNvbixcXG4gIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuc2VsZWN0LmlzLXNtYWxsIH4gLmljb24ge1xcbiAgICBmb250LXNpemU6IDAuNzVyZW07IH1cXG4gIC5jb250cm9sLmhhcy1pY29ucy1sZWZ0IC5pbnB1dC5pcy1tZWRpdW0gfiAuaWNvbixcXG4gIC5jb250cm9sLmhhcy1pY29ucy1sZWZ0IC5zZWxlY3QuaXMtbWVkaXVtIH4gLmljb24sIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuaW5wdXQuaXMtbWVkaXVtIH4gLmljb24sXFxuICAuY29udHJvbC5oYXMtaWNvbnMtcmlnaHQgLnNlbGVjdC5pcy1tZWRpdW0gfiAuaWNvbiB7XFxuICAgIGZvbnQtc2l6ZTogMS4yNXJlbTsgfVxcbiAgLmNvbnRyb2wuaGFzLWljb25zLWxlZnQgLmlucHV0LmlzLWxhcmdlIH4gLmljb24sXFxuICAuY29udHJvbC5oYXMtaWNvbnMtbGVmdCAuc2VsZWN0LmlzLWxhcmdlIH4gLmljb24sIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuaW5wdXQuaXMtbGFyZ2UgfiAuaWNvbixcXG4gIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuc2VsZWN0LmlzLWxhcmdlIH4gLmljb24ge1xcbiAgICBmb250LXNpemU6IDEuNXJlbTsgfVxcbiAgLmNvbnRyb2wuaGFzLWljb25zLWxlZnQgLmljb24sIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuaWNvbiB7XFxuICAgIGNvbG9yOiAjZGJkYmRiO1xcbiAgICBoZWlnaHQ6IDIuNWVtO1xcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICB0b3A6IDA7XFxuICAgIHdpZHRoOiAyLjVlbTtcXG4gICAgei1pbmRleDogNDsgfVxcbiAgLmNvbnRyb2wuaGFzLWljb25zLWxlZnQgLmlucHV0LFxcbiAgLmNvbnRyb2wuaGFzLWljb25zLWxlZnQgLnNlbGVjdCBzZWxlY3Qge1xcbiAgICBwYWRkaW5nLWxlZnQ6IDIuNWVtOyB9XFxuICAuY29udHJvbC5oYXMtaWNvbnMtbGVmdCAuaWNvbi5pcy1sZWZ0IHtcXG4gICAgbGVmdDogMDsgfVxcbiAgLmNvbnRyb2wuaGFzLWljb25zLXJpZ2h0IC5pbnB1dCxcXG4gIC5jb250cm9sLmhhcy1pY29ucy1yaWdodCAuc2VsZWN0IHNlbGVjdCB7XFxuICAgIHBhZGRpbmctcmlnaHQ6IDIuNWVtOyB9XFxuICAuY29udHJvbC5oYXMtaWNvbnMtcmlnaHQgLmljb24uaXMtcmlnaHQge1xcbiAgICByaWdodDogMDsgfVxcbiAgLmNvbnRyb2wuaXMtbG9hZGluZzo6YWZ0ZXIge1xcbiAgICBwb3NpdGlvbjogYWJzb2x1dGUgIWltcG9ydGFudDtcXG4gICAgcmlnaHQ6IDAuNjI1ZW07XFxuICAgIHRvcDogMC42MjVlbTtcXG4gICAgei1pbmRleDogNDsgfVxcbiAgLmNvbnRyb2wuaXMtbG9hZGluZy5pcy1zbWFsbDphZnRlciB7XFxuICAgIGZvbnQtc2l6ZTogMC43NXJlbTsgfVxcbiAgLmNvbnRyb2wuaXMtbG9hZGluZy5pcy1tZWRpdW06YWZ0ZXIge1xcbiAgICBmb250LXNpemU6IDEuMjVyZW07IH1cXG4gIC5jb250cm9sLmlzLWxvYWRpbmcuaXMtbGFyZ2U6YWZ0ZXIge1xcbiAgICBmb250LXNpemU6IDEuNXJlbTsgfVxcblxcbi5uYXZiYXIge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICBtaW4taGVpZ2h0OiAzLjI1cmVtO1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgei1pbmRleDogMzA7IH1cXG4gIC5uYXZiYXIuaXMtd2hpdGUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWJyYW5kID4gLm5hdmJhci1pdGVtLFxcbiAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLCAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLCAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmMmYyZjI7XFxuICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogIzBhMGEwYTsgfVxcbiAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItYnVyZ2VyIHtcXG4gICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItc3RhcnQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItZW5kID4gLm5hdmJhci1pdGVtLFxcbiAgICAgIC5uYXZiYXIuaXMtd2hpdGUgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtd2hpdGUgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtd2hpdGUgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtd2hpdGUgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtd2hpdGUgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItZW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YyZjJmMjtcXG4gICAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazo6YWZ0ZXIsXFxuICAgICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogIzBhMGEwYTsgfVxcbiAgICAgIC5uYXZiYXIuaXMtd2hpdGUgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpmb2N1cyAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy13aGl0ZSAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duOmhvdmVyIC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd24uaXMtYWN0aXZlIC5uYXZiYXItbGluayB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmMmYyO1xcbiAgICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgICAubmF2YmFyLmlzLXdoaXRlIC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgICAgICBjb2xvcjogIzBhMGEwYTsgfSB9XFxuICAubmF2YmFyLmlzLWJsYWNrIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1icmFuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogYmxhY2s7XFxuICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6IHdoaXRlOyB9XFxuICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1idXJnZXIge1xcbiAgICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItc3RhcnQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItZW5kID4gLm5hdmJhci1pdGVtLFxcbiAgICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IGJsYWNrO1xcbiAgICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazo6YWZ0ZXIsXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogd2hpdGU7IH1cXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246Zm9jdXMgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtYmxhY2sgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpob3ZlciAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1ibGFjayAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWFjdGl2ZSAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogYmxhY2s7XFxuICAgICAgICBjb2xvcjogd2hpdGU7IH1cXG4gICAgICAubmF2YmFyLmlzLWJsYWNrIC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgICAgIGNvbG9yOiB3aGl0ZTsgfSB9XFxuICAubmF2YmFyLmlzLWxpZ2h0IHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGVzbW9rZTtcXG4gICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItYnJhbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbmsge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1idXJnZXIge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAgICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLXN0YXJ0ID4gLm5hdmJhci1pdGVtLFxcbiAgICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLWVuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItZW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItZW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U4ZThlODtcXG4gICAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOjphZnRlcixcXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItZW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246Zm9jdXMgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtbGlnaHQgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpob3ZlciAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1saWdodCAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWFjdGl2ZSAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U4ZThlODtcXG4gICAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAubmF2YmFyLmlzLWxpZ2h0IC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGVzbW9rZTtcXG4gICAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH0gfVxcbiAgLm5hdmJhci5pcy1kYXJrIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzM2MzYzNjtcXG4gICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItYnJhbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLCAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjkyOTI5O1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1idXJnZXIge1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLXN0YXJ0ID4gLm5hdmJhci1pdGVtLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1lbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItZW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLCAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyOTI5Mjk7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazo6YWZ0ZXIsXFxuICAgICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1kYXJrIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246Zm9jdXMgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duOmhvdmVyIC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLWRhcmsgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bi5pcy1hY3RpdmUgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyOTI5Mjk7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtZGFyayAubmF2YmFyLWRyb3Bkb3duIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzNjM2MzY7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfSB9XFxuICAubmF2YmFyLmlzLXByaW1hcnkge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjOEE0RDc2O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1icmFuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM3YTQ0Njg7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOjphZnRlciB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWJ1cmdlciB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItc3RhcnQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWVuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLCAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItZW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzdhNDQ2ODtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOjphZnRlcixcXG4gICAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6ICNmZmY7IH1cXG4gICAgICAubmF2YmFyLmlzLXByaW1hcnkgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpmb2N1cyAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246aG92ZXIgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtcHJpbWFyeSAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWFjdGl2ZSAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzdhNDQ2ODtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1wcmltYXJ5IC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzhBNEQ3NjtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9IH1cXG4gIC5uYXZiYXIuaXMtbGluayB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6IGJsdWU7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWJyYW5kID4gLm5hdmJhci1pdGVtLFxcbiAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbmsge1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLCAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDBlNjtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItYnVyZ2VyIHtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpIHtcXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1zdGFydCA+IC5uYXZiYXItaXRlbSxcXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItZW5kID4gLm5hdmJhci1pdGVtLFxcbiAgICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluay5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMGU2O1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6OmFmdGVyLFxcbiAgICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtbGluayAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duOmZvY3VzIC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpob3ZlciAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1saW5rIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd24uaXMtYWN0aXZlIC5uYXZiYXItbGluayB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMGU2O1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAubmF2YmFyLmlzLWxpbmsgLm5hdmJhci1kcm9wZG93biBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBibHVlO1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH0gfVxcbiAgLm5hdmJhci5pcy1pbmZvIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzMyOThkYztcXG4gICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItYnJhbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLCAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjM4Y2QxO1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgIGJvcmRlci1jb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1idXJnZXIge1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLXN0YXJ0ID4gLm5hdmJhci1pdGVtLFxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1lbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItZW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLCAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWVuZCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyMzhjZDE7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazo6YWZ0ZXIsXFxuICAgICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1pbmZvIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246Zm9jdXMgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duOmhvdmVyIC5uYXZiYXItbGluayxcXG4gICAgICAubmF2YmFyLmlzLWluZm8gLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bi5pcy1hY3RpdmUgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyMzhjZDE7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtaW5mbyAubmF2YmFyLWRyb3Bkb3duIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzMjk4ZGM7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfSB9XFxuICAubmF2YmFyLmlzLXN1Y2Nlc3Mge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDhjNzc0O1xcbiAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1icmFuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzYWJiNjc7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOjphZnRlciB7XFxuICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWJ1cmdlciB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItc3RhcnQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWVuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtOmZvY3VzLCAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItZW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzNhYmI2NztcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOjphZnRlcixcXG4gICAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOjphZnRlciB7XFxuICAgICAgICBib3JkZXItY29sb3I6ICNmZmY7IH1cXG4gICAgICAubmF2YmFyLmlzLXN1Y2Nlc3MgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpmb2N1cyAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246aG92ZXIgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtc3VjY2VzcyAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWFjdGl2ZSAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzNhYmI2NztcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1zdWNjZXNzIC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzQ4Yzc3NDtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9IH1cXG4gIC5uYXZiYXIuaXMtd2FybmluZyB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmRkNTc7XFxuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItYnJhbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmQ4M2Q7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1idXJnZXIge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAyNHB4KSB7XFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItc3RhcnQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWVuZCA+IC5uYXZiYXItaXRlbSxcXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbTpob3ZlciwgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItc3RhcnQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluay5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZkODNkO1xcbiAgICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLXN0YXJ0IC5uYXZiYXItbGluazo6YWZ0ZXIsXFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpmb2N1cyAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy13YXJuaW5nIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd246aG92ZXIgLm5hdmJhci1saW5rLFxcbiAgICAgIC5uYXZiYXIuaXMtd2FybmluZyAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWFjdGl2ZSAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZDgzZDtcXG4gICAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAubmF2YmFyLmlzLXdhcm5pbmcgLm5hdmJhci1kcm9wZG93biBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZkZDU3O1xcbiAgICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfSB9XFxuICAubmF2YmFyLmlzLWRhbmdlciB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmMTQ2Njg7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItYnJhbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAubmF2YmFyLmlzLWRhbmdlciAubmF2YmFyLWJyYW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1icmFuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItYnJhbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItYnJhbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAubmF2YmFyLmlzLWRhbmdlciAubmF2YmFyLWJyYW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNlZjJlNTU7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1icmFuZCAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7IH1cXG4gICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1idXJnZXIge1xcbiAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItc3RhcnQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1lbmQgPiAubmF2YmFyLWl0ZW0sXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1zdGFydCA+IGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItc3RhcnQgPiBhLm5hdmJhci1pdGVtOmhvdmVyLCAubmF2YmFyLmlzLWRhbmdlciAubmF2YmFyLXN0YXJ0ID4gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbmsuaXMtYWN0aXZlLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItZW5kID4gYS5uYXZiYXItaXRlbTpmb2N1cyxcXG4gICAgICAubmF2YmFyLmlzLWRhbmdlciAubmF2YmFyLWVuZCA+IGEubmF2YmFyLWl0ZW06aG92ZXIsXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1lbmQgPiBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgICAubmF2YmFyLmlzLWRhbmdlciAubmF2YmFyLWVuZCAubmF2YmFyLWxpbms6Zm9jdXMsXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1lbmQgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItZW5kIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2VmMmU1NTtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1zdGFydCAubmF2YmFyLWxpbms6OmFmdGVyLFxcbiAgICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItZW5kIC5uYXZiYXItbGluazo6YWZ0ZXIge1xcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpmb2N1cyAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpob3ZlciAubmF2YmFyLWxpbmssXFxuICAgICAgLm5hdmJhci5pcy1kYW5nZXIgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bi5pcy1hY3RpdmUgLm5hdmJhci1saW5rIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNlZjJlNTU7XFxuICAgICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAgIC5uYXZiYXIuaXMtZGFuZ2VyIC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YxNDY2ODtcXG4gICAgICAgIGNvbG9yOiAjZmZmOyB9IH1cXG4gIC5uYXZiYXIgPiAuY29udGFpbmVyIHtcXG4gICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XFxuICAgIGRpc3BsYXk6IGZsZXg7XFxuICAgIG1pbi1oZWlnaHQ6IDMuMjVyZW07XFxuICAgIHdpZHRoOiAxMDAlOyB9XFxuICAubmF2YmFyLmhhcy1zaGFkb3cge1xcbiAgICBib3gtc2hhZG93OiAwIDJweCAwIDAgd2hpdGVzbW9rZTsgfVxcbiAgLm5hdmJhci5pcy1maXhlZC1ib3R0b20sIC5uYXZiYXIuaXMtZml4ZWQtdG9wIHtcXG4gICAgbGVmdDogMDtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICByaWdodDogMDtcXG4gICAgei1pbmRleDogMzA7IH1cXG4gIC5uYXZiYXIuaXMtZml4ZWQtYm90dG9tIHtcXG4gICAgYm90dG9tOiAwOyB9XFxuICAgIC5uYXZiYXIuaXMtZml4ZWQtYm90dG9tLmhhcy1zaGFkb3cge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgLTJweCAwIDAgd2hpdGVzbW9rZTsgfVxcbiAgLm5hdmJhci5pcy1maXhlZC10b3Age1xcbiAgICB0b3A6IDA7IH1cXG5cXG5odG1sLmhhcy1uYXZiYXItZml4ZWQtdG9wLFxcbmJvZHkuaGFzLW5hdmJhci1maXhlZC10b3Age1xcbiAgcGFkZGluZy10b3A6IDMuMjVyZW07IH1cXG5cXG5odG1sLmhhcy1uYXZiYXItZml4ZWQtYm90dG9tLFxcbmJvZHkuaGFzLW5hdmJhci1maXhlZC1ib3R0b20ge1xcbiAgcGFkZGluZy1ib3R0b206IDMuMjVyZW07IH1cXG5cXG4ubmF2YmFyLWJyYW5kLFxcbi5uYXZiYXItdGFicyB7XFxuICBhbGlnbi1pdGVtczogc3RyZXRjaDtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBmbGV4LXNocmluazogMDtcXG4gIG1pbi1oZWlnaHQ6IDMuMjVyZW07IH1cXG5cXG4ubmF2YmFyLWJyYW5kIGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXItYnJhbmQgYS5uYXZiYXItaXRlbTpob3ZlciB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgfVxcblxcbi5uYXZiYXItdGFicyB7XFxuICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XFxuICBtYXgtd2lkdGg6IDEwMHZ3O1xcbiAgb3ZlcmZsb3cteDogYXV0bztcXG4gIG92ZXJmbG93LXk6IGhpZGRlbjsgfVxcblxcbi5uYXZiYXItYnVyZ2VyIHtcXG4gIGNvbG9yOiAjNzU3NzYzO1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICBoZWlnaHQ6IDMuMjVyZW07XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICB3aWR0aDogMy4yNXJlbTtcXG4gIG1hcmdpbi1sZWZ0OiBhdXRvOyB9XFxuICAubmF2YmFyLWJ1cmdlciBzcGFuIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogY3VycmVudENvbG9yO1xcbiAgICBkaXNwbGF5OiBibG9jaztcXG4gICAgaGVpZ2h0OiAxcHg7XFxuICAgIGxlZnQ6IGNhbGMoNTAlIC0gOHB4KTtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICB0cmFuc2Zvcm0tb3JpZ2luOiBjZW50ZXI7XFxuICAgIHRyYW5zaXRpb24tZHVyYXRpb246IDg2bXM7XFxuICAgIHRyYW5zaXRpb24tcHJvcGVydHk6IGJhY2tncm91bmQtY29sb3IsIG9wYWNpdHksIHRyYW5zZm9ybTtcXG4gICAgdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb246IGVhc2Utb3V0O1xcbiAgICB3aWR0aDogMTZweDsgfVxcbiAgICAubmF2YmFyLWJ1cmdlciBzcGFuOm50aC1jaGlsZCgxKSB7XFxuICAgICAgdG9wOiBjYWxjKDUwJSAtIDZweCk7IH1cXG4gICAgLm5hdmJhci1idXJnZXIgc3BhbjpudGgtY2hpbGQoMikge1xcbiAgICAgIHRvcDogY2FsYyg1MCUgLSAxcHgpOyB9XFxuICAgIC5uYXZiYXItYnVyZ2VyIHNwYW46bnRoLWNoaWxkKDMpIHtcXG4gICAgICB0b3A6IGNhbGMoNTAlICsgNHB4KTsgfVxcbiAgLm5hdmJhci1idXJnZXI6aG92ZXIge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuMDUpOyB9XFxuICAubmF2YmFyLWJ1cmdlci5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMSkge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNXB4KSByb3RhdGUoNDVkZWcpOyB9XFxuICAubmF2YmFyLWJ1cmdlci5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMikge1xcbiAgICBvcGFjaXR5OiAwOyB9XFxuICAubmF2YmFyLWJ1cmdlci5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMykge1xcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTVweCkgcm90YXRlKC00NWRlZyk7IH1cXG5cXG4ubmF2YmFyLW1lbnUge1xcbiAgZGlzcGxheTogbm9uZTsgfVxcblxcbi5uYXZiYXItaXRlbSxcXG4ubmF2YmFyLWxpbmsge1xcbiAgY29sb3I6ICM3NTc3NjM7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIGxpbmUtaGVpZ2h0OiAxLjU7XFxuICBwYWRkaW5nOiAwLjVyZW0gMC43NXJlbTtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTsgfVxcbiAgLm5hdmJhci1pdGVtIC5pY29uOm9ubHktY2hpbGQsXFxuICAubmF2YmFyLWxpbmsgLmljb246b25seS1jaGlsZCB7XFxuICAgIG1hcmdpbi1sZWZ0OiAtMC4yNXJlbTtcXG4gICAgbWFyZ2luLXJpZ2h0OiAtMC4yNXJlbTsgfVxcblxcbmEubmF2YmFyLWl0ZW0sXFxuLm5hdmJhci1saW5rIHtcXG4gIGN1cnNvcjogcG9pbnRlcjsgfVxcbiAgYS5uYXZiYXItaXRlbTpmb2N1cywgYS5uYXZiYXItaXRlbTpmb2N1cy13aXRoaW4sIGEubmF2YmFyLWl0ZW06aG92ZXIsIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgLm5hdmJhci1saW5rOmZvY3VzLFxcbiAgLm5hdmJhci1saW5rOmZvY3VzLXdpdGhpbixcXG4gIC5uYXZiYXItbGluazpob3ZlcixcXG4gIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmFmYWZhO1xcbiAgICBjb2xvcjogYmx1ZTsgfVxcblxcbi5uYXZiYXItaXRlbSB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIGZsZXgtZ3JvdzogMDtcXG4gIGZsZXgtc2hyaW5rOiAwOyB9XFxuICAubmF2YmFyLWl0ZW0gaW1nIHtcXG4gICAgbWF4LWhlaWdodDogMS43NXJlbTsgfVxcbiAgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93biB7XFxuICAgIHBhZGRpbmc6IDA7IH1cXG4gIC5uYXZiYXItaXRlbS5pcy1leHBhbmRlZCB7XFxuICAgIGZsZXgtZ3JvdzogMTtcXG4gICAgZmxleC1zaHJpbms6IDE7IH1cXG4gIC5uYXZiYXItaXRlbS5pcy10YWIge1xcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdHJhbnNwYXJlbnQ7XFxuICAgIG1pbi1oZWlnaHQ6IDMuMjVyZW07XFxuICAgIHBhZGRpbmctYm90dG9tOiBjYWxjKDAuNXJlbSAtIDFweCk7IH1cXG4gICAgLm5hdmJhci1pdGVtLmlzLXRhYjpmb2N1cywgLm5hdmJhci1pdGVtLmlzLXRhYjpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWJvdHRvbS1jb2xvcjogYmx1ZTsgfVxcbiAgICAubmF2YmFyLWl0ZW0uaXMtdGFiLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxuICAgICAgYm9yZGVyLWJvdHRvbS1jb2xvcjogYmx1ZTtcXG4gICAgICBib3JkZXItYm90dG9tLXN0eWxlOiBzb2xpZDtcXG4gICAgICBib3JkZXItYm90dG9tLXdpZHRoOiAzcHg7XFxuICAgICAgY29sb3I6IGJsdWU7XFxuICAgICAgcGFkZGluZy1ib3R0b206IGNhbGMoMC41cmVtIC0gM3B4KTsgfVxcblxcbi5uYXZiYXItY29udGVudCB7XFxuICBmbGV4LWdyb3c6IDE7XFxuICBmbGV4LXNocmluazogMTsgfVxcblxcbi5uYXZiYXItbGluazpub3QoLmlzLWFycm93bGVzcykge1xcbiAgcGFkZGluZy1yaWdodDogMi41ZW07IH1cXG4gIC5uYXZiYXItbGluazpub3QoLmlzLWFycm93bGVzcyk6OmFmdGVyIHtcXG4gICAgYm9yZGVyLWNvbG9yOiBibHVlO1xcbiAgICBtYXJnaW4tdG9wOiAtMC4zNzVlbTtcXG4gICAgcmlnaHQ6IDEuMTI1ZW07IH1cXG5cXG4ubmF2YmFyLWRyb3Bkb3duIHtcXG4gIGZvbnQtc2l6ZTogMC44NzVyZW07XFxuICBwYWRkaW5nLWJvdHRvbTogMC41cmVtO1xcbiAgcGFkZGluZy10b3A6IDAuNXJlbTsgfVxcbiAgLm5hdmJhci1kcm9wZG93biAubmF2YmFyLWl0ZW0ge1xcbiAgICBwYWRkaW5nLWxlZnQ6IDEuNXJlbTtcXG4gICAgcGFkZGluZy1yaWdodDogMS41cmVtOyB9XFxuXFxuLm5hdmJhci1kaXZpZGVyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICBib3JkZXI6IG5vbmU7XFxuICBkaXNwbGF5OiBub25lO1xcbiAgaGVpZ2h0OiAycHg7XFxuICBtYXJnaW46IDAuNXJlbSAwOyB9XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAubmF2YmFyID4gLmNvbnRhaW5lciB7XFxuICAgIGRpc3BsYXk6IGJsb2NrOyB9XFxuICAubmF2YmFyLWJyYW5kIC5uYXZiYXItaXRlbSxcXG4gIC5uYXZiYXItdGFicyAubmF2YmFyLWl0ZW0ge1xcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgICBkaXNwbGF5OiBmbGV4OyB9XFxuICAubmF2YmFyLWxpbms6OmFmdGVyIHtcXG4gICAgZGlzcGxheTogbm9uZTsgfVxcbiAgLm5hdmJhci1tZW51IHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgIGJveC1zaGFkb3c6IDAgOHB4IDE2cHggcmdiYSgxMCwgMTAsIDEwLCAwLjEpO1xcbiAgICBwYWRkaW5nOiAwLjVyZW0gMDsgfVxcbiAgICAubmF2YmFyLW1lbnUuaXMtYWN0aXZlIHtcXG4gICAgICBkaXNwbGF5OiBibG9jazsgfVxcbiAgLm5hdmJhci5pcy1maXhlZC1ib3R0b20tdG91Y2gsIC5uYXZiYXIuaXMtZml4ZWQtdG9wLXRvdWNoIHtcXG4gICAgbGVmdDogMDtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICByaWdodDogMDtcXG4gICAgei1pbmRleDogMzA7IH1cXG4gIC5uYXZiYXIuaXMtZml4ZWQtYm90dG9tLXRvdWNoIHtcXG4gICAgYm90dG9tOiAwOyB9XFxuICAgIC5uYXZiYXIuaXMtZml4ZWQtYm90dG9tLXRvdWNoLmhhcy1zaGFkb3cge1xcbiAgICAgIGJveC1zaGFkb3c6IDAgLTJweCAzcHggcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAubmF2YmFyLmlzLWZpeGVkLXRvcC10b3VjaCB7XFxuICAgIHRvcDogMDsgfVxcbiAgLm5hdmJhci5pcy1maXhlZC10b3AgLm5hdmJhci1tZW51LCAubmF2YmFyLmlzLWZpeGVkLXRvcC10b3VjaCAubmF2YmFyLW1lbnUge1xcbiAgICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7XFxuICAgIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSAzLjI1cmVtKTtcXG4gICAgb3ZlcmZsb3c6IGF1dG87IH1cXG4gIGh0bWwuaGFzLW5hdmJhci1maXhlZC10b3AtdG91Y2gsXFxuICBib2R5Lmhhcy1uYXZiYXItZml4ZWQtdG9wLXRvdWNoIHtcXG4gICAgcGFkZGluZy10b3A6IDMuMjVyZW07IH1cXG4gIGh0bWwuaGFzLW5hdmJhci1maXhlZC1ib3R0b20tdG91Y2gsXFxuICBib2R5Lmhhcy1uYXZiYXItZml4ZWQtYm90dG9tLXRvdWNoIHtcXG4gICAgcGFkZGluZy1ib3R0b206IDMuMjVyZW07IH0gfVxcblxcbkBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgLm5hdmJhcixcXG4gIC5uYXZiYXItbWVudSxcXG4gIC5uYXZiYXItc3RhcnQsXFxuICAubmF2YmFyLWVuZCB7XFxuICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xcbiAgICBkaXNwbGF5OiBmbGV4OyB9XFxuICAubmF2YmFyIHtcXG4gICAgbWluLWhlaWdodDogMy4yNXJlbTsgfVxcbiAgICAubmF2YmFyLmlzLXNwYWNlZCB7XFxuICAgICAgcGFkZGluZzogMXJlbSAycmVtOyB9XFxuICAgICAgLm5hdmJhci5pcy1zcGFjZWQgLm5hdmJhci1zdGFydCxcXG4gICAgICAubmF2YmFyLmlzLXNwYWNlZCAubmF2YmFyLWVuZCB7XFxuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOyB9XFxuICAgICAgLm5hdmJhci5pcy1zcGFjZWQgYS5uYXZiYXItaXRlbSxcXG4gICAgICAubmF2YmFyLmlzLXNwYWNlZCAubmF2YmFyLWxpbmsge1xcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4OyB9XFxuICAgIC5uYXZiYXIuaXMtdHJhbnNwYXJlbnQgYS5uYXZiYXItaXRlbTpmb2N1cywgLm5hdmJhci5pcy10cmFuc3BhcmVudCBhLm5hdmJhci1pdGVtOmhvdmVyLCAubmF2YmFyLmlzLXRyYW5zcGFyZW50IGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAubmF2YmFyLmlzLXRyYW5zcGFyZW50IC5uYXZiYXItbGluazpmb2N1cyxcXG4gICAgLm5hdmJhci5pcy10cmFuc3BhcmVudCAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgIC5uYXZiYXIuaXMtdHJhbnNwYXJlbnQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDsgfVxcbiAgICAubmF2YmFyLmlzLXRyYW5zcGFyZW50IC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd24uaXMtYWN0aXZlIC5uYXZiYXItbGluaywgLm5hdmJhci5pcy10cmFuc3BhcmVudCAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWhvdmVyYWJsZTpmb2N1cyAubmF2YmFyLWxpbmssIC5uYXZiYXIuaXMtdHJhbnNwYXJlbnQgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bi5pcy1ob3ZlcmFibGU6Zm9jdXMtd2l0aGluIC5uYXZiYXItbGluaywgLm5hdmJhci5pcy10cmFuc3BhcmVudCAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLmlzLWhvdmVyYWJsZTpob3ZlciAubmF2YmFyLWxpbmsge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7IH1cXG4gICAgLm5hdmJhci5pcy10cmFuc3BhcmVudCAubmF2YmFyLWRyb3Bkb3duIGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXIuaXMtdHJhbnNwYXJlbnQgLm5hdmJhci1kcm9wZG93biBhLm5hdmJhci1pdGVtOmhvdmVyIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgIC5uYXZiYXIuaXMtdHJhbnNwYXJlbnQgLm5hdmJhci1kcm9wZG93biBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGVzbW9rZTtcXG4gICAgICBjb2xvcjogYmx1ZTsgfVxcbiAgLm5hdmJhci1idXJnZXIge1xcbiAgICBkaXNwbGF5OiBub25lOyB9XFxuICAubmF2YmFyLWl0ZW0sXFxuICAubmF2YmFyLWxpbmsge1xcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgICBkaXNwbGF5OiBmbGV4OyB9XFxuICAubmF2YmFyLWl0ZW0ge1xcbiAgICBkaXNwbGF5OiBmbGV4OyB9XFxuICAgIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd24ge1xcbiAgICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoOyB9XFxuICAgIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd24tdXAgLm5hdmJhci1saW5rOjphZnRlciB7XFxuICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMTM1ZGVnKSB0cmFuc2xhdGUoMC4yNWVtLCAtMC4yNWVtKTsgfVxcbiAgICAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duLXVwIC5uYXZiYXItZHJvcGRvd24ge1xcbiAgICAgIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCAjZGJkYmRiO1xcbiAgICAgIGJvcmRlci1yYWRpdXM6IDZweCA2cHggMCAwO1xcbiAgICAgIGJvcmRlci10b3A6IG5vbmU7XFxuICAgICAgYm90dG9tOiAxMDAlO1xcbiAgICAgIGJveC1zaGFkb3c6IDAgLThweCA4cHggcmdiYSgxMCwgMTAsIDEwLCAwLjEpO1xcbiAgICAgIHRvcDogYXV0bzsgfVxcbiAgICAubmF2YmFyLWl0ZW0uaXMtYWN0aXZlIC5uYXZiYXItZHJvcGRvd24sIC5uYXZiYXItaXRlbS5pcy1ob3ZlcmFibGU6Zm9jdXMgLm5hdmJhci1kcm9wZG93biwgLm5hdmJhci1pdGVtLmlzLWhvdmVyYWJsZTpmb2N1cy13aXRoaW4gLm5hdmJhci1kcm9wZG93biwgLm5hdmJhci1pdGVtLmlzLWhvdmVyYWJsZTpob3ZlciAubmF2YmFyLWRyb3Bkb3duIHtcXG4gICAgICBkaXNwbGF5OiBibG9jazsgfVxcbiAgICAgIC5uYXZiYXIuaXMtc3BhY2VkIC5uYXZiYXItaXRlbS5pcy1hY3RpdmUgLm5hdmJhci1kcm9wZG93biwgLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSAubmF2YmFyLWRyb3Bkb3duLmlzLWJveGVkLCAubmF2YmFyLmlzLXNwYWNlZCAubmF2YmFyLWl0ZW0uaXMtaG92ZXJhYmxlOmZvY3VzIC5uYXZiYXItZHJvcGRvd24sIC5uYXZiYXItaXRlbS5pcy1ob3ZlcmFibGU6Zm9jdXMgLm5hdmJhci1kcm9wZG93bi5pcy1ib3hlZCwgLm5hdmJhci5pcy1zcGFjZWQgLm5hdmJhci1pdGVtLmlzLWhvdmVyYWJsZTpmb2N1cy13aXRoaW4gLm5hdmJhci1kcm9wZG93biwgLm5hdmJhci1pdGVtLmlzLWhvdmVyYWJsZTpmb2N1cy13aXRoaW4gLm5hdmJhci1kcm9wZG93bi5pcy1ib3hlZCwgLm5hdmJhci5pcy1zcGFjZWQgLm5hdmJhci1pdGVtLmlzLWhvdmVyYWJsZTpob3ZlciAubmF2YmFyLWRyb3Bkb3duLCAubmF2YmFyLWl0ZW0uaXMtaG92ZXJhYmxlOmhvdmVyIC5uYXZiYXItZHJvcGRvd24uaXMtYm94ZWQge1xcbiAgICAgICAgb3BhY2l0eTogMTtcXG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApOyB9XFxuICAubmF2YmFyLW1lbnUge1xcbiAgICBmbGV4LWdyb3c6IDE7XFxuICAgIGZsZXgtc2hyaW5rOiAwOyB9XFxuICAubmF2YmFyLXN0YXJ0IHtcXG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xcbiAgICBtYXJnaW4tcmlnaHQ6IGF1dG87IH1cXG4gIC5uYXZiYXItZW5kIHtcXG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcXG4gICAgbWFyZ2luLWxlZnQ6IGF1dG87IH1cXG4gIC5uYXZiYXItZHJvcGRvd24ge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogNnB4O1xcbiAgICBib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogNnB4O1xcbiAgICBib3JkZXItdG9wOiAycHggc29saWQgI2RiZGJkYjtcXG4gICAgYm94LXNoYWRvdzogMCA4cHggOHB4IHJnYmEoMTAsIDEwLCAxMCwgMC4xKTtcXG4gICAgZGlzcGxheTogbm9uZTtcXG4gICAgZm9udC1zaXplOiAwLjg3NXJlbTtcXG4gICAgbGVmdDogMDtcXG4gICAgbWluLXdpZHRoOiAxMDAlO1xcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICAgIHRvcDogMTAwJTtcXG4gICAgei1pbmRleDogMjA7IH1cXG4gICAgLm5hdmJhci1kcm9wZG93biAubmF2YmFyLWl0ZW0ge1xcbiAgICAgIHBhZGRpbmc6IDAuMzc1cmVtIDFyZW07XFxuICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDsgfVxcbiAgICAubmF2YmFyLWRyb3Bkb3duIGEubmF2YmFyLWl0ZW0ge1xcbiAgICAgIHBhZGRpbmctcmlnaHQ6IDNyZW07IH1cXG4gICAgICAubmF2YmFyLWRyb3Bkb3duIGEubmF2YmFyLWl0ZW06Zm9jdXMsIC5uYXZiYXItZHJvcGRvd24gYS5uYXZiYXItaXRlbTpob3ZlciB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgICAubmF2YmFyLWRyb3Bkb3duIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlc21va2U7XFxuICAgICAgICBjb2xvcjogYmx1ZTsgfVxcbiAgICAubmF2YmFyLmlzLXNwYWNlZCAubmF2YmFyLWRyb3Bkb3duLCAubmF2YmFyLWRyb3Bkb3duLmlzLWJveGVkIHtcXG4gICAgICBib3JkZXItcmFkaXVzOiA2cHg7XFxuICAgICAgYm9yZGVyLXRvcDogbm9uZTtcXG4gICAgICBib3gtc2hhZG93OiAwIDhweCA4cHggcmdiYSgxMCwgMTAsIDEwLCAwLjEpLCAwIDAgMCAxcHggcmdiYSgxMCwgMTAsIDEwLCAwLjEpO1xcbiAgICAgIGRpc3BsYXk6IGJsb2NrO1xcbiAgICAgIG9wYWNpdHk6IDA7XFxuICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XFxuICAgICAgdG9wOiBjYWxjKDEwMCUgKyAoLTRweCkpO1xcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNXB4KTtcXG4gICAgICB0cmFuc2l0aW9uLWR1cmF0aW9uOiA4Nm1zO1xcbiAgICAgIHRyYW5zaXRpb24tcHJvcGVydHk6IG9wYWNpdHksIHRyYW5zZm9ybTsgfVxcbiAgICAubmF2YmFyLWRyb3Bkb3duLmlzLXJpZ2h0IHtcXG4gICAgICBsZWZ0OiBhdXRvO1xcbiAgICAgIHJpZ2h0OiAwOyB9XFxuICAubmF2YmFyLWRpdmlkZXIge1xcbiAgICBkaXNwbGF5OiBibG9jazsgfVxcbiAgLm5hdmJhciA+IC5jb250YWluZXIgLm5hdmJhci1icmFuZCxcXG4gIC5jb250YWluZXIgPiAubmF2YmFyIC5uYXZiYXItYnJhbmQge1xcbiAgICBtYXJnaW4tbGVmdDogLS43NXJlbTsgfVxcbiAgLm5hdmJhciA+IC5jb250YWluZXIgLm5hdmJhci1tZW51LFxcbiAgLmNvbnRhaW5lciA+IC5uYXZiYXIgLm5hdmJhci1tZW51IHtcXG4gICAgbWFyZ2luLXJpZ2h0OiAtLjc1cmVtOyB9XFxuICAubmF2YmFyLmlzLWZpeGVkLWJvdHRvbS1kZXNrdG9wLCAubmF2YmFyLmlzLWZpeGVkLXRvcC1kZXNrdG9wIHtcXG4gICAgbGVmdDogMDtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICByaWdodDogMDtcXG4gICAgei1pbmRleDogMzA7IH1cXG4gIC5uYXZiYXIuaXMtZml4ZWQtYm90dG9tLWRlc2t0b3Age1xcbiAgICBib3R0b206IDA7IH1cXG4gICAgLm5hdmJhci5pcy1maXhlZC1ib3R0b20tZGVza3RvcC5oYXMtc2hhZG93IHtcXG4gICAgICBib3gtc2hhZG93OiAwIC0ycHggM3B4IHJnYmEoMTAsIDEwLCAxMCwgMC4xKTsgfVxcbiAgLm5hdmJhci5pcy1maXhlZC10b3AtZGVza3RvcCB7XFxuICAgIHRvcDogMDsgfVxcbiAgaHRtbC5oYXMtbmF2YmFyLWZpeGVkLXRvcC1kZXNrdG9wLFxcbiAgYm9keS5oYXMtbmF2YmFyLWZpeGVkLXRvcC1kZXNrdG9wIHtcXG4gICAgcGFkZGluZy10b3A6IDMuMjVyZW07IH1cXG4gIGh0bWwuaGFzLW5hdmJhci1maXhlZC1ib3R0b20tZGVza3RvcCxcXG4gIGJvZHkuaGFzLW5hdmJhci1maXhlZC1ib3R0b20tZGVza3RvcCB7XFxuICAgIHBhZGRpbmctYm90dG9tOiAzLjI1cmVtOyB9XFxuICBodG1sLmhhcy1zcGFjZWQtbmF2YmFyLWZpeGVkLXRvcCxcXG4gIGJvZHkuaGFzLXNwYWNlZC1uYXZiYXItZml4ZWQtdG9wIHtcXG4gICAgcGFkZGluZy10b3A6IDUuMjVyZW07IH1cXG4gIGh0bWwuaGFzLXNwYWNlZC1uYXZiYXItZml4ZWQtYm90dG9tLFxcbiAgYm9keS5oYXMtc3BhY2VkLW5hdmJhci1maXhlZC1ib3R0b20ge1xcbiAgICBwYWRkaW5nLWJvdHRvbTogNS4yNXJlbTsgfVxcbiAgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlOm5vdCg6Zm9jdXMpOm5vdCg6aG92ZXIpLFxcbiAgLm5hdmJhci1saW5rLmlzLWFjdGl2ZTpub3QoOmZvY3VzKTpub3QoOmhvdmVyKSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50OyB9XFxuICAubmF2YmFyLWl0ZW0uaGFzLWRyb3Bkb3duOmZvY3VzIC5uYXZiYXItbGluaywgLm5hdmJhci1pdGVtLmhhcy1kcm9wZG93bjpob3ZlciAubmF2YmFyLWxpbmssIC5uYXZiYXItaXRlbS5oYXMtZHJvcGRvd24uaXMtYWN0aXZlIC5uYXZiYXItbGluayB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmYWZhZmE7IH0gfVxcblxcbi5oZXJvLmlzLWZ1bGxoZWlnaHQtd2l0aC1uYXZiYXIge1xcbiAgbWluLWhlaWdodDogY2FsYygxMDB2aCAtIDMuMjVyZW0pOyB9XFxuXFxuLmhlcm8ge1xcbiAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgfVxcbiAgLmhlcm8gLm5hdmJhciB7XFxuICAgIGJhY2tncm91bmQ6IG5vbmU7IH1cXG4gIC5oZXJvIC50YWJzIHVsIHtcXG4gICAgYm9yZGVyLWJvdHRvbTogbm9uZTsgfVxcbiAgLmhlcm8uaXMtd2hpdGUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgLmhlcm8uaXMtd2hpdGUgYTpub3QoLmJ1dHRvbik6bm90KC5kcm9wZG93bi1pdGVtKTpub3QoLnRhZyk6bm90KC5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudCksXFxuICAgIC5oZXJvLmlzLXdoaXRlIHN0cm9uZyB7XFxuICAgICAgY29sb3I6IGluaGVyaXQ7IH1cXG4gICAgLmhlcm8uaXMtd2hpdGUgLnRpdGxlIHtcXG4gICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICAuaGVyby5pcy13aGl0ZSAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDEwLCAxMCwgMTAsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy13aGl0ZSAuc3VidGl0bGUgYTpub3QoLmJ1dHRvbiksXFxuICAgICAgLmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIHN0cm9uZyB7XFxuICAgICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gICAgICAuaGVyby5pcy13aGl0ZSAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7IH0gfVxcbiAgICAuaGVyby5pcy13aGl0ZSAubmF2YmFyLWl0ZW0sXFxuICAgIC5oZXJvLmlzLXdoaXRlIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMTAsIDEwLCAxMCwgMC43KTsgfVxcbiAgICAuaGVyby5pcy13aGl0ZSBhLm5hdmJhci1pdGVtOmhvdmVyLCAuaGVyby5pcy13aGl0ZSBhLm5hdmJhci1pdGVtLmlzLWFjdGl2ZSxcXG4gICAgLmhlcm8uaXMtd2hpdGUgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy13aGl0ZSAubmF2YmFyLWxpbmsuaXMtYWN0aXZlIHtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmMmYyO1xcbiAgICAgIGNvbG9yOiAjMGEwYTBhOyB9XFxuICAgIC5oZXJvLmlzLXdoaXRlIC50YWJzIGEge1xcbiAgICAgIGNvbG9yOiAjMGEwYTBhO1xcbiAgICAgIG9wYWNpdHk6IDAuOTsgfVxcbiAgICAgIC5oZXJvLmlzLXdoaXRlIC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy13aGl0ZSAudGFicyBsaS5pcy1hY3RpdmUgYSB7XFxuICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhLCAuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICMwYTBhMGE7IH1cXG4gICAgICAuaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLCAuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgYTpob3ZlciB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDEwLCAxMCwgMTAsIDAuMSk7IH1cXG4gICAgLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLCAuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgICBib3JkZXItY29sb3I6ICMwYTBhMGE7XFxuICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5oZXJvLmlzLXdoaXRlLmlzLWJvbGQge1xcbiAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNlNmU2ZTYgMCUsIHdoaXRlIDcxJSwgd2hpdGUgMTAwJSk7IH1cXG4gICAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgICAgICAgLmhlcm8uaXMtd2hpdGUuaXMtYm9sZCAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZTZlNmU2IDAlLCB3aGl0ZSA3MSUsIHdoaXRlIDEwMCUpOyB9IH1cXG4gIC5oZXJvLmlzLWJsYWNrIHtcXG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcXG4gICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIGE6bm90KC5idXR0b24pOm5vdCguZHJvcGRvd24taXRlbSk6bm90KC50YWcpOm5vdCgucGFnaW5hdGlvbi1saW5rLmlzLWN1cnJlbnQpLFxcbiAgICAuaGVyby5pcy1ibGFjayBzdHJvbmcge1xcbiAgICAgIGNvbG9yOiBpbmhlcml0OyB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIC50aXRsZSB7XFxuICAgICAgY29sb3I6IHdoaXRlOyB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC45KTsgfVxcbiAgICAgIC5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBhOm5vdCguYnV0dG9uKSxcXG4gICAgICAuaGVyby5pcy1ibGFjayAuc3VidGl0bGUgc3Ryb25nIHtcXG4gICAgICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMDIzcHgpIHtcXG4gICAgICAuaGVyby5pcy1ibGFjayAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTsgfSB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIC5uYXZiYXItaXRlbSxcXG4gICAgLmhlcm8uaXMtYmxhY2sgLm5hdmJhci1saW5rIHtcXG4gICAgICBjb2xvcjogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjcpOyB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLWJsYWNrIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAuaGVyby5pcy1ibGFjayAubmF2YmFyLWxpbms6aG92ZXIsXFxuICAgIC5oZXJvLmlzLWJsYWNrIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGJsYWNrO1xcbiAgICAgIGNvbG9yOiB3aGl0ZTsgfVxcbiAgICAuaGVyby5pcy1ibGFjayAudGFicyBhIHtcXG4gICAgICBjb2xvcjogd2hpdGU7XFxuICAgICAgb3BhY2l0eTogMC45OyB9XFxuICAgICAgLmhlcm8uaXMtYmxhY2sgLnRhYnMgYTpob3ZlciB7XFxuICAgICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGEsIC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBhIHtcXG4gICAgICBjb2xvcjogd2hpdGU7IH1cXG4gICAgICAuaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBhOmhvdmVyLCAuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgYTpob3ZlciB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDEwLCAxMCwgMTAsIDAuMSk7IH1cXG4gICAgLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLCAuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICAgICAgYm9yZGVyLWNvbG9yOiB3aGl0ZTtcXG4gICAgICBjb2xvcjogIzBhMGEwYTsgfVxcbiAgICAuaGVyby5pcy1ibGFjay5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCBibGFjayAwJSwgIzBhMGEwYSA3MSUsICMxODE2MTYgMTAwJSk7IH1cXG4gICAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgICAgICAgLmhlcm8uaXMtYmxhY2suaXMtYm9sZCAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCBibGFjayAwJSwgIzBhMGEwYSA3MSUsICMxODE2MTYgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtbGlnaHQge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlO1xcbiAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIC5oZXJvLmlzLWxpZ2h0IGE6bm90KC5idXR0b24pOm5vdCguZHJvcGRvd24taXRlbSk6bm90KC50YWcpOm5vdCgucGFnaW5hdGlvbi1saW5rLmlzLWN1cnJlbnQpLFxcbiAgICAuaGVyby5pcy1saWdodCBzdHJvbmcge1xcbiAgICAgIGNvbG9yOiBpbmhlcml0OyB9XFxuICAgIC5oZXJvLmlzLWxpZ2h0IC50aXRsZSB7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1saWdodCAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy1saWdodCAuc3VidGl0bGUgYTpub3QoLmJ1dHRvbiksXFxuICAgICAgLmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxlIHN0cm9uZyB7XFxuICAgICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjNweCkge1xcbiAgICAgIC5oZXJvLmlzLWxpZ2h0IC5uYXZiYXItbWVudSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZXNtb2tlOyB9IH1cXG4gICAgLmhlcm8uaXMtbGlnaHQgLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy1saWdodCAubmF2YmFyLWxpbmsge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLmhlcm8uaXMtbGlnaHQgYS5uYXZiYXItaXRlbTpob3ZlciwgLmhlcm8uaXMtbGlnaHQgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLWxpZ2h0IC5uYXZiYXItbGluazpob3ZlcixcXG4gICAgLmhlcm8uaXMtbGlnaHQgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U4ZThlODtcXG4gICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIC5oZXJvLmlzLWxpZ2h0IC50YWJzIGEge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7XFxuICAgICAgb3BhY2l0eTogMC45OyB9XFxuICAgICAgLmhlcm8uaXMtbGlnaHQgLnRhYnMgYTpob3ZlciB7XFxuICAgICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWxpZ2h0IC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGEsIC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBhIHtcXG4gICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgICAgLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwgLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1saWdodCAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwgLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXIge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTtcXG4gICAgICBib3JkZXItY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTtcXG4gICAgICBjb2xvcjogd2hpdGVzbW9rZTsgfVxcbiAgICAuaGVyby5pcy1saWdodC5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZGZkOGQ5IDAlLCB3aGl0ZXNtb2tlIDcxJSwgd2hpdGUgMTAwJSk7IH1cXG4gICAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgICAgICAgLmhlcm8uaXMtbGlnaHQuaXMtYm9sZCAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZGZkOGQ5IDAlLCB3aGl0ZXNtb2tlIDcxJSwgd2hpdGUgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtZGFyayB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICMzNjM2MzY7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5oZXJvLmlzLWRhcmsgYTpub3QoLmJ1dHRvbik6bm90KC5kcm9wZG93bi1pdGVtKTpub3QoLnRhZyk6bm90KC5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudCksXFxuICAgIC5oZXJvLmlzLWRhcmsgc3Ryb25nIHtcXG4gICAgICBjb2xvcjogaW5oZXJpdDsgfVxcbiAgICAuaGVyby5pcy1kYXJrIC50aXRsZSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtZGFyayAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy1kYXJrIC5zdWJ0aXRsZSBhOm5vdCguYnV0dG9uKSxcXG4gICAgICAuaGVyby5pcy1kYXJrIC5zdWJ0aXRsZSBzdHJvbmcge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtZGFyayAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzM2MzYzNjsgfSB9XFxuICAgIC5oZXJvLmlzLWRhcmsgLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy1kYXJrIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1kYXJrIGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLWRhcmsgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLWRhcmsgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy1kYXJrIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyOTI5Mjk7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtZGFyayAudGFicyBhIHtcXG4gICAgICBjb2xvcjogI2ZmZjtcXG4gICAgICBvcGFjaXR5OiAwLjk7IH1cXG4gICAgICAuaGVyby5pcy1kYXJrIC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy1kYXJrIC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgYSwgLmhlcm8uaXMtZGFyayAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsIC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsIC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICMzNjM2MzY7IH1cXG4gICAgLmhlcm8uaXMtZGFyay5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMWYxOTFhIDAlLCAjMzYzNjM2IDcxJSwgIzQ2NDAzZiAxMDAlKTsgfVxcbiAgICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAgICAgICAuaGVyby5pcy1kYXJrLmlzLWJvbGQgLm5hdmJhci1tZW51IHtcXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzFmMTkxYSAwJSwgIzM2MzYzNiA3MSUsICM0NjQwM2YgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtcHJpbWFyeSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICM4QTRENzY7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5oZXJvLmlzLXByaW1hcnkgYTpub3QoLmJ1dHRvbik6bm90KC5kcm9wZG93bi1pdGVtKTpub3QoLnRhZyk6bm90KC5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudCksXFxuICAgIC5oZXJvLmlzLXByaW1hcnkgc3Ryb25nIHtcXG4gICAgICBjb2xvcjogaW5oZXJpdDsgfVxcbiAgICAuaGVyby5pcy1wcmltYXJ5IC50aXRsZSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy1wcmltYXJ5IC5zdWJ0aXRsZSBhOm5vdCguYnV0dG9uKSxcXG4gICAgICAuaGVyby5pcy1wcmltYXJ5IC5zdWJ0aXRsZSBzdHJvbmcge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtcHJpbWFyeSAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzhBNEQ3NjsgfSB9XFxuICAgIC5oZXJvLmlzLXByaW1hcnkgLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy1wcmltYXJ5IC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1wcmltYXJ5IGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLXByaW1hcnkgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLXByaW1hcnkgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy1wcmltYXJ5IC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICM3YTQ0Njg7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtcHJpbWFyeSAudGFicyBhIHtcXG4gICAgICBjb2xvcjogI2ZmZjtcXG4gICAgICBvcGFjaXR5OiAwLjk7IH1cXG4gICAgICAuaGVyby5pcy1wcmltYXJ5IC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy1wcmltYXJ5IC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgYSwgLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGE6aG92ZXIsIC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsIC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICM4QTRENzY7IH1cXG4gICAgLmhlcm8uaXMtcHJpbWFyeS5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjNzEzMzY3IDAlLCAjOEE0RDc2IDcxJSwgI2EwNTA3OSAxMDAlKTsgfVxcbiAgICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAgICAgICAuaGVyby5pcy1wcmltYXJ5LmlzLWJvbGQgLm5hdmJhci1tZW51IHtcXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzcxMzM2NyAwJSwgIzhBNEQ3NiA3MSUsICNhMDUwNzkgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtbGluayB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6IGJsdWU7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5oZXJvLmlzLWxpbmsgYTpub3QoLmJ1dHRvbik6bm90KC5kcm9wZG93bi1pdGVtKTpub3QoLnRhZyk6bm90KC5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudCksXFxuICAgIC5oZXJvLmlzLWxpbmsgc3Ryb25nIHtcXG4gICAgICBjb2xvcjogaW5oZXJpdDsgfVxcbiAgICAuaGVyby5pcy1saW5rIC50aXRsZSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtbGluayAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy1saW5rIC5zdWJ0aXRsZSBhOm5vdCguYnV0dG9uKSxcXG4gICAgICAuaGVyby5pcy1saW5rIC5zdWJ0aXRsZSBzdHJvbmcge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtbGluayAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogYmx1ZTsgfSB9XFxuICAgIC5oZXJvLmlzLWxpbmsgLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy1saW5rIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1saW5rIGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLWxpbmsgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLWxpbmsgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy1saW5rIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDAwZTY7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtbGluayAudGFicyBhIHtcXG4gICAgICBjb2xvcjogI2ZmZjtcXG4gICAgICBvcGFjaXR5OiAwLjk7IH1cXG4gICAgICAuaGVyby5pcy1saW5rIC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy1saW5rIC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWxpbmsgLnRhYnMuaXMtYm94ZWQgYSwgLmhlcm8uaXMtbGluayAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuaGVyby5pcy1saW5rIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsIC5oZXJvLmlzLWxpbmsgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLWxpbmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLWxpbmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsIC5oZXJvLmlzLWxpbmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1saW5rIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6IGJsdWU7IH1cXG4gICAgLmhlcm8uaXMtbGluay5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMDAyMmNjIDAlLCBibHVlIDcxJSwgIzQwMWFmZiAxMDAlKTsgfVxcbiAgICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAgICAgICAuaGVyby5pcy1saW5rLmlzLWJvbGQgLm5hdmJhci1tZW51IHtcXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzAwMjJjYyAwJSwgYmx1ZSA3MSUsICM0MDFhZmYgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtaW5mbyB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICMzMjk4ZGM7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5oZXJvLmlzLWluZm8gYTpub3QoLmJ1dHRvbik6bm90KC5kcm9wZG93bi1pdGVtKTpub3QoLnRhZyk6bm90KC5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudCksXFxuICAgIC5oZXJvLmlzLWluZm8gc3Ryb25nIHtcXG4gICAgICBjb2xvcjogaW5oZXJpdDsgfVxcbiAgICAuaGVyby5pcy1pbmZvIC50aXRsZSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtaW5mbyAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy1pbmZvIC5zdWJ0aXRsZSBhOm5vdCguYnV0dG9uKSxcXG4gICAgICAuaGVyby5pcy1pbmZvIC5zdWJ0aXRsZSBzdHJvbmcge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtaW5mbyAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzMyOThkYzsgfSB9XFxuICAgIC5oZXJvLmlzLWluZm8gLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy1pbmZvIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1pbmZvIGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLWluZm8gYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLWluZm8gLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy1pbmZvIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMyMzhjZDE7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtaW5mbyAudGFicyBhIHtcXG4gICAgICBjb2xvcjogI2ZmZjtcXG4gICAgICBvcGFjaXR5OiAwLjk7IH1cXG4gICAgICAuaGVyby5pcy1pbmZvIC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy1pbmZvIC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgYSwgLmhlcm8uaXMtaW5mbyAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsIC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsIC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICMzMjk4ZGM7IH1cXG4gICAgLmhlcm8uaXMtaW5mby5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMTU5ZGM2IDAlLCAjMzI5OGRjIDcxJSwgIzQzODllNSAxMDAlKTsgfVxcbiAgICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAgICAgICAuaGVyby5pcy1pbmZvLmlzLWJvbGQgLm5hdmJhci1tZW51IHtcXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzE1OWRjNiAwJSwgIzMyOThkYyA3MSUsICM0Mzg5ZTUgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtc3VjY2VzcyB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICM0OGM3NzQ7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5oZXJvLmlzLXN1Y2Nlc3MgYTpub3QoLmJ1dHRvbik6bm90KC5kcm9wZG93bi1pdGVtKTpub3QoLnRhZyk6bm90KC5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudCksXFxuICAgIC5oZXJvLmlzLXN1Y2Nlc3Mgc3Ryb25nIHtcXG4gICAgICBjb2xvcjogaW5oZXJpdDsgfVxcbiAgICAuaGVyby5pcy1zdWNjZXNzIC50aXRsZSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGUge1xcbiAgICAgIGNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSk7IH1cXG4gICAgICAuaGVyby5pcy1zdWNjZXNzIC5zdWJ0aXRsZSBhOm5vdCguYnV0dG9uKSxcXG4gICAgICAuaGVyby5pcy1zdWNjZXNzIC5zdWJ0aXRsZSBzdHJvbmcge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtc3VjY2VzcyAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzQ4Yzc3NDsgfSB9XFxuICAgIC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy1zdWNjZXNzIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1zdWNjZXNzIGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLXN1Y2Nlc3MgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy1zdWNjZXNzIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMzYWJiNjc7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtc3VjY2VzcyAudGFicyBhIHtcXG4gICAgICBjb2xvcjogI2ZmZjtcXG4gICAgICBvcGFjaXR5OiAwLjk7IH1cXG4gICAgICAuaGVyby5pcy1zdWNjZXNzIC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy1zdWNjZXNzIC50YWJzIGxpLmlzLWFjdGl2ZSBhIHtcXG4gICAgICBvcGFjaXR5OiAxOyB9XFxuICAgIC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgYSwgLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsIC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsIC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICM0OGM3NzQ7IH1cXG4gICAgLmhlcm8uaXMtc3VjY2Vzcy5pcy1ib2xkIHtcXG4gICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMjliMzQyIDAlLCAjNDhjNzc0IDcxJSwgIzU2ZDI5NiAxMDAlKTsgfVxcbiAgICAgIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAgICAgICAuaGVyby5pcy1zdWNjZXNzLmlzLWJvbGQgLm5hdmJhci1tZW51IHtcXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzI5YjM0MiAwJSwgIzQ4Yzc3NCA3MSUsICM1NmQyOTYgMTAwJSk7IH0gfVxcbiAgLmhlcm8uaXMtd2FybmluZyB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmRkNTc7XFxuICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgLmhlcm8uaXMtd2FybmluZyBhOm5vdCguYnV0dG9uKTpub3QoLmRyb3Bkb3duLWl0ZW0pOm5vdCgudGFnKTpub3QoLnBhZ2luYXRpb24tbGluay5pcy1jdXJyZW50KSxcXG4gICAgLmhlcm8uaXMtd2FybmluZyBzdHJvbmcge1xcbiAgICAgIGNvbG9yOiBpbmhlcml0OyB9XFxuICAgIC5oZXJvLmlzLXdhcm5pbmcgLnRpdGxlIHtcXG4gICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpOyB9XFxuICAgIC5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxlIHtcXG4gICAgICBjb2xvcjogcmdiYSgwLCAwLCAwLCAwLjkpOyB9XFxuICAgICAgLmhlcm8uaXMtd2FybmluZyAuc3VidGl0bGUgYTpub3QoLmJ1dHRvbiksXFxuICAgICAgLmhlcm8uaXMtd2FybmluZyAuc3VidGl0bGUgc3Ryb25nIHtcXG4gICAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtd2FybmluZyAubmF2YmFyLW1lbnUge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZGQ1NzsgfSB9XFxuICAgIC5oZXJvLmlzLXdhcm5pbmcgLm5hdmJhci1pdGVtLFxcbiAgICAuaGVyby5pcy13YXJuaW5nIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAuaGVyby5pcy13YXJuaW5nIGEubmF2YmFyLWl0ZW06aG92ZXIsIC5oZXJvLmlzLXdhcm5pbmcgYS5uYXZiYXItaXRlbS5pcy1hY3RpdmUsXFxuICAgIC5oZXJvLmlzLXdhcm5pbmcgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy13YXJuaW5nIC5uYXZiYXItbGluay5pcy1hY3RpdmUge1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmQ4M2Q7XFxuICAgICAgY29sb3I6IHJnYmEoMCwgMCwgMCwgMC43KTsgfVxcbiAgICAuaGVyby5pcy13YXJuaW5nIC50YWJzIGEge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7XFxuICAgICAgb3BhY2l0eTogMC45OyB9XFxuICAgICAgLmhlcm8uaXMtd2FybmluZyAudGFicyBhOmhvdmVyIHtcXG4gICAgICAgIG9wYWNpdHk6IDE7IH1cXG4gICAgLmhlcm8uaXMtd2FybmluZyAudGFicyBsaS5pcy1hY3RpdmUgYSB7XFxuICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGEsIC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGEge1xcbiAgICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNyk7IH1cXG4gICAgICAuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsIC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMCwgMTAsIDEwLCAwLjEpOyB9XFxuICAgIC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsIC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLCAuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpO1xcbiAgICAgIGJvcmRlci1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjcpO1xcbiAgICAgIGNvbG9yOiAjZmZkZDU3OyB9XFxuICAgIC5oZXJvLmlzLXdhcm5pbmcuaXMtYm9sZCB7XFxuICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2ZmYWYyNCAwJSwgI2ZmZGQ1NyA3MSUsICNmZmZhNzAgMTAwJSk7IH1cXG4gICAgICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgICAgICAgLmhlcm8uaXMtd2FybmluZy5pcy1ib2xkIC5uYXZiYXItbWVudSB7XFxuICAgICAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNmZmFmMjQgMCUsICNmZmRkNTcgNzElLCAjZmZmYTcwIDEwMCUpOyB9IH1cXG4gIC5oZXJvLmlzLWRhbmdlciB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICNmMTQ2Njg7XFxuICAgIGNvbG9yOiAjZmZmOyB9XFxuICAgIC5oZXJvLmlzLWRhbmdlciBhOm5vdCguYnV0dG9uKTpub3QoLmRyb3Bkb3duLWl0ZW0pOm5vdCgudGFnKTpub3QoLnBhZ2luYXRpb24tbGluay5pcy1jdXJyZW50KSxcXG4gICAgLmhlcm8uaXMtZGFuZ2VyIHN0cm9uZyB7XFxuICAgICAgY29sb3I6IGluaGVyaXQ7IH1cXG4gICAgLmhlcm8uaXMtZGFuZ2VyIC50aXRsZSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgLmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZSB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC45KTsgfVxcbiAgICAgIC5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGUgYTpub3QoLmJ1dHRvbiksXFxuICAgICAgLmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZSBzdHJvbmcge1xcbiAgICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogMTAyM3B4KSB7XFxuICAgICAgLmhlcm8uaXMtZGFuZ2VyIC5uYXZiYXItbWVudSB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjE0NjY4OyB9IH1cXG4gICAgLmhlcm8uaXMtZGFuZ2VyIC5uYXZiYXItaXRlbSxcXG4gICAgLmhlcm8uaXMtZGFuZ2VyIC5uYXZiYXItbGluayB7XFxuICAgICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC43KTsgfVxcbiAgICAuaGVyby5pcy1kYW5nZXIgYS5uYXZiYXItaXRlbTpob3ZlciwgLmhlcm8uaXMtZGFuZ2VyIGEubmF2YmFyLWl0ZW0uaXMtYWN0aXZlLFxcbiAgICAuaGVyby5pcy1kYW5nZXIgLm5hdmJhci1saW5rOmhvdmVyLFxcbiAgICAuaGVyby5pcy1kYW5nZXIgLm5hdmJhci1saW5rLmlzLWFjdGl2ZSB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2VmMmU1NTtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgICAuaGVyby5pcy1kYW5nZXIgLnRhYnMgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7XFxuICAgICAgb3BhY2l0eTogMC45OyB9XFxuICAgICAgLmhlcm8uaXMtZGFuZ2VyIC50YWJzIGE6aG92ZXIge1xcbiAgICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuaGVyby5pcy1kYW5nZXIgLnRhYnMgbGkuaXMtYWN0aXZlIGEge1xcbiAgICAgIG9wYWNpdHk6IDE7IH1cXG4gICAgLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGEsIC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYSB7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gICAgICAuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwgLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVyIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMTAsIDEwLCAxMCwgMC4xKTsgfVxcbiAgICAuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsIC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwgLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwgLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gICAgICBib3JkZXItY29sb3I6ICNmZmY7XFxuICAgICAgY29sb3I6ICNmMTQ2Njg7IH1cXG4gICAgLmhlcm8uaXMtZGFuZ2VyLmlzLWJvbGQge1xcbiAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNmYTBhNjIgMCUsICNmMTQ2NjggNzElLCAjZjc1OTVmIDEwMCUpOyB9XFxuICAgICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpIHtcXG4gICAgICAgIC5oZXJvLmlzLWRhbmdlci5pcy1ib2xkIC5uYXZiYXItbWVudSB7XFxuICAgICAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNmYTBhNjIgMCUsICNmMTQ2NjggNzElLCAjZjc1OTVmIDEwMCUpOyB9IH1cXG4gIC5oZXJvLmlzLXNtYWxsIC5oZXJvLWJvZHkge1xcbiAgICBwYWRkaW5nLWJvdHRvbTogMS41cmVtO1xcbiAgICBwYWRkaW5nLXRvcDogMS41cmVtOyB9XFxuICBAbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCksIHByaW50IHtcXG4gICAgLmhlcm8uaXMtbWVkaXVtIC5oZXJvLWJvZHkge1xcbiAgICAgIHBhZGRpbmctYm90dG9tOiA5cmVtO1xcbiAgICAgIHBhZGRpbmctdG9wOiA5cmVtOyB9IH1cXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSwgcHJpbnQge1xcbiAgICAuaGVyby5pcy1sYXJnZSAuaGVyby1ib2R5IHtcXG4gICAgICBwYWRkaW5nLWJvdHRvbTogMThyZW07XFxuICAgICAgcGFkZGluZy10b3A6IDE4cmVtOyB9IH1cXG4gIC5oZXJvLmlzLWhhbGZoZWlnaHQgLmhlcm8tYm9keSwgLmhlcm8uaXMtZnVsbGhlaWdodCAuaGVyby1ib2R5LCAuaGVyby5pcy1mdWxsaGVpZ2h0LXdpdGgtbmF2YmFyIC5oZXJvLWJvZHkge1xcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgICBkaXNwbGF5OiBmbGV4OyB9XFxuICAgIC5oZXJvLmlzLWhhbGZoZWlnaHQgLmhlcm8tYm9keSA+IC5jb250YWluZXIsIC5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keSA+IC5jb250YWluZXIsIC5oZXJvLmlzLWZ1bGxoZWlnaHQtd2l0aC1uYXZiYXIgLmhlcm8tYm9keSA+IC5jb250YWluZXIge1xcbiAgICAgIGZsZXgtZ3JvdzogMTtcXG4gICAgICBmbGV4LXNocmluazogMTsgfVxcbiAgLmhlcm8uaXMtaGFsZmhlaWdodCB7XFxuICAgIG1pbi1oZWlnaHQ6IDUwdmg7IH1cXG4gIC5oZXJvLmlzLWZ1bGxoZWlnaHQge1xcbiAgICBtaW4taGVpZ2h0OiAxMDB2aDsgfVxcblxcbi5oZXJvLXZpZGVvIHtcXG4gIG92ZXJmbG93OiBoaWRkZW47IH1cXG4gIC5oZXJvLXZpZGVvIHZpZGVvIHtcXG4gICAgbGVmdDogNTAlO1xcbiAgICBtaW4taGVpZ2h0OiAxMDAlO1xcbiAgICBtaW4td2lkdGg6IDEwMCU7XFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgdG9wOiA1MCU7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMCk7IH1cXG4gIC5oZXJvLXZpZGVvLmlzLXRyYW5zcGFyZW50IHtcXG4gICAgb3BhY2l0eTogMC4zOyB9XFxuICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCkge1xcbiAgICAuaGVyby12aWRlbyB7XFxuICAgICAgZGlzcGxheTogbm9uZTsgfSB9XFxuXFxuLmhlcm8tYnV0dG9ucyB7XFxuICBtYXJnaW4tdG9wOiAxLjVyZW07IH1cXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KSB7XFxuICAgIC5oZXJvLWJ1dHRvbnMgLmJ1dHRvbiB7XFxuICAgICAgZGlzcGxheTogZmxleDsgfVxcbiAgICAgIC5oZXJvLWJ1dHRvbnMgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpIHtcXG4gICAgICAgIG1hcmdpbi1ib3R0b206IDAuNzVyZW07IH0gfVxcbiAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpLCBwcmludCB7XFxuICAgIC5oZXJvLWJ1dHRvbnMge1xcbiAgICAgIGRpc3BsYXk6IGZsZXg7XFxuICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IH1cXG4gICAgICAuaGVyby1idXR0b25zIC5idXR0b246bm90KDpsYXN0LWNoaWxkKSB7XFxuICAgICAgICBtYXJnaW4tcmlnaHQ6IDEuNXJlbTsgfSB9XFxuXFxuLmhlcm8taGVhZCxcXG4uaGVyby1mb290IHtcXG4gIGZsZXgtZ3JvdzogMDtcXG4gIGZsZXgtc2hyaW5rOiAwOyB9XFxuXFxuLmhlcm8tYm9keSB7XFxuICBmbGV4LWdyb3c6IDE7XFxuICBmbGV4LXNocmluazogMDtcXG4gIHBhZGRpbmc6IDNyZW0gMS41cmVtOyB9XFxuXFxuLnNlY3Rpb24ge1xcbiAgcGFkZGluZzogM3JlbSAxLjVyZW07IH1cXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMjRweCkge1xcbiAgICAuc2VjdGlvbi5pcy1tZWRpdW0ge1xcbiAgICAgIHBhZGRpbmc6IDlyZW0gMS41cmVtOyB9XFxuICAgIC5zZWN0aW9uLmlzLWxhcmdlIHtcXG4gICAgICBwYWRkaW5nOiAxOHJlbSAxLjVyZW07IH0gfVxcblxcbmg0IHtcXG4gIGZvbnQtc2l6ZTogMTI1JTtcXG4gIGZvbnQtd2VpZ2h0OiA2MDA7IH1cXG5cXG4uaW1hZ2VjYXB0aW9uIHtcXG4gIHBhZGRpbmc6IDNweDtcXG4gIG1hcmdpbjogMTBweDtcXG4gIGZsb2F0OiBsZWZ0O1xcbiAgYm9yZGVyOiAxcHggc29saWQgYmxhY2s7IH1cXG5cXG5maWd1cmUge1xcbiAgZGlzcGxheTogdGFibGU7XFxuICBtYXJnaW46IDBweDsgfVxcblxcbmZpZ3VyZSBpbWcge1xcbiAgZGlzcGxheTogYmxvY2s7IH1cXG5cXG5maWd1cmUgZmlnY2FwdGlvbiB7XFxuICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuNSk7XFxuICBjb2xvcjogI0ZGRjtcXG4gIGNhcHRpb24tc2lkZTogYm90dG9tO1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgYm9yZGVyOiAxcHggZG90dGVkIGJsdWU7IH1cXG5cXG4udGl0bGUge1xcbiAgbWFyZ2luLXRvcDogMC41cmVtOyB9XFxuXFxuYnV0dG9uIHtcXG4gIHBhZGRpbmc6IDRweDsgfVxcblwiLCBcIlwiXSk7XG4vLyBFeHBvcnRzXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/mystyles.css\n");

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/*\n  MIT License http://www.opensource.org/licenses/mit-license.php\n  Author Tobias Koppers @sokra\n*/\n// css base code, injected by the css-loader\n// eslint-disable-next-line func-names\nmodule.exports = function (useSourceMap) {\n  var list = []; // return the list of modules as css string\n\n  list.toString = function toString() {\n    return this.map(function (item) {\n      var content = cssWithMappingToString(item, useSourceMap);\n\n      if (item[2]) {\n        return \"@media \".concat(item[2], \" {\").concat(content, \"}\");\n      }\n\n      return content;\n    }).join('');\n  }; // import a list of modules into the list\n  // eslint-disable-next-line func-names\n\n\n  list.i = function (modules, mediaQuery) {\n    if (typeof modules === 'string') {\n      // eslint-disable-next-line no-param-reassign\n      modules = [[null, modules, '']];\n    }\n\n    for (var i = 0; i < modules.length; i++) {\n      var item = [].concat(modules[i]);\n\n      if (mediaQuery) {\n        if (!item[2]) {\n          item[2] = mediaQuery;\n        } else {\n          item[2] = \"\".concat(mediaQuery, \" and \").concat(item[2]);\n        }\n      }\n\n      list.push(item);\n    }\n  };\n\n  return list;\n};\n\nfunction cssWithMappingToString(item, useSourceMap) {\n  var content = item[1] || ''; // eslint-disable-next-line prefer-destructuring\n\n  var cssMapping = item[3];\n\n  if (!cssMapping) {\n    return content;\n  }\n\n  if (useSourceMap && typeof btoa === 'function') {\n    var sourceMapping = toComment(cssMapping);\n    var sourceURLs = cssMapping.sources.map(function (source) {\n      return \"/*# sourceURL=\".concat(cssMapping.sourceRoot || '').concat(source, \" */\");\n    });\n    return [content].concat(sourceURLs).concat([sourceMapping]).join('\\n');\n  }\n\n  return [content].join('\\n');\n} // Adapted from convert-source-map (MIT)\n\n\nfunction toComment(sourceMap) {\n  // eslint-disable-next-line no-undef\n  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));\n  var data = \"sourceMappingURL=data:application/json;charset=utf-8;base64,\".concat(base64);\n  return \"/*# \".concat(data, \" */\");\n}//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qcz8yNGZiIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICBBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xuLy8gY3NzIGJhc2UgY29kZSwgaW5qZWN0ZWQgYnkgdGhlIGNzcy1sb2FkZXJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh1c2VTb3VyY2VNYXApIHtcbiAgdmFyIGxpc3QgPSBbXTsgLy8gcmV0dXJuIHRoZSBsaXN0IG9mIG1vZHVsZXMgYXMgY3NzIHN0cmluZ1xuXG4gIGxpc3QudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHZhciBjb250ZW50ID0gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtLCB1c2VTb3VyY2VNYXApO1xuXG4gICAgICBpZiAoaXRlbVsyXSkge1xuICAgICAgICByZXR1cm4gXCJAbWVkaWEgXCIuY29uY2F0KGl0ZW1bMl0sIFwiIHtcIikuY29uY2F0KGNvbnRlbnQsIFwifVwiKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfSkuam9pbignJyk7XG4gIH07IC8vIGltcG9ydCBhIGxpc3Qgb2YgbW9kdWxlcyBpbnRvIHRoZSBsaXN0XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG5cblxuICBsaXN0LmkgPSBmdW5jdGlvbiAobW9kdWxlcywgbWVkaWFRdWVyeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgbW9kdWxlcyA9IFtbbnVsbCwgbW9kdWxlcywgJyddXTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gW10uY29uY2F0KG1vZHVsZXNbaV0pO1xuXG4gICAgICBpZiAobWVkaWFRdWVyeSkge1xuICAgICAgICBpZiAoIWl0ZW1bMl0pIHtcbiAgICAgICAgICBpdGVtWzJdID0gbWVkaWFRdWVyeTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzJdID0gXCJcIi5jb25jYXQobWVkaWFRdWVyeSwgXCIgYW5kIFwiKS5jb25jYXQoaXRlbVsyXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGlzdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gbGlzdDtcbn07XG5cbmZ1bmN0aW9uIGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSwgdXNlU291cmNlTWFwKSB7XG4gIHZhciBjb250ZW50ID0gaXRlbVsxXSB8fCAnJzsgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1kZXN0cnVjdHVyaW5nXG5cbiAgdmFyIGNzc01hcHBpbmcgPSBpdGVtWzNdO1xuXG4gIGlmICghY3NzTWFwcGluZykge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9XG5cbiAgaWYgKHVzZVNvdXJjZU1hcCAmJiB0eXBlb2YgYnRvYSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBzb3VyY2VNYXBwaW5nID0gdG9Db21tZW50KGNzc01hcHBpbmcpO1xuICAgIHZhciBzb3VyY2VVUkxzID0gY3NzTWFwcGluZy5zb3VyY2VzLm1hcChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICByZXR1cm4gXCIvKiMgc291cmNlVVJMPVwiLmNvbmNhdChjc3NNYXBwaW5nLnNvdXJjZVJvb3QgfHwgJycpLmNvbmNhdChzb3VyY2UsIFwiICovXCIpO1xuICAgIH0pO1xuICAgIHJldHVybiBbY29udGVudF0uY29uY2F0KHNvdXJjZVVSTHMpLmNvbmNhdChbc291cmNlTWFwcGluZ10pLmpvaW4oJ1xcbicpO1xuICB9XG5cbiAgcmV0dXJuIFtjb250ZW50XS5qb2luKCdcXG4nKTtcbn0gLy8gQWRhcHRlZCBmcm9tIGNvbnZlcnQtc291cmNlLW1hcCAoTUlUKVxuXG5cbmZ1bmN0aW9uIHRvQ29tbWVudChzb3VyY2VNYXApIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gIHZhciBiYXNlNjQgPSBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpO1xuICB2YXIgZGF0YSA9IFwic291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsXCIuY29uY2F0KGJhc2U2NCk7XG4gIHJldHVybiBcIi8qIyBcIi5jb25jYXQoZGF0YSwgXCIgKi9cIik7XG59Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./node_modules/css-loader/dist/runtime/api.js\n");

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar isOldIE = function isOldIE() {\n  var memo;\n  return function memorize() {\n    if (typeof memo === 'undefined') {\n      // Test for IE <= 9 as proposed by Browserhacks\n      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805\n      // Tests for existence of standard globals is to allow style-loader\n      // to operate correctly into non-standard environments\n      // @see https://github.com/webpack-contrib/style-loader/issues/177\n      memo = Boolean(window && document && document.all && !window.atob);\n    }\n\n    return memo;\n  };\n}();\n\nvar getTarget = function getTarget() {\n  var memo = {};\n  return function memorize(target) {\n    if (typeof memo[target] === 'undefined') {\n      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself\n\n      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {\n        try {\n          // This will throw an exception if access to iframe is blocked\n          // due to cross-origin restrictions\n          styleTarget = styleTarget.contentDocument.head;\n        } catch (e) {\n          // istanbul ignore next\n          styleTarget = null;\n        }\n      }\n\n      memo[target] = styleTarget;\n    }\n\n    return memo[target];\n  };\n}();\n\nvar stylesInDom = {};\n\nfunction modulesToDom(moduleId, list, options) {\n  for (var i = 0; i < list.length; i++) {\n    var part = {\n      css: list[i][1],\n      media: list[i][2],\n      sourceMap: list[i][3]\n    };\n\n    if (stylesInDom[moduleId][i]) {\n      stylesInDom[moduleId][i](part);\n    } else {\n      stylesInDom[moduleId].push(addStyle(part, options));\n    }\n  }\n}\n\nfunction insertStyleElement(options) {\n  var style = document.createElement('style');\n  var attributes = options.attributes || {};\n\n  if (typeof attributes.nonce === 'undefined') {\n    var nonce =  true ? __webpack_require__.nc : undefined;\n\n    if (nonce) {\n      attributes.nonce = nonce;\n    }\n  }\n\n  Object.keys(attributes).forEach(function (key) {\n    style.setAttribute(key, attributes[key]);\n  });\n\n  if (typeof options.insert === 'function') {\n    options.insert(style);\n  } else {\n    var target = getTarget(options.insert || 'head');\n\n    if (!target) {\n      throw new Error(\"Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.\");\n    }\n\n    target.appendChild(style);\n  }\n\n  return style;\n}\n\nfunction removeStyleElement(style) {\n  // istanbul ignore if\n  if (style.parentNode === null) {\n    return false;\n  }\n\n  style.parentNode.removeChild(style);\n}\n/* istanbul ignore next  */\n\n\nvar replaceText = function replaceText() {\n  var textStore = [];\n  return function replace(index, replacement) {\n    textStore[index] = replacement;\n    return textStore.filter(Boolean).join('\\n');\n  };\n}();\n\nfunction applyToSingletonTag(style, index, remove, obj) {\n  var css = remove ? '' : obj.css; // For old IE\n\n  /* istanbul ignore if  */\n\n  if (style.styleSheet) {\n    style.styleSheet.cssText = replaceText(index, css);\n  } else {\n    var cssNode = document.createTextNode(css);\n    var childNodes = style.childNodes;\n\n    if (childNodes[index]) {\n      style.removeChild(childNodes[index]);\n    }\n\n    if (childNodes.length) {\n      style.insertBefore(cssNode, childNodes[index]);\n    } else {\n      style.appendChild(cssNode);\n    }\n  }\n}\n\nfunction applyToTag(style, options, obj) {\n  var css = obj.css;\n  var media = obj.media;\n  var sourceMap = obj.sourceMap;\n\n  if (media) {\n    style.setAttribute('media', media);\n  } else {\n    style.removeAttribute('media');\n  }\n\n  if (sourceMap && btoa) {\n    css += \"\\n/*# sourceMappingURL=data:application/json;base64,\".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), \" */\");\n  } // For old IE\n\n  /* istanbul ignore if  */\n\n\n  if (style.styleSheet) {\n    style.styleSheet.cssText = css;\n  } else {\n    while (style.firstChild) {\n      style.removeChild(style.firstChild);\n    }\n\n    style.appendChild(document.createTextNode(css));\n  }\n}\n\nvar singleton = null;\nvar singletonCounter = 0;\n\nfunction addStyle(obj, options) {\n  var style;\n  var update;\n  var remove;\n\n  if (options.singleton) {\n    var styleIndex = singletonCounter++;\n    style = singleton || (singleton = insertStyleElement(options));\n    update = applyToSingletonTag.bind(null, style, styleIndex, false);\n    remove = applyToSingletonTag.bind(null, style, styleIndex, true);\n  } else {\n    style = insertStyleElement(options);\n    update = applyToTag.bind(null, style, options);\n\n    remove = function remove() {\n      removeStyleElement(style);\n    };\n  }\n\n  update(obj);\n  return function updateStyle(newObj) {\n    if (newObj) {\n      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {\n        return;\n      }\n\n      update(obj = newObj);\n    } else {\n      remove();\n    }\n  };\n}\n\nmodule.exports = function (moduleId, list, options) {\n  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>\n  // tags it will allow on a page\n\n  if (!options.singleton && typeof options.singleton !== 'boolean') {\n    options.singleton = isOldIE();\n  }\n\n  moduleId = options.base ? moduleId + options.base : moduleId;\n  list = list || [];\n\n  if (!stylesInDom[moduleId]) {\n    stylesInDom[moduleId] = [];\n  }\n\n  modulesToDom(moduleId, list, options);\n  return function update(newList) {\n    newList = newList || [];\n\n    if (Object.prototype.toString.call(newList) !== '[object Array]') {\n      return;\n    }\n\n    if (!stylesInDom[moduleId]) {\n      stylesInDom[moduleId] = [];\n    }\n\n    modulesToDom(moduleId, newList, options);\n\n    for (var j = newList.length; j < stylesInDom[moduleId].length; j++) {\n      stylesInDom[moduleId][j]();\n    }\n\n    stylesInDom[moduleId].length = newList.length;\n\n    if (stylesInDom[moduleId].length === 0) {\n      delete stylesInDom[moduleId];\n    }\n  };\n};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanM/MmRiYSJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzT2xkSUUgPSBmdW5jdGlvbiBpc09sZElFKCkge1xuICB2YXIgbWVtbztcbiAgcmV0dXJuIGZ1bmN0aW9uIG1lbW9yaXplKCkge1xuICAgIGlmICh0eXBlb2YgbWVtbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIFRlc3QgZm9yIElFIDw9IDkgYXMgcHJvcG9zZWQgYnkgQnJvd3NlcmhhY2tzXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9icm93c2VyaGFja3MuY29tLyNoYWNrLWU3MWQ4NjkyZjY1MzM0MTczZmVlNzE1YzIyMmNiODA1XG4gICAgICAvLyBUZXN0cyBmb3IgZXhpc3RlbmNlIG9mIHN0YW5kYXJkIGdsb2JhbHMgaXMgdG8gYWxsb3cgc3R5bGUtbG9hZGVyXG4gICAgICAvLyB0byBvcGVyYXRlIGNvcnJlY3RseSBpbnRvIG5vbi1zdGFuZGFyZCBlbnZpcm9ubWVudHNcbiAgICAgIC8vIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9zdHlsZS1sb2FkZXIvaXNzdWVzLzE3N1xuICAgICAgbWVtbyA9IEJvb2xlYW4od2luZG93ICYmIGRvY3VtZW50ICYmIGRvY3VtZW50LmFsbCAmJiAhd2luZG93LmF0b2IpO1xuICAgIH1cblxuICAgIHJldHVybiBtZW1vO1xuICB9O1xufSgpO1xuXG52YXIgZ2V0VGFyZ2V0ID0gZnVuY3Rpb24gZ2V0VGFyZ2V0KCkge1xuICB2YXIgbWVtbyA9IHt9O1xuICByZXR1cm4gZnVuY3Rpb24gbWVtb3JpemUodGFyZ2V0KSB7XG4gICAgaWYgKHR5cGVvZiBtZW1vW3RhcmdldF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgc3R5bGVUYXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7IC8vIFNwZWNpYWwgY2FzZSB0byByZXR1cm4gaGVhZCBvZiBpZnJhbWUgaW5zdGVhZCBvZiBpZnJhbWUgaXRzZWxmXG5cbiAgICAgIGlmICh3aW5kb3cuSFRNTElGcmFtZUVsZW1lbnQgJiYgc3R5bGVUYXJnZXQgaW5zdGFuY2VvZiB3aW5kb3cuSFRNTElGcmFtZUVsZW1lbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBUaGlzIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIGFjY2VzcyB0byBpZnJhbWUgaXMgYmxvY2tlZFxuICAgICAgICAgIC8vIGR1ZSB0byBjcm9zcy1vcmlnaW4gcmVzdHJpY3Rpb25zXG4gICAgICAgICAgc3R5bGVUYXJnZXQgPSBzdHlsZVRhcmdldC5jb250ZW50RG9jdW1lbnQuaGVhZDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgc3R5bGVUYXJnZXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG1lbW9bdGFyZ2V0XSA9IHN0eWxlVGFyZ2V0O1xuICAgIH1cblxuICAgIHJldHVybiBtZW1vW3RhcmdldF07XG4gIH07XG59KCk7XG5cbnZhciBzdHlsZXNJbkRvbSA9IHt9O1xuXG5mdW5jdGlvbiBtb2R1bGVzVG9Eb20obW9kdWxlSWQsIGxpc3QsIG9wdGlvbnMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnQgPSB7XG4gICAgICBjc3M6IGxpc3RbaV1bMV0sXG4gICAgICBtZWRpYTogbGlzdFtpXVsyXSxcbiAgICAgIHNvdXJjZU1hcDogbGlzdFtpXVszXVxuICAgIH07XG5cbiAgICBpZiAoc3R5bGVzSW5Eb21bbW9kdWxlSWRdW2ldKSB7XG4gICAgICBzdHlsZXNJbkRvbVttb2R1bGVJZF1baV0ocGFydCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlc0luRG9tW21vZHVsZUlkXS5wdXNoKGFkZFN0eWxlKHBhcnQsIG9wdGlvbnMpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgdmFyIGF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBhdHRyaWJ1dGVzLm5vbmNlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBub25jZSA9IHR5cGVvZiBfX3dlYnBhY2tfbm9uY2VfXyAhPT0gJ3VuZGVmaW5lZCcgPyBfX3dlYnBhY2tfbm9uY2VfXyA6IG51bGw7XG5cbiAgICBpZiAobm9uY2UpIHtcbiAgICAgIGF0dHJpYnV0ZXMubm9uY2UgPSBub25jZTtcbiAgICB9XG4gIH1cblxuICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICB9KTtcblxuICBpZiAodHlwZW9mIG9wdGlvbnMuaW5zZXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0aW9ucy5pbnNlcnQoc3R5bGUpO1xuICB9IGVsc2Uge1xuICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXQob3B0aW9ucy5pbnNlcnQgfHwgJ2hlYWQnKTtcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBmaW5kIGEgc3R5bGUgdGFyZ2V0LiBUaGlzIHByb2JhYmx5IG1lYW5zIHRoYXQgdGhlIHZhbHVlIGZvciB0aGUgJ2luc2VydCcgcGFyYW1ldGVyIGlzIGludmFsaWQuXCIpO1xuICAgIH1cblxuICAgIHRhcmdldC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gIH1cblxuICByZXR1cm4gc3R5bGU7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSkge1xuICAvLyBpc3RhbmJ1bCBpZ25vcmUgaWZcbiAgaWYgKHN0eWxlLnBhcmVudE5vZGUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdHlsZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlKTtcbn1cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuXG5cbnZhciByZXBsYWNlVGV4dCA9IGZ1bmN0aW9uIHJlcGxhY2VUZXh0KCkge1xuICB2YXIgdGV4dFN0b3JlID0gW107XG4gIHJldHVybiBmdW5jdGlvbiByZXBsYWNlKGluZGV4LCByZXBsYWNlbWVudCkge1xuICAgIHRleHRTdG9yZVtpbmRleF0gPSByZXBsYWNlbWVudDtcbiAgICByZXR1cm4gdGV4dFN0b3JlLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgfTtcbn0oKTtcblxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyhzdHlsZSwgaW5kZXgsIHJlbW92ZSwgb2JqKSB7XG4gIHZhciBjc3MgPSByZW1vdmUgPyAnJyA6IG9iai5jc3M7IC8vIEZvciBvbGQgSUVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgICovXG5cbiAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSByZXBsYWNlVGV4dChpbmRleCwgY3NzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgY3NzTm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcyk7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBzdHlsZS5jaGlsZE5vZGVzO1xuXG4gICAgaWYgKGNoaWxkTm9kZXNbaW5kZXhdKSB7XG4gICAgICBzdHlsZS5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgaWYgKGNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICBzdHlsZS5pbnNlcnRCZWZvcmUoY3NzTm9kZSwgY2hpbGROb2Rlc1tpbmRleF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZS5hcHBlbmRDaGlsZChjc3NOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlUb1RhZyhzdHlsZSwgb3B0aW9ucywgb2JqKSB7XG4gIHZhciBjc3MgPSBvYmouY3NzO1xuICB2YXIgbWVkaWEgPSBvYmoubWVkaWE7XG4gIHZhciBzb3VyY2VNYXAgPSBvYmouc291cmNlTWFwO1xuXG4gIGlmIChtZWRpYSkge1xuICAgIHN0eWxlLnNldEF0dHJpYnV0ZSgnbWVkaWEnLCBtZWRpYSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGUucmVtb3ZlQXR0cmlidXRlKCdtZWRpYScpO1xuICB9XG5cbiAgaWYgKHNvdXJjZU1hcCAmJiBidG9hKSB7XG4gICAgY3NzICs9IFwiXFxuLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxcIi5jb25jYXQoYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSkpKSwgXCIgKi9cIik7XG4gIH0gLy8gRm9yIG9sZCBJRVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAgKi9cblxuXG4gIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChzdHlsZS5maXJzdENoaWxkKSB7XG4gICAgICBzdHlsZS5yZW1vdmVDaGlsZChzdHlsZS5maXJzdENoaWxkKTtcbiAgICB9XG5cbiAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcbiAgfVxufVxuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcbnZhciBzaW5nbGV0b25Db3VudGVyID0gMDtcblxuZnVuY3Rpb24gYWRkU3R5bGUob2JqLCBvcHRpb25zKSB7XG4gIHZhciBzdHlsZTtcbiAgdmFyIHVwZGF0ZTtcbiAgdmFyIHJlbW92ZTtcblxuICBpZiAob3B0aW9ucy5zaW5nbGV0b24pIHtcbiAgICB2YXIgc3R5bGVJbmRleCA9IHNpbmdsZXRvbkNvdW50ZXIrKztcbiAgICBzdHlsZSA9IHNpbmdsZXRvbiB8fCAoc2luZ2xldG9uID0gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpKTtcbiAgICB1cGRhdGUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGUsIHN0eWxlSW5kZXgsIGZhbHNlKTtcbiAgICByZW1vdmUgPSBhcHBseVRvU2luZ2xldG9uVGFnLmJpbmQobnVsbCwgc3R5bGUsIHN0eWxlSW5kZXgsIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIHN0eWxlID0gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpO1xuICAgIHVwZGF0ZSA9IGFwcGx5VG9UYWcuYmluZChudWxsLCBzdHlsZSwgb3B0aW9ucyk7XG5cbiAgICByZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGUpO1xuICAgIH07XG4gIH1cblxuICB1cGRhdGUob2JqKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG5ld09iaikge1xuICAgIGlmIChuZXdPYmopIHtcbiAgICAgIGlmIChuZXdPYmouY3NzID09PSBvYmouY3NzICYmIG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB1cGRhdGUob2JqID0gbmV3T2JqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlKCk7XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtb2R1bGVJZCwgbGlzdCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTsgLy8gRm9yY2Ugc2luZ2xlLXRhZyBzb2x1dGlvbiBvbiBJRTYtOSwgd2hpY2ggaGFzIGEgaGFyZCBsaW1pdCBvbiB0aGUgIyBvZiA8c3R5bGU+XG4gIC8vIHRhZ3MgaXQgd2lsbCBhbGxvdyBvbiBhIHBhZ2VcblxuICBpZiAoIW9wdGlvbnMuc2luZ2xldG9uICYmIHR5cGVvZiBvcHRpb25zLnNpbmdsZXRvbiAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgb3B0aW9ucy5zaW5nbGV0b24gPSBpc09sZElFKCk7XG4gIH1cblxuICBtb2R1bGVJZCA9IG9wdGlvbnMuYmFzZSA/IG1vZHVsZUlkICsgb3B0aW9ucy5iYXNlIDogbW9kdWxlSWQ7XG4gIGxpc3QgPSBsaXN0IHx8IFtdO1xuXG4gIGlmICghc3R5bGVzSW5Eb21bbW9kdWxlSWRdKSB7XG4gICAgc3R5bGVzSW5Eb21bbW9kdWxlSWRdID0gW107XG4gIH1cblxuICBtb2R1bGVzVG9Eb20obW9kdWxlSWQsIGxpc3QsIG9wdGlvbnMpO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlKG5ld0xpc3QpIHtcbiAgICBuZXdMaXN0ID0gbmV3TGlzdCB8fCBbXTtcblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobmV3TGlzdCkgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXN0eWxlc0luRG9tW21vZHVsZUlkXSkge1xuICAgICAgc3R5bGVzSW5Eb21bbW9kdWxlSWRdID0gW107XG4gICAgfVxuXG4gICAgbW9kdWxlc1RvRG9tKG1vZHVsZUlkLCBuZXdMaXN0LCBvcHRpb25zKTtcblxuICAgIGZvciAodmFyIGogPSBuZXdMaXN0Lmxlbmd0aDsgaiA8IHN0eWxlc0luRG9tW21vZHVsZUlkXS5sZW5ndGg7IGorKykge1xuICAgICAgc3R5bGVzSW5Eb21bbW9kdWxlSWRdW2pdKCk7XG4gICAgfVxuXG4gICAgc3R5bGVzSW5Eb21bbW9kdWxlSWRdLmxlbmd0aCA9IG5ld0xpc3QubGVuZ3RoO1xuXG4gICAgaWYgKHN0eWxlc0luRG9tW21vZHVsZUlkXS5sZW5ndGggPT09IDApIHtcbiAgICAgIGRlbGV0ZSBzdHlsZXNJbkRvbVttb2R1bGVJZF07XG4gICAgfVxuICB9O1xufTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js\n");

/***/ }),

/***/ "./ssfl/static/css/calendar.css":
/*!**************************************!*\
  !*** ./ssfl/static/css/calendar.css ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var api = __webpack_require__(/*! ../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ \"./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js\");\n            var content = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!./calendar.css */ \"./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/calendar.css\");\n\n            content = content.__esModule ? content.default : content;\n\n            if (typeof content === 'string') {\n              content = [[module.i, content, '']];\n            }\n\nvar options = {};\n\noptions.insert = \"head\";\noptions.singleton = false;\n\nvar update = api(module.i, content, options);\n\nvar exported = content.locals ? content.locals : {};\n\n\n\nmodule.exports = exported;//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zc2ZsL3N0YXRpYy9jc3MvY2FsZW5kYXIuY3NzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3NmbC9zdGF0aWMvY3NzL2NhbGVuZGFyLmNzcz80ZTViIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBhcGkgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiKTtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9jYWxlbmRhci5jc3NcIik7XG5cbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50Ll9fZXNNb2R1bGUgPyBjb250ZW50LmRlZmF1bHQgOiBjb250ZW50O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbiAgICAgICAgICAgIH1cblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkobW9kdWxlLmlkLCBjb250ZW50LCBvcHRpb25zKTtcblxudmFyIGV4cG9ydGVkID0gY29udGVudC5sb2NhbHMgPyBjb250ZW50LmxvY2FscyA6IHt9O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRlZDsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./ssfl/static/css/calendar.css\n");

/***/ }),

/***/ "./ssfl/static/css/mystyles.css":
/*!**************************************!*\
  !*** ./ssfl/static/css/mystyles.css ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var api = __webpack_require__(/*! ../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ \"./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js\");\n            var content = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!./mystyles.css */ \"./node_modules/css-loader/dist/cjs.js!./ssfl/static/css/mystyles.css\");\n\n            content = content.__esModule ? content.default : content;\n\n            if (typeof content === 'string') {\n              content = [[module.i, content, '']];\n            }\n\nvar options = {};\n\noptions.insert = \"head\";\noptions.singleton = false;\n\nvar update = api(module.i, content, options);\n\nvar exported = content.locals ? content.locals : {};\n\n\n\nmodule.exports = exported;//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zc2ZsL3N0YXRpYy9jc3MvbXlzdHlsZXMuY3NzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3NmbC9zdGF0aWMvY3NzL215c3R5bGVzLmNzcz9lYTU5Il0sInNvdXJjZXNDb250ZW50IjpbInZhciBhcGkgPSByZXF1aXJlKFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiKTtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gcmVxdWlyZShcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9teXN0eWxlcy5jc3NcIik7XG5cbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50Ll9fZXNNb2R1bGUgPyBjb250ZW50LmRlZmF1bHQgOiBjb250ZW50O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGNvbnRlbnQgPSBbW21vZHVsZS5pZCwgY29udGVudCwgJyddXTtcbiAgICAgICAgICAgIH1cblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkobW9kdWxlLmlkLCBjb250ZW50LCBvcHRpb25zKTtcblxudmFyIGV4cG9ydGVkID0gY29udGVudC5sb2NhbHMgPyBjb250ZW50LmxvY2FscyA6IHt9O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRlZDsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./ssfl/static/css/mystyles.css\n");

/***/ }),

/***/ "./ssfl/static/js/index.js":
/*!*********************************!*\
  !*** ./ssfl/static/js/index.js ***!
  \*********************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _css_mystyles_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../css/mystyles.css */ \"./ssfl/static/css/mystyles.css\");\n/* harmony import */ var _css_mystyles_css__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_css_mystyles_css__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _css_calendar_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../css/calendar.css */ \"./ssfl/static/css/calendar.css\");\n/* harmony import */ var _css_calendar_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_calendar_css__WEBPACK_IMPORTED_MODULE_1__);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zc2ZsL3N0YXRpYy9qcy9pbmRleC5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NzZmwvc3RhdGljL2pzL2luZGV4LmpzPzI5N2IiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuLi9jc3MvbXlzdHlsZXMuY3NzJztcbmltcG9ydCAnLi4vY3NzL2NhbGVuZGFyLmNzcyc7XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./ssfl/static/js/index.js\n");

/***/ }),

/***/ "./ssfl/static/js/sst_javascript.js":
/*!******************************************!*\
  !*** ./ssfl/static/js/sst_javascript.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("var $ = jQuery;\nvar myIndex = 0;\n$(document).ready(function () {\n  function carousel() {\n    var i;\n    var x = document.getElementsByClassName(\"mySlides\");\n\n    for (i = 0; i < x.length; i++) {\n      x[i].style.display = \"none\";\n    }\n\n    myIndex++;\n\n    if (myIndex > x.length) {\n      myIndex = 1;\n    }\n\n    x[myIndex - 1].style.display = \"block\";\n    setTimeout(carousel, 5000); // Change image every 5 seconds\n  }\n\n  carousel();\n});//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zc2ZsL3N0YXRpYy9qcy9zc3RfamF2YXNjcmlwdC5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NzZmwvc3RhdGljL2pzL3NzdF9qYXZhc2NyaXB0LmpzP2NjZWQiXSwic291cmNlc0NvbnRlbnQiOlsidmFyICQgPSBqUXVlcnk7XG52YXIgbXlJbmRleCA9IDA7XG5cbiQoIGRvY3VtZW50ICkucmVhZHkoZnVuY3Rpb24oKSB7XG5cbmZ1bmN0aW9uIGNhcm91c2VsKCkge1xuICB2YXIgaTtcbiAgdmFyIHggPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwibXlTbGlkZXNcIik7XG4gIGZvciAoaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKSB7XG4gICAgeFtpXS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cbiAgbXlJbmRleCsrO1xuICBpZiAobXlJbmRleCA+IHgubGVuZ3RoKSB7bXlJbmRleCA9IDF9XG4gIHhbbXlJbmRleC0xXS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICBzZXRUaW1lb3V0KGNhcm91c2VsLCA1MDAwKTsgLy8gQ2hhbmdlIGltYWdlIGV2ZXJ5IDUgc2Vjb25kc1xufVxuXG5cbmNhcm91c2VsKCk7XG59KTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0EiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./ssfl/static/js/sst_javascript.js\n");

/***/ }),

/***/ 0:
/*!**************************************************************************!*\
  !*** multi ./ssfl/static/js/sst_javascript.js ./ssfl/static/js/index.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! /home/don/devel/ssflask2/ssfl/static/js/sst_javascript.js */"./ssfl/static/js/sst_javascript.js");
module.exports = __webpack_require__(/*! /home/don/devel/ssflask2/ssfl/static/js/index.js */"./ssfl/static/js/index.js");


/***/ })

/******/ });
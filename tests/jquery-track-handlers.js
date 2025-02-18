/* jQuery event handler tracker - coded by ChatGPT
 Allows to track event handlers bound with jQuery for testing purposes
 Limitations:
 1) May not work propery with jQuery delegated event handlers (not tested)
 2) Relies on jQuery internals, e.g. handling of namespaces (jQuery 3.x calls remove separate for each previously bound namespaced event type, so we don't have to account for that here)
 3) Does not account for $.off(Event) where Event is a jQuery.Event object, https://api.jquery.com/off/#off-event

// Example Usage
$('#myElement').on('click', function() {
    console.log('Clicked!');
});

$('#myElement').on('mouseover', function() {
    console.log('Mouse over!');
});

// Retrieve tracked events
console.log($('#myElement').getTrackedEvents());
// expect to get an array of length 2, one element of each of click and mouseover event types
*/

(function($) {
    // Create a WeakMap to store event data per element
    var eventRegistry = new WeakMap();

    // Hook into jQuery's internal event system
    var originalAdd = $.event.add;
    $.event.add = function(elem, types, handler, data, selector) {
        if (!eventRegistry.has(elem)) {
            eventRegistry.set(elem, []);
        }

        // Store event details, support multiple space-separated event types
        types.split(" ").forEach(type => {
            eventRegistry.get(elem).push({
                event: type,
                handler: handler,
                selector: selector,
                boundTimeMs: Date.now()
            });
        });
        // Call the original jQuery event handler
        return originalAdd.call(this, elem, types, handler, data, selector);
    };

    // Hook into jQuery's event system for removing events
    var originalRemove = $.event.remove;
    $.event.remove = function(elem, types, handler, selector) {
        if (eventRegistry.has(elem)) {
            let events = eventRegistry.get(elem);

            if (types) {
                // Support multiple space-separated event types
                types.split(" ").forEach(type => {
                    events = events.filter(e =>
                        !(e.event === type &&
                          (!handler || e.handler === handler) &&
                          (!selector || e.selector === selector))
                    );
                });
            } else {
                // If no types are provided, remove all events
                events = [];
            }

            // Update or delete registry entry
            if (events.length > 0) {
                eventRegistry.set(elem, events);
            } else {
                eventRegistry.delete(elem);
            }
        }

        // Call the original jQuery event removal function
        return originalRemove.call(this, elem, types, handler, selector);
    };

    // jQuery plugin to retrieve tracked events for an element
    $.fn.getTrackedEvents = function() {
        return eventRegistry.get(this[0]) || [];
    };
})(jQuery);

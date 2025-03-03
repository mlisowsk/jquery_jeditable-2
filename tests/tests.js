/* jquery-jeditable tests */
var $elem = $(), elem;

function cleanUp($el) {
    $elem = $("<div></div>").appendTo('#qunit-fixture');
    elem = $elem.get(0);
}
QUnit.on('testStart', testStart => {
    console.log(testStart);
    // name: 'my test'
    // moduleName: 'my module'
    // fullName: ['parent', 'my module', 'my test']

    // name: 'global test'
    // moduleName: null
    // fullName: ['global test']
});

QUnit.module('Basics', {
    beforeEach: function () {
        cleanUp($('#qunit-fixture'));
    }
});
QUnit.test('Registration', function (assert) {
    assert.ok($.fn.editable, 'registered as a jQuery plugin');
});
QUnit.test('Chainability', function (assert) {

    assert.ok($elem.editable().addClass('testing'), 'can be chained');
    assert.ok($elem.hasClass('testing'), 'successfully chained');
});

QUnit.test('ARIA attributes', function (assert) {

    $elem.editable().editableAriaShim();
    assert.ok($elem.is('[role="button"]'), 'added role');
});


QUnit.test('Enable/disable/destroy', function (assert) {
    $elem.text("testtext").editable({ type: "text" });
    $elem.editable('disable');
    assert.strictEqual($elem.data('disabled.editable'), true, "Disabled state ok");

    $elem.editable('enable');
    assert.ok($elem.data('event.editable'), "Enabled after disabled");

    $elem.editable().editable('destroy');
    assert.notOk($elem.data('event.editable'), "Destroy removes jQuery data");

    assert.equal($elem.find("input[type=text]").length, 0, "Destroy removes INPUT field");
});

QUnit.test('Event handlers', async function (assert) {
    const done1 = assert.async();
    const done2 = assert.async();
    var handlers = $elem.getTrackedEvents();

    console.log("before editable() handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());
    assert.equal($elem.getTrackedEvents().length, 0, "No event handlers prior to first call");
    $elem.text("initialtext").editable(
        function (newValue, settings) {
            //assert.step("SUBMIT " + newValue);
            console.log("SUBMIT");
            done1();
            return newValue;  // return text value to commit value to HTML
        }, {
        type: "text",
        submit: "OK",
        onblur: "submit"
        });
    assert.equal($elem.getTrackedEvents().length, 2, "Two event handlers after initialization");
    console.log("aft .editable() handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());

    $elem.click();  // activate editable
    setTimeout(function () {
        //assert.equal($elem.getTrackedEvents().length, 3, "3 event handlers after click");
        console.log("aft .click()) handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());

        $elem.find("input").val("newtext");
        assert.equal($elem.find("button").length, 1, "One OK button");
        $elem.find("button").click();   // submit with OK button

        setTimeout(function () {
            $elem.editable('destroy');
            assert.equal($elem.getTrackedEvents().length, 0, "No event handlers after call to 'destroy'");
            console.log("aft destroy editable() handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());
            done2();
        }, 400);
    }, 400);
});

QUnit.test('Event handlers losing focus', async function (assert) {
    const done1 = assert.async();
    const done2 = assert.async();
    var handlers = $elem.getTrackedEvents();

    var $other = $elem.parent().append("<div id='other' tabindex='1' style='width: 200px; height: 50px;'>Other content</div>");
    console.log("before editable() handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());
    assert.equal($other.length, 1, "Other element exists");
    assert.equal($elem.getTrackedEvents().length, 0, "No event handlers prior to first call");
    $elem.text("initialtext").editable(
        function (newValue, settings) {
            //assert.step("SUBMIT " + newValue);
            console.log("SUBMIT callback newValue="+newValue);
            done1();
            return newValue;  // return text value to commit value to HTML
        }, {
        type: "text",
        submit: "OK",
        onblur: "cancel"
        });
    assert.equal($elem.getTrackedEvents().length, 2, "Two event handlers after initialization");
    console.log("aft .editable() handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());

    $elem.click();  // activate editable
    setTimeout(function () {
        //assert.equal($elem.getTrackedEvents().length, 3, "3 event handlers after click");
        console.log("aft activate .click()) handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());

        $elem.find("input").val("newtext");
        //assert.equal($other.lengt.find("button").length, 1, "One OK button");
        //$other.click(); // click on other element, losing focus on editable
        $elem.find("input").trigger("blur");

        setTimeout(function () {
            assert.equal($elem.getTrackedEvents().length, 2, "2 event handlers after blur");
            console.log("aft blur .click()) handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());
            //debugger;
            $elem.editable('destroy');
            assert.equal($elem.getTrackedEvents().length, 0, "No event handlers after call to 'destroy'");
            console.log("aft destroy editable() handlers.len=" + $elem.getTrackedEvents().length, $elem.getTrackedEvents());
            done2();
        }, 1000);
    }, 400);
});

QUnit.module('Text Field', {
    beforeEach: function () {
        cleanUp($('#qunit-fixture'));
    }
});
QUnit.test('Open, text value', async function (assert) {
    const done = assert.async();
    const DEMO_TEXT = "demo";

    $elem.text(DEMO_TEXT).editable({ type: "text" });

    $elem.trigger("click");
    setTimeout(function () {
        assert.equal($elem.find("input[type=text]").length, 1, "INPUT field is present and of type text");
        assert.equal($elem.find("input").is(":visible"), 1, "INPUT field is visible");
        assert.equal($elem.find("input").val(), DEMO_TEXT, "INPUT value is initialized from prior text content");
        done();
    }, 400);
});

QUnit.test('Submit', async function (assert) {
    const done = assert.async();
    const done2 = assert.async();

    assert.timeout(1200); // Timeout after 0.5 seconds

    const DEMO_TEXT = "demo";
    $elem.text(DEMO_TEXT).editable(
        function (newValue, settings) {
            assert.step("SUBMIT " + newValue);
            console.log("SUBMIT");
            done();
            return newValue;  // return text value to commit value to HTML
        }, {
        type: "text",
        submit: "OK", // OK button to submit
        onedit: function () {
            console.log("EDIT");
            assert.step("EDIT started");
            return true;  // return true to proceed editing
        }
    });

    $elem.trigger("click"); // activate editable
    setTimeout(function () {
        assert.equal($elem.find("input[type=text]").length, 1, "INPUT field is present and of type text");
        assert.equal($elem.find("input").is(":visible"), 1, "INPUT field is visible");
        assert.equal($elem.find("input").val(), DEMO_TEXT, "INPUT value is initialized from prior text content");
        assert.equal($elem.find("button").length, 1, "Button is present");
        assert.equal($elem.find("button").text(), "OK", "Button text is 'OK'");

        const INPUT_TEXT = "newtext"
        var elemInput = $elem.find("input").get(0);
        assert.ok(elemInput, "Input HTMLElement found");
        $elem.find("input").val(INPUT_TEXT);

        $elem.find("button").click();

        setTimeout(function () {
            //debugger;
            done2();
            assert.verifySteps(["EDIT started", "SUBMIT " + INPUT_TEXT], "input text submitted");
        }, 400);
    }, 400);
});

QUnit.module('select-boxes', {
    beforeEach: function () {
        cleanUp($('#qunit-fixture'));
    }
});
QUnit.test('Default: NOT Sorting select options', function (assert) {

    $elem.append('<span id="select-tester">Letter F</span>');

    $.fn.editable.defaults.sortselectoptions = false;

    $('#select-tester').editable('http://bla', {
        type: 'select',
        data: { 'E': 'Letter E', 'F': 'Letter F', 'D': 'Letter Disk' },
        selected: 'F'
    });

    assert.equal($('#select-tester').attr('title'), 'Click to edit', 'Editable enabled: it sets the title');
    $('#select-tester').click();
    assert.equal($('#select-tester form').length, 1, 'Clicking Editable adds inline form');

    var optionsList = [];
    $('#select-tester option').each(function (name, val) { optionsList.push(val.text); });

    assert.deepEqual(optionsList, ['Letter E', 'Letter F', 'Letter Disk'], 'Does not sort the given options-list');
});
QUnit.test('Default: Sorting select options', function (assert) {

    $elem.append('<span id="select-sorted-tester">Letter F</span>');

    $.fn.editable.defaults.sortselectoptions = true;

    $('#select-sorted-tester').editable('http://bla', {
        type: 'select',
        data: { 'E': 'Letter E', 'F': 'Letter F', 'D': 'Letter Disk' },
        selected: 'F'
    });
    assert.equal($('#select-sorted-tester').attr('title'), 'Click to edit', 'Editable enabled: it sets the title');
    $('#select-sorted-tester').click();
    assert.equal($('#select-sorted-tester form').length, 1, 'Clicking Editable adds inline form');

    var optionsList = [];
    $('#select-sorted-tester option').each(function (name, val) { optionsList.push(val.text); });

    assert.deepEqual(optionsList, ['Letter Disk', 'Letter E', 'Letter F'], 'It does sort the given options list');
});

QUnit.module('select-boxes input data', {
    beforeEach: function () {
        cleanUp($('#qunit-fixture'));
    }
});
QUnit.test('List of tuples', function (assert) {

    $elem.append('<span id="select-tester"></span>');
    var e = $('#select-tester', $elem);

    var test_data = [['E', 'Letter E'], ['F', 'Letter F'], ['D', 'Letter Disk']];
    e.editable('http://bla', {
        type: 'select',
        data: test_data
    });

    e.click();

    var optionsList = [];
    e.find('option').each(function (name, val) { optionsList.push([val.value, val.text]); });
    assert.deepEqual(optionsList, test_data, 'Options keep sorted as defined in input');
});
QUnit.test('List of strings', function (assert) {

    $elem.append('<span id="select-tester"></span>');
    var e = $('#select-tester', $elem);

    var test_data = ['E', 'F', 'D'];
    var sort = Math.random() > 0.5;
    e.editable('http://bla', {
        type: 'select',
        data: test_data,
        sortselectoptions: sort
    });

    e.click();

    var optionsList = [];
    var expected_result = [['0', 'E'], ['1', 'F'], ['2', 'D']];
    if (sort) {
        expected_result.sort(function (a, b) { a = a[1]; b = b[1]; return a < b ? -1 : (a > b ? 1 : 0); });
    }
    e.find('option').each(function (name, val) { optionsList.push([val.value, val.text]); });
    assert.deepEqual(optionsList, expected_result, 'Options get auto assigned integer values in order of input and options are sorted by label based on sortselectoptions option: ');
});
QUnit.test('Object', function (assert) {

    $elem.append('<span id="select-tester"></span>');
    var e = $('#select-tester', $elem);

    var test_data = { 'E': 'Letter E', 'F': 'Letter F', 'D': 'Letter Disk' };
    var sort = Math.random() > 0.5;
    e.editable('http://bla', {
        type: 'select',
        data: test_data,
        sortselectoptions: sort
    });

    e.click();

    var optionsList = [];
    var expected_result = [['E', 'Letter E'], ['F', 'Letter F'], ['D', 'Letter Disk']];
    if (sort) {
        expected_result.sort(function (a, b) { a = a[1]; b = b[1]; return a < b ? -1 : (a > b ? 1 : 0); });
    }
    e.find('option').each(function (name, val) { optionsList.push([val.value, val.text]); });
    assert.deepEqual(optionsList, expected_result, 'Options are sorted either in order of object definition or by label depending on sortselectoptions option: ' + sort);
});

QUnit.module('select-boxes setting selected', {
    beforeEach: function () {
        cleanUp($('#qunit-fixture'));
    }
});
QUnit.test('Explicitly setting a selected option', function (assert) {

    $elem.append('<span id="selected-tester">Letter F</span>');

    $.fn.editable.defaults.sortselectoptions = false;

    $('#selected-tester').editable('http://bla', {
        type: 'select',
        data: { 'E': 'Letter E', 'F': 'Letter F', 'D': 'Letter Disk', 'selected': 'F' },
    });

    assert.equal($('#selected-tester').attr('title'), 'Click to edit', 'Editable enabled: it sets the title');
    $('#selected-tester').click();
    assert.equal($('#selected-tester form select :selected').text(), 'Letter F', 'Sets the correct value as selected');
});
QUnit.test('Not setting a selected option', function (assert) {

    $elem.append('<span id="selected-tester">Letter F</span>');

    $.fn.editable.defaults.sortselectoptions = false;

    $('#selected-tester').editable('http://bla', {
        type: 'select',
        data: { 'E': 'Letter E', 'F': 'Letter F', 'D': 'Letter Disk' },
    });

    assert.equal($('#selected-tester').attr('title'), 'Click to edit', 'Editable enabled: it sets the title');
    $('#selected-tester').click();
    assert.equal($('#selected-tester form select :selected').text(), 'Letter E', 'Selects the first option as selected?');
});


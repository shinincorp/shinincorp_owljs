include("owl/repl");
var {OWL} = require("owl");
var assert = require("assert");
var fs = require('fs');

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

exports.testMakeOntology = function() {
    owl = new OWL();
    owlinit(owl);
    load("test/repl/instont.js");
};


if (require.main == module) {
    require("test").run(exports);
}

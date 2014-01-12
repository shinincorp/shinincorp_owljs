var {OWLFrame} = require("owl/owlframe"); 
/* 
 * Package: owl.js
 *
 * A Ringo/JS library for accessing the <owlapi>
 *
 * The main class is <OWL>, a wrapper for an <owlapi.OWLOntology>
 *
 * This package also defines <OWLFrame>, which is an alternate
 * representation of an owl object such as an <owlapi.OWLClass>,
 * with each axiom about that class is represented as a tag in
 * a dictionary structure (slotMap)
 *
 */


importPackage(java.io);
importPackage(java.util);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(Packages.org.coode.owlapi.manchesterowlsyntax);
importPackage(org.semanticweb.owlapi.apibinding);
importPackage(org.semanticweb.elk.owlapi);
importPackage(Packages.owltools.io);
importPackage(Packages.com.google.gson);


// TODO
if (java.lang.System.getenv().containsKey("OWLTOOLS_JAR_PATH")) {
    var jarpath = java.lang.System.getenv().get("OWLTOOLS_JAR_PATH");
    addToClasspath(jarpath);
}



// ========================================
// ENGINE
// ========================================

/* Namespace: OWL
 *
 * An object managing an OWL ontology. Each OWL object holds a reference to an <owlapi.OWLOntology> and an <owlapi.OWLReasoner>.
 * It provides convenient js methods that wrap calls in these objects.
 *
 * Class variables:
 *  - config : a dictionary of configuration parameters
 *  - reasoner : access this using <getReasoner>
 *  - ontology : access this using <getOntology>
 *  - changes : set of changes this session
 */

/*
 * 
 * Function: OWL
 * 
 *  Constructor
 * 
 * Arguments:
 *  - ontology: an <owlapi.OWLOntology>
 */

var OWL = exports.OWL = function OWL(ont) {
    if (ont != null) {
        //print("ONT="+ont);
        this.ontology = ont;
    }
    this.reasoner = null;
    this.changes = [];
    this.generatedFrames = [];
    this.config = {};
    return this;
}

/* Function: createOntology
 * 
 * Creates an OWL ontology
 * 
 * Arguments:
 *  - IRI: a <owlapi.IRI> or a string denoting an IRI
 *
 *
 * Returns:
 *  a new <owlapi.OWLOntology>
 */
OWL.prototype.createOntology = function(iri) {
    var manager = this.getManager();
    if (iri != null) {
        if (typeof iri == 'string') {
            if (iri.indexOf("http") != 0) {
                iri = new File(iri);
            }
            iri = IRI.create(iri);
        }
    }
    this.ontology = manager.createOntology(iri);
    return this.ontology;
}


/* Function: loadOntology
 * 
 * Loads an ontology from an IRI
 * 
 * Arguments:
 *  - IRI: a <owlapi.IRI> or a string denoting an IRI
 *
 * See Also:
 *  - <loadFile>
 */
OWL.prototype.loadOntology = function(iri) {
    //var manager = OWLManager.createOWLOntologyManager();
    if (iri == null) {
        iri = this.config.defaultFile;
    }
    var manager = this.getManager();
    if (typeof iri == 'string') {
        if (iri.indexOf("http") != 0) {
            iri = new File(iri);
        }
        iri = IRI.create(iri);
    }
    this.ontology = manager.loadOntologyFromOntologyDocument(iri);
    return this.ontology;
}

/* Function: loadFile
 * 
 * Loads an ontology from a file
 * 
 * Arguments:
 *  - filename
 *
 * See Also:
 *  - <loadOntology>
 */
OWL.prototype.loadFile = function(filename) {
    //var manager = OWLManager.createOWLOntologyManager();
    if (filename == null) {
        filename = this.config.defaultFile;
    }
    if (filename == '-') {
        // TODO
    }
    var manager = this.getManager();
    var iri = filename;
    if (typeof iri == 'string') {
        iri = IRI.create( new File(iri));
    }
    this.ontology = manager.loadOntologyFromOntologyDocument(iri);
    return this.ontology;
}

/* Function: getOntology
 * returns: an <owlapi.OWLOntology>
 */
OWL.prototype.getOntology = function() {
    return this.ontology;
}
OWL.prototype.getOntologyIRI = function() {
    if (this.ontology == null) {
        return null;
    }
    return this.ontology.getOntologyID().getOntologyIRI();
}
// deprecated
OWL.prototype.df = function() {
    return this.ontology.getOWLDataFactory();
}
/* Function: getOWLDataFactory
 * returns: an <owlapi.OWLDataFactory>
 */
OWL.prototype.getOWLDataFactory = function() {
    return this.ontology.getOWLDataFactory();
}
/* Function: getManager
 * returns: an <owlapi.OWLManager>
 */
OWL.prototype.getManager = function() {
    if (this.manager == null) {
        this.manager = OWLManager.createOWLOntologyManager();
    }
    return this.manager;
    //return this.getOntology().getOWLOntologyManager();
}
/* Function: addCatalog
 * 
 * Uses a catalog to map to IRI to local paths
 * 
 * Arguments:
 *  - file : path to a catalog XML file (defaults to "catalog-v001.xml")
 */
OWL.prototype.addCatalog = function(file) {
    if (file == null) {
        file = "catalog-v001.xml";
    }
    this.getManager().addIRIMapper(new CatalogXmlIRIMapper(file));
}

// @Deprecated
OWL.prototype.getMaker = function() {
    return this;
}

/* Function: getReasoner
 *
 * gets the current reasoner. If none instantiated, will generate one using the
 * current ontology
 *
 * returns: 
 *  An <owlapi.OWLReasoner>
 */
OWL.prototype.getReasoner = function() {
    if (this.reasoner == null) {
        this.reasoner = this.getReasonerFactory().createReasoner(this.getOntology());
    }
    return this.reasoner;
}

/* Function: getReasonerFactory
 *
 * returns: 
 *  An <owlapi.OWLReasonerFactory> - defaults to ElkReasonerFactory
 */
OWL.prototype.getReasonerFactory = function() {
    if (this.reasonerFactory == null) {
        this.reasonerFactory = new ElkReasonerFactory();
    }
    return this.reasonerFactory;
}

/* Function: getInferredSuperClasses
 *
 * Uses an <owlapi.OWLReasoner> to find inferred superclasses for a class
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClass>
 *  - isDirect : boolean
 *  - isReflexive : boolean
 *
 * Returns: 
 *  list of superclasses
 */
OWL.prototype.getInferredSuperClasses = function(cls, isDirect, isReflexive) {
    if (isDirect == null) {
        isDirect = true;
    }
    var jl = this.getReasoner().getSuperClasses(cls, isDirect).getFlattened();
    var rl = this.a2l(jl.toArray());
    if (isReflexive) {
        rl.concat(this.getInferredEquivalentClasses(cls));
    }
    return rl;
}

OWL.prototype.getInferredEquivalentClasses = function(cls) {
    var jl = this.getReasoner().getEquivalentClasses(cls).getFlattened();
    var rl = this.a2l(jl.toArray());
    return rl;
}

/* Function: getAncestorsOver
 *
 * Uses OWLReasoner to find subsuming class expressions of the form
 *  "P some A" (i.e. the set of ancestors A over P)
 *
 * Implementation: 
 * - materialize classes of the form PA = (P some A) in
 *   an auxhiliary ontology
 * - find superclasses of C
 * - unfold each result to obtain A
 * 
 * Arguments:
 *  - cls : an OWLClass
 *  - prop : an OWLObjectProperty
 *  - isReflexive : boolean
 *  - isDirect : boolean
 * returns: list of ancestors (or direct parents) via prop
 */
OWL.prototype.getAncestorsOver = function(cls, prop, isReflexive, isDirect) {
    var mat = this.materializeExistentialExpressions(prop, isReflexive);
    var supers = this.getInferredSuperClasses(cls, isDirect);
    var ancs = supers.map(function(x) {
        var orig = mat.lookup[x];
        if (orig != null) {
            return orig;
        }
        return x;
    });
    if (isReflexive) {
        ancs.push(cls);
    }
    return ancs;
}

OWL.prototype.materializeExistentialExpressions = function(prop, isReflexive) {
    var suffix = prop.getIRI().toString() + isReflexive;
    var cl = this.a2l(this.getOntology().getClassesInSignature(true).toArray());
    var ontIRI = this.getOntology().getIRI();
    var matOntIRI = IRI.create(ontIRI + suffix);
    var matOnt = this.getManager().createOWLOntology();
    var mat = {
        ontology : matOnt,
        property : prop,
        isReflexive : isReflexive,
        lookup : {}
    };
    for (var k in cl) {
        var c = cl[k];
        var x = this.someValuesFrom(p, c);
        var tmpClsIRI = c.getIRI().toString() + "-" + suffix;
        var tmpCls = this.getOWLDataFactory().getOWLClass(tmpClsIRI);
        var eca = this.equivalentClasses(tmpCls, x); 
        lookup[tmpCls] = c;
    }
    var change = new AddImports(this.getOntology(), 
                               this.getOWLDataFactory().getOWLImportsDeclaration(matOntIRI));
    return this.applyChange(change);
    // todo - allow removal
    return mat;
}


/* Function: grepAxioms
 *
 * filters axioms in ontology using a grep function.
 * The function takes on argument - the axiom - and returns
 * true if the axiom is to be included.
 *
 * Example:
 * > var logicAxioms = owl.grepAxioms( function(ax) { return ax.isLogicalAxiom() } );
 *
 * Arguments:
 *  - grepFunc : function
 *
 * Returns: <owlapi.OWLAxiom> []
 */
OWL.prototype.grepAxioms = function(grepFunc, isNegated, isReplace) {
    var inAxioms = this.ontology.getAxioms().toArray();
    if (isNegated == null) {
        isNegated = false;
    }
    var filteredAxioms = [];
    for (var k in inAxioms) {
        var ax = inAxioms[k];
        if (isNegated) {
            if (!grepFunc.call(this, ax, this)) {
                filteredAxioms.push(ax);
            }
        }
        else {
            if (grepFunc.call(this, ax, this)) {
                filteredAxioms.push(ax);
            }
        }
    }
    if (isReplace) {
        this.removeAxioms(inAxioms);
        this.addAxioms(filteredAxioms);
    }
    return filteredAxioms;
}

/* Function: sedAxioms
 *
 * filters and replace axioms in ontology using a custom function.
 * The function takes on argument - the potentially replaced axiom - and
 * returns a replaced axiom. If null is returned, no action is taken
 *
 * Example:
 * > // invert all subclass axioms
 * > owl.sedAxioms( 
 * >  function(ax, owl) { 
 * >    if (ax instanceof OWLSubClassOf) { return owl.subClassOf(ax.getSuperClass(), ax.getSubClass()) }
 * >  });
 *
 * Arguments:
 *  - grepFunc : function
 *
 * Returns: <owlapi.OWLAxiom> []
 */
OWL.prototype.sedAxioms = function(sedFunc) {
    var inAxioms = this.ontology.getAxioms().toArray();
    var newAxioms = [];
    var rmAxioms = [];
    for (var k in inAxioms) {
        var ax = inAxioms[k];
        var ax2 = sedFunc.call(this, ax);
        if (ax2 == null) {
        }
        else if (ax2.concat != null) {
            //this.log(ax + " ===> " + ax2);
            newAxioms = newAxioms.concat(ax2.concat);
            rmAxioms.push(ax);
        }
        else {
            //this.log(ax + " ===> " + ax2);
            newAxioms.push(ax2);
            rmAxioms.push(ax);
        }
    }
    this.addAxioms(newAxioms);
    this.removeAxioms(rmAxioms);
    return newAxioms;
}


/* Function: saveAxioms
 *
 * Saves the specified set of axioms as an ontology
 *
 * Arguments:
 *  - axiom : <owlapi.OWLAxiom> [] or <OWLFrame>
 *  - file : fileName
 *  - owlFormat : e.g. an instance of RDFXMLOntologyFormat
 *
 */
OWL.prototype.saveAxioms = function(obj, file, owlFormat) {
    var tempIRI = IRI.create("http://x.org#temp-"+java.util.UUID.randomUUID());

    var tmpOnt = this.getManager().createOntology(tempIRI); // TODO
    var axioms = obj;
    if (obj instanceof OWLFrame) {
        axioms = obj.toAxioms();
    }
    // add to temp ontology
    for (var k in axioms) {
        this.getManager().addAxiom(tmpOnt, axioms[k]);
    }
    this.saveOntology(tmpOnt, file, owlFormat);
}

/* Function: saveOntology
 *
 * Saves the specified ontology
 *
 *
 * Arguments:
 *  - ontology: <owlapi.OWLOntology>
 *  - file : fileName  (if null, writes to stdout)
 *  - owlFormat : e.g. an instance of RDFXMLOntologyFormat
 */
OWL.prototype.saveOntology = function(ont, file, owlFormat) {

    var isStdout = false;
    if (file == null) {
        file = this.config.defaultFile;
    }
    if (file == null) {
        var Files = require("ringo/utils/files");
        file = Files.createTempFile("owl",".owl",".");
        isStdout = true;
    }

    if (owlFormat == null) {
        owlFormat = this.config.defaultFormat;
    }
    if (owlFormat == null) {
        owlFormat = new RDFXMLOntologyFormat();
    }
    this.getManager().saveOntology(ont, owlFormat, IRI.create(new File(file)));
    if (isStdout) {
        var fs = require('fs');
        var payload = fs.read(file);
        print(payload);
        fs.remove(file);
    }
}

/* Function: save
 *
 * saves current ontology
 *
 * Arguments:
 *  - file : fileName  (if null, writes to stdout)
 *  - owlFormat : [optional] e.g. an instance of RDFXMLOntologyFormat
 *
 */
OWL.prototype.save = function(file, owlFormat) {
    this.saveOntology(this.getOntology(), file, owlFormat);
}

OWL.prototype.setDefaultFormat = function(owlFormat) {
    if (!(owlFormat instanceof OWLOntologyFormat)) {
        console.log(owlFormat);
        if (owlFormat == 'ofn') {
            return this.useFunctionalSyntax();
        }
        else if (owlFormat == 'obo') {
            return this.useOBOSyntax();
        }
        else if (owlFormat == 'omn') {
            return this.useManchesterSyntax();
        }
        else {
            owlFormat = eval("new "+owlFormat+"()");
        }
    }
    this.config.defaultFormat = owlFormat;    
}
OWL.prototype.useFunctionalSyntax = function() {
    this.setDefaultFormat(new OWLFunctionalSyntaxOntologyFormat());
}
OWL.prototype.useManchesterSyntax = function() {
    this.setDefaultFormat(new ManchesterOWLSyntaxOntologyFormat());
}
OWL.prototype.useTurtleSyntax = function() {
    this.setDefaultFormat(new TurtleOntologyFormat());
}
OWL.prototype.useOBOSyntax = function() {
    this.setDefaultFormat(new OBOOntologyFormat());
}

// ----------------------------------------
// SERIALIZATION
// ----------------------------------------

// IN-PROGRESS
OWL.prototype.generateJSON = function(frame) {
    var json = 
        {
            id : frame.iri,
            test : "foo"
        };
    var slotMap = frame.slotMap;
    for (var k in slotMap) {
        this.log(k + " = " + slotMap[k]);
        json[k] = slotMap[k].toString();
    }
    return json;
}


// ----------------------------------------
// CHANGES
// ----------------------------------------

OWL.prototype.applyChange = function(change) {
    this.getManager().applyChange(change);
    this.changes.push(change);
    return change;
}

OWL.prototype.undo = function() {
    // TODO - need to figure out if there is an easy way to reverse a change with the OWLAPI
}


/* Function: add
 * Adds an axiom or axioms to ontology
 * Arguments:
 *  - ax : <owlapi.OWLAxiom> or <OWLFrame>
 */
OWL.prototype.add = function(ax) {
    if (ax instanceof OWLAxiom) {
        return this.addAxiom(ax);
    }
    else if (ax instanceof OWLFrame) {
        return this.addAxioms(ax.toAxioms());
    }
    else if (ax.concat != null) {
        return this.addAxioms(ax);
    }
    else {
        print("FAIL: "+ax);
    }
}

/* Function: addAxiom
 * Adds an axiom to ontology
 * Arguments:
 *  - ax : <owlapi.OWLAxiom>
 */
OWL.prototype.addAxiom = function(ax) {
    var change = new AddAxiom(this.getOntology(), ax);
    return this.applyChange(change);
}

/* Function: addAxioms
 * Adds axioms to ontology
 * Arguments:
 *  - axs : <owlapi.OWLAxiom>[]
 */
OWL.prototype.addAxioms = function(axs) {
    for (var k in axs) {
        this.addAxiom(axs[k]);
    }
    return axs;
}

/* Function: removeAxiom
 * Removes an axiom from ontology
 * Arguments:
 *  - ax : <owlapi.OWLAxiom>
 */
OWL.prototype.removeAxiom = function(ax) {
    var change = new RemoveAxiom(this.getOntology(), ax);
    this.applyChange(change);
    //g().getManager().removeAxiom(this.getOntology(),ax);    
}

/* Function: removeAxioms
 * Removes axioms from ontology
 * Arguments:
 *  - axs : <owlapi.OWLAxiom> []
 */
OWL.prototype.removeAxioms = function(axs) {
    for (var k in axs) {
        this.removeAxiom(axs[k]);
    }
}

/* Function: replaceAxiom
 * Replaces one axiom with another
 *
 * Arguments:
 *  - oldAxiom : <owlapi.OWLAxiom>
 *  - newAxioms : <owlapi.OWLAxiom> (or a list)
 */
OWL.prototype.replaceAxiom = function(oldAxiom, newAxioms) {
    this.removeAxiom(oldAxiom);
    this.addAxioms(newAxioms);
}

// ----------------------------------------
// UTIL
// ----------------------------------------

/* Function: getAnnotations
 *
 * fetches all annotations given an object (and optionally constrained by property)
 *
 * Arguments:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *  - prop: <owlapi.OWLAnnotationProperty> or <owlapi.IRI> or IRI-as-string (optional)
 *
 * returns: <owlapi.OWLAnnotation> []
 */
OWL.prototype.getAnnotations = function(obj,prop) {
    if (!(obj instanceof OWLNamedObject)) {
        // note: it doesn't matter what kind of OWLNamedObject we create here
        if (!(obj instanceof IRI)) {
            obj = IRI.create(obj);
        }
        if (obj instanceof IRI) {
            obj = this.getOWLDataFactory().getOWLClass(obj);
        }
    }

    var onts = this.getOntology().getImportsClosure().toArray();
    var anns = [];
    for (var k in onts) {
        var ont = onts[k];
        if (prop == null) {
            anns = anns.concat( this.a2l(obj.getAnnotations(ont).toArray()) );
        }
        else {
            prop = this.ensureAnnotationProperty(prop);
            anns = anns.concat( this.a2l(obj.getAnnotations(ont, prop).toArray()) );
        }
    }
    return anns;
}

/* Function: getLabel
 *
 * fetches a rdfs:label for a given object
 *
 * Assumptions:
 *  - each class has 0 or 1 labels. If >1 label present, returns first/arbitrary and prints a warning
 *
 * Arguments:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *
 * returns: string
 */
OWL.prototype.getLabel = function(obj) {
    var anns = this.getAnnotations(obj, org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI());
    var label = null;
    for (var k in anns) {
        if (label != null) {
            this.warn("WARNING: multi-labels "+obj); // TODO
        }
        label = anns[k].getValue().getLiteral();
    }
    return label;
}

OWL.prototype.getIRIOfObject = function(obj) {
    return obj.getIRI().toString();
}

OWL.prototype.getIRI = function(iriStr) {
    return IRI.create(iriStr);
}

/* Function: find
 *
 * Finds an object within an ontology based on specified label or IRI
 *
 * Example:
 * > cls = owl.find("epithelium")
 *
 * Arguments:
 *  - key: string containing IRI or label
 *
 * returns: <owlapi.OWLObject>
 */
OWL.prototype.find = function(key) {
    var objs = this.getAllObjects();
    for (var k in objs) {
        var obj = objs[k];
        if (this.keyMatches(key, obj)) {
            return obj;
        }
    }
}

/* Function: mfind
 *
 * Finds zero or more objects within an ontology based on specified label or IRI
 *
 * Example:
 * > cls = owl.find("epithelium")
 *
 * Arguments:
 *  - key: string containing IRI or label
 *
 * returns: <owlapi.OWLObject>
 */
OWL.prototype.mfind = function(key) {
    var objs = this.getAllObjects();
    var results = [];
    for (var k in objs) {
        var obj = objs[k];
        if (this.keyMatches(key, obj)) {
            results.push(obj);
        }
    }
    return results;
}

OWL.prototype.keyMatches = function(key, obj) {
    if (key.test != null) {
        var anns = this.getAnnotations(obj);
        for (var k in anns) {
            var a = anns[k];
            if (key.test(a.getValue())) {
                return true;
            }
        }
        return false;
    }

    if (obj.toString() == key) {
        return true;
    }
    var label = this.getLabel(obj);
    if (label != null && label.equals(key)) {
        return true;
    }
    return false;
}

OWL.prototype.a2l = function(a) {
    //return [_ for (_ in Iterator(a))]
    var l = [];
    for (var k=0; k<a.length; k++) {
        l.push(a[k]);
    }
    return l;
}

/* Function: getClasses
 * Returns: <owlapi.OWLClass> []
 */
OWL.prototype.getClasses = function() {
    return this.a2l(this.getOntology().getClassesInSignature(true).toArray());
}
/* Function: getIndividuals
 * Returns: <owlapi.OWLNamedIndividual> []
 */
OWL.prototype.getIndividuals = function() {
    return this.a2l(this.getOntology().getIndividualsInSignature(true).toArray());
}

/* Function: getObjectProperties
 * Returns: <owlapi.OWLObjectProperties> []
 */
OWL.prototype.getObjectProperties = function() {
    return this.a2l(this.getOntology().getObjectPropertiesInSignature(true).toArray());
}

/* Function: getAnnotationProperties
 * Returns: <owlapi.OWLAnnotationProperties> []
 */
OWL.prototype.getAnnotationProperties = function() {
    return this.a2l(this.getOntology().getAnnotationPropertiesInSignature().toArray());
}

OWL.prototype.getAllObjects = function(key) {
    var objs = [];
    var classes = this.getClasses();
    objs = objs.concat(classes);

    var rels = this.getObjectProperties();
    objs = objs.concat(rels);

    var aps = this.getAnnotationProperties();
    objs = objs.concat(aps);

    this.log("#o="+objs.length);
    
    return objs;
}

OWL.prototype.getAxioms = function(obj) {
    return this.a2l(this.getOntology().getAxioms(obj).toArray());
}

OWL.prototype.getAllAxioms = function(obj) {
    var axioms = new HashSet();
    axioms.addAll(this.getOntology().getAxioms(obj));

    if (obj.getIRI != null) {
        var aas = this.getOntology().getAnnotationAssertionAxioms(obj.getIRI());
        if (aas != null) {
            axioms.addAll(aas);
        }
    }
    return this.a2l(axioms.toArray());
}


/* Function: isDeprecated
 *
 * Determines if the specified object is deprecated
 *
 * Arguments:
 *  - obj : OWLObject
 *
 * returns: boolean
 */
OWL.prototype.isDeprecated = function(obj) {
    var anns = this.getAnnotations(obj, this.getOWLDataFactory().getOWLAnnotationProperty(org.semanticweb.owlapi.vocab.OWLRDFVocabulary.OWL_DEPRECATED.getIRI()));
    for (var k in anns) {
        if (anns[k].getValue && anns[k].getValue().getLiteral() == 'true') {
            return true;
        }
    }
    return false;
}

/* Function: getFrame
 *
 * creates a frame object for a specified OWL object
 *
 * Arguments:
 *  - obj: OWLObject
 *
 * returns: <OWLFrame>
 */
OWL.prototype.getFrame = function(obj) {
    var f = new OWLFrame(this, obj);
    return f;
}


OWL.prototype.getFrameMap = function() {
    var axioms = this.getOntology().getAxioms().toArray();
    var f = new OWLFrame(this);
    //print("Axioms:"+axioms.length);
    var fmap = f.axiomsToFrameMap(axioms);
    return fmap;
}

OWL.prototype.ensureClassExpression = function(obj) {
    // in future this may perform translation of json objects to OWL
    if (typeof obj == 'string' || obj instanceof String) {
        obj = IRI.create(obj);
    }
    if (obj instanceof IRI) {
        obj = this.getOWLDataFactory().getOWLClass(obj);
    }
    if (!(obj instanceof OWLClassExpression)) {
        print("WARNING: not CEX: "+obj);
    }
    return obj;
}

OWL.prototype.ensureAnnotationProperty = function(prop) {
    if (!(prop instanceof OWLAnnotationProperty)) {
        if (!(prop instanceof IRI)) {
            prop = IRI.create(prop);
        }
        if (prop instanceof IRI) {
            prop = this.getOWLDataFactory().getOWLAnnotationProperty(prop);
        }
    }
    return prop;
}

/* Function: someValuesFrom
 *
 * Creates an existential restriction using a factory
 *
 * Arguments:
 *  - p : <owlapi.OWLProperty>
 *  - filler : <owlapi.OWLExpression>
 *
 * returns: <owlapi.OWLObjectSomeValuesFrom> or <owlapi.OWLDataSomeValuesFrom>
 */
OWL.prototype.someValuesFrom = function(p, filler) {
    if (p instanceof OWLDataPropertyExpression) {
        return this.getOWLDataFactory().getOWLDataSomeValuesFrom(p, filler);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectSomeValuesFrom(p, filler);
    }
}

/* Function: intersectionOf
 *
 * Creates an intersection class expression using a factory
 *
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1 : <owlapi.OWLClassExpression>
 *  - x2 : <owlapi.OWLClassExpression>
 *  - ...
 *  - xn : <owlapi.OWLClassExpression>
 *
 * returns: OWLObjectIntersectionOf or OWLDataIntersectionOf type of <owlapi.OWLAxiom>
 */
OWL.prototype.intersectionOf = function() {
    var xset = new java.util.HashSet();
    var isData = false;
    for (var k=0; k<arguments.length; k++) {
        // todo - detect isData
        xset.add(arguments[k]);
    }
    if (isData) {
        return this.getOWLDataFactory().getOWLDataIntersectionOf(xset);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectIntersectionOf(xset);
    }
}

/* Function: unionOf
 *
 * Creates an union class expression using a factory
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1 : <owlapi.OWLClassExpression>
 *  - x2 : <owlapi.OWLClassExpression>
 *  - ...
 *  - xn : <owlapi.OWLClassExpression>
 *
 * returns: OWLObjectUnionOf or OWLDataUnionOf type of <owlapi.OWLAxiom>
 */
OWL.prototype.unionOf = function() {
    var xset = new java.util.HashSet();
    var isData = false;
    for (var k=0; k<arguments.length; k++) {
        // todo - detect isData
        xset.add(arguments[k]);
    }
    if (isData) {
        return this.getOWLDataFactory().getOWLDataUnionOf(xset);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectUnionOf(xset);
    }
}


OWL.prototype.makeAnnotationProperty = function(p) {
    if (typeof p == 'string') {
        p = IRI.create(p);
    }
    if (p instanceof IRI) {
        p = this.getOWLDataFactory().getOWLAnnotationProperty(p);
    }
    return p;
}

/* Function: ann
 *
 * Creates an OWLAnnotation object from a key-value pair
 *
 * TODO: 
 *  - allow non-String types, lang options, ...
 *
 * Arguments:
 *  - p : <owlapi.OWLAnnotationProperty> or IRI or string
 *  - v : value - can be string or <owlapi.OWLLiteral>
 *  - anns : Set or [] of <owlapi.OWLAnnotation>
 *
 * Returns: OWLAnnotation
 */
OWL.prototype.ann = function(p,v,anns) {
    p = this.makeAnnotationProperty(p);
    if (typeof v == 'string') {
        v = this.literal(v);
    }
    if (anns != null) {
        var janns = anns;
        if (anns.size != null) {
            janns = new HashSet();
            for (var k=0; k<anns.length; k++) {
                set.add(anns[k]);
            }
        }
        return this.getOWLDataFactory().getOWLAnnotation(p,v, janns);
    }
    return this.getOWLDataFactory().getOWLAnnotation(p,v);
};


// AXIOMS

OWL.prototype.class = function (iri) { 
    if (iri instanceof IRI) {
        return this.getOWLDataFactory().getOWLClass(iri);
    }
    else if (typeof iri == 'string') {
        return this.class(IRI.create(iri));
    }
    else {        
        return this.class(iri.getIRI());
    }
}

/* Function: subClassOf
 *
 * Creates a OWLSubClassOf axiom from a sub-super pair
 *
 * Arguments:
 *  - sub : <owlapi.OWLClassExpression>
 *  - sup : <owlapi.OWLClassExpression>
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.subClassOf = function (sub,sup) { return this.getOWLDataFactory().getOWLSubClassOfAxiom(sub,sup) }

/* Function: classAssertion
 *
 * Creates a OWLClassExpression axiom from a class-individual pair
 *
 * Arguments:
 *  - c : OWLClassExpression
 *  - i : OWLIndividual
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.classAssertion = function (c,i) { return this.getOWLDataFactory().getOWLClassAssertionAxiom(c,i) }

/* Function: equivalentClasses
 *
 * Creates a OWLEquivalentClasses axiom from a set of class expression operands
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1, x2, ... : OWLClassExpression
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.equivalentClasses = function() {
    var set = new HashSet();
    for (var k=0; k<arguments.length; k++) {
        set.add(this.ensureClassExpression(arguments[k]));
    }
    return this.getOWLDataFactory().getOWLEquivalentClassesAxiom(set);
}

/* Function: disjointClasses
 *
 * Creates a OWLDisjointClasses axiom from a set of class expressions
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1, x2, ... : OWLClassExpression
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.disjointClasses = function() {
    var set = new java.util.HashSet();
    for (var k=0; k<arguments.length; k++) {
        set.add(arguments[k]);
    }
    return this.getOWLDataFactory().getOWLDisjointClassesAxiom(set);
};

/* Function: disjointUntion
 *
 * Creates a OWLDisjointUnion  axiom from a class and a set of class expressions
 *
 * Class expression arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - c : OWLClass
 *  - x1, x2, ... : OWLClassExpression
 *
 * Returns: OWLAxiom
 */
OWL.prototype.disjointUnion = function(c) {
    var set = new java.util.HashSet();
    var owl = this;
    flattenArgs(arguments,1).forEach(
        function(x) { set.add(owl.ensureClassExpression(x)) }
    );
    return this.getOWLDataFactory().getOWLDisjointUnionAxiom(c, set);
}

function flattenArgs(args, i) {
    if (args[i].length != null) {
        return args[i];
    }
    return args.splice(i);
}

/* Function: annotationAssertion
 *
 * Creates a OWLAnnotationAssertion axiom from a <p,s,v> triple
 *
 * Arguments:
 *  - p : OWLAnnotationProperty
 *  - s : OWLObject or IRI or IRI-as-string
 *  - v : value - OWLObject or string
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.annotationAssertion = function(p,s,v) {
    if (typeof p == 'string') {
        p = IRI.create(p);
    }
    if (p instanceof IRI) {
        p = this.getOWLDataFactory().getOWLAnnotationProperty(p);
    }
    if (typeof v == 'string') {
        v = this.literal(v);
    }
    if (s.getIRI != null) {
        s = s.getIRI();
    }
    if (!(s instanceof IRI)) {
        s = IRI.create(s);
    }
    return this.getOWLDataFactory().getOWLAnnotationAssertionAxiom(p,s,v);
};

/* Function: labelAssertion
 *
 * Creates a OWLAnnotationAssertion axiom where the property is rdfs:label
 *
 * Arguments:
 *  - s : OWLObject or IRI or string
 *  - v : value
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.labelAssertion = function(s,v) {
    return this.annotationAssertion(this.getOWLDataFactory().getOWLAnnotationProperty(org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI()),
                                    s,v);
};

OWL.prototype.literal = function(v) {
    return this.getOWLDataFactory().getOWLLiteral(v);
};



/* Function: genIRI
 *
 * generators next available IRI within the default ID space
 *
 * Warning: Assumes OBO PURLs
 *
 * Config keys used:
 *  - idspace : e.g. "CL"
 *  - lastId : the lower bound of the ID range (this will be incremented automatically)
 *
 * TODO: improve robustness
 * current implementation starts at lastId, and increments until a "free" slot is available.
 * a free slot is an IRI with no annotation assertions and no logical axioms.
 * For OBO style ontologies there is currently a danger of overwriting merged classes, until
 * IRIs are generated for these.
 *
 * Returns: IRI string
 */
OWL.prototype.genIRI = function() {
    if (this.config.lastId == null) {
        console.warn("config.lastId not set");
        this.config.lastId = 0;
    }
    this.config.lastId++;
    this.log("generating a new IRI. lastId="+this.config.lastId);
    var localId = java.lang.String.format("%07d", new java.lang.Integer(this.config.lastId));
    var iriStr = "http://purl.obolibrary.org/obo/"+this.config.idspace+"_"+localId;
    var iri = IRI.create(iriStr);
    var isUsed = false;
    var id = this.config.idspace+":"+localId;
    
    if (this.getOntology().getAnnotationAssertionAxioms(iri).size() > 0) {
        isUsed = true;
    }
    else {
        var c = this.getOWLDataFactory().getOWLClass(iri);
        if (this.getOntology().getAxioms(c).size() > 0) {
            isUsed = true;
        }
    }
    if (!isUsed) {
        var aaas = this.getOntology().getAxioms(AxiomType.ANNOTATION_ASSERTION).toArray();
        print("Checking AAAs "+aaas.length+" for "+id);
        for (var k in aaas) {
            var ax = aaas[k];
            v = ax.getValue();
            if (v.getLiteral != null && v.getLiteral().toString() == iriStr) {
                print("used in assertion: "+ax);
                isUsed = true;
                break;
            }
            if (v.getLiteral != null && v.getLiteral().toString() == id) {
                print("used in assertion: "+ax);
                isUsed = true;
                break;
            }
        }
    }

    if (isUsed) {
        print(" USED: "+iri);
        return this.genIRI();
    }
    else {
        return iri;
    }
}


OWL.prototype.concatLiteral = function() {
    var aa = Array.prototype.slice.call(arguments, 0);
    var thisRef = this;
    var toks = 
        aa.map(
        function(t){
            if (typeof t == 'string') {
                return t;
            }
            else {
                return thisRef.getLabel(t); 
            }
        }).join(" ");
    return toks;
};


/*
 * Function: generateXP
 *
 * Generates a class frame using a basic genus-differentia pattern
 * 
 * (May be moved to a different package in future)
 * 
 * Parameters:
 *  - genus - the base parent class
 *  - relation - the OWLObjectProperty of the differentiating characteristic
 *  - filler - the OWLClassExpression of the differentiating characteristic
 *  - defaultMap - set of default values (e.g. created_by)
 * 
 * Text definitions:
 *  IAO is assumed. The definition will be of a generic form. You can override
 *  with defaultMap.definition
 * 
 * Returns: <OWLFrame>
 */
OWL.prototype.generateXP = function(genus, relation, diff, defaultMap) {
    if (defaultMap == null) {
        defaultMap = {};
    }

    var iri = this.genIRI();
    this.log("IRI="+iri);
    var id = iri.toString();
    var label = this.concatLiteral(genus,'of',diff);
    if (defaultMap.label != null) {
        label = defaultMap.label;
    }
    var ex = this.intersectionOf(genus, this.someValuesFrom(relation,diff));
    if (defaultMap.definition == null) {
        defaultMap.definition = this.concatLiteral('a',genus,'that is',relation,'a',diff);
    }

    this.log("EX = "+ex);
    var slotMap = {
        id: id,
        label: label,
        //annotations: {property:has_related_synonym, value: this.concatLiteral(diff,genus)},
        // TODO annotations: m.ann(has_exact_synonym, this.concatLiteral(diff,genus)),
        definition: defaultMap.definition,
        equivalentTo: ex
    };
    this.log("SM = "+slotMap);
    var f = new OWLFrame(this, slotMap);
    f.stamp();
    this.generatedFrames.push(f);
    return f;
}

//OWL.prototype.makeFrames = function() {
//    var gen = this;
//    var aa = Array.prototype.slice.call(arguments, 0);
//    return aa.map(function(args) {return gen.makeFrame.apply(gen,args)});
//}

// TODO - allow level-setting
OWL.prototype.log = function(msg) {
    console.log(msg);
}
OWL.prototype.warn = function(msg) {
    console.warn(msg);
}






/* Namespace: owlapi
 *
 * This makes use of the OWLAPI. For full documentation, consult the
 * owlapi documentation.
 *
 * Minimal documentation on select classes are provided here
 *
 * About: OWLReasoner
 *  used to compute inferences
 *
 * About: OWLReasonerFactory
 *  generates an <OWLReasoner>
 *
 * About: OWLClass
 *  Basic unit of an ontology
 *
 * About: OWLAxiom
 *  an OWL axiom
 *
 * About: OWLOntology
 *  a collection of <OWLAxiom>s
 *
 * About: IRI
 *
 * About: OWLDataFactory
 *
 * About: OWLManager
 *
 * About: OWLPropery
*/
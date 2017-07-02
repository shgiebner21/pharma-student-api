const PouchDB = require('pouchdb-http')
PouchDB.plugin(require('pouchdb-mapreduce'))
// const couch_base_uri = 'http://127.0.0.1:5984/'
// const couch_dbname = 'cpc'
// const db = new PouchDB(couch_base_uri + couch_dbname)

const Cloudant = require('cloudant')
const username = process.env.cloudant_username || 'nodejs'
const password = process.env.cloudant_password
const myURL = 'https://giebnar:@Coder~21@giebnar.cloudant.com'
const cloudant = Cloudant({url: myURL})
const dbname = 'cpc'
const db = cloudant.db.use(dbname)

const {map} = require('ramda')



/////////////////////////////////////////////
//   family
/////////////////////////////////////////////
function postFamily(family, cb) {
  console.log('inside dal.js postFamily()')
  family.type = 'family'
  let newId = 'family_' + family.parentLast.toLowerCase()
  + '_' + family.eMail.toLowerCase() + '_' + family.cellPhone
  family._id = newId

  db.insert(family, function(err, resp) {
    if (err) return cb(err)
    cb(null, resp)
  })
}

function getFamilies(cb) {
  db.view('families', 'families', {q: 'type: family', include_docs: true}, function(err, families) {
    if (err) return cb(err)
    cb(null, map(returnDoc, families.rows))
  })
}


function getFamily(id, cb) {
  db.get(id, function(err, family) {
    if (err) return cb(err)
    cb(null, family)
  })
}

/////////////////////////////////////////////
//   children
/////////////////////////////////////////////
function postChildren(child, cb) {
  child.type = 'children'
  let newId = 'children_' + child.childName.toLowerCase()
  + '_' + child.familyId.toLowerCase()
  child._id = newId

  db.insert(child, function(err, resp) {
    if (err) return cb(err)
    cb(null, resp)
  })
}

function listChildren(cb) {
  db.view('children', 'children', {q: 'type: children', include_docs: true}, function(err, children) {
    if (err) return cb(err)
    cb(null, map(returnDoc, children.rows))
  })
}


function getChild(id, cb) {
  db.get(id, function(err, child) {
    if (err) return cb(err)
    cb(null, child)
  })
}

function updateChild(child, cb) {
  db.insert(child, function(err, resp) {
    if (err) return cb(err)
    cb(null, resp)
  })
}


function getActivity(id, cb) {
  db.get(id, function(err, activity) {
    if (err) return cb(err)
    cb(null, activity)
  })
}


/////////////////////////////////////////////
//   badges
/////////////////////////////////////////////
function listBadges(cb) {
  db.view('badges', 'badges', {q: 'type: badge', include_docs: true}, function(err, list) {
    if (err) return cb(err)
    cb(null, map(returnDoc, list.rows))
  })
}

/////////////////////////////////////////////
//   park
/////////////////////////////////////////////
function getParks(cb) {
  db.view('parks', 'parks', {q: 'type: park', include_docs: true},  function(err, parks) {
      if (err) return cb(err)
      cb(null, map(returnDoc, parks.rows))
    })
}

function getPark(id, cb) {
  db.get(id, function(err, park) {
    if (err) return cb(err)
    cb(null, park)
  })
}


/////////////////////////////////////////////
// helper functions
/////////////////////////////////////////////

const returnDoc = row => row.doc


const dal = {
  postFamily: postFamily,
  getFamilies: getFamilies,
  getFamily: getFamily,
  postChildren: postChildren,
  updateChild: updateChild,
  listChildren: listChildren,
  getChild: getChild,
  listBadges: listBadges,
  getParks: getParks,
  getPark: getPark,
  getActivity: getActivity
}

module.exports = dal

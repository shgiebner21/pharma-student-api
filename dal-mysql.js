const mysql = require('mysql');

const {map, filter, uniq, prop, omit, compose, drop, path, pathOr,
       view, lensIndex, set, lensPath, toString, lensProp, assoc}
    = require('ramda')


///////////////////////////////////////////////
//             medications
///////////////////////////////////////////////
function getMed(medId, cb) {
  if (!medId) return cb(notFound)

  const connection = createConnection()

  connection.query('SELECT * FROM medWithIngredients WHERE ID = ?', [medId], function (err, data) {
    if (err) return cb(errorMessage)
    if (data.length === 0) return cb(noDataFound)

    cb(null, formatSingleMed(data))
  })
}

function listMedsByLabel(startKey, limit, cb) {
  const connection = createConnection()
  limit = limit ? limit : 3
  const whereClause = startKey ? " WHERE concat(m.label, m.ID) > '" + startKey + "'" : ""

  let sql = 'SELECT m.*, concat(m.label, m.ID) as startKey '
  sql += ' FROM medWithIngredients m '
  sql += ' INNER JOIN (SELECT DISTINCT ID '
  sql += ' FROM medWithIngredients m '
  sql += whereClause
  sql += ' LIMIT ' + limit + ') b '
  sql += ' ON m.ID = b.ID '
  sql += whereClause
  sql += ' ORDER BY startKey '

  console.log('sql: ', sql)

  connection.query(sql, function(err, data) {
    if (err) return cb(errorMessage)
    if (data.length === 0) return cb(noDataFound)

    cb(null, formatMultipleMeds(data))
  })
}


///////////////////////////////////////////////
//             patients
///////////////////////////////////////////////
function getPatient(patientId, cb) {
  if (!patientId) return cb(notFound)
  const connection = createConnection()

  connection.query('SELECT * FROM patientWithConditions WHERE ID = ?', [patientId], function (err, data) {
    if (err) return cb(errorMessage)
    if (data.length === 0) return cb(noDataFound)

    cb(null, formatSinglePatient(data))
  })
}

function getPatients(startKey, limit, cb) {
  const connection = createConnection()

  limit = limit ? limit : 3

  const whereClause = startKey ? " WHERE concat(p.lastName, p.ID) > '" + startKey + "'" : ""

  let sql = 'SELECT p.*, concat(p.lastName, p.ID) as startKey '
  sql += ' FROM patientWithConditions p '
  sql += ' INNER JOIN (SELECT DISTINCT ID '
  sql += ' FROM patientWithConditions p '
  sql += whereClause
  sql += ' LIMIT ' + limit + ') b '
  sql += ' ON p.ID = b.ID '
  sql += whereClause
  sql += ' ORDER BY startKey '

  connection.query(sql, function(err, data) {
    if (err) return cb(errorMessage)

    if (data.length === 0) return cb(noDataFound)

      cb(null, formatMultiplePatients(data))
  })
}


///////////////////////////////////////////////
//             pharmacies
///////////////////////////////////////////////
function getPharmacy(pharmacyId, cb) {
  if (!pharmacyId) return cb(notFound)

  const connection = createConnection()

  connection.query('SELECT * FROM pharmacy WHERE ID = ?', [pharmacyId], function (err, data) {
    if (err) return cb(errorMessage)
    if (data.length === 0) return cb(noDataFound)

    cb(null, compose(
      omit('ID'),
      set(lensProp('_id'), toString(prop('ID', data[0]))),
      set(lensProp('_rev'), ''),
      set(lensProp('type'), 'pharmacy')
    )(data[0]))
  })
}


function listPharmacies(startKey, limit, cb) {
  const connection = createConnection()

  connection.query('SELECT * FROM pharmacy', function(err, data) {
    if (err) return cb(errorMessage)
    if (data.length === 0) return cb(noDataFound)

    const prelimPharmacy = compose(
//      map(omit('ID')),
      map(set(lensProp('_id'), '')),
      map(set(lensProp('_rev'), '')),
      map(set(lensProp('type'), 'pharmacy'))
    )(data)

    const convertedPharmacy =
console.log(data)
    cb(null, prelimPharmacy)
  })
}



///////////////////////////////////////////////
//          helper functions
///////////////////////////////////////////////

function createConnection() {
    return mysql.createConnection({
        host: "0.0.0.0",
        user: "root",
        password: "eprofile",
        database: "pharmaStudent"
    });
}


function getDocByID(tablename, id, formatter, callback) {
    //  console.log("getDocByID", tablename, id)
    if (!id) return callback(notFound)

    const connection = createConnection()

    connection.query('SELECT * FROM ' + connection.escapeId(tablename) + ' WHERE id = ?', [id], function(err, data) {
        if (err) return callback(errorMessage)

        if (data.length === 0) return callback(noDataFound)

        if (data) {
            //console.log("query returned with data", formatter, formatter(data[0]))
            // grab the item sub [0] from the data.
            // take the data and run it through the formatter (convertPersonNoSQLFormat)
            // then take result of converting the person and parseToJSON
            return callback(null, formatter(data))
        }
    });
    connection.end(function(err) {
        if (err) return err
    })
}

function formatSingleMed(data) {
  const mappedIngredients = compose(
    map(med => med.ingredient),
    filter(med => med.ingredient)
  )(data)

  return compose(
    omit(['ID', 'ingredient']),
    set(lensProp('ingredients'), mappedIngredients),
    set(lensProp('_id'), toString(prop('ID', data[0]))),
    set(lensProp('_rev'), ''),
    set(lensProp('type'), 'medication')
  )(data[0])
}

function formatMultipleMeds(meds) {
  const IDs = compose(
    uniq,
    map(med=>med.ID)
  )(meds)

return map(id=>compose(
                 formatSingleMed,
                 filter(med=>med.ID === id)
                )(meds)
       )(IDs)
}

function formatSinglePatient(data) {
  const mappedConditions = compose(
    map(patient => patient.condition),
    filter(patient => patient.condition)
  )(data)

  return compose(
    omit('ID'),
    set(lensProp('conditions'), mappedConditions),
    set(lensProp('_id'), toString(prop('ID', data[0]))),
    set(lensProp('_rev'), ''),
    set(lensProp('type'), 'patient')
  )(data[0])
}

function formatMultiplePatients(patients) {

    const IDs = compose(
      uniq(),
      map(patient => patient.ID)
    )(patients)

   return map(id => compose(
      formatSinglePatient,
      filter(patient => patient.ID === id)
    )(patients))(IDs)
}

function notFound() {
  return {
      error: 'missing_id',
      reason: 'missing_id',
      name: 'missing_id',
      status: 400,
      message: 'unable to retrieve data due to missing id.'
  }
}

function errorMessage() {
  return {
      error: 'unknown',
      reason: 'unknown',
      name: 'unknown',
      status: 500,
      message: err.message
  }
}

function noDataFound() {
  return {
      error: 'not_found',
      reason: 'missing',
      name: 'not_found',
      status: 404,
      message: 'missing'
  }
}



// function formatMed() {
//     return compose(
//         addMedType,
//         convertNoSQLFormat
//     )
// }

function formatMed(meds) {
  // db view returns repeated meds when multiple ingredients.
  // First, return a single med by grabbing the first med in the array.
  //  Then, format the med to make it look like a couchdb doc.

    return compose(
        addMedType,
        convertNoSQLFormat
    )(view(lensIndex(0), meds))


    //console.log("Meds from mysql",)










    //
    // const formattedMed = compose(
    //     addMedType,
    //     convertNoSQLFormat
    // )(view(lensIndex(0), meds))
    //
    // // create an array of ingredients from the db view rows
    // const ingredients = compose(
    //     filter(med => med !== null),
    //     map(med => path(['ingredient'], med))
    // )(meds)
    //
    // // set a new ingredient property with the array of ingredients
    // //  before returning the formatted med.
    // return set(lensPath(['ingredient']), ingredients, formattedMed );
}

const addMedType = med => set(lensPath(['type']), 'medication', med)

const convertNoSQLFormat = row => compose(
      omit(['ID']),
      set(lensPath(['_id']), path(['ID'], row))
    )(row)



    const dal = {
    //  addPharmacy: addPharmacy,
    //  updatePharmacy: updatePharmacy,
      getPharmacy: getPharmacy,
      listPharmacies: listPharmacies,
    //  deletePharmacy: deletePharmacy,
    //  listPharmaciesByChainName: listPharmaciesByChainName,
    //  listPharmaciesByStoreName: listPharmaciesByStoreName,
    //  getUniqueForms: getUniqueForms,
    //  getUniqueConditions: getUniqueConditions,
      listMedsByLabel: listMedsByLabel,
    //  getUniqueIngredients: getUniqueIngredients,
    //  listMedsByIngredient: listMedsByIngredient,
    //  listMedsByForm: listMedsByForm,
      getMed: getMed,
    //  addMed: addMed,
    //  updateMed: updateMed,
    //  deleteMed: deleteMed,
    //  addPatient: addPatient,
      getPatients: getPatients,
    //  listPatientsByLastName: listPatientsByLastName,
    //  listPatientsByCondition: listPatientsByCondition,
    //  updatePatient: updatePatient,
    //  deletePatient: deletePatient,
      getPatient: getPatient
    }

    module.exports = dal

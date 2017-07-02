const express = require('express')
const app = express()
const port = process.env.PORT || 8082
const bodyParser = require('body-parser')
const HTTPError = require('node-http-error')
const cors = require('cors')

const {postFamily, postChildren, listChildren,
       getChild, listBadges, getFamilies, getFamily, getParks,
       getPark, getActivity, updateChild} = require('./dal.js')

app.use(cors({
    credentials: true
}))
app.use(bodyParser.json())


console.log('parker-and-parks-api has received a call.')

/////////////////////////////////////////////
//   family
/////////////////////////////////////////////

app.post('/family', function(req, resp, next) {
  console.log('app.post req.body structure is ', req.body)
  postFamily(req.body, function(err, dalResp) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(201).send(dalResp)
  })
})

app.get('/family', function(req, resp, next) {
  const startKey = req.query.startkey ? req.query.startkey : undefined
  const limit = req.query.limit ? req.query.limit : undefined

  getFamilies(function(err, dalResp) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(dalResp)
  })
})


app.get('/family/:id', function(req, resp, next) {
  getFamily(req.params.id, function(err, family) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(family)
  })
})



/////////////////////////////////////////////
//   children
/////////////////////////////////////////////
app.post('/children', function(req, resp, next) {
  postChildren(req.body, function(err, dalResp) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(201).send(dalResp)
  })
})

app.get('/children', function(req, resp, next) {
  const startKey = req.query.startkey ? req.query.startkey : undefined
  const limit = req.query.limit ? req.query.limit : undefined

  listChildren(function(err, children) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    return resp.status(200).send(children)
  })
})


app.get('/children/:id', function(req, resp, next) {
  getChild(req.params.id, function(err, child) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(child)
  })
})

app.get('/parks/:id/activitydetail/:id', function(req, resp, next) {
  getActivity(req.params.id, function(err, activity) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(activity)
  })
})

app.put('/children/:id', function(req, resp, next) {
  updateChild(req.body, function(err, child) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(child)
  })
})




/////////////////////////////////////////////
//   badges
/////////////////////////////////////////////
app.get('/badges', function(req, resp, next) {

  listBadges(function(err, badges) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(badges)
  })
})

/////////////////////////////////////////////
//   park
/////////////////////////////////////////////

app.get('/parks', function(req, resp, next) {

  getParks(function(err, parks) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(parks)
  })
})

app.get('/parks/:id', function(req, resp, next) {
  getPark(req.params.id, function(err, park) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    resp.status(200).send(park)
  })
})()



/////////////////////////////////////////////
//   helper functions
/////////////////////////////////////////////
app.use(function(err, req, resp,next) {
  console.log(req.method, " ", req.path, "error: ", err)
  resp.status(err.status || 500)
  resp.send(err)
})

app.listen(port, function() {
  console.log('Parker API is up and running on port ', port)
})

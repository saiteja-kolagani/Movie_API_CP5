const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.log(`DB Eroor: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDBObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get('/movies/', async (request, response) => {
  try {
    const getMoviesNameQuery = `
        SELECT 
        movie_name
        FROM 
        movie
    `
    const dbResponse = await db.all(getMoviesNameQuery)
    response.send(
      dbResponse.map(eachMovie => ({movieName: eachMovie.movie_name})),
    )
  } catch (e) {
    console.log(e.mesaage)
    response.status(500).send('Internal Server Error')
  }
})

app.post('/movies/', async (request, response) => {
  try {
    const bodyDetails = request.body
    const {directorId, movieName, leadActor} = bodyDetails
    const movieCreateQuery = `
    INSERT INTO 
      movie(director_id, movie_name, lead_actor)
    VALUES(?, ?, ?)
  `
    const dbResponse = await db.run(movieCreateQuery, [
      directorId,
      movieName,
      leadActor,
    ])
    response.send('Movie Successfully Added')
  } catch (e) {
    console.log(e.mesaage)
    response.status(500).send('Internal Server Error')
  }
})

app.get('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  try {
    const getMovieDetailsQuery = `
    SELECT 
    *
    FROM 
    movie 
    WHERE
    movie_id = ?
  `
    const dbResponseForMovie = await db.get(getMovieDetailsQuery, [movieId])
    if (dbResponseForMovie) {
      response.send(
        dbResponseForMovie.map(each => convertDBObjectToResponseObject(each)),
      )
    } else {
      response.status(404).send('Movie not found')
    }
  } catch (e) {
    console.log(e.mesaage)
    response.status(500).send('Internal Server Error')
  }
})

app.put('/movies/:movieId/', async (request, response) => {
  const bodyDetails = request.body
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = bodyDetails
  try {
    const movieUpdateQuery = `
    UPDATE 
      movie 
    SET 
    director_id = ?,
    movie_name = ?,
    lead_actor = ?
    WHERE 
    movie_id = ?
  `
    const dbResponse = await db.run(movieUpdateQuery, [
      directorId,
      movieName,
      leadActor,
      movieId,
    ])
    response.send('Movie Details Updated')
  } catch (e) {
    console.log(e.mesaage)
    response.status(500).send('Internal Server Error')
  }
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  try {
    const movieDeleteQuery = `
      DELETE FROM
        movie
      WHERE 
        movie_id = ?
    `
    const dbResponse = await db.run(movieDeleteQuery, [movieId])
    response.send('Movie Removed')
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

const convertDBObjOfDirectorToResponseObj = eachDirector => {
  return {
    directorId: eachDirector.director_id,
    directorName: eachDirector.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  try {
    const getDirectorsQuery = `
      SELECT 
        *
      FROM 
        director
    `
    const dbResponse = await db.all(getDirectorsQuery)
    response.send(
      dbResponse.map(eachDirector =>
        convertDBObjOfDirectorToResponseObj(eachDirector),
      ),
    )
  } catch (e) {
    console.log(e.mesaage)
    response.status(500).send('Internal Server Error')
  }
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  try {
    const getDirectorMoviesQuery = `
      SELECT 
        movie_name
      FROM 
        movie
      WHERE 
        director_id = ?
    `
    const movies = await db.all(getDirectorMoviesQuery, [directorId])
    const movieNames = movies.map(movie => ({movieName: movie.movie_name}))
    response.send(movieNames)
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

module.exports = app

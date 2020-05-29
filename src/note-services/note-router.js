const express = require('express')
const NoteService = require('./note-service')
const path = require('path')

const noteRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
    id: note.id,
    note_name: note.note_name,
    date_modified: note.date_modified,
    folder_id: note.folder_id,
    content: note.content,
})

noteRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NoteService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { note_name, date_modified, folder_id, content } = req.body
        const newNote = { note_name, date_modified, folder_id, content }

        for (const [key, value] of Object.entries(newNote))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
        
        NoteService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)
    })

noteRouter
    .route('/:note_id')
    .all((req, res, next) => {
        NoteService.getById(
            req.app.get('db'),
            req.params.note_id
        )
            .then(note => {
                if (!note) {
                    return res.status(404).json({
                        error: { message: `Note doesn't exist` }
                    })
                }
                res.note = note //save the note for the next middleware 
                next() //don't forget to call next so the next middleware happens!
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.note.id,
            note_name: res.note.note_name,
            date_modified: res.note.date_modified,
            folder_id: res.note.folder_id,
            content: res.note.content,
        })
    })
    .delete((req, res, next) => {
        NoteService.deleteNote(
            req.app.get('db'),
            req.params.note_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const { note_name, date_modified, folder_id, content } = req.body
        const noteToUpdate = { note_name, date_modified, folder_id, content }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'note_name', 'date_modified', 'folder_id', or 'content'`
                }
            })
        }

        NoteService.updateNote(
            req.app.get('db'),
            req.params.note_id,
            noteToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = noteRouter
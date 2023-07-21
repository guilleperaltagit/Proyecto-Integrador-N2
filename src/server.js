const express = require("express")

const server = express()

require("dotenv").config()

const { getCollection, disconnect, nextCod } = require("../connection_db")

// Middleware: Establece el manejo de datos en formato JSON (propio de express)
server.use(express.json())
// Middleware: Codifica la url + params/query
server.use(express.urlencoded({extended: true}))

// -----------------------------------------------------------------------------------------------------------------

// Obtener un coche específico por ID con url params
server.get("/api/v1/muebles/:codigo", async (req, res) => {
    const {codigo} = req.params

    try {
        const collection = await getCollection("muebles")
        const mueble = await collection.findOne({codigo: Number(codigo)})
        if (!mueble) {
            res.status(400).send(JSON.stringify({message: "El código no corresponde a un mueble registrado"}))
        } else {
            res.status(200).send(JSON.stringify({payload: mueble}))
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send(JSON.stringify({message: "Se ha generado un error en el servidor"}))
    } finally {
        await disconnect()
    }
})
// -----------------------------------------------------------------------------------------------------------------

// Listado de todos los muebles, y búsqueda específica por Categoría, Precio mayor o igual, Precio menor o igual
server.get("/api/v1/muebles", async (req, res) => {
    const {categoria, precio_gte, precio_lte} = req.query
    let muebles = []

    try {
        const collection = await getCollection("muebles")
        if (categoria) muebles = await collection.find({categoria}).sort({nombre: 1}).toArray()
        else if (precio_gte) muebles = await collection.find({precio: {$gte: Number(precio_gte)}}).sort({precio: 1}).toArray()
        else if (precio_lte) muebles = await collection.find({precio: {$lte: Number(precio_lte)}}).sort({precio: -1}).toArray()
        else muebles = await collection.find().toArray()
        res.status(200).send(JSON.stringify({payload: muebles}))
    } catch (error) {
        console.log(error.message)
        res.status(500).send(JSON.stringify({message: "Se ha generado un error en el servidor"}))
    } finally {
        await disconnect()
    }
})

// -----------------------------------------------------------------------------------------------------------------

// Crear un nuevo mueble. Se deben mandar los datos por query: nombre, precio y categoria
server.post("/api/v1/muebles", async (req, res) => {
    const { nombre, precio, categoria } = req.body
    if (!nombre || !precio || !categoria) return res.status(400).send(JSON.stringify({message: "Faltan datos relevantes"}))

    try {
        const collection = await getCollection("muebles")
        const codigo = await nextCod(collection)
        const mueble = { codigo, nombre, precio, categoria }
        await collection.insertOne(mueble)
        res.status(201).send(JSON.stringify({message: 'Registro creado', payload: mueble}))
    } catch (error) {
        console.log(error.message)
        res.status(500).send(JSON.stringify({message: "Se ha generado un error en el servidor"}))
    } finally {
        disconnect()
    }
})

// -----------------------------------------------------------------------------------------------------------------

// Actualizar un mueble. Se deben mandar los datos por query: nombre, precio y categoria
server.put("/api/v1/muebles/:codigo", async (req, res) => {
    const {codigo} = req.params
    const { nombre, precio, categoria } = req.body
    if (!codigo || !nombre || !precio || !categoria) return res.status(400).send(JSON.stringify({message: "Faltan datos relevantes"}))

    try {
        const collection = await getCollection("muebles")
        let mueble = await collection.findOne({codigo: Number(codigo)})
        if (!mueble) {
            res.status(400).send(JSON.stringify({message: "El código no corresponde a un mueble registrado"}))
        } else {
            mueble = { codigo: Number(codigo), nombre, precio, categoria }
            await collection.updateOne({codigo: Number(codigo)}, {$set: mueble})
            res.status(200).send(JSON.stringify({message: 'Registro actualizado', payload: mueble}))
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send(JSON.stringify({message: "Se ha generado un error en el servidor"}))
    } finally {
        disconnect()
    }
})

// -----------------------------------------------------------------------------------------------------------------
// Borrar un coche específico por ID con url params
server.delete("/api/v1/muebles/:codigo", async (req, res) => {
    const {codigo} = req.params
    try {
        const collection = await getCollection("muebles")
        const mueble = await collection.findOne({codigo: Number(codigo)})
        if (!mueble) {
            res.status(400).send(JSON.stringify({message: "El código no corresponde a un mueble registrado"}))
        } else {
            await collection.deleteOne({codigo: Number(codigo)})
            res.status(200).send(JSON.stringify({message: "Registro eliminado"}))
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send(JSON.stringify({message: "Se ha generado un error en el servidor"}))
    } finally {
        await disconnect()
    }
})

// ----------------------------------------------------------------------------------------------------------------
// Manejo de rutas inexistentes (No estaba solicitidado, pero me pareció correcto agregarlo)
server.use("*", (req, res) => {
    res.status(404).send(JSON.stringify({payload: "La URL solicitada no existe"}))
})

// -----------------------------------------------------------------------------------------------------------------
// Escucha de peticiones
server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, console.log(`Server escuchando en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`))
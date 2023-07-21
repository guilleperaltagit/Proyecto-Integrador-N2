const {MongoClient} = require("mongodb")

require("dotenv").config()

const client = new MongoClient(process.env.DATABASE_URL)

async function connect() {
    console.log("Connecting ...")
    let connection = null
    try {
        connection = await client.connect()
        console.log("\tConnected !!");
    } catch (error) {
        console.log("\tError: " + error.message);
    }
    return connection
}

async function disconnect() {
    try {
        await client.close()
        console.log("\tDisconnected !!");
    } catch (error) {
        console.log("\tError: " + error.message);
    }
}

async function getCollection(collectionName) {
    const connectionToDB = await connect()
    const db = connectionToDB.db(process.env.DATABASE_NAME)
    const collection = db.collection(collectionName)
    return collection
}

//Obtener el mayor Código de la collection muebles y sumarle 1
async function nextCod() {
    const collection = await getCollection("muebles")
    const collectionArray = await collection.find().toArray()
    let maxCod = 0
    collectionArray.forEach(item => {
        if (item.codigo > maxCod) maxCod = item.codigo
    })
    return maxCod + 1
}

module.exports = { getCollection, disconnect, nextCod }


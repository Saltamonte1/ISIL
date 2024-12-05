const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://sebastianrochaleiva:Isil123@bibliosmartcluster.io4rd.mongodb.net/bibliosmart?retryWrites=true&w=majority';

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Conexión exitosa a MongoDB Atlas');
  } catch (err) {
    console.error('Error conectando a MongoDB Atlas:', err.message);
  } finally {
    await client.close();
  }
}

run();


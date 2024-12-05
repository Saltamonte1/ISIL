const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://sebastianrochaleiva:Isil123@bibliosmartcluster.io4rd.mongodb.net/?retryWrites=true&w=majority&appName=BiblioSmartCluster');
    console.log('MongoDB connected');
  } catch (error) {
    console.error(error);
    process.exit(1); // Finaliza el proceso en caso de error
  }
};

module.exports = connectDB;
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const rfqs = await mongoose.connection.collection('rfqs').aggregate([
    { $match: { assignedVendors: new mongoose.Types.ObjectId('6a2443730ca5f6acbc9b3ef1'), status: 'Open' } }
  ]).toArray();
  console.log('Matched RFQs:', rfqs.length);
  process.exit(0);
});

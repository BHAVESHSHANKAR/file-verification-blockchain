/**
 * Script to fix Student model indexes
 * Run this once to drop the old global unique index on registrationNumber
 * and create the new compound unique index (registrationNumber + university)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eduverify';

async function fixIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('students');

        // Get existing indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        // Drop the old global unique index on registrationNumber if it exists
        try {
            console.log('\n🗑️  Attempting to drop old registrationNumber index...');
            await collection.dropIndex('registrationNumber_1');
            console.log('✅ Dropped old registrationNumber_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index registrationNumber_1 does not exist (already dropped or never created)');
            } else {
                console.log('⚠️  Error dropping index:', error.message);
            }
        }

        // Create the new compound unique index
        console.log('\n🔨 Creating new compound unique index...');
        await collection.createIndex(
            { registrationNumber: 1, university: 1 },
            { unique: true, name: 'registrationNumber_1_university_1' }
        );
        console.log('✅ Created compound unique index: registrationNumber + university');

        // Show final indexes
        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✅ Index migration completed successfully!');
        console.log('ℹ️  Registration numbers are now unique per university, not globally.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

fixIndexes();

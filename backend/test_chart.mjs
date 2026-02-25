import mongoose from 'mongoose';

const URI = 'mongodb://mongo:ywTpcBRnVIuDMUsmXbPlMQlPitqutIdL@shinkansen.proxy.rlwy.net:22494/test?authSource=admin';

mongoose.connect(URI)
    .then(async () => {
        const db = mongoose.connection.db;
        console.log("Connected to Railway Proxy DB");

        try {
            const groups = await db.collection('accountgroups').find({}).toArray();
            const ledgers = await db.collection('accountledgers').find({}).toArray();

            console.log(`Found ${groups.length} groups and ${ledgers.length} ledgers.`);

            // Build tree algorithm exactly as in the controller
            const groupMap = {};
            groups.forEach(g => {
                g.children = [];
                g.ledgers = [];
                groupMap[g._id.toString()] = g;
            });

            ledgers.forEach(l => {
                const groupKey = l.group?.toString();
                if (groupKey && groupMap[groupKey]) {
                    groupMap[groupKey].ledgers.push(l);
                }
            });

            const rootGroups = [];
            groups.forEach(g => {
                const parentKey = g.parentGroup?.toString();
                if (parentKey && groupMap[parentKey]) {
                    groupMap[parentKey].children.push(g);
                } else {
                    rootGroups.push(g);
                }
            });

            console.log("Tree built successfully. Root groups:", rootGroups.length);
        } catch (e) {
            console.error("Error building tree:", e);
        }

        process.exit();
    }).catch(err => {
        console.error("Connection failed:", err.message);
        process.exit();
    });

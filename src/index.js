const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')


app.get("/totalRecovered", async (req, res)=>{
    const recoverData = await connection.aggregate([
        {
            $group: {
                _id: "total",
                recovered: { $sum: "$recovered"},
                // count: { $sum: 1}
            },
        },
    ]);
    
    res.send({data: recoverData[0]});
})

app.get("/totalActive", async (req, res)=>{
    const activeData = await connection.aggregate([
        {
            $group: {
                _id: "total",
                recovered: {$sum: "$recovered"},
                infected: {$sum: "$infected"},
                // active: {$sum: {$subtract: ["$infected", "$recovered"]}}
            },
        },
    ]);
    // res.send({data: activeData[0]});
    res.send({data: {_id: "total", active:activeData[0].infected- activeData[0].recovered}});
})

app.get("/totalDeath", async (req, res)=>{
    const totalDeathData = await connection.aggregate([
        {
            $group: {
                _id: "total",
                death: {$sum: "$death"}
            }
        }
    ])
    res.send({data: totalDeathData[0]});
})

app.get("/hotspotStates", async (req, res)=>{
    const DataForRate = await connection.aggregate([
        {
            $project: {
                state: "$state",
                rate: { $round : [{ $divide: [{$subtract: ["$infected", "$recovered"]}, "$infected"]}, 5] }
            }, 
        },
        {
            $match: {rate: {$gt: 0.1}}
        }
    ]);
    res.send({data: DataForRate});
})

app.get("/healthyStates", async (req, res)=>{
    const mortalityData = await connection.aggregate([
        {
            $project: {
                state: "$state",
                mortality: {$round: [{$divide:["$death", "$infected"]},5]}
            }
        },
        {
            $match: {mortality: {$lt: 0.005}}
        }
    ])
    res.send({data: mortalityData});
})

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;